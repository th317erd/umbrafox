#!/usr/bin/env python3

from __future__ import annotations

import re
import subprocess
import sys
from collections import deque
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
DOCS = ROOT / "docs" / "umbrafox"
BASE_FILE = DOCS / "reference" / "exception-paths.tsv"
LINK_RE = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")
CASE_RE = re.compile(r'case "(umbrafox\.[^"]+)"')
EXCLUDED_PREFIXES = (
    "bot-docs/",
    "exports/",
    "umbrafox-conversion-guide/",
    "docs/",
    ".codex/",
    ".agents/",
)
EXCLUDED_FILES = {"MEMORY.md", "AGENTS.md", ".gitignore", ".gitattributes"}


def fail(message: str) -> None:
    raise AssertionError(message)


def markdown_links(path: Path) -> list[Path]:
    links = []
    for raw in LINK_RE.findall(path.read_text(encoding="utf-8")):
        target = raw.strip().split(maxsplit=1)[0].strip("<>")
        target = target.split("#", 1)[0]
        if not target or "://" in target or target.startswith(("/", "mailto:")):
            continue
        links.append((path.parent / target).resolve())
    return links


def verify_documents() -> tuple[int, int, int]:
    if not DOCS.is_dir():
        fail("docs/umbrafox is missing")
    for retired in (ROOT / "bot-docs", ROOT / "umbrafox-conversion-guide"):
        if retired.exists():
            fail(f"retired documentation root still exists: {retired.relative_to(ROOT)}")

    pages = sorted(DOCS.rglob("*.md"))
    if not pages:
        fail("Umbrafox documentation corpus is empty")
    broken_links = []
    for page in pages:
        text = page.read_text(encoding="utf-8")
        if not text.strip():
            fail(f"empty documentation page: {page.relative_to(ROOT)}")
        relative = page.relative_to(DOCS)
        if relative.parts[0] == "archive":
            if not re.search(r"^> \*\*(Archived project record|Archive index)\.", text, re.M):
                fail(f"archive authority banner missing: {relative}")
        elif relative.parts[0] == "conversion-guide":
            if "> **Current conversion guidance.**" not in text:
                fail(f"conversion-guide authority banner missing: {relative}")
        else:
            if not text.startswith("---\n") or not re.search(r"^> \*\*Current", text, re.M):
                fail(f"current metadata/banner missing: {relative}")
        for target in markdown_links(page):
            if not target.exists():
                broken_links.append(f"{relative}: {target}")
    if broken_links:
        fail("broken links:\n" + "\n".join(broken_links))

    entry = DOCS / "README.md"
    reachable = {entry.resolve()}
    queue = deque([entry.resolve()])
    while queue:
        page = queue.popleft()
        for target in markdown_links(page):
            if target.suffix.lower() != ".md" or not target.is_relative_to(DOCS):
                continue
            if target not in reachable:
                reachable.add(target)
                queue.append(target)
    unreachable = [page.relative_to(DOCS) for page in pages if page.resolve() not in reachable]
    if unreachable:
        fail("unreachable documentation pages: " + ", ".join(map(str, unreachable)))

    archive = sum(page.is_relative_to(DOCS / "archive") for page in pages)
    conversion = sum(page.is_relative_to(DOCS / "conversion-guide") for page in pages)
    return len(pages), archive, conversion


def git_output(*args: str) -> str:
    return subprocess.run(
        ["git", *args], cwd=ROOT, check=True, text=True, capture_output=True
    ).stdout


def verify_exception_inventory() -> tuple[int, int, int]:
    lines = BASE_FILE.read_text(encoding="utf-8").splitlines()
    base = next(line.split("\t", 1)[1] for line in lines if line.startswith("# base\t"))
    recorded = {
        tuple(line.split("\t", 1))
        for line in lines
        if line and not line.startswith("#") and line != "status\tpath"
    }
    current = set()
    for line in git_output("diff", "--name-status", f"{base}..HEAD").splitlines():
        status, path = line.split("\t", 1)
        if path in EXCLUDED_FILES or (
            path != "docs/config.yml" and path.startswith(EXCLUDED_PREFIXES)
        ):
            continue
        current.add((status, path))
    if recorded != current:
        missing = sorted(current - recorded)
        stale = sorted(recorded - current)
        fail(f"exception inventory drift: missing={missing[:10]} stale={stale[:10]}")
    added = sum(status == "A" for status, _ in recorded)
    modified = sum(status == "M" for status, _ in recorded)
    return len(recorded), added, modified


def verify_umbralink_commands() -> int:
    source = (ROOT / "toolkit/components/umbrafox/UmbrafoxControlService.sys.mjs").read_text(encoding="utf-8")
    documented = (DOCS / "reference/umbralink-protocol.md").read_text(encoding="utf-8")
    methods = sorted(set(CASE_RE.findall(source)))
    omitted = [method for method in methods if f"`{method}`" not in documented]
    if omitted:
        fail("UmbraLink protocol omissions: " + ", ".join(omitted))
    return len(methods)


def main() -> int:
    try:
        pages, archive, conversion = verify_documents()
        paths, added, modified = verify_exception_inventory()
        commands = verify_umbralink_commands()
    except (AssertionError, OSError, subprocess.CalledProcessError, StopIteration, ValueError) as error:
        print(f"FAIL: {error}", file=sys.stderr)
        return 1
    print(f"PASS: {pages} Umbrafox Markdown pages are linked, reachable, and authoritative")
    print(f"PASS: archive={archive} pages; conversion-guide={conversion} pages")
    print(f"PASS: {paths} exception paths match source (added={added}, modified={modified})")
    print(f"PASS: all {commands} UmbraLink dispatcher methods are documented")
    return 0


if __name__ == "__main__":
    sys.exit(main())
