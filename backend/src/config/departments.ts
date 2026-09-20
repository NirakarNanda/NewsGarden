export interface Department {
  id: string;

  name: string;

  // Campus zone the department lives in.
  zone: string;
}

export const DEPARTMENTS: Department[] = [
  {
    id: "discovery",
    name: "Discovery",
    zone: "Newsroom",
  },

  {
    id: "research",
    name: "Research",
    zone: "ResearchLab",
  },

  {
    id: "editorial",
    name: "Editorial",
    zone: "EditorialRoom",
  },

  {
    id: "visual",
    name: "Visual",
    zone: "VisualStudio",
  },

  {
    id: "design",
    name: "Design",
    zone: "DesignStudio",
  },

  {
    id: "quality",
    name: "Quality",
    zone: "QualityRoom",
  },

  {
    id: "management",
    name: "Management",
    zone: "Newsroom",
  },
];

export function getZoneForDepartment(
  departmentId: string
): string {

  const department = DEPARTMENTS.find(
    (candidate) => candidate.id === departmentId
  );

  return department?.zone ?? "Newsroom";
}
