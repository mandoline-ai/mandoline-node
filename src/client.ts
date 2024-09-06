import {
  CONNECT_TIMEOUT,
  DEFAULT_GET_LIMIT,
  MANDOLINE_API_BASE_URL,
  MAX_GET_LIMIT,
  RWP_TIMEOUT,
  type MandolineClientOptions,
  type MandolineRequestConfig,
} from "./config";
import { makeRequest } from "./connection-manager";
import type {
  Evaluation,
  EvaluationCreate,
  EvaluationUpdate,
  Metric,
  MetricCreate,
  MetricUpdate,
} from "./models";
import type {
  Headers,
  NullableSerializableDict,
  NullableStringArray,
  SerializableDict,
  UUID,
} from "./types";
import {
  validateEvaluationCreate,
  validateEvaluationsGet,
  validateEvaluationUpdate,
  validateId,
  validateMetricCreate,
  validateMetricsGet,
  validateMetricUpdate,
} from "./validation";

/**
 * Mandoline client for interacting with the Mandoline API.
 *
 * This class provides methods to create, retrieve, update, and delete
 * metrics and evaluations. It handles authentication and request
 * management to the Mandoline API.
 */
export class Mandoline {
  private apiKey: string;
  private requestConfig: MandolineRequestConfig;

  /**
   * Creates a new Mandoline client instance.
   *
   * @param options - Configuration options for the Mandoline client.
   * @throws {Error} If no API key is provided and the environment variable is not set.
   */
  constructor(options: MandolineClientOptions = {}) {
    this.apiKey = options?.apiKey || process.env.MANDOLINE_API_KEY || "";

    this.requestConfig = {
      apiBaseUrl:
        options.apiBaseUrl ||
        process.env.MANDOLINE_API_BASE_URL ||
        MANDOLINE_API_BASE_URL,
      connectTimeout: options.connectTimeout || CONNECT_TIMEOUT,
      rwpTimeout: options.rwpTimeout || RWP_TIMEOUT,
    };
  }

  protected getAuthHeader(): Headers {
    if (!this.apiKey) {
      throw new Error(
        "API key not provided and MANDOLINE_API_KEY environment variable is not set."
      );
    }
    return { "X-API-KEY": this.apiKey };
  }

  protected async get<T>(
    endpoint: string,
    params?: NullableSerializableDict
  ): Promise<T> {
    if (params?.limit && params.limit > MAX_GET_LIMIT) {
      throw new Error(
        `Limit exceeds maximum allowed value of ${MAX_GET_LIMIT}. Please reduce the limit.`
      );
    }
    return makeRequest<T>(this.requestConfig, {
      method: "GET",
      endpoint,
      authHeader: this.getAuthHeader(),
      params,
    });
  }

  protected async post<T>(
    endpoint: string,
    data: SerializableDict
  ): Promise<T> {
    return makeRequest<T>(this.requestConfig, {
      method: "POST",
      endpoint,
      authHeader: this.getAuthHeader(),
      data,
    });
  }

  protected async put<T>(endpoint: string, data: SerializableDict): Promise<T> {
    return makeRequest<T>(this.requestConfig, {
      method: "PUT",
      endpoint,
      authHeader: this.getAuthHeader(),
      data,
    });
  }

  protected async delete<T>(endpoint: string): Promise<T> {
    return makeRequest<T>(this.requestConfig, {
      method: "DELETE",
      endpoint,
      authHeader: this.getAuthHeader(),
    });
  }

  /**
   * Creates a new evaluation metric.
   * @param metric - The metric to create
   * @returns A promise that resolves to the created Metric
   */
  async createMetric(metric: MetricCreate): Promise<Metric> {
    validateMetricCreate(metric);
    return this.post<Metric>("metrics/", metric);
  }

  /**
   * Fetches a specific metric by its unique identifier.
   * @param metricId - The ID of the metric to fetch
   * @returns A promise that resolves to the requested Metric
   */
  async getMetric(metricId: UUID): Promise<Metric> {
    validateId(metricId, "Metric ID");
    return this.get<Metric>(`metrics/${metricId}`);
  }

  /**
   * Fetches a list of metrics with optional filtering.
   * @param options - Optional parameters for filtering and pagination
   * @returns A promise that resolves to an array of Metrics
   */
  async getMetrics(options?: {
    skip?: number;
    limit?: number;
    tags?: NullableStringArray;
    filters?: SerializableDict;
  }): Promise<Metric[]> {
    validateMetricsGet(options);
    const params = processGetOptions(options);
    return this.get<Metric[]>("metrics/", params);
  }

  /**
   * Modifies an existing metric's attributes.
   * @param metricId - The ID of the metric to update
   * @param update - The updates to apply to the metric
   * @returns A promise that resolves to the updated Metric
   */
  async updateMetric(metricId: UUID, update: MetricUpdate): Promise<Metric> {
    validateId(metricId, "Metric ID");
    validateMetricUpdate(update);
    return this.put<Metric>(`metrics/${metricId}`, update);
  }

  /**
   * Removes a metric permanently.
   * @param metricId - The ID of the metric to delete
   */
  async deleteMetric(metricId: UUID): Promise<void> {
    validateId(metricId, "Metric ID");
    await this.delete<void>(`metrics/${metricId}`);
  }

  /**
   * Performs evaluations across multiple metrics for a given prompt-response pair.
   * @param metrics - The list of metrics to evaluate against
   * @param prompt - The prompt to evaluate
   * @param response - The response to evaluate
   * @param properties - Optional properties to include with the evaluation
   * @returns A promise that resolves to an array of created Evaluations
   */
  async evaluate(
    metrics: Metric[],
    prompt: string,
    response: string,
    properties?: NullableSerializableDict
  ): Promise<Evaluation[]> {
    const evaluationPromises = metrics.map(async (metric) => {
      const evaluationCreate: EvaluationCreate = {
        metricId: metric.id,
        prompt,
        response,
        properties,
      };
      validateEvaluationCreate(evaluationCreate);
      return this.createEvaluation(evaluationCreate);
    });

    return await Promise.all(evaluationPromises);
  }

  /**
   * Performs an evaluation for a single metric on a prompt-response pair.
   * @param evaluation - The evaluation to create
   * @returns A promise that resolves to the created Evaluation
   */
  async createEvaluation(evaluation: EvaluationCreate): Promise<Evaluation> {
    validateEvaluationCreate(evaluation);
    return this.post<Evaluation>("evaluations/", evaluation);
  }

  /**
   * Fetches details of a specific evaluation.
   * @param evaluationId - The ID of the evaluation to fetch
   * @returns A promise that resolves to the requested Evaluation
   */
  async getEvaluation(evaluationId: UUID): Promise<Evaluation> {
    validateId(evaluationId, "Evaluation ID");
    return this.get<Evaluation>(`evaluations/${evaluationId}`);
  }

  /**
   * Fetches a list of evaluations with optional filtering.
   * @param options - Optional parameters for filtering and pagination
   * @returns A promise that resolves to an array of Evaluations
   */
  async getEvaluations(options?: {
    skip?: number;
    limit?: number;
    metricId?: UUID;
    properties?: NullableSerializableDict;
    filters?: SerializableDict;
  }): Promise<Evaluation[]> {
    validateEvaluationsGet(options);
    const params = processGetOptions(options);
    return this.get<Evaluation[]>("evaluations/", params);
  }

  /**
   * Modifies an existing evaluation's properties.
   * @param evaluationId - The ID of the evaluation to update
   * @param update - The updates to apply to the evaluation
   * @returns A promise that resolves to the updated Evaluation
   */
  async updateEvaluation(
    evaluationId: UUID,
    update: EvaluationUpdate
  ): Promise<Evaluation> {
    validateId(evaluationId, "Evaluation ID");
    validateEvaluationUpdate(update);
    return this.put<Evaluation>(`evaluations/${evaluationId}`, update);
  }

  /**
   * Removes an evaluation permanently.
   * @param evaluationId - The ID of the evaluation to delete
   */
  async deleteEvaluation(evaluationId: UUID): Promise<void> {
    validateId(evaluationId, "Evaluation ID");
    await this.delete<void>(`evaluations/${evaluationId}`);
  }
}

// Helper function for processing get options

interface GetOptions {
  skip?: number;
  limit?: number;
  tags?: NullableStringArray;
  metricId?: UUID;
  properties?: NullableSerializableDict;
  filters?: SerializableDict;
}

export function processGetOptions(
  options?: GetOptions
): NullableSerializableDict {
  const params: NullableSerializableDict = {
    skip: options?.skip ?? 0,
    limit: options?.limit ?? DEFAULT_GET_LIMIT,
  };

  const filters: SerializableDict = {};

  if (options?.tags !== undefined) {
    filters.tags = options.tags;
  }

  if (options?.metricId !== undefined) {
    filters.metric_id = options.metricId;
  }

  if (options?.properties !== undefined) {
    filters.properties = options.properties;
  }

  if (options?.filters !== undefined) {
    if (typeof options.filters !== "object") {
      throw new Error("filters must be a dictionary");
    }
    Object.assign(filters, options.filters);
  }

  if (Object.keys(filters).length > 0) {
    params.filters = JSON.stringify(filters);
  }

  return params;
}
