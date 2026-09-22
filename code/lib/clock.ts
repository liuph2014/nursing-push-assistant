import { prisma } from "./prisma";

export async function getDayOffset() {
  const row = await prisma.demoState.findUnique({ where: { id: "demo" } });
  return row?.dayOffset ?? 0;
}

export async function getDemoNow() {
  return new Date();
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function formatDemoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
