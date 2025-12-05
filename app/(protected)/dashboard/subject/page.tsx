"use client";

import { SubjectManager } from "@/components/admin/SubjectManager";

export default function SubjectPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Subjects</p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Manage subjects</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Upload subject images to Supabase storage and manage subject details.
        </p>
      </div>
      <SubjectManager />
    </div>
  );
}
