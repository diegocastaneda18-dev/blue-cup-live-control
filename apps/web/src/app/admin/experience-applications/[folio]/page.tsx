import { AdminGate } from "../../../../components/admin/AdminGate";
import { ApplicationDetailView } from "../../../../components/admin/ApplicationDetailView";

type PageProps = {
  params: Promise<{ folio: string }>;
};

export default async function AdminExperienceApplicationDetailPage({ params }: PageProps) {
  const { folio } = await params;
  return (
    <AdminGate>
      <ApplicationDetailView folio={decodeURIComponent(folio)} />
    </AdminGate>
  );
}
