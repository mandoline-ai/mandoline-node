import Anthropic from "@anthropic-ai/sdk";
import { Mandoline } from "mandoline";
import OpenAI from "openai";

// Step 1: Set Up Your Experiment
const mandoline = new Mandoline();
const openai = new OpenAI();
const anthropic = new Anthropic();

// Step 2: Define Metrics
async function createMetrics() {
  const createMetric = async (name, description) => {
    return await mandoline.createMetric({ name, description });
  };

  return await Promise.all([
    createMetric(
      "Conceptual Leap",
      "Assesses the model's ability to generate unconventional ideas."
    ),
    createMetric(
      "Contextual Reframing",
      "Measures how the model approaches problems from different perspectives."
    ),
    createMetric(
      "Idea Synthesis",
      "Evaluates the model's capacity to connect disparate concepts."
    ),
    createMetric(
      "Constraint Navigation",
      "Examines how the model handles limitations creatively."
    ),
    createMetric(
      "Metaphorical Thinking",
      "Looks at the model's use of figurative language to explore ideas."
    ),
  ]);
}

// Step 3: Generate Responses
async function generateIdeas(prompt, model) {
  if (model === "gpt-4") {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-2024-08-06",
    });
    return completion.choices[0].message.content || "";
  } else if (model === "claude") {
    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    return msg.content[0].text;
  }
  throw new Error("Unsupported model");
}

// Step 4: Evaluate Responses
async function evaluateResponse(metric, prompt, response, model) {
  return await mandoline.createEvaluation({
    metricId: metric.id,
    prompt,
    response,
    properties: { model },
  });
}

// Step 5: Run Experiments
async function runExperiment(prompt, metrics) {
  const models = ["gpt-4", "claude"];
  const results = {};

  for (const model of models) {
    const response = await generateIdeas(prompt, model);
    results[model] = {
      response,
      evaluations: await Promise.all(
        metrics.map((metric) =>
          evaluateResponse(metric, prompt, response, model)
        )
      ),
    };
  }

  return results;
}

// Step 6: Analyze Results
async function analyzeResults(metricId) {
  // Fetch evaluations for the given metric
  const evaluations = await mandoline.getEvaluations({ metricId });

  // Group evaluations by model
  const groupedByModel = groupBy(
    evaluations,
    (evaluation) => evaluation.properties.model
  );

  // Helper function to group evaluations by model
  Object.entries(groupedByModel).forEach(([model, evals]) => {
    const avgScore =
      evals.reduce((sum, evaluation) => sum + evaluation.score, 0) /
      evals.length;
    console.log(`Average score for ${model}: ${avgScore.toFixed(2)}`);
  });
}

function groupBy(arr, key) {
  return arr.reduce((groups, item) => {
    const groupKey = key(item);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {});
}

// Main function to run the experiment
async function main() {
  try {
    const metrics = await createMetrics();
    const prompt =
      "If humans could photosynthesize like plants, how would our daily lives and global systems be different?";

    console.log("Running experiment...");
    const experimentResults = await runExperiment(prompt, metrics);
    console.log(JSON.stringify(experimentResults, null, 2));

    console.log("\nAnalyzing results...");
    for (const metric of metrics) {
      console.log(`\nResults for ${metric.name}:`);
      await analyzeResults(metric.id);
    }

    console.log(
      "\nExperiment complete. Use these insights to inform your model selection."
    );
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

main();
