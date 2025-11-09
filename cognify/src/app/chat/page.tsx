"use client";

import { useState } from "react";
import { Trash2, MessageSquare } from "lucide-react";
import { MessageList } from "@/app/_components/message-list";
import { MessageInput } from "@/app/_components/message-input";
import { KnowledgePanel } from "@/app/_components/Atlas/KnowledgePanel";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ChatPage() {
  const [optimisticMessages, setOptimisticMessages] = useState<
    Array<{
      id: string;
      content: string;
      authorType: "user" | "ai";
      timestamp: Date;
    }>
  >([]);

  const {
    data: messages,
    isLoading,
  } = api.chat.getHistory.useQuery();

  const sendMessage = api.chat.sendMessage.useMutation({
    onMutate: async (variables) => {
      // Add optimistic user message
      const tempUserMessage = {
        id: `temp-${Date.now()}`,
        content: variables.content,
        authorType: "user" as const,
        timestamp: new Date(),
      };
      setOptimisticMessages((prev) => [...prev, tempUserMessage]);
    },
    onSuccess: () => {
      // Clear optimistic messages and refetch
      setOptimisticMessages([]);
      void utils.chat.getHistory.invalidate();
      
      // Invalidate knowledge list to refresh the Atlas panel
      void utils.knowledge.list.invalidate();
      void utils.dashboard.getSummary.invalidate();
    },
    onError: () => {
      // Remove optimistic messages on error
      setOptimisticMessages([]);
    },
  });

  const clearChat = api.chat.clearHistory.useMutation({
    onSuccess: () => {
      void utils.chat.getHistory.invalidate();
    },
  });

  const utils = api.useUtils();

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage.mutateAsync({ content });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleClearChat = async () => {
    try {
      await clearChat.mutateAsync();
    } catch (error) {
      console.error("Failed to clear chat:", error);
    }
  };

  const allMessages = [
    ...(messages ?? []),
    ...optimisticMessages,
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Cognify Chat</h1>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Clear Chat
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete all messages in your chat. Your knowledge items will be preserved.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearChat}>
                  Clear Chat
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Messages */}
        <MessageList messages={allMessages} isLoading={isLoading} />

        {/* Loading indicator when sending */}
        {sendMessage.isPending && (
          <div className="flex shrink-0 items-center justify-center gap-2 border-t p-2 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" />
            <span>AI is thinking...</span>
          </div>
        )}

        {/* Input */}
        <div className="shrink-0">
          <MessageInput
            onSend={handleSendMessage}
            disabled={sendMessage.isPending}
          />
        </div>
      </div>
      
      {/* Knowledge Panel */}
      <KnowledgePanel />
    </div>
  );
}
