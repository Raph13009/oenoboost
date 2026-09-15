import { WorkspacePage } from "@/components/admin/WorkspacePage";
import { getSoilTypes } from "./actions";
import { SoilTypesView } from "@/components/admin/soil-types/SoilTypesView";

export default async function SoilTypesPage() {
  let soilTypes: Awaited<ReturnType<typeof getSoilTypes>> = [];
  try {
    soilTypes = await getSoilTypes();
  } catch {
    soilTypes = [];
  }

  return (
    <WorkspacePage
      title="Sols"
      description="Gérez les sols. Sélectionnez une ligne pour modifier le panneau."
      flushLeft
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <SoilTypesView soilTypes={soilTypes} />
      </div>
    </WorkspacePage>
  );
}
