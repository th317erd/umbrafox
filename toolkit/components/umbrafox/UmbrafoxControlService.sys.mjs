/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { WebSocketConnection } from "chrome://remote/content/shared/WebSocketConnection.sys.mjs";

const lazy = {};

ChromeUtils.defineESModuleGetters(lazy, {
  HttpServer: "chrome://remote/content/server/httpd.sys.mjs",
  UmbrafoxControlInput: "resource://gre/modules/UmbrafoxControlInput.sys.mjs",
});

const PREF_ENABLED = "umbrafox.control.enabled";
const PREF_PORT = "umbrafox.control.port";

const DEFAULT_HOST = "localhost";
const DEFAULT_PATH = "/umbrafox-control";
const WEBSOCKET_KEY_SUFFIX = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

function makeToken() {
  return Services.uuid.generateUUID().toString().replace(/[{}]/g, "");
}

function writeJSONResponse(response, request, statusCode, statusText, body) {
  response.setStatusLine(request.httpVersion, statusCode, statusText);
  response.setHeader("Content-Type", "application/json", false);
  response.write(JSON.stringify(body));
}

function writeString(output, data) {
  return new Promise((resolve, reject) => {
    const wait = () => {
      if (!data.length) {
        resolve();
        return;
      }

      output.asyncWait(
        () => {
          try {
            const written = output.write(data, data.length);
            data = data.slice(written);
            wait();
          } catch (error) {
            reject(error);
          }
        },
        0,
        0,
        Services.tm.currentThread
      );
    };

    wait();
  });
}

function writeHttpResponse(output, headers, body = "") {
  headers.push(`Content-Length: ${body.length}`);
  return writeString(output, `${headers.join("\r\n")}\r\n\r\n${body}`);
}

function computeWebSocketAcceptKey(key) {
  const data = Array.from(`${key}${WEBSOCKET_KEY_SUFFIX}`, ch =>
    ch.charCodeAt(0)
  );
  const hash = Cc["@mozilla.org/security/hash;1"].createInstance(
    Ci.nsICryptoHash
  );
  hash.init(hash.SHA1);
  hash.update(data, data.length);
  return hash.finish(true);
}

function validateWebSocketRequest(requestLine, headers) {
  if (requestLine.split(" ")[0] !== "GET") {
    throw new Error("The handshake request must use GET method");
  }

  const upgrade = headers.get("upgrade");
  if (!upgrade || upgrade.toLowerCase() !== "websocket") {
    throw new Error(`Incorrect Upgrade header: ${upgrade}`);
  }

  const connection = headers.get("connection");
  if (
    !connection ||
    !connection
      .split(",")
      .map(token => token.trim().toLowerCase())
      .includes("upgrade")
  ) {
    throw new Error("Incorrect Connection header");
  }

  const version = headers.get("sec-websocket-version");
  if (version !== "13") {
    throw new Error("The handshake request must use WebSocket version 13");
  }

  const key = headers.get("sec-websocket-key");
  if (!key) {
    throw new Error("Missing Sec-WebSocket-Key header");
  }

  return computeWebSocketAcceptKey(key);
}

async function createServerWebSocket(transport, input, output) {
  const transportProvider = {
    setListener(upgradeListener) {
      Services.tm.dispatchToMainThread(() =>
        upgradeListener.onTransportAvailable(transport, input, output)
      );
    },
  };

  return new Promise((resolve, reject) => {
    const socket = WebSocket.createServerWebSocket(
      null,
      [],
      transportProvider,
      ""
    );
    socket.addEventListener("close", () => {
      input.close();
      output.close();
    });

    socket.onopen = () => resolve(socket);
    socket.onerror = error => reject(error);
  });
}

async function upgradeWebSocket(request, response) {
  response._powerSeized = true;

  const { transport, input, output } = response._connection;
  const headers = new Map();
  for (const [key, values] of Object.entries(request._headers._headers)) {
    headers.set(key, values.join("\n"));
  }

  try {
    const acceptKey = validateWebSocketRequest(
      `${request.method} ${request.path}`,
      headers
    );
    await writeHttpResponse(output, [
      "HTTP/1.1 101 Switching Protocols",
      "Server: httpd.js",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${acceptKey}`,
    ]);
  } catch (error) {
    await writeHttpResponse(
      output,
      [
        "HTTP/1.1 400 Bad Request",
        "Server: httpd.js",
        "Content-Type: text/plain",
      ],
      error.message
    );
    throw error;
  }

  return createServerWebSocket(transport, input, output);
}

/**
 * WebSocket connection for the Umbrafox JSON command protocol.
 */
class UmbrafoxControlConnection extends WebSocketConnection {
  constructor(webSocket, httpdConnection, service) {
    super(webSocket, httpdConnection);
    this.#service = service;
  }

  #service;

  async onPacket(packet) {
    await super.onPacket(packet);

    const id = packet?.id ?? null;
    try {
      const result = await this.#service.execute(packet);
      this.send({ id, result });
    } catch (error) {
      this.send({
        id,
        error: {
          code: error.code ?? "unknown error",
          message: error.message,
        },
      });
    }
  }

  onConnectionClose() {
    super.onConnectionClose();
    this.#service.removeConnection(this);
  }
}

/**
 * HTTP handler that authenticates and upgrades Umbrafox control sockets.
 */
class UmbrafoxControlHandler {
  constructor(service) {
    this.#service = service;
  }

  #service;

  async handle(request, response) {
    const params = new URLSearchParams(request.queryString);
    if (params.get("token") !== this.#service.token) {
      writeJSONResponse(response, request, 403, "Forbidden", {
        error: "forbidden",
      });
      return;
    }

    const webSocket = await upgradeWebSocket(request, response);
    this.#service.addConnection(
      new UmbrafoxControlConnection(
        webSocket,
        response._connection,
        this.#service
      )
    );
  }

  QueryInterface = ChromeUtils.generateQI(["nsIHttpRequestHandler"]);
}

/**
 * Local loopback control service for privileged Umbrafox automation clients.
 */
class UmbrafoxControlServiceImpl {
  #connections = new Set();
  #host = DEFAULT_HOST;
  #path = DEFAULT_PATH;
  #port = 0;
  #server = null;
  #statusPath = null;
  #token = null;

  get enabledByPref() {
    return Services.prefs.getBoolPref(PREF_ENABLED, false);
  }

  get running() {
    return !!this.#server && !this.#server.isStopped();
  }

  get token() {
    return this.#token;
  }

  async maybeStart() {
    if (!this.enabledByPref) {
      return;
    }

    await this.start();
  }

  async start(options = {}) {
    if (this.running) {
      return this.status();
    }

    const requestedPort =
      options.port ?? Services.prefs.getIntPref(PREF_PORT, 0);
    const port = requestedPort === 0 ? -1 : requestedPort;

    try {
      this.#token = options.token ?? makeToken();
      this.#server = new lazy.HttpServer();
      this.#server._start(port, this.#host);
      this.#port = this.#server._port;
      this.#server.registerPathHandler(
        this.#path,
        new UmbrafoxControlHandler(this)
      );

      await this.#writeStatusFile();
      return this.status();
    } catch (error) {
      await this.stop();
      throw error;
    }
  }

  async stop() {
    for (const connection of this.#connections) {
      connection.close();
    }
    this.#connections.clear();

    if (this.#server) {
      await this.#server.stop();
      this.#server = null;
    }

    await this.#removeStatusFile();
    this.#port = 0;
    this.#token = null;
  }

  async resetForTests() {
    await this.stop();
    lazy.UmbrafoxControlInput.resetForTests();
  }

  addConnection(connection) {
    this.#connections.add(connection);
  }

  removeConnection(connection) {
    this.#connections.delete(connection);
  }

  async execute(packet) {
    if (!packet || typeof packet !== "object") {
      throw this.#error("invalid argument", "Expected a command object");
    }

    switch (packet.method) {
      case "umbrafox.input.pointerMove":
        return lazy.UmbrafoxControlInput.pointerMove(packet.params);
      case "umbrafox.status":
        return this.status();
      default:
        throw this.#error(
          "unknown command",
          `Unknown method: ${packet.method}`
        );
    }
  }

  status() {
    return {
      channel: "umbrafox-control",
      protocol: "umbrafox-json",
      running: this.running,
      host: this.#host,
      port: this.#port,
      path: this.#path,
      appName: Services.appinfo.name,
      appVersion: Services.appinfo.version,
      platformVersion: Services.appinfo.platformVersion,
      appBuildID: Services.appinfo.appBuildID,
    };
  }

  getStatusFilePath() {
    return PathUtils.join(PathUtils.profileDir, "umbrafox", "control.json");
  }

  async #writeStatusFile() {
    this.#statusPath = this.getStatusFilePath();
    await IOUtils.makeDirectory(PathUtils.parent(this.#statusPath), {
      ignoreExisting: true,
      permissions: 0o700,
    });

    const status = this.status();
    const websocketUrl = `ws://${status.host}:${status.port}${status.path}?token=${encodeURIComponent(
      this.#token
    )}`;

    await IOUtils.writeUTF8(
      this.#statusPath,
      JSON.stringify(
        {
          host: status.host,
          port: status.port,
          path: status.path,
          token: this.#token,
          websocketUrl,
        },
        null,
        2
      ),
      { mode: "overwrite" }
    );
    await IOUtils.setPermissions(this.#statusPath, 0o600);
  }

  async #removeStatusFile() {
    if (!this.#statusPath) {
      return;
    }

    try {
      await IOUtils.remove(this.#statusPath);
    } catch (error) {
      if (!DOMException.isInstance(error) || error.name !== "NotFoundError") {
        console.error("Failed to remove Umbrafox control status file", error);
      }
    }
    this.#statusPath = null;
  }

  #error(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }
}

export const UmbrafoxControlService = new UmbrafoxControlServiceImpl();
