/*
 * Pipeline order for a NewsGarden edition.
 *
 * Pure functions — no I/O, no AI — so the
 * whole module is unit-testable.
 */

export type PipelineStage =
  | "discovery"
  | "editorial"
  | "visual"
  | "design"
  | "quality"
  | "approval";

export const PIPELINE_ORDER: PipelineStage[] =
  [
    "discovery",
    "editorial",
    "visual",
    "design",
    "quality",
    "approval",
  ];

/*
 * Task types that belong to each stage.
 * Mirrors the shared task-type glossary.
 */
export const STAGE_TASK_TYPES: Record<
  PipelineStage,
  string[]
> = {

  discovery: [
    "discover-tech-news",
    "discover-science-news",
    "discover-culture-news",
    "discover-history-news",
    "discover-nature-news",
  ],

  editorial: [
    "research-story",
    "write-article",
    "edit-article",
    "write-headline",
  ],

  visual: [
    "generate-illustration",
    "generate-image",
  ],

  design: [
    "layout-page",
    "layout-edition",
  ],

  quality: [
    "fact-check",
    "quality-review",
  ],

  // Human step: no agent task types.
  approval: [],
};

export function stageForTaskType(
  taskType: string
): PipelineStage | null {

  for (const stage of PIPELINE_ORDER) {

    if (
      STAGE_TASK_TYPES[
        stage
      ].includes(taskType)
    ) {

      return stage;
    }
  }

  return null;
}

/*
 * Given the stages already completed,
 * return the next stage's runnable task
 * types. Later stages stay blocked until
 * every earlier stage is done.
 */
export function nextTaskTypes(
  completedStages: PipelineStage[]
): string[] {

  const done = new Set(
    completedStages
  );

  for (const stage of PIPELINE_ORDER) {

    if (!done.has(stage)) {

      return [
        ...STAGE_TASK_TYPES[stage],
      ];
    }
  }

  return [];
}

export function nextStage(
  completedStages: PipelineStage[]
): PipelineStage | null {

  const done = new Set(
    completedStages
  );

  for (const stage of PIPELINE_ORDER) {

    if (!done.has(stage)) {

      return stage;
    }
  }

  return null;
}

export function isStageComplete(
  stage: PipelineStage,
  completedStages: PipelineStage[]
): boolean {

  return completedStages.includes(
    stage
  );
}

/*
 * Thin class wrapper for call sites that
 * prefer an instance.
 */
export class DependencyResolver {

  nextTaskTypes(
    completedStages: PipelineStage[]
  ): string[] {

    return nextTaskTypes(
      completedStages
    );
  }

  nextStage(
    completedStages: PipelineStage[]
  ): PipelineStage | null {

    return nextStage(
      completedStages
    );
  }

  stageForTaskType(
    taskType: string
  ): PipelineStage | null {

    return stageForTaskType(
      taskType
    );
  }
}
