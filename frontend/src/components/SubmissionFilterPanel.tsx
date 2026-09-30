import type { SubmissionFilters } from "../utils/submissionUtils";
import { Filter, Search } from "lucide-react";

interface SubmissionFilterPanelProps {
  filters: SubmissionFilters;
  resultCount: number;
  totalCount: number;
  onChange: <Key extends keyof SubmissionFilters>(key: Key, value: SubmissionFilters[Key]) => void;
  onReset: () => void;
  onApply: () => void;
}

export function SubmissionFilterPanel({ filters, resultCount, totalCount, onChange, onReset, onApply }: SubmissionFilterPanelProps) {
  return (
    <div className="p-5 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
          <Filter className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>Form Filter Pencarian Dokumen RAB</span>
        </div>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">5 Parameter Penapisan</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
            1. Jenis Dokumen <span className="text-slate-400 font-normal lowercase">(teks)</span>
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="filter-jenis-dokumen"
              type="text"
              value={filters.jenisDokumen}
              onChange={(event) => onChange("jenisDokumen", event.target.value)}
              placeholder="Cari jenis dokumen / nama berkas..."
              className="w-full pl-9 pr-3 h-10 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-2xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">2. Status Verifikasi</label>
          <select
            id="filter-status-dropdown"
            value={filters.status}
            onChange={(event) => onChange("status", event.target.value as SubmissionFilters["status"])}
            className="w-full h-10 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium shadow-2xs cursor-pointer"
          >
            <option value="all">Semua Status Penetapan</option>
            <option value="Menunggu">Menunggu</option>
            <option value="Diterima">Diterima</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">3. Tahun Anggaran</label>
          <select
            id="filter-tahun-dropdown"
            value={filters.tahun}
            onChange={(event) => onChange("tahun", event.target.value)}
            className="w-full h-10 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium shadow-2xs cursor-pointer"
          >
            <option value="all">Semua Tahun Anggaran</option>
            <option value="2026">Tahun Anggaran 2026</option>
            <option value="2025">Tahun Anggaran 2025</option>
            <option value="2024">Tahun Anggaran 2024</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">4. Tanggal Pengajuan (Mulai - Akhir)</label>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              id="filter-date-start"
              value={filters.startDate}
              onChange={(event) => onChange("startDate", event.target.value)}
              title="Pilih Tanggal Mulai"
              aria-label="Tanggal Mulai"
              className="w-full h-10 px-2 sm:px-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium shadow-2xs cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 shrink-0">s/d</span>
            <input
              type="date"
              id="filter-date-end"
              value={filters.endDate}
              onChange={(event) => onChange("endDate", event.target.value)}
              title="Pilih Tanggal Akhir"
              aria-label="Tanggal Akhir"
              className="w-full h-10 px-2 sm:px-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium shadow-2xs cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Menampilkan <strong className="text-slate-900 dark:text-white font-bold">{resultCount}</strong> dari {totalCount} dokumen
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onReset} className="h-10 px-4 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
            Reset Filter
          </button>
          <button id="btn-apply-filter" type="button" onClick={onApply} className="h-10 px-6 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer ring-1 ring-cyan-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Apply Filter</span>
          </button>
        </div>
      </div>
    </div>
  );
}