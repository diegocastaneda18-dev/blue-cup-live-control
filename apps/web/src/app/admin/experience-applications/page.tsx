import { AdminGate } from "../../../components/admin/AdminGate";
import { ApplicationsDashboard } from "../../../components/admin/ApplicationsDashboard";

export default function AdminExperienceApplicationsPage() {
  return (
    <AdminGate>
      <ApplicationsDashboard />
    </AdminGate>
  );
}
