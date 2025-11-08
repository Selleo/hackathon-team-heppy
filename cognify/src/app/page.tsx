import Link from "next/link";
import { MessageSquare, BarChart3 } from "lucide-react";

import { getSession } from "@/server/better-auth/server";
import { SignOutButton } from "@/app/_components/sign-out-button";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Home() {
  const session = await getSession();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Cognify
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Your AI-Powered Learning Companion
          </p>
        </div>

        {session ? (
          <>
            <div className="flex flex-col items-center gap-4">
              <p className="text-lg">
                Welcome back, <span className="font-semibold">{session.user?.name ?? "User"}</span>!
              </p>
              
              <div className="flex gap-4">
                <Link href="/chat">
                  <Button size="lg" className="gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Start Learning
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline" className="gap-2">
                    <BarChart3 className="h-5 w-5" />
                    View Atlas
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Conversational Learning
                  </CardTitle>
                  <CardDescription>
                    Chat naturally with AI to discover your knowledge gaps
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Knowledge Mapping
                  </CardTitle>
                  <CardDescription>
                    Track what you know and don't know automatically
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Progress Tracking</CardTitle>
                  <CardDescription>
                    Visualize your learning journey over time
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            <SignOutButton />
          </>
        ) : (
          <>
            <p className="text-lg text-muted-foreground">
              Get started by signing in
            </p>
            <Link href="/login">
              <Button size="lg">
                Go to Login
              </Button>
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
