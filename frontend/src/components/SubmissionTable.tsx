import type { SubmissionData } from "../types";
import { CheckCircle2, Clock, ExternalLink, Eye, FileSpreadsheet, History, Pencil, Trash2, XCircle } from "lucide-react";

interface SubmissionTableProps {
  submissions: SubmissionData[];
  isReadOnly: boolean;
  onOpenCrudHistory: (submission: SubmissionData) => void;
  onOpenReviewHistory: (submission: SubmissionData) => void;
  onOpenDetails: (submission: SubmissionData) => void;
  onPreview: (submission: SubmissionData) => void;
  onEdit: (submission: SubmissionData) => void;
  onDelete: (submission: SubmissionData) => void;
}

const statusStyles: Record<SubmissionData["verificationStatus"], { badge: string; icon: string }> = {
  Menunggu: {
    badge: "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60",
    icon: "text-amber-600",
  },
  Diterima: {
    badge: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60",
    icon: "text-emerald-600",
  },
  Ditolak: {
    badge: "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60",
    icon: "text-rose-600",
  },
};

export function SubmissionTable({
  submissions,
  isReadOnly,
  onOpenCrudHistory,
  onOpenReviewHistory,
  onOpenDetails,
  onPreview,
  onEdit,
  onDelete,
}: SubmissionTableProps) {
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/95 dark:bg-slate-800/95 border-b-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 uppercase font-black tracking-wider text-xs">
            <tr>
              <th className="px-4 py-4 w-12 text-center">No</th>
              <th className="px-4 py-4 w-44">Kode</th>
              <th className="px-4 py-4 w-36">Tanggal</th>
              <th className="px-4 py-4">Dokumen PDF RAB &amp; Kategori</th>
              <th className="px-4 py-4">Hierarki Anggaran RKA-K/L</th>
              <th className="px-4 py-4 w-48">User Logging (Create &amp; Update)</th>
              <th className="px-4 py-4 w-28 text-center">Hasil AI</th>
              <th className="px-4 py-4 w-44">Status Verifikasi</th>
              <th className="px-4 py-4 w-44 text-center">Aksi (CRUD)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-14 text-slate-400 dark:text-slate-500">
                  <FileSpreadsheet className="w-9 h-9 mx-auto mb-2.5 opacity-50" />
                  <p className="font-bold text-xs">Tidak ada dokumen PDF RAB yang sesuai dengan filter.</p>
                  <p className="text-[11px] mt-1 text-slate-400">Silakan sesuaikan parameter pencarian atau gunakan menu "Form Pengajuan RAB Baru".</p>
                </td>
              </tr>
            ) : (
              submissions.map((submission, index) => {
                const creator = submission.createdBy || `${submission.satkerUserName} (${submission.satkerUserId})`;
                const updater = submission.updatedBy || creator;
                const isAccepted = submission.verificationStatus === "Diterima";
                const StatusIcon = submission.verificationStatus === "Menunggu" ? Clock : isAccepted ? CheckCircle2 : XCircle;
                const statusStyle = statusStyles[submission.verificationStatus];

                return (
                  <tr key={submission.id} className="hover:bg-sky-50/80 dark:hover:bg-slate-800/70 border-b border-slate-100 dark:border-slate-800/80 transition-colors">
                    <td className="px-4 py-4 text-center font-mono font-medium text-slate-400">{index + 1}</td>
                    <td className="px-4 py-4">
                      <span className="font-mono font-bold text-cyan-700 dark:text-cyan-400 block text-xs whitespace-nowrap">{submission.ticketNumber}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-medium block whitespace-nowrap">{submission.submittedAt}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200 dark:border-rose-900 shrink-0 mt-0.5">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 dark:text-white block truncate max-w-xs" title={submission.rabFileName}>
                            {submission.rabFileName}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">{submission.rabFileSize || "2.1 MB"} &bull; Format PDF</span>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {(submission.kategori || submission.kategori1) && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                                {submission.kategori || submission.kategori1}
                              </span>
                            )}
                            {submission.deskripsi && (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 italic block truncate max-w-50" title={submission.deskripsi}>
                                &bull; {submission.deskripsi}
                              </span>
                            )}
                            {submission.kategori2 && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {submission.kategori2}
                              </span>
                            )}
                            {submission.kategori3 && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                {submission.kategori3}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-slate-900 dark:text-slate-200 block truncate max-w-xs" title={submission.kegiatan}>{submission.kegiatan}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate max-w-xs mt-0.5">{submission.kro} &bull; {submission.ro}</span>
                      {submission.tahunAnggaran && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          TA {submission.tahunAnggaran}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="text-[11px] text-slate-600 dark:text-slate-400">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">Created: </span>
                          <span className="truncate block" title={creator}>{creator}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">Updated: </span>
                          <span className="truncate block" title={updater}>{updater}</span>
                        </div>
                        <button type="button" onClick={() => onOpenCrudHistory(submission)} className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer pt-0.5">
                          <History className="w-3 h-3" />
                          <span>Lihat History CRUD PDF</span>
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${submission.aiStatus === "LOLOS" ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" : "bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"}`}>
                        {submission.aiStatus === "LOLOS" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {submission.aiScore}%
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => onOpenReviewHistory(submission)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shadow-2xs hover:shadow-md hover:scale-105 cursor-pointer group ${statusStyle.badge}`}
                        title={`Klik untuk melihat Histori Reviu (Status: ${submission.verificationStatus})`}
                      >
                        <StatusIcon className={`w-3.5 h-3.5 ${statusStyle.icon}`} />
                        <span>{submission.verificationStatus}</span>
                        <History className="w-3 h-3 opacity-70" />
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button type="button" onClick={() => onOpenDetails(submission)} className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700" title="Read: Lihat Detail Lengkap">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => onPreview(submission)} className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 transition-colors cursor-pointer border border-cyan-200 dark:border-cyan-800" title="Read: Pratinjau Dokumen PDF Asli">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        {!isReadOnly && (
                          <>
                            <button type="button" onClick={() => onEdit(submission)} className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 transition-colors cursor-pointer border border-amber-200 dark:border-amber-800" title="Update: Edit Nama & Kategori Berkas">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" onClick={() => onDelete(submission)} className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800" title="Delete: Hapus Dokumen dari Daftar">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}