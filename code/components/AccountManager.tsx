"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ASSIGNABLE_ROLES, ROLE_LABEL, type Role } from "@/lib/demo";

type AccountRow = {
  id: string;
  name: string;
  role: Role;
  bedsLabel: string;
};

export function AccountManager({ accounts, selfId }: { accounts: AccountRow[]; selfId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [create, setCreate] = useState({
    id: "",
    name: "",
    role: "primary_nurse" as Role,
    password: "",
    bedsLabel: "",
  });
  const [edits, setEdits] = useState<Record<string, { name: string; role: Role; bedsLabel: string; password: string }>>(
    () =>
      Object.fromEntries(
        accounts.map((a) => [a.id, { name: a.name, role: a.role, bedsLabel: a.bedsLabel, password: "" }]),
      ),
  );

  function setEdit(id: string, patch: Partial<(typeof edits)[string]>) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  return (
    <div className="space-y-6">
      <section className="surface rounded-2xl p-5">
        <h2 className="font-semibold text-navy">新建账号</h2>
        <p className="mt-1 text-sm text-slate-500">工号即登录名。责任护士请填写分管床位说明，如「1–2 床」。</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="block text-sm">
            工号
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={create.id}
              onChange={(e) => setCreate({ ...create, id: e.target.value })}
              placeholder="如 zhang"
            />
          </label>
          <label className="block text-sm">
            姓名
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={create.name}
              onChange={(e) => setCreate({ ...create, name: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            角色
            <select
              className="mt-1 w-full rounded border px-3 py-2"
              value={create.role}
              onChange={(e) => setCreate({ ...create, role: e.target.value as Role })}
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            初始密码
            <input
              type="password"
              className="mt-1 w-full rounded border px-3 py-2"
              value={create.password}
              onChange={(e) => setCreate({ ...create, password: e.target.value })}
            />
          </label>
          {create.role === "primary_nurse" ? (
            <label className="block text-sm md:col-span-2">
              分管床位说明
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={create.bedsLabel}
                onChange={(e) => setCreate({ ...create, bedsLabel: e.target.value })}
                placeholder="1–2 床"
              />
            </label>
          ) : null}
        </div>
        <button
          type="button"
          disabled={pending}
          className="ui-btn ui-btn-navy mt-4"
          onClick={() =>
            start(async () => {
              setMsg("");
              const res = await fetch("/api/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(create),
              });
              const data = (await res.json().catch(() => ({}))) as { error?: string };
              if (!res.ok) {
                setMsg(data.error || "创建失败");
                return;
              }
              setCreate({ id: "", name: "", role: "primary_nurse", password: "", bedsLabel: "" });
              setMsg("已创建");
              router.refresh();
            })
          }
        >
          创建账号
        </button>
      </section>

      <section className="surface rounded-2xl p-5">
        <h2 className="font-semibold text-navy">现有账号</h2>
        <ul className="mt-4 space-y-4">
          {accounts.map((a) => {
            const edit = edits[a.id] || { name: a.name, role: a.role, bedsLabel: a.bedsLabel, password: "" };
            return (
              <li key={a.id} className="rounded-xl border border-[var(--line)] p-4">
                <p className="text-sm font-medium text-navy">
                  工号 {a.id}
                  {a.id === selfId ? " · 当前登录" : ""}
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className="block text-sm">
                    姓名
                    <input
                      className="mt-1 w-full rounded border px-3 py-2"
                      value={edit.name}
                      onChange={(e) => setEdit(a.id, { name: e.target.value })}
                    />
                  </label>
                  <label className="block text-sm">
                    角色
                    <select
                      className="mt-1 w-full rounded border px-3 py-2"
                      value={edit.role}
                      onChange={(e) => setEdit(a.id, { role: e.target.value as Role })}
                    >
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </option>
                      ))}
                    </select>
                  </label>
                  {edit.role === "primary_nurse" ? (
                    <label className="block text-sm md:col-span-2">
                      分管床位说明
                      <input
                        className="mt-1 w-full rounded border px-3 py-2"
                        value={edit.bedsLabel}
                        onChange={(e) => setEdit(a.id, { bedsLabel: e.target.value })}
                      />
                    </label>
                  ) : null}
                  <label className="block text-sm md:col-span-2">
                    新密码（留空则不改）
                    <input
                      type="password"
                      className="mt-1 w-full rounded border px-3 py-2"
                      value={edit.password}
                      onChange={(e) => setEdit(a.id, { password: e.target.value })}
                    />
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    onClick={() =>
                      start(async () => {
                        setMsg("");
                        const res = await fetch("/api/accounts", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            id: a.id,
                            name: edit.name,
                            role: edit.role,
                            bedsLabel: edit.bedsLabel,
                            password: edit.password || undefined,
                          }),
                        });
                        const data = (await res.json().catch(() => ({}))) as { error?: string };
                        if (!res.ok) {
                          setMsg(data.error || "保存失败");
                          return;
                        }
                        setEdit(a.id, { password: "" });
                        setMsg(`已保存 ${a.id}`);
                        router.refresh();
                      })
                    }
                  >
                    保存
                  </button>
                  {a.id !== selfId && a.id !== "admin" ? (
                    <button
                      type="button"
                      disabled={pending}
                      className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#D32F2F] ring-1 ring-[var(--line)] disabled:opacity-60"
                      onClick={() =>
                        start(async () => {
                          setMsg("");
                          if (!window.confirm(`确认删除账号 ${a.id}？`)) return;
                          const res = await fetch("/api/accounts", {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: a.id }),
                          });
                          const data = (await res.json().catch(() => ({}))) as { error?: string };
                          if (!res.ok) {
                            setMsg(data.error || "删除失败");
                            return;
                          }
                          setMsg(`已删除 ${a.id}`);
                          router.refresh();
                        })
                      }
                    >
                      删除
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      {msg ? <p className="text-sm text-teal">{msg}</p> : null}
    </div>
  );
}
