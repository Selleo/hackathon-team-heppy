export type KnowledgeItem = {
  id: string;
  title: string;
  description: string | null;
  status: "Latent" | "Identified Gap" | "Learning" | "Mastered";
  categoryPath: string | null;
  updatedAt: Date;
};