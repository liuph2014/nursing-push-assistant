import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/queries";
import { revalidatePath } from "next/cache";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "缺少 token" }, { status: 400 });
  const stay = await prisma.stay.findUnique({ where: { accessToken: token } });
  if (!stay) return NextResponse.json({ error: "无效" }, { status: 404 });
  const messages = await prisma.patientMessage.findMany({
    where: { stayId: stay.id },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return NextResponse.json({ messages });
}

export async function POST(req: Request) {
  const body = (await req.json()) as { token?: string; text?: string; stayId?: string; reply?: boolean };
  const settings = await getSettings();
  if (!settings.consultEnabled) {
    return NextResponse.json({ error: "护士长已关闭问诊留言" }, { status: 403 });
  }
  const text = (body.text || "").trim();
  if (!text) return NextResponse.json({ error: "请填写内容" }, { status: 400 });

  let stayId = body.stayId;
  if (body.token) {
    const stay = await prisma.stay.findUnique({ where: { accessToken: body.token } });
    if (!stay) return NextResponse.json({ error: "无效" }, { status: 404 });
    stayId = stay.id;
  }
  if (!stayId) return NextResponse.json({ error: "缺少患者" }, { status: 400 });

  await prisma.patientMessage.create({
    data: {
      stayId,
      body: text.slice(0, 500),
      fromPatient: !body.reply,
    },
  });
  revalidatePath("/app/ward");
  return NextResponse.json({ ok: true });
}
