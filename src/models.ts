import type {
  NullableSerializableDict,
  NullableStringArray,
  UUID,
} from "./types";

interface IDAndTimestampsMixin {
  id: UUID;
  createdAt: string;
  updatedAt: string;
}

interface MetricBase {
  name: string;
  description: string;
  tags?: NullableStringArray;
}

export interface MetricCreate extends MetricBase {}

export interface MetricUpdate {
  name?: string;
  description?: string;
  tags?: NullableStringArray;
}

export interface Metric extends MetricBase, IDAndTimestampsMixin {}

interface EvaluationBase {
  metricId: UUID;
  prompt: string;
  response: string;
  properties?: NullableSerializableDict;
}

export interface EvaluationCreate extends EvaluationBase {}

export interface EvaluationUpdate {
  properties?: NullableSerializableDict;
}

export interface Evaluation extends EvaluationBase, IDAndTimestampsMixin {
  score: number;
}
