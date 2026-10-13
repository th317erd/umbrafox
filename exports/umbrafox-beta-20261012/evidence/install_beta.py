import json
import os
import stat
import subprocess
import tarfile
import tempfile
from pathlib import Path

from package_beta import archive_files, common


def directory_stamp(path):
    info = path.lstat()
    if (path != path.resolve() or not stat.S_ISDIR(info.st_mode)
            or info.st_uid != os.getuid() or stat.S_IMODE(info.st_mode) != 0o700):
        raise ValueError('Expected canonical owned private directory')
    return [info.st_dev, info.st_ino, info.st_uid, stat.S_IMODE(info.st_mode)]


def inactive(target, proc=Path('/proc')):
    matches = []
    for entry in proc.iterdir():
        if not entry.name.isdecimal():
            continue
        try:
            if entry.stat().st_uid != os.getuid():
                continue
            try:
                executable = os.readlink(entry / 'exe')
            except PermissionError:
                executable = subprocess.run([
                    'sudo', '-n', 'readlink', '--', str(entry / 'exe'),
                ], capture_output=True, check=True, text=True, timeout=2).stdout.rstrip('\n')
                if not executable.startswith('/'):
                    raise ValueError('Missing privileged executable identity')
        except FileNotFoundError:
            continue
        if executable.startswith(str(target) + '/'):
            matches.append(int(entry.name))
    if matches:
        raise ValueError(f'Target installation is active: {matches}')
    return matches


def verify_tree(root, files):
    if common.tree_snapshot(root) != files:
        raise ValueError('Package file inventory mismatch')


def install():
    root = Path(__file__).parent
    export = Path('/home/wyatt/Projects/umbrafox-workspace/umbrafox/exports/umbrafox-beta-20261012')
    programs = Path('/home/wyatt/Programs')
    target = programs / 'umbrafox-nightly'
    backup = programs / 'umbrafox-nightly.before-beta-20261012-202039'
    if programs != programs.resolve() or backup.exists():
        raise ValueError('Unexpected destination or existing backup')
    manifest = json.loads((export / 'package-input.json').read_text())
    archive = export / manifest['archive']['name']
    if common.file_digest(archive) != manifest['archive']['sha256']:
        raise ValueError('Archive digest mismatch')
    if archive_files(archive) != manifest['files']:
        raise ValueError('Archive payload mismatch')
    launcher = programs / 'umbrafox'
    launcher_hash = common.file_digest(launcher)
    original = directory_stamp(target)
    inactive(target)
    stage = Path(tempfile.mkdtemp(prefix='.umbrafox-beta-stage-', dir=programs))
    with tarfile.open(archive, 'r:xz') as package:
        package.extractall(stage, filter='data')
    payload = stage / 'umbrafox'
    payload.chmod(0o700)
    verify_tree(payload, manifest['files'])
    if directory_stamp(target) != original:
        raise ValueError('Target identity changed')
    inactive(target)
    target.rename(backup)
    payload.rename(target)
    verify_tree(target, manifest['files'])
    marker = target / '.purgecaches'
    with marker.open('xb'):
        pass
    marker.chmod(0o600)
    expected = dict(manifest['files'])
    expected['.purgecaches'] = {'size': 0, 'sha256': common.digest(b''), 'mode': 0o600}
    verify_tree(target, expected)
    if common.file_digest(launcher) != launcher_hash:
        raise ValueError('Launcher changed')
    result = {'status': 'installed-separately', 'target': str(target),
              'backup': str(backup), 'stage': str(stage),
              'archiveSHA256': manifest['archive']['sha256'],
              'buildID': manifest['buildID'], 'files': len(expected),
              'purgeCaches': True, 'launcherUnchangedSHA256': launcher_hash,
              'profileMappingChanged': False, 'ownerBrowserRestarted': False}
    with (root / 'install-receipt.json').open('x') as stream:
        stream.write(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))


if __name__ == '__main__':
    install()
