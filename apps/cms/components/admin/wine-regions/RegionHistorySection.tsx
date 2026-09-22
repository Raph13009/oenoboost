"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, GripVertical, Plus } from "lucide-react";
import type { WineRegionHistoryMilestone } from "@/app/admin/(cms)/wine-regions/actions";
import {
  createWineRegionHistoryMilestone,
  deleteWineRegionHistoryMilestone,
  getWineRegionHistoryMilestones,
  reorderWineRegionHistoryMilestones,
  updateWineRegionHistoryMilestone,
} from "@/app/admin/(cms)/wine-regions/actions";

const labelClass = "block text-[11px] text-slate-500 mb-0.5";
const inputClass =
  "h-8 w-full rounded border border-slate-200 bg-white px-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200";
const fieldSpacing = "space-y-2.5";

type Props = {
  regionId: string | null;
  onError: (message: string | null) => void;
};

type MilestoneCardProps = {
  milestone: WineRegionHistoryMilestone;
  draggedId: string | null;
  saving: boolean;
  saved: boolean;
  deleting: boolean;
  onChange: (id: string, updates: Partial<WineRegionHistoryMilestone>) => void;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDragEnd: () => void;
};

function MilestoneCard({
  milestone,
  draggedId,
  saving,
  saved,
  deleting,
  onChange,
  onSave,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
}: MilestoneCardProps) {
  const [open, setOpen] = useState(true);
  const textareaClass =
    "min-h-[4rem] w-full resize-none rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200";

  return (
    <section
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        onDragOver(milestone.id);
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDragEnd();
      }}
      className={`rounded-lg border border-slate-200 bg-slate-50/50 shadow-sm ${
        draggedId === milestone.id ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100/70 px-3.5 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
            aria-hidden
          />
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-600">
            Jalon {milestone.milestone_order}
          </span>
          <span className="min-w-0 truncate text-sm font-medium text-slate-800">
            {milestone.period_label_fr.trim() || milestone.title_fr.trim() || "Sans titre"}
          </span>
        </button>
        <span
          draggable
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            onDragStart(milestone.id);
          }}
          onDragEnd={onDragEnd}
          className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-600 active:cursor-grabbing"
          title="Réordonner"
        >
          <GripVertical className="h-4 w-4" />
        </span>
      </div>

      {open && (
        <div className="space-y-3 p-3.5">
          <div className="grid grid-cols-1 gap-x-3 gap-y-2.5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Période / date (FR)</label>
              <input
                value={milestone.period_label_fr}
                onChange={(e) => onChange(milestone.id, { period_label_fr: e.target.value })}
                className={inputClass}
                placeholder="ex. 1855, XIIe siècle"
              />
            </div>
            <div>
              <label className={labelClass}>Période / date (EN)</label>
              <input
                value={milestone.period_label_en}
                onChange={(e) => onChange(milestone.id, { period_label_en: e.target.value })}
                className={inputClass}
                placeholder="e.g. 1855, 12th century"
              />
            </div>
            <div>
              <label className={labelClass}>Titre court (FR)</label>
              <input
                value={milestone.title_fr}
                onChange={(e) => onChange(milestone.id, { title_fr: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Titre court (EN)</label>
              <input
                value={milestone.title_en}
                onChange={(e) => onChange(milestone.id, { title_en: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Détail (FR)</label>
            <textarea
              value={milestone.detail_fr ?? ""}
              onChange={(e) => onChange(milestone.id, { detail_fr: e.target.value || null })}
              className={textareaClass}
              rows={3}
            />
          </div>
          <div>
            <label className={labelClass}>Détail (EN)</label>
            <textarea
              value={milestone.detail_en ?? ""}
              onChange={(e) => onChange(milestone.id, { detail_en: e.target.value || null })}
              className={textareaClass}
              rows={3}
            />
          </div>
          <div>
            <label className={labelClass}>icon_url (optionnel)</label>
            <input
              value={milestone.icon_url ?? ""}
              onChange={(e) => onChange(milestone.id, { icon_url: e.target.value || null })}
              className={inputClass}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500">Ordre: {milestone.milestone_order}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onDelete(milestone.id)}
                disabled={deleting}
                className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {deleting ? "Suppression…" : "Supprimer"}
              </button>
              <button
                type="button"
                onClick={() => onSave(milestone.id)}
                disabled={saving}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                  saved
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                {saving ? "Enregistrement…" : saved ? "Enregistré ✓" : "Enregistrer le jalon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function RegionHistorySection({ regionId, onError }: Props) {
  const [milestones, setMilestones] = useState<WineRegionHistoryMilestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [savingIds, setSavingIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const milestonesRef = useRef(milestones);
  milestonesRef.current = milestones;

  useEffect(() => {
    if (!regionId) {
      setMilestones([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getWineRegionHistoryMilestones(regionId)
      .then((rows) => {
        if (!cancelled) setMilestones(rows);
      })
      .catch((err: Error) => {
        if (!cancelled) onError(err.message || "Impossible de charger l'historique.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [regionId, onError]);

  const handleChange = useCallback((id: string, updates: Partial<WineRegionHistoryMilestone>) => {
    setSavedIds((current) => current.filter((item) => item !== id));
    setMilestones((current) =>
      current.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const handleAdd = async () => {
    if (!regionId) return;
    onError(null);
    setAdding(true);
    try {
      const res = await createWineRegionHistoryMilestone(regionId);
      if (res.error || !res.milestone) {
        onError(res.error ?? "Impossible de créer le jalon.");
        return;
      }
      setMilestones((current) =>
        [...current, res.milestone!].sort((a, b) => a.milestone_order - b.milestone_order)
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur réseau";
      onError(
        /fetch|network|Failed/i.test(message)
          ? "Serveur CMS injoignable. Vérifiez que le CMS tourne (port 3001), puis réessayez."
          : message
      );
    } finally {
      setAdding(false);
    }
  };

  const handleSave = async (id: string) => {
    const milestone = milestones.find((item) => item.id === id);
    if (!milestone) return;
    onError(null);
    setSavingIds((current) => [...current, id]);
    try {
      const res = await updateWineRegionHistoryMilestone(id, {
        id: milestone.id,
        region_id: milestone.region_id,
        milestone_order: milestone.milestone_order,
        period_label_fr: milestone.period_label_fr,
        period_label_en: milestone.period_label_en,
        title_fr: milestone.title_fr,
        title_en: milestone.title_en,
        detail_fr: milestone.detail_fr,
        detail_en: milestone.detail_en,
        icon_url: milestone.icon_url,
      });
      if (res.error) {
        onError(res.error);
        return;
      }
      setSavedIds((current) => [...current.filter((item) => item !== id), id]);
      window.setTimeout(() => {
        setSavedIds((current) => current.filter((item) => item !== id));
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur réseau";
      onError(
        /fetch|network|Failed/i.test(message)
          ? "Serveur CMS injoignable. Vérifiez que le CMS tourne (port 3001), puis réessayez."
          : message
      );
    } finally {
      setSavingIds((current) => current.filter((item) => item !== id));
    }
  };

  const handleDelete = async (id: string) => {
    onError(null);
    setDeletingIds((current) => [...current, id]);
    const previous = milestones;
    const remaining = previous
      .filter((item) => item.id !== id)
      .map((item, index) => ({ ...item, milestone_order: index + 1 }));
    setMilestones(remaining);
    try {
      const res = await deleteWineRegionHistoryMilestone(id);
      if (res.error) {
        onError(res.error);
        setMilestones(previous);
      }
    } finally {
      setDeletingIds((current) => current.filter((item) => item !== id));
    }
  };

  const persistOrder = useCallback(
    async (next: WineRegionHistoryMilestone[]) => {
      if (!regionId) return;
      const res = await reorderWineRegionHistoryMilestones(
        regionId,
        next.map((item) => item.id)
      );
      if (res.error) onError(res.error);
    },
    [regionId, onError]
  );

  const handleDragStart = useCallback((id: string) => {
    setDraggedId(id);
  }, []);

  const handleDragOver = useCallback(
    (targetId: string) => {
      if (!draggedId || draggedId === targetId) return;
      setMilestones((current) => {
        const fromIndex = current.findIndex((item) => item.id === draggedId);
        const toIndex = current.findIndex((item) => item.id === targetId);
        if (fromIndex < 0 || toIndex < 0) return current;
        const next = [...current];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next.map((item, index) => ({ ...item, milestone_order: index + 1 }));
      });
    },
    [draggedId]
  );

  const handleDragEnd = useCallback(() => {
    if (!draggedId) return;
    const next = milestonesRef.current.map((item, index) => ({
      ...item,
      milestone_order: index + 1,
    }));
    setMilestones(next);
    void persistOrder(next);
    setDraggedId(null);
  }, [draggedId, persistOrder]);

  if (!regionId) {
    return (
      <p className="text-sm text-slate-500">
        Enregistrez d&apos;abord la région pour ajouter des jalons historiques.
      </p>
    );
  }

  return (
    <div className={fieldSpacing}>
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding}
          className="rounded border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            <span>{adding ? "Ajout…" : "Ajouter un jalon"}</span>
          </span>
        </button>
      </div>

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-4 text-sm text-slate-500">
          Chargement de l&apos;historique...
        </div>
      ) : milestones.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-500">
          Aucun jalon historique pour cette région
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              draggedId={draggedId}
              saving={savingIds.includes(milestone.id)}
              saved={savedIds.includes(milestone.id)}
              deleting={deletingIds.includes(milestone.id)}
              onChange={handleChange}
              onSave={handleSave}
              onDelete={handleDelete}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      )}
    </div>
  );
}
