/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import process from "node:process";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rename,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { createServer, request } from "node:http";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";
import {
  browserEnvironment,
  connectControl,
  createBoundedLogger,
  createFixtureServer,
  expectedChecksums,
  parseArgs,
  readIdentity,
  spawnOwned,
  stopOwned,
  summarize,
  validateDiscovery,
  validateResult,
  withTimeout,
} from "../helpers.mjs";
import {
  captureWorkloads,
  checkBus,
  createOutputRoot,
  main,
  readDiscovery,
} from "../run.mjs";
import {
  arithmeticWorkload,
  fillPixels,
  pixelHash,
} from "../fixture/fixture.mjs";

const bounded = { timeout: 10000 };
const applicationPaths = {
  root: "/owned-output",
  appData: "/owned-output/app-data",
  localAppData: "/owned-output/local-app-data",
  tempDir: "/owned-output/temp",
};

async function createTestOutput(prefix) {
  const directory = await mkdtemp(prefix);
  return createOutputRoot(
    join(directory, "output"),
    new AbortController().signal
  );
}

test(
  "application data main boundary rejects original lexical and ancestor aliases before output creation",
  bounded,
  async () => {
    for (const aliasType of ["lexical", "ancestor"]) {
      const directory = await mkdtemp("/tmp/codex/appdata-boundary-");
      const bus = join(directory, "bus");
      await writeFile(bus, "OK\n");
      await symlink(directory, `${directory}-alias`);
      const output =
        aliasType === "lexical"
          ? `${directory}/./output`
          : `${directory}-alias/output`;
      await assert.rejects(
        main([
          "--binary",
          "/definitely-missing-browser",
          "--output",
          output,
          "--profile",
          "off",
          "--bus",
          bus,
        ]),
        /canonical|aliased/i
      );
      await assert.rejects(lstat(join(directory, "output")), {
        code: "ENOENT",
      });
    }
  }
);

test(
  "application data output initialization is exclusive, private and retains its original identity",
  bounded,
  async () => {
    const { createApplicationData } = await import("../run.mjs");
    const directory = await mkdtemp("/tmp/codex/appdata-output-");
    const signal = new AbortController().signal;
    const output = await createOutputRoot(join(directory, "output"), signal);
    const metadata = await lstat(output.root);
    assert.deepEqual(output, {
      root: join(directory, "output"),
      identity: {
        dev: metadata.dev,
        ino: metadata.ino,
        uid: process.getuid(),
        mode: 0o700,
      },
    });
    assert(Object.isFrozen(output));
    assert(Object.isFrozen(output.identity));
    await assert.rejects(createOutputRoot(output.root, signal), {
      code: "EEXIST",
    });
    await writeFile(join(output.root, "preflight.json"), "owned-evidence");
    const evidence = await createApplicationData(output, signal);
    assert.equal(evidence.creation.root, output.identity);
    assert.equal(
      await readFile(join(output.root, "preflight.json"), "utf8"),
      "owned-evidence"
    );
  }
);

test(
  "application data original output replacement before provenance is rejected without creating child roots",
  bounded,
  async () => {
    const { collectProvenance } = await import("../run.mjs");
    const directory = await mkdtemp("/tmp/codex/appdata-output-replace-");
    const signal = new AbortController().signal;
    const output = await createOutputRoot(join(directory, "output"), signal);
    const original = JSON.stringify(output);
    await writeFile(join(output.root, "preflight.json"), "owned-evidence");
    await rename(output.root, `${output.root}-original`);
    await mkdir(output.root, { mode: 0o700 });
    const header = Buffer.alloc(20);
    header.set([0x7f, 0x45, 0x4c, 0x46, 2, 1]);
    header.writeUInt16LE(62, 18);
    const binary = join(directory, "binary");
    await writeFile(binary, header, { mode: 0o700 });
    let writes = 0;
    await assert.rejects(
      collectProvenance(
        { binary, suite: "basic", profile: "off" },
        output,
        signal,
        async () => writes++
      ),
      /identity.*changed/i
    );
    assert.equal(writes, 0);
    assert.deepEqual(await readdir(output.root), []);
    assert.equal(JSON.stringify(output), original);
  }
);

test(
  "application data output initialization rejects existing entries and retains partial creation on abort or proof failure",
  bounded,
  async () => {
    for (const type of ["directory", "file", "symlink", "dangling"]) {
      const directory = await mkdtemp("/tmp/codex/appdata-output-existing-");
      const root = join(directory, "output");
      if (type === "directory") {
        await mkdir(root, { mode: 0o700 });
      } else if (type === "file") {
        await writeFile(root, "preserve");
      } else {
        await symlink(
          type === "symlink" ? directory : join(directory, "missing"),
          root
        );
      }
      const initial = await lstat(root);
      await assert.rejects(
        createOutputRoot(root, new AbortController().signal),
        { code: "EEXIST" }
      );
      assert.equal((await lstat(root)).ino, initial.ino);
    }
    for (const scenario of [
      "abort-before",
      "parent-read",
      "parent-abort",
      "mkdir",
      "mkdir-abort",
      "proof-read",
      "proof-mode",
    ]) {
      const directory = await mkdtemp("/tmp/codex/appdata-output-failure-");
      const root = join(directory, "output");
      const controller = new AbortController();
      const failure = new Error(scenario);
      let created = false;
      if (scenario === "abort-before") {
        controller.abort(failure);
      }
      await assert.rejects(
        createOutputRoot(root, controller.signal, {
          async realpath(path) {
            assert(!controller.signal.aborted);
            if (scenario === "parent-read") {
              throw failure;
            }
            const value = await realpath(path);
            if (scenario === "parent-abort") {
              controller.abort(failure);
            }
            return value;
          },
          async mkdir(path, options) {
            assert(!controller.signal.aborted);
            if (scenario === "mkdir") {
              throw failure;
            }
            await mkdir(path, options);
            created = true;
            if (scenario === "mkdir-abort") {
              controller.abort(failure);
            }
          },
          async lstat(path) {
            assert(!controller.signal.aborted);
            if (scenario === "proof-read") {
              throw failure;
            }
            const value = await lstat(path);
            if (scenario === "proof-mode") {
              value.mode |= 0o020;
            }
            return value;
          },
        }),
        scenario === "proof-mode" ? /owner-private/ : error => error === failure
      );
      assert.equal(
        created,
        ["mkdir-abort", "proof-read", "proof-mode"].includes(scenario)
      );
      if (created) {
        assert((await lstat(root)).isDirectory());
      } else {
        await assert.rejects(lstat(root), { code: "ENOENT" });
      }
    }
  }
);

test(
  "application data overrides are forced for every valid suite and profile mode",
  bounded,
  () => {
    const input = {
      HOME: "/unchanged-home",
      XDG_RUNTIME_DIR: "/unchanged-runtime",
      XDG_DATA_HOME: "/ambient-data",
      MOZ_APP_DATA: "/ambient-app-data",
      MOZ_LOCAL_APP_DATA: "/ambient-local-data",
      TMPDIR: "/ambient-temp-dir",
      TMP: "/ambient-tmp",
      TEMP: "/ambient-temp",
      MOZ_LOG: "ambient-log",
    };
    for (const [suite, profile] of [
      ["basic", "off"],
      ["basic", "on"],
      ["userland-cache", "off"],
      ["lifecycle", "off"],
    ]) {
      const environment = browserEnvironment(
        input,
        profile,
        suite,
        applicationPaths
      );
      assert.equal(environment.env.MOZ_APP_DATA, applicationPaths.appData);
      assert.equal(
        environment.env.MOZ_LOCAL_APP_DATA,
        applicationPaths.localAppData
      );
      assert.equal(environment.env.HOME, input.HOME);
      for (const variable of ["TMPDIR", "TMP", "TEMP"]) {
        assert.equal(environment.env[variable], applicationPaths.tempDir);
        assert(environment.scrubbed.includes(variable));
      }
      assert.equal(environment.env.XDG_RUNTIME_DIR, input.XDG_RUNTIME_DIR);
      assert.equal(environment.env.XDG_DATA_HOME, undefined);
      assert.equal(
        environment.env.MOZ_PROFILER_STARTUP,
        profile === "on" ? "1" : undefined
      );
      assert.equal(
        environment.env.MOZ_LOG,
        suite === "userland-cache" ? "timestamp,sync,ScriptLoader:4" : undefined
      );
      assert(environment.scrubbed.includes("MOZ_APP_DATA"));
      assert(environment.scrubbed.includes("MOZ_LOCAL_APP_DATA"));
      assert(!JSON.stringify(environment).includes("/ambient-"));
    }
    assert.equal(input.MOZ_APP_DATA, "/ambient-app-data");
  }
);

test(
  "application data paths are required and reject relative, aliased, missing and foreign roots",
  bounded,
  () => {
    for (const paths of [
      undefined,
      null,
      {},
      { ...applicationPaths, root: "relative" },
      { ...applicationPaths, root: "/owned-output/../owned-output" },
      { ...applicationPaths, root: "/owned-output/" },
      { ...applicationPaths, appData: undefined },
      { ...applicationPaths, appData: "relative" },
      { ...applicationPaths, appData: "/other/app-data" },
      { ...applicationPaths, appData: "/owned-output/./app-data" },
      { ...applicationPaths, localAppData: applicationPaths.appData },
      { ...applicationPaths, localAppData: "/owned-output/local-app-data\0" },
      { ...applicationPaths, tempDir: undefined },
      { ...applicationPaths, tempDir: null },
      { ...applicationPaths, tempDir: "/other/temp" },
      { ...applicationPaths, tempDir: applicationPaths.appData },
      { ...applicationPaths, tempDir: "/owned-output/./temp" },
      { ...applicationPaths, tempDir: "/owned-output/temp\0" },
    ]) {
      assert.throws(
        () => browserEnvironment({}, "off", "basic", paths),
        /application.data/i
      );
    }
  }
);

test(
  "application data creation records private distinct empty identities without requiring an empty output",
  bounded,
  async () => {
    const { createApplicationData, verifyApplicationData } =
      await import("../run.mjs");
    const output = await createTestOutput("/tmp/codex/appdata-create-");
    const { root } = output;
    await writeFile(join(root, "run.json"), "existing-owned-evidence");
    const signal = new AbortController().signal;
    const evidence = await createApplicationData(output, signal);
    assert.equal(evidence.root, root);
    const identities = new Set();
    for (const key of ["root", "appData", "localAppData", "tempDir"]) {
      const metadata = await lstat(evidence[key]);
      assert.deepEqual(evidence.creation[key], {
        dev: metadata.dev,
        ino: metadata.ino,
        uid: process.getuid(),
        mode: 0o700,
      });
      identities.add(`${metadata.dev}:${metadata.ino}`);
      if (key !== "root") {
        assert.deepEqual(await readdir(evidence[key]), []);
      }
    }
    assert.equal(identities.size, 4);
    const original = JSON.stringify(evidence);
    await verifyApplicationData(evidence, signal);
    assert.equal(JSON.stringify(evidence), original);
    assert.equal(
      await readFile(join(root, "run.json"), "utf8"),
      "existing-owned-evidence"
    );
  }
);

test(
  "application data creation refuses preexisting directories, files and symlinks without deleting partial output",
  bounded,
  async () => {
    const { createApplicationData } = await import("../run.mjs");
    for (const leaf of ["app-data", "local-app-data", "temp"]) {
      for (const type of ["directory", "file", "symlink", "dangling"]) {
        const output = await createTestOutput("/tmp/codex/appdata-existing-");
        const { root } = output;
        const path = join(root, leaf);
        if (type === "directory") {
          await mkdir(path, { mode: 0o700 });
        } else if (type === "file") {
          await writeFile(path, "preserve");
        } else {
          await symlink(
            type === "symlink" ? root : join(root, "missing"),
            path
          );
        }
        const before = await lstat(path);
        await assert.rejects(
          createApplicationData(output, new AbortController().signal),
          { code: "EEXIST" }
        );
        assert.equal((await lstat(path)).ino, before.ino);
        if (leaf !== "app-data") {
          assert.deepEqual(await readdir(join(root, "app-data")), []);
        } else {
          await assert.rejects(lstat(join(root, "local-app-data")), {
            code: "ENOENT",
          });
        }
      }
    }
  }
);

test(
  "application data creation rejects invalid output identity and child type, owner, mode or alias",
  bounded,
  async () => {
    const { createApplicationData } = await import("../run.mjs");
    const output = await createTestOutput("/tmp/codex/appdata-invalid-");
    const { root } = output;
    const alias = `${root}-alias`;
    await symlink(root, alias);
    await writeFile(join(root, "file"), "owned");
    for (const path of [
      undefined,
      "relative",
      `${root}/`,
      alias,
      join(root, "file"),
      join(root, "missing"),
    ]) {
      await assert.rejects(
        createApplicationData(
          { ...output, root: path },
          new AbortController().signal
        )
      );
    }
    await chmod(root, 0o750);
    await assert.rejects(
      createApplicationData(output, new AbortController().signal),
      /private|0700/i
    );
    for (const key of ["root", "app-data", "local-app-data", "temp"]) {
      for (const defect of ["owner", "mode", "type", "alias", "identity"]) {
        const invalidOutput = await createTestOutput(
          "/tmp/codex/appdata-invalid-"
        );
        const directory = invalidOutput.root;
        const target = key === "root" ? directory : join(directory, key);
        const operations = {
          async lstat(path) {
            const metadata = await lstat(path);
            if (path === target) {
              if (defect === "owner") {
                metadata.uid += 1;
              }
              if (defect === "mode") {
                metadata.mode |= 0o020;
              }
              if (defect === "type") {
                metadata.isDirectory = () => false;
              }
              if (defect === "identity") {
                const outputIdentity = await lstat(directory);
                metadata.dev = outputIdentity.dev;
                metadata.ino = outputIdentity.ino;
              }
            }
            return metadata;
          },
          async realpath(path) {
            return path === target && defect === "alias"
              ? `${path}-alias`
              : realpath(path);
          },
        };
        if (key === "root" && defect === "identity") {
          continue;
        }
        await assert.rejects(
          createApplicationData(
            invalidOutput,
            new AbortController().signal,
            operations
          ),
          /application.data/i
        );
      }
    }
  }
);

test(
  "application data partial mkdir and abort failures stop further operations and retain owned directories",
  bounded,
  async () => {
    const { createApplicationData } = await import("../run.mjs");
    for (const scenario of [
      "first-mkdir",
      "second-mkdir",
      "third-mkdir",
      "abort-before",
      "abort-first",
      "abort-second",
      "abort-third",
      "abort-read",
    ]) {
      const output = await createTestOutput("/tmp/codex/appdata-partial-");
      const controller = new AbortController();
      const failure = new Error(scenario);
      const created = [];
      let reads = 0;
      if (scenario === "abort-before") {
        controller.abort(failure);
      }
      const task = createApplicationData(output, controller.signal, {
        async mkdir(path, options) {
          assert(!controller.signal.aborted);
          if (
            (scenario === "first-mkdir" && created.length === 0) ||
            (scenario === "second-mkdir" && created.length === 1) ||
            (scenario === "third-mkdir" && created.length === 2)
          ) {
            throw failure;
          }
          await mkdir(path, options);
          created.push(path);
          if (
            (scenario === "abort-first" && created.length === 1) ||
            (scenario === "abort-second" && created.length === 2) ||
            (scenario === "abort-third" && created.length === 3)
          ) {
            controller.abort(failure);
          }
        },
        async lstat(path) {
          assert(!controller.signal.aborted);
          reads++;
          const metadata = await lstat(path);
          if (scenario === "abort-read") {
            controller.abort(failure);
          }
          return metadata;
        },
      });
      await assert.rejects(task, error => error === failure);
      for (const path of created) {
        assert((await lstat(path)).isDirectory());
      }
      assert.equal(
        created.length,
        {
          "first-mkdir": 0,
          "second-mkdir": 1,
          "third-mkdir": 2,
          "abort-before": 0,
          "abort-first": 1,
          "abort-second": 2,
          "abort-third": 3,
          "abort-read": 0,
        }[scenario]
      );
      if (scenario === "abort-before") {
        assert.equal(reads, 0);
      }
    }
  }
);

test(
  "application data final admission rejects replacement, population, permissions, aliases and abort without identity refresh",
  bounded,
  async () => {
    const { createApplicationData, verifyApplicationData } =
      await import("../run.mjs");
    for (const scenario of [
      "replace",
      "populate",
      "mode",
      "symlink",
      "missing",
      "root-mode",
      "root-replace",
      "abort",
    ]) {
      const output = await createTestOutput("/tmp/codex/appdata-recheck-");
      const { root } = output;
      const controller = new AbortController();
      const evidence = await createApplicationData(output, controller.signal);
      const initial = JSON.stringify(evidence);
      if (["replace", "symlink", "missing"].includes(scenario)) {
        await rename(evidence.appData, `${evidence.appData}-original`);
        if (scenario === "replace") {
          await mkdir(evidence.appData, { mode: 0o700 });
        }
        if (scenario === "symlink") {
          await symlink(evidence.localAppData, evidence.appData);
        }
      } else if (scenario === "populate") {
        await writeFile(
          join(evidence.localAppData, "unexpected"),
          "owned-test"
        );
      } else if (scenario === "abort") {
        controller.abort(new Error("test abort"));
      } else if (scenario === "root-replace") {
        await rename(root, `${root}-original`);
        await mkdir(root, { mode: 0o700 });
      } else {
        await chmod(scenario === "mode" ? evidence.localAppData : root, 0o750);
      }
      let launches = 0;
      await assert.rejects(
        verifyApplicationData(evidence, controller.signal).then(
          () => launches++
        )
      );
      assert.equal(launches, 0);
      assert.equal(JSON.stringify(evidence), initial);
    }
  }
);

test(
  "application data final admission rejects missing creation evidence and propagates each read failure or abort",
  bounded,
  async () => {
    const { createApplicationData, verifyApplicationData } =
      await import("../run.mjs");
    const output = await createTestOutput("/tmp/codex/appdata-final-failure-");
    const evidence = await createApplicationData(
      output,
      new AbortController().signal
    );
    for (const invalid of [
      undefined,
      {},
      { ...evidence, creation: undefined },
      { ...evidence, creation: { ...evidence.creation, appData: null } },
      { ...evidence, localAppData: evidence.appData },
      { ...evidence, tempDir: evidence.appData },
      { ...evidence, creation: { ...evidence.creation, tempDir: null } },
    ]) {
      await assert.rejects(
        verifyApplicationData(invalid, new AbortController().signal),
        /application.data/i
      );
    }
    for (const operation of ["lstat", "realpath", "readdir"]) {
      for (const scenario of ["throw", "abort"]) {
        const controller = new AbortController();
        const failure = new Error(`${operation} ${scenario}`);
        let calls = 0;
        const operations = Object.fromEntries(
          Object.entries({ lstat, realpath, readdir }).map(([key, read]) => [
            key,
            async path => {
              assert(!controller.signal.aborted);
              calls++;
              if (key === operation && scenario === "throw") {
                throw failure;
              }
              const value = await read(path);
              if (key === operation && scenario === "abort") {
                controller.abort(failure);
              }
              return value;
            },
          ])
        );
        await assert.rejects(
          verifyApplicationData(evidence, controller.signal, operations),
          error => error === failure
        );
        const completedCalls = calls;
        await delay(0);
        assert.equal(calls, completedCalls);
        assert.equal(controller.signal.aborted, scenario === "abort");
      }
    }
    assert.deepEqual(await readdir(evidence.appData), []);
    assert.deepEqual(await readdir(evidence.localAppData), []);
    assert.deepEqual(await readdir(evidence.tempDir), []);
  }
);

test(
  "temporary directory final admission rejects mutations without refreshing evidence",
  bounded,
  async () => {
    const { createApplicationData, verifyApplicationData } =
      await import("../run.mjs");
    for (const scenario of [
      "replace",
      "populate",
      "mode",
      "symlink",
      "missing",
    ]) {
      const output = await createTestOutput("/tmp/codex/temp-recheck-");
      const signal = new AbortController().signal;
      const evidence = await createApplicationData(output, signal);
      const original = JSON.stringify(evidence);
      if (["replace", "symlink", "missing"].includes(scenario)) {
        await rename(evidence.tempDir, `${evidence.tempDir}-original`);
        if (scenario === "replace") {
          await mkdir(evidence.tempDir, { mode: 0o700 });
        } else if (scenario === "symlink") {
          await symlink(evidence.appData, evidence.tempDir);
        }
      } else if (scenario === "populate") {
        await writeFile(join(evidence.tempDir, "unexpected"), "owned-test");
      } else {
        await chmod(evidence.tempDir, 0o750);
      }
      let continued = false;
      await assert.rejects(
        verifyApplicationData(evidence, signal).then(() => {
          continued = true;
        })
      );
      assert.equal(continued, false);
      assert.equal(JSON.stringify(evidence), original);
    }
  }
);

test(
  "temporary directory read failures and aborts preserve the original failure",
  bounded,
  async () => {
    const { createApplicationData, verifyApplicationData } =
      await import("../run.mjs");
    const output = await createTestOutput("/tmp/codex/temp-read-");
    const evidence = await createApplicationData(
      output,
      new AbortController().signal
    );
    for (const phase of ["lstat", "realpath", "readdir"]) {
      for (const abort of [false, true]) {
        const controller = new AbortController();
        const failure = new Error(`temporary ${phase}`);
        let reached = false;
        const io = Object.fromEntries(
          Object.entries({ lstat, realpath, readdir }).map(([method, read]) => [
            method,
            async path => {
              controller.signal.throwIfAborted();
              if (method === phase && path === evidence.tempDir) {
                reached = true;
                if (abort) {
                  const result = await read(path);
                  controller.abort(failure);
                  return result;
                }
                throw failure;
              }
              return read(path);
            },
          ])
        );
        await assert.rejects(
          verifyApplicationData(evidence, controller.signal, io),
          error => error === failure
        );
        assert.equal(reached, true);
      }
    }
  }
);

test(
  "application data provenance includes exact roots and effective environment, and save or abort failure prevents continuation",
  bounded,
  async () => {
    const { collectProvenance, verifyApplicationData } =
      await import("../run.mjs");
    const directory = await mkdtemp("/tmp/codex/appdata-provenance-");
    const binary = join(directory, "binary");
    const header = Buffer.alloc(20);
    header.set([0x7f, 0x45, 0x4c, 0x46, 2, 1]);
    header.writeUInt16LE(62, 18);
    await writeFile(binary, header, { mode: 0o700 });
    await writeFile(join(directory, "libxul.so"), "synthetic");
    await writeFile(
      join(directory, "application.ini"),
      "[App]\nBuildID=synthetic\n"
    );
    for (const options of [
      { suite: "basic", profile: "off" },
      { suite: "basic", profile: "on" },
      { suite: "userland-cache", profile: "off" },
      { suite: "lifecycle", profile: "off", "lifecycle-plan": "smoke" },
      { suite: "lifecycle", profile: "off", "lifecycle-plan": "soak-30m" },
    ]) {
      for (const scenario of ["success", "write", "abort"]) {
        const output = await createTestOutput(join(directory, "output-"));
        const { root } = output;
        const controller = new AbortController();
        const failure = new Error(`provenance ${scenario}`);
        let saved;
        let continuation = false;
        const operation = collectProvenance(
          { ...options, binary },
          output,
          controller.signal,
          async (fileName, value) => {
            if (fileName !== "provenance.json") {
              return;
            }
            saved = value;
            if (scenario === "write") {
              throw failure;
            }
            if (scenario === "abort") {
              controller.abort(failure);
            }
          }
        ).then(async value => {
          continuation = true;
          assert.deepEqual(value.applicationData, saved.applicationData);
          assert.deepEqual(value.environment, saved.environment);
          await verifyApplicationData(value.applicationData, controller.signal);
        });
        if (scenario === "success") {
          await operation;
          assert.equal(continuation, true);
        } else {
          await assert.rejects(operation, error => error === failure);
          assert.equal(continuation, false);
        }
        assert.equal(saved.applicationData.appData, join(root, "app-data"));
        assert.equal(saved.applicationData.tempDir, join(root, "temp"));
        assert.equal(saved.environment.env.TMPDIR, join(root, "temp"));
        assert.equal(saved.environment.env.TMP, join(root, "temp"));
        assert.equal(saved.environment.env.TEMP, join(root, "temp"));
        assert.equal(
          saved.environment.env.MOZ_LOCAL_APP_DATA,
          join(root, "local-app-data")
        );
        assert.deepEqual(await readdir(join(root, "app-data")), []);
      }
    }
  }
);

test(
  "application data child-only environment reaches a harmless owned Node child",
  bounded,
  async t => {
    const { createApplicationData, verifyApplicationData } =
      await import("../run.mjs");
    const outputRoot = await createTestOutput("/tmp/codex/appdata-child-");
    const { root } = outputRoot;
    const signal = new AbortController().signal;
    const evidence = await createApplicationData(outputRoot, signal);
    const before = process.env.MOZ_APP_DATA;
    const { env } = browserEnvironment(
      { HOME: "/unchanged-home", MOZ_APP_DATA: "/hostile" },
      "off",
      "basic",
      evidence
    );
    await verifyApplicationData(evidence, signal);
    const output = join(root, "child-env.json");
    const owned = await spawnOwned(
      process.execPath,
      [
        "-e",
        `require('fs').writeFileSync(${JSON.stringify(output)}, JSON.stringify({appData:process.env.MOZ_APP_DATA, localAppData:process.env.MOZ_LOCAL_APP_DATA, home:process.env.HOME, tempDir:require('os').tmpdir(), tmp:process.env.TMP, temp:process.env.TEMP})); setTimeout(() => {}, 100);`,
      ],
      { env }
    );
    t.after(() => stopOwned(owned, 1500));
    assert.equal((await owned.completion).code, 0);
    assert.deepEqual(JSON.parse(await readFile(output, "utf8")), {
      appData: evidence.appData,
      localAppData: evidence.localAppData,
      home: "/unchanged-home",
      tempDir: evidence.tempDir,
      tmp: evidence.tempDir,
      temp: evidence.tempDir,
    });
    assert.equal(process.env.MOZ_APP_DATA, before);
    assert.equal((await stopOwned(owned, 1500)).status, "clean");
  }
);

test(
  "soak provenance bounds only adjacent INIs and hashes exact preserved bytes",
  bounded,
  async () => {
    const { collectProvenance } = await import("../run.mjs");
    for (const scenario of [
      "valid",
      "missing-platform",
      "oversize",
      "write",
      "platform-write",
    ]) {
      const directory = await mkdtemp("/tmp/codex/soak-provenance-");
      const binary = join(directory, "binary");
      const output = await createOutputRoot(
        join(directory, "output"),
        new AbortController().signal
      );
      const header = Buffer.alloc(20);
      header.set([0x7f, 0x45, 0x4c, 0x46, 2, 1]);
      header.writeUInt16LE(62, 18);
      await writeFile(binary, header, { mode: 0o700 });
      await writeFile(join(directory, "libxul.so"), "synthetic");
      const bytes =
        scenario === "oversize"
          ? Buffer.alloc(65537)
          : Buffer.from([91, 65, 112, 112, 93, 13, 10, 255]);
      await writeFile(join(directory, "application.ini"), bytes);
      if (scenario !== "missing-platform") {
        await writeFile(join(directory, "platform.ini"), bytes);
      }
      const writes = new Map();
      const task = collectProvenance(
        {
          binary,
          suite: "lifecycle",
          profile: "off",
          "lifecycle-plan": "soak-30m",
        },
        output,
        new AbortController().signal,
        async (filename, value) => {
          if (scenario === "write") {
            throw new Error("INI write failed");
          }
          if (scenario === "platform-write" && filename === "platform.ini") {
            throw Object.assign(new Error("INI write failed"), {
              code: "ENOENT",
            });
          }
          writes.set(filename, value);
        }
      );
      if (scenario === "oversize") {
        await assert.rejects(task, /INI.*cap/);
        assert.equal(writes.size, 0);
      } else if (["write", "platform-write"].includes(scenario)) {
        await assert.rejects(task, /INI write failed/);
      } else {
        await task;
        assert.deepEqual(writes.get("application.ini"), bytes);
        const provenance = writes.get("provenance.json");
        assert.equal(
          provenance.files["application.ini"].sha256,
          createHash("sha256").update(bytes).digest("hex")
        );
        if (scenario === "missing-platform") {
          assert.equal(provenance.files["platform.ini"], null);
        } else {
          assert.deepEqual(writes.get("platform.ini"), bytes);
        }
      }
    }
  }
);

test(
  "only lifecycle profiles suppress welcome URLs and disable policy reporting",
  bounded,
  async () => {
    const { profilePreferences } = await import("../run.mjs");
    const base = {
      "umbrafox.control.enabled": true,
      "umbrafox.control.port": 0,
    };
    assert.deepEqual(profilePreferences("basic"), base);
    assert.deepEqual(profilePreferences("userland-cache"), base);
    assert.deepEqual(profilePreferences("lifecycle"), {
      ...base,
      "startup.homepage_welcome_url": "",
      "startup.homepage_welcome_url.additional": "",
      "datareporting.policy.dataSubmissionEnabled": false,
    });
  }
);

test(
  "cleanup deadline stops new steps while reserving terminal failure time",
  bounded,
  async () => {
    const { finishLifecycle } = await import("../run.mjs");
    const { createLifecycleBudget, createLifecycleEvidence } =
      await import("../lifecycle-capture.mjs");
    let clock = 0;
    const budget = createLifecycleBudget(120000, () => clock);
    clock = 105000;
    const writes = [];
    const save = createLifecycleEvidence({
      root: "/output",
      budget,
      signal: new AbortController().signal,
      scrub: value => value,
      async write(path, text) {
        writes.push({ path, value: JSON.parse(text) });
      },
    });
    const report = { status: "passed" };
    const failure = await finishLifecycle({
      report,
      budget,
      save: (fileName, value) => save(fileName, value, "cleanup"),
      scrub: value => value,
      abort() {},
      cancelLog() {},
      server: {
        snapshot: () => ({}),
        close() {
          clock = 118001;
        },
      },
      logger: {
        finish() {
          assert.fail("No logger work after cleanup deadline");
        },
      },
      log: {
        close() {
          assert.fail("No new file close after cleanup deadline");
        },
      },
    });
    assert(failure instanceof Error);
    assert.equal(report.status, "cleanup-failed");
    await save("run.json", report, "cleanup");
    assert.equal(writes.at(-1).value.status, "cleanup-failed");
    assert.equal(budget.remainingTerminal(), 1999);
  }
);

test(
  "standard cleanup extraction preserves order and first failure",
  bounded,
  async t => {
    const { finishStandard } = await import("../run.mjs");
    assert.equal(typeof finishStandard, "function");
    for (const suite of ["basic", "userland-cache"]) {
      const owned = await spawnOwned(process.execPath, [
        "-e",
        "setTimeout(() => {}, 1500)",
      ]);
      t.after(() => stopOwned(owned, 1500));
      const original = new Error("Original capture failure");
      const events = [];
      const report = { status: "failed" };
      const failure = await finishStandard({
        owned,
        report,
        suite,
        failure: original,
        scrub: value => value,
        server: {
          async close() {
            assert(owned.outcome);
            events.push("server");
            throw new Error("Close failure");
          },
        },
        logger: {
          async finish() {
            events.push("logger");
            throw new Error("Logger failure");
          },
        },
        log: {
          async close() {
            events.push("file");
          },
        },
      });
      assert.equal(failure, original);
      assert.equal(report.cleanup.status, "clean");
      assert.equal(report.status, "cleanup-failed");
      assert.deepEqual(events, ["server", "logger", "file"]);
    }
  }
);

test(
  "lifecycle smoke CLI remains bounded and quiet without changing other suites",
  bounded,
  () => {
    const base = [
      "--binary",
      "/binary",
      "--output",
      "/output",
      "--bus",
      "/bus",
      "--profile",
      "off",
    ];
    const lifecycle = [
      ...base,
      "--suite",
      "lifecycle",
      "--lifecycle-case",
      "none",
    ];
    for (const state of ["none", "unrelated", "matching-no-handler"]) {
      const parsed = parseArgs([...lifecycle.slice(0, -1), state]);
      assert.equal(parsed["lifecycle-plan"], "smoke");
      assert.equal(parsed["timeout-ms"], 120000);
    }
    for (const extra of [
      ["--lifecycle-plan", "30m"],
      ["--lifecycle-plan", "2h"],
      ["--trials", "7"],
      ["--warmup", "2"],
      ["--timeout-ms", "120001"],
      ["--timeout-ms", "44999"],
      ["--userland-case", "none"],
    ]) {
      assert.throws(() => parseArgs([...lifecycle, ...extra]));
    }
    assert.throws(() => parseArgs([...base, "--suite", "lifecycle"]));
    assert.throws(() => parseArgs([...base, "--lifecycle-case", "none"]));
    assert.throws(() => parseArgs([...base, "--lifecycle-plan", "smoke"]));
    assert.throws(() => parseArgs([...lifecycle.slice(0, -1), "visited"]));
    assert.throws(() =>
      browserEnvironment({}, "on", "lifecycle", applicationPaths)
    );
    const environment = browserEnvironment(
      { MOZ_LOG: "all:5", MOZ_PROFILER_STARTUP: "1" },
      "off",
      "lifecycle",
      applicationPaths
    );
    assert.equal(environment.env.MOZ_LOG, undefined);
    assert.equal(environment.env.MOZ_PROFILER_STARTUP, undefined);
    assert.equal(
      parseArgs([...base, "--timeout-ms", "300000"])["timeout-ms"],
      300000
    );
  }
);

test("soak CLI permits only fixed NONE/off without overrides", bounded, () => {
  const base = [
    "--binary",
    "/binary",
    "--output",
    "/output",
    "--bus",
    "/bus",
    "--profile",
    "off",
  ];
  const soak = [
    ...base,
    "--suite",
    "lifecycle",
    "--lifecycle-plan",
    "soak-30m",
    "--lifecycle-case",
    "none",
  ];
  assert.equal(parseArgs(soak)["timeout-ms"], 1800000);
  for (const extra of [
    ["--timeout-ms", "1800000"],
    ["--timeout-ms", "120000"],
    ["--trials", "7"],
    ["--warmup", "2"],
    ["--observer", "none"],
  ]) {
    assert.throws(() => parseArgs([...soak, ...extra]));
  }
  for (const state of ["unrelated", "matching-no-handler", "visited"]) {
    assert.throws(() => parseArgs([...soak.slice(0, -1), state]));
  }
  const profiled = [...soak];
  profiled[7] = "on";
  assert.throws(() => parseArgs(profiled));
  for (const suite of ["basic", "userland-cache"]) {
    const args = [...base, "--suite", suite];
    if (suite === "userland-cache") {
      args.push("--userland-case", "none");
    }
    assert.equal(parseArgs(args)["timeout-ms"], 120000);
    assert.throws(() => parseArgs([...args, "--timeout-ms", "1800000"]));
    assert.throws(() => parseArgs([...args, "--lifecycle-plan", "soak-30m"]));
  }
});

test(
  "soak integration has exactly 28 serialized RPCs and strict raw-before-admission gates",
  bounded,
  async () => {
    const fixture = await import("../lifecycle.mjs");
    const capture = await import("../lifecycle-capture.mjs");
    const options = {
      suite: "lifecycle",
      profile: "off",
      "lifecycle-case": "none",
      "lifecycle-plan": "soak-30m",
      "timeout-ms": 1800000,
    };
    const plan = fixture.getLifecyclePlan(options["lifecycle-plan"]);
    const controller = new AbortController();
    const realServer = await fixture.createLifecycleServer(
      options,
      controller.signal
    );
    const { metadata, url } = realServer;
    await realServer.close();
    for (const scenario of [
      "valid",
      "setup-retry",
      "foreign-after",
      "context-after",
      "missing-after",
      "stale-checkpoint",
      "metadata",
      "reserve",
      "rpc",
    ]) {
      let clock = 0;
      let currentID = 0;
      let nextID = 0;
      let heldAt;
      let held = false;
      let complete = false;
      let started = false;
      let setupAttempts = 0;
      const calls = [];
      const writes = new Map();
      const savedMetadata = structuredClone(metadata);
      if (scenario === "metadata") {
        savedMetadata.checkpoints[0].documentsCompleted++;
      }
      const budget = capture.createLifecycleBudget(1800000, () => clock, plan);
      if (scenario === "reserve") {
        clock = 195001;
      }
      const documentURL = () =>
        `${metadata.originB}${metadata.sentinel}document?id=${currentID}`;
      const args = {
        options,
        signal: controller.signal,
        owned: { child: { pid: 101 } },
        profile: "/profile",
        budget,
        environment: { env: {} },
        bounded: promise => promise,
        milestone() {},
        scrub: text => text,
        save: async (fileName, value) => writes.set(fileName, value),
        monitor: {
          async setBaseline() {},
          async sampleNow() {
            return { processes: [{ identity: { pid: 101, startTime: "10" } }] };
          },
        },
        server: {
          url,
          metadata: savedMetadata,
          snapshot: () => ({
            started: false,
            status: "pending",
            error: null,
            receipts:
              scenario === "setup-retry" && setupAttempts === 0
                ? []
                : [{ kind: "loaded", id: 0 }],
            counts: {
              documents:
                scenario === "setup-retry" && setupAttempts === 0 ? 0 : 1,
            },
            pendingRequests: 1,
            dropped: 0,
          }),
          start() {
            started = true;
          },
          result: Promise.resolve({ synthetic: true }),
          async nextCheckpoint() {
            assert(!held);
            if (nextID === plan.checkpoints.length) {
              return null;
            }
            const checkpoint = plan.checkpoints[nextID++];
            currentID = checkpoint.documentsCompleted - 1;
            held = true;
            heldAt = clock;
            return checkpoint;
          },
          async releaseCheckpoint(id) {
            assert(held);
            assert(clock - heldAt >= plan.checkpoints[id].settleMs);
            held = false;
            complete = id === 10;
          },
        },
        lifecycleCapture: input =>
          capture.captureLifecycle({
            ...input,
            now: () => clock,
            async wait(ms, signal) {
              signal.throwIfAborted();
              clock += ms;
            },
          }),
        validateLifecycleResult() {},
        control: {
          async request(method) {
            if (held) {
              assert(clock - heldAt >= plan.checkpoints[nextID - 1].settleMs);
            }
            calls.push(method);
            if (!started && method === "umbrafox.diagnostics.snapshot") {
              setupAttempts++;
            }
            if (scenario === "rpc" && nextID === 1) {
              throw new Error("RPC failed");
            }
            let observedURL = documentURL();
            if (scenario === "setup-retry" && setupAttempts === 1 && !started) {
              observedURL = "about:blank";
            }
            if (
              (scenario === "foreign-after" && complete) ||
              (scenario === "stale-checkpoint" && nextID === 2)
            ) {
              observedURL =
                scenario === "foreign-after"
                  ? "https://example.test/"
                  : `${metadata.originB}${metadata.sentinel}document?id=7`;
            }
            if (method === "umbrafox.diagnostics.snapshot") {
              if (scenario === "missing-after" && complete) {
                return null;
              }
              return {
                processID: 101,
                profileDir: "/profile",
                channel: "umbrafox-control",
                windows: [
                  {
                    index: 0,
                    selectedTabIndex: 0,
                    tabs: [
                      {
                        url: observedURL,
                        context:
                          scenario === "context-after" && complete ? 11 : 10,
                        browserId: 9,
                        selected: true,
                      },
                    ],
                  },
                ],
              };
            }
            if (method === "umbrafox.gfx.snapshot") {
              return { windows: [{ type: "navigator:browser" }] };
            }
            return {
              processID: 101,
              profiler: { active: false },
              process: {
                pid: 101,
                type: "browser",
                memory: 1,
                cpuTime: 1,
                windows: [
                  {
                    outerWindowId: 20,
                    documentURI: observedURL,
                    isProcessRoot: true,
                    isInProcess: false,
                  },
                ],
              },
            };
          },
        },
      };
      if (["valid", "setup-retry"].includes(scenario)) {
        await captureWorkloads(args);
        assert.deepEqual(calls, [
          ...(scenario === "setup-retry"
            ? ["umbrafox.diagnostics.snapshot"]
            : []),
          "umbrafox.diagnostics.snapshot",
          "umbrafox.gfx.snapshot",
          "umbrafox.performance.snapshot",
          ...Array.from({ length: 11 }, () => [
            "umbrafox.performance.snapshot",
            "umbrafox.diagnostics.snapshot",
          ]).flat(),
          "umbrafox.gfx.snapshot",
          "umbrafox.performance.snapshot",
          "umbrafox.diagnostics.snapshot",
        ]);
        assert.equal(calls.length, 27 + setupAttempts);
        assert.equal(calls.length, scenario === "setup-retry" ? 29 : 28);
        assert.equal(
          writes.get("lifecycle-isolation-before.json").setupRPCs,
          setupAttempts
        );
        assert.equal(
          writes.get("lifecycle-isolation-after.json").selectionContextObserved,
          true
        );
        assert.equal(
          writes.get("statistics.json").mode,
          "lifecycle-soak-observation-only"
        );
      } else {
        await assert.rejects(captureWorkloads(args));
        if (scenario.endsWith("after")) {
          assert(writes.has("diagnostics-after.json"));
        }
        if (scenario === "stale-checkpoint") {
          assert(writes.has("lifecycle-checkpoint-1.json"));
        }
        if (["metadata", "reserve"].includes(scenario)) {
          assert.equal(started, false);
          assert.equal(calls.length, 0);
        }
      }
    }
  }
);

test(
  "lifecycle capture preserves common gates, raw failure evidence and fixed adapter",
  bounded,
  async () => {
    for (const scenario of [
      "valid",
      "identity",
      "profiler",
      "validator",
      "write",
      "before-window",
      "after-window",
    ]) {
      const events = [];
      const writes = new Map();
      const result = { version: 1, syntheticLifecycle: true };
      const fixtureOrigin = "http://127.0.0.1:32123";
      const prefix = `/${"a".repeat(36)}/`;
      const url = id => `${fixtureOrigin}${prefix}document?id=${id}`;
      let completed = false;
      const args = {
        control: {
          async request(method, params) {
            if (method === "umbrafox.diagnostics.snapshot") {
              return {
                processID: scenario === "identity" ? 99 : 101,
                profileDir: "/profile",
                channel: "umbrafox-control",
                windows: [
                  {
                    index: 0,
                    selectedTabIndex: 0,
                    tabs: [
                      {
                        context: 10,
                        browserId: 9,
                        selected: true,
                        url: url(0),
                      },
                    ],
                  },
                ],
              };
            }
            if (method === "umbrafox.performance.snapshot") {
              assert.equal(params.includeThreads, false);
              return {
                processID: 101,
                profiler: { active: scenario === "profiler" },
                process: {
                  pid: 101,
                  type: "browser",
                  windows: [
                    {
                      outerWindowId: 20,
                      isProcessRoot: true,
                      isInProcess: false,
                      documentURI:
                        scenario ===
                        (completed ? "after-window" : "before-window")
                          ? "https://example.test/"
                          : url(completed ? 39 : 0),
                    },
                  ],
                },
              };
            }
            return { windows: [{ type: "navigator:browser" }] };
          },
        },
        options: {
          suite: "lifecycle",
          profile: "off",
          "lifecycle-case": "none",
        },
        owned: { child: { pid: 101 } },
        profile: "/profile",
        environment: { env: {} },
        root: "/unused",
        mode: "lifecycle-smoke-only",
        signal: new AbortController().signal,
        bounded: promise => promise,
        scrub: value => value,
        milestone() {},
        server: {
          url: url(0),
          metadata: {
            originB: fixtureOrigin,
            sentinel: prefix,
            documents: [
              { id: 0, role: "initial" },
              ...[7, 23, 39].map((id, checkpoint) => ({
                id,
                role: "settled",
                checkpoint,
              })),
            ],
          },
          snapshot: () => ({
            started: false,
            status: "pending",
            error: null,
            receipts: [{ kind: "loaded", id: 0 }],
            counts: { documents: 1 },
            pendingRequests: 1,
            dropped: 0,
          }),
          start() {
            events.push("start");
          },
          result: Promise.resolve(result),
        },
        async lifecycleCapture() {
          events.push("checkpoints");
          completed = true;
        },
        async save(fileName, value) {
          writes.set(fileName, value);
          if (scenario === "write" && fileName === "samples.json") {
            throw new Error("Write failed");
          }
        },
        validateLifecycleResult(value) {
          assert.equal(value, result);
          assert.equal(writes.get("samples.json"), result);
          events.push("validate");
          if (scenario === "validator") {
            throw new Error("Oracle failed");
          }
        },
      };
      if (scenario === "valid") {
        await captureWorkloads(args);
        assert.deepEqual(events, ["start", "checkpoints", "validate"]);
        assert.equal(writes.get("statistics.json").workloads, null);
      } else {
        await assert.rejects(captureWorkloads(args));
        if (scenario !== "after-window") {
          assert(!writes.has("statistics.json"));
        }
        if (["identity", "profiler", "before-window"].includes(scenario)) {
          assert.deepEqual(events, []);
        }
        if (scenario.endsWith("-window")) {
          assert(writes.has(`performance-${scenario.split("-")[0]}.json`));
        }
      }
    }
  }
);

test(
  "lifecycle cleanup failure stays bounded and still stops owned child",
  bounded,
  async t => {
    const { finishLifecycle } = await import("../run.mjs");
    assert.equal(typeof finishLifecycle, "function");
    for (const scenario of ["snapshot", "close", "logger", "control"]) {
      const owned = await spawnOwned(process.execPath, [
        "-e",
        "setTimeout(() => {}, 2000)",
      ]);
      t.after(() => stopOwned(owned, 1500));
      const report = { status: "passed" };
      const events = [];
      const failure = await finishLifecycle({
        owned,
        report,
        server: {
          snapshot() {
            events.push("snapshot");
            if (scenario === "snapshot") {
              throw new Error("Snapshot failed");
            }
            return {};
          },
          async close() {
            events.push("close");
            if (scenario === "close") {
              return new Promise(() => {});
            }
            return undefined;
          },
        },
        logger: {
          async finish() {
            if (scenario === "logger") {
              throw new Error("Log failed");
            }
            return { writtenBytes: 0, droppedBytes: 0 };
          },
        },
        control: {
          close() {
            if (scenario === "control") {
              throw new Error("Control close failed");
            }
          },
        },
        save: async () => {},
        scrub: value => value,
        abort() {
          events.push("abort");
        },
        cancelLog() {},
        budget: { remaining: () => 15000 },
        operationTimeoutMs: 20,
      });
      assert(failure instanceof Error);
      assert.notEqual(report.status, "passed");
      assert.equal(report.cleanup.status, "clean");
      assert.deepEqual(events.slice(0, 2), ["snapshot", "abort"]);
      assert(events.includes("close"));
    }
  }
);

test(
  "lifecycle log caps abort immediately and cancelled cleanup never signals",
  bounded,
  async t => {
    let dropped = false;
    const logger = createBoundedLogger(
      async () => {},
      value => value,
      4,
      () => {
        dropped = true;
      }
    );
    logger.push("stdout", "overflow\n");
    assert.equal(dropped, true);
    const owned = await spawnOwned(process.execPath, [
      "-e",
      "setTimeout(() => {}, 1000)",
    ]);
    t.after(() => stopOwned(owned, 1500));
    const controller = new AbortController();
    controller.abort(new Error("Cleanup deadline"));
    await assert.rejects(
      stopOwned(owned, 10, controller.signal),
      /Cleanup deadline/
    );
    assert.equal(owned.outcome, null);
    assert.equal(
      (await readIdentity(owned.child.pid)).start,
      owned.identity.start
    );
    assert.equal((await stopOwned(owned, 1500)).status, "clean");
  }
);

test(
  "cleanup signal bounds incomplete spawn completion without sending signals",
  bounded,
  async () => {
    await assert.rejects(
      stopOwned(
        { child: {}, completion: new Promise(() => {}) },
        50,
        AbortSignal.timeout(20)
      ),
      /abort|timed out/i
    );
  }
);

test(
  "lifecycle pre-spawn failure retains a terminal failed report",
  bounded,
  async () => {
    const directory = await mkdtemp("/tmp/codex/lifecycle-preflight-");
    const output = join(directory, "output");
    const bus = join(directory, "bus.txt");
    await writeFile(bus, "OK\n");
    await assert.rejects(
      main([
        "--binary",
        join(directory, "missing-binary"),
        "--output",
        output,
        "--bus",
        bus,
        "--profile",
        "off",
        "--suite",
        "lifecycle",
        "--lifecycle-case",
        "none",
      ])
    );
    const report = JSON.parse(await readFile(join(output, "run.json"), "utf8"));
    assert.equal(report.status, "failed");
    assert.equal(report.mode, "lifecycle-smoke-only");
    assert.equal(report.milestones.beforeSpawn, undefined);
    assert.equal((await stat(join(output, "run.json"))).mode & 0o777, 0o600);
  }
);

test(
  "fixture snapshots preserve success and failure state before cleanup",
  bounded,
  async () => {
    const { preserveFixtureState } = await import("../run.mjs");
    assert.equal(typeof preserveFixtureState, "function");
    for (const initialStatus of ["passed", "failed"]) {
      const events = [];
      const report = { status: initialStatus };
      const previousFailure =
        initialStatus === "failed" ? new Error("Fixture timed out") : undefined;
      const state = {
        started: true,
        settled: false,
        scriptReady: false,
        samples: [],
        requests: [{ path: "root" }],
        pendingGates: 1,
      };
      const server = {
        snapshot() {
          events.push("snapshot");
          return state;
        },
        close() {
          events.push("close");
        },
      };
      const failure = await preserveFixtureState({
        server,
        report,
        failure: previousFailure,
        scrub: value => value,
        async save(fileName, value) {
          events.push("save");
          assert.equal(fileName, "fixture-state.json");
          assert.equal(value, state);
        },
      });
      events.push("abort");
      server.close();
      assert.deepEqual(events, ["snapshot", "save", "abort", "close"]);
      assert.equal(failure, previousFailure);
      assert.equal(report.status, initialStatus);
    }
    const report = { status: "passed" };
    assert.equal(
      await preserveFixtureState({
        server: {},
        report,
        save() {
          assert.fail("Basic has no snapshot");
        },
        scrub: value => value,
      }),
      undefined
    );
    assert.deepEqual(report, { status: "passed" });
  }
);

test(
  "fixture snapshot errors and bounded write timeout never bypass owned-child cleanup",
  bounded,
  async t => {
    const { preserveFixtureState } = await import("../run.mjs");
    assert.equal(typeof preserveFixtureState, "function");
    for (const scenario of ["snapshot", "write", "timeout", "async"]) {
      const owned = await spawnOwned(process.execPath, [
        "-e",
        "setTimeout(() => {}, 1500)",
      ]);
      t.after(() => stopOwned(owned, 1500));
      const report = { status: "passed" };
      const events = [];
      const failure = await preserveFixtureState({
        server: {
          snapshot() {
            events.push("snapshot");
            if (scenario === "snapshot") {
              throw new Error("Synthetic sensitive snapshot failure");
            }
            if (scenario === "async") {
              return Promise.reject(
                new Error("Async snapshot is not supported")
              );
            }
            return { requests: [], pendingGates: 1 };
          },
        },
        report,
        scrub: value => value.replace("sensitive", "[redacted]"),
        timeoutMs: 20,
        async save() {
          events.push("save");
          if (scenario === "write") {
            throw new Error("Evidence disk full");
          }
          return new Promise(() => {});
        },
      });
      events.push("abort");
      const cleanup = await stopOwned(owned, 1500);
      events.push("close");
      assert.equal(cleanup.status, "clean");
      assert.equal(report.status, "failed");
      assert(failure instanceof Error);
      assert(!report.fixtureStateError.includes("sensitive"));
      assert.equal(events.at(-2), "abort");
      assert.equal(events.at(-1), "close");
      if (scenario === "timeout") {
        assert.match(report.fixtureStateError, /timed out/);
      }
      if (scenario === "async") {
        assert.match(report.fixtureStateError, /synchronous object/);
      }
    }
    const report = { status: "failed" };
    const original = new Error("Original timeout");
    const retained = await preserveFixtureState({
      server: {
        snapshot() {
          throw new Error("Snapshot failed");
        },
      },
      report,
      failure: original,
      scrub: value => value,
      save() {
        assert.fail("No write after snapshot failure");
      },
    });
    assert.equal(retained, original);
    assert.equal(report.fixtureStateError, "Snapshot failed");
    const invalidFailure = null;
    const nonErrorReport = { status: "passed" };
    const normalized = await preserveFixtureState({
      server: {
        snapshot() {
          throw invalidFailure;
        },
      },
      report: nonErrorReport,
      scrub: value => value,
      save() {
        assert.fail("No write after invalid snapshot failure");
      },
    });
    assert(normalized instanceof Error);
    assert.equal(nonErrorReport.status, "failed");
  }
);

test(
  "userland provenance follows adjacent module symlinks and records packaged absence without fallback",
  bounded,
  async () => {
    const { collectProvenance } = await import("../run.mjs");
    assert.equal(typeof collectProvenance, "function");
    for (const layout of ["loose", "packaged", "invalid"]) {
      const directory = await mkdtemp("/tmp/codex/perf-provenance-");
      const binary = join(directory, "fixture-binary");
      const output = await createOutputRoot(
        join(directory, "output"),
        new AbortController().signal
      );
      const header = Buffer.alloc(20);
      header.set([0x7f, 0x45, 0x4c, 0x46, 2, 1]);
      header.writeUInt16LE(62, 18);
      await writeFile(binary, header, { mode: 0o700 });
      await writeFile(join(directory, "libxul.so"), "synthetic identity only");
      await writeFile(
        join(directory, "application.ini"),
        "[App]\nBuildID=synthetic\n"
      );
      const moduleName = "modules/UmbrafoxUserlandScriptRegistry.sys.mjs";
      const actorNames = [
        "moz-src/toolkit/actors/UmbrafoxUserlandParent.sys.mjs",
        "moz-src/toolkit/actors/UmbrafoxUserlandChild.sys.mjs",
        "modules/ActorManagerParent.sys.mjs",
      ];
      const sourcePath = join(directory, "synthetic-source.mjs");
      const source = "export const syntheticIdentity = 1;\n";
      if (layout !== "packaged") {
        await mkdir(join(directory, "modules"));
        if (layout === "loose") {
          await writeFile(sourcePath, source);
          await symlink(sourcePath, join(directory, moduleName));
          await mkdir(join(directory, "moz-src/toolkit/actors"), {
            recursive: true,
          });
          for (const actorName of actorNames) {
            await symlink(sourcePath, join(directory, actorName));
          }
        } else {
          await mkdir(join(directory, moduleName));
        }
      }
      const records = new Map();
      const operation = collectProvenance(
        { binary, suite: "userland-cache", profile: "off" },
        output,
        new AbortController().signal,
        async (fileName, value) => records.set(fileName, value)
      );
      if (layout === "invalid") {
        await assert.rejects(operation, { code: "EISDIR" });
        continue;
      }
      await operation;
      const provenance = records.get("provenance.json");
      assert.equal(Object.keys(provenance.userlandModules).length, 7);
      assert(
        !Object.hasOwn(
          provenance.userlandModules,
          "actors/UmbrafoxUserlandChild.sys.mjs"
        )
      );
      assert.match(
        provenance.fixtureHashes["userland-cache.mjs"],
        /^[a-f0-9]{64}$/
      );
      if (layout === "loose") {
        assert.deepEqual(provenance.userlandModules[moduleName], {
          path: sourcePath,
          sha256: createHash("sha256").update(source).digest("hex"),
        });
        for (const actorName of actorNames) {
          assert.deepEqual(provenance.userlandModules[actorName], {
            path: sourcePath,
            sha256: createHash("sha256").update(source).digest("hex"),
          });
        }
      } else {
        assert(
          Object.values(provenance.userlandModules).every(
            value => value === null
          )
        );
      }
    }
  }
);

test(
  "suite evidence preparation writes private stores and preserves synthetic userland URLs",
  bounded,
  async () => {
    const { prepareFixtureEvidence } = await import("../run.mjs");
    assert.equal(typeof prepareFixtureEvidence, "function");
    const directory = await mkdtemp("/tmp/codex/perf-userland-store-");
    const profile = join(directory, "profile");
    await mkdir(profile, { mode: 0o700 });
    const server = {
      url: "http://127.0.0.1:1234/synthetic-nonce/",
      scriptStore: {
        version: 1,
        scripts: [
          {
            code: "synthetic-script",
            scope: { origin: "http://127.0.0.1:1234" },
          },
        ],
      },
      metadata: {
        targetURL: "http://127.0.0.1:1235/synthetic-nonce/target.js",
      },
    };
    const secrets = [];
    const writes = new Map();
    await prepareFixtureEvidence(
      "userland-cache",
      profile,
      server,
      async (fileName, value) => writes.set(fileName, value),
      secrets
    );
    assert.deepEqual(secrets, []);
    assert.deepEqual(
      JSON.parse(
        await readFile(
          join(profile, "umbrafox", "userland-scripts.json"),
          "utf8"
        )
      ),
      server.scriptStore
    );
    assert.equal((await stat(join(profile, "umbrafox"))).mode & 0o777, 0o700);
    assert.equal(
      (await stat(join(profile, "umbrafox", "userland-scripts.json"))).mode &
        0o777,
      0o600
    );
    assert.equal(
      writes.get("userland-cache-metadata.json").targetURL,
      server.metadata.targetURL
    );
    assert.deepEqual(
      writes.get("userland-script-store.json"),
      server.scriptStore
    );
    await prepareFixtureEvidence(
      "basic",
      "/unused",
      server,
      async () => assert.fail("Basic must not write userland evidence"),
      secrets
    );
    assert.deepEqual(secrets, ["/synthetic-nonce/"]);
    const failedProfile = join(directory, "failed-profile");
    await mkdir(failedProfile, { mode: 0o700 });
    await assert.rejects(
      prepareFixtureEvidence(
        "userland-cache",
        failedProfile,
        server,
        async () => {
          throw new Error("Evidence write failed");
        },
        []
      ),
      /Evidence write failed/
    );
    assert.deepEqual(
      JSON.parse(
        await readFile(
          join(failedProfile, "umbrafox", "userland-scripts.json"),
          "utf8"
        )
      ),
      server.scriptStore
    );
  }
);

test(
  "suite CLI preserves basic defaults and constrains userland cache diagnostics",
  bounded,
  () => {
    const args = [
      "--binary",
      "/binary",
      "--output",
      "/new-output",
      "--bus",
      "/bus",
      "--profile",
      "off",
    ];
    assert.equal(parseArgs(args).suite, "basic");
    for (const userlandCase of ["none", "disabled", "unrelated", "visited"]) {
      const parsed = parseArgs([
        ...args,
        "--suite",
        "userland-cache",
        "--userland-case",
        userlandCase,
        "--timeout-ms",
        "180000",
      ]);
      assert.equal(parsed["userland-case"], userlandCase);
      assert.equal(parsed["timeout-ms"], 180000);
    }
    assert.throws(() => parseArgs([...args, "--suite", "invalid"]), /suite/);
    assert.throws(
      () => parseArgs([...args, "--suite", "userland-cache"]),
      /userland-case/
    );
    assert.throws(
      () => parseArgs([...args, "--userland-case", "none"]),
      /userland-case/
    );
    assert.throws(
      () => parseArgs([...args, "--suite", "basic", "--userland-case", "none"]),
      /userland-case/
    );
    assert.throws(
      () =>
        parseArgs([
          ...args,
          "--suite",
          "userland-cache",
          "--userland-case",
          "invalid",
        ]),
      /userland-case/
    );
    assert.throws(
      () =>
        parseArgs([
          ...args.slice(0, -1),
          "on",
          "--suite",
          "userland-cache",
          "--userland-case",
          "none",
        ]),
      /profile.*off/
    );
  }
);

test(
  "userland diagnostics force only the declared ScriptLoader logging",
  bounded,
  () => {
    const input = { MOZ_LOG: "unrelated:5", MOZ_PROFILER_STARTUP: "1" };
    const diagnostic = browserEnvironment(
      input,
      "off",
      "userland-cache",
      applicationPaths
    );
    assert.equal(diagnostic.env.MOZ_LOG, "timestamp,sync,ScriptLoader:4");
    assert.equal(diagnostic.env.MOZ_PROFILER_STARTUP, undefined);
    assert.equal(
      browserEnvironment(input, "off", "basic", applicationPaths).env.MOZ_LOG,
      undefined
    );
    assert.throws(
      () => browserEnvironment(input, "on", "userland-cache", applicationPaths),
      /profile.*off/
    );
  }
);

test(
  "userland capture preserves gates, raw evidence, validator rejection and diagnostic-only output",
  bounded,
  async () => {
    for (const scenario of [
      "valid",
      "invalid",
      "identity",
      "profiler",
      "write",
    ]) {
      const writes = [];
      const requests = [];
      let started = false;
      let validated = false;
      const result = { suite: "userland-cache", syntheticResult: true };
      const options = {
        suite: "userland-cache",
        "userland-case": "none",
        profile: "off",
      };
      const args = {
        control: {
          async request(method) {
            requests.push(method);
            if (method === "umbrafox.diagnostics.snapshot") {
              return {
                processID: scenario === "identity" ? 9 : 1234,
                profileDir: "/profile",
                channel: "umbrafox-control",
              };
            }
            return { profiler: { active: scenario === "profiler" } };
          },
        },
        owned: { child: { pid: 1234 } },
        profile: "/profile",
        options,
        environment: { env: {} },
        root: "/unused",
        mode: "diagnostic-only",
        async save(fileName, value) {
          writes.push({ fileName, value });
          if (scenario === "write" && fileName === "samples.json") {
            throw new Error("Diagnostic evidence write failed");
          }
        },
        milestone() {},
        bounded: promise => promise,
        scrub: value => value,
        signal: new AbortController().signal,
        server: {
          start() {
            started = true;
          },
          result: Promise.resolve(result),
        },
        validateUserlandCacheResult(value, receivedOptions) {
          validated = true;
          assert.equal(writes.at(-1).fileName, "samples.json");
          assert.equal(value, result);
          assert.equal(receivedOptions, options);
          if (scenario === "invalid") {
            throw new Error("Invalid userland checksum");
          }
        },
      };
      if (scenario === "valid") {
        await captureWorkloads(args);
        const statistics = writes.find(
          item => item.fileName === "statistics.json"
        ).value;
        assert.equal(statistics.mode, "diagnostic-only");
        assert.equal(statistics.workloads, null);
        assert.match(statistics.explanation, /diagnostic/i);
        assert.equal(requests.at(-1), "umbrafox.performance.snapshot");
      } else {
        const expected = {
          invalid: /Invalid userland checksum/,
          identity: /owned browser/,
          profiler: /profiler mode/,
          write: /evidence write failed/,
        };
        await assert.rejects(captureWorkloads(args), expected[scenario]);
        assert(!writes.some(item => item.fileName === "statistics.json"));
      }
      assert.equal(started, !["identity", "profiler"].includes(scenario));
      assert.equal(validated, ["valid", "invalid"].includes(scenario));
    }
  }
);

test(
  "basic capture retains its four timing summaries without the userland validator",
  bounded,
  async () => {
    const samples = [];
    for (const stage of ["warmup", "trial"]) {
      for (let index = 0; index < (stage === "warmup" ? 1 : 3); index++) {
        for (const [workload, checksum] of Object.entries(expectedChecksums)) {
          samples.push({
            stage,
            index,
            workload,
            checksum,
            durationMs: index + 1,
          });
        }
      }
    }
    const writes = new Map();
    await captureWorkloads({
      control: {
        async request(method) {
          return method === "umbrafox.diagnostics.snapshot"
            ? {
                processID: 1234,
                profileDir: "/profile",
                channel: "umbrafox-control",
              }
            : { profiler: { active: false } };
        },
      },
      owned: { child: { pid: 1234 } },
      profile: "/profile",
      options: { suite: "basic", profile: "off", trials: 3, warmup: 1 },
      environment: { env: {} },
      root: "/unused",
      mode: "local-timing",
      save: async (fileName, value) => writes.set(fileName, value),
      milestone() {},
      bounded: promise => promise,
      scrub: value => value,
      signal: new AbortController().signal,
      server: { start() {}, result: Promise.resolve({ version: 1, samples }) },
      validateUserlandCacheResult() {
        assert.fail("Basic must not invoke userland validator");
      },
    });
    assert.equal(writes.get("statistics.json").mode, "local-timing");
    assert.deepEqual(
      Object.keys(writes.get("statistics.json").workloads),
      Object.keys(expectedChecksums)
    );
    assert.equal(writes.get("statistics.json").workloads.js.median, 2);
  }
);

test(
  "diagnostic evidence rejects dropped logs while retaining bounded logger counters",
  bounded,
  async () => {
    const { validateLogEvidence } = await import("../helpers.mjs");
    assert.equal(typeof validateLogEvidence, "function");
    const logger = createBoundedLogger(
      async () => {},
      value => value,
      4
    );
    logger.push("stdout", "12345\n");
    const evidence = await logger.finish();
    assert.equal(evidence.droppedBytes, 6);
    assert.throws(
      () => validateLogEvidence(evidence, "userland-cache"),
      /diagnostic.*log/i
    );
    assert.doesNotThrow(() => validateLogEvidence(evidence, "basic"));
    assert.doesNotThrow(() =>
      validateLogEvidence(
        { writtenBytes: 4, droppedBytes: 0 },
        "userland-cache"
      )
    );
    assert.throws(
      () => validateLogEvidence(undefined, "userland-cache"),
      /diagnostic.*log/i
    );
  }
);

test(
  "discovery waits for delayed private publication without reading incomplete contents",
  bounded,
  async () => {
    const directory = await mkdtemp("/tmp/codex/perf-discovery-");
    const path = join(directory, "control.json");
    await writeFile(path, "incomplete publication", { mode: 0o644 });
    await chmod(path, 0o644);
    const publication = delay(80).then(async () => {
      await writeFile(
        path,
        JSON.stringify({
          host: "localhost",
          port: 1234,
          path: "/umbrafox-control",
          token: "synthetic",
          websocketUrl: "ws://localhost:1234/umbrafox-control?token=synthetic",
        })
      );
      await chmod(path, 0o600);
    });
    try {
      const discovery = await readDiscovery(
        path,
        new AbortController().signal,
        1000
      );
      assert.equal(discovery.port, 1234);
    } finally {
      await publication;
    }
  }
);

test(
  "discovery fails closed on persistent public mode, missing publication and HALT",
  bounded,
  async () => {
    const directory = await mkdtemp("/tmp/codex/perf-discovery-");
    const path = join(directory, "control.json");
    await writeFile(path, "must not parse this non-private payload", {
      mode: 0o644,
    });
    await chmod(path, 0o644);
    await assert.rejects(
      readDiscovery(path, new AbortController().signal, 70),
      /timed out/
    );
    await assert.rejects(
      readDiscovery(
        join(directory, "missing.json"),
        new AbortController().signal,
        70
      ),
      /timed out/
    );
    const controller = new AbortController();
    const pending = assert.rejects(
      readDiscovery(path, controller.signal, 1000),
      /HALT/
    );
    controller.abort(new Error("HALT requested"));
    await pending;
  }
);

test(
  "discovery rejects non-regular files and hides malformed private payloads",
  bounded,
  async () => {
    const directory = await mkdtemp("/tmp/codex/perf-discovery-");
    const path = join(directory, "control.json");
    const invalid = "synthetic-private-payload-must-not-appear";
    await writeFile(path, invalid, { mode: 0o600 });
    const linked = join(directory, "linked.json");
    await symlink(path, linked);
    const signal = new AbortController().signal;
    await assert.rejects(
      readDiscovery(linked, signal, 1000),
      /owner-private regular file/
    );
    await assert.rejects(
      readDiscovery(directory, signal, 1000),
      /owner-private regular file/
    );
    await assert.rejects(readDiscovery(path, signal, 1000), error => {
      assert.equal(error.message, "Malformed discovery JSON");
      assert(!error.message.includes(invalid));
      return true;
    });
  }
);

test(
  "capture extraction preserves write failures, ordering and raw invalid evidence",
  bounded,
  async () => {
    for (const failWrite of [true, false]) {
      const writes = [];
      const requests = [];
      let started = false;
      const profile = "/isolated-test-profile";
      const args = {
        control: {
          async request(method) {
            requests.push(method);
            if (method === "umbrafox.diagnostics.snapshot") {
              return {
                processID: 1234,
                profileDir: profile,
                channel: "umbrafox-control",
              };
            }
            return { profiler: { active: false } };
          },
        },
        owned: { child: { pid: 1234 } },
        profile,
        options: { profile: "off", trials: 3, warmup: 1 },
        environment: { env: {} },
        root: "/unused-test-output",
        mode: "local-timing",
        async save(fileName, value) {
          writes.push({ fileName, value });
          if (failWrite && fileName === "graphics-before.json") {
            throw new Error("Evidence disk full");
          }
        },
        milestone() {},
        bounded: promise => promise,
        scrub: value => value,
        signal: new AbortController().signal,
        server: {
          start() {
            started = true;
          },
          result: Promise.resolve({ version: 1, samples: [] }),
        },
      };
      await assert.rejects(
        captureWorkloads(args),
        failWrite ? /Evidence disk full/ : /sample count/
      );
      assert.equal(started, !failWrite);
      assert.deepEqual(
        requests,
        failWrite
          ? ["umbrafox.diagnostics.snapshot", "umbrafox.gfx.snapshot"]
          : [
              "umbrafox.diagnostics.snapshot",
              "umbrafox.gfx.snapshot",
              "umbrafox.performance.snapshot",
            ]
      );
      if (!failWrite) {
        assert.deepEqual(writes.at(-1), {
          fileName: "samples.json",
          value: { version: 1, samples: [] },
        });
      }
    }
  }
);

test(
  "CLI requires explicit absolute paths and rejects ambiguous values",
  bounded,
  () => {
    const args = [
      "--binary",
      "/bin/browser",
      "--output",
      "/tmp/new",
      "--profile",
      "off",
      "--bus",
      "/tmp/bus",
    ];
    assert.equal(parseArgs(args).trials, 7);
    assert.throws(() => parseArgs([...args, "--profile", "on"]), /duplicate/i);
    assert.throws(() => parseArgs([...args, "--trials", "NaN"]), /trials/i);
    assert.throws(() => parseArgs([...args, "--trials", "2"]), /trials/i);
    assert.throws(() => parseArgs([...args, "--unknown", "x"]), /unknown/i);
    assert.throws(
      () =>
        parseArgs(args.map(value => (value === "/tmp/new" ? "./new" : value))),
      /absolute/i
    );
    assert.throws(() => parseArgs(args.slice(0, -1)), /value/i);
  }
);

test(
  "statistics retain raw samples, use sample deviation, reject nonfinite data",
  bounded,
  () => {
    const result = summarize([1, 2, 3, 4, 5]);
    assert.deepEqual(result.samples, [1, 2, 3, 4, 5]);
    assert.equal(result.median, 3);
    assert.equal(result.mean, 3);
    assert.equal(result.standardDeviation, Math.sqrt(2.5));
    assert.equal(result.p95, 5);
    assert.equal(result.minimum, 1);
    assert.equal(result.maximum, 5);
    for (const samples of [
      [],
      [1],
      [1, NaN],
      [1, Infinity],
      [1, -1],
      [1, "2"],
      [1e308, 1e308],
    ]) {
      assert.throws(() => summarize(samples));
    }
  }
);

test(
  "environment uses an allowlist and scrubs diagnostic/driver overrides",
  bounded,
  () => {
    const input = {
      PATH: "/bin",
      HOME: "/home/test",
      LANG: "C.UTF-8",
      SECRET: "do-not-record",
      MESA_LOADER_DRIVER_OVERRIDE: "zink",
      MOZ_PROFILER_STARTUP: "1",
      LD_PRELOAD: "/bad.so",
    };
    const off = browserEnvironment(input, "off", "basic", applicationPaths);
    assert.equal(off.env.SECRET, undefined);
    assert.equal(off.env.LD_PRELOAD, undefined);
    assert.equal(off.env.MESA_LOADER_DRIVER_OVERRIDE, undefined);
    assert.equal(off.env.MOZ_PROFILER_STARTUP, undefined);
    assert(off.scrubbed.includes("MESA_LOADER_DRIVER_OVERRIDE"));
    assert(!JSON.stringify(off).includes("do-not-record"));
    assert.equal(off.overridePresence.LP_PERF, null);
    assert.equal(
      browserEnvironment(
        { LP_DEBUG: "never-record" },
        "off",
        "basic",
        applicationPaths
      ).overridePresence.LP_DEBUG,
      "present-scrubbed"
    );
    assert.equal(
      browserEnvironment(input, "on", "basic", applicationPaths).env
        .MOZ_PROFILER_STARTUP,
      "1"
    );
  }
);

test(
  "discovery accepts only consistent owner-local authenticated endpoints",
  bounded,
  () => {
    const valid = {
      host: "localhost",
      port: 1234,
      path: "/umbrafox-control",
      token: "private-token",
      websocketUrl: "ws://localhost:1234/umbrafox-control?token=private-token",
    };
    assert.equal(validateDiscovery(valid), valid.websocketUrl);
    for (const replacement of [
      { host: "example.com" },
      { port: 0 },
      { token: "" },
      {
        websocketUrl:
          "ws://example.com:1234/umbrafox-control?token=private-token",
      },
      { websocketUrl: "ws://localhost:1234/umbrafox-control?token=other" },
    ]) {
      assert.throws(
        () => validateDiscovery({ ...valid, ...replacement }),
        /discovery/i
      );
    }
  }
);

test(
  "result validation rejects missing, duplicate, malformed and incorrect trials",
  bounded,
  () => {
    const config = { trials: 3, warmup: 1 };
    const rows = [];
    for (const stage of ["warmup", "trial"]) {
      for (let index = 0; index < (stage === "warmup" ? 1 : 3); index++) {
        for (const [workload, checksum] of Object.entries({
          js: 4290276580,
          "dom-batched": 25600,
          "dom-interleaved": 25600,
          canvas: 2296114373,
        })) {
          rows.push({ stage, index, workload, durationMs: 1, checksum });
        }
      }
    }
    const result = { version: 1, samples: rows };
    assert.doesNotThrow(() => validateResult(result, config));
    assert.throws(() =>
      validateResult({ ...result, samples: rows.slice(1) }, config)
    );
    assert.throws(() =>
      validateResult(
        { ...result, samples: [...rows.slice(1), rows[1]] },
        config
      )
    );
    for (const values of [
      { durationMs: null },
      { durationMs: Infinity },
      { durationMs: 300001 },
      { checksum: 0 },
      { index: -1 },
      { workload: "other" },
    ]) {
      assert.throws(() =>
        validateResult(
          { ...result, samples: [{ ...rows[0], ...values }, ...rows.slice(1)] },
          config
        )
      );
    }
  }
);

test(
  "fixture server rejects foreign origin, incorrect host, body overflow and duplicates",
  bounded,
  async t => {
    const server = await createFixtureServer({ trials: 3, warmup: 1 });
    t.after(() => server.close());
    assert.equal((await fetch(`${server.url}fixture.mjs`)).status, 200);
    assert.equal((await fetch(`${server.url}../helpers.mjs`)).status, 404);
    assert.equal(
      (
        await fetch(`${server.url}result`, {
          method: "POST",
          headers: { Origin: "https://example.com" },
          body: "{}",
        })
      ).status,
      403
    );
    const foreignHost = await new Promise((resolve, reject) => {
      const outgoing = request(
        server.url,
        { headers: { Host: "example.com" } },
        response => {
          response.resume();
          resolve(response.statusCode);
        }
      );
      outgoing.on("error", reject);
      outgoing.end();
    });
    assert.equal(foreignHost, 403);
    const gate = fetch(`${server.url}start`).then(response => response.json());
    server.start();
    assert.deepEqual(await gate, { trials: 3, warmup: 1 });
    assert.equal(
      (
        await fetch(`${server.url}result`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{",
        })
      ).status,
      400
    );
    assert.equal(
      (
        await fetch(`${server.url}result`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "x".repeat(70000),
        })
      ).status,
      413
    );
    assert.equal(
      (
        await fetch(`${server.url}result`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: '{"version":1}',
        })
      ).status,
      200
    );
    assert.deepEqual(await server.result, { version: 1 });
    assert.equal(
      (
        await fetch(`${server.url}result`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        })
      ).status,
      409
    );
  }
);

test(
  "real detached child identity and SIGTERM cleanup are proven",
  bounded,
  async t => {
    const owned = await spawnOwned(process.execPath, [
      "-e",
      "setInterval(() => {}, 1000)",
    ]);
    t.after(() => stopOwned(owned, 1500));
    const identity = await readIdentity(owned.child.pid);
    assert.equal(identity.parent, process.pid);
    assert.equal(identity.group, owned.child.pid);
    assert.equal(identity.session, owned.child.pid);
    assert.equal(identity.start, owned.identity.start);
    const cleanup = await stopOwned(owned, 1500);
    assert.equal(cleanup.status, "clean");
    assert.equal((await owned.completion).signal, "SIGTERM");
    assert.equal((await stopOwned(owned, 1500)).status, "clean");
  }
);

test(
  "spawn failure and early exit are handled without unhandled rejection",
  bounded,
  async () => {
    const missing = await spawnOwned("/definitely-not-a-program", []);
    assert.equal((await missing.completion).error.code, "ENOENT");
    assert.equal((await stopOwned(missing, 500)).status, "clean");
    const early = await spawnOwned(process.execPath, ["-e", "process.exit(7)"]);
    assert.equal((await early.completion).code, 7);
    assert.equal((await stopOwned(early, 500)).status, "clean");
  }
);

test(
  "identity mismatch refuses signaling; stubborn child reports failure without KILL",
  bounded,
  async () => {
    const directory = await mkdtemp(join(tmpdir(), "perf-child-"));
    const ready = join(directory, "ready");
    const script = `require('fs').writeFileSync(${JSON.stringify(ready)}, 'ready'); process.on('SIGTERM', () => {}); setTimeout(() => process.exit(0), 900);`;
    const owned = await spawnOwned(process.execPath, ["-e", script]);
    for (let attempt = 0; attempt < 50; attempt++) {
      try {
        await readFile(ready);
        break;
      } catch (error) {
        if (error.code !== "ENOENT") {
          throw error;
        }
        await delay(10);
      }
    }
    const identity = owned.identity;
    owned.identity = { ...identity, start: `${identity.start}0` };
    assert.equal((await stopOwned(owned, 50)).status, "cleanup-failed");
    owned.identity = { ...identity, group: process.pid };
    const actualKill = process.kill;
    const signals = [];
    process.kill = (...args) => signals.push(args);
    try {
      assert.equal((await stopOwned(owned, 50)).status, "cleanup-failed");
    } finally {
      process.kill = actualKill;
    }
    assert.deepEqual(signals, []);
    owned.identity = identity;
    assert.equal((await stopOwned(owned, 50)).status, "cleanup-failed");
    await delay(1000);
    assert.equal((await owned.completion).code, 0);
    assert.equal((await stopOwned(owned, 500)).status, "clean");
    await writeFile(join(directory, "evidence.json"), JSON.stringify(identity));
  }
);

test(
  "fixed fixture oracles agree with independently calculated scalar data",
  bounded,
  () => {
    let expected = 0;
    for (let block = 0; block < 64; block++) {
      for (let index = 0; index < 8192; index++) {
        const value = ((index + block) * 1664525 + 1013904223) % 4294967296;
        expected =
          (expected + ((value ^ Math.floor(value / 8192)) >>> 0)) % 4294967296;
      }
    }
    assert.equal(expected, 4290276580);
    assert.equal(arithmeticWorkload(), expected);
    const data = new Uint8ClampedArray(128 * 128 * 4);
    fillPixels(data);
    let hash = 2166136261n;
    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        const pixel = y * 128 + x;
        for (const channel of [pixel % 256, y, (pixel * 7) % 256, 255]) {
          hash = ((hash ^ BigInt(channel)) * 16777619n) & 0xffffffffn;
        }
      }
    }
    assert.equal(Number(hash), 2296114373);
    assert.equal(pixelHash(data), Number(hash));
  }
);

test(
  "bus HALT and invalid content fail closed; preflight retains failure artifacts and refuses reuse",
  bounded,
  async () => {
    const directory = await mkdtemp(join(tmpdir(), "perf-preflight-"));
    const bus = join(directory, "bus");
    await writeFile(bus, "HALT\n");
    await assert.rejects(checkBus(bus), /HALT/);
    await writeFile(bus, "unrecognized");
    await assert.rejects(checkBus(bus), /OK/);
    await writeFile(bus, "OK\n");
    const output = join(directory, "output");
    const args = [
      "--binary",
      "/definitely-missing-browser",
      "--output",
      output,
      "--profile",
      "off",
      "--bus",
      bus,
    ];
    await assert.rejects(main(args), /evidence retained/);
    const report = JSON.parse(await readFile(join(output, "run.json"), "utf8"));
    assert.equal(report.status, "failed");
    const initial = await readFile(join(output, "run.json"), "utf8");
    await assert.rejects(main(args), /EEXIST/);
    assert.equal(await readFile(join(output, "run.json"), "utf8"), initial);
    await writeFile(bus, "HALT\n");
    await assert.rejects(main(args), /HALT/);
  }
);

test(
  "deadline and abort failures are immediate and handled",
  bounded,
  async () => {
    await assert.rejects(
      withTimeout(new Promise(() => {}), 10, "operation"),
      /timed out/
    );
    const controller = new AbortController();
    controller.abort(new Error("HALT requested"));
    await assert.rejects(
      withTimeout(
        Promise.resolve("late"),
        1000,
        "operation",
        controller.signal
      ),
      /HALT/
    );
  }
);

test(
  "RPC resolves reordered replies and rejects errors, malformed data, close and timeout",
  bounded,
  async () => {
    const discovery = {
      host: "localhost",
      port: 1234,
      path: "/umbrafox-control",
      token: "never-log-this",
      websocketUrl: "ws://localhost:1234/umbrafox-control?token=never-log-this",
    };
    let current;
    /** Controllable transport for protocol ordering and failure tests. */
    class FakeSocket extends EventTarget {
      readyState = 1;
      sent = [];
      constructor() {
        super();
        current = this;
        queueMicrotask(() => this.dispatchEvent(new Event("open")));
      }
      send(value) {
        this.sent.push(JSON.parse(value));
      }
      close() {
        this.readyState = 3;
        this.dispatchEvent(new Event("close"));
      }
      reply(value) {
        this.dispatchEvent(new MessageEvent("message", { data: value }));
      }
    }
    const controller = new AbortController();
    const control = await connectControl(
      discovery,
      controller.signal,
      FakeSocket
    );
    const first = control.request("first");
    const second = control.request("second");
    current.reply(JSON.stringify({ id: current.sent[1].id, result: 2 }));
    current.reply(JSON.stringify({ id: current.sent[0].id, result: 1 }));
    assert.equal(await second, 2);
    assert.equal(await first, 1);
    const errorReply = assert.rejects(
      control.request("error"),
      /command failed/
    );
    current.reply(
      JSON.stringify({
        id: current.sent.at(-1).id,
        error: { message: discovery.token },
      })
    );
    await errorReply;
    const malformed = assert.rejects(
      control.request("malformed"),
      /connection failed/
    );
    current.reply("{");
    await malformed;
    await assert.rejects(
      control.request("after-malformed"),
      /connection failed/
    );
    control.close();
    const next = await connectControl(discovery, controller.signal, FakeSocket);
    const disconnected = assert.rejects(
      next.request("closed"),
      /connection failed/
    );
    current.close();
    await disconnected;
    await assert.rejects(next.request("after-close"), /connection failed/);
    const aborted = await connectControl(
      discovery,
      controller.signal,
      FakeSocket
    );
    const pending = assert.rejects(aborted.request("aborted"), /HALT/);
    controller.abort(new Error("HALT"));
    await pending;
    aborted.close();
    /** Transport that fails immediately after opening. */
    class ErrorSocket extends FakeSocket {
      constructor() {
        super();
        queueMicrotask(() => this.dispatchEvent(new Event("error")));
      }
    }
    const connection = await connectControl(discovery, undefined, ErrorSocket);
    await assert.rejects(connection.request("failed"), /connection failed/);
    connection.close();
  }
);

test(
  "browser log drains serialized writes, scrubs split tokens and caps terminal fragments",
  bounded,
  async () => {
    const chunks = [];
    const logger = createBoundedLogger(
      async text => {
        await delay(1);
        chunks.push(text);
      },
      text => text.replaceAll("secret", "[redacted]"),
      30
    );
    logger.push("stdout", "sec");
    logger.push("stdout", "ret\n");
    logger.push("stderr", "terminal");
    logger.push("extra", "x".repeat(40));
    const result = await logger.finish();
    assert.equal(chunks.join(""), "[redacted]\nterminal");
    assert.equal(result.writtenBytes, 19);
    assert.equal(result.droppedBytes, 40);
    const failed = createBoundedLogger(
      async () => {
        throw new Error("disk full");
      },
      text => text
    );
    failed.push("stdout", "one\n");
    await assert.rejects(failed.finish(), /disk full/);
  }
);

test(
  "real WebSocket authentication failure rejects without exposing token",
  bounded,
  async t => {
    const server = createServer((incoming, outgoing) => {
      outgoing.writeHead(403);
      outgoing.end();
    });
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    t.after(
      () =>
        new Promise(resolve => {
          server.closeAllConnections();
          server.close(resolve);
        })
    );
    const port = server.address().port;
    const discovery = {
      host: "127.0.0.1",
      port,
      path: "/umbrafox-control",
      token: "do-not-expose-token",
      websocketUrl: `ws://127.0.0.1:${port}/umbrafox-control?token=do-not-expose-token`,
    };
    await assert.rejects(connectControl(discovery), error => {
      assert(!error.message.includes(discovery.token));
      assert.match(error.message, /UmbraLink/);
      return true;
    });
  }
);

test(
  "SIGTERM reaches an owned descendant, while exited leader with live descendant is reported",
  bounded,
  async t => {
    const directory = await mkdtemp(join(tmpdir(), "perf-descendants-"));
    for (const leaveDescendant of [false, true]) {
      const marker = join(directory, `${leaveDescendant}.json`);
      const childScript = "setTimeout(() => {}, 1200)";
      const script = `const child=require('child_process').spawn(process.execPath,['-e',${JSON.stringify(childScript)}],{stdio:'ignore'}); require('fs').writeFileSync(${JSON.stringify(marker)},JSON.stringify({pid:child.pid})); ${leaveDescendant ? "child.unref(); setTimeout(() => process.exit(0),100);" : "setTimeout(() => {}, 1200);"}`;
      const owned = await spawnOwned(process.execPath, ["-e", script]);
      t.after(() => stopOwned(owned, 1500));
      let descendant;
      for (let attempt = 0; attempt < 50; attempt++) {
        try {
          descendant = JSON.parse(await readFile(marker, "utf8"));
          break;
        } catch (error) {
          if (error.code !== "ENOENT") {
            throw error;
          }
          await delay(10);
        }
      }
      assert(descendant?.pid);
      assert.equal((await readIdentity(descendant.pid)).group, owned.child.pid);
      if (leaveDescendant) {
        await owned.completion;
        const cleanup = await stopOwned(owned, 50);
        assert.equal(cleanup.status, "cleanup-failed");
        assert(cleanup.members.some(item => item.pid === descendant.pid));
        await delay(1300);
        assert.equal((await stopOwned(owned, 1000)).status, "clean");
      } else {
        assert.equal((await stopOwned(owned, 1500)).status, "clean");
        try {
          assert.equal((await readIdentity(descendant.pid)).state, "Z");
        } catch (error) {
          if (error.code !== "ENOENT") {
            throw error;
          }
        }
      }
    }
  }
);
