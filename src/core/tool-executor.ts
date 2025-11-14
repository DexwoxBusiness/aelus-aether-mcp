/**
 * Tool Executor Service
 * Centralized tool execution logic that can be used by both MCP and HTTP servers
 *
 * This module will be populated with the actual executeToolCall logic
 * from src/index.ts after refactoring
 */

import type { ConductorOrchestrator } from "../agents/conductor-orchestrator.js";
import type { AppConfig } from "../config/yaml-config.js";
import type { SQLiteManager } from "../storage/sqlite-manager.js";

/**
 * Tool executor context
 * Contains all dependencies needed for tool execution
 */
export interface ToolExecutorContext {
  conductor: ConductorOrchestrator | null;
  sqliteManager: SQLiteManager;
  config: AppConfig;
  directory: string;

  // Agent getters
  getSemanticAgent: () => Promise<any>;
  getDevAgent: () => Promise<any>;
  getDoraAgent: () => Promise<any>;
  getConductor: () => ConductorOrchestrator;

  // Helper functions
  normalizeInputPath: (rawPath?: string | null) => string | undefined;
  ensureSemanticsReady: (minVectors?: number, timeoutMs?: number) => Promise<boolean>;
}

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
  content: Array<{
    type: string;
    text: string;
  }>;
}

/**
 * Tool Executor Service
 * Handles execution of all MCP tools
 */
export class ToolExecutor {
  constructor(private context: ToolExecutorContext) {}

  /**
   * Execute a tool by name
   *
   * This is the main entry point that will contain the logic from
   * the executeToolCall function in src/index.ts
   */
  async execute(toolName: string, _args: unknown, requestId: string): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    // TODO: Port the executeToolCall logic from src/index.ts
    // For now, return a placeholder
    // The context will be used when implementing the actual tool execution
    void this.context;

    throw new Error(
      `Tool executor not yet implemented. Tool: ${toolName}, RequestId: ${requestId}, StartTime: ${startTime}`,
    );
  }

  /**
   * Get available tools
   */
  getAvailableTools(): string[] {
    return [
      "index",
      "list_file_entities",
      "list_entity_relationships",
      "query",
      "get_metrics",
      "get_version",
      "semantic_search",
      "find_similar_code",
      "analyze_code_impact",
      "detect_code_clones",
      "jscpd_detect_clones",
      "suggest_refactoring",
      "cross_language_search",
      "analyze_hotspots",
      "find_related_concepts",
      "get_graph",
      "get_graph_stats",
      "lerna_project_graph",
      "reset_graph",
      "clean_index",
      "get_graph_health",
      "get_agent_metrics",
      "get_bus_stats",
      "clear_bus_topic",
    ];
  }
}

/**
 * Global tool executor instance (will be initialized by the main server)
 */
let globalToolExecutor: ToolExecutor | null = null;

/**
 * Initialize global tool executor
 */
export function initializeToolExecutor(context: ToolExecutorContext): ToolExecutor {
  globalToolExecutor = new ToolExecutor(context);
  return globalToolExecutor;
}

/**
 * Get global tool executor instance
 */
export function getToolExecutor(): ToolExecutor {
  if (!globalToolExecutor) {
    throw new Error("Tool executor not initialized. Call initializeToolExecutor() first.");
  }
  return globalToolExecutor;
}
