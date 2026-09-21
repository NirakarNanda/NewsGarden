import { fetchAgents } from "@/features/agents/agentApi";
import type { AgentStatus } from "@/types/agent";
import Badge, { type BadgeTone } from "@/components/ui/Badge";
import { EmptyState, ErrorState } from "@/components/ui/DataState";
import NewsroomNav from "@/components/layout/NewsroomNav";

export const dynamic = "force-dynamic";

export const metadata = { title: "Agents — The Daily NEXA" };

function statusTone(status: AgentStatus): BadgeTone {
  switch (status) {
    case "working":
      return "blue";
    case "completed":
      return "green";
    case "error":
      return "red";
    case "walking":
    case "waiting":
      return "amber";
    default:
      return "default";
  }
}

export default async function AgentsPage() {
  let agents: Awaited<ReturnType<typeof fetchAgents>> | null = null;
  try {
    agents = await fetchAgents();
  } catch {
    agents = null;
  }

  return (
    <div className="min-h-screen bg-[#0b0f1a]">
      <NewsroomNav active="/newsroom/agents" />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-[#f2f4ff]">Agents</h1>
        <p className="mt-1 text-sm text-[#b8c0dc]">
          The newsroom roster — status and location, straight from the agent registry.
        </p>

        {agents === null ? (
          <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.02] p-6">
            <ErrorState
              title="Couldn't load agents"
              detail="The backend didn't respond. Start it with `npm run dev` in backend/ and try again."
              backHref="/newsroom"
            />
          </div>
        ) : agents.length === 0 ? (
          <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.02]">
            <EmptyState title="No agents registered" detail="The agent registry is empty." />
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-widest text-[#8f97b8]">
                  <th scope="col" className="px-5 py-3 font-medium">Agent</th>
                  <th scope="col" className="px-5 py-3 font-medium">Role</th>
                  <th scope="col" className="px-5 py-3 font-medium">Department</th>
                  <th scope="col" className="px-5 py-3 font-medium">Status</th>
                  <th scope="col" className="px-5 py-3 font-medium">Location</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5 font-medium text-[#f2f4ff]">{a.name}</td>
                    <td className="max-w-[240px] truncate px-5 py-3.5 text-[#b8c0dc]" title={a.role}>
                      {a.role}
                    </td>
                    <td className="px-5 py-3.5 text-[#b8c0dc]">{a.department}</td>
                    <td className="px-5 py-3.5">
                      <Badge tone={statusTone(a.status)}>{a.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-[#b8c0dc]">{a.location.replace("-", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
