import json
import shutil
import subprocess
import sys
from pathlib import Path

from package_beta import common, inspect_toolkit_id

root = Path(__file__).parent
old = root / 'native-package'
manifest = json.loads((old / 'manifest.json').read_text())
assert common.tree_snapshot(old / 'umbrafox') == manifest['files']
name = sys.argv[1] if len(sys.argv) == 2 else 'native-package-cache-final'
assert name in {'native-package-cache-final', 'native-package-format-final'}
parent = root / name
parent.mkdir(mode=0o700)
target = parent / 'umbrafox'
shutil.copytree(old / 'umbrafox', target)
subprocess.run([
    '/home/wyatt/.mozbuild/clang/bin/llvm-strip', '--strip-debug',
    '-o', str(target / 'gtest/libxul.so'),
    str(root / 'obj/dist/bin/gtest/libxul.so'),
], check=True, timeout=120)
(target / 'gtest/libxul.so').chmod(0o755)
inspect_toolkit_id(target / 'gtest/libxul.so', manifest['buildID'])
files = common.tree_snapshot(target)
assert set(files) == set(manifest['files'])
for name, expected in manifest['files'].items():
    if name != 'gtest/libxul.so':
        assert files[name] == expected, name
patch = subprocess.run([
    'git', 'diff', '--binary', 'HEAD', '--',
    'dom/canvas/gtest/TestCanvasVideoSurfaceCache.cpp',
], cwd=root / 'source', check=True, capture_output=True, timeout=10).stdout
(parent / 'test-only.patch').write_bytes(patch)
manifest.update(files=files, testPatchSHA256=common.digest(patch))
(parent / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({'files': len(files), 'buildID': manifest['buildID'],
                  'testPatchSHA256': manifest['testPatchSHA256']}))
