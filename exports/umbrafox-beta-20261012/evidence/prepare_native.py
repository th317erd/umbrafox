import json
import shutil
import subprocess
from pathlib import Path

from package_beta import common, inspect_toolkit_id

root = Path(__file__).parent
export = Path('/home/wyatt/Projects/umbrafox-workspace/umbrafox/exports/umbrafox-beta-20261012')
manifest = json.loads((export / 'package-input.json').read_text())
if common.tree_snapshot(export / 'umbrafox') != manifest['files']:
    raise ValueError('Input package drift')
parent = root / 'native-package'
parent.mkdir(mode=0o700)
target = parent / 'umbrafox'
shutil.copytree(export / 'umbrafox', target)
(target / 'gtest').mkdir(mode=0o755)
subprocess.run([
    '/home/wyatt/.mozbuild/clang/bin/llvm-strip', '--strip-debug',
    '-o', str(target / 'gtest/libxul.so'),
    str(root / 'obj/dist/bin/gtest/libxul.so'),
], check=True, timeout=120)
(target / 'gtest/libxul.so').chmod(0o755)
shutil.copyfile(root / 'obj/dist/bin/dependentlibs.list.gtest', target / 'dependentlibs.list.gtest')
(target / 'dependentlibs.list.gtest').chmod(0o644)
inspect_toolkit_id(target / 'gtest/libxul.so', manifest['buildID'])
files = common.tree_snapshot(target)
for name, expected in manifest['files'].items():
    if files[name] != expected:
        raise ValueError(f'Normal package changed: {name}')
if set(files) - set(manifest['files']) != {'gtest/libxul.so', 'dependentlibs.list.gtest'}:
    raise ValueError('Unexpected native test delta')
result = {'files': files, 'buildID': manifest['buildID'], 'diagnosticOnly': True}
(parent / 'manifest.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'files': len(files), 'bytes': sum(value['size'] for value in files.values()), 'buildID': manifest['buildID']}))
