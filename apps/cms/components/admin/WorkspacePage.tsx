type Props = {
  title: string;
  description?: string;
  children?: React.ReactNode;
  /** Colle le contenu au drawer (pas d’espace à gauche). */
  flushLeft?: boolean;
};

export function WorkspacePage({ title, description, children, flushLeft }: Props) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className={`shrink-0 border-b border-slate-200 bg-white py-3 ${flushLeft ? "pl-5 pr-6" : "px-6"}`}>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      <div className={`flex min-h-0 flex-1 flex-col overflow-hidden ${flushLeft ? "pl-0 pr-6 pt-0 pb-6" : "px-6 pt-3 pb-6"}`}>
        {children ?? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Content panels will be added here.
          </div>
        )}
      </div>
    </div>
  );
}
