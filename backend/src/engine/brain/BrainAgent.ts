import {
  BaseAgent,
  type AgentResult,
} from "../agents/BaseAgent.js";

import type {
  AgentTask,
  TaskStatus,
} from "../../types/task.js";

import {
  Task,
  type ITask,
} from "../../models/Task.js";

import {
  TaskManager,
} from "./TaskManager.js";

import {
  eventBus,
} from "../events/EventBus.js";

import {
  agentStarted,
  agentTaskCompleted,
  agentTaskFailed,
  agentIdle,
} from "../events/AgentEvents.js";

import {
  agentMovementRequested,
} from "../events/AgentMovementEvents.js";

import {
  getZoneForDepartment,
} from "../../config/departments.js";

import {
  TechNewsAgent,
} from "../agents/discovery/TechNewsAgent.js";

import {
  ScienceNewsAgent,
} from "../agents/discovery/ScienceNewsAgent.js";

import {
  CultureAgent,
} from "../agents/discovery/CultureAgent.js";

import {
  HistoryAgent,
} from "../agents/discovery/HistoryAgent.js";

import {
  NatureAgent,
} from "../agents/discovery/NatureAgent.js";

import {
  ArticleWriterAgent,
} from "../agents/editorial/ArticleWriterAgent.js";

import {
  EditorAgent,
} from "../agents/editorial/EditorAgent.js";

import {
  HeadlineAgent,
} from "../agents/editorial/HeadlineAgent.js";

import {
  FactCheckAgent,
} from "../agents/quality/FactCheckAgent.js";

import {
  QualityAgent,
} from "../agents/quality/QualityAgent.js";

import {
  IllustrationAgent,
} from "../agents/visual/IllustrationAgent.js";

import {
  ImageAgent,
} from "../agents/visual/ImageAgent.js";

import {
  PageLayoutAgent,
} from "../agents/design/PageLayoutAgent.js";

import {
  EditionLayoutAgent,
} from "../agents/design/EditionLayoutAgent.js";

import {
  NewspaperCompilerAgent,
} from "../agents/design/NewspaperCompilerAgent.js";

export type TaskExecutor = (
  task: AgentTask
) => Promise<AgentResult>;

/*
 * agentId -> agent instance.
 * This is the canonical registry the
 * brain dispatches through.
 */
export const AGENT_REGISTRY: Record<
  string,
  BaseAgent
> = {

  "tech-news-agent":
    new TechNewsAgent(),

  "science-news-agent":
    new ScienceNewsAgent(),

  "culture-agent":
    new CultureAgent(),

  "history-agent":
    new HistoryAgent(),

  "nature-agent":
    new NatureAgent(),

  "article-writer-agent":
    new ArticleWriterAgent(),

  "editor-agent":
    new EditorAgent(),

  "headline-agent":
    new HeadlineAgent(),

  "fact-check-agent":
    new FactCheckAgent(),

  "quality-agent":
    new QualityAgent(),

  "illustration-agent":
    new IllustrationAgent(),

  "image-agent":
    new ImageAgent(),

  "page-layout-agent":
    new PageLayoutAgent(),

  "edition-layout-agent":
    new EditionLayoutAgent(),

  "newspaper-compiler-agent":
    new NewspaperCompilerAgent(),
};

/*
 * The milestone loop:
 *
 *   Brain creates a task
 *     -> agent executes
 *     -> event emitted
 *     -> state stored
 *
 * runTask wraps any execution (registry
 * agent or custom executor) with status
 * updates and lifecycle events.
 */
export class BrainAgent extends BaseAgent {

  id = "brain-agent";

  name = "Brain Agent";

  role =
    "Orchestrate agents, tasks, and edition pipelines";

  department = "management";

  private taskManager =
    new TaskManager();

  /*
   * BaseAgent contract: the brain itself
   * can run "meta" tasks (e.g. planning).
   */
  async execute(
    task: AgentTask
  ): Promise<AgentResult> {

    this.log(
      `Brain meta-task: ${task.type}`
    );

    return {

      success: true,

      output: {

        note: "BrainAgent dispatches work via createTask/runTask; direct execution is a no-op.",

        taskId: task.id,
      },
    };
  }

  getAgent(
    agentId: string
  ): BaseAgent | null {

    return (
      AGENT_REGISTRY[agentId] ??
      null
    );
  }

  registeredAgentIds(): string[] {

    return Object.keys(
      AGENT_REGISTRY
    );
  }

  /*
   * Persist a task and announce it.
   */
  async createTask(
    agentId: string,
    type: string,
    input?: unknown
  ): Promise<ITask> {

    const task =
      await this.taskManager.createTask(
        agentId,
        type,
        input
      );

    eventBus.emit("TASK_CREATED", {

      taskId: task.taskId,

      agentId,

      type,

      at: new Date().toISOString(),
    });

    return task;
  }

  /*
   * Run a persisted task through its
   * agent (or a custom executor, e.g.
   * the StoryWorkflow research step).
   */
  async runTask(
    taskId: string,
    executor?: TaskExecutor
  ): Promise<AgentResult> {

    const record =
      await Task.findOne({
        taskId,
      });

    if (!record) {

      throw new Error(
        `Task not found: ${taskId}`
      );
    }

    const task =
      this.toAgentTask(record);

    const run =
      executor ??
      (await this.resolveExecutor(
        task
      ));

    const agent =
      AGENT_REGISTRY[task.agentId];

    // Ask the campus to walk the agent to
    // its department zone before it
    // starts.
    if (agent) {

      agentMovementRequested(
        task.agentId,
        getZoneForDepartment(
          "management"
        ),
        getZoneForDepartment(
          agent.department
        )
      );
    }

    await this.taskManager.startTask(
      taskId
    );

    agentStarted(
      task.agentId,
      taskId
    );

    this.log(
      `Running task ${taskId} (${task.type})`
    );

    try {

      const result =
        await run(task);

      if (result.success) {

        await this.taskManager.completeTask(
          taskId,
          result.output
        );

        agentTaskCompleted(
          task.agentId,
          taskId,
          result.output
        );

      } else {

        const message =
          result.error ??
          "Unknown error";

        await this.taskManager.failTask(
          taskId,
          message
        );

        agentTaskFailed(
          task.agentId,
          taskId,
          message
        );
      }

      agentIdle(task.agentId);

      return result;

    } catch (error) {

      const message =
        error instanceof Error
          ? error.message
          : "Unknown error";

      await this.taskManager.failTask(
        taskId,
        message
      );

      agentTaskFailed(
        task.agentId,
        taskId,
        message
      );

      agentIdle(task.agentId);

      return {

        success: false,

        error: message,
      };
    }
  }

  private async resolveExecutor(
    task: AgentTask
  ): Promise<TaskExecutor> {

    const agent =
      AGENT_REGISTRY[
        task.agentId
      ];

    if (!agent) {

      throw new Error(
        `No agent registered for id: ${task.agentId}`
      );
    }

    return (t) =>
      agent.execute(t);
  }

  private toAgentTask(
    record: ITask
  ): AgentTask {

    return {

      id: record.taskId,

      agentId: record.agentId,

      type: record.type,

      status:
        record.status as TaskStatus,

      input: record.input,

      output: record.output,

      error: record.error,

      createdAt:
        record.createdAt,

      startedAt:
        record.startedAt,

      completedAt:
        record.completedAt,

      retryCount:
        record.retryCount,
    };
  }
}
