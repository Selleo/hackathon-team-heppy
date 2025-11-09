"use client"

import {
  FileText,
  Lightbulb,
  MoreHorizontal,
  Trash2,
  Loader2,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { api } from "@/trpc/react"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export type Graph = {
  id: string
  name: string
  sourceType: "topic" | "upload"
  status: "pending" | "building" | "complete" | "error"
  createdAt: Date
  updatedAt: Date | null
}

export function NavFavorites({
  graphs,
  isLoading,
}: {
  graphs: Graph[]
  isLoading?: boolean
}) {
  const { isMobile } = useSidebar()
  const utils = api.useUtils()
  const deleteMutation = api.graphs.delete.useMutation({
    onSuccess: () => {
      toast.success("Graph deleted")
      void utils.graphs.list.invalidate()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleDelete = (graphId: string) => {
    if (confirm("Are you sure you want to delete this graph?")) {
      deleteMutation.mutate({ id: graphId })
    }
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>My Graphs</SidebarGroupLabel>
      <SidebarMenu>
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <SidebarMenuItem key={i}>
                <div className="flex items-center gap-2 px-2 py-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              </SidebarMenuItem>
            ))}
          </>
        ) : graphs.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No graphs yet
          </div>
        ) : (
          graphs.map((graph) => (
            <SidebarMenuItem key={graph.id}>
              <SidebarMenuButton asChild className="pr-8">
                <a href={`/graphs/${graph.id}`} title={graph.name}>
                  {graph.sourceType === "topic" ? (
                    <Lightbulb className="h-4 w-4 shrink-0" />
                  ) : (
                    <FileText className="h-4 w-4 shrink-0" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{graph.name}</span>
                </a>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                    <MoreHorizontal />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem disabled className="text-xs">
                    <span className="text-muted-foreground">
                      Created {formatDistanceToNow(new Date(graph.createdAt), { addSuffix: true })}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDelete(graph.id)}
                    disabled={deleteMutation.isPending}
                    className="text-destructive"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
