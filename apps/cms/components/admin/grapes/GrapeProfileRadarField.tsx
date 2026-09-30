"use client";

import {
  GRAPE_RADAR_MAX,
  GRAPE_RADAR_MIN,
  type GrapeRadarFields,
} from "@/lib/grape-radar";

const labelClass = "block text-[11px] text-slate-500 mb-0.5";
const inputClass =
  "h-8 w-full rounded border border-slate-200 bg-white px-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200";

const AXES: Array<{ key: keyof GrapeRadarFields; label: string }> = [
  { key: "radar_acidity", label: "Acidité" },
  { key: "radar_body", label: "Corps / Puissance" },
  { key: "radar_aromatic_intensity", label: "Intensité aromatique" },
  { key: "radar_tannins", label: "Tanins" },
  { key: "radar_alcohol_potential", label: "Potentiel alcoolique" },
];

type Props = {
  value: GrapeRadarFields;
  onChange: (next: GrapeRadarFields) => void;
  disabled?: boolean;
};

/** Five optional axes 0–8 for Profil du cépage (saved with the grape form). */
export function GrapeProfileRadarField({ value, onChange, disabled }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Valeurs de <strong>0 à 8</strong>. Laisser vide si non renseigné — la fiche publique
        n&apos;affiche le radar que lorsqu&apos;au moins un axe est rempli.
      </p>
      <div className="grid grid-cols-1 gap-x-3 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {AXES.map(({ key, label }) => (
          <div key={key}>
            <label className={labelClass} htmlFor={`grape-${key}`}>
              {label}
            </label>
            <input
              id={`grape-${key}`}
              type="number"
              min={GRAPE_RADAR_MIN}
              max={GRAPE_RADAR_MAX}
              step={1}
              disabled={disabled}
              value={value[key] ?? ""}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  onChange({ ...value, [key]: null });
                  return;
                }
                const n = Number(raw);
                onChange({
                  ...value,
                  [key]: Number.isFinite(n) ? Math.round(n) : null,
                });
              }}
              className={inputClass}
              placeholder="—"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
