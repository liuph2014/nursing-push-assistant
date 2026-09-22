import { prisma } from "./prisma";
import { resetDemoData } from "./seed";

export async function ensureSeed() {
  try {
    const n = await prisma.tenant.count();
    const tags = await prisma.tagGroup.count();
    const accounts = await prisma.staffAccount.count();
    if (n === 0 || tags === 0 || accounts === 0) await resetDemoData();
  } catch {
    try {
      await resetDemoData();
    } catch (err) {
      console.warn("[seed] 种子写入失败", err);
    }
  }
}
