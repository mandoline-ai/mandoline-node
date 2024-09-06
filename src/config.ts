export const MANDOLINE_API_BASE_URL = "https://mandoline-api.fly.dev/v1";

export const DEFAULT_GET_LIMIT = 100;
export const MAX_GET_LIMIT = 1000;

export const CONNECT_TIMEOUT = 300000; // 5 minutes
export const RWP_TIMEOUT = 300000; // 5 minutes

export interface MandolineRequestConfig {
  /**
   * The base URL for the Mandoline API.
   * Default: https://mandoline-api.fly.dev/v1
   */
  apiBaseUrl: string;

  /**
   * The timeout (in milliseconds) for establishing a connection to the API.
   * Default: 300000 (5 minutes)
   */
  connectTimeout: number;

  /**
   * The timeout (in milliseconds) for the entire request-response cycle.
   * Default: 300000 (5 minutes)
   */
  rwpTimeout: number;
}

export interface MandolineClientOptions
  extends Partial<MandolineRequestConfig> {
  /**
   * The API key for authenticating with the Mandoline API.
   * If not provided, it will attempt to use the MANDOLINE_API_KEY environment variable.
   */
  apiKey?: string;
}
