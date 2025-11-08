"use client";

import { useState } from "react";
import { Search, ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const statusColors = {
  Mastered: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  Learning: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  "Identified Gap": "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  Latent: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
};

const statusIcons = {
  Mastered: "🟢",
  Learning: "🟡",
  "Identified Gap": "🔴",
  Latent: "⚪",
};

type KnowledgeItem = {
  id: string;
  title: string;
  description: string | null;
  status: "Latent" | "Identified Gap" | "Learning" | "Mastered";
  categoryPath: string | null;
  updatedAt: Date;
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

// Recursive category node component
function CategoryNode({ 
  name, 
  data, 
  level = 0 
}: { 
  name: string; 
  data: any; 
  level?: number;
}) {
  const [isOpen, setIsOpen] = useState(level === 0); // Top level open by default
  const hasChildren = Object.keys(data.children).length > 0;
  const itemCount = data.items.length;
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="space-y-1">
        <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50">
          {hasChildren ? (
            isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />
          ) : (
            <div className="w-4" />
          )}
          {isOpen ? <FolderOpen className="h-4 w-4 shrink-0 text-primary" /> : <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />}
          <span className="flex-1 truncate font-medium text-left">{name}</span>
          <Badge variant="secondary" className="h-5 text-xs">
            {itemCount + Object.values(data.children).reduce((acc: number, child: any) => {
              return acc + child.items.length + Object.values(child.children).reduce((a: number, c: any) => a + c.items.length, 0);
            }, 0)}
          </Badge>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="ml-4 space-y-1 border-l pl-2">
            {/* Direct items in this category */}
            {data.items.map((item: KnowledgeItem) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
              >
                <span className="shrink-0 text-base">{statusIcons[item.status]}</span>
                <span className="flex-1 truncate">{item.title}</span>
              </div>
            ))}
            
            {/* Subcategories */}
            {Object.entries(data.children).map(([childName, childData]) => (
              <CategoryNode
                key={childName}
                name={childName}
                data={childData}
                level={level + 1}
              />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
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
        </div>
      </ScrollArea>
    </div>
  );
}
