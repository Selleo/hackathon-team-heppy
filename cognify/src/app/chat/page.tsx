import { redirect } from "next/navigation";
import { api } from "@/trpc/server";

export default async function ChatIndexPage() {
  // Get user's conversations
  const conversations = await api.conversation.list();

  // If user has conversations, redirect to the most recent one
  if (conversations.length > 0) {
    redirect(`/chat/${conversations[0]!.id}`);
  }

  // Otherwise, create a new conversation
  const newConversation = await api.conversation.create({
    title: "Getting Started",
  });

  redirect(`/chat/${newConversation!.id}`);
}

