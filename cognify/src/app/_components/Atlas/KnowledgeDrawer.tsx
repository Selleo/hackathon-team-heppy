"use client";

import { BookOpen, FileText, Brain } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { KnowledgeItem } from "@/types/atlas";
import { statusIcons } from "@/lib/constants/gapStatusIcons";

const statusColors = {
  Mastered: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  Learning: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  "Identified Gap": "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  Latent: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
};

// Dummy data generator based on knowledge item
function generateDummyData(item: KnowledgeItem) {
  return {
    notes: `These are sample notes for ${item.title}.\n\nKey points to remember:\n- Important concept related to ${item.title}\n- Practice regularly to improve understanding\n- Review related materials from ${item.categoryPath || "this category"}`,
    concepts: [
      `Introduction to ${item.title}`,
      `Core principles and fundamentals`,
      `Common patterns and best practices`,
      `Advanced techniques and optimizations`,
      `Real-world applications and use cases`,
      `Common pitfalls and how to avoid them`,
    ],
  };
}

interface KnowledgeDrawerProps {
  item: KnowledgeItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KnowledgeDrawer({ item, open, onOpenChange }: KnowledgeDrawerProps) {
  if (!item) return null;

  const dummyData = generateDummyData(item);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-screen !w-full sm:!max-w-2xl lg:!max-w-3xl">
        <ScrollArea className="h-full">
          <DrawerHeader className="border-b">
            <div className="flex items-center gap-2">
              <span className="text-xl">{statusIcons[item.status]}</span>
              <div className="flex-1">
                <DrawerTitle className="text-xl">{item.title}</DrawerTitle>
                {item.categoryPath && (
                  <DrawerDescription className="mt-1">
                    {item.categoryPath}
                  </DrawerDescription>
                )}
              </div>
              <Badge className={statusColors[item.status]}>
                {item.status}
              </Badge>
            </div>
            {item.description && (
              <p className="pt-2 text-sm text-muted-foreground">
                {item.description}
              </p>
            )}
          </DrawerHeader>

          <div className="space-y-4 p-6">
            {/* Notes Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Notes
                </CardTitle>
                <CardDescription>
                  Your personal notes and observations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add your notes here..."
                  className="min-h-[150px]"
                  defaultValue={dummyData.notes}
                />
              </CardContent>
            </Card>

            {/* Quiz Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Brain className="h-4 w-4" />
                  Test Your Knowledge
                </CardTitle>
                <CardDescription>
                  Quiz will be implemented later
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center rounded-lg border border-dashed p-8 text-center">
                  <div className="space-y-2">
                    <Brain className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Interactive quizzes coming soon
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Concepts Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-4 w-4" />
                  Basic Concepts
                </CardTitle>
                <CardDescription>
                  Fundamental concepts to understand
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {dummyData.concepts.map((concept, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-primary">•</span>
                      <span>{concept}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}

