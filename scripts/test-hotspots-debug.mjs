#!/usr/bin/env node

/**
 * Debug script for analyze_hotspots tool
 * Tests against HMS codebase
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(scriptDir, "..");
const DIST_JS = path.join(PROJECT_DIR, "dist", "index.js");
const TARGET_DIR = "C:\\Users\\WSADMIN\\dexwox\\HMS\\dexhms_admin_be";
const TIMEOUT_MS = 120000; // 2 minutes

console.log("=================================");
console.log("ANALYZE_HOTSPOTS DEBUG TEST");
console.log("=================================");
console.log(`Target: ${TARGET_DIR}`);
console.log(`Server: ${DIST_JS}`);
console.log("");

// Check if target exists
if (!fs.existsSync(TARGET_DIR)) {
  console.error(`ERROR: Target directory does not exist: ${TARGET_DIR}`);
  process.exit(1);
}

if (!fs.existsSync(DIST_JS)) {
  console.error(`ERROR: Server not built. Run: npm run build`);
  process.exit(1);
}

const tests = [
  {
    id: 1,
    name: "index",
    label: "Index HMS Codebase",
    args: { directory: TARGET_DIR, incremental: false, fullScan: true },
  },
  {
    id: 2,
    name: "analyze_hotspots",
    label: "Analyze Hotspots (complexity)",
    args: { metric: "complexity", limit: 5 },
  },
  {
    id: 3,
    name: "analyze_hotspots",
    label: "Analyze Hotspots (coupling)",
    args: { metric: "coupling", limit: 3 },
  },
  {
    id: 4,
    name: "get_metrics",
    label: "Get System Metrics",
    args: {},
  },
];

const child = spawn(process.execPath, [DIST_JS, TARGET_DIR], {
  cwd: PROJECT_DIR,
  stdio: ["pipe", "pipe", "pipe"],
});

let stdoutBuf = "";
let stderrBuf = "";
const pending = new Map();
let currentTestIndex = 0;
let indexComplete = false;

const startTime = Date.now();

function log(msg) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[${elapsed}s] ${msg}`);
}

function sendNextTest() {
  if (currentTestIndex >= tests.length) {
    log("All tests sent. Waiting for responses...");
    return;
  }

  const test = tests[currentTestIndex];
  currentTestIndex++;

  const req = {
    jsonrpc: "2.0",
    id: test.id,
    method: "tools/call",
    params: { name: test.name, arguments: test.args },
  };

  pending.set(String(test.id), { ...test, sentAt: Date.now() });
  log(`SEND: ${test.label} (id=${test.id})`);
  
  try {
    child.stdin.write(JSON.stringify(req) + "\n");
  } catch (err) {
    log(`ERROR writing to stdin: ${err.message}`);
  }
}

function handleResponse(obj) {
  if (!obj || obj.id === undefined) return;

  const idKey = String(obj.id);
  const meta = pending.get(idKey);
  
  if (!meta) {
    log(`WARN: Received response for unknown id=${idKey}`);
    return;
  }

  const elapsed = ((Date.now() - meta.sentAt) / 1000).toFixed(2);
  
  if (obj.error) {
    log(`FAIL: ${meta.label} (${elapsed}s) - ERROR: ${JSON.stringify(obj.error)}`);
  } else if (obj.result) {
    let summary = "OK";
    try {
      const content = obj.result.content?.[0]?.text;
      if (content) {
        const parsed = JSON.parse(content);
        if (meta.name === "index") {
          const r = parsed.result?.results?.[0];
          summary = `${r?.filesProcessed || 0} files, ${r?.entitiesExtracted || 0} entities`;
        } else if (meta.name === "analyze_hotspots") {
          summary = `${parsed.hotspots?.length || 0} hotspots, sample=${parsed.sampleSize || 0}`;
        } else if (meta.name === "get_metrics") {
          summary = `conductor: ${parsed.conductor?.status || "unknown"}`;
        }
      }
    } catch (e) {
      // Keep default summary
    }
    log(`PASS: ${meta.label} (${elapsed}s) - ${summary}`);
  }

  pending.delete(idKey);

  // If this was the index, send the rest
  if (meta.name === "index" && !indexComplete) {
    indexComplete = true;
    log("Index complete. Sending remaining tests in 1s...");
    setTimeout(() => {
      while (currentTestIndex < tests.length) {
        sendNextTest();
      }
    }, 1000);
  }

  // Check if all done
  if (pending.size === 0 && currentTestIndex >= tests.length) {
    log("All tests complete. Shutting down...");
    setTimeout(() => {
      try {
        child.kill("SIGTERM");
      } catch {}
    }, 500);
  }
}

let multilineBuffer = "";

function processLine(line) {
  if (!line.trim()) return;

  let parsed = null;
  try {
    parsed = JSON.parse(line);
  } catch {
    // Try multiline assembly
    multilineBuffer = multilineBuffer ? multilineBuffer + "\n" + line : line;
    try {
      parsed = JSON.parse(multilineBuffer);
      multilineBuffer = "";
    } catch {
      // Still incomplete
    }
  }

  if (parsed) {
    handleResponse(parsed);
  }
}

child.stdout.on("data", (chunk) => {
  const text = chunk.toString("utf8");
  stdoutBuf += text;
  
  let idx;
  while ((idx = stdoutBuf.indexOf("\n")) >= 0) {
    const line = stdoutBuf.slice(0, idx).trimEnd();
    stdoutBuf = stdoutBuf.slice(idx + 1);
    if (line) processLine(line);
  }
});

child.stderr.on("data", (chunk) => {
  const text = chunk.toString("utf8");
  stderrBuf += text;
  // Log stderr in real-time for debugging
  process.stderr.write(text);
});

child.on("error", (err) => {
  log(`Child process error: ${err.message}`);
});

child.on("close", (code, signal) => {
  clearTimeout(killTimer);
  
  log(`Process exited: code=${code}, signal=${signal}`);
  
  if (pending.size > 0) {
    log(`WARNING: ${pending.size} pending requests never completed:`);
    for (const [id, meta] of pending.entries()) {
      const elapsed = ((Date.now() - meta.sentAt) / 1000).toFixed(2);
      log(`  - ${meta.label} (id=${id}, waiting ${elapsed}s)`);
    }
  }
  
  if (code !== 0 && code !== null) {
    process.exit(code);
  }
});

// Hard timeout
const killTimer = setTimeout(() => {
  log(`TIMEOUT after ${TIMEOUT_MS / 1000}s - killing process`);
  
  if (pending.size > 0) {
    log(`Pending requests at timeout:`);
    for (const [id, meta] of pending.entries()) {
      const elapsed = ((Date.now() - meta.sentAt) / 1000).toFixed(2);
      log(`  - ${meta.label} (id=${id}, waiting ${elapsed}s)`);
    }
  }
  
  try {
    child.kill("SIGKILL");
  } catch {}
  process.exit(124);
}, TIMEOUT_MS);

// Start with index
log("Starting test sequence...");
sendNextTest();
