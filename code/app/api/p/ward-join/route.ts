import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/queries";
import { getDemoNow } from "@/lib/clock";
import { revalidateNurse } from "@/lib/revalidate";

const DIAGNOSIS_TAG: Record<string, string> = {
  脑梗死: "tag-stroke",
  动脉瘤: "tag-aneurysm",
  糖尿病: "tag-diabetes",
};

export async function POST(req: Request) {
  const body = (await req.json()) as {
    wardToken?: string;
    skip?: boolean;
    patientName?: string;
    gender?: string;
    age?: number;
    hospitalNo?: string;
    diagnosis?: string;
    attendingDoctor?: string;
    bedDoctor?: string;
    admittedAt?: string;
    bedCode?: number;
  };
  const settings = await getSettings();
  const wardToken = (settings as { wardJoinToken?: string }).wardJoinToken || "demo-ward";
  if (!body.wardToken || body.wardToken !== wardToken) {
    return NextResponse.json({ error: "病区码无效" }, { status: 404 });
  }

  const beds = await prisma.bed.findMany({
    include: { stay: true },
    orderBy: { code: "asc" },
  });
  // 仅占用从未绑定 Stay 的空床；已出院床保留历史，不可覆盖
  const freeBeds = beds.filter((b) => !b.stay);
  if (body.bedCode != null) {
    const picked = beds.find((b) => b.code === body.bedCode);
    if (!picked) return NextResponse.json({ error: "床位不存在" }, { status: 404 });
    if (picked.stay?.status === "discharged") {
      return NextResponse.json({ error: "该床已有出院记录，请另选空床或联系护士增床" }, { status: 409 });
    }
    if (picked.stay?.status === "in_ward") {
      return NextResponse.json({ error: "该床已有在院患者" }, { status: 409 });
    }
  }
  const target =
    body.bedCode != null ? freeBeds.find((b) => b.code === body.bedCode) : freeBeds[0];
  if (!target) {
    return NextResponse.json({ error: "暂无空床，请联系护士安排或在设置中增加床位" }, { status: 409 });
  }

  const now = await getDemoNow();
  const admittedAt = body.admittedAt ? new Date(`${body.admittedAt}T08:00:00`) : now;
  const token = `ward-${target.code}-${Date.now().toString(36)}`;
  const name = body.skip ? "" : (body.patientName || "").trim();
  const diagnosis = body.skip ? "" : (body.diagnosis || "").trim();

  const stay = await prisma.stay.create({
    data: {
      id: `stay-${target.code}-${Date.now()}`,
      bedId: target.id,
      accessToken: token,
      status: "in_ward",
      admittedAt,
      firstScanAt: now,
      gender: body.skip ? "" : body.gender || "",
      age: body.skip ? 0 : Number(body.age) || 0,
      hospitalNo: body.skip ? "" : body.hospitalNo || "",
      diagnosis,
      attendingDoctor: body.skip ? "" : body.attendingDoctor || "",
      bedDoctor: body.skip ? "" : body.bedDoctor || "",
      nursingLevel: "一级",
      dietOrder: "普食",
    },
  });
  await prisma.bed.update({
    where: { id: target.id },
    data: { patientName: name || `待建档${target.code}床` },
  });

  for (const [key, tagId] of Object.entries(DIAGNOSIS_TAG)) {
    if (diagnosis.includes(key)) {
      const exists = await prisma.tagGroup.findUnique({ where: { id: tagId } });
      if (exists) {
        await prisma.stayTag.create({ data: { stayId: stay.id, tagGroupId: tagId } }).catch(() => undefined);
      }
    }
  }

  revalidateNurse();
  return NextResponse.json({ ok: true, token, bedCode: target.code });
}
