import type { SerializableDict } from "./types";

const SKIP_KEYS = ["properties"]; // hack - don't modify user input case

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function objectToCamelCase(obj: SerializableDict): SerializableDict {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((v) => objectToCamelCase(v));
  }

  return Object.keys(obj).reduce((result, key) => {
    const camelKey = SKIP_KEYS.includes(key) ? key : toCamelCase(key);
    result[camelKey] = SKIP_KEYS.includes(key)
      ? obj[key]
      : objectToCamelCase(obj[key]);
    return result;
  }, {} as SerializableDict);
}

export function objectToSnakeCase(obj: SerializableDict): SerializableDict {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((v) => objectToSnakeCase(v));
  }

  return Object.keys(obj).reduce((result, key) => {
    const snakeKey = SKIP_KEYS.includes(key) ? key : toSnakeCase(key);
    result[snakeKey] = SKIP_KEYS.includes(key)
      ? obj[key]
      : objectToSnakeCase(obj[key]);
    return result;
  }, {} as SerializableDict);
}

export function makeSerializable(data: Record<string, any>): SerializableDict {
  const serializableData = { ...data };
  return objectToSnakeCase(serializableData);
}

export function safeJSONParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
