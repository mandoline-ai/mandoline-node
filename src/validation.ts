import { validate as uuidValidate, version as uuidVersion } from "uuid";

import { ValidationError } from "./errors";
import {
  EvaluationCreate,
  EvaluationUpdate,
  MetricCreate,
  MetricUpdate,
} from "./models";
import type {
  NullableSerializableDict,
  NullableStringArray,
  SerializableDict,
  UUID,
} from "./types";

function isValidUUID(uuid: string): boolean {
  return uuidValidate(uuid) && uuidVersion(uuid) === 4;
}

export function validateId(id: UUID, entity: string): void {
  if (!id || typeof id !== "string" || !isValidUUID(id)) {
    throw new ValidationError(`${entity} must be a valid UUID v4.`);
  }
}

export function validateString(
  value: unknown,
  fieldName: string
): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError(`${fieldName} must be a non-empty string.`);
  }
}

export function validateNullableStringArray(
  list: NullableStringArray | undefined,
  name: string
): void {
  if (list !== undefined) {
    if (list === null) {
      return; // null is a valid value for NullableStringArray
    }
    if (
      !Array.isArray(list) ||
      !list.every((item) => typeof item === "string")
    ) {
      throw new ValidationError(`${name} must be an array of strings or null.`);
    }
  }
}

export function validateNullableSerializableDict(
  obj: NullableSerializableDict | undefined,
  name: string
): void {
  if (obj !== undefined) {
    if (obj === null) {
      return; // null is a valid value for NullableSerializableDict
    }
    if (typeof obj !== "object" || Array.isArray(obj)) {
      throw new ValidationError(`${name} must be an object or null.`);
    }
    // Check if all values in the object are serializable
    for (const [key, value] of Object.entries(obj)) {
      if (!isSerializable(value)) {
        throw new ValidationError(
          `${name}.${key} must be a serializable value.`
        );
      }
    }
  }
}

function isSerializable(value: unknown): boolean {
  if (value === undefined) {
    return false;
  }
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every(isSerializable);
  }
  if (typeof value === "object") {
    return Object.values(value as object).every(isSerializable);
  }
  return false;
}

function checkAtLeastOneFieldGiven(obj: Record<string, any>): void {
  const givenFields = Object.values(obj).filter((value) => value !== undefined);
  if (givenFields.length === 0) {
    throw new ValidationError("At least one field must be provided.");
  }
}

export function validateMetricCreate(metric: MetricCreate): void {
  validateString(metric.name, "Metric name");
  validateString(metric.description, "Metric description");
  if (metric.tags !== undefined) {
    validateNullableStringArray(metric.tags, "Metric tags");
  }
}

export function validateMetricsGet(options?: {
  skip?: number;
  limit?: number;
  tags?: NullableStringArray;
}): void {
  if (options?.skip !== undefined) {
    if (
      typeof options.skip !== "number" ||
      options.skip < 0 ||
      !Number.isInteger(options.skip)
    ) {
      throw new ValidationError("Skip must be a non-negative integer.");
    }
  }

  if (options?.limit !== undefined) {
    if (
      typeof options.limit !== "number" ||
      options.limit <= 0 ||
      !Number.isInteger(options.limit)
    ) {
      throw new ValidationError("Limit must be a positive integer.");
    }
  }

  if (options?.tags !== undefined) {
    validateNullableStringArray(options.tags, "Tags");
  }
}

export function validateMetricUpdate(update: MetricUpdate): void {
  if (update.name !== undefined) {
    validateString(update.name, "Metric name");
  }
  if (update.description !== undefined) {
    validateString(update.description, "Metric description");
  }
  if (update.tags !== undefined) {
    validateNullableStringArray(update.tags, "Metric tags");
  }
  checkAtLeastOneFieldGiven(update);
}

export function validateEvaluationCreate(evaluation: EvaluationCreate): void {
  validateId(evaluation.metricId, "Evaluation metricId");
  validateString(evaluation.prompt, "Evaluation prompt");
  validateString(evaluation.response, "Evaluation response");
  if (evaluation.properties !== undefined) {
    validateNullableSerializableDict(
      evaluation.properties,
      "Evaluation properties"
    );
  }
}

export function validateEvaluationsGet(options?: {
  skip?: number;
  limit?: number;
  metricId?: UUID;
  properties?: NullableSerializableDict;
  filters?: SerializableDict;
}): void {
  if (options?.skip !== undefined) {
    if (
      typeof options.skip !== "number" ||
      options.skip < 0 ||
      !Number.isInteger(options.skip)
    ) {
      throw new ValidationError("Skip must be a non-negative integer.");
    }
  }

  if (options?.limit !== undefined) {
    if (
      typeof options.limit !== "number" ||
      options.limit <= 0 ||
      !Number.isInteger(options.limit)
    ) {
      throw new ValidationError("Limit must be a positive integer.");
    }
  }

  if (options?.metricId !== undefined) {
    validateId(options.metricId, "Evaluation metricId");
  }

  if (options?.properties !== undefined) {
    validateNullableSerializableDict(
      options.properties,
      "Evaluation properties"
    );
  }

  if (options?.filters !== undefined) {
    if (typeof options.filters !== "object" || Array.isArray(options.filters)) {
      throw new ValidationError("Filters must be an object.");
    }
    // Validate each filter value
    for (const [key, value] of Object.entries(options.filters)) {
      if (!isSerializable(value)) {
        throw new ValidationError(
          `Filter '${key}' must be a serializable value.`
        );
      }
    }
  }
}

export function validateEvaluationUpdate(update: EvaluationUpdate): void {
  if (update.properties !== undefined) {
    validateNullableSerializableDict(
      update.properties,
      "Evaluation properties"
    );
  }
  checkAtLeastOneFieldGiven(update);
}

export function validatePaginationParams(skip?: number, limit?: number): void {
  if (skip !== undefined) {
    if (typeof skip !== "number" || skip < 0 || !Number.isInteger(skip)) {
      throw new ValidationError("Skip must be a non-negative integer.");
    }
  }
  if (limit !== undefined) {
    if (typeof limit !== "number" || limit <= 0 || !Number.isInteger(limit)) {
      throw new ValidationError("Limit must be a positive integer.");
    }
  }
}
