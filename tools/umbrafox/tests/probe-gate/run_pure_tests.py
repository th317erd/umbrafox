#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

"""Compile isolated source-region fixtures, not WebRender or Gecko integration."""

import argparse
import hashlib
import json
import subprocess
from pathlib import Path

from test_contract import CFG, ROOT, WR, feature_regions, item_end, source


def method(text, name):
    start = text.index("fn " + name + "(")
    return CFG + "\n" + text[start : item_end(text, start)]


def region(text, call):
    position = text.index(call)
    matches = [
        (start, end) for start, end in feature_regions(text) if start <= position < end
    ]
    if not matches:
        raise AssertionError(f"missing whole-expression cfg: {call}")
    start, end = min(matches, key=lambda span: span[1] - span[0])
    return text[start:end]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--bus", type=Path, required=True)
    args = parser.parse_args()
    output = args.output.resolve()
    if output == ROOT or ROOT in output.parents:
        parser.error("generated artifacts must be outside the source tree")

    def check_bus():
        message = args.bus.read_text().strip()
        if message != "OK":
            raise SystemExit(f"control bus: {message}")

    check_bus()
    output.mkdir(parents=True, exist_ok=True)
    renderer = source(WR + "src/renderer/mod.rs")
    composite = source(WR + "src/renderer/composite.rs")
    bindings = source("gfx/webrender_bindings/src/bindings.rs")
    template_path = Path(__file__).with_name("runtime_fixture.rs.in")
    template = template_path.read_text()
    replacements = {
        "SAMPLING_PATH": json.dumps(str(ROOT / WR / "src/renderer/sampling.rs")),
        "METHODS": "\n".join(
            method(renderer, name)
            for name in ("sampling_active", "sampling_inspect", "finish_sampling_trace")
        ),
        "ELIGIBILITY": method(bindings, "umbra_markers_enabled"),
        "CLEAR": region(composite, "self.sampling_composite_clear("),
        "TARGET": region(renderer, "self.sampling_target(TextureSource::TextureCache("),
        "START": region(renderer, "self.begin_sampling_trace(frame,"),
        "PARAMETER": region(composite, "sampling_blend: BlendMode"),
    }
    for key, value in replacements.items():
        token = "/* " + key + " */"
        if template.count(token) != 1:
            raise AssertionError(f"expected one template token: {key}")
        template = template.replace(token, value)
    generated = output / "probe-runtime.rs"
    generated.write_text(template)
    inputs = [
        ROOT / WR / "src/renderer/mod.rs",
        ROOT / WR / "src/renderer/composite.rs",
        ROOT / "gfx/webrender_bindings/src/bindings.rs",
        ROOT / WR / "src/renderer/sampling.rs",
        template_path,
        Path(__file__),
        generated,
    ]
    (output / "pure-inputs.sha256").write_text(
        "".join(
            f"{hashlib.sha256(path.read_bytes()).hexdigest()}  {path}\n"
            for path in inputs
        )
    )
    commands = []
    for mode in ("off", "on"):
        binary = output / f"probe-runtime-{mode}"
        command = [
            "rustc",
            "--edition=2018",
            "--test",
            str(generated),
            "-o",
            str(binary),
        ]
        if mode == "on":
            command += ["--cfg", 'feature="umbra-perf-probes"']
        for phase, command in (("compile", command), ("test", [str(binary)])):
            check_bus()
            commands.append(command)
            (output / "pure-commands.json").write_text(
                json.dumps(commands, indent=2) + "\n"
            )
            with (output / f"pure-{mode}-{phase}.stdout").open("wb") as stdout, (
                output / f"pure-{mode}-{phase}.stderr"
            ).open("wb") as stderr:
                result = subprocess.run(
                    command, stdout=stdout, stderr=stderr, timeout=120, check=False
                )
            check_bus()
            if result.returncode:
                raise SystemExit(
                    f"{mode} {phase} failed ({result.returncode}); see {output}"
                )
        print(f"{mode}: pure source-region compile and tests passed")


if __name__ == "__main__":
    main()
