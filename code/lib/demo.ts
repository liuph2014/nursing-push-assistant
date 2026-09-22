export const ROLES = ["head_nurse", "primary_nurse", "nursing_admin", "qa_readonly", "sys_admin"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  head_nurse: "护士长",
  primary_nurse: "责任护士",
  nursing_admin: "护理部",
  qa_readonly: "只读质控",
  sys_admin: "系统管理员",
};

export const ASSIGNABLE_ROLES: Role[] = ["head_nurse", "primary_nurse", "nursing_admin", "qa_readonly", "sys_admin"];

export const DEMO_STEPS = [
  { id: 1, label: "1 套路径", href: "/app/ward/1#apply-pathway", hint: "在 1 床点橙色「套用入院路径」" },
  { id: 2, label: "2 看床头码", href: "/app/ward/1#bed-qr", hint: "用微信扫右侧二维码" },
  { id: 3, label: "3 读文章A", href: "/app/ward/1#bed-qr", hint: "打开「入院须知」，停满 8 秒" },
  { id: 4, label: "4 看已读", href: "/app/ward/1#tasks-list", hint: "入院须知应变为已读" },
  { id: 5, label: "5 当面补讲", href: "/app/tasks?tab=bedside#bedside-list", hint: "防跌倒未读会出现在这里" },
  { id: 6, label: "6 点完成", href: "/app/tasks?tab=bedside#bedside-done", hint: "点「已当面完成」" },
  { id: 7, label: "7 看板", href: "/app/stats#board", hint: "切到护理部看人数变化" },
  { id: 8, label: "8 打标记", href: "/app/ward/1#tag-groups", hint: "在 1 床勾选标记组" },
  { id: 9, label: "9 群发", href: "/app/push", hint: "从图文库选卡片后发送" },
] as const;

export const READ_THRESHOLD_MS = Number(process.env.READ_THRESHOLD_MS ?? 8000);

export function isRole(v: string | undefined): v is Role {
  return ROLES.includes(v as Role);
}

export function canManageBed(role: Role, primaryNurseId: string | null | undefined, actorId: string) {
  if (role === "nursing_admin" || role === "qa_readonly" || role === "sys_admin") return false;
  if (role === "head_nurse") return true;
  return role === "primary_nurse" && Boolean(primaryNurseId) && primaryNurseId === actorId;
}

export function canManageAccounts(role: Role) {
  return role === "sys_admin";
}

export function canViewAllBeds(role: Role) {
  return role !== "primary_nurse";
}

export function canPushWard(role: Role) {
  return role === "head_nurse";
}

export function isReadOnly(role: Role) {
  return role === "nursing_admin" || role === "qa_readonly" || role === "sys_admin";
}

export function canWriteLibrary(role: Role) {
  return role === "head_nurse";
}

export function canManageTagCatalog(role: Role) {
  return role === "head_nurse";
}

export function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function patientUrl(token: string) {
  return `${appUrl()}/p/${token}`;
}

export function maskName(name: string, role: Role) {
  if (role !== "nursing_admin" && role !== "qa_readonly") return name;
  if (!name) return name;
  return `${name.slice(0, 1)}*`;
}

export const NAMES = ["张一", "李二", "王三", "赵四", "钱五", "孙六", "周七", "吴八"];

export const ACCOUNTS = [
  { id: "admin", name: "系统管理员", role: "sys_admin", bedsLabel: "" },
  { id: "head", name: "护士长", role: "head_nurse", bedsLabel: "全部床" },
  { id: "li", name: "李护士", role: "primary_nurse", bedsLabel: "1–2 床" },
  { id: "wang", name: "王护士", role: "primary_nurse", bedsLabel: "3–4 床" },
  { id: "zhao", name: "赵护士", role: "primary_nurse", bedsLabel: "5–6 床" },
  { id: "qian", name: "钱护士", role: "primary_nurse", bedsLabel: "7–8 床" },
  { id: "nursing", name: "护理部", role: "nursing_admin", bedsLabel: "" },
  { id: "qa", name: "质控", role: "qa_readonly", bedsLabel: "" },
] as const;

export const STAFF_NURSES = ACCOUNTS.filter((a) => a.role === "primary_nurse");

export function nurseIdForBed(code: number) {
  if (code >= 1 && code <= 2) return "li";
  if (code >= 3 && code <= 4) return "wang";
  if (code >= 5 && code <= 6) return "zhao";
  if (code >= 7 && code <= 8) return "qian";
  return null;
}

export const NAV_GROUPS: {
  id: string;
  label: string;
  items: { href: string; label: string; hint: string; roles: Role[] }[];
}[] = [
  {
    id: "work",
    label: "作业台",
    items: [
      { href: "/app/ward", label: "床位图", hint: "检索、归类、进床", roles: ["head_nurse", "primary_nurse"] },
      { href: "/app/tasks", label: "今日任务", hint: "未读与当面补讲", roles: ["head_nurse", "primary_nurse", "nursing_admin"] },
    ],
  },
  {
    id: "edu",
    label: "宣教",
    items: [
      { href: "/app/content", label: "图文库", hint: "编辑并分发给患者", roles: ["head_nurse", "primary_nurse", "nursing_admin"] },
      { href: "/app/push", label: "群发", hint: "从库中选文推送", roles: ["head_nurse", "primary_nurse"] },
      { href: "/app/plans", label: "计划", hint: "按标记组定时推", roles: ["head_nurse", "primary_nurse"] },
      { href: "/app/pathways", label: "路径", hint: "入院与病种路径", roles: ["head_nurse", "nursing_admin"] },
    ],
  },
  {
    id: "qa",
    label: "质控",
    items: [
      { href: "/app/surveys", label: "问卷考核", hint: "出题、发送、成绩", roles: ["head_nurse", "primary_nurse", "nursing_admin", "qa_readonly"] },
      { href: "/app/stats", label: "成效看板", hint: "阅读与未读人数", roles: ["head_nurse", "primary_nurse", "nursing_admin", "qa_readonly"] },
    ],
  },
  {
    id: "sys",
    label: "系统",
    items: [
      { href: "/app/settings", label: "设置", hint: "病区、标记组、质控", roles: ["head_nurse", "primary_nurse", "nursing_admin", "qa_readonly"] },
      { href: "/app/accounts", label: "账号权限", hint: "工号、角色与密码", roles: ["sys_admin"] },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

export function homeForRole(role: Role) {
  if (role === "sys_admin") return "/app/accounts";
  return role === "nursing_admin" || role === "qa_readonly" ? "/app/stats" : "/app/ward";
}
