import datetime
import hashlib
import json
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import time

ROOT = Path('/home/public/wyatt-desktop/.cache/codex/umbrafox-hybrid-arm-20261019-candidate1')
CONTROL = Path('/tmp/codex/umbra-egl-vsync-20261019/control')
HOME = '/home/wyatt'
MB = HOME + '/.mozbuild'
TC = HOME + '/.rustup/toolchains/stable-x86_64-unknown-linux-gnu'
STEPS = {
    'configure': (600, ['./mach', 'configure']),
    'build': (10800, ['./mach', 'build', '-j2', '--verbose', '--priority', 'less']),
    'package': (1800, ['nice', '-n', '10', './mach', 'package']),
    'native-test-compile': (600, ['nice', '-n', '10', 'make', '-C', str(ROOT/'obj/widget/tests/gtest'), '-j2', 'Unified_cpp_widget_tests_gtest0.o']),
}
step = sys.argv[1]
attempt = sys.argv[2]
freeze_name = sys.argv[3]
assert Path(freeze_name).name == freeze_name and freeze_name.startswith('source-freeze') and freeze_name.endswith('.json')
limit, command = STEPS[step]
env = dict(HOME=HOME, USER='wyatt', LOGNAME='wyatt', SHELL='/bin/bash',
           LANG='C.UTF-8', LC_ALL='C.UTF-8',
           PATH=f'{TC}/bin:{MB}/clang/bin:{MB}/cbindgen:{MB}/nasm:{MB}/node/bin:/usr/bin:/bin',
           MOZBUILD_STATE_PATH=MB, MOZCONFIG=str(ROOT / 'mozconfig'),
           MOZ_BUILD_DATE='20261019185219', MOZ_MAKE_FLAGS='-j2',
           CARGO_BUILD_JOBS='2', CARGO_INCREMENTAL='0')

def pin(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1048576), b''):
            h.update(block)
    return h.hexdigest()

def check_control():
    if CONTROL.read_text().strip() != 'OK':
        raise RuntimeError('control is not OK')

def resources():
    memory = dict(line.split(':', 1) for line in Path('/proc/meminfo').read_text().splitlines())
    return dict(availableMemoryBytes=int(memory['MemAvailable'].split()[0])*1024,
                freeDiskBytes=shutil.disk_usage(ROOT).free)

def check_resources():
    r = resources()
    if r['availableMemoryBytes'] < 8 * 1024**3 or r['freeDiskBytes'] < 32 * 1024**3:
        raise RuntimeError(f'resource floor reached: {r}')
    return r

check_control()
before = check_resources()
freeze_path = ROOT / 'evidence' / freeze_name
freeze = json.loads(freeze_path.read_text())
for path, info in freeze['ownedFiles'].items():
    assert pin(ROOT / 'source' / path) == info['sha256'], path
if step != 'configure':
    prerequisite = 'configure' if step in ('build', 'native-test-compile') else 'build'
    receipts = sorted((ROOT/'evidence').glob(f'{prerequisite}-*-exit.json'))
    assert receipts and any(
        (r := json.loads(p.read_text())).get('returncode') == 0
        and r.get('error') is None and r.get('residualProcessGroup') is False
        and r.get('sourceFreezeSHA256') == pin(freeze_path)
        and r.get('mozconfigSHA256') == pin(ROOT/'mozconfig') for p in receipts)
prefix = ROOT / 'evidence' / f'{step}-{attempt}'
receipt = dict(kind='hybrid-build-step', version=1, step=step, argv=command,
               cwd=str(ROOT/'source'), env=env, deadlineSeconds=limit,
               processGroupPolicy='TERM then 30s; no SIGKILL',
               sourceFreezeSHA256=pin(freeze_path), sourceFreezePath=str(freeze_path),
               runnerSHA256=pin(Path(__file__)), mozconfigSHA256=pin(ROOT/'mozconfig'),
               utcStart=datetime.datetime.now(datetime.timezone.utc).isoformat(), resourcesBefore=before)
with Path(str(prefix)+'-attempt.json').open('x') as out:
    json.dump(receipt, out, indent=2, sort_keys=True)
    out.flush()
    os.fsync(out.fileno())
started = time.monotonic()
error = None
with Path(str(prefix)+'.log').open('xb') as log:
    child = subprocess.Popen(command, cwd=ROOT/'source', env=env, stdin=subprocess.DEVNULL,
                             stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
    try:
        while child.poll() is None:
            check_control()
            check_resources()
            if time.monotonic()-started > limit:
                raise TimeoutError(f'{step} deadline')
            time.sleep(3)
    except BaseException as exc:
        error = repr(exc)
        os.killpg(child.pid, signal.SIGTERM)
        try:
            child.wait(timeout=30)
        except subprocess.TimeoutExpired:
            error += '; group did not exit after TERM'
try:
    os.killpg(child.pid, 0)
    residual = True
except ProcessLookupError:
    residual = False
receipt.update(returncode=child.poll(), elapsedSeconds=time.monotonic()-started,
               error=error, residualProcessGroup=residual, resourcesAfter=resources(),
               logSHA256=pin(Path(str(prefix)+'.log')))
with Path(str(prefix)+'-exit.json').open('x') as out:
    json.dump(receipt, out, indent=2, sort_keys=True)
print(json.dumps(receipt, sort_keys=True))
sys.exit(0 if child.returncode == 0 and not error and not residual else 1)
