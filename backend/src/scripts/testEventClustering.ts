import {
  connectDatabase,
} from "../config/database.js";

import {
  EventClusteringAgent,
} from "../engine/agents/discovery/EventClusteringAgent.js";

import {
  TaskManager,
} from "../engine/brain/TaskManager.js";

async function testEventClustering() {

  await connectDatabase();

  const taskManager =
    new TaskManager();

  const task =
    await taskManager.createTask(
      "event-clustering-agent",
      "cluster-news-events"
    );

  await taskManager.startTask(
    task.taskId
  );

  const agent =
    new EventClusteringAgent();

  const result =
    await agent.execute({

      id: task.taskId,

      agentId:
        "event-clustering-agent",

      type:
        "cluster-news-events",

      status: "running",

      retryCount: 0,

      createdAt:
        task.createdAt,
    });

  if (result.success) {

    await taskManager.completeTask(
      task.taskId,
      result.output
    );

    console.log(
      "✅ Event clustering completed."
    );

    console.log(
      result.output
    );

  } else {

    await taskManager.failTask(
      task.taskId,
      result.error ??
        "Unknown error"
    );

    console.log(
      "❌ Event clustering failed."
    );
  }

  process.exit(0);
}

void testEventClustering();