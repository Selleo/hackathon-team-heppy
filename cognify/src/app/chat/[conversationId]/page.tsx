"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ConversationList } from "@/app/_components/conversation-list";
import { MessageList } from "@/app/_components/message-list";
import { MessageInput } from "@/app/_components/message-input";
import { api } from "@/trpc/react";
import { Spinner } from "@/components/ui/spinner";

export default function ChatPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  const router = useRouter();
  const [optimisticMessages, setOptimisticMessages] = useState<
    Array<{
      id: string;
      content: string;
      authorType: "user" | "ai";
      timestamp: Date;
    }>
  >([]);

  const {
    data: conversationData,
    isLoading,
    error,
  } = api.conversation.getHistory.useQuery(
    { conversationId },
    { enabled: !!conversationId },
  );

  const sendMessage = api.conversation.sendMessage.useMutation({
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
    onSuccess: (data) => {
      // Clear optimistic messages and refetch
      setOptimisticMessages([]);
      void utils.conversation.getHistory.invalidate({ conversationId });
      void utils.conversation.list.invalidate();
    },
    onError: () => {
      // Remove optimistic messages on error
      setOptimisticMessages([]);
    },
  });

  const utils = api.useUtils();

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage.mutateAsync({
        conversationId,
        content,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (error) {
    return (
      <div className="flex h-screen">
        <ConversationList />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Conversation not found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This conversation may have been deleted.
            </p>
            <button
              onClick={() => router.push("/chat")}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const allMessages = [
    ...(conversationData?.messages ?? []),
    ...optimisticMessages,
  ];

  return (
    <div className="flex h-screen">
      <ConversationList />
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <h1 className="text-lg font-semibold">
            {conversationData?.conversation.title ?? "Loading..."}
          </h1>
        </div>

        {/* Messages */}
        <MessageList messages={allMessages} isLoading={isLoading} />

        {/* Loading indicator when sending */}
        {sendMessage.isPending && (
          <div className="flex items-center justify-center gap-2 border-t p-2 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" />
            <span>AI is thinking...</span>
          </div>
        )}

        {/* Input */}
        <MessageInput
          onSend={handleSendMessage}
          disabled={sendMessage.isPending}
        />
      </div>
    </div>
  );
}

