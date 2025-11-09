import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { KnowledgeItem } from '@/types/atlas';
import { statusIcons } from "@/lib/constants/gapStatusIcons";

// Recursive category node component
export function CategoryNode({ 
  name, 
  data, 
  level = 0,
  onItemClick,
}: { 
  name: string; 
  data: any; 
  level?: number;
  onItemClick?: (item: KnowledgeItem) => void;
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
              <button
                key={item.id}
                onClick={() => onItemClick?.(item)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50 cursor-pointer"
              >
                <span className="shrink-0 text-base">{statusIcons[item.status]}</span>
                <span className="flex-1 truncate text-left">{item.title}</span>
              </button>
            ))}
            
            {/* Subcategories */}
            {Object.entries(data.children).map(([childName, childData]) => (
              <CategoryNode
                key={childName}
                name={childName}
                data={childData}
                level={level + 1}
                onItemClick={onItemClick}
              />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
