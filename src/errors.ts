import { Response } from "node-fetch";

import { safeJSONParse } from "./utils";

export enum MandolineErrorType {
  ValidationError = "ValidationError",
  RateLimitExceeded = "RateLimitExceeded",
  TimeoutError = "TimeoutError",
  HTTPError = "HTTPError",
  RequestError = "RequestError",
  GenericError = "GenericError",
}

interface BaseErrorDetails {
  type: MandolineErrorType;
  message: string;
}

export interface ValidationErrorDetails extends BaseErrorDetails {
  type: MandolineErrorType.ValidationError;
  errors: string;
}

export interface RateLimitExceededErrorDetails extends BaseErrorDetails {
  type: MandolineErrorType.RateLimitExceeded;
}

export interface TimeoutErrorDetails extends BaseErrorDetails {
  type: MandolineErrorType.TimeoutError;
}

export interface HTTPErrorDetails extends BaseErrorDetails {
  type: MandolineErrorType.HTTPError;
  statusCode: number;
  statusText: string;
  responseText: string;
  responseJSON?: any;
}

export interface RequestErrorDetails extends BaseErrorDetails {
  type: MandolineErrorType.RequestError;
  request: {
    url: string;
    method: string;
  };
}

interface GenericErrorDetails extends BaseErrorDetails {
  type: MandolineErrorType.GenericError;
  statusCode?: number;
  errors?: string;
  stack?: string;
}

export type MandolineErrorDetails =
  | ValidationErrorDetails
  | RateLimitExceededErrorDetails
  | TimeoutErrorDetails
  | HTTPErrorDetails
  | RequestErrorDetails
  | GenericErrorDetails;

export class MandolineError extends Error {
  details: MandolineErrorDetails;

  constructor(details: MandolineErrorDetails) {
    super(details.message);
    this.details = details;
  }
}

export class ValidationError extends MandolineError {
  constructor(message: string, errors: string = "Unknown validation error") {
    super({
      type: MandolineErrorType.ValidationError,
      message,
      errors,
    });
  }
}

export async function handleError(err: unknown): Promise<MandolineError> {
  if (err instanceof MandolineError) return err;

  let errorDetails: MandolineErrorDetails;

  if (err instanceof Response) {
    errorDetails = await createHTTPErrorDetails(err);
  } else if (err instanceof Error) {
    errorDetails = createErrorDetails(err);
  } else {
    errorDetails = createGenericErrorDetails(err);
  }

  if (errorDetails.message) console.error(`Error: ${errorDetails.message}`);

  return new MandolineError(errorDetails);
}

async function createHTTPErrorDetails(
  response: Response
): Promise<MandolineErrorDetails> {
  const responseText = await response.text();
  const responseJSON = safeJSONParse(responseText);
  const { detail } = responseJSON || {};
  const { type, message, additional_info } = detail || {};

  switch (type) {
    case MandolineErrorType.ValidationError:
      return {
        type,
        message: message || "Validation error",
        errors: additional_info?.errors || "Unknown validation error",
      };
    case MandolineErrorType.RateLimitExceeded:
      return {
        type,
        message: message || "Rate limit exceeded",
      };
    case MandolineErrorType.RequestError:
      return {
        type,
        message: message || "Request error occurred",
        request: {
          url: additional_info?.request?.url || response.url,
          method: additional_info?.request?.method || response.type,
        },
      };
    default:
      return {
        type: type || MandolineErrorType.HTTPError,
        message:
          message || `HTTP Error: ${response.status} ${response.statusText}`,
        statusCode: response.status,
        statusText: response.statusText,
        responseText: responseText,
        responseJSON: responseJSON,
      };
  }
}

function createErrorDetails(error: Error): MandolineErrorDetails {
  if (error.name === "AbortError") {
    return {
      type: MandolineErrorType.TimeoutError,
      message:
        "The request timed out. The API might be slow or unresponsive. Please try again later.",
    };
  } else {
    return {
      type: MandolineErrorType.GenericError,
      message: error.message,
      stack: error.stack,
    };
  }
}

function createGenericErrorDetails(err: unknown): MandolineErrorDetails {
  return {
    type: MandolineErrorType.GenericError,
    message: JSON.stringify(err),
  };
}
