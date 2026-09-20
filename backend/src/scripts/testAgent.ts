import { connectDatabase } from "../config/database.js";

import { TaskManager } from "../engine/brain/TaskManager.js";

import { TechNewsAgent } from "../engine/agents/discovery/TechNewsAgent.js";

async function testAgent() {

  // Connect to MongoDB.
  await connectDatabase();

  const taskManager = new TaskManager();

  // Brain creates a job.
  const task = await taskManager.createTask(
    "tech-news-agent",
    "discover-tech-news"
  );

  const agent = new TechNewsAgent();

  // Mark the job as running.
  await taskManager.startTask(
    task.taskId
  );

  // Give the job to the agent.
  const result = await agent.execute({
    id: task.taskId,

    agentId: "tech-news-agent",

    type: "discover-tech-news",

    status: "running",

    retryCount: 0,

    createdAt: task.createdAt,
  });

  if (result.success) {

    // Save what the agent found.
    await taskManager.completeTask(
      task.taskId,
      result.output
    );

    console.log(
      "✅ Agent completed successfully."
    );

  } else {

    await taskManager.failTask(
      task.taskId,
      result.error ?? "Unknown error"
    );

    console.log(
      "❌ Agent failed."
    );
  }

  process.exit(0);
}

void testAgent();