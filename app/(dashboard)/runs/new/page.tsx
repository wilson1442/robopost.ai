import { requireAuth } from "@/lib/auth/auth";
import RunTriggerForm from "@/components/dashboard/runs/RunTriggerForm";

export default async function NewRunPage() {
  await requireAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Trigger New Run</h1>
        <p className="text-gray-400">
          Configure and trigger a new content generation run
        </p>
      </div>

      <div className="glass-effect rounded-xl p-6">
        <RunTriggerForm />
      </div>
    </div>
  );
}

