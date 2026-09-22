"use client";

import { NurseNav } from "@/components/NurseNav";
import { PollRefresh } from "@/components/PollRefresh";
import type { Role } from "@/lib/demo";

type Props = {
  role: Role;
  name: string;
  children: React.ReactNode;
};

export function AppShell({ children, role, name }: Props) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <NurseNav role={role} name={name} />
        <main className="app-canvas min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <PollRefresh seconds={3} />
          {children}
        </main>
      </div>
    </div>
  );
}
