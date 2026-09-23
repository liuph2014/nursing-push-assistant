/** 工号即登录名：院内常见纯数字工号，也允许字母数字组合 */
const STAFF_ID_RE = /^[a-z0-9][a-z0-9_-]{0,31}$/;

export function normalizeStaffId(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidStaffId(id: string): boolean {
  return STAFF_ID_RE.test(id);
}

export const STAFF_ID_RULE_HINT =
  "工号允许字母或数字开头，含字母、数字、下划线、短横线，最长 32 位（如 2211379）";
