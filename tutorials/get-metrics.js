import { Mandoline } from "mandoline";

const mandoline = new Mandoline();

async function getPersonalityMetrics() {
  try {
    const metrics = await mandoline.getMetrics({ tags: ["personality"] });
    console.log("Personality metrics:", metrics);
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

getPersonalityMetrics();
