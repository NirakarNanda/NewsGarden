import {
  describe,
  expect,
  it,
} from "vitest";

import {
  DailyEditionWorkflow,
} from "../../src/engine/workflows/DailyEditionWorkflow.js";

/*
 * The workflow is fully offline-safe here: every collaborator
 * (brain, edition manager, story/page workflows) is injected as a
 * recording fake, so no AI provider, network, or MongoDB is touched.
 */

interface TaskCall {
  agentId: string;
  type: string;
}

function makeFakes() {

  const taskTypes: string[] = [];

  const stages: string[] = [];

  const storyArticles: string[] = [];

  const approvals: string[] = [];

  let taskSeq = 0;

  const brain = {

    async createTask(
      agentId: string,
      type: string,
      _input?: unknown
    ): Promise<{ taskId: string }> {

      void _input;

      taskTypes.push(type);

      taskSeq += 1;

      return { taskId: `task-${taskSeq}` };
    },

    async runTask(
      taskId: string
    ): Promise<{ success: boolean; output: unknown }> {

      void taskId;

      const type = taskTypes[taskTypes.length - 1];

      if (type === "quality-review") {

        return {
          success: true,
          output: { editionPassed: true },
        };
      }

      // Discovery tasks return one article per desk.
      return {
        success: true,
        output: { articleIds: [`article-for-${type}`] },
      };
    },
  };

  const editionManager = {

    async createEdition(
      title: string,
      _date: Date
    ): Promise<{ editionId: string; title: string }> {

      void _date;

      return { editionId: "ed-1", title };
    },

    async markStageComplete(
      _editionId: string,
      stage: string
    ): Promise<void> {

      void _editionId;

      stages.push(stage);
    },

    async addArticleToEdition(
      _editionId: string,
      _articleId: string
    ): Promise<void> {

      void _editionId;

      void _articleId;
    },

    async requestApproval(
      editionId: string
    ): Promise<{ status: string }> {

      approvals.push(editionId);

      return { status: "in-review" };
    },
  };

  const storyWorkflow = {

    async run(
      _brain: unknown,
      articleId: string
    ): Promise<{ aiFallback: boolean }> {

      void _brain;

      storyArticles.push(articleId);

      return { aiFallback: false };
    },
  };

  const pageWorkflow = {

    async run(
      _brain: unknown,
      _editionId: string,
      pages: unknown[]
    ): Promise<{ pageCount: number; aiFallback: boolean }> {

      void _brain;

      void _editionId;

      return { pageCount: pages.length, aiFallback: false };
    },
  };

  return {
    taskTypes,
    stages,
    storyArticles,
    approvals,
    deps: {
      brain: brain as never,
      editionManager: editionManager as never,
      storyWorkflow: storyWorkflow as never,
      pageWorkflow: pageWorkflow as never,
    },
  };
}

describe("DailyEditionWorkflow", () => {

  it("runs the edition stages in pipeline order", async () => {

    const fakes = makeFakes();

    const workflow = new DailyEditionWorkflow(fakes.deps);

    const result = await workflow.run({
      maxArticles: 5,
      articlesPerPage: 2,
    });

    expect(result.editionId).toBe("ed-1");

    expect(result.qualityPassed).toBe(true);

    expect(result.status).toBe("in-review");

    // 5 desks x 1 article each.
    expect(result.discovered).toBe(5);

    expect(result.storiesCompleted).toHaveLength(5);

    expect(result.storiesFailed).toHaveLength(0);

    // Stage completion follows the pipeline.
    expect(fakes.stages).toEqual([
      "discovery",
      "editorial",
      "visual",
      "design",
      "quality",
      "approval",
    ]);

    // Discovery runs on all five desks before the quality gate.
    expect(fakes.taskTypes).toEqual([
      "discover-tech-news",
      "discover-science-news",
      "discover-culture-news",
      "discover-history-news",
      "discover-nature-news",
      "quality-review",
    ]);
  });

  it("produces every discovered story and asks a human for approval", async () => {

    const fakes = makeFakes();

    const workflow = new DailyEditionWorkflow(fakes.deps);

    const result = await workflow.run({ maxArticles: 5 });

    // One story run per discovered article.
    expect(fakes.storyArticles).toHaveLength(5);

    expect(fakes.storyArticles).toEqual(result.storiesCompleted);

    // Human approval is requested exactly once, for this edition.
    expect(fakes.approvals).toEqual(["ed-1"]);

    // 5 stories at 4 per page -> 2 pages.
    expect(result.pageCount).toBe(2);
  });

  it("never publishes on its own", async () => {

    const fakes = makeFakes();

    const workflow = new DailyEditionWorkflow(fakes.deps);

    const result = await workflow.run({ maxArticles: 5 });

    // The edition stops at in-review; publication needs a human.
    expect(result.status).toBe("in-review");

    expect(fakes.taskTypes).not.toContain("publish-edition");
  });
});
