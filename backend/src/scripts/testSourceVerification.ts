import {
  connectDatabase,
} from "../config/database.js";

import {
  Event,
} from "../models/Event.js";

import {
  SourceVerificationAgent,
} from "../engine/agents/research/SourceVerificationAgent.js";

import {
  TaskManager,
} from "../engine/brain/TaskManager.js";

async function testSourceVerification() {

  await connectDatabase();

  const event =
    await Event.findOne({
      articleIds: {
        $exists: true,
        $not: {
          $size: 1,
        },
      },
    }).sort({
      updatedAt: -1,
    });

  if (!event) {
    console.log(
      "❌ No multi-article event found."
    );

    process.exit(1);
  }

  console.log(
    `\n📰 Testing source verification`
  );

  console.log(
    `Event: "${event.title}"`
  );

  console.log(
    `Articles: ${event.articleIds.length}`
  );

  const taskManager =
    new TaskManager();

  const task =
    await taskManager.createTask(
      "source-verification-agent",
      "verify-sources",
      {
        eventId:
          event.eventId,
      }
    );

  await taskManager.startTask(
    task.taskId
  );

  const agent =
    new SourceVerificationAgent();

  const result =
    await agent.execute({

      id:
        task.taskId,

      agentId:
        "source-verification-agent",

      type:
        "verify-sources",

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
      "\n✅ Source Verification completed."
    );

    console.dir(
      result.output,
      {
        depth: null,
      }
    );

  } else {

    await taskManager.failTask(
      task.taskId,
      result.error ?? "Unknown error"
    );

    console.error(
      "\n❌ Source Verification failed."
    );

    console.error(
      result.error
    );
  }

  process.exit(0);
}

void testSourceVerification();