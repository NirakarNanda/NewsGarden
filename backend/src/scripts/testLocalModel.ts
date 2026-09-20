import { LocalModelClient } from "../engine/tools/ai/LocalModelClient.js";

async function testLocalModel() {

  const client =
    new LocalModelClient();

  console.log(
    "🤖 Testing local Ollama model..."
  );

  try {

    const response =
      await client.generateText(
        `
You are a NewsGarden AI agent.

Reply with exactly one short sentence:

What is the purpose of a news research agent?
        `.trim()
      );

    console.log("\n✅ Ollama response:");
    console.log(response);

  } catch (error) {

    console.error(
      "\n❌ Ollama test failed:"
    );

    console.error(
      error instanceof Error
        ? error.message
        : error
    );

    process.exit(1);
  }
}

void testLocalModel();