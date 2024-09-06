import fetch, { Response } from "node-fetch";

import { Mandoline } from "../src/client";
import {
  CONNECT_TIMEOUT,
  MANDOLINE_API_BASE_URL,
  MAX_GET_LIMIT,
  RWP_TIMEOUT,
} from "../src/config";
import { MandolineError, ValidationError } from "../src/errors";
import type { Metric } from "../src/models";

jest.mock("node-fetch");

const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

class MockResponse extends Response {
  constructor(body: string | object, status: number = 200) {
    super();
    const stringBody = typeof body === "object" ? JSON.stringify(body) : body;

    this.status = status;
    this.statusText = status === 200 ? "OK" : "Internal Server Error";
    this.ok = status >= 200 && status < 300;

    this.text = jest.fn().mockResolvedValue(stringBody);
    this.json = jest
      .fn()
      .mockResolvedValue(
        typeof body === "object" ? body : JSON.parse(stringBody)
      );
  }
}

describe("Mandoline", () => {
  const apiKey = "test_api_key";
  const apiBaseUrl = "https://test.api.com";
  let mandoline: Mandoline;
  const metricId = "23f156f6-0572-43a3-a27a-b95724343910";

  beforeEach(() => {
    mandoline = new Mandoline({ apiKey, apiBaseUrl });
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Initialization", () => {
    test("client initialization with custom config", () => {
      expect(mandoline["apiKey"]).toBe(apiKey);
      expect(mandoline["requestConfig"].apiBaseUrl).toBe(apiBaseUrl);
    });

    test("client initialization with default config", () => {
      const defaultClient = new Mandoline({ apiKey });
      expect(defaultClient["requestConfig"].apiBaseUrl).toBe(
        MANDOLINE_API_BASE_URL
      );
      expect(defaultClient["requestConfig"].connectTimeout).toBe(
        CONNECT_TIMEOUT
      );
      expect(defaultClient["requestConfig"].rwpTimeout).toBe(RWP_TIMEOUT);
    });

    test("client initialization with env vars", () => {
      process.env.MANDOLINE_API_KEY = "env_test_api_key";
      process.env.MANDOLINE_API_BASE_URL = "https://env.test.api.com";

      const envClient = new Mandoline();
      expect(envClient["apiKey"]).toBe("env_test_api_key");
      expect(envClient["requestConfig"].apiBaseUrl).toBe(
        "https://env.test.api.com"
      );

      delete process.env.MANDOLINE_API_KEY;
      delete process.env.MANDOLINE_API_BASE_URL;
    });
  });

  describe("Authentication", () => {
    test("getAuthHeader with valid API key", () => {
      const authHeader = mandoline["getAuthHeader"]();
      expect(authHeader).toEqual({ "X-API-KEY": apiKey });
    });

    test("getAuthHeader with no API key", () => {
      const invalidClient = new Mandoline({ apiKey: "" });
      expect(() => invalidClient["getAuthHeader"]()).toThrow(Error);
    });
  });

  describe("Metric operations", () => {
    const mockMetricData = {
      id: metricId,
      name: "Test Metric",
      description: "A test metric",
      tags: ["test"],
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    };

    beforeEach(() => {
      mockedFetch.mockResolvedValue({
        ok: true,
        json: async () => mockMetricData,
      } as any);
    });

    test("createMetric", async () => {
      const metric = await mandoline.createMetric({
        name: "Test Metric",
        description: "A test metric",
        tags: ["test"],
      });

      expect(metric).toEqual(expect.objectContaining(mockMetricData));
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    test("getMetric", async () => {
      const metric = await mandoline.getMetric(metricId);

      expect(metric).toEqual(expect.objectContaining(mockMetricData));
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    test("getMetrics", async () => {
      const mockMetricsData = [
        mockMetricData,
        { ...mockMetricData, id: "d5efc499-000b-468e-ace0-cf061c45e13b" },
      ];
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetricsData,
      } as any);

      const metrics = await mandoline.getMetrics({
        skip: 0,
        limit: 10,
        tags: ["test"],
      });

      expect(metrics).toEqual(expect.arrayContaining(mockMetricsData));
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    test("updateMetric", async () => {
      const updatedMetricData = {
        ...mockMetricData,
        name: "Updated Metric",
        tags: ["test", "updated"],
      };
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedMetricData,
      } as any);

      const updatedMetric = await mandoline.updateMetric(metricId, {
        name: "Updated Metric",
        tags: ["test", "updated"],
      });

      expect(updatedMetric).toEqual(expect.objectContaining(updatedMetricData));
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    test("deleteMetric", async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as any);

      await expect(mandoline.deleteMetric(metricId)).resolves.toBeUndefined();
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Evaluation operations", () => {
    const mockEvaluationData = {
      id: "23f156f6-0572-43a3-a27a-b95724343910",
      metricId: "ae503bed-4ee9-490e-bc4b-ff1e749d6ff4",
      prompt: "Test prompt",
      response: "Test response",
      properties: { key: "value" },
      score: 0.42,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    };

    beforeEach(() => {
      mockedFetch.mockResolvedValue({
        ok: true,
        json: async () => mockEvaluationData,
      } as any);
    });

    test("evaluate", async () => {
      const metrics: Metric[] = [
        {
          id: "ae503bed-4ee9-490e-bc4b-ff1e749d6ff4",
          name: "Metric 1",
          description: "",
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "73210187-84bc-4b95-ae75-5de0ad0e937c",
          name: "Metric 2",
          description: "",
          createdAt: "",
          updatedAt: "",
        },
      ];

      const evaluations = await mandoline.evaluate(
        metrics,
        "Test prompt",
        "Test response",
        { key: "value" }
      );

      expect(evaluations).toHaveLength(2);
      expect(evaluations[0]).toEqual(
        expect.objectContaining(mockEvaluationData)
      );
      expect(evaluations[1]).toEqual(
        expect.objectContaining(mockEvaluationData)
      );
      expect(mockedFetch).toHaveBeenCalledTimes(2);
    });

    test("createEvaluation", async () => {
      const evaluation = await mandoline.createEvaluation({
        metricId: "ae503bed-4ee9-490e-bc4b-ff1e749d6ff4",
        prompt: "Test prompt",
        response: "Test response",
        properties: { key: "value" },
      });

      expect(evaluation).toEqual(expect.objectContaining(mockEvaluationData));
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    test("getEvaluation", async () => {
      const evaluation = await mandoline.getEvaluation(mockEvaluationData.id);
      expect(evaluation).toEqual(expect.objectContaining(mockEvaluationData));
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    test("getEvaluations", async () => {
      const mockEvaluationsData = [
        mockEvaluationData,
        { ...mockEvaluationData, id: "d5efc499-000b-468e-ace0-cf061c45e13b" },
      ];
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvaluationsData,
      } as any);

      const evaluations = await mandoline.getEvaluations({
        skip: 0,
        limit: 10,
        metricId: "ae503bed-4ee9-490e-bc4b-ff1e749d6ff4",
      });

      expect(evaluations).toEqual(expect.arrayContaining(mockEvaluationsData));
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    test("updateEvaluation", async () => {
      const updatedEvaluationData = {
        ...mockEvaluationData,
        properties: { key: "updated_value" },
      };
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedEvaluationData,
      } as any);

      const updatedEvaluation = await mandoline.updateEvaluation(
        mockEvaluationData.id,
        {
          properties: { key: "updated_value" },
        }
      );

      expect(updatedEvaluation).toEqual(
        expect.objectContaining(updatedEvaluationData)
      );
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    test("deleteEvaluation", async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as any);

      await expect(
        mandoline.deleteEvaluation(mockEvaluationData.id)
      ).resolves.toBeUndefined();
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Input validation", () => {
    test("createMetric with invalid input", async () => {
      await expect(
        mandoline.createMetric({
          name: "", // Empty name
          description: "Test description",
        })
      ).rejects.toThrow(ValidationError);
    });

    test("updateMetric with no fields", async () => {
      await expect(mandoline.updateMetric(metricId, {})).rejects.toThrow(
        ValidationError
      );
    });

    test("createEvaluation with invalid UUID", async () => {
      await expect(
        mandoline.createEvaluation({
          metricId: "invalid-uuid",
          prompt: "Test prompt",
          response: "Test response",
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("Error handling", () => {
    test("get with limit exceeding max", async () => {
      await expect(
        mandoline.getMetrics({ limit: MAX_GET_LIMIT + 1 })
      ).rejects.toThrow(
        "Limit exceeds maximum allowed value of 1000. Please reduce the limit."
      );
      expect(mockedFetch).not.toHaveBeenCalled();
    });

    test("should not retry on 4xx errors (except 429)", async () => {
      mockedFetch.mockResolvedValueOnce(
        new MockResponse({ error: "Bad Request" }, 400)
      );

      await expect(mandoline.getMetric(metricId)).rejects.toThrow(
        MandolineError
      );
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });
  });
});
