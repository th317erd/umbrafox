import json
from pathlib import Path

from package_beta import common, archive_files
from install_beta import verify_tree

root = Path(__file__).parent
repo = Path('/home/wyatt/Projects/umbrafox-workspace/umbrafox')
export = repo / 'exports/umbrafox-beta-20261012'
manifest = json.loads((export / 'package-input.json').read_text())
archive = export / manifest['archive']['name']
assert common.file_digest(archive) == manifest['archive']['sha256']
assert archive_files(archive) == manifest['files']
installed = dict(manifest['files'])
installed['.purgecaches'] = {'size': 0, 'sha256': common.digest(b''), 'mode': 0o600}
verify_tree(Path('/home/wyatt/Programs/umbrafox-nightly'), installed)
install = json.loads((root / 'install-receipt.json').read_text())
assert common.file_digest(Path('/home/wyatt/Programs/umbrafox')) == install['launcherUnchangedSHA256']

expected_failures = {
    'VideoOddCompositionMatches': (4023, 2),
    'VideoAlphaCompositionMatches': (28139, 1),
    'VideoSoftwareCompositionMatches': (23638, 1),
    'VideoOddSoftwareCompositionMatches': (159091, 27),
    'VideoAlphaSoftwareCompositionMatches': (12486, 1),
    'SmallAlphaCompositionMatches': (2, 1),
    'SmallSoftwareCompositionMatches': (4, 1),
}
pids = set()
for name in ['native-run', 'native-run-display', 'native-run-cache-final', 'native-run-format-final']:
    receipt = json.loads((root / name / 'receipt.json').read_text())
    assert receipt['cleanup']['status'] == 'clean'
    assert receipt['rootAbsent'] is True
    pids.update([receipt['pid'], receipt['controllerPID']])
final = json.loads((root / 'native-run-format-final/results.json').read_text())
assert final['tests'] == 86 and final['failures'] == 7
failures = {}
passed = 0
for suite in final['testsuites']:
    for case in suite['testsuite']:
        assert case['result'] == 'COMPLETED'
        if case.get('failures'):
            assert suite['name'] == 'DMABufReadback'
            failures[case['name']] = (int(case['differentComponents']), int(case['maximumChannelDelta']))
        else:
            passed += 1
assert failures == expected_failures
assert passed == 79
parity = json.loads((root / 'parity-run/result.json').read_text())
assert parity['status'] == 'pass'
assert len(parity['receipts']) == 2
for receipt in parity['receipts']:
    assert receipt['status'] == 'pass' and receipt['cleanup']['status'] == 'clean'
    pids.add(receipt['pid'])
    if receipt['enabled']:
        assert receipt['nativeRoots']['gpuImport'] is True
        assert receipt['nativeRoots']['opacity'] is True
        assert receipt['nativeRoots']['buildID'] == manifest['buildID']
        assert receipt['profiler']['active'] is False
version = json.loads((root / 'version-run/result.json').read_text())
assert version['status'] == 'pass' and version['rootAbsent'] is True
pids.update([version['pid'], version['identity']['parent']])
for pid in pids:
    assert not Path(f'/proc/{pid}').exists(), pid
for name in ['dom/base/UmbrafoxUserlandMutation.cpp', 'dom/canvas/gtest/TestDMABufReadback.cpp', 'dom/canvas/gtest/TestCanvasVideoSurfaceCache.cpp']:
    assert common.file_digest(repo / name) == common.file_digest(root / 'source' / name)
assert 'MaybeGetScaledSourceSurfaceForRemoteVideo' not in (repo / 'dom/canvas/CanvasRenderingContext2D.cpp').read_text()
assert 'GetAsSourceSurface()' in (repo / 'dom/canvas/CanvasRenderingContext2D.cpp').read_text()
result = {'status': 'pass-with-retained-native-failures', 'nativePassed': passed,
          'retainedFailures': failures, 'observedPIDsAbsent': sorted(pids),
          'archiveSHA256': manifest['archive']['sha256'],
          'installedFileCountWithMarker': len(installed),
          'profileAndLauncherUnchanged': True, 'normalBrowserParity': 'same-build-only'}
with (root / 'final-proof.json').open('x') as stream:
    stream.write(json.dumps(result, indent=2) + '\n')
print(json.dumps(result))
