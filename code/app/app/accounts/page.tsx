import { redirect } from "next/navigation";
import { AccountManager } from "@/components/AccountManager";
import { PageHeader } from "@/components/PageHeader";
import { canManageAccounts, homeForRole } from "@/lib/demo";
import { prisma } from "@/lib/prisma";
import { getActorId, getRole } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const role = await getRole();
  if (!canManageAccounts(role)) redirect(homeForRole(role) === "/app/accounts" ? "/app/login" : homeForRole(role));
  const actorId = await getActorId();
  const accounts = await prisma.staffAccount.findMany({ orderBy: { id: "asc" } });

  return (
    <div>
      <PageHeader
        kicker="系统"
        title="账号权限"
        description="管理工号、角色与密码。床位分管关系在床位档案中指定责任护士。"
      />
      <div className="mt-4">
        <AccountManager
          selfId={actorId}
          accounts={accounts.map((a) => ({
            id: a.id,
            name: a.name,
            role: a.role,
            bedsLabel: a.bedsLabel,
          }))}
        />
      </div>
    </div>
  );
}
