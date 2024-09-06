import fetch, {
  HeadersInit,
  RequestInit as NodeFetchRequestInit,
  Response,
} from "node-fetch";

import type { MandolineRequestConfig } from "./config";
import { handleError } from "./errors";
import type {
  Headers,
  NullableSerializableDict,
  SerializableDict,
} from "./types";
import { makeSerializable, objectToCamelCase } from "./utils";

function processURL(
  apiBaseUrl: string,
  endpoint: string,
  params?: NullableSerializableDict
): string {
  if (!params) return `${apiBaseUrl}/${endpoint}`;

  const serializableParams = makeSerializable(params);
  const searchParams = new URLSearchParams();
  for (const key in serializableParams) {
    const value = serializableParams[key];
    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, item));
    } else {
      searchParams.append(key, value);
    }
  }

  const queryString = searchParams.toString();
  return `${apiBaseUrl}/${endpoint}?${queryString}`;
}

function processRequestBody(data?: SerializableDict): SerializableDict {
  if (!data) return {};
  const serializableData = makeSerializable(data);
  const body = JSON.stringify(serializableData);
  return { body };
}

async function makeRequestWithTimeout(
  config: MandolineRequestConfig,
  method: string,
  url: string,
  headers: HeadersInit,
  body?: SerializableDict
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.rwpTimeout);
  try {
    const response = await fetch(url, {
      method,
      headers,
      ...body,
      signal: AbortSignal.timeout(config.connectTimeout),
    } as NodeFetchRequestInit);
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function processResponse(response: Response): Promise<any> {
  if (!response.ok) {
    throw response;
  }

  const jsonResponse = await response.json();
  return objectToCamelCase(jsonResponse);
}

type RequestOptions = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  endpoint: string;
  authHeader: Headers;
  params?: NullableSerializableDict;
  data?: SerializableDict;
};

export async function makeRequest<T>(
  config: MandolineRequestConfig,
  options: RequestOptions
): Promise<T> {
  const { method, endpoint, authHeader, params, data } = options;

  const url = processURL(config.apiBaseUrl, endpoint, params);
  const headers: HeadersInit = {
    ...authHeader,
    "Content-Type": "application/json",
  };
  const body = processRequestBody(data);

  try {
    const response = await makeRequestWithTimeout(
      config,
      method,
      url,
      headers,
      body
    );
    return await processResponse(response);
  } catch (error: unknown) {
    throw await handleError(error);
  }
}
