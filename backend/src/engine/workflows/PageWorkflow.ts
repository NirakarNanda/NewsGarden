import {
  BrainAgent,
} from "../brain/BrainAgent.js";

import { eventBus } from "../events/EventBus.js";

export interface PageWorkflowResult {

  editionId: string;

  pageIds: string[];

  pageCount: number;

  taskIds: string[];

  aiFallback: boolean;
}

/*
 * Page pipeline:
 *
 *   layout-page (for each page)
 *     -> layout-edition
 */
export class PageWorkflow {

  async run(
    brain: BrainAgent,
    editionId: string,
    pages: {
      pageNumber: number;
      articleIds: string[];
    }[]
  ): Promise<PageWorkflowResult> {

    const taskIds: string[] =
      [];

    const pageIds: string[] =
      [];

    let aiFallback = false;

    for (const page of pages) {

      const task =
        await brain.createTask(
          "page-layout-agent",
          "layout-page",
          {

            editionId,

            pageNumber:
              page.pageNumber,

            articleIds:
              page.articleIds,
          }
        );

      taskIds.push(
        task.taskId
      );

      const result =
        await brain.runTask(
          task.taskId
        );

      if (!result.success) {

        throw new Error(
          `PageWorkflow failed at layout-page ${page.pageNumber}: ${result.error ?? "unknown error"}`
        );
      }

      const output =
        result.output as {
          pageId: string;
          aiFallback?: boolean;
        };

      pageIds.push(
        output.pageId
      );

      // Surface each laid-out page on the live build view.
      eventBus.emit("PAGE_SLOT_FILLED", {
        editionId,
        pageId: output.pageId,
        pageNumber: page.pageNumber,
        articleIds: page.articleIds,
        at: new Date().toISOString(),
      });

      if (
        output.aiFallback
      ) {

        aiFallback = true;
      }
    }

    const editionTask =
      await brain.createTask(
        "edition-layout-agent",
        "layout-edition",
        {

          editionId,

          pageIds,
        }
      );

    taskIds.push(
      editionTask.taskId
    );

    const editionResult =
      await brain.runTask(
        editionTask.taskId
      );

    if (
      !editionResult.success
    ) {

      throw new Error(
        `PageWorkflow failed at layout-edition: ${editionResult.error ?? "unknown error"}`
      );
    }

    return {

      editionId,

      pageIds,

      pageCount:
        pageIds.length,

      taskIds,

      aiFallback,
    };
  }
}
