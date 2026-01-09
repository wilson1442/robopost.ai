import { requireAdmin } from "@/lib/auth/admin";
import CSVImportModal from "@/components/admin/sources/CSVImportModal";

export default async function AdminImportSourcesPage() {
  await requireAdmin();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Import Sources from CSV</h1>
        <p className="text-gray-400">
          Upload a CSV file to bulk import RSS sources
        </p>
      </div>

      <div className="glass-effect rounded-xl p-6">
        <CSVImportModal />
      </div>
    </div>
  );
}

