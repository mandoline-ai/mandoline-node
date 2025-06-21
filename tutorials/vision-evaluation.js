import { extname } from "path";

import { readFile } from "fs/promises";
import { Mandoline } from "mandoline";

const mandoline = new Mandoline();

/**
 * Convert image file to data URI
 * @param {string} imagePath Path to the image file
 * @returns {Promise<string>} Promise resolving to data URI string
 */
async function createDataUri(imagePath) {
  const imageData = await readFile(imagePath);
  const mimeType = `image/${extname(imagePath).slice(1)}`; // Remove dot from extension
  const base64Data = imageData.toString("base64");
  return `data:${mimeType};base64,${base64Data}`;
}

async function evaluateVectorDesign() {
  try {
    // Create a metric for evaluating visual design quality
    const metric = await mandoline.createMetric({
      name: "Visual Asset Design",
      description:
        "Evaluates design quality of minimalist vector illustrations, focusing on composition, line work, and dimensionality",
      tags: ["design", "vector-art", "minimalist"],
    });

    // Load and convert image to data URI
    const responseImage = await createDataUri("./mandoline.png");

    // Create evaluation
    const evaluation = await mandoline.createEvaluation({
      metricId: metric.id,
      prompt:
        "Create a minimalist vector illustration of a mandoline slicer with strong dimensionality. Use black strokes and include key features like the blade, ridged surface, and feet.",
      response_image: responseImage,
      properties: {
        style: "vector-illustration",
        perspective: "isometric",
      },
    });

    console.log(`Evaluation score: ${evaluation.score}`);
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Run the demo
evaluateVectorDesign();
