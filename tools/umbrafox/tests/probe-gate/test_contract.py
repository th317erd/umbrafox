#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

"""Source contracts, not a Rust parser or proof of compiled release exclusion."""

import ast
import re
import unittest
from pathlib import Path

import tomllib

ROOT = Path(__file__).resolve().parents[4]
WR = "gfx/wr/webrender/"
FEATURE = "umbra-perf-probes"
CFG = '#[cfg(feature = "umbra-perf-probes")]'
HOOK_FILES = [
    "renderer/mod.rs",
    "renderer/init.rs",
    "renderer/composite.rs",
    "renderer/gpu_buffer.rs",
    "renderer/shade.rs",
    "tile_cache/mod.rs",
    "gpu_types.rs",
    "transform.rs",
    "profiler.rs",
]
LABELS = [
    "WR RGB promotion",
    "WR RGB promotion truncated",
    "WR RGB no-rect-AA",
    "WR promotion counters",
    "WR picture target",
    "WR picture target truncated",
    "WR sampling operands",
]


def source(path):
    return (ROOT / path).read_text()


def mask_literals(text):
    pattern = r'//[^\n]*|/\*[\s\S]*?\*/|"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])\''
    return re.sub(pattern, lambda match: re.sub(r"[^\n]", " ", match[0]), text)


def item_end(text, start):
    masked = mask_literals(text[start:])
    declaration = masked.lstrip().startswith("let ")
    stack = []
    for index in range(len(masked)):
        char = masked[index]
        if char in "([{":
            stack.append(char)
        elif char in ")]}":
            if not stack:
                raise AssertionError("unbalanced source contract item")
            opener = stack.pop()
            if {"(": ")", "[": "]", "{": "}"}[opener] != char:
                raise AssertionError("mismatched source contract delimiters")
            if char == "}" and not stack and not declaration:
                if re.match(r"\s*else\b", masked[index + 1 :]):
                    continue
                return start + index + 1
        elif char in ",;" and not stack:
            return start + index + 1
    raise AssertionError("unterminated source contract item")


def feature_regions(text):
    return [
        (match.start(), item_end(text, match.end()))
        for match in re.finditer(re.escape(CFG), text)
    ]


def without_probes(text):
    output = []
    previous = 0
    for start, end in feature_regions(text):
        if start < previous:
            continue
        output.append(text[previous:start])
        previous = end
    output.append(text[previous:])
    return "".join(output)


class ScannerTests(unittest.TestCase):
    def test_nested_arguments_and_string_braces(self):
        text = CFG + '\nif ready() { emit(format!("{x}", factory())); }\nkeep();'
        self.assertEqual(without_probes(text), "\nkeep();")

    def test_fields_parameters_and_nested_guards(self):
        text = (
            CFG
            + "\nfield: Option<Trace>,\n"
            + CFG
            + "\nfn f() {\n"
            + CFG
            + "\ncall();\n}\nkeep();"
        )
        self.assertEqual(without_probes(text), "\n\nkeep();")

    def test_unguarded_factory_remains_visible(self):
        text = "let eager = factory();\n" + CFG + "\nif ready() { emit(eager); }"
        self.assertIn("factory()", without_probes(text))

    def test_prior_raw_string_and_let_else(self):
        prefix = 'let raw = r#"a " quote"#;\n'
        text = (
            prefix
            + CFG
            + "\nlet probe = if ready() { Some(factory()) } else { None };\nkeep();"
        )
        self.assertEqual(without_probes(text), prefix + "\nkeep();")


class BuildContracts(unittest.TestCase):
    def test_configure_default_off(self):
        tree = ast.parse(source("toolkit/moz.configure"))
        options = [
            node
            for node in tree.body
            if isinstance(node, ast.Expr)
            and isinstance(node.value, ast.Call)
            and isinstance(node.value.func, ast.Name)
            and node.value.func.id == "option"
            and node.value.args
            and isinstance(node.value.args[0], ast.Constant)
            and node.value.args[0].value == "--enable-umbra-perf-probes"
        ]
        self.assertEqual(len(options), 1)
        self.assertFalse(
            any(
                keyword.arg == "default" and ast.literal_eval(keyword.value)
                for keyword in options[0].value.keywords
            )
        )
        functions = [
            node
            for node in tree.body
            if isinstance(node, ast.FunctionDef) and node.name == "umbra_perf_probes"
        ]
        self.assertEqual(len(functions), 1)
        function = functions[0]
        self.assertEqual(
            ast.unparse(function.decorator_list[0]),
            "depends('--enable-umbra-perf-probes')",
        )
        function.decorator_list = []
        namespace = {}
        exec(
            compile(
                ast.Module(body=[function], type_ignores=[]),
                "<configure contract>",
                "exec",
            ),
            namespace,
        )
        self.assertIsNone(namespace["umbra_perf_probes"](()))
        self.assertTrue(namespace["umbra_perf_probes"]((True,)))
        for setter in ("set_config", "set_define"):
            self.assertIn(
                f'{setter}("MOZ_UMBRA_PERF_PROBES", umbra_perf_probes)',
                source("toolkit/moz.configure"),
            )

    def test_cargo_forwarding_and_defaults(self):
        expected = {
            "toolkit/library/rust/shared/Cargo.toml": (
                "umbra_perf_probes",
                ["webrender_bindings/umbra-perf-probes"],
            ),
            "gfx/webrender_bindings/Cargo.toml": (
                FEATURE,
                ["webrender/umbra-perf-probes"],
            ),
            WR + "Cargo.toml": (FEATURE, []),
            "gfx/wr/wrench/Cargo.toml": (FEATURE, ["webrender/umbra-perf-probes"]),
        }
        for path, (key, edges) in expected.items():
            with self.subTest(path=path):
                data = tomllib.loads(source(path))
                self.assertEqual(data["features"].get(key), edges)
                for name, values in data["features"].items():
                    if name != key:
                        self.assertFalse(any("umbra" in value for value in values))
                for dependency in data.get("dependencies", {}).values():
                    if isinstance(dependency, dict):
                        self.assertNotIn(FEATURE, dependency.get("features", []))

    def test_mozbuild_selection(self):
        text = source("toolkit/library/rust/gkrust-features.mozbuild")
        self.assertIn(
            'if CONFIG["MOZ_UMBRA_PERF_PROBES"]:\n    gkrust_features += ["umbra_perf_probes"]',
            text,
        )
        self.assertLess(
            text.index('CONFIG["MOZ_UMBRA_PERF_PROBES"]'),
            text.index("gkrust-shared/%s"),
        )
        self.assertIn(
            'include("../../rust/gkrust-features.mozbuild")',
            source("toolkit/library/gtest/rust/moz.build"),
        )


class ProbeContracts(unittest.TestCase):
    def test_off_view_removes_custom_code(self):
        forbidden = re.compile(
            r"\b(?:sampling_(?:search|trace|active|inspect|marker|task_source|rgb_pattern|quad_draw|texture_metadata|composite_\w+|target|clear|block|bits|words|index|blend)|begin_sampling_trace|finish_sampling_trace|snapshot_sampling_\w+|profiled_rgb_\w+|NEXT_PROFILED_RGB_UPDATE|profiled_target|umbra_markers_enabled)\b"
        )
        for path in HOOK_FILES + ["../../webrender_bindings/src/bindings.rs"]:
            full_path = WR + "src/" + path
            if path.startswith("../"):
                full_path = "gfx/webrender_bindings/src/bindings.rs"
            with self.subTest(path=path):
                text = without_probes(source(full_path))
                self.assertIsNone(forbidden.search(text))
                self.assertNotIn("mod sampling;", text)
                for label in LABELS:
                    self.assertNotIn('"' + label + '"', text)

    def test_shared_behavior_and_counters_survive(self):
        renderer = without_probes(source(WR + "src/renderer/mod.rs"))
        for value in (
            "NumDrawCalls",
            "NumPictureCacheInvalidated",
            "self.profile.inc(profiler::RENDERED_PICTURE_TILES)",
        ):
            self.assertIn(value, renderer)
        tile = without_probes(source(WR + "src/tile_cache/mod.rs"))
        for value in (
            "NEXT_TILE_ID",
            "report_promotion_failure",
            "COMPOSITOR_SURFACE_OVERLAYS",
            "COMPOSITOR_SURFACE_UNDERLAYS",
            "COMPOSITOR_SURFACE_BLITS",
        ):
            self.assertIn(value, tile)
        for path, values in {
            "renderer/init.rs": [
                "enable_single_image_opacity: false",
                "options.enable_single_image_opacity",
            ],
            "renderer/shade.rs": [
                "rgba_no_rect_aa",
                "EXPERIMENTAL_NO_RECT_AA",
                '"NO_RECT_AA"',
            ],
            "renderer/composite.rs": ["EXPERIMENTAL_NO_RECT_AA", "modulation"],
        }.items():
            for value in values:
                self.assertIn(value, without_probes(source(WR + "src/" + path)))

    def test_custom_predicate_not_upstream_predicate(self):
        text = source("gfx/webrender_bindings/src/bindings.rs")
        self.assertTrue(
            "fn umbra_markers_enabled" in text, "missing custom-only marker predicate"
        )
        start = text.index("fn umbra_markers_enabled")
        method = text[start : item_end(text, start)]
        self.assertIn("self.thread_is_being_profiled()", method)
        self.assertIn(
            "gecko_profiler::current_thread_is_being_profiled_for_markers()", method
        )
        self.assertIn("unsafe { gecko_profiler_thread_is_being_profiled() }", text)

    def test_draw_argument_factories_are_runtime_guarded(self):
        for path in ("renderer/mod.rs", "renderer/composite.rs"):
            text = source(WR + "src/" + path)
            regions = feature_regions(text)
            for call in re.finditer(
                r"self\.sampling_(?:quad_draw|composite_(?:input|draw|pass|clear)|target|clear)\(",
                text,
            ):
                enclosing = [
                    text[start:end]
                    for start, end in regions
                    if start <= call.start() < end
                ]
                self.assertTrue(enclosing, call[0])
                self.assertTrue(
                    any(
                        "if self.sampling_active()" in region[: region.index(call[0])]
                        for region in enclosing
                    ),
                    call[0],
                )

    def test_inactive_trace_cleanup_and_end_guard(self):
        text = source(WR + "src/renderer/mod.rs")
        start = text.index("fn sampling_active")
        active = text[start : item_end(text, start)]
        self.assertIn("&mut self", active)
        self.assertIn("self.sampling_trace = None", active)
        start = text.index("fn finish_sampling_trace")
        finish = text[start : item_end(text, start)]
        self.assertLess(
            finish.index("self.sampling_trace.take()"),
            finish.index("umbra_markers_enabled()"),
        )
        self.assertLess(
            finish.index("umbra_markers_enabled()"), finish.index("format!(")
        )

    def test_metadata_consumers_recheck_discarded_trace(self):
        text = source(WR + "src/renderer/mod.rs")
        for call in (
            "self.sampling_texture_metadata(source, Some(frame));",
            "for source in textures.colors { self.sampling_texture_metadata(source, Some(frame)); }",
            "for source in textures.colors { self.sampling_texture_metadata(source, None); }",
        ):
            start = text.index(call) + len(call)
            self.assertTrue(
                text[start:]
                .lstrip()
                .startswith("if !self.sampling_active() { return; }")
            )

    def test_private_argument_and_teardown_gates(self):
        text = source(WR + "src/renderer/composite.rs")
        self.assertEqual(
            len([
                1
                for start, end in feature_regions(text)
                if text[start:end]
                .strip()
                .endswith((
                    "sampling_blend: BlendMode,",
                    "BlendMode::None,",
                    "BlendMode::PremultipliedAlpha,",
                ))
            ]),
            3,
        )
        text = source(WR + "src/renderer/mod.rs")
        for name in ("set_debug_flags", "deinit"):
            start = text.index("pub fn " + name)
            body = text[start : item_end(text, start)]
            self.assertIn("self.sampling_trace = None", body)
            self.assertNotIn("self.sampling_trace", without_probes(body))


if __name__ == "__main__":
    unittest.main()
