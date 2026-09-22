import {
  BaseAgent,
  type AgentResult,
} from "../BaseAgent.js";

import type {
  AgentTask,
} from "../../../types/task.js";

import {
  Edition,
} from "../../../models/Edition.js";

import {
  NewspaperPage,
} from "../../../models/NewspaperPage.js";

import {
  eventBus,
} from "../../events/EventBus.js";

interface CompileInput {

  editionId: string;
}

/*
 * Assembles the whole newspaper from the
 * edition's pages — but only when every
 * page has been human-approved.
 *
 * The user approves pages one by one on
 * the edition view; once all are
 * approved, the "Create full newspaper"
 * button runs this agent. It verifies
 * approvals, orders the pages, stamps the
 * edition compiled, and emits
 * NEWSPAPER_COMPILED. It never publishes:
 * publication still needs the separate
 * human approve + publish actions.
 */
export class NewspaperCompilerAgent
  extends BaseAgent {

  id = "newspaper-compiler-agent";

  name = "Newspaper Compiler";

  role =
    "Assemble approved pages into the full newspaper";

  department = "design";

  async execute(
    task: AgentTask
  ): Promise<AgentResult> {

    this.log(
      "Compiling the full newspaper..."
    );

    try {

      const input =
        task.input as CompileInput;

      const editionId =
        input.editionId;

      if (!editionId) {

        throw new Error(
          "Missing editionId"
        );
      }

      const edition =
        await Edition.findOne({
          editionId,
        });

      if (!edition) {

        throw new Error(
          `Edition not found: ${editionId}`
        );
      }

      const pages =
        await NewspaperPage.find({
          editionId,
        }).sort({
          pageNumber: 1,
        });

      if (
        pages.length === 0
      ) {

        throw new Error(
          "This edition has no pages to compile."
        );
      }

      const unapproved =
        pages.filter(
          (p) =>
            p.status !== "approved"
        );

      if (
        unapproved.length > 0
      ) {

        const numbers =
          unapproved
            .map(
              (p) => p.pageNumber
            )
            .join(", ");

        throw new Error(
          `Cannot compile: page(s) ${numbers} are not approved yet. ` +
          `Approve every page first.`
        );
      }

      const pageIds =
        pages.map((p) => p.pageId);

      edition.pageIds = pageIds;

      edition.status = "compiled";

      await edition.save();

      eventBus.emit(
        "NEWSPAPER_COMPILED",
        {

          editionId,

          pageCount:
            pages.length,

          pageIds,

          source:
            "newspaper-compiler-agent",

          at: new Date().toISOString(),
        }
      );

      this.log(
        `Newspaper compiled: ${pages.length} pages.`
      );

      return {

        success: true,

        output: {

          editionId,

          pageCount:
            pages.length,

          pageIds,

          status: "compiled",

          taskId: task.id,
        },
      };

    } catch (error) {

      this.log(
        "Newspaper compilation failed."
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
