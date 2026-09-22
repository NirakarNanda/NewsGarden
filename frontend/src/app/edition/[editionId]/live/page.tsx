import type { Metadata } from "next";
import LiveBuildView from "./LiveBuildView";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ editionId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { editionId } = await params;
  return { title: `Live build — ${editionId.slice(0, 8)} — NewsGarden` };
}

export default async function EditionLivePage({ params }: Params) {
  const { editionId } = await params;
  return <LiveBuildView editionId={editionId} />;
}
