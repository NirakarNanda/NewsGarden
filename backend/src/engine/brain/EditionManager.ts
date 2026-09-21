import {
  randomUUID,
} from "crypto";

import {
  getEditionStore,
  type EditionRecord,
} from "./editionStore.js";

import {
  Approval,
} from "../../models/Approval.js";

import {
  eventBus,
} from "../events/EventBus.js";

import {
  editionMemory,
  type EditionStage,
} from "../memory/EditionMemory.js";

import {
  EmailService,
} from "../tools/notification/EmailService.js";

interface ApprovalDocLike {

  status?: string;
}

/*
 * Owns the edition lifecycle:
 * draft -> in-progress -> in-review
 * -> (human approval) -> published.
 *
 * Never auto-publishes: publishEdition
 * requires an existing approval record
 * with status "approved".
 */
export class EditionManager {

  private emailService =
    new EmailService();

  async createEdition(
    title: string,
    date: Date = new Date()
  ): Promise<EditionRecord> {

    const store =
      await getEditionStore();

    const editionId =
      randomUUID();

    const edition =
      await store.create({

        editionId,

        title,

        date,

        status: "draft",

        articleIds: [],

        pageIds: [],

        stagesCompleted: [],

        aiFallback: false,
      });

    editionMemory.beginEdition(
      editionId
    );

    console.log(
      `[EditionManager] Created edition "${title}" (${editionId})`
    );

    return edition;
  }

  async addArticleToEdition(
    editionId: string,
    articleId: string
  ): Promise<EditionRecord | null> {

    const store =
      await getEditionStore();

    const edition =
      await store.findById(
        editionId
      );

    if (!edition) {

      throw new Error(
        `Edition not found: ${editionId}`
      );
    }

    if (
      !edition.articleIds.includes(
        articleId
      )
    ) {

      edition.articleIds.push(
        articleId
      );
    }

    return store.update(
      editionId,
      {
        articleIds:
          edition.articleIds,
      }
    );
  }

  async markStageComplete(
    editionId: string,
    stage: EditionStage,
    taskId: string = ""
  ): Promise<void> {

    editionMemory.completeStage(
      stage,
      taskId
    );

    // Persist on the edition record so the API can report progress
    // even after a restart (editionMemory is in-memory only).
    try {

      const store =
        await getEditionStore();

      const edition =
        await store.findById(
          editionId
        );

      if (edition) {

        const stagesCompleted =
          edition.stagesCompleted.includes(stage)
            ? edition.stagesCompleted
            : [...edition.stagesCompleted, stage];

        await store.update(
          editionId,
          { stagesCompleted }
        );
      }

    } catch (error) {

      console.error(
        `[EditionManager] Failed to persist stage ${stage} for ${editionId}:`,
        error instanceof Error ? error.message : error
      );
    }

    eventBus.emit(
      "EDITION_STAGE_COMPLETED",
      {

        editionId,

        stage,

        taskId: taskId || null,

        at: new Date().toISOString(),
      }
    );

    console.log(
      `[EditionManager] Stage completed: ${stage}`
    );
  }

  /*
   * Mark the edition as built with the offline AI
   * fallback (AI provider unreachable). Persisted so
   * the API/UI can label it visibly.
   */
  async setAiFallback(
    editionId: string
  ): Promise<void> {

    try {

      const store =
        await getEditionStore();

      await store.update(
        editionId,
        { aiFallback: true }
      );

    } catch (error) {

      console.error(
        `[EditionManager] Failed to persist aiFallback for ${editionId}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  /*
   * Move the edition to human review.
   * Sends the approval notification email
   * (console fallback when SMTP is absent).
   */
  async requestApproval(
    editionId: string
  ): Promise<EditionRecord | null> {

    const store =
      await getEditionStore();

    const edition =
      await store.findById(
        editionId
      );

    if (!edition) {

      throw new Error(
        `Edition not found: ${editionId}`
      );
    }

    const updated =
      await store.update(
        editionId,
        {
          status: "in-review",
        }
      );

    eventBus.emit(
      "EDITION_READY_FOR_APPROVAL",
      {

        editionId,

        title: edition.title,

        articleCount:
          edition.articleIds.length,

        source:
          "edition-manager",

        at: new Date().toISOString(),
      }
    );

    const frontendUrl =
      process.env.FRONTEND_URL ??
      "http://localhost:3000";

    await this.emailService.sendApprovalNotification(
      {

        to:
          process.env
            .APPROVAL_EMAIL_TO ??
          "editor@localhost",

        editionTitle:
          edition.title,

        editionId,

        articleCount:
          edition.articleIds.length,

        reviewUrl: `${frontendUrl}/approve/${editionId}`,
      }
    );

    console.log(
      `[EditionManager] Edition "${edition.title}" requested approval.`
    );

    return updated;
  }

  /*
   * Publish ONLY when a human approval
   * record exists. Never auto-publishes.
   */
  async publishEdition(
    editionId: string
  ): Promise<{
    success: boolean;
    reason?: string;
  }> {

    const approval =
      await this.findApproval(
        editionId
      );

    if (!approval) {

      return {

        success: false,

        reason:
          "No approval record found for this edition.",
      };
    }

    if (
      approval.status !==
      "approved"
    ) {

      return {

        success: false,

        reason: `Approval status is "${approval.status ?? "unknown"}", not "approved".`,
      };
    }

    const store =
      await getEditionStore();

    await store.update(
      editionId,
      {
        status: "published",
      }
    );

    eventBus.emit(
      "EDITION_PUBLISHED",
      {

        editionId,

        at: new Date().toISOString(),
      }
    );

    console.log(
      `[EditionManager] Edition ${editionId} published (human-approved).`
    );

    return { success: true };
  }

  private async findApproval(
    editionId: string
  ): Promise<ApprovalDocLike | null> {

    try {

      return await Approval.findOne(
        { editionId }
      );

    } catch (error) {

      console.warn(
        "[EditionManager] Approval lookup failed:",

        error instanceof Error
          ? error.message
          : error
      );

      return null;
    }
  }
}
