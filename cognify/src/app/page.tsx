import Link from "next/link";
import { MessageSquare, BarChart3, TrendingUp } from "lucide-react";

import { getSession } from "@/server/better-auth/server";
import { SignOutButton } from "@/app/_components/sign-out-button";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Home() {
  const session = await getSession();

  return (
    <main className="flex h-screen max-h-screen flex-col overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Hero Section */}
        <section className="flex flex-1 flex-col items-center justify-center border-b bg-gradient-to-b from-background to-muted/30 px-4">
          <div className="container flex flex-col items-center justify-center gap-6 px-4 py-12">
            <div className="flex max-w-3xl flex-col items-center gap-4 text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Cognify
              </h1>
              <p className="text-lg text-muted-foreground sm:text-xl">
                Your AI-Powered Learning Companion
              </p>
              <p className="text-sm text-muted-foreground sm:text-base">
                Discover knowledge gaps through natural conversation and track your learning journey
              </p>
            </div>

            {session ? (
              <div className="flex flex-col items-center gap-4">
                <p className="text-base text-muted-foreground">
                  Welcome back, <span className="font-semibold text-foreground">{session.user?.name ?? "User"}</span>!
                </p>
                
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link href="/chat">
                    <Button size="lg" className="gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Start Chat
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button size="lg" variant="outline" className="gap-2">
                      <BarChart3 className="h-5 w-5" />
                      View Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <p className="text-base text-muted-foreground">
                  Get started by signing in
                </p>
                <Link href="/login">
                  <Button size="lg">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Features Section */}
          {session && (
            <section className="w-full border-t bg-background px-4 py-8">
              <div className="container mx-auto max-w-5xl">
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    Features
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                    Everything you need to enhance your learning experience
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Card className="transition-shadow hover:shadow-md">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        Conversational Learning
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Chat naturally with AI to discover your knowledge gaps
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="transition-shadow hover:shadow-md">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        Knowledge Mapping
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Track what you know and don't know automatically
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="transition-shadow hover:shadow-md">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Progress Tracking
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Visualize your learning journey over time
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </div>
            </section>
          )}

          {/* Sign Out Section */}
          {session && (
            <section className="w-full border-t bg-muted/30 px-4 py-4">
              <div className="container flex justify-center">
                <SignOutButton />
              </div>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
