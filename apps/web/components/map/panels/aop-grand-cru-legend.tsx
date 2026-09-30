type AopGrandCruLegendProps = {
  label: string;
};

/** Compact map legend for Grand Cru markers (issue #6). */
export function AopGrandCruLegend({ label }: AopGrandCruLegendProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/95 px-3 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur-[2px]">
      <span
        className="inline-block h-3 w-3 shrink-0 rounded-full border-[1.5px] border-white"
        style={{ backgroundColor: "#c41e3a" }}
        aria-hidden
      />
      <span>{label}</span>
    </div>
  );
}
