import {
  EventJudgeAgent,
} from "../engine/agents/discovery/EventJudgeAgent.js";

async function testEventJudge() {

  const agent =
    new EventJudgeAgent();

  console.log(
    "\n🧪 Test 1: Same event\n"
  );

  const sameEvent =
    await agent.execute({

      id: "test-1",

      agentId:
        "event-judge-agent",

      type:
        "judge-event",

      status: "running",

      retryCount: 0,

      createdAt:
        new Date(),

      input: {

        existingArticle: {
          source: "TechCrunch",

          title:
            "OpenAI launches new AI model",

          summary:
            "OpenAI announced its latest AI model for developers.",
        },

        candidateArticle: {
          source: "The Verge",

          title:
            "OpenAI unveils its latest model",

          summary:
            "The company introduced a new AI model aimed at developers.",
        },
      },
    });

 console.log(
  sameEvent.success
    ? sameEvent.output
    : sameEvent.error
);


  console.log(
    "\n🧪 Test 2: Different events\n"
  );

  const differentEvent =
    await agent.execute({

      id: "test-2",

      agentId:
        "event-judge-agent",

      type:
        "judge-event",

      status: "running",

      retryCount: 0,

      createdAt:
        new Date(),

      input: {

        existingArticle: {
          source: "MIT Technology Review",

          title:
            "Meet a mouse whose brain cortex is made up of human cells",

          summary:
            "Researchers created mice whose brains contain human cells.",
        },

        candidateArticle: {
          source: "MIT Technology Review",

          title:
            "Meet the innovators under 35 shaping climate tech",

          summary:
            "Young innovators are developing new technologies to address climate change.",
        },
      },
    });

  console.log(
    differentEvent.output
  );
}

void testEventJudge();