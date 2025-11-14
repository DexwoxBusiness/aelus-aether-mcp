import { VoyageAIClient } from "voyageai";
import type { ProviderLogger } from "../semantic/providers/base.js";

/**
 * Voyage AI Re-ranker Configuration
 */
export interface VoyageRerankerOptions {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  logger?: ProviderLogger;
}

/**
 * Re-ranking request options
 */
export interface RerankOptions {
  topK?: number;
  returnDocuments?: boolean;
  truncation?: boolean;
  signal?: AbortSignal;
  requestId?: string;
}

/**
 * Re-ranked result item
 */
export interface RerankResult {
  index: number;
  relevanceScore: number;
  document?: string;
}

/**
 * Re-ranker response
 */
export interface RerankResponse {
  results: RerankResult[];
  model: string;
  usage?: {
    totalTokens?: number;
  };
}

/**
 * Voyage AI Re-ranker
 *
 * Provides semantic re-ranking of search results using Voyage AI's rerank models.
 * This is used as a second-stage ranker to improve search result relevance.
 *
 * Models:
 * - rerank-2: Latest model, best quality (default)
 * - rerank-2-lite: Faster, more cost-effective
 * - rerank-lite-1: Legacy lite model
 * - rerank-1: Legacy full model
 */
export class VoyageReranker {
  private client: VoyageAIClient;
  private model: string;
  private log?: ProviderLogger;

  constructor(opts: VoyageRerankerOptions) {
    this.client = new VoyageAIClient({
      apiKey: opts.apiKey,
      environment: opts.baseUrl,
    });
    this.model = opts.model || "rerank-2";
    this.log = opts.logger;

    this.log?.info("VoyageReranker initialized", {
      model: this.model,
    });
  }

  /**
   * Re-rank a list of documents based on their relevance to a query
   *
   * @param query The search query
   * @param documents List of document strings to re-rank
   * @param options Re-ranking options
   * @returns Re-ranked results sorted by relevance score (descending)
   */
  async rerank(query: string, documents: string[], options: RerankOptions = {}): Promise<RerankResponse> {
    const { topK, returnDocuments = false, truncation = true, signal, requestId } = options;

    this.log?.debug(
      "rerank()",
      {
        queryLength: query.length,
        documentCount: documents.length,
        topK,
        model: this.model,
      },
      requestId,
    );

    try {
      const response = await this.client.rerank(
        {
          query,
          documents,
          model: this.model,
          topK,
          returnDocuments,
          truncation,
        },
        {
          abortSignal: signal,
        },
      );

      const results: RerankResult[] = (response.data || []).map((item) => ({
        index: item.index ?? 0,
        relevanceScore: item.relevanceScore ?? 0,
        document: item.document,
      }));

      this.log?.debug(
        "rerank() complete",
        {
          resultCount: results.length,
          topScore: results[0]?.relevanceScore,
        },
        requestId,
      );

      return {
        results,
        model: response.model || this.model,
        usage: response.usage
          ? {
              totalTokens: response.usage.totalTokens,
            }
          : undefined,
      };
    } catch (err) {
      this.log?.error("rerank() failed", { error: err }, requestId, err as Error);
      throw err;
    }
  }

  /**
   * Re-rank with semantic results
   * Convenience method for re-ranking search results that include metadata
   */
  async rerankWithMetadata<T extends { content: string }>(
    query: string,
    items: T[],
    options: RerankOptions = {},
  ): Promise<Array<T & { rerankScore: number; rerankIndex: number }>> {
    if (items.length === 0) {
      return [];
    }

    // Extract document strings
    const documents = items.map((item) => item.content);

    // Rerank
    const response = await this.rerank(query, documents, {
      ...options,
      returnDocuments: false, // We already have the items
    });

    // Map results back to original items with scores
    const rerankedItems = response.results.map((result) => {
      const item = items[result.index];
      return {
        ...item,
        rerankScore: result.relevanceScore,
        rerankIndex: result.index,
      } as T & { rerankScore: number; rerankIndex: number };
    });

    return rerankedItems;
  }

  /**
   * Get the current model name
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Check if a model supports certain token limits
   */
  static getModelLimits(model: string): {
    maxQueryTokens: number;
    maxDocuments: number;
    maxTotalTokens: number;
  } {
    switch (model) {
      case "rerank-2":
      case "rerank-2-lite":
        return {
          maxQueryTokens: 2000,
          maxDocuments: 1000,
          maxTotalTokens: 300000,
        };
      case "rerank-1":
        return {
          maxQueryTokens: 2000,
          maxDocuments: 1000,
          maxTotalTokens: 100000,
        };
      case "rerank-lite-1":
        return {
          maxQueryTokens: 1000,
          maxDocuments: 1000,
          maxTotalTokens: 300000,
        };
      default:
        // Conservative defaults
        return {
          maxQueryTokens: 1000,
          maxDocuments: 1000,
          maxTotalTokens: 100000,
        };
    }
  }
}
