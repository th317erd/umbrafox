import importlib.util
import json
import sys
import tarfile
import tempfile
from pathlib import Path

from package_prototype import common, previous

OLD_EVIDENCE = Path(__file__).resolve().parents[2] / 'umbrafox-beta-20261012/evidence'
sys.path.insert(0, str(OLD_EVIDENCE))
SPEC = importlib.util.spec_from_file_location('previous_install', OLD_EVIDENCE / 'install_beta.py')
previous_install = importlib.util.module_from_spec(SPEC)
try:
    SPEC.loader.exec_module(previous_install)
finally:
    sys.path.remove(str(OLD_EVIDENCE))


def install(export, programs, receipt_path):
    target = programs / 'umbrafox-nightly'
    backup = programs / 'umbrafox-nightly.before-clipboard-20261015'
    if programs != programs.resolve() or backup.exists() or receipt_path.exists():
        raise ValueError('Unexpected destination or existing backup/receipt')
    manifest = json.loads((export / 'package-input.json').read_text())
    archive = export / manifest['archive']['name']
    if archive.parent != export or archive.name != manifest['archive']['name']:
        raise ValueError('Archive must be a direct export child')
    if common.file_digest(archive) != manifest['archive']['sha256']:
        raise ValueError('Archive digest mismatch')
    if previous.archive_files(archive) != manifest['files']:
        raise ValueError('Archive payload mismatch')
    launcher = programs / 'umbrafox'
    launcher_hash = common.file_digest(launcher)
    original = previous_install.directory_stamp(target)
    previous_install.inactive(target)
    stage = Path(tempfile.mkdtemp(prefix='.umbrafox-clipboard-stage-', dir=programs))
    with tarfile.open(archive, 'r:xz') as package:
        package.extractall(stage, filter='data')
    payload = stage / 'umbrafox'
    payload.chmod(0o700)
    previous_install.verify_tree(payload, manifest['files'])
    if previous_install.directory_stamp(target) != original:
        raise ValueError('Target identity changed')
    previous_install.inactive(target)
    if common.file_digest(launcher) != launcher_hash:
        raise ValueError('Launcher changed during staging')
    target.rename(backup)
    try:
        payload.rename(target)
    except BaseException:
        if not target.exists() and previous_install.directory_stamp(backup) == original:
            backup.rename(target)
        raise
    previous_install.verify_tree(target, manifest['files'])
    marker = target / '.purgecaches'
    with marker.open('xb'):
        pass
    marker.chmod(0o600)
    expected = dict(manifest['files'])
    expected['.purgecaches'] = {'size': 0, 'sha256': common.digest(b''), 'mode': 0o600}
    previous_install.verify_tree(target, expected)
    if common.file_digest(launcher) != launcher_hash:
        raise ValueError('Launcher changed')
    receipt = {
        'status': 'installed-inactive', 'target': str(target), 'backup': str(backup),
        'stage': str(stage), 'archiveSHA256': manifest['archive']['sha256'],
        'buildID': manifest['buildID'], 'files': len(expected), 'purgeCaches': True,
        'launcherUnchangedSHA256': launcher_hash, 'profileMappingChanged': False,
        'ownerBrowserRestarted': False, 'activationPending': True,
    }
    with receipt_path.open('x') as stream:
        stream.write(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt))
    return receipt


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise ValueError('Expected verified package export directory')
    install(Path(sys.argv[1]), Path('/home/wyatt/Programs'),
            Path(__file__).parent / 'install-receipt.json')
