import configparser
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import stat
import subprocess
import sys
import tarfile

ROOT = Path('/home/public/wyatt-desktop/.cache/codex/umbrafox-hybrid-arm-20261019-candidate1')
BASE = '9a9057291b5b5dd1c1362a2cc58551990532a6f6'
BUILDID = '20261019063025'
OLD = Path('/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/verify_arm.py')
HELPER = Path('/home/public/wyatt-desktop/.cache/codex/seek-audio-fix-20261014-5oJiex/package_candidate.py')


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


legacy = load('legacy_arm_checks', OLD)
helper = load('legacy_archive_checks', HELPER)
common = helper.common


def snapshot_payload(root):
    return common.tree_snapshot(Path(root).resolve(strict=True))


def check_build_id(application, platform):
    identity = legacy.build_id(application, platform)
    if identity != BUILDID:
        raise ValueError('Not this candidate BuildID')
    return identity


def check_configuration(config):
    legacy.configuration(config)
    if config.get('MOZ_WAYLAND') != '1' or config.get('MOZ_ENABLE_V4L2') != '1':
        raise ValueError('Missing Wayland/V4L2 configuration')


def check_owned(root, pins):
    for name, info in pins.items():
        common.safe_member(name)
        path = root/name
        if not path.is_file() or path.is_symlink():
            raise ValueError(f'Missing/nonregular input: {name}')
        if path.stat().st_size != info['size'] or common.file_digest(path) != info['sha256']:
            raise ValueError(f'Input drift: {name}')


def check_archive_sources(root, archive_path, owned):
    checked = 0
    with tarfile.open(archive_path, 'r:') as archive:
        for entry in archive:
            name = entry.name.rstrip('/')
            common.safe_member(name)
            path = root/name
            if name in owned:
                continue
            if entry.isdir():
                if not path.is_dir() or path.is_symlink():
                    raise ValueError(f'Source directory drift: {name}')
            elif entry.issym():
                if not path.is_symlink() or os.readlink(path) != entry.linkname:
                    raise ValueError(f'Source symlink drift: {name}')
            elif entry.isfile():
                if not path.is_file() or path.is_symlink():
                    raise ValueError(f'Source file unavailable: {name}')
                expected = hashlib.sha256()
                with archive.extractfile(entry) as stream:
                    for block in iter(lambda: stream.read(1048576), b''):
                        expected.update(block)
                info = path.stat()
                if (info.st_size != entry.size or
                    stat.S_IMODE(info.st_mode) != entry.mode & ~0o022 or
                    common.file_digest(path) != expected.hexdigest()):
                    raise ValueError(f'Unmodified source drift: {name}')
                checked += 1
            else:
                raise ValueError(f'Unsupported base entry: {name}')
    return checked


def check_step_receipt(evidence, step, freeze_sha, config_sha):
    for path in sorted(evidence.glob(f'{step}-*-exit.json'), reverse=True):
        receipt = json.loads(path.read_text())
        if (receipt.get('kind') == 'hybrid-build-step' and receipt.get('version') == 1 and
            receipt.get('step') == step and receipt.get('returncode') == 0 and
            receipt.get('error') is None and receipt.get('residualProcessGroup') is False and
            receipt.get('sourceFreezeSHA256') == freeze_sha and
            receipt.get('mozconfigSHA256') == config_sha):
            return path
    raise ValueError(f'No clean {step} receipt for this exact source/config')


def verify(archive_path, output, freeze_sha, freeze_name='source-freeze.json'):
    if Path(freeze_name).name != freeze_name or not freeze_name.startswith('source-freeze') or not freeze_name.endswith('.json'):
        raise ValueError('Invalid freeze name')
    freeze_path = ROOT/'evidence'/freeze_name
    if common.file_digest(freeze_path) != freeze_sha:
        raise ValueError('Freeze drift')
    freeze = json.loads(freeze_path.read_text())
    if freeze['base'] != BASE:
        raise ValueError('Wrong base')
    if common.file_digest(ROOT/'base.tar') != freeze['baseArchive']['sha256']:
        raise ValueError('Base archive drift')
    patch_name = freeze.get('patchFile', 'hybrid-source.patch')
    if Path(patch_name).name != patch_name or not patch_name.endswith('.patch'):
        raise ValueError('Invalid patch name')
    patch_path = ROOT/'evidence'/patch_name
    if common.file_digest(patch_path) != freeze['patch']['sha256']:
        raise ValueError('Source patch drift')
    check_owned(ROOT/'source', freeze['ownedFiles'])
    if output.exists() or output.is_symlink() or archive_path.parent.resolve() != (ROOT/'obj/dist').resolve():
        raise ValueError('Require new destination and exact mach archive')
    config_sha = common.file_digest(ROOT/'mozconfig')
    receipts = [check_step_receipt(ROOT/'evidence', step, freeze_sha, config_sha)
                for step in ['configure', 'build', 'package']]
    unchanged = check_archive_sources(ROOT/'source', ROOT/'base.tar', freeze['ownedFiles'])
    if unchanged != freeze['unchangedArchiveFilesChecked']:
        raise ValueError('Base source inventory mismatch')
    config = json.loads((ROOT/'obj/config.status.json').read_text())['substs']
    check_configuration(config)
    inputs = {str(p):common.file_digest(p) for p in [OLD, HELPER, Path(common.__file__), Path(sys.modules['package_buildid'].__file__), Path(__file__), freeze_path, ROOT/'mozconfig', ROOT/'base.tar', patch_path, ROOT/'obj/config.status.json', *receipts]}
    files = helper.archive_files(archive_path)
    if 'defaults/pref/umbrafox-beta.js' in files:
        raise ValueError('Unexpected overlay')
    archive_sha = common.file_digest(archive_path)
    if snapshot_payload(ROOT/'obj/dist/umbrafox') != files:
        raise ValueError('Mach staging/archive mismatch')
    output.mkdir(mode=0o700, parents=False)
    with tarfile.open(archive_path, 'r:xz') as archive:
        archive.extractall(output, filter='data')
    runtime = output/'umbrafox'
    if snapshot_payload(runtime) != files:
        raise ValueError('Extracted payload mismatch')
    ids = {}
    for name, section in [('application.ini','App'), ('platform.ini','Build')]:
        parser = configparser.ConfigParser()
        parser.read(runtime/name)
        ids[name] = parser.get(section,'BuildID')
    identity = check_build_id(ids['application.ini'], ids['platform.ini'])
    if (ROOT/'obj/buildid.h').read_text() != f'#define MOZ_BUILDID {identity}\n':
        raise ValueError('Generated build ID mismatch')
    helper.inspect_toolkit_id(runtime/'libxul.so', identity)
    elf_files = []
    with (output/'elf-identities.txt').open('x') as evidence:
        for name in files:
            with (runtime/name).open('rb') as stream:
                header = stream.read(64)
            if legacy.elf_header(header):
                elf_files.append(name)
                info = subprocess.run(['/usr/bin/readelf','-h','-d','-n',str(runtime/name)], capture_output=True, text=True, check=True, timeout=10, env={'PATH':'/usr/bin:/bin','LC_ALL':'C'})
                evidence.write(f'FILE {name}\n{info.stdout}\n')
    dependencies = legacy.dependency_names((runtime/'dependentlibs.list').read_text(), files)
    if any(name not in elf_files for name in ['umbrafox','umbrafox-bin','libxul.so',*dependencies]):
        raise ValueError('Required native payload missing')
    jars = {name:common.jar_snapshot(runtime/name) for name in ['omni.ja','browser/omni.ja']}
    check_owned(ROOT/'source', freeze['ownedFiles'])
    if check_archive_sources(ROOT/'source', ROOT/'base.tar', freeze['ownedFiles']) != unchanged:
        raise ValueError('Source inventory drift')
    if any(common.file_digest(Path(p)) != sha for p,sha in inputs.items()):
        raise ValueError('Verifier/input drift')
    destination = output/f'umbrafox-hybrid-{identity}-linux-aarch64.tar.xz'
    with archive_path.open('rb') as source, destination.open('xb') as target:
        shutil.copyfileobj(source,target)
    if common.file_digest(destination) != archive_sha or common.file_digest(archive_path) != archive_sha:
        raise ValueError('Archive drift during export')
    shutil.copyfile(freeze_path, output/'source-freeze.json')
    shutil.copyfile(patch_path, output/'hybrid-source.patch')
    shutil.copyfile(ROOT/'mozconfig', output/'mozconfig')
    result = dict(version=1, kind='experimental-hybrid-package', baseRevision=BASE,
                  sourcePatchSHA256=freeze['patch']['sha256'], sourceFreezeSHA256=freeze_sha,
                  unchangedSourceFilesVerified=unchanged,
                  buildID=identity, iniBuildIDs=ids, nativeBuildID=identity,
                  files=files, elfFiles=elf_files, dependencies=dependencies,
                  frontendArchiveEntries={name:len(value['entries']) for name,value in jars.items()},
                  archive=dict(path=str(destination),size=destination.stat().st_size,sha256=archive_sha),
                  inputs=inputs, featurePref='gfx.webrender.compositor.external-surfaces-in-draw',
                  featureDefault=False, scope='fullscreen opaque identity SDR8 BT709 limited NV12/I420; color representation required',
                  hardwareExecuted=False, installed=False, productionAcceptance=False,
                  limitations=['No Pi lifecycle/color/performance acceptance yet','Default-off experimental optimization','Color-representation protocol and explicit matching modifiers required','create_immed/local attachment is not server import acknowledgment','Native gtest fixtures require execution on a suitable host','No release signing or whole-link diagnostic certification'])
    with (output/'package-input.json').open('x') as out:
        json.dump(result,out,indent=2,sort_keys=True)
    print(json.dumps({k:v for k,v in result.items() if k not in ('files','inputs')},sort_keys=True))


if __name__ == '__main__':
    if len(sys.argv) != 5:
        raise ValueError('Expected mach archive, new export directory, freeze SHA256, freeze filename')
    verify(Path(sys.argv[1]),Path(sys.argv[2]),sys.argv[3],sys.argv[4])
