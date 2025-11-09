import { notFound, redirect } from "next/navigation";
import { getSession } from "@/server/better-auth/server";
import { db } from "@/server/db";
import { graphs } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { GraphViewer } from "./_components/graph-viewer";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function GraphPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch graph metadata
  const [graph] = await db
    .select({
      id: graphs.id,
      name: graphs.name,
      icon: graphs.icon,
      status: graphs.status,
      userId: graphs.userId,
      createdAt: graphs.createdAt,
    })
    .from(graphs)
    .where(eq(graphs.id, id))
    .limit(1);

  if (!graph) {
    notFound();
  }

  // Verify ownership
  if (graph.userId !== session.user.id) {
    notFound();
  }

  return (
    <GraphViewer
      graphId={graph.id}
      graphIcon={graph.icon}
      graphName={graph.name}
      initialStatus={graph.status}
    />
  );
}
