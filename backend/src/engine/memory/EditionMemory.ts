export type EditionStage =
  | "discovery"
  | "editorial"
  | "visual"
  | "design"
  | "quality"
  | "approval";

export interface StageRecord {

  status:
    | "pending"
    | "in-progress"
    | "completed";

  taskId?: string;

  completedAt?: Date;
}

export interface EditionBuildState {

  editionId: string | null;

  startedAt: Date | null;

  stages: Record<
    EditionStage,
    StageRecord
  >;

  completedTaskIds: string[];
}

function freshStages(): Record<
  EditionStage,
  StageRecord
> {

  const pending = ():
    | StageRecord => ({
    status: "pending",
  });

  return {

    discovery: pending(),

    editorial: pending(),

    visual: pending(),

    design: pending(),

    quality: pending(),

    approval: pending(),
  };
}

/*
 * Tracks the edition currently being
 * built: which stage each department is
 * in and which tasks finished.
 *
 * Pure in-memory working state; the
 * Edition document in MongoDB remains
 * the durable record.
 */
export class EditionMemory {

  private state: EditionBuildState =
    this.emptyState();

  private emptyState(): EditionBuildState {

    return {

      editionId: null,

      startedAt: null,

      stages: freshStages(),

      completedTaskIds: [],
    };
  }

  beginEdition(
    editionId: string
  ): void {

    this.state =
      this.emptyState();

    this.state.editionId =
      editionId;

    this.state.startedAt =
      new Date();

    this.state.stages.discovery.status =
      "in-progress";
  }

  completeStage(
    stage: EditionStage,
    taskId: string
  ): void {

    const record =
      this.state.stages[stage];

    record.status =
      "completed";

    record.taskId = taskId;

    record.completedAt =
      new Date();

    if (
      !this.state.completedTaskIds.includes(
        taskId
      )
    ) {

      this.state.completedTaskIds.push(
        taskId
      );
    }

    const order: EditionStage[] = [
      "discovery",
      "editorial",
      "visual",
      "design",
      "quality",
      "approval",
    ];

    const next =
      order[
        order.indexOf(stage) + 1
      ];

    if (
      next &&
      this.state.stages[next]
        .status === "pending"
    ) {

      this.state.stages[
        next
      ].status = "in-progress";
    }
  }

  recordTask(taskId: string): void {

    if (
      !this.state.completedTaskIds.includes(
        taskId
      )
    ) {

      this.state.completedTaskIds.push(
        taskId
      );
    }
  }

  getState(): EditionBuildState {

    return {
      ...this.state,

      stages: { ...this.state.stages },

      completedTaskIds: [
        ...this.state.completedTaskIds,
      ],
    };
  }

  reset(): void {

    this.state =
      this.emptyState();
  }
}

export const editionMemory =
  new EditionMemory();
