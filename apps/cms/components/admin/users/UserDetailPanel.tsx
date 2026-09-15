"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@/app/admin/(cms)/users/actions";
import {
  getUser,
  updateUser,
  deleteUser,
  deactivateUser,
} from "@/app/admin/(cms)/users/actions";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

const labelClass = "block text-[11px] text-slate-500 mb-0.5";
const inputClass =
  "h-8 w-full rounded border border-slate-200 bg-white px-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200";

type Props = {
  userId: string;
  onClose: () => void;
  onDeleted: () => void;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/80 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">{title}</span>
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}

function CollapsibleSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-2 text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">{title}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? "" : "-rotate-90"}`}
          aria-hidden
        />
      </button>
      {open && <div className="p-3">{children}</div>}
    </section>
  );
}

function formatDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString("fr-FR");
}

export function UserDetailPanel({ userId, onClose, onDeleted }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<User>>({});
  const [saving, setSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [systemOpen, setSystemOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getUser(userId).then((data) => {
      if (!cancelled && data) {
        setUser(data);
        setForm({
          first_name: data.first_name ?? "",
          last_name: data.last_name ?? "",
          email: data.email ?? "",
          avatar_url: data.avatar_url ?? "",
          role: data.role,
          plan: data.plan,
          plan_expires_at: data.plan_expires_at ?? "",
          level: data.level,
          streak_days: data.streak_days,
          is_verified: data.is_verified,
          locale: data.locale,
        });
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const update = useCallback((updates: Partial<User>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleSave = async () => {
    if (!userId || !form) return;
    setError(null);
    setSaving(true);
    try {
      const res = await updateUser(userId, {
        first_name: form.first_name ?? null,
        last_name: form.last_name ?? null,
        email: form.email ?? undefined,
        avatar_url: form.avatar_url ?? null,
        role: form.role,
        plan: form.plan,
        plan_expires_at: form.plan_expires_at || null,
        level: form.level,
        streak_days: form.streak_days ?? 0,
        is_verified: form.is_verified ?? false,
        locale: form.locale,
      });
      if (res.error) setError(res.error);
      else {
        router.refresh();
        setSavedFeedback(true);
        setTimeout(() => setSavedFeedback(false), 1500);
        const updated = await getUser(userId);
        if (updated) setUser(updated);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!userId) return;
    setError(null);
    setDeleting(true);
    try {
      const res = await deleteUser(userId);
      if (res.error) setError(res.error);
      else {
        router.refresh();
        onDeleted();
        setDeleteModalOpen(false);
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!userId) return;
    setError(null);
    setDeleting(true);
    try {
      const res = await deactivateUser(userId);
      if (res.error) setError(res.error);
      else {
        router.refresh();
        onDeleted();
        setDeactivateModalOpen(false);
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-white p-6 text-sm text-slate-500">
        Chargement…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-full flex-col justify-center bg-white p-6 text-sm text-slate-500">
        Utilisateur introuvable.
        <button type="button" onClick={onClose} className="mt-2 text-slate-700 underline">
          Fermer
        </button>
      </div>
    );
  }

  const displayName = [form.first_name, form.last_name].filter(Boolean).join(" ") || form.email || "Utilisateur";

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-4 py-2.5">
        <h2 className="min-w-0 truncate text-base font-semibold text-slate-900">{displayName}</h2>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`rounded px-2.5 py-1.5 text-sm font-medium ${
              savedFeedback ? "bg-emerald-600 text-white" : "bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
            }`}
          >
            {saving ? "Enregistrement…" : savedFeedback ? "Enregistré ✓" : "Enregistrer"}
          </button>
        </div>
      </div>

      {error && (
        <div className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto p-3 space-y-3">
        <Section title="Identité">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Prénom</label>
              <input
                value={form.first_name ?? ""}
                onChange={(e) => update({ first_name: e.target.value || null })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Nom</label>
              <input
                value={form.last_name ?? ""}
                onChange={(e) => update({ last_name: e.target.value || null })}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={form.email ?? ""}
                onChange={(e) => update({ email: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>URL avatar</label>
              <input
                value={form.avatar_url ?? ""}
                onChange={(e) => update({ avatar_url: e.target.value || null })}
                className={inputClass}
                placeholder="https://…"
              />
            </div>
          </div>
        </Section>

        <Section title="Compte">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Rôle</label>
              <select
                value={form.role ?? "user"}
                onChange={(e) => update({ role: e.target.value })}
                className={inputClass}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Offre</label>
              <select
                value={form.plan ?? "free"}
                onChange={(e) => update({ plan: e.target.value })}
                className={inputClass}
              >
                <option value="free">free</option>
                <option value="premium">premium</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Offre expire le</label>
              <input
                type="datetime-local"
                value={form.plan_expires_at ? new Date(form.plan_expires_at).toISOString().slice(0, 16) : ""}
                onChange={(e) =>
                  update({ plan_expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Niveau</label>
              <select
                value={form.level ?? "beginner"}
                onChange={(e) => update({ level: e.target.value })}
                className={inputClass}
              >
                <option value="beginner">beginner</option>
                <option value="amateur">amateur</option>
                <option value="enthusiast">enthusiast</option>
                <option value="expert">expert</option>
              </select>
            </div>
          </div>
        </Section>

        <Section title="Activité">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Jours de série</label>
              <input
                type="number"
                min={0}
                value={form.streak_days ?? 0}
                onChange={(e) => update({ streak_days: parseInt(e.target.value, 10) || 0 })}
                className={inputClass}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-slate-800">
                <input
                  type="checkbox"
                  checked={!!form.is_verified}
                  onChange={(e) => update({ is_verified: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Compte vérifié
              </label>
            </div>
            <div>
              <label className={labelClass}>Langue</label>
              <select
                value={form.locale ?? "fr"}
                onChange={(e) => update({ locale: e.target.value })}
                className={inputClass}
              >
                <option value="fr">fr</option>
                <option value="en">en</option>
              </select>
            </div>
          </div>
        </Section>

        <CollapsibleSection title="Système" open={systemOpen} onToggle={() => setSystemOpen(!systemOpen)}>
          <dl className="space-y-1.5 text-xs">
            <div>
              <dt className={labelClass}>Créé le</dt>
              <dd className="text-slate-800">{formatDate(user.created_at)}</dd>
            </div>
            <div>
              <dt className={labelClass}>Mis à jour le</dt>
              <dd className="text-slate-800">{formatDate(user.updated_at)}</dd>
            </div>
            <div>
              <dt className={labelClass}>Supprimé le</dt>
              <dd className="text-slate-800">{formatDate(user.deleted_at)}</dd>
            </div>
          </dl>
        </CollapsibleSection>

        <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-3">
          <button
            type="button"
            onClick={() => setDeactivateModalOpen(true)}
            className="rounded border border-amber-200 px-2.5 py-1.5 text-sm text-amber-800 hover:bg-amber-50"
          >
            Désactiver l'utilisateur
          </button>
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="rounded border border-red-200 px-2.5 py-1.5 text-sm text-red-700 hover:bg-red-50"
          >
            Supprimer l'utilisateur
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={deactivateModalOpen}
        onClose={() => setDeactivateModalOpen(false)}
        title="Désactiver l'utilisateur"
        message="Cette action effectuera une suppression logique. L'utilisateur n'apparaîtra plus dans la liste."
        confirmLabel="Désactiver"
        onConfirm={handleDeactivate}
        variant="danger"
        loading={deleting}
      />
      <ConfirmDialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Supprimer l'utilisateur"
        message="Supprimer définitivement cet utilisateur ? Cette action est irréversible."
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
