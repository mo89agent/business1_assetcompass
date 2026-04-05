import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FileText, Upload, Download, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Documents" };

const DEMO_DOCS = [
  { id: "d1", name: "Flatex Depotauszug Feb 2026.pdf", category: "STATEMENT", size: "245 KB", uploadedAt: "2026-03-01", account: "Flatex Depot" },
  { id: "d2", name: "DKB Kontoauszug Feb 2026.pdf", category: "STATEMENT", size: "128 KB", uploadedAt: "2026-03-01", account: "DKB Tagesgeld" },
  { id: "d3", name: "Grundbuchauszug Berliner Str 12.pdf", category: "PROPERTY_DOCUMENT", size: "1.2 MB", uploadedAt: "2025-09-12", account: "Berliner Str. 12" },
  { id: "d4", name: "Darlehensvertrag DKB Mortgage.pdf", category: "LOAN_CONTRACT", size: "890 KB", uploadedAt: "2021-03-15", account: "DKB Mortgage" },
  { id: "d5", name: "Steuerbescheid 2024.pdf", category: "TAX_DOCUMENT", size: "340 KB", uploadedAt: "2025-11-20", account: "—" },
  { id: "d6", name: "trade_republic_export_q1_2026.csv", category: "IMPORT_CSV", size: "48 KB", uploadedAt: "2026-03-15", account: "Trade Republic" },
];

const CAT_LABELS: Record<string, string> = {
  STATEMENT: "Statement",
  TAX_DOCUMENT: "Tax Document",
  LOAN_CONTRACT: "Loan Contract",
  PROPERTY_DOCUMENT: "Property Doc",
  IMPORT_CSV: "Import CSV",
  IMPORT_EVIDENCE: "Import Evidence",
  OTHER: "Other",
};

const CAT_COLORS: Record<string, string> = {
  STATEMENT: "bg-blue-50 text-blue-700",
  TAX_DOCUMENT: "bg-red-50 text-red-700",
  LOAN_CONTRACT: "bg-purple-50 text-purple-700",
  PROPERTY_DOCUMENT: "bg-orange-50 text-orange-700",
  IMPORT_CSV: "bg-emerald-50 text-emerald-700",
};

export default async function DocumentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Documents</h1>
          <p className="text-sm text-slate-500 mt-0.5">{DEMO_DOCS.length} files stored</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition">
          <Upload size={14} />
          Upload
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide">File</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide hidden md:table-cell">Category</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide hidden lg:table-cell">Account</th>
              <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide hidden md:table-cell">Size</th>
              <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide">Uploaded</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {DEMO_DOCS.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-slate-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-800 truncate max-w-xs">{doc.name}</span>
                  </div>
                </td>
                <td className="px-3 py-3 hidden md:table-cell">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${CAT_COLORS[doc.category] ?? "bg-slate-100 text-slate-600"}`}>
                    {CAT_LABELS[doc.category] ?? doc.category}
                  </span>
                </td>
                <td className="px-3 py-3 text-sm text-slate-500 hidden lg:table-cell">{doc.account}</td>
                <td className="px-3 py-3 text-sm text-slate-500 text-right hidden md:table-cell">{doc.size}</td>
                <td className="px-3 py-3 text-sm text-slate-500 text-right">{formatDate(doc.uploadedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600">
                      <Download size={14} />
                    </button>
                    <button className="p-1.5 hover:bg-red-50 rounded-lg transition text-slate-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
