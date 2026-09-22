import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSession, requireApiSession } from "@/lib/api-session";
import { ASSIGNABLE_ROLES, canManageAccounts, isRole, type Role } from "@/lib/demo";
import { hashPassword } from "@/lib/password";
import { writeAudit } from "@/lib/audit";
import { revalidateNurse } from "@/lib/revalidate";

async function syncStaffNurse(id: string, name: string, role: Role, bedsLabel: string) {
  if (role === "primary_nurse") {
    await prisma.staffNurse.upsert({
      where: { id },
      create: { id, name, title: "责任护士", bedsLabel },
      update: { name, bedsLabel },
    });
  }
}

export async function GET() {
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  if (!canManageAccounts(session.role)) {
    return NextResponse.json({ error: "仅系统管理员可查看账号" }, { status: 403 });
  }
  const rows = await prisma.staffAccount.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json({
    ok: true,
    accounts: rows.map((r) => ({
      id: r.id,
      name: r.name,
      role: r.role,
      bedsLabel: r.bedsLabel,
    })),
  });
}

export async function POST(req: Request) {
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  if (!canManageAccounts(session.role)) {
    return NextResponse.json({ error: "仅系统管理员可管理账号" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    name?: string;
    role?: string;
    password?: string;
    bedsLabel?: string;
  };
  const id = (body.id || "").trim().toLowerCase();
  const name = (body.name || "").trim();
  const password = body.password || "";
  const bedsLabel = (body.bedsLabel || "").trim();
  const role = body.role;
  if (!/^[a-z][a-z0-9_-]{0,31}$/.test(id)) {
    return NextResponse.json({ error: "工号仅允许小写字母开头，含字母数字下划线，最长 32 位" }, { status: 400 });
  }
  if (!name) return NextResponse.json({ error: "请填写姓名" }, { status: 400 });
  if (!password || password.length < 4) return NextResponse.json({ error: "密码至少 4 位" }, { status: 400 });
  if (!isRole(role) || !ASSIGNABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: "角色无效" }, { status: 400 });
  }
  const exists = await prisma.staffAccount.findUnique({ where: { id } });
  if (exists) return NextResponse.json({ error: "工号已存在" }, { status: 409 });

  await prisma.staffAccount.create({
    data: {
      id,
      name,
      role,
      bedsLabel: role === "primary_nurse" ? bedsLabel : "",
      passwordHash: hashPassword(password),
    },
  });
  await syncStaffNurse(id, name, role, bedsLabel);
  await writeAudit(session.role, "新建账号", id, `${name} · ${role}`);
  revalidateNurse();
  return NextResponse.json({ ok: true, id });
}

export async function PATCH(req: Request) {
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  if (!canManageAccounts(session.role)) {
    return NextResponse.json({ error: "仅系统管理员可管理账号" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    name?: string;
    role?: string;
    password?: string;
    bedsLabel?: string;
  };
  const id = (body.id || "").trim();
  if (!id) return NextResponse.json({ error: "缺少工号" }, { status: 400 });
  const existing = await prisma.staffAccount.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "账号不存在" }, { status: 404 });

  const name = body.name !== undefined ? body.name.trim() : existing.name;
  if (!name) return NextResponse.json({ error: "请填写姓名" }, { status: 400 });
  let role: Role = existing.role;
  if (body.role !== undefined) {
    if (!isRole(body.role) || !ASSIGNABLE_ROLES.includes(body.role)) {
      return NextResponse.json({ error: "角色无效" }, { status: 400 });
    }
    role = body.role;
  }
  if (id === session.id && role !== "sys_admin") {
    return NextResponse.json({ error: "不能取消自己的系统管理员角色" }, { status: 400 });
  }
  const bedsLabel = body.bedsLabel !== undefined ? body.bedsLabel.trim() : existing.bedsLabel;
  const data: {
    name: string;
    role: Role;
    bedsLabel: string;
    passwordHash?: string;
  } = {
    name,
    role,
    bedsLabel: role === "primary_nurse" ? bedsLabel : "",
  };
  if (body.password) {
    if (body.password.length < 4) return NextResponse.json({ error: "密码至少 4 位" }, { status: 400 });
    data.passwordHash = hashPassword(body.password);
  }

  await prisma.staffAccount.update({ where: { id }, data });
  await syncStaffNurse(id, name, role, data.bedsLabel);
  if (existing.role === "primary_nurse" && role !== "primary_nurse") {
    const used = await prisma.bed.count({ where: { primaryNurseId: id } });
    if (used === 0) {
      const asg = await prisma.examAssignment.count({ where: { nurseId: id } });
      if (asg === 0) {
        await prisma.staffNurse.deleteMany({ where: { id } });
      }
    }
  }
  await writeAudit(session.role, "改账号", id, `${name} · ${role}`);
  revalidateNurse();
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  if (!canManageAccounts(session.role)) {
    return NextResponse.json({ error: "仅系统管理员可管理账号" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as { id?: string };
  const id = (body.id || "").trim();
  if (!id) return NextResponse.json({ error: "缺少工号" }, { status: 400 });
  if (id === session.id) return NextResponse.json({ error: "不能删除当前登录账号" }, { status: 400 });
  if (id === "admin") return NextResponse.json({ error: "不能删除内置系统管理员账号" }, { status: 400 });

  const beds = await prisma.bed.count({ where: { primaryNurseId: id } });
  if (beds > 0) {
    return NextResponse.json({ error: "该账号仍分管床位，请先在床位档案中改责任护士" }, { status: 409 });
  }
  const asg = await prisma.examAssignment.count({ where: { nurseId: id } });
  if (asg > 0) {
    return NextResponse.json({ error: "该账号仍有考核记录关联，不能删除" }, { status: 409 });
  }

  await prisma.staffNurse.deleteMany({ where: { id } });
  await prisma.staffAccount.delete({ where: { id } });
  await writeAudit(session.role, "删账号", id);
  revalidateNurse();
  return NextResponse.json({ ok: true });
}
