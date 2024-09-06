# Mandoline Tutorials

This directory contains tutorials and examples for using the Mandoline Node.js client.

## Contents

1. `quick-start.js`: A basic introduction to using the Mandoline client.
2. `prompt-engineering.js`: An example of using Mandoline for prompt engineering tasks.
3. `model-selection.js`: A tutorial on comparing different language models using Mandoline.
4. `get-metrics.js`: A simple demo that fetches all metrics with a "personality" tag.

## Setup

1. Ensure you're in the tutorials directory:

   ```bash
   cd tutorials
   ```

2. Install the necessary dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in this directory with your API keys:

   ```
   MANDOLINE_API_KEY=your_mandoline_api_key
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

## Running the Tutorials

To run a specific tutorial, use the corresponding npm script:

```bash
npm run quick-start
npm run prompt-engineering
npm run model-selection
npm run get-metrics
```

## Modifying the Tutorials

Feel free to modify these scripts to experiment with different prompts, metrics, or models. The tutorials are designed to be starting points for your own experiments with Mandoline.

## Additional Resources

- For more information on the Mandoline API, visit the [official documentation](https://mandoline.ai/docs).
- If you encounter any issues or have questions, please [open an issue](https://github.com/mandoline-ai/mandoline-node/issues) or contact Mandoline support at [support@mandoline.ai](mailto:support@mandoline.ai).
