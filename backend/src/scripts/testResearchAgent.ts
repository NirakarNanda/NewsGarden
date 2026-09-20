import { connectDatabase } from "../config/database.js";

import {
  Event,
} from "../models/Event.js";

import {
  ResearchAgent,
} from "../engine/agents/research/ResearchAgent.js";

import {
  TaskManager,
} from "../engine/brain/TaskManager.js";

async function testResearchAgent() {

  await connectDatabase();

  const event =
    await Event.findOne()
      .sort({
        updatedAt: -1,
      });

  if (!event) {

    console.log(
      "❌ No events found."
    );

    process.exit(1);
  }

  console.log(
    `\n📰 Testing event: "${event.title}"`
  );

  const taskManager =
    new TaskManager();

  const task =
    await taskManager.createTask(
      "research-agent",
      "research-event",
      {
        eventId:
          event.eventId,
      }
    );

  await taskManager.startTask(
    task.taskId
  );

  const agent =
    new ResearchAgent();

  const result =
    await agent.execute({

      id:
        task.taskId,

      agentId:
        "research-agent",

      type:
        "research-event",

      status:
        "running",

      retryCount:
        0,

      createdAt:
        new Date(),

      input: {
        eventId:
          event.eventId,
      },
    });

  if (result.success) {

    await taskManager.completeTask(
      task.taskId,
      result.output
    );

    console.log(
      "\n✅ Research Agent completed."
    );

    console.log(
      result.output
    );

  } else {

    await taskManager.failTask(
      task.taskId,
      result.error ?? "Unknown error"
    );

    console.error(
      "\n❌ Research Agent failed."
    );

    console.error(
      result.error
    );
  }

  process.exit(0);
}

void testResearchAgent();