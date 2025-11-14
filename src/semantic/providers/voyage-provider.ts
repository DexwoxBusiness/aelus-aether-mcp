import type { EmbeddingProvider, EmbedOptions, ProviderInfo, ProviderLogger } from "./base.js";
import { HttpEngine } from "./http-engine.js";

export interface VoyageOptions {
  baseUrl?: string;
  apiKey: string;
  model: string;
  timeoutMs?: number;
  concurrency?: number;
  inputType?: "query" | "document";
  maxBatchSize?: number;
  logger?: ProviderLogger;
}

/**
 * Voyage AI Embedding Provider
 *
 * Supports voyage-code-3 model with 1024-d embeddings optimized for code.
 * API Reference: https://docs.voyageai.com/docs/embeddings
 */
export class VoyageProvider implements EmbeddingProvider {
  public info: ProviderInfo;
  private engine: HttpEngine;
  private opts: VoyageOptions;
  private log?: ProviderLogger;

  constructor(opts: VoyageOptions) {
    this.opts = {
      baseUrl: "https://api.voyageai.com",
      inputType: "document",
      maxBatchSize: 128, // Voyage AI supports up to 128 texts per batch
      ...opts,
    };
    this.log = opts.logger;

    this.info = {
      name: "voyage",
      model: opts.model,
      supportsBatch: true,
      maxBatchSize: this.opts.maxBatchSize,
      dimension: this.getModelDimension(opts.model),
    };

    this.engine = new HttpEngine({
      baseUrl: this.opts.baseUrl!,
      timeoutMs: this.opts.timeoutMs ?? 30000, // Voyage AI can take longer for batch requests
      concurrency: this.opts.concurrency ?? 4,
      defaultHeaders: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.opts.apiKey}`,
      },
    });
  }

  async initialize(): Promise<void> {
    this.log?.info("VoyageProvider initialized", {
      model: this.info.model,
      dimension: this.info.dimension,
    });
  }

  getDimension(): number | undefined {
    return this.info.dimension;
  }

  /**
   * Get embedding dimension based on model name
   */
  private getModelDimension(model: string): number {
    // Voyage AI model dimensions
    const dimensions: Record<string, number> = {
      "voyage-3": 1024,
      "voyage-3-lite": 512,
      "voyage-code-3": 1024,
      "voyage-finance-2": 1024,
      "voyage-law-2": 1024,
      "voyage-multilingual-2": 1024,
      "voyage-2": 1024,
      "voyage-large-2": 1536,
      "voyage-code-2": 1536,
    };

    return dimensions[model] ?? 1024;
  }

  private buildBody = (input: string | string[], inputType?: string) => {
    return {
      model: this.info.model,
      input,
      input_type: inputType ?? this.opts.inputType,
    };
  };

  private parseSingle = (json: any): Float32Array => {
    if (!json || !Array.isArray(json.data) || !Array.isArray(json.data[0]?.embedding)) {
      throw new Error("Voyage AI invalid embedding response");
    }
    const arr = new Float32Array(json.data[0].embedding);
    this.info.dimension = this.info.dimension ?? arr.length;
    return arr;
  };

  private parseBatch = (json: any): Float32Array[] => {
    if (!json || !Array.isArray(json.data)) {
      throw new Error("Voyage AI invalid batch response");
    }
    const out = json.data.map((d: any) => new Float32Array(d.embedding));
    if (!this.info.dimension && out[0]) {
      this.info.dimension = out[0].length;
    }
    return out;
  };

  async embed(text: string, opts?: EmbedOptions): Promise<Float32Array> {
    this.log?.debug("embed()", { len: text?.length }, opts?.requestId);
    return this.engine.callSingle(
      { path: "/v1/embeddings", buildBody: this.buildBody },
      text,
      (j) => this.parseSingle(j),
      { signal: opts?.signal },
    );
  }

  async embedBatch(texts: string[], opts?: EmbedOptions): Promise<Float32Array[]> {
    this.log?.debug("embedBatch()", { count: texts.length }, opts?.requestId);

    const size = this.info.maxBatchSize ?? texts.length;

    // Split into chunks if batch size exceeds limit
    if (size < texts.length) {
      const chunks: string[][] = [];
      for (let i = 0; i < texts.length; i += size) {
        chunks.push(texts.slice(i, i + size));
      }

      this.log?.debug(
        "Splitting batch into chunks",
        {
          totalTexts: texts.length,
          chunkCount: chunks.length,
          maxBatchSize: size,
        },
        opts?.requestId,
      );

      const parts = await Promise.all(
        chunks.map((c) =>
          this.engine.callSingle({ path: "/v1/embeddings", buildBody: this.buildBody }, c, (j) => this.parseBatch(j), {
            signal: opts?.signal,
          }),
        ),
      );
      return parts.flat();
    }

    // Try batch request first
    try {
      return await this.engine.callSingle(
        { path: "/v1/embeddings", buildBody: this.buildBody },
        texts,
        (j) => this.parseBatch(j),
        { signal: opts?.signal },
      );
    } catch (err) {
      // Fallback to individual requests if batch fails
      this.log?.warn("Batch request failed, falling back to individual requests", { error: err }, opts?.requestId);
      return this.engine.callBatch(
        { path: "/v1/embeddings", buildBody: this.buildBody },
        texts,
        (j) => this.parseSingle(j),
        { signal: opts?.signal },
      );
    }
  }

  async close(): Promise<void> {
    this.log?.info("VoyageProvider closed");
  }
}
