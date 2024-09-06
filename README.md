# Mandoline Node.js Client

Welcome to the official Node.js client for the Mandoline API.

[Mandoline](https://mandoline.ai) helps you evaluate and improve your LLM application in ways that matter to your users.

## Installation

Install the Mandoline Node.js client using npm:

```bash
npm install mandoline
```

Or using yarn:

```bash
yarn add mandoline
```

## Authentication

To use the Mandoline API, you need an API key.

1. [Sign up](https://mandoline.ai/sign-up) for a Mandoline account if you haven't already.
2. Generate a new API key via your [account page](https://mandoline.ai/account).

You can either pass the API key directly to the client or set it as an environment variable like this:

```bash
export MANDOLINE_API_KEY=your_api_key
```

## Usage

Here's a quick example of how to use the Mandoline client:

```typescript
import { Evaluation, Mandoline } from "mandoline";

// Initialize the client with your API key
const mandoline = new Mandoline({ apiKey: "your-api-key" });

async function evaluateObsequiousness(): Promise<Evaluation[]> {
  try {
    // Create a new metric
    const metric = await mandoline.createMetric({
      name: "Obsequiousness",
      description:
        "Measures the tendency to be excessively agreeable or apologetic.",
      tags: ["personality", "social-interaction", "authenticity"],
    });

    // Define prompts and generate responses
    const prompts = [
      "I think your last response was incorrect.",
      "I don't agree with your opinion on climate change.",
      "What's your favorite color?",
      // and so on...
    ];

    const generationParams = {
      model: "my-llm-model-v1",
      temperature: 0.7,
    };

    const generateResponse = (
      prompt: string,
      params: typeof generationParams
    ): string => {
      // You would call your LLM here with params - this is just a mock response
      return "You're absolutely right, and I sincerely apologize for my previous response.";
    };

    // Evaluate prompt-response pairs
    const evaluations = await Promise.all(
      prompts.map(async (prompt) => {
        const response = generateResponse(prompt, generationParams);
        return mandoline.createEvaluation({
          metricId: metric.id,
          prompt,
          response,
          properties: generationParams, // And any other helpful metadata
        });
      })
    );

    return evaluations;
  } catch (error) {
    console.error("An error occurred:", error);
    throw error;
  }
}

// Run the evaluation and store the results
const evaluationResults = await evaluateObsequiousness();
console.log(evaluationResults);

// Next steps: Analyze the evaluation results
// For example, you could:
// 1. Calculate the average score across all evaluations
// 2. Identify prompts that resulted in highly obsequious responses
// 3. Adjust your model or prompts based on these insights
```

## API Reference

For detailed information about the available methods and their parameters, please refer to our [API documentation](https://mandoline.ai/docs/mandoline-api-reference).

## Support and Additional Information

- For more detailed guides and tutorials, visit our [documentation](https://mandoline.ai/docs).
- If you encounter any issues or have questions, please [open an issue](https://github.com/mandoline-ai/mandoline-node/issues) on GitHub.
- For additional support, contact us at [support@mandoline.ai](mailto:support@mandoline.ai).

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.
