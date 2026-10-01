import React, { useState, useMemo, useEffect } from "react";
import { HierarchyItem, AccessPermission, UserAccount, ActiveMenuKey } from "../types";
import {
  Layers,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  FolderGit2,
  Building2,
  Info,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface MasterRoViewProps {
  permission: AccessPermission; // "E" or "V"
  currentUser: UserAccount | null;
  hierarchyData: HierarchyItem[];
  onAddMasterRo?: (item: HierarchyItem) => void;
  onUpdateMasterRo?: (item: HierarchyItem) => void;
  onDeleteMasterRo?: (itemId: string) => void;
  activeMenu?: ActiveMenuKey | string;
  onSelectMenu?: (menu: ActiveMenuKey) => void;
}

export const MasterRoView: React.FC<MasterRoViewProps> = ({
  permission,
  currentUser,
  hierarchyData,
  onAddMasterRo,
  onUpdateMasterRo,
  onDeleteMasterRo,
  activeMenu = "menu_master_ro",
  onSelectMenu,
}) => {
  const isEditable = permission === "E";

  // Sub-view: "catalog" vs "add" (halaman baru untuk tambah / ubah Master RO)
  const [currentSubView, setCurrentSubView] = useState<"catalog" | "add">((activeMenu as string) === "master_ro_add" ? "add" : "catalog");

  // Collapse states
  const [isStatsCollapsed, setIsStatsCollapsed] = useState(false);
  const [isCatalogCollapsed, setIsCatalogCollapsed] = useState(false);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgramFilter, setSelectedProgramFilter] = useState("all");
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState("all");

  // State for Add / Edit
  const [editingItem, setEditingItem] = useState<HierarchyItem | null>(null);

  // Form State
  const [formProgram, setFormProgram] = useState("");
  const [formUnitEselon1, setFormUnitEselon1] = useState("");
  const [formKegiatan, setFormKegiatan] = useState("");
  const [formUnitEselon2, setFormUnitEselon2] = useState("");
  const [formPrioritas, setFormPrioritas] = useState("Prioritas Nasional");
  const [formKro, setFormKro] = useState("");
  const [formRo, setFormRo] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Unique programs for filter dropdown
  const uniquePrograms = useMemo(() => {
    const set = new Set<string>();
    hierarchyData.forEach((item) => {
      if (item.program) set.add(item.program);
    });
    return Array.from(set);
  }, [hierarchyData]);

  // Dynamic statistics
  const totalItems = hierarchyData.length;
  const totalPrograms = uniquePrograms.length;
  const totalKegiatan = useMemo(() => {
    const set = new Set<string>();
    hierarchyData.forEach((item) => {
      if (item.kegiatan) set.add(item.kegiatan);
    });
    return set.size;
  }, [hierarchyData]);
  const totalKro = useMemo(() => {
    const set = new Set<string>();
    hierarchyData.forEach((item) => {
      if (item.kro) set.add(item.kro);
    });
    return set.size;
  }, [hierarchyData]);

  // Filtered List
  const filteredList = useMemo(() => {
    return hierarchyData.filter((item) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        item.program.toLowerCase().includes(q) ||
        item.kegiatan.toLowerCase().includes(q) ||
        item.kro.toLowerCase().includes(q) ||
        item.ro.toLowerCase().includes(q) ||
        item.unitEselon1.toLowerCase().includes(q) ||
        item.unitEselon2.toLowerCase().includes(q);

      const matchProgram = selectedProgramFilter === "all" || item.program === selectedProgramFilter;

      const matchPriority = selectedPriorityFilter === "all" || item.prioritasCheck.toLowerCase().includes(selectedPriorityFilter.toLowerCase());

      return matchSearch && matchProgram && matchPriority;
    });
  }, [hierarchyData, searchTerm, selectedProgramFilter, selectedPriorityFilter]);

  // Pagination State for Section 2 (10 items per page)
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reset to page 1 whenever search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedProgramFilter, selectedPriorityFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / ITEMS_PER_PAGE));

  // Current page items (10 per page)
  const paginatedList = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredList, currentPage]);

  // Helper for smart page numbering with ellipsis
  const getPageNumbers = (current: number, total: number): (number | string)[] => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    if (current <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", total);
    } else if (current >= total - 3) {
      pages.push(1, "...", total - 4, total - 3, total - 2, total - 1, total);
    } else {
      pages.push(1, "...", current - 1, current, current + 1, "...", total);
    }
    return pages;
  };

  // Sync currentSubView when switching menus from sidebar
  useEffect(() => {
    setCurrentSubView("catalog");
  }, [activeMenu]);

  // Open Add Page (Halaman Baru)
  const handleOpenAddPage = () => {
    setEditingItem(null);
    setFormProgram(uniquePrograms[0] || "");
    setFormUnitEselon1("01-Sekretariat Jenderal");
    setFormKegiatan("");
    setFormUnitEselon2("");
    setFormPrioritas("Prioritas Nasional");
    setFormKro("");
    setFormRo("");
    setFormError(null);
    setCurrentSubView("add");
  };

  // Open Edit Page (Halaman Baru)
  const handleOpenEditPage = (item: HierarchyItem) => {
    setEditingItem(item);
    setFormProgram(item.program);
    setFormUnitEselon1(item.unitEselon1);
    setFormKegiatan(item.kegiatan);
    setFormUnitEselon2(item.unitEselon2);
    setFormPrioritas(item.prioritasCheck);
    setFormKro(item.kro);
    setFormRo(item.ro);
    setFormError(null);
    setCurrentSubView("add");
  };

  // Close Add / Edit Page and return to Catalog
  const handleCloseAddPage = () => {
    setEditingItem(null);
    setFormError(null);
    setCurrentSubView("catalog");
  };

  // Submit Modal / Page Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProgram.trim() || !formKegiatan.trim() || !formKro.trim() || !formRo.trim()) {
      setFormError("Harap lengkapi semua field Program, Kegiatan, KRO, dan RO.");
      return;
    }

    if (editingItem && onUpdateMasterRo) {
      onUpdateMasterRo({
        id: editingItem.id,
        program: formProgram.trim(),
        unitEselon1: formUnitEselon1.trim(),
        kegiatan: formKegiatan.trim(),
        unitEselon2: formUnitEselon2.trim(),
        prioritasCheck: formPrioritas,
        kro: formKro.trim(),
        ro: formRo.trim(),
      });
    } else if (onAddMasterRo) {
      onAddMasterRo({
        id: `ro_${Date.now()}`,
        program: formProgram.trim(),
        unitEselon1: formUnitEselon1.trim(),
        kegiatan: formKegiatan.trim(),
        unitEselon2: formUnitEselon2.trim(),
        prioritasCheck: formPrioritas,
        kro: formKro.trim(),
        ro: formRo.trim(),
      });
    }

    handleCloseAddPage();
  };

  // Handle Delete
  const handleDeleteItem = (id?: string) => {
    if (!id) return;
    if (onDeleteMasterRo) {
      onDeleteMasterRo(id);
    }
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {currentSubView === "add" ? (
        /* ============================================================ */
        /* HALAMAN FORMULIR TAMBAH / UBAH MASTER RO BARU                */
        /* ============================================================ */
        <div className="space-y-6 sm:space-y-8 animate-fadeIn">
          {/* Top Indicator */}
          <div className="flex items-center justify-end">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>{editingItem ? "Halaman Ubah Data Master RO" : "Halaman Tambah Master RO Baru"}</span>
            </span>
          </div>

          {!isEditable ? (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 flex items-start gap-3.5 text-amber-900 dark:text-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <strong className="block font-bold">Akses Dibatasi (View Only)</strong>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Anda sedang menggunakan akun dengan hak akses Lihat Saja (V). Menambah atau memodifikasi Master RO hanya dapat dilakukan oleh Super Admin atau Tim Perencana (ROCAN).
                </p>
                <button
                  type="button"
                  onClick={handleCloseAddPage}
                  className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 rounded-xl font-bold cursor-pointer hover:bg-amber-100"
                >
                  &larr; Lihat Katalog Master RO
                </button>
              </div>
            </div>
          ) : (
            <div className="relative bg-white dark:bg-slate-900 border-2 border-cyan-500 dark:border-cyan-500 rounded-2xl p-6 sm:p-8 pt-8 sm:pt-9 shadow-sm transition-all space-y-6 sm:space-y-7">
              {/* Outline Label Badge */}
              <div className="absolute -top-3.5 left-5 sm:left-6 z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border bg-cyan-600 text-white border-cyan-400 select-none">
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>{editingItem ? "FORMULIR • UBAH DATA MASTER RO" : "FORMULIR • TAMBAH MASTER RO BARU"}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
                    <FolderGit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{editingItem ? "Ubah Data Master RO" : "Tambah Master RO Baru"}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Masukkan nomenklatur Program, Kegiatan, KRO, dan RO resmi.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                    Total Terdaftar: {hierarchyData.length} Master RO
                  </span>
                </div>
              </div>

              {formError && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitForm} className="space-y-5">
                {/* Program */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Program <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formProgram}
                    onChange={(e) => setFormProgram(e.target.value)}
                    placeholder="Contoh: 059.GH-Program Komunikasi Publik dan Media"
                    className="w-full px-4 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                {/* Unit Eselon I & Unit Eselon II */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Unit Eselon I</label>
                    <input
                      type="text"
                      value={formUnitEselon1}
                      onChange={(e) => setFormUnitEselon1(e.target.value)}
                      placeholder="Contoh: 01-Sekretariat Jenderal"
                      className="w-full px-4 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Unit Eselon II</label>
                    <input
                      type="text"
                      value={formUnitEselon2}
                      onChange={(e) => setFormUnitEselon2(e.target.value)}
                      placeholder="Contoh: 10-Biro Perencanaan & Keuangan"
                      className="w-full px-4 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* Kegiatan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Kegiatan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formKegiatan}
                    onChange={(e) => setFormKegiatan(e.target.value)}
                    placeholder="Contoh: 4511-Implementasi Undang-Undang KIP"
                    className="w-full px-4 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                {/* KRO & Status Prioritas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Klasifikasi Rincian Output (KRO) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formKro}
                      onChange={(e) => setFormKro(e.target.value)}
                      placeholder="Contoh: PBM-Kebijakan Bidang Pelayanan Publik"
                      className="w-full px-4 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Status Prioritas</label>
                    <select
                      value={formPrioritas}
                      onChange={(e) => setFormPrioritas(e.target.value)}
                      className="w-full px-4 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                    >
                      <option value="Prioritas Nasional">Prioritas Nasional</option>
                      <option value="Bukan Prioritas Nasional">Bukan Prioritas Nasional</option>
                    </select>
                  </div>
                </div>

                {/* Rincian Output (RO) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Rincian Output (RO) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formRo}
                    onChange={(e) => setFormRo(e.target.value)}
                    placeholder="Contoh: 001-Rekomendasi Hasil Survey KIP"
                    className="w-full px-4 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                {/* Form Buttons */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleCloseAddPage}
                    className="h-10 px-5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                  <button type="submit" className="h-10 px-6 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30 cursor-pointer transition-all">
                    {editingItem ? "Simpan Perubahan" : "Tambahkan Data"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : (
        /* ============================================================ */
        /* KATALOG & STATISTIK MASTER RO                               */
        /* ============================================================ */
        <div className="space-y-8 animate-fadeIn">
          {/* ========================================================================= */}
          {/* VIEW ONLY BANNER (FOR SATKER) */}
          {/* ========================================================================= */}
          {!isEditable && (
            <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-2xl p-4.5 flex items-start gap-3.5 text-sky-900 dark:text-sky-200 shadow-2xs">
              <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-bold uppercase tracking-wider block text-[11px] text-sky-800 dark:text-sky-300">Mode Akses: Hanya Lihat (View Only)</span>
                <p className="mt-0.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                  Sesuai peran <strong>Satker</strong>, Anda memiliki hak akses <strong>View (V)</strong> untuk meninjau katalog Master RO, Program, Kegiatan, dan KRO resmi Kementerian Komunikasi dan
                  Digital sebagai panduan pengisian formulir RAB. Modifikasi dan penambahan Master RO hanya dapat dilakukan oleh <strong>Super Admin</strong> dan <strong>ROCAN (verif)</strong>.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 1. PEMBAHASAN 1 • RINGKASAN STATISTIK MASTER RO */}
          {/* ========================================================================= */}
          <div className="relative bg-white dark:bg-slate-900 border-2 border-cyan-500 dark:border-cyan-500 rounded-2xl p-6 sm:p-8 pt-8 sm:pt-9 shadow-sm transition-all space-y-6">
            <div className="absolute -top-3.5 left-5 sm:left-6 z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border bg-cyan-600 text-white border-cyan-400 select-none">
              <Layers className="w-3.5 h-3.5" />
              <span>PEMBAHASAN 1 &bull; STATISTIK MASTER DATA RO</span>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">1. Ringkasan Parameter Master Rincian Output (RO)</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isEditable ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"}`}
                >
                  {isEditable ? "Hak Akses: Edit (E)" : "Hak Akses: View (V)"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsStatsCollapsed(!isStatsCollapsed)}
                className="h-8 px-3 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              >
                <span>{isStatsCollapsed ? "Perluas" : "Minimize"}</span>
                {isStatsCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {!isStatsCollapsed && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 animate-fadeIn">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium uppercase tracking-wide">Total Master RO</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">{totalItems}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium uppercase tracking-wide">Program Terdaftar</span>
                  <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono mt-1 block">{totalPrograms}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium uppercase tracking-wide">Total Kegiatan</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">{totalKegiatan}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium uppercase tracking-wide">Klasifikasi KRO</span>
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1 block">{totalKro}</span>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 2. PEMBAHASAN 2 • KATALOG & INPUT MASTER RO */}
          {/* ========================================================================= */}
          <div className="relative bg-white dark:bg-slate-900 border-2 border-cyan-500 dark:border-cyan-500 rounded-2xl p-6 sm:p-8 pt-8 sm:pt-9 shadow-sm transition-all space-y-6">
            <div className="absolute -top-3.5 left-5 sm:left-6 z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border bg-cyan-600 text-white border-cyan-400 select-none">
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>PEMBAHASAN 2 &bull; KATALOG &amp; INPUT MASTER RO</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>2. Katalog Parameter Master Rincian Output (RO)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hierarki anggaran APBN Kementerian Komdigi: Program &bull; Unit Eselon &bull; Kegiatan &bull; KRO &bull; RO.</p>
              </div>

              <div className="flex items-center gap-2.5">
                {isEditable && (
                  <button
                    type="button"
                    id="btn-add-master-ro"
                    onClick={handleOpenAddPage}
                    className="h-10 px-4 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-cyan-600/30 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Master RO</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsCatalogCollapsed(!isCatalogCollapsed)}
                  className="h-10 px-3 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                >
                  <span>{isCatalogCollapsed ? "Perluas" : "Minimize"}</span>
                  {isCatalogCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isCatalogCollapsed && (
              <div className="space-y-5 animate-fadeIn">
                {/* Search & Filter Bar */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Cari Program, Kegiatan, KRO, atau RO..."
                      className="w-full pl-9 pr-4 h-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 shadow-2xs"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Program:</span>
                      <select
                        value={selectedProgramFilter}
                        onChange={(e) => setSelectedProgramFilter(e.target.value)}
                        className="h-10 px-3 max-w-[200px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500 shadow-2xs truncate cursor-pointer"
                      >
                        <option value="all">Semua Program</option>
                        {uniquePrograms.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Prioritas:</span>
                      <select
                        value={selectedPriorityFilter}
                        onChange={(e) => setSelectedPriorityFilter(e.target.value)}
                        className="h-10 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500 shadow-2xs cursor-pointer"
                      >
                        <option value="all">Semua Prioritas</option>
                        <option value="Prioritas Nasional">Prioritas Nasional</option>
                        <option value="Bukan Prioritas">Bukan Prioritas</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Master RO Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3.5 w-12 text-center">No</th>
                        <th className="px-4 py-3.5 min-w-[220px]">Program &bull; Eselon I</th>
                        <th className="px-4 py-3.5 min-w-[220px]">Kegiatan &bull; Eselon II</th>
                        <th className="px-4 py-3.5 min-w-[200px]">Klasifikasi KRO</th>
                        <th className="px-4 py-3.5 min-w-[220px]">Rincian Output (RO)</th>
                        <th className="px-4 py-3.5 w-32 text-center">Prioritas</th>
                        {isEditable && <th className="px-4 py-3.5 w-24 text-center">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                      {filteredList.length === 0 ? (
                        <tr>
                          <td colSpan={isEditable ? 7 : 6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                            <Layers className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                            <span className="text-xs">Tidak ada data Master RO yang cocok dengan pencarian/filter.</span>
                          </td>
                        </tr>
                      ) : (
                        paginatedList.map((item, idx) => {
                          const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                          return (
                            <tr key={item.id || `${item.program}_${item.kro}_${item.ro}_${globalIndex}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="px-4 py-3 text-center font-mono font-medium text-slate-400">{globalIndex}</td>
                              <td className="px-4 py-3">
                                <div className="font-bold text-slate-800 dark:text-slate-200 leading-snug">{item.program}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                  <Building2 className="w-3 h-3 text-cyan-600" />
                                  <span>{item.unitEselon1}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium text-slate-700 dark:text-slate-300 leading-snug">{item.kegiatan}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">Unit: {item.unitEselon2}</div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-semibold text-cyan-700 dark:text-cyan-400 block leading-snug">{item.kro}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-bold text-slate-900 dark:text-white block leading-snug">{item.ro}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    item.prioritasCheck.toLowerCase().includes("prioritas nasional") && !item.prioritasCheck.toLowerCase().includes("bukan")
                                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                  }`}
                                >
                                  {item.prioritasCheck}
                                </span>
                              </td>
                              {isEditable && (
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditPage(item)}
                                      className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 rounded-lg transition-colors cursor-pointer"
                                      title="Edit Master RO"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteConfirmId(item.id || `${globalIndex}`)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                                      title="Hapus Master RO"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls per 10 nomor */}
                {filteredList.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
                    {/* Range summary: e.g. Menampilkan 1 - 10 dari 161 total baris Master RO */}
                    <div className="text-slate-500 dark:text-slate-400 font-medium">
                      Menampilkan <span className="font-bold text-slate-800 dark:text-slate-200">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> -{" "}
                      <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(currentPage * ITEMS_PER_PAGE, filteredList.length)}</span> dari{" "}
                      <span className="font-bold text-slate-800 dark:text-slate-200">{filteredList.length}</span> total baris Master RO
                      <span className="ml-2 font-mono text-[11px] text-cyan-700 dark:text-cyan-400 font-semibold">
                        (Halaman {currentPage} dari {totalPages})
                      </span>
                    </div>

                    {/* Page Navigation Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap justify-center">
                      {/* First Page */}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                        title="Halaman Pertama (1 - 10)"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>

                      {/* Previous Page */}
                      <button
                        type="button"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs font-semibold flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Sebelumnya</span>
                      </button>

                      {/* Page Numbers */}
                      {getPageNumbers(currentPage, totalPages).map((p, i) =>
                        typeof p === "number" ? (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setCurrentPage(p)}
                            className={`min-w-[34px] h-[34px] rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              currentPage === p
                                ? "bg-cyan-600 text-white shadow-sm shadow-cyan-600/30 border border-cyan-600"
                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-2xs"
                            }`}
                            title={`Halaman ${p} (Nomor ${(p - 1) * ITEMS_PER_PAGE + 1} - ${Math.min(p * ITEMS_PER_PAGE, filteredList.length)})`}
                          >
                            {p}
                          </button>
                        ) : (
                          <span key={`dots-${i}`} className="px-1 text-slate-400 font-mono">
                            ...
                          </span>
                        ),
                      )}

                      {/* Next Page */}
                      <button
                        type="button"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs font-semibold flex items-center gap-1"
                      >
                        <span className="hidden sm:inline">Berikutnya</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {/* Last Page */}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                        title={`Halaman Terakhir (${totalPages})`}
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl animate-scaleUp">
            <div className="text-rose-600 mb-2">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Hapus Data Master RO?</h4>
            <p className="text-xs text-slate-500 mt-1">Data Master RO ini akan dihapus dari daftar hierarki rujukan sistem.</p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button type="button" onClick={() => handleDeleteItem(deleteConfirmId)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
