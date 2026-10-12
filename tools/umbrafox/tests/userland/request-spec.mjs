/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { setImmediate } from "node:timers";
import vm from "node:vm";

const source = await readFile(
  new URL(
    "../../../../toolkit/components/umbrafox/UmbrafoxUserlandEventController.sys.mjs",
    import.meta.url
  ),
  "utf8"
);

function fixture(unwrap = value => value, requestActor = null) {
  const errors = [];
  const scope = vm.createContext({
    URL,
    console: { error: error => errors.push(error) },
    ChromeUtils: { generateQI: () => () => {} },
    Ci: { nsIHttpHeaderVisitor: {} },
    Cu: { unwaiveXrays: unwrap, waiveXrays: value => value },
    BrowsingContext: {
      get: () => ({ currentWindowGlobal: { getActor: () => requestActor } }),
    },
    Cr: { NS_ERROR_ABORT: "aborted" },
    Services: {
      appinfo: { processType: 0, PROCESS_TYPE_DEFAULT: 0 },
      obs: { addObserver() {} },
      io: { newURI: value => value },
    },
  });
  vm.runInContext(source.replace(/^export (?=function |class )/gm, ""), scope, {
    timeout: 1000,
  });
  const api = vm.runInContext(
    `({
      fields: getRequestEventFields,
      dispatch: dispatchParentRequestEvent,
      child: dispatchUmbrafoxUserlandRequest,
      observer: nativeRequestObserver,
      prepare: prepareUmbrafoxUserlandRequestCapability,
      Controller: UmbrafoxUserlandEventController
    })`,
    scope,
    { timeout: 1000 }
  );
  return { ...api, errors };
}

function channel(headers = []) {
  const calls = [];
  return {
    calls,
    URI: { spec: "https://fixture.invalid/resource" },
    requestMethod: "GET",
    loadInfo: {
      targetBrowsingContextID: 2,
      frameBrowsingContextID: 3,
      associatedBrowsingContextID: 4,
      innerWindowID: 5,
      externalContentPolicyType: 6,
      originAttributes: { privateBrowsingId: 1, userContextId: 2 },
    },
    visitRequestHeaders(visitor) {
      calls.push("headers");
      for (const [headerName, value] of headers) {
        visitor.visitHeader(headerName, value);
      }
    },
    suspend() {
      calls.push("suspend");
    },
    resume() {
      calls.push("resume");
    },
    cancel(reason) {
      calls.push(["cancel", reason]);
    },
    redirectTo(uri) {
      calls.push(["redirect", uri]);
    },
    setRequestHeader(headerName, value, merge) {
      calls.push(["header", headerName, value, merge]);
    },
    setEmptyRequestHeader(headerName) {
      calls.push(["empty", headerName]);
    },
    getRequestHeader() {
      return "";
    },
  };
}

const plain = value => JSON.parse(JSON.stringify(value));

test("a proven negative avoids suspension, header reads and the actor query", async () => {
  let queries = 0;
  const f = fixture(undefined, {
    canSkipRequest(contextId, innerWindowId) {
      assert.equal(contextId, 1);
      assert.equal(innerWindowId, 5);
      return true;
    },
    async sendQuery() {
      queries++;
      return null;
    },
  });
  const request = channel();
  request.loadInfo.browsingContextID = 1;
  request.QueryInterface = () => request;
  f.observer.observe(request, "http-on-modify-request");
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(request.calls, []);
  assert.equal(queries, 0);
  assert.deepEqual(f.errors, []);
});

test("unknown, malformed or failed negative checks retain the full request path", async () => {
  for (const mode of [false, null, undefined, "true", 1, "throw"]) {
    let queries = 0;
    const f = fixture(undefined, {
      canSkipRequest() {
        if (mode === "throw") {
          throw new Error("unknown");
        }
        return mode;
      },
      async sendQuery() {
        queries++;
        return null;
      },
    });
    const request = channel();
    request.loadInfo.browsingContextID = 1;
    request.QueryInterface = () => request;
    f.observer.observe(request, "http-on-modify-request");
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(request.calls, ["suspend", "headers", "resume"]);
    assert.equal(queries, 1);
    assert.equal(f.errors.length, mode === "throw" ? 1 : 0);
  }
});

function documentWindow(innerWindowId, browsingContextId = 1) {
  return {
    browsingContext: { id: browsingContextId },
    windowGlobalChild: {
      innerWindowId,
      browsingContext: { id: browsingContextId },
      getActor: () => ({
        sendQuery: async (messageName, data) => ({ ...data }),
      }),
    },
  };
}

test("request controllers do not leak into another document in the same context", async () => {
  const f = fixture();
  const original = documentWindow(101);
  const next = documentWindow(102);
  await f.prepare(original);
  const controller = new f.Controller(original);
  let calls = 0;
  controller.addEventListener("request", () => calls++);
  assert.equal(
    f.child(next, { browsingContextId: 1, innerWindowId: 102 }),
    null
  );
  assert.equal(calls, 0);
  f.child(original, { browsingContextId: 1, innerWindowId: 101 });
  assert.equal(calls, 1);
});

test("retained documents keep independent request controllers and late handlers", async () => {
  const f = fixture();
  const original = documentWindow(101);
  const next = documentWindow(102);
  await f.prepare(original);
  await f.prepare(next);
  const first = new f.Controller(original);
  const second = new f.Controller(next);
  const calls = [];
  const firstHandler = () => calls.push("first");
  first.addEventListener("request", firstHandler);
  second.addEventListener("request", () => calls.push("second"));
  f.child(original, { browsingContextId: 1, innerWindowId: 101 });
  f.child(next, { browsingContextId: 1, innerWindowId: 102 });
  assert.deepEqual(calls, ["first", "second"]);
  first.removeEventListener("request", firstHandler);
  f.child(original, { browsingContextId: 1, innerWindowId: 101 });
  first.addEventListener("request", firstHandler);
  f.child(next, { browsingContextId: 1, innerWindowId: 102 });
  f.child(original, { browsingContextId: 1, innerWindowId: 101 });
  assert.deepEqual(calls, ["first", "second", "second", "first"]);
});

test("stale request identity does not reach the current document handler", async () => {
  const f = fixture();
  const current = documentWindow(102);
  await f.prepare(current);
  const controller = new f.Controller(current);
  let calls = 0;
  controller.addEventListener("request", () => calls++);
  for (const innerWindowId of [101, "102", -1, NaN]) {
    f.child(current, { browsingContextId: 1, innerWindowId });
  }
  f.child(current, { browsingContextId: 2, innerWindowId: 102 });
  assert.equal(calls, 0);
  f.child(current, { browsingContextId: 1, innerWindowId: 0 });
  f.child(current, { browsingContextId: 1 });
  assert.equal(
    calls,
    2,
    "Missing request IDs retain current-document dispatch"
  );
});

test("request registration retains its construction document identity", async () => {
  const f = fixture();
  const nativeWindow = documentWindow(101);
  await f.prepare(nativeWindow);
  const controller = new f.Controller(nativeWindow);
  let calls = 0;
  nativeWindow.windowGlobalChild = { innerWindowId: 102 };
  controller.addEventListener("request", () => calls++);
  f.child(nativeWindow, { browsingContextId: 1, innerWindowId: 102 });
  assert.equal(calls, 0);
  f.child(documentWindow(101), { browsingContextId: 1, innerWindowId: 101 });
  assert.equal(calls, 1);
});

test("waived windows use their native chrome-only document identity", async () => {
  const nativeWindow = documentWindow(101);
  const waived = {};
  const f = fixture(value => (value === waived ? nativeWindow : value));
  await f.prepare(waived);
  const controller = new f.Controller(waived, { browsingContextId: 1 });
  let calls = 0;
  controller.addEventListener("request", () => calls++);
  f.child(nativeWindow, { browsingContextId: 1, innerWindowId: 101 });
  assert.equal(calls, 1);
  assert.equal(controller.innerWindowId, 101);
});

test("parent request payload sends headers once and retains all other fields", () => {
  const f = fixture();
  const headers = [
    ["Accept", "text/plain"],
    ["X-Empty", ""],
  ];
  const fields = f.fields(channel(headers), 1);
  assert.equal(Object.hasOwn(fields, "originalHeaders"), false);
  assert.deepEqual(plain(fields), {
    url: "https://fixture.invalid/resource",
    uri: "https://fixture.invalid/resource",
    originalUrl: "https://fixture.invalid/resource",
    originalUri: "https://fixture.invalid/resource",
    method: "GET",
    originalMethod: "GET",
    headers,
    browsingContextId: 1,
    targetBrowsingContextId: 2,
    frameBrowsingContextId: 3,
    associatedBrowsingContextId: 4,
    innerWindowId: 5,
    contentPolicyType: 6,
    privateBrowsing: true,
    native: true,
  });
});

for (const headers of [
  [],
  [
    ["Accept", "text/plain"],
    ["X-Empty", ""],
  ],
  [
    ["X-Duplicate", "first"],
    ["X-Duplicate", "last"],
    ["x-duplicate", "case"],
  ],
  [
    ["__proto__", "data"],
    ["constructor", "value"],
    ["X-Unicode", "\u00e9"],
  ],
]) {
  test(`child preserves frozen originals for ${JSON.stringify(headers)}`, () => {
    const f = fixture();
    const controller = new f.Controller(
      { console: { error: error => f.errors.push(error) } },
      { browsingContextId: 1 }
    );
    let observed;
    controller.addEventListener("request", event => {
      observed = event;
      assert.equal(Object.isFrozen(event.originalHeaders), true);
      assert.deepEqual(
        plain(event.originalHeaders),
        Object.fromEntries(headers)
      );
      event.headers.set("X-Added", "new");
      event.headers.delete("Accept");
      assert.equal(Object.hasOwn(event.originalHeaders, "X-Added"), false);
      assert.deepEqual(
        plain(event.originalHeaders),
        Object.fromEntries(headers)
      );
    });
    const fields = structuredClone(f.fields(channel(headers), 1));
    const decision = f.child(null, fields);
    assert(observed);
    assert.equal(f.errors.length, 0);
    assert.equal(fields.headers.length, headers.length);
    assert(decision.headers.some(item => item.name === "X-Added"));
  });
}

test("missing controller and side-effect-only handlers still query and resume", async () => {
  const f = fixture();
  let queries = 0;
  let handlers = 0;
  const actor = {
    async sendQuery(messageName, fields) {
      assert.equal(messageName, "DispatchUserlandRequest");
      queries++;
      return f.child(null, structuredClone(fields));
    },
  };
  const controller = new f.Controller({}, { browsingContextId: 1 });
  const handler = () => handlers++;
  for (let phase = 0; phase < 4; phase++) {
    if (phase === 1 || phase === 3) {
      controller.addEventListener("request", handler);
    } else if (phase === 2) {
      controller.removeEventListener("request", handler);
    }
    const request = channel([["Accept", "text/plain"]]);
    await f.dispatch(request, actor, 1);
    assert.deepEqual(request.calls, ["suspend", "headers", "resume"]);
  }
  assert.equal(queries, 4);
  assert.equal(handlers, 2);
  assert.equal(f.errors.length, 0);
});

test("decisions preserve resume, cancellation, redirects and header changes", async () => {
  for (const [decision, expected] of [
    [null, ["resume"]],
    [{ cancel: true }, ["resume", ["cancel", "aborted"]]],
    [
      { syntheticResponse: "body" },
      ["resume", ["redirect", "data:text/plain;charset=utf-8,body"]],
    ],
    [
      {
        method: "POST",
        url: "https://fixture.invalid/other",
        headers: [
          { name: "X-A", value: "b" },
          { name: "X-Empty", value: "" },
          { name: "X-Gone", deleted: true },
        ],
      },
      [
        ["header", "X-A", "b", false],
        ["empty", "X-Empty"],
        ["header", "X-Gone", "", false],
        ["redirect", "https://fixture.invalid/other"],
        "resume",
      ],
    ],
  ]) {
    const f = fixture();
    const request = channel();
    await f.dispatch(request, { sendQuery: async () => decision }, 1);
    assert.deepEqual(request.calls, ["suspend", "headers", ...expected]);
    assert.equal(request.requestMethod, decision?.method ?? "GET");
    assert.equal(f.errors.length, 0);
  }
});

test("query and header-read failures balance suspension without extra dispatch", async () => {
  for (const failure of ["headers", "query", "abort", "suspend", "resume"]) {
    const f = fixture();
    const request = channel();
    let queries = 0;
    const error = new Error(failure);
    if (failure === "abort") {
      error.name = "AbortError";
    }
    if (["headers", "suspend", "resume"].includes(failure)) {
      const method = failure === "headers" ? "visitRequestHeaders" : failure;
      request[method] = () => {
        request.calls.push(failure);
        throw error;
      };
    }
    await f.dispatch(
      request,
      {
        sendQuery: async () => {
          queries++;
          if (["query", "abort"].includes(failure)) {
            throw error;
          }
          return null;
        },
      },
      1
    );
    assert.equal(queries, ["headers", "suspend"].includes(failure) ? 0 : 1);
    assert.equal(
      request.calls.filter(value => value === "resume").length,
      failure === "suspend" ? 0 : 1
    );
    assert.equal(f.errors.length, failure === "abort" ? 0 : 1);
  }
});

test("parallel replies retain channel-local headers and resume exactly once", async () => {
  const f = fixture();
  const replies = [];
  const actor = {
    sendQuery: (messageName, fields) =>
      new Promise(resolve => {
        assert.equal(messageName, "DispatchUserlandRequest");
        replies.push({ fields: structuredClone(fields), resolve });
      }),
  };
  const first = channel([["X-Request", "first"]]);
  const second = channel([["X-Request", "second"]]);
  const pending = [f.dispatch(first, actor, 1), f.dispatch(second, actor, 2)];
  assert.equal(replies.length, 2);
  assert.deepEqual(first.calls, ["suspend", "headers"]);
  assert.deepEqual(second.calls, ["suspend", "headers"]);
  assert.deepEqual(replies[0].fields.headers, [["X-Request", "first"]]);
  assert.deepEqual(replies[1].fields.headers, [["X-Request", "second"]]);
  replies[1].resolve(null);
  await pending[1];
  assert.deepEqual(first.calls, ["suspend", "headers"]);
  replies[0].resolve(null);
  await pending[0];
  assert.deepEqual(first.calls, ["suspend", "headers", "resume"]);
  assert.deepEqual(second.calls, ["suspend", "headers", "resume"]);
});
