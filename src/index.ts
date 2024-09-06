import { Mandoline } from "./client";
import { MandolineClientOptions, MandolineRequestConfig } from "./config";
import type {
  HTTPErrorDetails,
  MandolineErrorDetails,
  RateLimitExceededErrorDetails,
  RequestErrorDetails,
  TimeoutErrorDetails,
  ValidationErrorDetails,
} from "./errors";
import { MandolineError, MandolineErrorType } from "./errors";
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

// Client and client configuration
export { Mandoline, MandolineClientOptions, MandolineRequestConfig };

// Error handling
export {
  HTTPErrorDetails,
  MandolineError,
  MandolineErrorDetails,
  MandolineErrorType,
  RateLimitExceededErrorDetails,
  RequestErrorDetails,
  TimeoutErrorDetails,
  ValidationErrorDetails,
};

// Model types
export type {
  Evaluation,
  EvaluationCreate,
  EvaluationUpdate,
  Metric,
  MetricCreate,
  MetricUpdate,
};

// Utility types
export type {
  Headers,
  NullableSerializableDict,
  NullableStringArray,
  SerializableDict,
  UUID,
};
