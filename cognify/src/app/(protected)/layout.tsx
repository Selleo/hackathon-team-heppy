import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { api, TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "@/components/ui/sonner";

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { getSession } from '@/server/better-auth/server';
import { redirect } from 'next/navigation';
import { SignOutButton } from '../_components/sign-out-button';

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <TRPCReactProvider>
        <SidebarProvider>
        <AppSidebar />
          <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
          </div>
          <div className="ml-auto px-3">
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">
                {session.user?.name ?? "User"}
              </p>
              <p className="text-muted-foreground text-xs">
                {session.user?.email}
              </p>
            </div>
            <SignOutButton />
          </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 px-4 py-10">
          {children}
        </div>
          </SidebarInset>
          </SidebarProvider>
          </TRPCReactProvider>
        <Toaster />
      </body>
    </html>
  );
}
