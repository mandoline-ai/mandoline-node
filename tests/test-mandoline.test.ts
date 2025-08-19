import fetch, { Response } from "node-fetch";

import { Mandoline } from "../src/client";
import {
  CONNECT_TIMEOUT,
  MANDOLINE_API_BASE_URL,
  MAX_GET_LIMIT,
  RWP_TIMEOUT,
} from "../src/config";
import { MandolineError, ValidationError } from "../src/errors";
import type { UUID } from "../src/types";

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
      const metricIds: UUID[] = [
        "ae503bed-4ee9-490e-bc4b-ff1e749d6ff4",
        "73210187-84bc-4b95-ae75-5de0ad0e937c",
      ];

      const evaluations = await mandoline.batchCreateEvaluations(
        metricIds,
        "Test prompt",
        undefined,
        "Test response",
        undefined,
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

    describe("createEvaluation image validation", () => {
      const validMetricId = "23f156f6-0572-43a3-a27a-b95724343910";
      const validDataUri =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==";

      // Mock successful response data
      const mockEvaluationResponse = {
        id: "23f156f6-0572-43a3-a27a-b95724343910",
        metricId: validMetricId,
        prompt: "Test prompt",
        response: "Test response",
        prompt_image: validDataUri,
        response_image: validDataUri,
        score: 0.42,
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
      };

      // Set up mock response for successful cases
      beforeEach(() => {
        mockedFetch.mockResolvedValue(new MockResponse(mockEvaluationResponse));
      });

      test("accepts valid data URI images", async () => {
        await expect(
          mandoline.createEvaluation({
            metricId: validMetricId,
            prompt: "Test prompt",
            prompt_image: validDataUri,
            response: "Test response",
            response_image: validDataUri,
          })
        ).resolves.toBeDefined();
        expect(mockedFetch).toHaveBeenCalledTimes(1);
      });

      test("rejects non-data URI images", async () => {
        await expect(
          mandoline.createEvaluation({
            metricId: validMetricId,
            prompt: "Test prompt",
            prompt_image: "https://example.com/image.png",
            response: "Test response",
          })
        ).rejects.toThrow(ValidationError);
      });

      test("rejects non-image data URIs", async () => {
        await expect(
          mandoline.createEvaluation({
            metricId: validMetricId,
            prompt: "Test prompt",
            prompt_image: "data:text/plain;base64,SGVsbG8gd29ybGQ=",
            response: "Test response",
          })
        ).rejects.toThrow(ValidationError);
      });

      test("requires either response or response_image", async () => {
        await expect(
          mandoline.createEvaluation({
            metricId: validMetricId,
            prompt: "Test prompt",
            prompt_image: validDataUri,
          })
        ).rejects.toThrow(ValidationError);
      });

      test("allows response to be undefined when images are provided", async () => {
        await expect(
          mandoline.createEvaluation({
            metricId: validMetricId,
            prompt: "Test prompt",
            prompt_image: validDataUri,
            response_image: validDataUri,
          })
        ).resolves.toBeDefined();
        expect(mockedFetch).toHaveBeenCalledTimes(1);
      });

      test("requires response when no images are provided", async () => {
        await expect(
          mandoline.createEvaluation({
            metricId: validMetricId,
            prompt: "Test prompt",
          })
        ).rejects.toThrow(ValidationError);
      });

      test("rejects malformed base64 in data URI", async () => {
        await expect(
          mandoline.createEvaluation({
            metricId: validMetricId,
            prompt: "Test prompt",
            prompt_image: "data:image/png,not-base64-data",
            response: "Test response",
          })
        ).rejects.toThrow(ValidationError);
      });
    });
  });

  describe("includeContent parameter", () => {
    test("includeContent parameter is passed correctly", async () => {
      const mockEvaluationData = {
        id: "23f156f6-0572-43a3-a27a-b95724343910",
        metricId: "ae503bed-4ee9-490e-bc4b-ff1e749d6ff4",
        prompt: "Test prompt",
        response: "Test response",
        score: 0.42,
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
      };

      mockedFetch.mockResolvedValue(new MockResponse(mockEvaluationData));

      // Test createEvaluation with includeContent=true (explicitly set)
      await mandoline.createEvaluation(
        {
          metricId: "ae503bed-4ee9-490e-bc4b-ff1e749d6ff4",
          prompt: "Test prompt",
          response: "Test response",
        },
        true
      );

      // Verify include_content=true was added to URL params
      expect(mockedFetch).toHaveBeenLastCalledWith(
        expect.stringContaining("include_content=true"),
        expect.anything()
      );

      // Test getEvaluation with includeContent=false (explicitly set)
      await mandoline.getEvaluation(
        "23f156f6-0572-43a3-a27a-b95724343910",
        false
      );

      // Verify include_content=false was added to URL params
      expect(mockedFetch).toHaveBeenLastCalledWith(
        expect.stringContaining("include_content=false"),
        expect.anything()
      );

      // Test updateEvaluation without includeContent (undefined, should not add param)
      await mandoline.updateEvaluation("23f156f6-0572-43a3-a27a-b95724343910", {
        properties: { updated: true },
      });

      // Verify include_content was NOT added to URL params
      expect(mockedFetch).toHaveBeenLastCalledWith(
        expect.not.stringContaining("include_content"),
        expect.anything()
      );

      // Test batchCreateEvaluations with includeContent=true
      mockedFetch.mockResolvedValue(new MockResponse([mockEvaluationData]));
      await mandoline.batchCreateEvaluations(
        ["ae503bed-4ee9-490e-bc4b-ff1e749d6ff4"],
        "Test prompt",
        undefined,
        "Test response",
        undefined,
        undefined,
        true
      );

      // Verify include_content=true was added to URL params
      expect(mockedFetch).toHaveBeenLastCalledWith(
        expect.stringContaining("include_content=true"),
        expect.anything()
      );

      // Test getEvaluations with includeContent=false
      mockedFetch.mockResolvedValue(new MockResponse([mockEvaluationData]));
      await mandoline.getEvaluations({ includeContent: false });

      // Verify include_content=false was added to URL params
      expect(mockedFetch).toHaveBeenLastCalledWith(
        expect.stringContaining("include_content=false"),
        expect.anything()
      );
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
