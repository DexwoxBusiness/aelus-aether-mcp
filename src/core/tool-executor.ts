/**
 * Tool Executor Service
 * Centralized tool execution logic that can be used by both MCP and HTTP servers
 *
 * This module provides a global executor that delegates to the actual
 * executeToolCall implementation in src/index.ts
 */

import { logger } from "../utils/logger.js";

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
 * Type for the execute function
 */
export type ExecuteToolFunction = (
  name: string,
  args: unknown,
  requestId: string,
  startTime: number,
) => Promise<ToolExecutionResult>;

/**
 * Global execute function (set by index.ts after initialization)
 */
let globalExecuteFunction: ExecuteToolFunction | null = null;

/**
 * Initialize the global tool executor with the actual execute function
 */
export function initializeToolExecutor(executeFn: ExecuteToolFunction): void {
  globalExecuteFunction = executeFn;
  logger.info("TOOL_EXECUTOR", "Tool executor initialized", {});
}

/**
 * Check if tool executor is initialized
 */
export function isToolExecutorInitialized(): boolean {
  return globalExecuteFunction !== null;
}

/**
 * Execute a tool by name
 */
export async function executeToolDirect(
  toolName: string,
  args: unknown,
  requestId: string,
): Promise<ToolExecutionResult> {
  if (!globalExecuteFunction) {
    throw new Error("Tool executor not initialized. Call initializeToolExecutor() first.");
  }

  const startTime = Date.now();
  return globalExecuteFunction(toolName, args, requestId, startTime);
}

/**
 * Tool Executor class (for backward compatibility)
 */
export class ToolExecutor {
  async execute(toolName: string, args: unknown, requestId: string): Promise<ToolExecutionResult> {
    return executeToolDirect(toolName, args, requestId);
  }

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
      "create_product",
      "list_products",
      "add_repository_to_product",
    ];
  }
}

/**
 * Global tool executor instance
 */
let globalToolExecutor: ToolExecutor | null = null;

/**
 * Get global tool executor instance
 */
export function getToolExecutor(): ToolExecutor {
  if (!globalToolExecutor) {
    globalToolExecutor = new ToolExecutor();
  }
  return globalToolExecutor;
}
