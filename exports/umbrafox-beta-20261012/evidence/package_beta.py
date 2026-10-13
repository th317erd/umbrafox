import configparser
import hashlib
import importlib.util
import json
import shutil
import stat
import subprocess
import sys
import tarfile
from pathlib import Path, PurePosixPath

REPO = Path('/home/wyatt/Projects/umbrafox-workspace/umbrafox')
sys.path.insert(0, str(REPO / 'python/mozbuild'))
SPEC = importlib.util.spec_from_file_location('artifact', REPO / 'artifacts/umbralink-control/request-artifact.py')
common = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(common)
sys.path.insert(0, str(REPO / 'artifacts/umbralink-control/producer-fence-native'))
from package_buildid import inspect_toolkit_id


def archive_files(path):
    if not 0 < path.stat().st_size < 512 * 1024**2:
        raise ValueError('Compressed package size cap')
    files, names, total = {}, set(), 0
    with tarfile.open(path, 'r:xz') as archive:
        for member in archive:
            name = member.name.removesuffix('/') if member.isdir() else member.name
            common.safe_member(name)
            if (name in names or PurePosixPath(name).parts[0] != 'umbrafox'
                    or member.mode & ~0o777 or not (member.isdir() or member.isfile())):
                raise ValueError('Unexpected package member')
            if name == 'umbrafox' and not member.isdir():
                raise ValueError('Invalid package root')
            names.add(name)
            if len(names) > 4096:
                raise ValueError('Member cap')
            if member.isdir():
                continue
            total += member.size
            if not 0 <= member.size <= 512 * 1024**2 or total > 1024**3:
                raise ValueError('Expanded package cap')
            with archive.extractfile(member) as stream:
                checksum = hashlib.file_digest(stream, 'sha256').hexdigest()
            files[name.removeprefix('umbrafox/')] = {
                'size': member.size, 'sha256': checksum,
                'mode': stat.S_IMODE(member.mode),
            }
    if not files:
        raise ValueError('Empty package')
    return dict(sorted(files.items()))


def package(source_archive, output):
    if output != output.resolve() or output.exists():
        raise ValueError('Output must be new and canonical')
    original = archive_files(source_archive)
    source_root = Path(__file__).parent / 'source'
    revision = subprocess.run(['git', 'rev-parse', 'HEAD'], cwd=source_root,
                              capture_output=True, check=True, text=True, timeout=10).stdout.strip()
    if revision != 'd43214d6704182dabefff44b772764db04e386f1':
        raise ValueError('Unexpected native base revision')
    source_patch = subprocess.run(['git', 'diff', '--binary', '--no-ext-diff'], cwd=source_root,
                                 capture_output=True, check=True, timeout=10).stdout
    changed = subprocess.run(['git', 'diff', '--name-only'], cwd=source_root,
                             capture_output=True, check=True, text=True, timeout=10).stdout.splitlines()
    if changed != ['dom/base/UmbrafoxUserlandMutation.cpp', 'dom/canvas/gtest/TestDMABufReadback.cpp']:
        raise ValueError('Unexpected native source delta')
    for name in changed:
        if common.file_digest(source_root / name) != common.file_digest(REPO / name):
            raise ValueError('Main/build native source mismatch')
    configured = json.loads((source_root.parent / 'obj/config.status.json').read_text())['substs']
    configuration = {key: configured.get(key) for key in [
        'MOZ_APP_UA_NAME', 'MOZ_APP_VERSION', 'MOZ_OPTIMIZE', 'MOZ_OPTIMIZE_FLAGS',
        'MOZ_DEBUG', 'MOZ_UMBRA_PERF_PROBES', 'MOZ_UPDATE_CHANNEL', 'TARGET_CPU',
    ]}
    if configuration['MOZ_APP_UA_NAME'] != 'Firefox' or configuration['MOZ_OPTIMIZE'] != '1' or configuration['MOZ_UMBRA_PERF_PROBES']:
        raise ValueError('Unexpected beta build configuration')
    output.mkdir(mode=0o700)
    with tarfile.open(source_archive, 'r:xz') as archive:
        archive.extractall(output, filter='data')
    root = output / 'umbrafox'
    if common.tree_snapshot(root) != original:
        raise ValueError('Extracted tree mismatch')
    root.chmod(0o700)
    overlay = REPO / 'tools/umbrafox/beta/umbrafox-beta.js'
    destination = root / 'defaults/pref/umbrafox-beta.js'
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open('xb') as stream:
        stream.write(overlay.read_bytes())
    destination.chmod(0o644)
    current = common.tree_snapshot(root)
    if set(current) - set(original) != {'defaults/pref/umbrafox-beta.js'}:
        raise ValueError('Unexpected beta file delta')
    for name, value in original.items():
        if current.get(name) != value:
            raise ValueError(f'Original payload changed: {name}')
    ids = {}
    for name, section in [('application.ini', 'App'), ('platform.ini', 'Build')]:
        parser = configparser.ConfigParser()
        parser.read(root / name)
        ids[name] = parser.get(section, 'BuildID')
    if len(set(ids.values())) != 1:
        raise ValueError('INI BuildID mismatch')
    build_id = ids['application.ini']
    inspect_toolkit_id(root / 'libxul.so', build_id)
    archive_name = f'umbrafox-beta-{build_id}-linux-x86_64.tar.xz'
    archive_path = output / archive_name
    with tarfile.open(archive_path, 'x:xz', preset=6) as archive:
        archive.add(root, arcname='umbrafox')
    if archive_files(archive_path) != current or common.tree_snapshot(root) != current:
        raise ValueError('Final archive/tree mismatch')
    manifest = {
        'version': 1, 'buildID': build_id, 'experimental': True,
        'sourceRevision': revision,
        'sourcePatchSHA256': common.digest(source_patch),
        'configuration': configuration,
        'mozconfigSHA256': common.file_digest(source_root / 'mozconfig'),
        'baseArchiveSHA256': common.file_digest(source_archive),
        'archive': {'name': archive_name, 'size': archive_path.stat().st_size,
                    'sha256': common.file_digest(archive_path)},
        'overlaySHA256': common.file_digest(overlay),
        'files': current, 'iniBuildIDs': ids, 'nativeBuildID': build_id,
    }
    (output / 'package-input.json').write_text(json.dumps(manifest, indent=2) + '\n')
    (output / 'original-files.json').write_text(json.dumps(original, indent=2) + '\n')
    (output / 'source.patch').write_bytes(source_patch)
    shutil.copyfile(source_root / 'mozconfig', output / 'mozconfig')
    shutil.copyfile(REPO / 'tools/umbrafox/beta/README.md', output / 'README.md')
    print(json.dumps({key: value for key, value in manifest.items() if key != 'files'}, indent=2))


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise ValueError('Expected mach archive and new output directory')
    package(Path(sys.argv[1]), Path(sys.argv[2]))
