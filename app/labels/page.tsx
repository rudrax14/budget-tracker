import { listLabels } from "@/lib/data/labels";
import { getCurrentUserId } from "@/lib/session";
import { LabelsBrowser } from "@/components/labels-browser";

export const metadata = { title: "Select Label · Budget Tracker" };
export const dynamic = "force-dynamic";

export default async function LabelsPage() {
  const userId = await getCurrentUserId();
  const labels = await listLabels(userId);
  return <LabelsBrowser labels={labels} />;
}
