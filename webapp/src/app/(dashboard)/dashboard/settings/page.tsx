import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getWorkspaceSettings, getOrCreateTaxPolicy, getOrCreateForecastAssumption } from "@/app/actions/settings";
import { SettingsShell } from "@/components/settings/SettingsShell";

export const metadata = { title: "Einstellungen" };

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [workspace, taxPolicy, forecastAssumption] = await Promise.all([
    getWorkspaceSettings(),
    getOrCreateTaxPolicy(),
    getOrCreateForecastAssumption(),
  ]);

  return (
    <SettingsShell
      workspace={workspace}
      taxPolicy={taxPolicy}
      forecastAssumption={forecastAssumption}
    />
  );
}
