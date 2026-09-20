import {
  describe,
  expect,
  it,
} from "vitest";

import {
  DependencyResolver,
  PIPELINE_ORDER,
  isStageComplete,
  nextStage,
  nextTaskTypes,
  stageForTaskType,
} from "../../src/engine/brain/DependencyResolver.js";

describe("DependencyResolver", () => {

  it("orders stages discovery -> editorial -> visual -> design -> quality -> approval", () => {

    // Research is a step inside story production (the editorial stage),
    // not a top-level stage: see STAGE_TASK_TYPES.
    expect(PIPELINE_ORDER).toEqual([
      "discovery",
      "editorial",
      "visual",
      "design",
      "quality",
      "approval",
    ]);
  });

  it("returns the first incomplete stage", () => {

    expect(nextStage([])).toBe("discovery");

    expect(nextStage(["discovery"])).toBe("editorial");

    expect(nextStage(["discovery", "editorial"])).toBe("visual");

    expect(
      nextStage([
        "discovery",
        "editorial",
        "visual",
        "design",
        "quality",
        "approval",
      ])
    ).toBeNull();
  });

  it("maps task types to their stage", () => {

    expect(stageForTaskType("discover-tech-news")).toBe("discovery");

    expect(stageForTaskType("discover-science-news")).toBe("discovery");

    expect(stageForTaskType("research-story")).toBe("editorial");

    expect(stageForTaskType("write-article")).toBe("editorial");

    expect(stageForTaskType("edit-article")).toBe("editorial");

    expect(stageForTaskType("generate-illustration")).toBe("visual");

    expect(stageForTaskType("layout-page")).toBe("design");

    expect(stageForTaskType("fact-check")).toBe("quality");

    expect(stageForTaskType("quality-review")).toBe("quality");

    expect(stageForTaskType("nope-not-a-task")).toBeNull();
  });

  it("offers the next stage's task types once a stage completes", () => {

    const afterDiscovery = nextTaskTypes(["discovery"]);

    expect(afterDiscovery).toContain("research-story");

    expect(afterDiscovery).toContain("write-article");

    const afterEditorial = nextTaskTypes(["discovery", "editorial"]);

    expect(afterEditorial).toContain("generate-illustration");

    expect(nextTaskTypes([])).toContain("discover-tech-news");
  });

  it("reports stage completion", () => {

    expect(isStageComplete("discovery", ["discovery"])).toBe(true);

    expect(isStageComplete("editorial", ["discovery"])).toBe(false);
  });

  it("exposes the same logic through the class wrapper", () => {

    const resolver = new DependencyResolver();

    expect(resolver.nextStage([])).toBe("discovery");

    expect(resolver.stageForTaskType("write-article")).toBe("editorial");

    expect(resolver.nextTaskTypes(["discovery"])).toContain("research-story");
  });
});
