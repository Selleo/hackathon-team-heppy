"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";

export function ConversationList() {
  const pathname = usePathname();
  const { data: conversations, isLoading } = api.conversation.list.useQuery();
  const createConversation = api.conversation.create.useMutation();
  const utils = api.useUtils();

  const handleCreateConversation = async () => {
    try {
      const newConversation = await createConversation.mutateAsync({
        title: "New Chat",
      });
      
      if (!newConversation) {
        throw new Error("Failed to create conversation");
      }
      
      // Invalidate and refetch conversations
      await utils.conversation.list.invalidate();
      
      // Navigate to new conversation
      window.location.href = `/chat/${newConversation.id}`;
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-64 flex-col border-r bg-muted/10">
        <div className="border-b p-4">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1 space-y-2 p-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/10">
      <div className="border-b p-4">
        <Button
          onClick={handleCreateConversation}
          className="w-full"
          disabled={createConversation.isPending}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {conversations?.map((conversation) => {
            const isActive = pathname === `/chat/${conversation.id}`;
            
            return (
              <Link
                key={conversation.id}
                href={`/chat/${conversation.id}`}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted ${
                  isActive ? "bg-muted font-medium" : ""
                }`}
              >
                <div className="truncate">{conversation.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {conversation.messageCount} messages
                </div>
              </Link>
            );
          })}
          
          {conversations?.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No conversations yet.
              <br />
              Create one to get started!
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

