import type {
  NullableSerializableDict,
  NullableStringArray,
  UUID,
} from './types';

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

export type MetricCreate = MetricBase;

export interface MetricUpdate {
  name?: string;
  description?: string;
  tags?: NullableStringArray;
}

export interface Metric extends MetricBase, IDAndTimestampsMixin {}

interface EvaluationBase {
  metricId: UUID;
  prompt?: string;
  prompt_image?: string;
  response?: string;
  response_image?: string;
  properties?: NullableSerializableDict;
}

export type EvaluationCreate = EvaluationBase;

export interface EvaluationUpdate {
  properties?: NullableSerializableDict;
}

export interface Evaluation extends EvaluationBase, IDAndTimestampsMixin {
  score: number;
}
