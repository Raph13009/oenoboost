export type VinificationStepWriteInput = {
  vinification_type_id: string;
  step_order: number;
  icon_url: string | null;
  title_fr: string;
  title_en: string | null;
  summary_fr: string | null;
  summary_en: string | null;
  detail_fr: string | null;
  detail_en: string | null;
};

export function nextVinificationStepOrder(maxExistingOrder: number | null | undefined): number {
  return (maxExistingOrder ?? 0) + 1;
}

export function buildNewVinificationStepInsert(
  vinificationTypeId: string,
  nextStepOrder: number
): {
  vinification_type_id: string;
  step_order: number;
  title_fr: string;
  title_en: string;
} {
  return {
    vinification_type_id: vinificationTypeId,
    step_order: nextStepOrder,
    title_fr: `Étape ${nextStepOrder}`,
    title_en: `Step ${nextStepOrder}`,
  };
}

export function vinificationStepFormToRow(form: VinificationStepWriteInput): Record<string, unknown> {
  return {
    vinification_type_id: form.vinification_type_id,
    step_order: form.step_order,
    icon_url: form.icon_url || null,
    title_fr: form.title_fr ?? "",
    title_en: form.title_en ?? "",
    summary_fr: form.summary_fr || null,
    summary_en: form.summary_en || null,
    detail_fr: form.detail_fr || null,
    detail_en: form.detail_en || null,
  };
}
