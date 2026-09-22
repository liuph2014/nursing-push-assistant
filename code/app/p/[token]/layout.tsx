import { Suspense } from "react";
import { PatientShell } from "@/components/PatientShell";
import { ensureSeed } from "@/lib/ensure-seed";
import { stayByToken, getSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function PatientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  await ensureSeed();
  const { token } = await params;
  const [stay, settings] = await Promise.all([stayByToken(token), getSettings()]);
  const bedLabel = stay ? `${stay.bed.code} 床 · ${stay.bed.patientName}` : "床头宣教";

  return (
    <Suspense fallback={<div className="min-h-screen bg-paper">{children}</div>}>
      <PatientShell token={token} bedLabel={bedLabel} zoneName={settings.diseaseZoneName}>
        {children}
      </PatientShell>
    </Suspense>
  );
}
