import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { isSession, requireApiSession } from "@/lib/api-session";
import { canWriteLibrary } from "@/lib/demo";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX = 2_000_000;

export async function POST(req: Request) {
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  const role = session.role;
  if (!canWriteLibrary(role)) return NextResponse.json({ error: "仅护士长可上传图片" }, { status: 403 });
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "请选择图片" }, { status: 400 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "仅支持 jpg / png / webp / gif" }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "图片请小于 2MB" }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  try {
    const dir = path.join(process.cwd(), "public", "uploads");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, name), buf);
    return NextResponse.json({ url: `/uploads/${name}` });
  } catch {
    if (buf.length > 350_000) return NextResponse.json({ error: "当前环境无法落盘，请换更小的图" }, { status: 413 });
    return NextResponse.json({ url: `data:${file.type};base64,${buf.toString("base64")}` });
  }
}
