"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  createClimateType,
  deleteClimateType,
  getAllGrapesLite,
  getAllWineRegionsLite,
  getClimateGrapeLinks,
  getClimateRegionLinks,
  setClimateGrapeLinks,
  setClimateRegionLinks,
  updateClimateType,
  type ClimateLinkedGrape,
  type ClimateLinkedRegion,
  type ClimateType,
} from "@/app/admin/(cms)/climate-types/actions";

const cardClass =
  "rounded-lg border border-slate-200 bg-slate-50/50 shadow-sm overflow-hidden";
const cardPadding = "p-3.5";
const sectionTitleClass =
  "text-xs font-semibold uppercase tracking-wider text-slate-600";
const labelClass = "block text-[11px] text-slate-500 mb-0.5";
const inputClass =
  "h-8 w-full rounded border border-slate-200 bg-white px-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200";
const textareaClass =
  "w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200";

type FormState = {
  slug: string;
  name_fr: string;
  name_en: string;
  color_hex: string;
  definition_fr: string;
  definition_en: string;
  characteristics_fr: string;
  characteristics_en: string;
  temperature_amplitude_fr: string;
  temperature_amplitude_en: string;
  rainfall_fr: string;
  rainfall_en: string;
  sunshine_fr: string;
  sunshine_en: string;
  frost_hail_risk_fr: string;
  frost_hail_risk_en: string;
  vine_wine_impact_fr: string;
  vine_wine_impact_en: string;
  carousel_order: string;
  is_premium: boolean;
  status: string;
  published_at: string;
};

function emptyForm(): FormState {
  return {
    slug: "",
    name_fr: "",
    name_en: "",
    color_hex: "#888888",
    definition_fr: "",
    definition_en: "",
    characteristics_fr: "",
    characteristics_en: "",
    temperature_amplitude_fr: "",
    temperature_amplitude_en: "",
    rainfall_fr: "",
    rainfall_en: "",
    sunshine_fr: "",
    sunshine_en: "",
    frost_hail_risk_fr: "",
    frost_hail_risk_en: "",
    vine_wine_impact_fr: "",
    vine_wine_impact_en: "",
    carousel_order: "",
    is_premium: false,
    status: "draft",
    published_at: "",
  };
}

function fromClimate(c: ClimateType): FormState {
  return {
    slug: c.slug ?? "",
    name_fr: c.name_fr ?? "",
    name_en: c.name_en ?? "",
    color_hex: c.color_hex ?? "#888888",
    definition_fr: c.definition_fr ?? "",
    definition_en: c.definition_en ?? "",
    characteristics_fr: c.characteristics_fr ?? "",
    characteristics_en: c.characteristics_en ?? "",
    temperature_amplitude_fr: c.temperature_amplitude_fr ?? "",
    temperature_amplitude_en: c.temperature_amplitude_en ?? "",
    rainfall_fr: c.rainfall_fr ?? "",
    rainfall_en: c.rainfall_en ?? "",
    sunshine_fr: c.sunshine_fr ?? "",
    sunshine_en: c.sunshine_en ?? "",
    frost_hail_risk_fr: c.frost_hail_risk_fr ?? "",
    frost_hail_risk_en: c.frost_hail_risk_en ?? "",
    vine_wine_impact_fr: c.vine_wine_impact_fr ?? "",
    vine_wine_impact_en: c.vine_wine_impact_en ?? "",
    carousel_order:
      c.carousel_order === null || c.carousel_order === undefined
        ? ""
        : String(c.carousel_order),
    is_premium: !!c.is_premium,
    status: c.status || "draft",
    published_at: c.published_at ?? "",
  };
}

function CollapsibleCard({
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
    <section className={cardClass}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 border-b border-slate-200 bg-slate-100/70 px-3.5 py-2.5 text-left transition-colors hover:bg-slate-100/90"
      >
        <span className={sectionTitleClass}>{title}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${
            open ? "" : "-rotate-90"
          }`}
          aria-hidden
        />
      </button>
      <div
        className="overflow-hidden transition-[max-height] duration-200 ease-out"
        style={{ maxHeight: open ? "none" : 0 }}
      >
        <div className={cardPadding}>{children}</div>
      </div>
    </section>
  );
}

type Props = {
  climateType: ClimateType | null;
  onClose: () => void;
  onDeleted: () => void;
  onCreated?: (id: string) => void;
};

export function ClimateTypeEditor({
  climateType,
  onClose,
  onDeleted,
  onCreated,
}: Props) {
  const router = useRouter();
  const isNew = !climateType;
  const [form, setForm] = useState<FormState>(
    climateType ? fromClimate(climateType) : emptyForm(),
  );
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [openCards, setOpenCards] = useState({
    identity: true,
    content: true,
    links: true,
    flags: true,
  });

  const [allRegions, setAllRegions] = useState<
    Array<{ id: string; name_fr: string; slug: string }>
  >([]);
  const [allGrapes, setAllGrapes] = useState<ClimateLinkedGrape[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<ClimateLinkedRegion[]>(
    [],
  );
  const [selectedGrapeIds, setSelectedGrapeIds] = useState<string[]>([]);

  useEffect(() => {
    setForm(climateType ? fromClimate(climateType) : emptyForm());
    setError(null);
  }, [climateType]);

  useEffect(() => {
    let active = true;
    Promise.all([getAllWineRegionsLite(), getAllGrapesLite()])
      .then(([regions, grapes]) => {
        if (!active) return;
        setAllRegions(regions);
        setAllGrapes(grapes);
      })
      .catch(() => {
        if (!active) return;
        setAllRegions([]);
        setAllGrapes([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!climateType?.id) {
      setSelectedRegions([]);
      setSelectedGrapeIds([]);
      return () => {
        active = false;
      };
    }
    Promise.all([
      getClimateRegionLinks(climateType.id),
      getClimateGrapeLinks(climateType.id),
    ])
      .then(([regions, grapes]) => {
        if (!active) return;
        setSelectedRegions(regions);
        setSelectedGrapeIds(grapes.map((g) => g.id));
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Impossible de charger les liens.",
        );
      });
    return () => {
      active = false;
    };
  }, [climateType?.id]);

  const selectedRegionIds = useMemo(
    () => new Set(selectedRegions.map((r) => r.id)),
    [selectedRegions],
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function bilingualField(
    labelFr: string,
    labelEn: string,
    keyFr: keyof FormState,
    keyEn: keyof FormState,
  ) {
    return (
      <div className="grid gap-2 md:grid-cols-2">
        <div>
          <label className={labelClass}>{labelFr}</label>
          <textarea
            className={textareaClass}
            rows={3}
            value={form[keyFr] as string}
            onChange={(e) => update(keyFr, e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>{labelEn}</label>
          <textarea
            className={textareaClass}
            rows={3}
            value={form[keyEn] as string}
            onChange={(e) => update(keyEn, e.target.value)}
          />
        </div>
      </div>
    );
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const payload = {
        slug: form.slug.trim(),
        name_fr: form.name_fr.trim(),
        name_en: form.name_en.trim(),
        color_hex: form.color_hex.trim() || null,
        definition_fr: form.definition_fr || null,
        definition_en: form.definition_en || null,
        characteristics_fr: form.characteristics_fr || null,
        characteristics_en: form.characteristics_en || null,
        temperature_amplitude_fr: form.temperature_amplitude_fr || null,
        temperature_amplitude_en: form.temperature_amplitude_en || null,
        rainfall_fr: form.rainfall_fr || null,
        rainfall_en: form.rainfall_en || null,
        sunshine_fr: form.sunshine_fr || null,
        sunshine_en: form.sunshine_en || null,
        frost_hail_risk_fr: form.frost_hail_risk_fr || null,
        frost_hail_risk_en: form.frost_hail_risk_en || null,
        vine_wine_impact_fr: form.vine_wine_impact_fr || null,
        vine_wine_impact_en: form.vine_wine_impact_en || null,
        carousel_order: form.carousel_order
          ? Number(form.carousel_order)
          : null,
        is_premium: form.is_premium,
        status: form.status,
        published_at: form.published_at || null,
        created_at: climateType?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      };

      if (!payload.slug || !payload.name_fr || !payload.name_en) {
        setError("Slug, nom FR et nom EN sont requis.");
        return;
      }

      let climateId = climateType?.id;
      if (isNew) {
        const result = await createClimateType(payload);
        if (result.error) {
          setError(result.error);
          return;
        }
        climateId = result.id;
      } else if (climateId) {
        const result = await updateClimateType(climateId, payload);
        if (result.error) {
          setError(result.error);
          return;
        }
      }

      if (climateId) {
        const regionResult = await setClimateRegionLinks(
          climateId,
          selectedRegions.map((r) => ({
            regionId: r.id,
            isPrimary: r.is_primary,
          })),
        );
        if (regionResult.error) {
          setError(regionResult.error);
          return;
        }
        const grapeResult = await setClimateGrapeLinks(
          climateId,
          selectedGrapeIds,
        );
        if (grapeResult.error) {
          setError(grapeResult.error);
          return;
        }
      }

      router.refresh();
      if (isNew && climateId && onCreated) onCreated(climateId);
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            {isNew ? "Nouveau climat" : form.name_fr || "Climat"}
          </h2>
          <p className="text-[11px] text-slate-500">
            Géographie = liaison aux wine_regions (pas de polygones inventés).
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
        >
          Fermer
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-auto p-4">
        {error ? (
          <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <CollapsibleCard
          title="Identité"
          open={openCards.identity}
          onToggle={() =>
            setOpenCards((s) => ({ ...s, identity: !s.identity }))
          }
        >
          <div className="space-y-2.5">
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <label className={labelClass}>Nom FR</label>
                <input
                  className={inputClass}
                  value={form.name_fr}
                  onChange={(e) => update("name_fr", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Nom EN</label>
                <input
                  className={inputClass}
                  value={form.name_en}
                  onChange={(e) => update("name_en", e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <div>
                <label className={labelClass}>Slug</label>
                <input
                  className={inputClass}
                  value={form.slug}
                  onChange={(e) => update("slug", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Couleur</label>
                <input
                  type="color"
                  className="h-8 w-full rounded border border-slate-200 bg-white"
                  value={form.color_hex || "#888888"}
                  onChange={(e) => update("color_hex", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Ordre carrousel</label>
                <input
                  className={inputClass}
                  value={form.carousel_order}
                  onChange={(e) => update("carousel_order", e.target.value)}
                />
              </div>
            </div>
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          title="Contenu pédagogique"
          open={openCards.content}
          onToggle={() => setOpenCards((s) => ({ ...s, content: !s.content }))}
        >
          <div className="space-y-3">
            {bilingualField(
              "Définition (FR)",
              "Definition (EN)",
              "definition_fr",
              "definition_en",
            )}
            {bilingualField(
              "Caractéristiques (FR)",
              "Characteristics (EN)",
              "characteristics_fr",
              "characteristics_en",
            )}
            {bilingualField(
              "Amplitude thermique (FR)",
              "Temperature amplitude (EN)",
              "temperature_amplitude_fr",
              "temperature_amplitude_en",
            )}
            {bilingualField(
              "Pluviométrie (FR)",
              "Rainfall (EN)",
              "rainfall_fr",
              "rainfall_en",
            )}
            {bilingualField(
              "Ensoleillement (FR)",
              "Sunshine (EN)",
              "sunshine_fr",
              "sunshine_en",
            )}
            {bilingualField(
              "Risques gel/grêle (FR)",
              "Frost/hail risk (EN)",
              "frost_hail_risk_fr",
              "frost_hail_risk_en",
            )}
            {bilingualField(
              "Impact vigne/vin (FR)",
              "Vine/wine impact (EN)",
              "vine_wine_impact_fr",
              "vine_wine_impact_en",
            )}
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          title="Régions & cépages"
          open={openCards.links}
          onToggle={() => setOpenCards((s) => ({ ...s, links: !s.links }))}
        >
          <div className="space-y-4">
            <div>
              <p className={labelClass}>Régions viticoles liées</p>
              <div className="mt-1 max-h-48 space-y-1 overflow-auto rounded border border-slate-200 bg-white p-2">
                {allRegions.map((region) => {
                  const checked = selectedRegionIds.has(region.id);
                  const current = selectedRegions.find(
                    (r) => r.id === region.id,
                  );
                  return (
                    <label
                      key={region.id}
                      className="flex items-center justify-between gap-2 rounded px-1.5 py-1 text-sm hover:bg-slate-50"
                    >
                      <span className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRegions((prev) => [
                                ...prev,
                                {
                                  id: region.id,
                                  name_fr: region.name_fr,
                                  slug: region.slug,
                                  is_primary: false,
                                },
                              ]);
                            } else {
                              setSelectedRegions((prev) =>
                                prev.filter((r) => r.id !== region.id),
                              );
                            }
                          }}
                        />
                        {region.name_fr}
                      </span>
                      {checked ? (
                        <label className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                          <input
                            type="checkbox"
                            checked={!!current?.is_primary}
                            onChange={(e) => {
                              setSelectedRegions((prev) =>
                                prev.map((r) =>
                                  r.id === region.id
                                    ? { ...r, is_primary: e.target.checked }
                                    : r,
                                ),
                              );
                            }}
                          />
                          Climat principal de la région
                        </label>
                      ) : null}
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <p className={labelClass}>Cépages associés</p>
              <div className="mt-1 max-h-48 space-y-1 overflow-auto rounded border border-slate-200 bg-white p-2">
                {allGrapes.map((grape) => {
                  const checked = selectedGrapeIds.includes(grape.id);
                  return (
                    <label
                      key={grape.id}
                      className="flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setSelectedGrapeIds((prev) =>
                            e.target.checked
                              ? [...prev, grape.id]
                              : prev.filter((id) => id !== grape.id),
                          );
                        }}
                      />
                      {grape.name_fr}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          title="Publication"
          open={openCards.flags}
          onToggle={() => setOpenCards((s) => ({ ...s, flags: !s.flags }))}
        >
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <label className={labelClass}>Statut</label>
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="archived">archived</option>
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_premium}
                  onChange={(e) => update("is_premium", e.target.checked)}
                />
                Contenu Premium
              </label>
            </div>
          </div>
        </CollapsibleCard>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-4 py-3">
        {!isNew ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
          >
            Supprimer
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          disabled={isPending}
          onClick={handleSave}
          className="rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer ce climat ?"
        message="Soft-delete : le climat disparaîtra de l’app publique."
        confirmLabel="Supprimer"
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          if (!climateType) return;
          setConfirmDelete(false);
          const result = await deleteClimateType(climateType.id);
          if (result.error) {
            setError(result.error);
            return;
          }
          router.refresh();
          onDeleted();
        }}
      />
    </div>
  );
}
