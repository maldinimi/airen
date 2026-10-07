import React, { useState, useEffect } from "react";
import { UserAccount, SubmissionData, ChecklistCriterion, ActiveMenuKey, MasterCriterion, RegulationDocument, AccessPermission, VerificationHistoryEntry } from "../types";
import { INITIAL_MASTER_CRITERIA } from "../data/defaultCriteria";
import {
  CheckCircle2,
  XCircle,
  Eye,
  ShieldCheck,
  Award,
  Save,
  Search,
  FileSpreadsheet,
  AlertTriangle,
  Sparkles,
  Scale,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Pencil,
  Trash2,
  ArrowLeft,
  Check,
  Sliders,
  X,
  Info,
  Clock,
} from "lucide-react";
import { PdfPreviewModal } from "./PdfPreviewModal";
import { VerificationCriteriaTable } from "./VerificationCriteriaTable";
import { formatIndonesianDateTime } from "../utils/formatUtils";

interface VerifikatorViewProps {
  currentUser: UserAccount;
  onUpdateSubmission: (updated: SubmissionData) => void;
  reviewDetailSnapshot?: SubmissionData;
  showFinalDecision?: boolean;
  allowHistoricalStatusEdit?: boolean;
  onHistoricalReviewChange?: (review: {
    verificationStatus: "Diterima" | "Ditolak" | "Menunggu";
    verifikatorNotes: string;
    criteriaResults: ChecklistCriterion[];
  }) => void;
  activeMenu?: ActiveMenuKey;
  permission?: AccessPermission;
  regulations?: RegulationDocument[];
}

export const VerifikatorView: React.FC<VerifikatorViewProps> = ({
  currentUser,
  onUpdateSubmission,
  reviewDetailSnapshot,
  showFinalDecision = true,
  allowHistoricalStatusEdit = false,
  onHistoricalReviewChange,
  activeMenu = "menu_checklist",
  permission = "E",
  regulations = [],
}) => {
  const isEditable = permission === "E";
  // Master checklist selalu mendukung aksi CRUD penuh (Create, Read, Update, Delete)
  const canManageChecklist = true;

  const [previewOpen, setPreviewOpen] = useState(false);

  // Section Minimize States
  const [isUnifiedSectionCollapsed, setIsUnifiedSectionCollapsed] = useState(false);

  const selectedSubmission = reviewDetailSnapshot || null;
  const isCombinedReviewDetail = Boolean(reviewDetailSnapshot && showFinalDecision);
  const isHistoricalReviewLocked = Boolean(
    allowHistoricalStatusEdit &&
      selectedSubmission &&
      selectedSubmission.verificationStatus.trim().toLowerCase() !== "menunggu",
  );
  const canEditHistoricalReview = allowHistoricalStatusEdit && !isHistoricalReviewLocked;
  const canEditDecision = isEditable || canEditHistoricalReview;

  // Verifier Inputs for current selected item
  const [currentDecision, setCurrentDecision] = useState<"Diterima" | "Ditolak" | "Menunggu">(selectedSubmission?.verificationStatus || "Menunggu");
  const [currentNotes, setCurrentNotes] = useState<string>(selectedSubmission?.verifikatorNotes || "");
  const [editableCriteria, setEditableCriteria] = useState<ChecklistCriterion[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [criteriaSaveSuccess, setCriteriaSaveSuccess] = useState(false);

  // Sync state when selected submission changes
  useEffect(() => {
    if (selectedSubmission) {
      setCurrentDecision(selectedSubmission.verificationStatus);
      setCurrentNotes(selectedSubmission.verifikatorNotes || "");
      const cList = Array.isArray(selectedSubmission?.criteriaResults) ? selectedSubmission.criteriaResults : [];
      setEditableCriteria(
        cList.map((c) => ({
          ...c,
          verifierStatus: c.verifierStatus || (c.status === "passed" ? "Lolos" : "Ditolak"),
          verifierNotes: c.verifierNotes || "",
        })),
      );
      setSaveSuccess(false);
    }
  }, [selectedSubmission]);

  const handleRowStatusChange = (criterionId: number, newStatus: "Lolos" | "Ditolak") => {
    if (isHistoricalReviewLocked) return;
    const updatedCriteria = editableCriteria.map((item) => (item.id === criterionId ? { ...item, verifierStatus: newStatus } : item));
    setEditableCriteria(updatedCriteria);
    setCriteriaSaveSuccess(false);
  };

  const handleRowNotesChange = (criterionId: number, notes: string) => {
    if (isHistoricalReviewLocked) return;
    const updatedCriteria = editableCriteria.map((item) => (item.id === criterionId ? { ...item, verifierNotes: notes } : item));
    setEditableCriteria(updatedCriteria);
    setCriteriaSaveSuccess(false);
  };

  const handleSaveHistoricalReview = () => {
    if (!selectedSubmission || !canEditHistoricalReview || !onHistoricalReviewChange) return;

    onHistoricalReviewChange({
      verificationStatus: currentDecision,
      verifikatorNotes: currentNotes,
      criteriaResults: editableCriteria.map((criterion) => ({ ...criterion })),
    });
    setCriteriaSaveSuccess(true);
  };

  const handleSaveDecision = () => {
    if (!selectedSubmission) return;

    const verifiedAt = formatIndonesianDateTime();
    const previousHistory: VerificationHistoryEntry[] = selectedSubmission.reviewHistory?.length
      ? selectedSubmission.reviewHistory
      : selectedSubmission.verifiedAt && selectedSubmission.verificationStatus !== "Menunggu"
        ? [{
            verifiedAt: selectedSubmission.verifiedAt,
            verificationStatus: selectedSubmission.verificationStatus,
            verifiedBy: selectedSubmission.verifiedBy,
            verifiedByNip: selectedSubmission.verifiedByNip,
            verifikatorNotes: selectedSubmission.verifikatorNotes,
            aiStatus: selectedSubmission.aiStatus,
            aiScore: selectedSubmission.aiScore,
            aiReason: selectedSubmission.aiReason,
            aiRecommendation: selectedSubmission.aiRecommendation,
            criteriaResults: selectedSubmission.criteriaResults.map((criterion) => ({ ...criterion })),
          }]
        : [];

    const reviewSnapshot: VerificationHistoryEntry = {
      verifiedAt,
      verificationStatus: currentDecision === "Menunggu" ? "Ditolak" : currentDecision,
      rabFileName: selectedSubmission.rabFileName,
      verifiedBy: currentUser.name,
      verifiedByNip: currentUser.id,
      verifikatorNotes: currentNotes,
      aiStatus: selectedSubmission.aiStatus,
      aiScore: selectedSubmission.aiScore,
      aiReason: selectedSubmission.aiReason,
      aiRecommendation: selectedSubmission.aiRecommendation,
      criteriaResults: editableCriteria.map((criterion) => ({ ...criterion })),
    };

    const updated: SubmissionData = {
      ...selectedSubmission,
      criteriaResults: editableCriteria,
      verificationStatus: currentDecision,
      verifikatorNotes: currentNotes,
      verifiedBy: currentUser.name,
      verifiedByNip: currentUser.id,
      verifiedAt,
      reviewHistory: currentDecision === "Menunggu"
        ? previousHistory
        : [...previousHistory, { ...reviewSnapshot, verificationStatus: currentDecision }],
    };

    onUpdateSubmission(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const totalRows = editableCriteria.length > 0 ? editableCriteria.length : 20;
  const aiPassedRows = editableCriteria.length > 0
    ? editableCriteria.filter((c) => c.status === "passed").length
    : (selectedSubmission?.aiScore !== undefined ? Math.round((selectedSubmission.aiScore / 100) * totalRows) : (selectedSubmission?.aiStatus === "LOLOS" ? 20 : 0));
  const verifierPassedRows = editableCriteria.filter((c) => c.verifierStatus === "Lolos").length;
  const verifierRejectedRows = editableCriteria.filter((c) => c.verifierStatus === "Ditolak").length;

  // -------------------------------------------------------------
  // MASTER CHECKLIST STATES (activeMenu === "verifikator_checklist")
  // -------------------------------------------------------------
  const [checklistCriteria, setChecklistCriteria] = useState<MasterCriterion[]>(() => {
    const saved = localStorage.getItem("rab_app_master_criteria");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Re-index otomatis dari 1..N agar urutan nomor selalu rapi dan kontinu
          return parsed.map((c: MasterCriterion, idx: number) => ({
            ...c,
            id: idx + 1,
          }));
        }
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_MASTER_CRITERIA.map((c, idx) => ({
      ...c,
      id: idx + 1,
    }));
  });

  useEffect(() => {
    try {
      localStorage.setItem("rab_app_master_criteria", JSON.stringify(checklistCriteria));
    } catch (e) {
      console.warn("Could not sync master criteria to localStorage:", e);
    }
  }, [checklistCriteria]);

  // Sub-view: "table" (Tabel Checklist) or "form" (Halaman Input/Edit Checklist) or "detail" (Halaman Detail Kriteria)
  const [checklistSubView, setChecklistSubView] = useState<"table" | "form" | "detail">("table");
  const [checklistSearch, setChecklistSearch] = useState("");

  const nextCriterionNo = checklistCriteria.length + 1;
  const [inputKriteriaText, setInputKriteriaText] = useState("");
  const [inputDeskripsiText, setInputDeskripsiText] = useState("");
  const [formChecklistError, setFormChecklistError] = useState<string | null>(null);
  const [checklistSavedBanner, setChecklistSavedBanner] = useState<string | null>(null);

  // CRUD States for Master Criteria
  const [viewCriterion, setViewCriterion] = useState<MasterCriterion | null>(null);
  const [editCriterion, setEditCriterion] = useState<MasterCriterion | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<MasterCriterion | null>(null);

  // Buka Halaman Tambah Baru (Halaman Baru)
  const handleOpenAdd = () => {
    setEditCriterion(null);
    setInputKriteriaText("");
    setInputDeskripsiText("");
    setFormChecklistError(null);
    setChecklistSubView("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Buka Halaman Edit (Halaman Baru)
  const handleOpenEdit = (criterion: MasterCriterion) => {
    setEditCriterion(criterion);
    setInputKriteriaText(criterion.text);
    setInputDeskripsiText(criterion.description);
    setFormChecklistError(null);
    setChecklistSubView("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Buka Halaman Detail (Halaman Baru)
  const handleOpenDetail = (criterion: MasterCriterion) => {
    setViewCriterion(criterion);
    setChecklistSubView("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCloseForm = () => {
    setEditCriterion(null);
    setInputKriteriaText("");
    setInputDeskripsiText("");
    setFormChecklistError(null);
    setChecklistSubView("table");
  };

  const handleConfirmDelete = () => {
    if (!deleteCandidate) return;
    setChecklistCriteria((prev) => {
      const remaining = prev.filter((c) => c.id !== deleteCandidate.id);
      // Re-index kembali dari 1 s/d N agar nomor urut selalu rapi dan tidak tumpang longkap
      return remaining.map((c, idx) => ({
        ...c,
        id: idx + 1,
      }));
    });
    setDeleteCandidate(null);
    if (checklistSubView === "detail") {
      setChecklistSubView("table");
    }
  };

  const handleToggleCriterionActive = (id: number) => {
    setChecklistCriteria((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)));
  };

  // Submit Handler for Checklist Form (Halaman Baru - Tambah maupun Edit)
  const handleSubmitNewChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKriteriaText.trim()) {
      setFormChecklistError("Kolom Kriteria (Teks) wajib diisi.");
      return;
    }
    if (!inputDeskripsiText.trim()) {
      setFormChecklistError("Kolom Deskripsi (Teks) wajib diisi.");
      return;
    }

    setFormChecklistError(null);

    if (editCriterion) {
      setChecklistCriteria((prev) =>
        prev.map((c) =>
          c.id === editCriterion.id
            ? {
                ...c,
                text: inputKriteriaText.trim(),
                description: inputDeskripsiText.trim(),
              }
            : c,
        ),
      );
      setChecklistSavedBanner(`Perubahan Kriteria No. ${editCriterion.id} berhasil disimpan!`);
      setEditCriterion(null);
    } else {
      const newCriterion: MasterCriterion = {
        id: checklistCriteria.length + 1,
        text: inputKriteriaText.trim(),
        description: inputDeskripsiText.trim(),
        isActive: true, // Default aktif di tabel
      };

      setChecklistCriteria((prev) => [...prev, newCriterion]);
      setChecklistSavedBanner(`Kriteria baru No. ${newCriterion.id} berhasil ditambahkan ke daftar checklist!`);
    }

    setInputKriteriaText("");
    setInputDeskripsiText("");
    setChecklistSubView("table");
    setTimeout(() => setChecklistSavedBanner(null), 4000);
  };

  // Filtered criteria list
  const filteredCriteria = checklistCriteria.filter((c) => {
    const q = checklistSearch.toLowerCase().trim();
    if (!q) return true;
    return c.text.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.id.toString().includes(q);
  });

  const isChecklistMenu = !reviewDetailSnapshot && (activeMenu === "verifikator_checklist" || activeMenu === "menu_checklist");

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* View Only Banner (for Satker) - Disembunyikan pada halaman master checklist */}
      {!isEditable && !isChecklistMenu && (
        <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-2xl p-4.5 flex items-start gap-3.5 text-sky-900 dark:text-sky-200 shadow-2xs">
          <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <span className="font-bold uppercase tracking-wider block text-[11px] text-sky-800 dark:text-sky-300">Mode Akses: Hanya Lihat (View Only)</span>
            <p className="mt-0.5 text-slate-600 dark:text-slate-300 leading-relaxed">
              {isChecklistMenu
                ? "Sesuai peran Satker, Anda memiliki hak akses View (V) untuk membaca 20 kriteria kepatuhan AI dan verifikator sebagai panduan penyusunan berkas RAB. Tambah kriteria baru, edit, dan hapus hanya dapat dilakukan oleh Super Admin dan ROCAN (verif)."
                : "Sesuai peran Satker, Anda memiliki hak akses View (V) untuk melihat rincian evaluasi AI 20 kriteria dokumen RAB secara transparan. Penetapan status verifikasi akhir hanya dapat diproses oleh Tim Verifikator ROCAN dan Super Admin."}
            </p>
          </div>
        </div>
      )}

      {/* Top Banner (Disembunyikan saat membuka formulir checklist baru) */}
      {!(isChecklistMenu && checklistSubView === "form") && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-slate-900 dark:text-white shadow-xs transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Portal Verifikator Anggaran Resmi</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {isChecklistMenu ? "Manajemen Input Ceklist Pertanyaan Evaluasi AI & Verifikator" : "Verifikasi & Telaah Baris per Baris Dokumen RAB"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
                {isChecklistMenu
                  ? "Atur master kriteria pertanyaan telaah RAB yang digunakan oleh mesin AI dan pejabat verifikator. Tambahkan kriteria baru melalui formulir khusus serta kelola status aktif dan aksi CRUD pada tabel."
                  : "Periksa hasil telaah AI atas dokumen RAB dalam satu kesatuan parameter dan evaluasi kriteria terpadu, tentukan status kelayakan (Lolos/Ditolak) beserta catatan evaluasi, dan tetapkan Berita Acara digital."}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-right shadow-2xs shrink-0">
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Pejabat Verifikator:</span>
              <span className="font-bold text-slate-900 dark:text-white block mt-0.5 text-xs sm:text-sm">{reviewDetailSnapshot?.verifiedBy || currentUser.name}</span>
              <span className="text-slate-500 dark:text-slate-400 text-[10px] font-mono mt-0.5 block">ID (8 Digit): {reviewDetailSnapshot?.verifiedByNip || currentUser.id}</span>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* 1. HISTORI REVIU: DETAIL & INPUT VERIFIKASI */}
      {/* ================================================================== */}
      {reviewDetailSnapshot && (
        <div className="space-y-6 sm:space-y-8 animate-fadeIn">
          {/* Workspace detail snapshot Histori Reviu */}
          {reviewDetailSnapshot && (
            <div className="space-y-8 sm:space-y-10 animate-fadeIn">
              {reviewDetailSnapshot && (
                <>
                  {/* Identitas dokumen dari entri histori terpilih */}
                  {reviewDetailSnapshot && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2.5 rounded-xl shrink-0 ${reviewDetailSnapshot.verificationStatus === "Diterima" ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400" : reviewDetailSnapshot.verificationStatus === "Menunggu" ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400" : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"}`}>
                          {reviewDetailSnapshot.verificationStatus === "Diterima" ? <CheckCircle2 className="w-5 h-5" /> : reviewDetailSnapshot.verificationStatus === "Menunggu" ? <Clock className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block">Detail Histori Reviu RAB</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">{reviewDetailSnapshot.ticketNumber} &bull; {reviewDetailSnapshot.verifiedAt}</span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border self-start md:self-auto ${reviewDetailSnapshot.verificationStatus === "Diterima" ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" : reviewDetailSnapshot.verificationStatus === "Menunggu" ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"}`}>
                        {reviewDetailSnapshot.verificationStatus === "Diterima" ? <CheckCircle2 className="w-3.5 h-3.5" /> : reviewDetailSnapshot.verificationStatus === "Menunggu" ? <Clock className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {reviewDetailSnapshot.verificationStatus}
                      </span>
                    </div>
                  )}

                  {/* Submission Details Full Width */}
                  {selectedSubmission && (
                    <div className={isCombinedReviewDetail ? "space-y-0" : "space-y-8 sm:space-y-10"}>
                      {/* ============================================================= */}
                      {/* INSTRUKSI KHUSUS: PEMBAHASAN 1 & PEMBAHASAN 2 DISATUKAN        */}
                      {/* "Pembahasan 1 Parameter Hierarki & satker dan pembahasan 2     */}
                      {/*  Evaluasi AI & Verifikator 20 kriteria agar disatukan"         */}
                      {/* ============================================================= */}
                      <div className={`relative bg-white dark:bg-slate-900 border-2 border-blue-500 dark:border-blue-500 ${isCombinedReviewDetail ? "rounded-t-2xl border-b-0 p-6 sm:p-8 pt-8 sm:pt-9 pb-0 sm:pb-0" : "rounded-2xl p-6 sm:p-8 pt-8 sm:pt-9"} shadow-sm transition-all space-y-6 sm:space-y-7`}>
                        {/* Outline Label Badge Terpadu */}
                        <div className="absolute -top-3.5 left-5 sm:left-6 z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border bg-blue-600 text-white border-blue-400 select-none">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>PEMBAHASAN TERPADU &bull; PARAMETER HIERARKI &amp; EVALUASI AI 20 KRITERIA</span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">{selectedSubmission.ticketNumber}</span>
                              <span className="text-xs text-slate-400 dark:text-slate-500">&bull; Diajukan {selectedSubmission.submittedAt}</span>
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider mt-1 flex items-center gap-2">
                              <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              <span>Parameter Hierarki Anggaran &amp; Evaluasi Kepatuhan 20 Kriteria</span>
                            </h3>
                          </div>

                          <div className="flex items-center gap-2.5 self-start sm:self-auto">
                            <button
                              id="btn-preview-submission-pdf"
                              onClick={() => setPreviewOpen(true)}
                              className="h-8 px-3.5 bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                              <span>Lihat PDF RAB Satker</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setIsUnifiedSectionCollapsed(!isUnifiedSectionCollapsed)}
                              className="h-8 px-3 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                              title={isUnifiedSectionCollapsed ? "Perluas Pembahasan" : "Minimize Pembahasan"}
                            >
                              <span>{isUnifiedSectionCollapsed ? "Perluas" : "Minimize"}</span>
                              {isUnifiedSectionCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {!isUnifiedSectionCollapsed && (
                          <div className="space-y-6 animate-fadeIn">
                            {/* BAGIAN 1: PARAMETER HIERARKI & SATKER */}
                            <div className="p-5 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl space-y-4">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide block">A. Parameter Hierarki &amp; Identitas Satker Dokumen RAB</span>

                              {/* Urutan Sesuai Ketentuan:
                          1. Diawali Program
                          2. Kegiatan
                          3. KRO / RO
                          4. Satker & Unit Eselon (Setara)
                      */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                {/* 1. Program */}
                                <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                  <span className="text-[10px] text-slate-400 uppercase font-bold block">1. Program:</span>
                                  <span className="text-xs font-bold text-slate-900 dark:text-white block mt-0.5">{selectedSubmission.program}</span>
                                </div>

                                {/* 2. Kegiatan */}
                                <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                  <span className="text-[10px] text-slate-400 uppercase font-bold block">2. Kegiatan:</span>
                                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-200 block mt-0.5">{selectedSubmission.kegiatan}</span>
                                </div>

                                {/* 3. KRO / RO */}
                                <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                  <span className="text-[10px] text-slate-400 uppercase font-bold block">3. KRO / RO:</span>
                                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-200 block mt-0.5">
                                    {selectedSubmission.kro} &bull; {selectedSubmission.ro}
                                  </span>
                                </div>

                                {/* 4. Satker & Unit Eselon Setara */}
                                <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                  <span className="text-[10px] text-slate-400 uppercase font-bold block">4. Satker &amp; Unit Eselon:</span>
                                  <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300 block mt-0.5">{selectedSubmission.satkerUserName}</span>
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                                    {selectedSubmission.unitEselon1} &bull; {selectedSubmission.prioritas}
                                  </span>
                                </div>
                              </div>

                              {/* Dasar Regulasi Acuan AI */}
                              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-[10px] text-slate-400 uppercase font-bold">Dasar Regulasi Acuan AI:</span>
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5 shadow-2xs">
                                  <Scale className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  {selectedSubmission.activeRegulationTitle || "PMK Standar Biaya Masukan (SBM)"}
                                </span>
                              </div>
                            </div>

                            {/* BAGIAN 2: EVALUASI AI & VERIFIKATOR 20 KRITERIA */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between pb-2">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                                  B. Hasil Penelaahan AI &amp; Evaluasi Verifikator Baris per Baris ({totalRows} Kriteria)
                                </span>

                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                                      selectedSubmission.aiStatus === "LOLOS"
                                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                        : "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                    }`}
                                  >
                                    AI: {selectedSubmission.aiStatus} ({aiPassedRows}/{totalRows})
                                  </span>
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                                    Verifikator: {verifierPassedRows} Lolos / {verifierRejectedRows} Ditolak
                                  </span>
                                </div>
                              </div>

                              {/* AI Summary Reasoning */}
                              <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                <p className="leading-relaxed">
                                  <strong className="text-slate-900 dark:text-white">Alasan AI: </strong> {selectedSubmission.aiReason}
                                </p>
                                {selectedSubmission.aiRecommendation && (
                                  <p className="leading-relaxed">
                                    <strong className="text-slate-900 dark:text-white">Rekomendasi AI: </strong> {selectedSubmission.aiRecommendation}
                                  </p>
                                )}
                              </div>

                              {allowHistoricalStatusEdit && editableCriteria.length === 0 && (
                                <p className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2" role="status">
                                  Rincian evaluasi baris per baris belum tersimpan pada entri histori ini.
                                </p>
                              )}

                              <VerificationCriteriaTable
                                criteria={editableCriteria}
                                isEditable={isEditable}
                                isStatusEditable={isEditable || allowHistoricalStatusEdit}
                                isNotesEditable={isEditable || allowHistoricalStatusEdit}
                                isStatusDisabled={isHistoricalReviewLocked}
                                isNotesDisabled={isHistoricalReviewLocked}
                                onStatusChange={handleRowStatusChange}
                                onNotesChange={handleRowNotesChange}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* FORMULIR KEPUTUSAN AKHIR & LAPORAN BERITA ACARA */}
                      {showFinalDecision && (
                        <div
                          id="formulir-keputusan-verifikator"
                          className={`relative bg-white dark:bg-slate-900 ${isCombinedReviewDetail ? "border-x-2 border-b-2 border-blue-500 dark:border-blue-500 rounded-b-2xl pt-0" : "border-2 border-emerald-500 dark:border-emerald-500 rounded-2xl pt-8 sm:pt-9"} p-6 sm:p-8 shadow-sm space-y-6 sm:space-y-7 transition-all`}
                        >
                        {/* Outline Label Badge */}
                        {!isCombinedReviewDetail && (
                          <div className="absolute -top-3.5 left-5 sm:left-6 z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border bg-emerald-600 text-white border-emerald-400 select-none">
                            <Award className="w-3.5 h-3.5" />
                            <span>KEPUTUSAN AKHIR &bull; BERITA ACARA DIGITAL</span>
                          </div>
                        )}

                        <div className={`border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isCombinedReviewDetail ? "border-t pt-6" : ""}`}>
                          <div>
                            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              <span>Keputusan Akhir Verifikasi</span>
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tetapkan keputusan akhir berkas RAB secara komprehensif berdasarkan penelaahan 20 kriteria di atas.</p>
                          </div>
                          <div className="flex items-center gap-2.5 self-start sm:self-auto">
                            {saveSuccess && (
                              <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1.5 rounded-full border border-emerald-300 dark:border-emerald-800 animate-fadeIn shadow-2xs">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                Keputusan Tersimpan!
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-6 animate-fadeIn">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5 sm:p-6 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl">
                              {/* Kolom 1: Pilihan Diterima atau Ditolak (5 cols) */}
                              <div className="md:col-span-5 space-y-2.5">
                                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                                  Kolom 1: Keputusan Akhir <span className="text-rose-500">*</span>
                                </label>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {canEditDecision ? "Pilih status penetapan akhir dokumen usulan RAB:" : "Status keputusan akhir:"}
                                </p>

                                {canEditDecision ? (
                                  <>
                                    <div className="grid grid-cols-2 gap-3 pt-1">
                                      <button
                                        id="btn-verif-diterima"
                                        type="button"
                                        onClick={() => {
                                          setCurrentDecision("Diterima");
                                          if (allowHistoricalStatusEdit) setCriteriaSaveSuccess(false);
                                        }}
                                        className={`h-12 px-4 rounded-xl border text-center transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider ${
                                          currentDecision === "Diterima"
                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30 ring-1 ring-emerald-500"
                                            : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-400 hover:bg-emerald-50/40"
                                        }`}
                                      >
                                        <CheckCircle2 className="w-4 h-4 text-current" />
                                        <span>Diterima</span>
                                      </button>

                                      <button
                                        id="btn-verif-ditolak"
                                        type="button"
                                        onClick={() => {
                                          setCurrentDecision("Ditolak");
                                          if (allowHistoricalStatusEdit) setCriteriaSaveSuccess(false);
                                        }}
                                        className={`h-12 px-4 rounded-xl border text-center transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider ${
                                          currentDecision === "Ditolak"
                                            ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/30 ring-1 ring-rose-500"
                                            : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-rose-400 hover:bg-rose-50/40"
                                        }`}
                                      >
                                        <XCircle className="w-4 h-4 text-current" />
                                        <span>Ditolak</span>
                                      </button>
                                    </div>

                                    <div className="text-[11px] font-medium pt-1 text-slate-600 dark:text-slate-400">
                                      Status terpilih: <strong className="font-bold text-slate-900 dark:text-white uppercase">{currentDecision}</strong>
                                    </div>
                                  </>
                                ) : (
                                  <div className="pt-1">
                                    <span className={`inline-flex items-center gap-2 text-sm font-bold ${
                                      currentDecision === "Diterima"
                                        ? "text-emerald-700 dark:text-emerald-300"
                                        : currentDecision === "Ditolak"
                                          ? "text-rose-700 dark:text-rose-300"
                                          : "text-amber-700 dark:text-amber-300"
                                    }`}>
                                      {currentDecision === "Diterima" ? <CheckCircle2 className="w-4 h-4" /> : currentDecision === "Ditolak" ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                      {currentDecision}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Kolom 2: Catatan / Keterangan Berita Acara (7 cols) */}
                              <div className="md:col-span-7 space-y-2.5">
                                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                                  Kolom 2: Catatan / Keterangan Berita Acara <span className="text-rose-500">*</span>
                                </label>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {canEditDecision ? "Uraikan dasar pertimbangan penetapan atau arahan revisi bagi SatKer:" : "Catatan / keterangan berita acara:"}
                                </p>
                                {canEditDecision ? (
                                  <textarea
                                    id="textarea-verifikator-keterangan"
                                    rows={4}
                                    value={currentNotes}
                                    onChange={(e) => {
                                      setCurrentNotes(e.target.value);
                                      if (allowHistoricalStatusEdit) setCriteriaSaveSuccess(false);
                                    }}
                                    placeholder="Contoh: Dokumen RAB telah disetujui penuh dengan pemenuhan 20 kriteria kepatuhan SBM..."
                                    className="w-full p-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 resize-none leading-relaxed shadow-2xs"
                                  />
                                ) : (
                                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                                    {currentNotes || "Tidak ada catatan berita acara."}
                                  </p>
                                )}
                                {allowHistoricalStatusEdit && (
                                  <div className="flex flex-wrap items-center justify-end gap-3">
                                    {criteriaSaveSuccess && (
                                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300" role="status">
                                        Pembahasan tersimpan.
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={handleSaveHistoricalReview}
                                      disabled={isHistoricalReviewLocked}
                                      className={`h-10 px-5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow-sm transition-colors ${isHistoricalReviewLocked ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                                    >
                                      <Save className="w-4 h-4" />
                                      <span>Simpan Verifikasi</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Save Decision Button */}
                            <div className="flex justify-end pt-1">
                              {isEditable ? (
                                <button
                                  id="btn-save-verifikator-decision"
                                  onClick={handleSaveDecision}
                                  className="h-11 sm:h-12 px-6 sm:px-8 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-cyan-600/30 hover:shadow-lg ring-1 ring-cyan-500 transition-all cursor-pointer"
                                >
                                  <Save className="w-4 h-4" />
                                  <span>Simpan Keputusan &amp; Evaluasi Baris per Baris</span>
                                </button>
                              ) : !allowHistoricalStatusEdit ? (
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 italic">
                                  Mode View Only: Penetapan status keputusan telaah hanya dapat disimpan oleh Super Admin dan ROCAN (verif).
                                </span>
                              ) : null}
                            </div>

                        </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* 2. VIEW MENU: INPUT CEKLIST (isChecklistMenu)                      */}
      {/* ================================================================== */}
      {isChecklistMenu && (
        <div className="space-y-8 animate-fadeIn">
          {checklistSavedBanner && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{checklistSavedBanner}</span>
            </div>
          )}

          {/* MODE A: TABEL MASTER CHECKLIST */}
          {checklistSubView === "table" && (
            <div className="relative bg-white dark:bg-slate-900 border-2 border-cyan-500 dark:border-cyan-500 rounded-2xl p-6 sm:p-8 pt-8 sm:pt-9 shadow-sm space-y-6 transition-all">
              {/* Outline Label Badge */}
              <div className="absolute -top-3.5 left-5 sm:left-6 z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border bg-cyan-600 text-white border-cyan-400 select-none">
                <Sliders className="w-3.5 h-3.5" />
                <span>MASTER CHECKLIST &bull; DAFTAR PERTANYAAN PEMERIKSAAN AI &amp; VERIFIKATOR</span>
              </div>

              <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Daftar Kriteria &amp; Pertanyaan Pemeriksaan Dokumen RAB</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Halaman ini bertujuan untuk mengelola list pertanyaan yang akan diperiksa oleh mesin AI dan pejabat verifikator.</p>
                </div>

                {/* Tombol Masukkan Checklist Baru (Create - Halaman Baru) */}
                {canManageChecklist && (
                  <button
                    id="btn-tambah-checklist-baru"
                    type="button"
                    onClick={handleOpenAdd}
                    className="h-10 px-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer ring-1 ring-cyan-500 self-start sm:self-auto shrink-0"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Masukkan Checklist Baru</span>
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative max-w-sm w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={checklistSearch}
                    onChange={(e) => setChecklistSearch(e.target.value)}
                    placeholder="Cari kriteria atau deskripsi checklist..."
                    className="w-full pl-9 pr-4 h-10 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Total Kriteria: <strong className="text-slate-900 dark:text-white">{checklistCriteria.length}</strong> (Aktif: {checklistCriteria.filter((c) => c.isActive).length})
                </div>
              </div>

              {/* Table: No, Kriteria, Deskripsi, Aktif dan Tidak Aktif, Aksi (CRUD) */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/95 dark:bg-slate-800/95 border-b-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 uppercase font-black tracking-wider text-xs">
                      <tr>
                        <th className="px-4 py-4 w-14 text-center">No</th>
                        <th className="px-5 py-4 min-w-[260px]">Kriteria</th>
                        <th className="px-5 py-4 min-w-[320px]">Deskripsi</th>
                        <th className="px-4 py-4 w-36 text-center">Aktif dan Tidak Aktif</th>
                        <th className="px-4 py-4 w-36 text-center">Aksi (CRUD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredCriteria.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-slate-400 dark:text-slate-500">
                            Tidak ada kriteria checklist yang sesuai pencarian.
                          </td>
                        </tr>
                      ) : (
                        filteredCriteria.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-sky-50/70 dark:hover:bg-slate-800/60 transition-colors">
                            {/* No */}
                            <td className="px-4 py-4 text-center font-mono font-bold text-slate-500">{item.id}</td>

                            {/* Kriteria */}
                            <td className="px-5 py-4">
                              <span className="font-semibold text-slate-900 dark:text-white block leading-snug">{item.text}</span>
                            </td>

                            {/* Deskripsi */}
                            <td className="px-5 py-4">
                              <span className="text-slate-600 dark:text-slate-300 block leading-relaxed">{item.description}</span>
                            </td>

                            {/* Aktif dan Tidak Aktif (Toggle Update) */}
                            <td className="px-4 py-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleCriterionActive(item.id)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                  item.isActive
                                    ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                    : "bg-slate-200 hover:bg-slate-300 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700"
                                }`}
                                title="Klik untuk mengubah status aktif/non-aktif kriteria"
                              >
                                {item.isActive ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                <span>{item.isActive ? "Aktif" : "Tidak Aktif"}</span>
                              </button>
                            </td>

                            {/* Aksi (CRUD) */}
                            <td className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Read / View (Halaman Baru) */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenDetail(item)}
                                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                                  title="Lihat Detail Kriteria (Read)"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {/* Edit / Update (Halaman Baru) */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(item)}
                                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 transition-colors cursor-pointer border border-amber-200 dark:border-amber-800"
                                  title="Edit Kriteria & Deskripsi (Update)"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() => setDeleteCandidate(item)}
                                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800"
                                  title="Hapus Kriteria (Delete)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MODE B: HALAMAN FORM INPUT / EDIT CHECKLIST (HALAMAN BARU) */}
          {checklistSubView === "form" && (
            <div className="relative bg-white dark:bg-slate-900 border-2 border-emerald-500 dark:border-emerald-500 rounded-2xl p-6 sm:p-8 pt-8 sm:pt-9 shadow-sm space-y-6 transition-all animate-fadeIn">
              {/* Outline Label Badge */}
              <div className="absolute -top-3.5 left-5 sm:left-6 z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border bg-emerald-600 text-white border-emerald-400 select-none">
                {editCriterion ? <Pencil className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
                <span>{editCriterion ? "FORMULIR EDIT • UBAH PERTANYAAN PEMERIKSAAN" : "FORMULIR CHECKLIST BARU • INPUT PERTANYAAN PEMERIKSAAN"}</span>
              </div>

              <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {editCriterion ? <Pencil className="w-5 h-5 text-amber-600 dark:text-amber-400" /> : <PlusCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                    <span>{editCriterion ? `Edit Kriteria No. ${editCriterion.id} Pemeriksaan Dokumen RAB` : "Masukkan Checklist Baru Pemeriksaan Dokumen RAB"}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {editCriterion
                      ? "Perbarui kriteria pertanyaan dan deskripsi panduan evaluasi kriteria ini."
                      : "Isi kriteria pertanyaan dan deskripsi panduan evaluasi. Status aktif dan aksi CRUD akan tersedia pada tabel setelah disimpan."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="h-9 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors self-start sm:self-auto shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Tabel</span>
                </button>
              </div>

              {formChecklistError && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formChecklistError}</span>
                </div>
              )}

              {/* Form Baru Sesuai Instruksi:
                  a. No (otomatis)
                  b. Kriteria (Teks)
                  c. Deskripsi (Teks)
                  (Untuk aktif dan tidak aktif serta aksi CRUD HANYA muncul di tabel saja!)
              */}
              <form onSubmit={handleSubmitNewChecklist} className="space-y-5 text-xs max-w-2xl">
                {/* a. No (Otomatis) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    a. Nomor Urut Kriteria <span className="text-emerald-600 font-bold">(Otomatis Terisi)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editCriterion ? `Nomor Kriteria #${editCriterion.id}` : `Nomor Kriteria #${nextCriterionNo}`}
                      readOnly
                      disabled
                      className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-300 cursor-not-allowed"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {editCriterion ? "Nomor urut kriteria yang sedang diubah." : "Nomor urut kriteria otomatis digenerate berikutnya oleh sistem."}
                  </span>
                </div>

                {/* b. Kriteria (Teks) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    b. Kriteria Pertanyaan Pemeriksaan <span className="text-rose-500">* (Teks)</span>
                  </label>
                  <input
                    id="input-kriteria-text"
                    type="text"
                    value={inputKriteriaText}
                    onChange={(e) => setInputKriteriaText(e.target.value)}
                    placeholder="Contoh: Apakah RAB melampirkan lembar verifikasi batas honor narasumber bersertifikasi?"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-2xs font-medium"
                    required
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Tuliskan kalimat pertanyaan kriteria yang jelas dan lugas.</span>
                </div>

                {/* c. Deskripsi (Teks) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    c. Deskripsi &amp; Panduan Pengujian <span className="text-rose-500">* (Teks)</span>
                  </label>
                  <textarea
                    id="input-deskripsi-text"
                    rows={4}
                    value={inputDeskripsiText}
                    onChange={(e) => setInputDeskripsiText(e.target.value)}
                    placeholder="Jelaskan petunjuk teknis pengujian, dokumen pembanding yang wajib dicocokkan, atau standar regulasi acuan..."
                    className="w-full p-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-2xs leading-relaxed"
                    required
                  />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
                  <strong className="text-slate-700 dark:text-slate-300 block mb-0.5">Catatan Sistem:</strong>
                  Sesuai ketentuan, status <em>Aktif / Tidak Aktif</em> dan opsi <em>Aksi (CRUD)</em> akan tersedia langsung pada tabel setelah kriteria ini berhasil disimpan.
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="h-11 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="h-11 px-7 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editCriterion ? "Simpan Perubahan Kriteria" : "Simpan Checklist Baru"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MODE C: HALAMAN DETAIL KRITERIA CHECKLIST (READ / FULL PAGE) */}
          {checklistSubView === "detail" && viewCriterion && (
            <div className="relative bg-white dark:bg-slate-900 border-2 border-cyan-500 dark:border-cyan-500 rounded-2xl p-6 sm:p-8 pt-8 sm:pt-9 shadow-sm space-y-6 transition-all animate-fadeIn">
              {/* Outline Label Badge */}
              <div className="absolute -top-3.5 left-5 sm:left-6 z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border bg-cyan-600 text-white border-cyan-400 select-none">
                <Eye className="w-3.5 h-3.5" />
                <span>DETAIL KRITERIA • INFORMASI LENGKAP CHECKLIST</span>
              </div>

              <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-extrabold px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                    Kriteria No. {viewCriterion.id}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Detail Kriteria Pemeriksaan Dokumen RAB
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Pratinjau lengkap isi kriteria dan panduan telaah verifikator.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setViewCriterion(null);
                    setChecklistSubView("table");
                  }}
                  className="h-9 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors self-start sm:self-auto shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Tabel</span>
                </button>
              </div>

              <div className="space-y-5 text-xs max-w-3xl">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">
                    Kriteria / Pertanyaan Pemeriksaan:
                  </span>
                  <div className="mt-1.5 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-relaxed">
                      {viewCriterion.text}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">
                    Deskripsi / Panduan Evaluasi &amp; Dasar Penelaahan:
                  </span>
                  <div className="mt-1.5 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs sm:text-sm whitespace-pre-wrap">
                      {viewCriterion.description}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">
                    Status Penggunaan AI &amp; Verifikator:
                  </span>
                  <div className="mt-1.5">
                    <span
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border ${
                        viewCriterion.isActive
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      {viewCriterion.isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      <span>{viewCriterion.isActive ? "Aktif Digunakan AI & Verifikator" : "Tidak Aktif (Diarsipkan)"}</span>
                    </span>
                  </div>
                </div>

                {/* Tombol Aksi CRUD di Halaman Detail */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const target = viewCriterion;
                      setDeleteCandidate(target);
                    }}
                    className="h-10 px-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus Kriteria</span>
                  </button>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setViewCriterion(null);
                        setChecklistSubView("table");
                      }}
                      className="h-10 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      Kembali ke Tabel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const target = viewCriterion;
                        setViewCriterion(null);
                        handleOpenEdit(target);
                      }}
                      className="h-10 px-5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>Edit Kriteria Ini</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* MODAL DELETE CRITERION CONFIRMATION */}
          {deleteCandidate && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Konfirmasi Hapus Kriteria</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Kriteria ini akan dihapus dari daftar checklist evaluasi.</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <span className="font-bold block text-slate-900 dark:text-white leading-snug">
                    #{deleteCandidate.id}: {deleteCandidate.text}
                  </span>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteCandidate(null)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs"
                  >
                    Hapus Kriteria
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PDF Preview Modal for RAB */}
      {previewOpen && selectedSubmission && (
        <PdfPreviewModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          fileName={selectedSubmission.rabFileName || "Dokumen_RAB.pdf"}
          fileDataUrl={selectedSubmission.pdfDataUrl}
          ticketNumber={selectedSubmission.ticketNumber}
          submissionId={selectedSubmission.id}
          title={`Dokumen Usulan RAB: ${selectedSubmission.ticketNumber}`}
          metadata={{
            program: selectedSubmission.program,
            kegiatan: selectedSubmission.kegiatan,
            kro: selectedSubmission.kro,
            ro: selectedSubmission.ro,
            unit: selectedSubmission.unitEselon1,
            satkerName: selectedSubmission.satkerUserName,
            prioritas: selectedSubmission.prioritas,
            aiStatus: selectedSubmission.aiStatus,
            aiScore: selectedSubmission.aiScore,
            submittedAt: selectedSubmission.submittedAt,
          }}
        />
      )}

    </div>
  );
};
