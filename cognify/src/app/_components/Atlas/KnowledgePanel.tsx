"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";
import { StatusLegenedCard } from './StatusLegenedCard';
import { CategoryNode } from './CategoryNode';
import type { KnowledgeItem } from '@/types/atlas';

const statusColors = {
  Mastered: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  Learning: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  "Identified Gap": "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  Latent: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
};


// Build hierarchical tree structure from flat list
function buildCategoryTree(items: KnowledgeItem[]) {
  const tree: Record<string, any> = {};
  
  items.forEach((item) => {
    const path = item.categoryPath || "Other";
    const parts = path.split(" > ").map(p => p.trim());
    
    let current = tree;
    parts.forEach((part, index) => {
      if (!current[part]) {
        current[part] = {
          items: [],
          children: {},
          fullPath: parts.slice(0, index + 1).join(" > "),
        };
      }
      
      if (index === parts.length - 1) {
        current[part].items.push(item);
      }
      
      current = current[part].children;
    });
  });
  
  return tree;
}


export function KnowledgePanel() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allKnowledge, isLoading } = api.knowledge.list.useQuery({});

  // Filter knowledge items
  const filteredKnowledge = allKnowledge?.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Build tree structure
  const categoryTree = filteredKnowledge ? buildCategoryTree(filteredKnowledge) : {};

  if (isLoading) {
    return (
      <div className="flex h-full w-80 shrink-0 flex-col border-l bg-muted/10">
        <div className="border-b p-4">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex-1 space-y-4 p-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l bg-muted/10">
      <div className="shrink-0 border-b p-4">
        <h2 className="text-lg font-semibold">The Atlas</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Knowledge Repository
              </CardTitle>
              <div className="relative pt-2">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredKnowledge && filteredKnowledge.length > 0 ? (
                <div className="space-y-1">
                  {Object.entries(categoryTree).map(([categoryName, categoryData]) => (
                    <CategoryNode
                      key={categoryName}
                      name={categoryName}
                      data={categoryData}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {searchQuery ? (
                    <p>No items match your search.</p>
                  ) : (
                    <p>No knowledge items yet.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <StatusLegenedCard />
        </div>
      </ScrollArea>
    </div>
  );
}
