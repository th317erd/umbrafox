import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

MAIN = Path('/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox')
BUILD = Path('/home/public/wyatt-desktop/.cache/codex/umbrafox-hybrid-arm-20261019-candidate1')
SCRATCH = Path('/tmp/codex/umbra-egl-vsync-20261019')
EXPORT = MAIN/'exports/umbrafox-hybrid-20261019185219'


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


receipt = json.loads((EXPORT/'package-input.json').read_text())
assert receipt['buildID'] == '20261019185219'
assert receipt['installed'] is False and receipt['hardwareExecuted'] is False
assert digest(Path(receipt['archive']['path'])) == receipt['archive']['sha256']
freeze = json.loads((EXPORT/'source-freeze.json').read_text())
for name, pin in freeze['ownedFiles'].items():
    assert digest(MAIN/name) == pin['sha256'], name
    assert digest(BUILD/'source'/name) == pin['sha256'], name
destination = EXPORT/'evidence'
destination.mkdir(mode=0o700)
files = {}


def copy(source, name):
    before = digest(source)
    target = destination/name
    target.parent.mkdir(parents=True, exist_ok=True)
    with source.open('rb') as inp, target.open('xb') as out:
        shutil.copyfileobj(inp, out)
    assert digest(source) == before and digest(target) == before
    files[name] = dict(sha256=before, size=target.stat().st_size)


for name in (
    'source-contract-red.log', 'review-races-red.log',
    'consumer-removal-red.log', 'attachment-red.log', 'attachment-green.log',
    'native-format-6.log', 'python-lint-6.log', 'package-verifier-6-tests.log',
    'build_step6.py', 'verify_package6.py', 'test_verify_package6.py',
):
    copy(SCRATCH/name, name)
for name in (
    'configure-6-attempt.json', 'configure-6-exit.json', 'configure-6.log',
    'build-6-attempt.json', 'build-6-exit.json', 'build-6.log',
    'package-6-attempt.json', 'package-6-exit.json', 'package-6.log',
    'refreeze-6.log', 'verify-6.log',
):
    copy(BUILD/'evidence'/name, name)
for name in (
    'tools/umbrafox/tests/hybrid/test_egl_vsync_source.py',
    'tools/umbrafox/tests/hybrid/test_egl_vsync_controls.py',
    'widget/gtk/WaylandSurface.cpp',
    'gfx/layers/NativeLayerWayland.cpp',
    'gfx/webrender_bindings/RenderCompositorEGL.cpp',
):
    copy(MAIN/name, 'source-contract/'+name)
copy(MAIN/'bot-docs/reports/2026-10-19-egl-child-vsync.md', 'handoff.md')
copy(MAIN/'bot-docs/plans/egl-external-video.md', 'plan.md')
copy(Path(__file__), 'collect_evidence.py')
test_log = destination/'exported-source-checks.log'
with test_log.open('xb') as log:
    result = subprocess.run(
        ['timeout', '10s', sys.executable, '-m', 'unittest', 'discover',
         '-s', str(destination/'source-contract/tools/umbrafox/tests/hybrid'),
         '-p', 'test_egl_vsync_*.py', '-v'],
        stdout=log, stderr=subprocess.STDOUT,
        env=dict(os.environ, PYTHONDONTWRITEBYTECODE='1'), check=True)
files[test_log.name] = dict(sha256=digest(test_log), size=test_log.stat().st_size)
for name, pin in files.items():
    assert digest(destination/name) == pin['sha256'], name
with (destination/'manifest.json').open('x') as out:
    json.dump(dict(version=1, kind='egl-child-vsync-verification-evidence',
                   buildID=receipt['buildID'],
                   packageReceiptSHA256=digest(EXPORT/'package-input.json'),
                   sourceChecksAreRuntimeTests=False,
                   hardwareExecuted=False, files=files), out, indent=2, sort_keys=True)
print(json.dumps(dict(evidence=str(destination), count=len(files))))
