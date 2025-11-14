/**
 * Tool Executor Utility
 * Provides a unified interface for executing MCP tools from HTTP endpoints
 */

import { getToolExecutor } from "../../core/tool-executor.js";
import { logger } from "../../utils/logger.js";
import type { ToolExecutionResult } from "../types.js";

/**
 * Execute a tool and return formatted result
 *
 * @param toolName - Name of the MCP tool to execute
 * @param args - Arguments to pass to the tool
 * @param requestId - Request ID for logging
 * @returns Tool execution result
 */
export async function executeTool(toolName: string, args: unknown, requestId: string): Promise<ToolExecutionResult> {
  const startTime = Date.now();

  try {
    logger.info("HTTP_TOOL_EXECUTION", `Executing tool: ${toolName}`, { toolName, args }, requestId);

    const toolExecutor = getToolExecutor();
    const result = await toolExecutor.execute(toolName, args, requestId);

    const duration = Date.now() - startTime;
    logger.info("HTTP_TOOL_SUCCESS", `Tool ${toolName} completed`, { toolName, duration }, requestId);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(
      "HTTP_TOOL_ERROR",
      `Tool ${toolName} failed`,
      { toolName, duration, error: (error as Error).message },
      requestId,
      error as Error,
    );
    throw error;
  }
}

/**
 * Parse tool execution result into JSON
 */
export function parseToolResult(result: ToolExecutionResult): unknown {
  try {
    const textContent = result.content[0]?.text;
    if (!textContent) {
      return { success: false, error: "Empty response from tool" };
    }
    return JSON.parse(textContent);
  } catch (error) {
    logger.warn("TOOL_RESULT_PARSE", "Failed to parse tool result", { error: (error as Error).message });
    return { success: false, error: "Failed to parse tool response" };
  }
}
