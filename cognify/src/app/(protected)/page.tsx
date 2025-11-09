import { CreateGraphForm } from "@/app/_components/create-graph-form";

export default async function Home() {
  return (
    <div className="px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Create Knowledge Graph</h1>
          <p className="text-muted-foreground mt-2">
            Generate an interactive knowledge graph from a topic or your own text
          </p>
        </div>

        <CreateGraphForm />
      </div>
    </div>
  );
}
