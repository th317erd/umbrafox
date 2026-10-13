import json
import shutil
from pathlib import Path

from package_beta import common

root = Path(__file__).parent
repo = Path('/home/wyatt/Projects/umbrafox-workspace/umbrafox')
export = repo / 'exports/umbrafox-beta-20261012'
destination = export / 'evidence'
destination.mkdir(mode=0o700)
names = [path.name for path in root.glob('*.log')]
names += [
    'package_beta.py', 'package_spec.py', 'prepare_native.py', 'refresh_native.py',
    'native-contract.mjs', 'native-contract-spec.mjs', 'run-native-no-display.mjs',
    'run-native.mjs', 'beta-parity.mjs', 'install_beta.py', 'install_spec.py',
    'version.mjs', 'final_proof.py', 'collect_evidence.py',
    'install-receipt.json', 'final-proof.json', 'version-run/result.json',
    'parity-run/result.json', 'parity-run/off/browser.log', 'parity-run/on/browser.log',
    'native-package/manifest.json', 'native-package-cache-final/manifest.json',
    'native-package-cache-final/test-only.patch', 'native-package-format-final/manifest.json',
    'native-package-format-final/test-only.patch',
]
for run in ['native-run', 'native-run-display', 'native-run-cache-final', 'native-run-format-final']:
    names += [f'{run}/{name}' for name in ['receipt.json', 'results.json', 'gtest.log']]
for name in sorted(names):
    source = root / name
    assert source.is_file() and not source.is_symlink()
    assert source.stat().st_size < 2 * 1024**2
    target = destination / name
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, target)
shutil.copyfile(repo / 'bot-docs/reports/performance/2026-10-12-opt-in-beta.md', export / 'BUILD-REPORT.md')
files = common.tree_snapshot(destination)
assert sum(value['size'] for value in files.values()) < 8 * 1024**2
seal = {name: value['sha256'] for name, value in files.items()}
for name in ['package-input.json', 'original-files.json', 'source.patch', 'mozconfig', 'README.md', 'BUILD-REPORT.md']:
    seal[f'../{name}'] = common.file_digest(export / name)
(destination / 'SHA256SUMS').write_text(''.join(f'{digest}  {name}\n' for name, digest in sorted(seal.items())))
for name, digest in seal.items():
    assert common.file_digest(destination / name) == digest
print(json.dumps({'files': len(seal), 'bytes': sum(value['size'] for value in files.values()),
                  'sealSHA256': common.file_digest(destination / 'SHA256SUMS')}))
