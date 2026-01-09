"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CSVImportModal() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    imported: number;
    errors?: string[];
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setPreview([]);

    // Preview CSV
    const text = await selectedFile.text();
    const lines = text.split("\n").filter((line) => line.trim());
    const previewData = lines.slice(0, 6).map((line) => line.split(",").map((v) => v.trim()));

    setPreview(previewData);
  };

  const handleImport = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/sources/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to import sources");
      }

      setSuccess(`Successfully imported ${data.imported} sources!`);
      setImportResult(data);

      if (data.errors && data.errors.length > 0) {
        setError(`Some rows had errors: ${data.errors.join(", ")}`);
      }

      setTimeout(() => {
        router.push("/admin/sources");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import sources");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="csv_file" className="block text-sm font-medium text-gray-300 mb-2">
          CSV File
        </label>
        <input
          id="csv_file"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-500 file:text-white hover:file:bg-primary-600"
        />
        <p className="mt-2 text-xs text-gray-400">
          CSV must have columns: <code className="text-gray-300">url</code>,{" "}
          <code className="text-gray-300">name</code>,{" "}
          <code className="text-gray-300">industry_slug</code> (optional)
        </p>
      </div>

      {preview.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-2">Preview (first 5 rows)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {preview[0]?.map((header, i) => (
                    <th key={i} className="text-left py-2 px-3 text-gray-400">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(1).map((row, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {row.map((cell, j) => (
                      <td key={j} className="py-2 px-3 text-gray-300">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm">
          {success}
        </div>
      )}

      {importResult && importResult.errors && importResult.errors.length > 0 && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg text-yellow-400 text-sm">
          <p className="font-medium mb-2">Import completed with errors:</p>
          <ul className="list-disc list-inside space-y-1">
            {importResult.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end space-x-4 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 bg-white/5 border border-white/10 text-gray-300 font-semibold rounded-lg hover:bg-white/10 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleImport}
          disabled={loading || !file}
          className="px-6 py-3 bg-gradient-accent text-white font-semibold rounded-lg hover-lift hover-glow shadow-lg shadow-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Importing..." : "Import Sources"}
        </button>
      </div>
    </div>
  );
}

