import type { RegulationDocument } from "../types";
import { BookOpen, Calendar, Edit3, Eye, FileSpreadsheet, FileText, Trash2 } from "lucide-react";

interface RegulationCardListProps {
  regulations: RegulationDocument[];
  isEditable: boolean;
  onToggle: (regulationId: string) => void;
  onPreview: (regulation: RegulationDocument) => void;
  onEdit: (regulation: RegulationDocument) => void;
  onDelete: (regulationId: string) => void;
}

export function RegulationCardList({ regulations, isEditable, onToggle, onPreview, onEdit, onDelete }: RegulationCardListProps) {
  if (regulations.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-14 text-center text-slate-400 dark:text-slate-500 transition-colors">
        <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm font-bold">Belum ada dokumen peraturan yang cocok.</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Klik tombol "Unggah Peraturan Baru (PDF)" di atas untuk menambahkan berkas regulasi acuan.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {regulations.map((regulation) => (
        <article
          key={regulation.id}
          className={`min-w-0 bg-slate-50/60 dark:bg-slate-800/40 border rounded-2xl p-4 sm:p-6 shadow-xs transition-all ${
            regulation.isActive ? "border-emerald-300 dark:border-emerald-800/80 ring-1 ring-emerald-500/20" : "border-slate-200 dark:border-slate-800 opacity-80"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              <div
                className={`p-3.5 rounded-2xl shrink-0 ${
                  regulation.isActive
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                }`}
              >
                <FileText className="w-6 h-6" />
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="wrap-break-word text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{regulation.title}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                    {regulation.category}
                  </span>
                  {regulation.targetYear && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      TA {regulation.targetYear}
                    </span>
                  )}
                </div>

                {regulation.description && <p className="wrap-break-word text-xs text-slate-600 dark:text-slate-400 line-clamp-2 max-w-3xl leading-relaxed">{regulation.description}</p>}

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 dark:text-slate-500 font-mono pt-1">
                  <span className="flex min-w-0 items-start gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                    <span className="min-w-0 break-all">{regulation.fileName} ({regulation.fileSize})</span>
                  </span>
                  <span className="hidden sm:inline">&bull;</span>
                  <span className="flex min-w-0 items-start gap-1.5 wrap-break-word">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span className="min-w-0">Tanggal Dimasukkan: {regulation.dateInserted || regulation.uploadDate}</span>
                  </span>
                  <span className="hidden sm:inline">&bull;</span>
                  <span className="min-w-0 wrap-break-word">Pengunggah: {regulation.uploadedBy}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
              {isEditable ? (
                <button
                  type="button"
                  onClick={() => onToggle(regulation.id)}
                  className={`h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    regulation.isActive
                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-200"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:bg-slate-200"
                  }`}
                  title="Ubah status apakah dokumen ini aktif atau tidak digunakan oleh AI"
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${regulation.isActive ? "bg-emerald-500 ring-2 ring-emerald-300" : "bg-slate-400"}`} />
                  <span>{regulation.isActive ? "Aktif Digunakan AI" : "Tidak Aktif Digunakan AI"}</span>
                </button>
              ) : (
                <span
                  className={`h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 select-none ${
                    regulation.isActive
                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300"
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${regulation.isActive ? "bg-emerald-500 ring-2 ring-emerald-300" : "bg-slate-400"}`} />
                  <span>{regulation.isActive ? "Aktif Digunakan AI" : "Tidak Aktif"}</span>
                </span>
              )}

              <button
                type="button"
                onClick={() => onPreview(regulation)}
                className="h-9 px-3 bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-cyan-200 dark:border-cyan-800 shadow-2xs cursor-pointer"
                title="Pratinjau Dokumen PDF Regulasi (Read)"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Lihat PDF</span>
              </button>

              {isEditable && (
                <>
                  <button
                    type="button"
                    onClick={() => onEdit(regulation)}
                    className="h-9 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                    title="Edit Dokumen Regulasi (Update)"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Yakin ingin menghapus dokumen regulasi "${regulation.title}"?`)) onDelete(regulation.id);
                    }}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                    title="Hapus Dokumen Regulasi (Delete)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}