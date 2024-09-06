import { Mandoline } from "mandoline";

// Step 1: Set Up Your Experiment
const mandoline = new Mandoline();

// This will mock out the LLM
const yourLLM = {
  generate: async (prompt) => `Mock response to: "${prompt}"`,
};

// Step 2: Create a Use-Case Specific Metric
async function createMetric() {
  return await mandoline.createMetric({
    name: "Moralistic Tendency",
    description:
      "Assesses how frequently the model adopts a moralistic tone or attempts to lecture users on ethical matters.",
    tags: ["tone", "personality", "user_experience"],
  });
}

// Step 3: Test Different Prompts
async function testPrompts(metric) {
  const events = [
    "The use of atomic bombs in World War II",
    "The Industrial Revolution",
    // Add more events...
  ];

  const promptTemplates = [
    "Discuss the historical event: {event}",
    "Provide an objective overview of: {event}",
    "Describe the facts surrounding: {event}",
    "Outline key points of: {event} without moral judgment",
    // Add more templates...
  ];

  async function testPrompt(template, event) {
    const prompt = template.replace("{event}", event);
    const response = await yourLLM.generate(prompt);
    return mandoline.createEvaluation({
      metricId: metric.id,
      prompt,
      response,
      properties: { template, event },
    });
  }

  return await Promise.all(
    events.flatMap((event) =>
      promptTemplates.map((template) => testPrompt(template, event))
    )
  );
}

// Step 4: Analyze the Results
function analyzeResults(results) {
  // Overall moralistic tendency
  const avgScore =
    results.reduce((sum, r) => sum + r.score, 0) / results.length;
  console.log(`Average Moralistic Tendency: ${avgScore.toFixed(2)}`);

  // Helper function for grouping
  const groupBy = (array, key) =>
    array.reduce(
      (result, item) => ({
        ...result,
        [item.properties[key]]: [...(result[item.properties[key]] || []), item],
      }),
      {}
    );

  // Moralistic tendency by event
  const eventScores = groupBy(results, "event");
  Object.entries(eventScores).forEach(([event, evals]) => {
    const eventAvg = evals.reduce((sum, e) => sum + e.score, 0) / evals.length;
    console.log(`${event}: ${eventAvg.toFixed(2)}`);
  });

  // Best prompt structure
  const promptScores = groupBy(results, "template");
  const bestPrompt = Object.entries(promptScores)
    .map(([template, evals]) => ({
      template,
      avgScore: evals.reduce((sum, e) => sum + e.score, 0) / evals.length,
    }))
    .reduce((best, current) =>
      current.avgScore < best.avgScore ? current : best
    );

  console.log(`Best prompt: ${bestPrompt.template}`);
}

// Main function to run the experiment
async function main() {
  try {
    const metric = await createMetric();
    const results = await testPrompts(metric);
    analyzeResults(results);

    console.log(
      "Next steps: Use these insights to refine your prompts and improve your LLM application."
    );
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

main();
