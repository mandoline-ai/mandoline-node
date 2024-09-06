import { DEFAULT_GET_LIMIT } from "./config";
import type {
  NullableSerializableDict,
  NullableStringArray,
  UUID,
} from "./types";

interface MetricGetOptions {
  skip?: number;
  limit?: number;
  tags?: NullableStringArray;
}

export function processMetricGetOptions(
  options?: MetricGetOptions
): NullableSerializableDict {
  const params: NullableSerializableDict = {
    skip: options?.skip ?? 0,
    limit: options?.limit ?? DEFAULT_GET_LIMIT,
  };

  if (options?.tags !== undefined) {
    if (
      options.tags === null ||
      (Array.isArray(options.tags) && options.tags.length === 0)
    ) {
      params.tags = "null"; // Both null and [] mean "get metrics with no tags"
    } else if (Array.isArray(options.tags)) {
      params.tags = options.tags;
    }
  }

  return params;
}

interface EvaluationGetOptions {
  skip?: number;
  limit?: number;
  metricId?: UUID;
  properties?: NullableSerializableDict;
  filters?: NullableSerializableDict;
}

export function processEvaluationGetOptions(
  options?: EvaluationGetOptions
): NullableSerializableDict {
  const params: NullableSerializableDict = {
    skip: options?.skip ?? 0,
    limit: options?.limit ?? DEFAULT_GET_LIMIT,
  };

  if (options?.properties !== undefined) {
    if (
      options.properties === null ||
      (typeof options.properties === "object" &&
        Object.keys(options.properties).length === 0)
    ) {
      params.properties = JSON.stringify(null); // Both null and {} mean "get evaluations with no properties"
    } else {
      params.properties = JSON.stringify(options.properties);
    }
  }

  const filters: NullableSerializableDict = {};
  if (options?.metricId !== undefined) {
    filters.metric_id = options.metricId;
  }
  if (options?.filters !== undefined) {
    if (
      options.filters === null ||
      (typeof options.filters === "object" &&
        Object.keys(options.filters).length === 0)
    ) {
      filters.no_filters = true; // Indicate that we explicitly want no filters
    } else {
      Object.assign(filters, options.filters);
    }
  }

  if (Object.keys(filters).length > 0) {
    params.filters = JSON.stringify(filters);
  }

  return params;
}
