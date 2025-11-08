"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/trpc/react";

const statusColors = {
  Mastered: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  Learning: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  "Identified Gap": "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  Latent: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
};

const statusIcons = {
  Mastered: "✓",
  Learning: "⚡",
  "Identified Gap": "✗",
  Latent: "○",
};

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: summary, isLoading: summaryLoading } = api.dashboard.getSummary.useQuery();
  const { data: allKnowledge, isLoading: knowledgeLoading } = api.knowledge.list.useQuery({});

  // Filter knowledge items
  const filteredKnowledge = allKnowledge?.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(allKnowledge?.map((item) => item.category).filter(Boolean)));

  if (summaryLoading || knowledgeLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="container flex h-16 items-center gap-4 px-4">
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="container space-y-8 px-4 py-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container flex h-16 items-center gap-4 px-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Atlas Dashboard</h1>
          <div className="ml-auto">
            <Link href="/chat">
              <Button className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container space-y-8 px-4 py-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Knowledge Items</CardDescription>
              <CardTitle className="text-3xl">{summary?.stats.totalKnowledgeItems ?? 0}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <span className="text-green-500">●</span> Mastered
              </CardDescription>
              <CardTitle className="text-3xl text-green-600">{summary?.stats.masteredCount ?? 0}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <span className="text-yellow-500">●</span> Learning
              </CardDescription>
              <CardTitle className="text-3xl text-yellow-600">{summary?.stats.learningCount ?? 0}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <span className="text-red-500">●</span> Gaps
              </CardDescription>
              <CardTitle className="text-3xl text-red-600">{summary?.stats.gapCount ?? 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Knowledge by Category */}
        {summary && Object.keys(summary.knowledgeByCategory).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Knowledge by Category</CardTitle>
              <CardDescription>Your learning progress across different topics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(summary.knowledgeByCategory).map(([category, data]) => (
                  <div key={category} className="rounded-lg border p-4">
                    <h3 className="font-semibold">{category}</h3>
                    <p className="text-sm text-muted-foreground">{data.total} items</p>
                    <div className="mt-2 flex gap-2 text-sm">
                      <span className="text-green-600">🟢 {data.byStatus.Mastered}</span>
                      <span className="text-yellow-600">🟡 {data.byStatus.Learning}</span>
                      <span className="text-red-600">🔴 {data.byStatus["Identified Gap"]}</span>
                      <span className="text-gray-600">⚪ {data.byStatus.Latent}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Knowledge Repository */}
        <Card>
          <CardHeader>
            <CardTitle>Knowledge Repository</CardTitle>
            <CardDescription>All your tracked knowledge items</CardDescription>
            
            {/* Filters */}
            <div className="flex flex-col gap-2 pt-4 sm:flex-row">
              <Input
                placeholder="Search knowledge..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="sm:max-w-xs"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="sm:w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Mastered">Mastered</SelectItem>
                  <SelectItem value="Learning">Learning</SelectItem>
                  <SelectItem value="Identified Gap">Identified Gap</SelectItem>
                  <SelectItem value="Latent">Latent</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="sm:w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category!}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredKnowledge && filteredKnowledge.length > 0 ? (
              <div className="space-y-2">
                {filteredKnowledge.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{statusIcons[item.status]}</span>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.category && (
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                      )}
                      <Badge className={statusColors[item.status]}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                {searchQuery || statusFilter !== "all" || categoryFilter !== "all" ? (
                  <p>No knowledge items match your filters.</p>
                ) : (
                  <div>
                    <p>No knowledge items yet.</p>
                    <p className="mt-2 text-sm">Start a conversation to begin building your knowledge graph!</p>
                    <Link href="/chat">
                      <Button className="mt-4">Start Learning</Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

