"use client";

import {
  addEmailListMember,
  createEmailAutomation,
  createEmailList,
  createEmailTemplate,
  deleteEmailAutomation,
  deleteEmailList,
  deleteEmailTemplate,
  removeEmailListMember,
  sendManualCampaign,
  updateEmailAutomation,
} from "@/lib/actions/emails";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface TemplateRow {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
}

interface ListRow {
  id: string;
  name: string;
  description: string | null;
  members: Array<{ id: string; email: string; name: string | null }>;
}

interface AutomationRow {
  id: string;
  name: string;
  enabled: boolean;
  trigger: string;
  daysOffset: number | null;
  audience: string;
  templateId: string;
  listId: string | null;
  template: { name: string };
  list: { name: string } | null;
}

interface SendLogRow {
  id: string;
  recipientEmail: string;
  subject: string;
  manual: boolean;
  sentAt: string;
}

const TRIGGERS = [
  { value: "ON_BOOKING_REQUESTED", label: "When booking is requested" },
  { value: "ON_BOOKING_CONFIRMED", label: "When booking is confirmed" },
] as const;

const VARS_HELP =
  "Variables: {{name}}, {{email}}, {{phone}}, {{address}}, {{date}}, {{time}}, {{services}}";

export function EmailManager({
  templates,
  lists,
  automations,
  sendLogs,
  customerCount,
}: {
  templates: TemplateRow[];
  lists: ListRow[];
  automations: AutomationRow[];
  sendLogs: SendLogRow[];
  customerCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<"templates" | "lists" | "automations" | "send" | "log">(
    "templates"
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [templateForm, setTemplateForm] = useState({
    name: "",
    subject: "",
    bodyHtml: "",
  });

  const [listForm, setListForm] = useState({ name: "", description: "" });
  const [memberForm, setMemberForm] = useState({
    listId: lists[0]?.id ?? "",
    email: "",
    name: "",
  });

  const [automationForm, setAutomationForm] = useState({
    name: "",
    trigger: "ON_BOOKING_REQUESTED" as string,
    audience: "ALL_CUSTOMERS" as string,
    templateId: templates[0]?.id ?? "",
    listId: lists[0]?.id ?? "",
  });

  const [manualForm, setManualForm] = useState({
    templateId: templates[0]?.id ?? "",
    audience: "all" as "all" | "list",
    listId: lists[0]?.id ?? "",
  });

  const run = (fn: () => Promise<unknown>, successMsg?: string) => {
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        const result = await fn();
        if (successMsg) setMessage(successMsg);
        else if (result && typeof result === "object" && "sent" in result) {
          const r = result as { sent: number; total?: number };
          setMessage(`Sent ${r.sent} of ${r.total ?? r.sent} emails.`);
        } else setMessage("Saved.");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  };

  const tabs = [
    { id: "templates" as const, label: "Templates" },
    { id: "lists" as const, label: "Lists" },
    { id: "automations" as const, label: "Automations" },
    { id: "send" as const, label: "Send now" },
    { id: "log" as const, label: "Send log" },
  ];

  return (
    <div className="mt-8 space-y-6">
      {message ? (
        <p className="rounded-lg bg-mint px-4 py-2 text-sm text-forest">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800">{error}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              tab === t.id
                ? "bg-teal text-white"
                : "border border-slate/10 bg-white text-slate/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "templates" ? (
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate/10 bg-white p-6">
            <h2 className="font-display text-lg font-bold text-forest">New template</h2>
            <p className="mt-1 text-sm text-slate/60">{VARS_HELP}</p>
            <div className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Template name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                className="w-full rounded-lg border border-slate/20 px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Subject line"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                className="w-full rounded-lg border border-slate/20 px-3 py-2 text-sm"
              />
              <textarea
                rows={6}
                placeholder="Email body (HTML allowed)"
                value={templateForm.bodyHtml}
                onChange={(e) => setTemplateForm({ ...templateForm, bodyHtml: e.target.value })}
                className="w-full rounded-lg border border-slate/20 px-3 py-2 font-mono text-sm"
              />
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await createEmailTemplate(templateForm);
                  setTemplateForm({ name: "", subject: "", bodyHtml: "" });
                })
              }
              className="mt-4 rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Create template
            </button>
          </section>

          <section className="rounded-2xl border border-slate/10 bg-white p-6">
            <h2 className="font-display text-lg font-bold text-forest">
              Templates ({templates.length})
            </h2>
            {templates.length === 0 ? (
              <p className="mt-4 text-sm text-slate/60">No templates yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate/10">
                {templates.map((t) => (
                  <li key={t.id} className="flex items-start justify-between gap-4 py-4">
                    <div>
                      <p className="font-semibold text-forest">{t.name}</p>
                      <p className="text-sm text-slate/60">{t.subject}</p>
                    </div>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        if (confirm("Delete this template?")) {
                          run(() => deleteEmailTemplate(t.id));
                        }
                      }}
                      className="text-sm font-semibold text-red-600"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}

      {tab === "lists" ? (
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate/10 bg-white p-6">
            <h2 className="font-display text-lg font-bold text-forest">New list</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="List name"
                value={listForm.name}
                onChange={(e) => setListForm({ ...listForm, name: e.target.value })}
                className="rounded-lg border border-slate/20 px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={listForm.description}
                onChange={(e) => setListForm({ ...listForm, description: e.target.value })}
                className="rounded-lg border border-slate/20 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await createEmailList(listForm);
                  setListForm({ name: "", description: "" });
                })
              }
              className="mt-4 rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Create list
            </button>
          </section>

          {lists.length > 0 ? (
            <section className="rounded-2xl border border-slate/10 bg-white p-6">
              <h2 className="font-display text-lg font-bold text-forest">Add member</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <select
                  value={memberForm.listId}
                  onChange={(e) => setMemberForm({ ...memberForm, listId: e.target.value })}
                  className="rounded-lg border border-slate/20 px-3 py-2 text-sm"
                >
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <input
                  type="email"
                  placeholder="Email"
                  value={memberForm.email}
                  onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                  className="rounded-lg border border-slate/20 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Name (optional)"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  className="rounded-lg border border-slate/20 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => addEmailListMember(memberForm))}
                className="mt-4 rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Add to list
              </button>
            </section>
          ) : null}

          <section className="rounded-2xl border border-slate/10 bg-white p-6">
            <h2 className="font-display text-lg font-bold text-forest">Email lists</h2>
            <p className="mt-1 text-sm text-slate/60">
              All customers ({customerCount}) are always available for &quot;all customers&quot;
              sends and automations.
            </p>
            {lists.length === 0 ? (
              <p className="mt-4 text-sm text-slate/60">No custom lists yet.</p>
            ) : (
              <ul className="mt-4 space-y-6">
                {lists.map((list) => (
                  <li key={list.id} className="border-b border-slate/10 pb-6 last:border-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-forest">{list.name}</p>
                        {list.description ? (
                          <p className="text-sm text-slate/60">{list.description}</p>
                        ) : null}
                        <p className="text-xs text-slate/50">{list.members.length} members</p>
                      </div>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          if (confirm("Delete this list?")) {
                            run(() => deleteEmailList(list.id));
                          }
                        }}
                        className="text-sm font-semibold text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                    {list.members.length > 0 ? (
                      <ul className="mt-3 space-y-1 text-sm">
                        {list.members.map((m) => (
                          <li key={m.id} className="flex justify-between gap-2">
                            <span>
                              {m.name ? `${m.name} · ` : ""}
                              {m.email}
                            </span>
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => run(() => removeEmailListMember(m.id))}
                              className="text-xs font-semibold text-red-600"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}

      {tab === "automations" ? (
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate/10 bg-white p-6">
            <h2 className="font-display text-lg font-bold text-forest">New automation</h2>
            <p className="mt-1 text-sm text-slate/60">
              Automations run when a booking is requested or confirmed.
            </p>
            {templates.length === 0 ? (
              <p className="mt-4 text-sm text-amber-800">Create a template first.</p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Automation name"
                  value={automationForm.name}
                  onChange={(e) => setAutomationForm({ ...automationForm, name: e.target.value })}
                  className="rounded-lg border border-slate/20 px-3 py-2 text-sm sm:col-span-2"
                />
                <select
                  value={automationForm.trigger}
                  onChange={(e) => setAutomationForm({ ...automationForm, trigger: e.target.value })}
                  className="rounded-lg border border-slate/20 px-3 py-2 text-sm"
                >
                  {TRIGGERS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <select
                  value={automationForm.templateId}
                  onChange={(e) =>
                    setAutomationForm({ ...automationForm, templateId: e.target.value })
                  }
                  className="rounded-lg border border-slate/20 px-3 py-2 text-sm"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <select
                  value={automationForm.audience}
                  onChange={(e) =>
                    setAutomationForm({ ...automationForm, audience: e.target.value })
                  }
                  className="rounded-lg border border-slate/20 px-3 py-2 text-sm"
                >
                  <option value="ALL_CUSTOMERS">All customers</option>
                  <option value="EMAIL_LIST">Specific list</option>
                </select>
                {automationForm.audience === "EMAIL_LIST" ? (
                  <select
                    value={automationForm.listId}
                    onChange={(e) =>
                      setAutomationForm({ ...automationForm, listId: e.target.value })
                    }
                    className="rounded-lg border border-slate/20 px-3 py-2 text-sm sm:col-span-2"
                  >
                    {lists.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            )}
            <button
              type="button"
              disabled={pending || templates.length === 0}
              onClick={() =>
                run(async () => {
                  await createEmailAutomation({
                    name: automationForm.name,
                    trigger: automationForm.trigger as "ON_BOOKING_REQUESTED",
                    daysOffset: null,
                    audience: automationForm.audience as "ALL_CUSTOMERS",
                    templateId: automationForm.templateId,
                    listId:
                      automationForm.audience === "EMAIL_LIST"
                        ? automationForm.listId
                        : null,
                  });
                  setAutomationForm({ ...automationForm, name: "" });
                })
              }
              className="mt-4 rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Create automation
            </button>
          </section>

          <section className="rounded-2xl border border-slate/10 bg-white p-6">
            <h2 className="font-display text-lg font-bold text-forest">
              Automations ({automations.length})
            </h2>
            {automations.length === 0 ? (
              <p className="mt-4 text-sm text-slate/60">No automations yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate/10">
                {automations.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                    <div>
                      <p className="font-semibold text-forest">{a.name}</p>
                      <p className="text-sm text-slate/60">
                        {TRIGGERS.find((t) => t.value === a.trigger)?.label ?? a.trigger}
                        {a.daysOffset !== null ? ` · ${a.daysOffset} day(s)` : ""}
                        {" · "}
                        {a.template.name}
                        {a.list ? ` · ${a.list.name}` : " · all customers"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          run(() => updateEmailAutomation(a.id, { enabled: !a.enabled }))
                        }
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          a.enabled
                            ? "bg-teal/10 text-teal"
                            : "bg-slate/10 text-slate/60"
                        }`}
                      >
                        {a.enabled ? "Enabled" : "Disabled"}
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          if (confirm("Delete this automation?")) {
                            run(() => deleteEmailAutomation(a.id));
                          }
                        }}
                        className="text-sm font-semibold text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}

      {tab === "send" ? (
        <section className="rounded-2xl border border-slate/10 bg-white p-6">
          <h2 className="font-display text-lg font-bold text-forest">Send email now</h2>
          <p className="mt-1 text-sm text-slate/60">
            Manually send a template to all customers or a specific list.
          </p>
          {templates.length === 0 ? (
            <p className="mt-4 text-sm text-amber-800">Create a template first.</p>
          ) : (
            <div className="mt-4 space-y-3">
              <select
                value={manualForm.templateId}
                onChange={(e) => setManualForm({ ...manualForm, templateId: e.target.value })}
                className="w-full rounded-lg border border-slate/20 px-3 py-2 text-sm"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={manualForm.audience === "all"}
                    onChange={() => setManualForm({ ...manualForm, audience: "all" })}
                  />
                  All customers ({customerCount})
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={manualForm.audience === "list"}
                    onChange={() => setManualForm({ ...manualForm, audience: "list" })}
                  />
                  Email list
                </label>
              </div>
              {manualForm.audience === "list" ? (
                <select
                  value={manualForm.listId}
                  onChange={(e) => setManualForm({ ...manualForm, listId: e.target.value })}
                  className="w-full rounded-lg border border-slate/20 px-3 py-2 text-sm"
                >
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.members.length})
                    </option>
                  ))}
                </select>
              ) : null}
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  const label =
                    manualForm.audience === "all"
                      ? `all ${customerCount} customers`
                      : "this list";
                  if (!confirm(`Send this email to ${label}?`)) return;
                  run(() =>
                    sendManualCampaign({
                      templateId: manualForm.templateId,
                      listId:
                        manualForm.audience === "list" ? manualForm.listId : undefined,
                    })
                  );
                }}
                className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Send now
              </button>
            </div>
          )}
        </section>
      ) : null}

      {tab === "log" ? (
        <section className="rounded-2xl border border-slate/10 bg-white p-6">
          <h2 className="font-display text-lg font-bold text-forest">Recent sends</h2>
          {sendLogs.length === 0 ? (
            <p className="mt-4 text-sm text-slate/60">No emails sent yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate/10 text-sm">
              {sendLogs.map((log) => (
                <li key={log.id} className="flex flex-wrap justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium text-forest">{log.subject}</p>
                    <p className="text-slate/60">{log.recipientEmail}</p>
                  </div>
                  <div className="text-right text-slate/50">
                    <p>{new Date(log.sentAt).toLocaleString()}</p>
                    {log.manual ? <p className="text-xs">Manual</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
