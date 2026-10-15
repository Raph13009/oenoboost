import { WorkspacePage } from "@/components/admin/WorkspacePage";
import { getClimateTypes } from "./actions";
import { ClimateTypesView } from "@/components/admin/climate-types/ClimateTypesView";

export default async function ClimateTypesPage() {
  let climateTypes: Awaited<ReturnType<typeof getClimateTypes>> = [];
  try {
    climateTypes = await getClimateTypes();
  } catch {
    climateTypes = [];
  }

  return (
    <WorkspacePage
      title="Climats"
      description="Typologie Météo-France (5 climats). La carte publique colore les polygones wine_regions existants — ne pas inventer de frontières."
      flushLeft
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ClimateTypesView climateTypes={climateTypes} />
      </div>
    </WorkspacePage>
  );
}
