import configparser
import importlib.util
import json
import subprocess
import sys
import tarfile
from pathlib import Path

REPO = Path('/home/wyatt/Projects/umbrafox-workspace/umbrafox')
SOURCE = Path('/home/wyatt/.cache/codex/umbrafox-beta-20261012-nYSBPOWS/source')
OBJ = SOURCE.parent / 'obj'
BASE = 'd43214d6704182dabefff44b772764db04e386f1'
BUILD_ID = '20261015235226'
SPEC = importlib.util.spec_from_file_location(
    'previous_package', REPO / 'exports/umbrafox-beta-20261012/evidence/package_beta.py'
)
previous = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(previous)
common = previous.common

TRACKED_FILES = {
    'browser/components/customkeys/CustomKeys.sys.mjs',
    'browser/components/customkeys/CustomKeysParent.sys.mjs',
    'browser/components/customkeys/content/customkeys-sidebar.mjs',
    'browser/components/customkeys/content/customkeys.js',
    'browser/components/customkeys/tests/browser/browser.toml',
    'browser/locales/en-US/browser/customkeys.ftl',
    'browser/locales/en-US/browser/confirmationHints.ftl',
    'browser/locales/en-US/browser/sitePermissions.ftl',
    'browser/modules/SitePermissions.sys.mjs',
    'browser/modules/moz.build',
    'browser/modules/test/browser/browser.toml',
    'browser/modules/test/unit/xpcshell.toml',
    'dom/base/Document.cpp',
    'dom/base/UmbrafoxUserlandMutation.cpp',
    'dom/base/moz.build',
    'dom/base/nsContentUtils.cpp',
    'dom/base/nsCopySupport.cpp',
    'dom/canvas/gtest/TestCanvasVideoSurfaceCache.cpp',
    'dom/canvas/gtest/TestDMABufReadback.cpp',
    'dom/commandhandler/nsBaseCommandController.cpp',
    'dom/events/test/clipboard/browser.toml',
    'dom/media/AudioStream.h',
    'dom/media/gtest/TestAudioSinkWrapper.cpp',
    'dom/media/mediasink/AudioSink.h',
    'dom/media/mediasink/AudioSinkWrapper.cpp',
    'editor/libeditor/EditorBase.cpp',
    'ipc/ipdl/sync-messages.ini',
    'toolkit/actors/moz.build',
    'toolkit/modules/ActorManagerParent.sys.mjs',
    'toolkit/modules/RemotePageAccessManager.sys.mjs',
    'widget/ClipboardReadRequestParent.cpp',
    'widget/ClipboardReadRequestParent.h',
    'widget/PClipboardReadRequest.ipdl',
    'widget/nsBaseClipboard.cpp',
    'widget/nsClipboardProxy.cpp',
    'widget/nsIClipboard.idl',
}

NEW_FILES = {
    'browser/components/customkeys/tests/browser/browser_ChromePreset.js',
    'browser/modules/UmbrafoxClipboardProtection.sys.mjs',
    'browser/modules/test/browser/browser_UmbrafoxClipboardProtection.js',
    'browser/modules/test/unit/test_UmbrafoxClipboardPermissions.js',
    'browser/modules/test/unit/test_UmbrafoxClipboardProtection.mjs',
    'dom/base/UmbrafoxClipboard.cpp',
    'dom/base/UmbrafoxClipboard.h',
    'dom/events/test/clipboard/browser_umbrafox_clipboard.js',
    'dom/events/test/clipboard/browser_umbrafox_clipboard_override.js',
    'dom/events/test/clipboard/browser_umbrafox_clipboard_safety.js',
    'toolkit/actors/UmbrafoxClipboardChild.sys.mjs',
    'toolkit/actors/UmbrafoxClipboardParent.sys.mjs',
    'toolkit/actors/tests/test_umbrafox_clipboard_bridge.mjs',
}


def git(*arguments):
    return subprocess.run(
        ['git', *arguments], cwd=SOURCE, capture_output=True, check=True, timeout=30
    ).stdout


def source_inputs():
    if git('rev-parse', 'HEAD').decode().strip() != BASE:
        raise ValueError('Unexpected native source base')
    changed = git('diff', '--name-only', '-z', 'HEAD').decode().split('\0')[:-1]
    new = git('ls-files', '--others', '--exclude-standard', '-z').decode().split('\0')[:-1]
    if set(changed) != TRACKED_FILES:
        raise ValueError(f'Unexpected tracked source set: {set(changed) ^ TRACKED_FILES}')
    if set(new) != NEW_FILES:
        raise ValueError(f'Unexpected source supplement: {set(new) ^ NEW_FILES}')
    hashes = {}
    for name in sorted(changed + new):
        common.safe_member(name)
        source = SOURCE / name
        main = REPO / name
        if source.is_symlink() or main.is_symlink():
            raise ValueError(f'Symlink source input: {name}')
        digest = common.file_digest(source)
        if digest != common.file_digest(main):
            raise ValueError(f'Main/build source mismatch: {name}')
        hashes[name] = digest
    return {
        'base': BASE,
        'trackedChanges': changed,
        'newFiles': sorted(new),
        'fileSHA256': hashes,
        'patch': git('diff', '--binary', '--no-ext-diff', 'HEAD'),
    }


def package(archive_path, output):
    if output != output.resolve() or output.exists():
        raise ValueError('Output must be new and canonical')
    inputs = source_inputs()
    original = previous.archive_files(archive_path)
    configuration_bytes = (OBJ / 'config.status.json').read_bytes()
    mozconfig_bytes = (OBJ / '.mozconfig').read_bytes()
    substs = json.loads(configuration_bytes)['substs']
    config = {name: substs.get(name) for name in [
        'MOZ_APP_UA_NAME', 'MOZ_APP_VERSION', 'MOZ_OPTIMIZE', 'MOZ_OPTIMIZE_FLAGS',
        'MOZ_DEBUG', 'MOZ_UMBRA_PERF_PROBES', 'MOZ_UPDATE_CHANNEL', 'TARGET_CPU',
    ]}
    if (config['MOZ_APP_UA_NAME'] != 'Firefox' or config['MOZ_OPTIMIZE'] != '1'
            or config['MOZ_DEBUG'] or config['MOZ_UMBRA_PERF_PROBES']
            or config['TARGET_CPU'] != 'x86_64'):
        raise ValueError('Unexpected prototype configuration')
    output.mkdir(mode=0o700)
    with tarfile.open(archive_path, 'r:xz') as archive:
        archive.extractall(output, filter='data')
    root = output / 'umbrafox'
    if common.tree_snapshot(root) != original:
        raise ValueError('Extraction mismatch')
    root.chmod(0o700)
    overlay = REPO / 'tools/umbrafox/beta/umbrafox-beta.js'
    overlay_bytes = overlay.read_bytes()
    destination = root / 'defaults/pref/umbrafox-beta.js'
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open('xb') as stream:
        stream.write(overlay_bytes)
    destination.chmod(0o644)
    files = common.tree_snapshot(root)
    if set(files) - set(original) != {'defaults/pref/umbrafox-beta.js'}:
        raise ValueError('Unexpected overlay delta')
    if any(files.get(name) != value for name, value in original.items()):
        raise ValueError('Original package changed')
    ids = {}
    for name, section in [('application.ini', 'App'), ('platform.ini', 'Build')]:
        parser = configparser.ConfigParser()
        parser.read(root / name)
        ids[name] = parser.get(section, 'BuildID')
    if set(ids.values()) != {BUILD_ID}:
        raise ValueError(f'BuildID mismatch: {ids}')
    previous.inspect_toolkit_id(root / 'libxul.so', BUILD_ID)
    result_archive = output / f'umbrafox-clipboard-{BUILD_ID}-linux-x86_64.tar.xz'
    with tarfile.open(result_archive, 'x:xz', preset=3) as archive:
        archive.add(root, arcname='umbrafox')
    if previous.archive_files(result_archive) != files:
        raise ValueError('Final archive mismatch')
    if source_inputs() != inputs:
        raise ValueError('Source changed during packaging')
    with tarfile.open(output / 'source-supplement.tar', 'x') as supplement:
        for name in inputs['newFiles']:
            supplement.add(SOURCE / name, arcname=name, recursive=False)
    with tarfile.open(output / 'source-supplement.tar', 'r:') as supplement:
        seen = set()
        for member in supplement:
            if (member.name not in inputs['newFiles'] or member.name in seen
                    or not member.isfile() or not 0 <= member.size <= 1024**2):
                raise ValueError('Invalid source supplement member')
            seen.add(member.name)
            with supplement.extractfile(member) as stream:
                if common.digest(stream.read()) != inputs['fileSHA256'][member.name]:
                    raise ValueError('Source supplement bytes changed')
        if seen != set(inputs['newFiles']):
            raise ValueError('Incomplete source supplement')
    if (source_inputs() != inputs
            or (OBJ / 'config.status.json').read_bytes() != configuration_bytes
            or (OBJ / '.mozconfig').read_bytes() != mozconfig_bytes):
        raise ValueError('Source or configuration changed during export')
    (output / 'source.patch').write_bytes(inputs.pop('patch'))
    (output / 'source-inputs.json').write_text(json.dumps(inputs, indent=2) + '\n')
    (output / 'mozconfig').write_bytes(mozconfig_bytes)
    manifest = {
        'version': 1, 'buildID': BUILD_ID, 'experimental': True,
        'sourceRevision': BASE, 'sourceInputs': inputs,
        'sourcePatchSHA256': common.file_digest(output / 'source.patch'),
        'sourceSupplementSHA256': common.file_digest(output / 'source-supplement.tar'),
        'configuration': config,
        'mozconfigSHA256': common.digest(mozconfig_bytes),
        'configStatusSHA256': common.digest(configuration_bytes),
        'baseArchiveSHA256': common.file_digest(archive_path),
        'archive': {'name': result_archive.name, 'size': result_archive.stat().st_size,
                    'sha256': common.file_digest(result_archive)},
        'overlaySHA256': common.digest(overlay_bytes), 'files': files,
        'iniBuildIDs': ids, 'nativeBuildID': BUILD_ID,
    }
    (output / 'package-input.json').write_text(json.dumps(manifest, indent=2) + '\n')
    (output / 'original-files.json').write_text(json.dumps(original, indent=2) + '\n')
    print(json.dumps({key: value for key, value in manifest.items() if key != 'files'}, indent=2))


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise ValueError('Expected mach archive and new output directory')
    package(Path(sys.argv[1]), Path(sys.argv[2]))
