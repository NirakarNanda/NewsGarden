import {
  BaseAgent,
  type AgentResult,
} from "../BaseAgent.js";

import type {
  AgentTask,
} from "../../../types/task.js";

import {
  getEditionStore,
} from "../../brain/editionStore.js";

interface LayoutEditionInput {

  editionId: string;

  // Page ids produced by PageWorkflow,
  // in reading order.
  pageIds?: string[];
}

/*
 * Assembles the edition: collects its
 * pages in order and marks the edition
 * "in-progress" so design is visibly
 * underway. Deterministic — no AI needed.
 */
export class EditionLayoutAgent
  extends BaseAgent {

  id = "edition-layout-agent";

  name = "Edition Layout Agent";

  role =
    "Assemble pages into a complete edition";

  department = "design";

  async execute(
    task: AgentTask
  ): Promise<AgentResult> {

    this.log(
      "Assembling edition layout..."
    );

    try {

      const input =
        task.input as LayoutEditionInput;

      const store =
        await getEditionStore();

      const edition =
        await store.findById(
          input.editionId
        );

      if (!edition) {

        throw new Error(
          `Edition not found: ${input.editionId}`
        );
      }

      const pageIds =
        input.pageIds ??
        edition.pageIds;

      const updated =
        await store.update(
          input.editionId,
          {

            pageIds,

            status:
              "in-progress",
          }
        );

      if (!updated) {

        throw new Error(
          `Could not update edition: ${input.editionId}`
        );
      }

      this.log(
        `Edition ${input.editionId} assembled: ${pageIds.length} pages.`
      );

      return {

        success: true,

        output: {

          editionId:
            input.editionId,

          pageIds,

          pageCount:
            pageIds.length,

          status:
            updated.status,

          taskId: task.id,
        },
      };

    } catch (error) {

      this.log(
        "Edition layout failed."
      );

      return {

        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      };
    }
  }
}
