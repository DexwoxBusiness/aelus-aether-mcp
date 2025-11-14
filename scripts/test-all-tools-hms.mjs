#!/usr/bin/env node

/**
 * Comprehensive tool test for HMS codebase
 * Tests all MCP tools to ensure they work correctly
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(scriptDir, "..");
const DIST_JS = path.join(PROJECT_DIR, "dist", "index.js");
const TARGET_DIR = "C:\\Users\\WSADMIN\\dexwox\\HMS\\dexhms_admin_be";
const TIMEOUT_MS = 180000; // 3 minutes

console.log("=================================");
console.log("COMPREHENSIVE MCP TOOLS TEST");
console.log("=================================");
console.log(`Target: ${TARGET_DIR}`);
console.log(`Server: ${DIST_JS}`);
console.log("");

// Check prerequisites
if (!fs.existsSync(TARGET_DIR)) {
  console.error(`ERROR: Target directory does not exist: ${TARGET_DIR}`);
  process.exit(1);
}

if (!fs.existsSync(DIST_JS)) {
  console.error(`ERROR: Server not built. Run: npm run build`);
  process.exit(1);
}

// Find a sample file for testing
function findSampleFile(dir, maxDepth = 3) {
  const excludeDirs = new Set(["node_modules", ".git", "dist", "build", "coverage"]);
  const codeExts = new Set([".js", ".ts", ".py", ".java"]);
  
  function search(currentDir, depth) {
    if (depth > maxDepth) return null;
    
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory() && !excludeDirs.has(entry.name)) {
          const found = search(fullPath, depth + 1);
          if (found) return found;
        } else if (entry.isFile() && codeExts.has(path.extname(entry.name))) {
          return fullPath;
        }
      }
    } catch (e) {
      // Skip inaccessible directories
    }
    
    return null;
  }
  
  return search(dir, 0);
}

const sampleFile = findSampleFile(TARGET_DIR);
if (!sampleFile) {
  console.error("ERROR: Could not find a sample code file");
  process.exit(1);
}

const sampleEntity = path.basename(sampleFile, path.extname(sampleFile));
console.log(`Sample file: ${sampleFile}`);
console.log(`Sample entity: ${sampleEntity}`);
console.log("");

// Define test suite
const tests = [
  {
    id: 1,
    name: "index",
    label: "Index Codebase",
    args: { directory: TARGET_DIR, incremental: false, fullScan: true },
    critical: true,
  },
  // Structural tools
  {
    id: 2,
    name: "list_file_entities",
    label: "List File Entities",
    args: { filePath: sampleFile },
  },
  {
    id: 3,
    name: "list_entity_relationships",
    label: "List Entity Relationships",
    args: { entityName: sampleEntity, filePath: sampleFile, depth: 1 },
  },
  {
    id: 4,
    name: "analyze_hotspots",
    label: "Analyze Hotspots (complexity)",
    args: { metric: "complexity", limit: 5 },
  },
  {
    id: 5,
    name: "analyze_hotspots",
    label: "Analyze Hotspots (coupling)",
    args: { metric: "coupling", limit: 3 },
  },
  {
    id: 6,
    name: "analyze_hotspots",
    label: "Analyze Hotspots (changes)",
    args: { metric: "changes", limit: 3 },
  },
  // Semantic tools
  {
    id: 7,
    name: "semantic_search",
    label: "Semantic Search",
    args: { query: "database connection pool", limit: 5 },
  },
  {
    id: 8,
    name: "find_similar_code",
    label: "Find Similar Code",
    args: { code: "function connect() { return db.connect(); }", threshold: 0.5, limit: 5 },
  },
  {
    id: 9,
    name: "detect_code_clones",
    label: "Detect Code Clones",
    args: { minSimilarity: 0.7, scope: "all" },
  },
  {
    id: 10,
    name: "cross_language_search",
    label: "Cross Language Search",
    args: { query: "authentication middleware", languages: ["javascript", "typescript"] },
  },
  {
    id: 11,
    name: "find_related_concepts",
    label: "Find Related Concepts",
    args: { entityId: sampleEntity, limit: 5 },
  },
  // Impact & refactoring
  {
    id: 12,
    name: "analyze_code_impact",
    label: "Analyze Code Impact",
    args: { entityId: sampleEntity, filePath: sampleFile, depth: 2 },
  },
  {
    id: 13,
    name: "suggest_refactoring",
    label: "Suggest Refactoring",
    args: { filePath: sampleFile },
  },
  // System metrics
  {
    id: 14,
    name: "get_metrics",
    label: "Get System Metrics",
    args: {},
  },
];

// Test execution
const child = spawn(process.execPath, [DIST_JS, TARGET_DIR], {
  cwd: PROJECT_DIR,
  stdio: ["pipe", "pipe", "pipe"],
});

let stdoutBuf = "";
const pending = new Map();
const results = new Map();
let currentTestIndex = 0;
let indexComplete = false;

const startTime = Date.now();

function log(msg) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[${elapsed}s] ${msg}`);
}

function sendNextTest() {
  if (currentTestIndex >= tests.length) {
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
    return;
  }

  const elapsed = ((Date.now() - meta.sentAt) / 1000).toFixed(2);
  let status = "UNKNOWN";
  let summary = "";
  
  if (obj.error) {
    status = "FAIL";
    summary = `ERROR: ${obj.error.message || JSON.stringify(obj.error)}`;
    results.set(meta.name, { status: "fail", error: obj.error });
  } else if (obj.result) {
    status = "PASS";
    
    try {
      const content = obj.result.content?.[0]?.text;
      if (content) {
        const parsed = JSON.parse(content);
        
        // Extract meaningful summary based on tool
        if (meta.name === "index") {
          const r = parsed.result?.results?.[0];
          summary = `${r?.filesProcessed || 0} files, ${r?.entitiesExtracted || 0} entities`;
        } else if (meta.name === "analyze_hotspots") {
          summary = `${parsed.hotspots?.length || 0} hotspots, sample=${parsed.sampleSize || 0}`;
        } else if (meta.name === "list_file_entities") {
          summary = `${parsed.total || 0} entities`;
        } else if (meta.name === "semantic_search") {
          summary = `${parsed.results?.length || 0} results`;
        } else if (meta.name === "detect_code_clones") {
          summary = `${parsed.cloneGroups?.length || 0} clone groups`;
        } else if (meta.name === "get_metrics") {
          summary = `conductor: ${parsed.conductor?.status || "unknown"}`;
        } else {
          summary = "OK";
        }
        
        results.set(meta.name, { status: "pass", data: parsed });
      }
    } catch (e) {
      summary = "OK (unparsed)";
      results.set(meta.name, { status: "pass", raw: obj.result });
    }
  }
  
  log(`${status}: ${meta.label} (${elapsed}s) - ${summary}`);
  pending.delete(idKey);

  // If this was the index, send the rest
  if (meta.name === "index" && !indexComplete) {
    indexComplete = true;
    
    if (status === "FAIL") {
      log("Index failed - aborting remaining tests");
      setTimeout(() => {
        try {
          child.kill("SIGTERM");
        } catch {}
      }, 500);
      return;
    }
    
    log("Index complete. Sending remaining tests...");
    setTimeout(() => {
      while (currentTestIndex < tests.length) {
        sendNextTest();
        // Small delay between sends to avoid overwhelming
        if (currentTestIndex < tests.length) {
          setTimeout(() => {}, 50);
        }
      }
    }, 1000);
  }

  // Check if all done
  if (pending.size === 0 && currentTestIndex >= tests.length) {
    log("All tests complete. Generating report...");
    printReport();
    setTimeout(() => {
      try {
        child.kill("SIGTERM");
      } catch {}
    }, 500);
  }
}

function printReport() {
  console.log("\n=================================");
  console.log("TEST REPORT");
  console.log("=================================");
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = results.get(test.name);
    if (!result) {
      console.log(`❌ ${test.label}: NO RESPONSE`);
      failed++;
    } else if (result.status === "pass") {
      console.log(`✅ ${test.label}`);
      passed++;
    } else {
      console.log(`❌ ${test.label}: ${result.error?.message || "FAILED"}`);
      failed++;
    }
  }
  
  console.log("\n---------------------------------");
  console.log(`Total: ${tests.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log("=================================\n");
}

let multilineBuffer = "";

function processLine(line) {
  if (!line.trim()) return;

  let parsed = null;
  try {
    parsed = JSON.parse(line);
  } catch {
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
  // Suppress stderr unless in debug mode
  if (process.env.DEBUG) {
    process.stderr.write(chunk);
  }
});

child.on("error", (err) => {
  log(`Child process error: ${err.message}`);
});

child.on("close", (code, signal) => {
  clearTimeout(killTimer);
  
  if (stdoutBuf.length) {
    const lines = stdoutBuf.split(/\r?\n/).filter(Boolean);
    for (const line of lines) processLine(line);
  }
  
  if (pending.size > 0) {
    log(`\nWARNING: ${pending.size} pending requests never completed:`);
    for (const [id, meta] of pending.entries()) {
      const elapsed = ((Date.now() - meta.sentAt) / 1000).toFixed(2);
      log(`  - ${meta.label} (id=${id}, waiting ${elapsed}s)`);
      results.set(meta.name, { status: "timeout" });
    }
    printReport();
  }
  
  const totalPassed = Array.from(results.values()).filter(r => r.status === "pass").length;
  const totalFailed = tests.length - totalPassed;
  
  if (totalFailed > 0) {
    process.exit(1);
  }
});

// Hard timeout
const killTimer = setTimeout(() => {
  log(`\nTIMEOUT after ${TIMEOUT_MS / 1000}s - killing process`);
  
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
log("Starting comprehensive test suite...");
sendNextTest();
