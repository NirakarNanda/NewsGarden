import {
  getAllAgents,
  getAgentById,
  type AgentRuntimeState,
} from "../repositories/agent.repository.js";

import {
  getZoneForDepartment,
} from "../config/departments.js";

import type {
  CampusAgentView,
} from "../types/campus.js";

export async function listAgents(): Promise<
  CampusAgentView[]
> {

  const agents = getAllAgents();

  return agents.map(toCampusAgentView);
}

export async function getAgentStatus(
  agentId: string
): Promise<CampusAgentView | null> {

  const agent = getAgentById(agentId);

  if (!agent) {

    return null;
  }

  return toCampusAgentView(agent);
}

function toCampusAgentView(
  agent: AgentRuntimeState
): CampusAgentView {

  return {

    agentId: agent.id,

    name: agent.name,

    department: agent.department,

    state: agent.state,

    zone: getZoneForDepartment(agent.department),

    x: agent.x,

    y: agent.y,
  };
}
