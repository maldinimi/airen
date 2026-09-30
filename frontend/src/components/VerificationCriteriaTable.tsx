import type { ChecklistCriterion } from "../types";
import { CheckCircle2, XCircle } from "lucide-react";

interface VerificationCriteriaTableProps {
  criteria: ChecklistCriterion[];
  isEditable: boolean;
  onStatusChange: (criterionId: number, status: "Lolos" | "Ditolak") => void;
  onNotesChange: (criterionId: number, notes: string) => void;
}

export function VerificationCriteriaTable({ criteria, isEditable, onStatusChange, onNotesChange }: VerificationCriteriaTableProps) {
  return (
    <div className="border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto max-h-125 overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/95 dark:bg-slate-800/95 text-slate-800 dark:text-slate-200 uppercase font-black text-xs sticky top-0 z-10 border-b-2 border-slate-300 dark:border-slate-700">
            <tr>
              <th className="px-4 py-3.5 w-12 text-center">No</th>
              <th className="px-4 py-3.5 min-w-50">Kriteria Wajib RAB</th>
              <th className="px-4 py-3.5 w-28 text-center">Status AI</th>
              <th className="px-4 py-3.5 min-w-45">Catatan Bukti AI</th>
              <th className="px-4 py-3.5 min-w-37.5 text-center bg-cyan-100/60 dark:bg-cyan-950/60 border-l border-r border-cyan-200 dark:border-cyan-800">
                Kolom Verifikator
                <span className="block text-[10px] font-semibold text-cyan-700 dark:text-cyan-400 lowercase">(bisa diubah)</span>
              </th>
              <th className="px-4 py-3.5 min-w-47.5 bg-slate-100/80 dark:bg-slate-800/80">Catatan Evaluasi Verifikator</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {criteria.map((criterion) => {
              const isAiPassed = criterion.status === "passed";
              const isVerifierPassed = criterion.verifierStatus === "Lolos";
              const isOverridden = isAiPassed !== isVerifierPassed;

              return (
                <tr
                  key={criterion.id}
                  className={`hover:bg-sky-50/80 dark:hover:bg-slate-800/70 border-b border-slate-100 dark:border-slate-800/80 transition-colors ${
                    isOverridden ? "bg-amber-50/50 dark:bg-amber-950/20" : ""
                  }`}
                >
                  <td className="px-4 py-3.5 text-center font-mono text-slate-400 dark:text-slate-500 font-bold">{criterion.id}</td>
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">{criterion.text}</div>
                    {criterion.category && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[10px] font-mono border border-slate-200 dark:border-slate-700">
                        {criterion.category}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        isAiPassed
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                      }`}
                    >
                      {isAiPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {isAiPassed ? "Lolos" : "Ditolak"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{criterion.notes}</td>
                  <td className="px-4 py-3.5 text-center bg-cyan-50/20 dark:bg-cyan-950/20 border-l border-r border-cyan-100 dark:border-cyan-900/60">
                    {isEditable ? (
                      <div className="inline-flex p-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xs">
                        <button
                          type="button"
                          onClick={() => onStatusChange(criterion.id, "Lolos")}
                          className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            isVerifierPassed ? "bg-emerald-600 text-white shadow-xs" : "text-slate-500 hover:text-emerald-600"
                          }`}
                          title="Tetapkan Lolos untuk baris kriteria ini"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Lolos</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onStatusChange(criterion.id, "Ditolak")}
                          className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            !isVerifierPassed ? "bg-rose-600 text-white shadow-xs" : "text-slate-500 hover:text-rose-600"
                          }`}
                          title="Tetapkan Ditolak untuk baris kriteria ini"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Ditolak</span>
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isVerifierPassed
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200"
                            : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200"
                        }`}
                      >
                        {isVerifierPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {isVerifierPassed ? "Lolos" : "Ditolak"}
                      </span>
                    )}
                    {isOverridden && <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold mt-1">*Diubah dari AI</div>}
                  </td>
                  <td className="px-4 py-3.5 bg-slate-50/40 dark:bg-slate-800/30">
                    {isEditable ? (
                      <input
                        type="text"
                        value={criterion.verifierNotes}
                        onChange={(event) => onNotesChange(criterion.id, event.target.value)}
                        placeholder="Catatan evaluasi baris..."
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                      />
                    ) : (
                      <span className="text-xs text-slate-700 dark:text-slate-300 italic">{criterion.verifierNotes || "-"}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}