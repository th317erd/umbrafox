#!/usr/bin/env bash
set -euo pipefail

interval="${1:-60}"
samples="${2:-0}"
output="${3:-artifacts/umbrafox-live-$(date +%Y%m%d-%H%M%S).log}"
bin="${UMBRAFOX_BIN:-/home/wyatt/Programs/umbrafox-nightly/umbrafox}"
profile="${UMBRAFOX_PROFILE:-/home/wyatt/.config/umbrafox/umbrafox/kvm20oct.default-default-1}"

mkdir -p "$(dirname "$output")"

sample=0
since="$(date -Is)"

while :; do
  now="$(date -Is)"
  {
    printf '\n=== Umbrafox diagnostic sample %s at %s ===\n' "$sample" "$now"
    uptime
    free -h
    vmstat 1 2

    echo "--- processes"
    ps -eo pid,ppid,stat,pcpu,pmem,rss,vsz,etime,comm,args |
      awk -v bin="$bin" '$9 != "awk" && index($0, bin) { print }'

    echo "--- process memory"
    while read -r pid _; do
      [ -n "$pid" ] || continue
      [ -r "/proc/$pid/status" ] || continue
      echo "PID=$pid"
      awk '/^Name:|^State:|^PPid:|^VmPeak:|^VmSize:|^VmHWM:|^VmRSS:|^RssAnon:|^VmData:|^VmSwap:|^Threads:|^voluntary_ctxt_switches:|^nonvoluntary_ctxt_switches:/ { print }' "/proc/$pid/status"
      if [ -r "/proc/$pid/smaps_rollup" ]; then
        awk '/^Rss:|^Pss:|^Pss_Dirty:|^Private_Dirty:|^Swap:|^SwapPss:/ { print }' "/proc/$pid/smaps_rollup"
      fi
      if [ -d "/proc/$pid/fd" ]; then
        printf 'FDCount:\t%s\n' "$(find "/proc/$pid/fd" -maxdepth 1 -type l 2>/dev/null | wc -l)"
      fi
    done < <(
      ps -eo pid=,comm=,args= |
        awk -v bin="$bin" '$2 != "awk" && index($0, bin) { print $1 }'
    )

    echo "--- recent journal counts"
    journal_status=0
    journalctl --user --since "$since" --until "$now" --no-pager -o short-iso |
      awk '
        /@vite\/client|localhost:3030/ { vite++ }
        /console.error: "out of memory"/ { oom++ }
        /JavaScript error/ { js++ }
        /umbrafox|Umbrafox/ { umbrafox++ }
        /crash|Crash|permahang|hang|Killed process|OOM|out of memory/ {
          if (sampled < 25) {
            sampled_lines[++sampled] = $0
          }
        }
        END {
          print "vite_or_localhost_lines=" (vite + 0)
          print "js_error_lines=" (js + 0)
          print "out_of_memory_lines=" (oom + 0)
          print "umbrafox_lines=" (umbrafox + 0)
          for (i = 1; i <= sampled; i++) {
            print sampled_lines[i]
          }
        }' || journal_status=$?
    if [ "$journal_status" -ne 0 ]; then
      printf 'journalctl_status=%s\n' "$journal_status"
    fi

    echo "--- crash artifacts"
    crash_paths=()
    for crash_path in \
      "$profile/minidumps" \
      "$profile/crashes" \
      "$HOME/.config/umbrafox/umbrafox/Crash Reports"; do
      if [ -e "$crash_path" ]; then
        crash_paths+=("$crash_path")
      fi
    done
    if [ "${#crash_paths[@]}" -gt 0 ]; then
      find "${crash_paths[@]}" \
        -maxdepth 4 -type f \
        \( -name '*.dmp' -o -name '*.extra' -o -name '*events*' -o -name 'LastCrash' \) \
        -printf '%TY-%Tm-%Td %TH:%TM:%TS %s %p\n' 2>/dev/null |
        sort |
        tail -40 || true
    fi
  } >> "$output" 2>&1

  sample=$((sample + 1))
  since="$now"
  if [ "$samples" -gt 0 ] && [ "$sample" -ge "$samples" ]; then
    break
  fi
  sleep "$interval"
done
