import React, { useState, useEffect } from "react";
import { UserAccount, UserRole, SubmissionData, ActiveMenuKey, RegulationDocument, ChecklistCriterion, ROLE_PERMISSIONS_MATRIX } from "../types";
import { getUniquePrograms, getKegiatansForProgram, getKrosForKegiatan, getRosForKro, HIERARCHY_DATA } from "../data/budgetData";
import {
  FileSpreadsheet,
  Upload,
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Layers,
  Loader2,
  FileCheck,
  BookOpen,
  Scale,
  AlertCircle,
  Clock,
  FileText,
  ArrowRight,
  X,
  Pencil,
  History,
  Tag,
  ArrowLeft,
} from "lucide-react";
import { PdfPreviewModal } from "./PdfPreviewModal";
import { VerifikatorView } from "./VerifikatorView";
import { SubmissionTable } from "./SubmissionTable";
import { storePdfBlob } from "../utils/pdfStorage";
import { findRabCategory, RAB_CATEGORY_OPTIONS } from "../utils/rabCategories";
import { filterSubmissions, getHistoricalSubmission, getReviewHistory } from "../utils/submissionUtils";
import type { SubmissionFilters } from "../utils/submissionUtils";
import { SubmissionFilterPanel } from "./SubmissionFilterPanel";
import { formatFileSize, formatIndonesianDateTime } from "../utils/formatUtils";

interface SatkerViewProps {
  currentUser: UserAccount;
  activeRole?: UserRole;
  onAddSubmission: (submission: SubmissionData) => void;
  onUpdateSubmission?: (submission: SubmissionData) => void;
  onDeleteSubmission?: (submissionId: string) => void;
  submissions: SubmissionData[];
  regulations?: RegulationDocument[];
  activeMenu?: ActiveMenuKey;
  onSelectMenu?: (menu: ActiveMenuKey) => void;
}

type RabAnalysisResult = Pick<SubmissionData, "aiStatus" | "aiScore" | "aiReason" | "aiRecommendation" | "criteriaResults"> & {
  activeRegulationTitle?: string;
  ticketNumber?: string;
};

const EMPTY_SUBMISSION_FILTERS: SubmissionFilters = {
  jenisDokumen: "",
  status: "all",
  tahun: "all",
  startDate: "",
  endDate: "",
};

export const SatkerView: React.FC<SatkerViewProps> = ({
  currentUser,
  activeRole = currentUser.activeRole,
  onAddSubmission,
  onUpdateSubmission,
  onDeleteSubmission,
  submissions,
  regulations = [],
  activeMenu = "satker_list",
  onSelectMenu,
}) => {
  const activeRegulations = regulations.filter((r) => r.isActive);
  const isReadOnly = ROLE_PERMISSIONS_MATRIX.menu_rab_list[activeRole] !== "E";
  // Sub Tab state for Daftar RAB vs Form Pengajuan vs Detail Evaluasi & Reupload
  const [activeRabSubTab, setActiveRabSubTab] = useState<"list" | "form" | "history" | "history_detail" | "reupload">(() => {
    return activeMenu === "satker_form" ? "form" : "list";
  });

  // -------------------------------------------------------------
  // DETAIL EVALUASI AI 20 KRITERIA & REUPLOAD STATES
  // -------------------------------------------------------------
  const [reviewHistorySubmission, setReviewHistorySubmission] = useState<SubmissionData | null>(null);
  const [reviewHistoryDetailIndex, setReviewHistoryDetailIndex] = useState<number | null>(null);
  const [reuploadSubmission, setReuploadSubmission] = useState<SubmissionData | null>(null);
  const [reuploadFile, setReuploadFile] = useState<File | null>(null);
  const [reuploadError, setReuploadError] = useState<string | null>(null);
  const [isReuploadAnalyzing, setIsReuploadAnalyzing] = useState(false);
  const [reuploadProgressText, setReuploadProgressText] = useState("");
  const latestHistoryEntry = reviewHistorySubmission ? getReviewHistory(reviewHistorySubmission).at(-1) : undefined;
  const selectedReviewEntry = reviewHistorySubmission && reviewHistoryDetailIndex !== null
    ? getReviewHistory(reviewHistorySubmission)[reviewHistoryDetailIndex] || null
    : null;
  const historicalReviewSubmission = reviewHistorySubmission && selectedReviewEntry
    ? getHistoricalSubmission(reviewHistorySubmission, selectedReviewEntry)
    : null;

  const handleOpenReviewHistory = (submission: SubmissionData) => {
    setReviewHistorySubmission(submission);
    setReviewHistoryDetailIndex(null);
    setActiveRabSubTab("history");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenReviewHistoryDetail = (index: number) => {
    setReviewHistoryDetailIndex(index);
    setActiveRabSubTab("history_detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToReviewHistory = () => {
    setReviewHistoryDetailIndex(null);
    setActiveRabSubTab("history");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToDaftarRab = () => {
    setReviewHistorySubmission(null);
    setReviewHistoryDetailIndex(null);
    setActiveRabSubTab("list");
    onSelectMenu?.("satker_list");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleHistoricalReviewChange = (review: {
    verificationStatus: "Diterima" | "Ditolak" | "Menunggu";
    verifikatorNotes: string;
    criteriaResults: ChecklistCriterion[];
  }) => {
    if (!reviewHistorySubmission || reviewHistoryDetailIndex === null || !onUpdateSubmission) return;

    const history = getReviewHistory(reviewHistorySubmission);
    if (!history[reviewHistoryDetailIndex]) return;
    const criteriaResults = review.criteriaResults.map((criterion) => ({ ...criterion }));

    const updatedHistory = history.map((entry, index) =>
      index === reviewHistoryDetailIndex
        ? {
            ...entry,
            verificationStatus: review.verificationStatus,
            verifikatorNotes: review.verifikatorNotes,
            criteriaResults,
          }
        : entry,
    );
    const updatedSubmission: SubmissionData = {
      ...reviewHistorySubmission,
      reviewHistory: updatedHistory,
      ...(reviewHistoryDetailIndex === history.length - 1
        ? {
            verificationStatus: review.verificationStatus,
            verifikatorNotes: review.verifikatorNotes,
            criteriaResults,
          }
        : {}),
    };

    setReviewHistorySubmission(updatedSubmission);
    onUpdateSubmission(updatedSubmission);
    window.alert("Data verifikasi berhasil disimpan.");
    handleBackToDaftarRab();
  };

  const handleOpenRabReupload = (submission: SubmissionData) => {
    if ((activeRole !== "satker" && activeRole !== "superadmin") || getReviewHistory(submission).at(-1)?.verificationStatus !== "Ditolak") return;
    setReuploadSubmission(submission);
    setReuploadFile(null);
    setReuploadError(null);
    setActiveRabSubTab("reupload");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReuploadFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = "";
    if (!file) return;

    const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    const isPdf = file.name.toLowerCase().endsWith(".pdf") && new TextDecoder().decode(header) === "%PDF-";
    if (!isPdf) {
      setReuploadFile(null);
      setReuploadError("Berkas harus berupa PDF yang valid.");
      return;
    }

    setReuploadFile(file);
    setReuploadError(null);
  };

  const handleSaveRabReupload = async () => {
    if (!reuploadSubmission || !reuploadFile || !onUpdateSubmission || isReuploadAnalyzing) return;

    setIsReuploadAnalyzing(true);
    setReuploadError(null);
    setReuploadProgressText(`Mengirim "${reuploadFile.name}" untuk pemeriksaan AI (LLM)...`);

    try {
      const regulationLabel = activeRegulations.length > 0
        ? activeRegulations.map((regulation) => regulation.title).join(" & ")
        : "PMK Standar Biaya Masukan (SBM)";
      const formData = new FormData();
      formData.append("rab_file", reuploadFile);
      const apiBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/api/submissions/check-rab`, { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Pemeriksaan AI gagal.");
      }
      const criteriaResults = data.criteriaResults;
      if (!Array.isArray(criteriaResults) || criteriaResults.length === 0) {
        throw new Error("Hasil pemeriksaan RAB dari server tidak lengkap.");
      }
      const analysis: {
        aiStatus: "LOLOS" | "TIDAK LOLOS";
        aiScore: number;
        aiReason: string;
        aiRecommendation: string;
        criteriaResults: ChecklistCriterion[];
        activeRegulationTitle?: string;
      } = {
        aiStatus: data.aiStatus,
        aiScore: data.aiScore,
        aiReason: data.aiReason,
        aiRecommendation: data.aiRecommendation,
        criteriaResults,
        activeRegulationTitle: data.activeRegulationTitle || regulationLabel,
      };

      setReuploadProgressText("Menyimpan hasil pemeriksaan dan mengirim RAB untuk reviu ulang...");
      const nowFormatted = formatIndonesianDateTime();
      const userLabel = `${currentUser.name} (${currentUser.id})`;
      const pdfUrl = URL.createObjectURL(reuploadFile);
      await storePdfBlob(reuploadSubmission.id, reuploadFile);
      await storePdfBlob(reuploadSubmission.ticketNumber, reuploadFile);
      await storePdfBlob(reuploadFile.name, reuploadFile);

      const updatedSubmission: SubmissionData = {
        ...reuploadSubmission,
        rabFileName: reuploadFile.name,
        rabFileSize: formatFileSize(reuploadFile.size),
        pdfDataUrl: pdfUrl,
        updatedBy: userLabel,
        aiStatus: analysis.aiStatus,
        aiScore: analysis.aiScore,
        aiReason: analysis.aiReason,
        aiRecommendation: analysis.aiRecommendation,
        activeRegulationTitle: analysis.activeRegulationTitle || regulationLabel,
        criteriaResults: analysis.criteriaResults,
        verificationStatus: "Menunggu",
        verifikatorNotes: "",
        verifiedBy: undefined,
        verifiedByNip: undefined,
        verifiedAt: undefined,
        reviewHistory: [
          ...getReviewHistory(reuploadSubmission),
          {
            verifiedAt: nowFormatted,
            verificationStatus: "Menunggu",
            rabFileName: reuploadFile.name,
            aiStatus: analysis.aiStatus,
            aiScore: analysis.aiScore,
            aiReason: analysis.aiReason,
            aiRecommendation: analysis.aiRecommendation,
            criteriaResults: analysis.criteriaResults,
          },
        ],
        auditTrail: [
          ...(reuploadSubmission.auditTrail || []),
          {
            action: "REUPLOAD",
            performedBy: userLabel,
            timestamp: nowFormatted,
            details: `Unggah perbaikan dokumen RAB PDF: ${reuploadFile.name}`,
          },
        ],
      };

      onUpdateSubmission(updatedSubmission);
      setReuploadSubmission(null);
      setReuploadFile(null);
      setActiveRabSubTab("list");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Pemeriksaan atau penyimpanan reupload RAB gagal.", error);
      setReuploadError(error instanceof Error
        ? `${error.message} Berkas belum dikirim untuk reviu ulang.`
        : "Pemeriksaan AI atau penyimpanan berkas gagal. Berkas belum dikirim untuk reviu ulang; silakan coba lagi.");
    } finally {
      setIsReuploadAnalyzing(false);
      setReuploadProgressText("");
    }
  };

  useEffect(() => {
    if (activeMenu === "satker_form") {
      setActiveRabSubTab("form");
    } else if (activeMenu === "satker_list") {
      setActiveRabSubTab("list");
    } else if (activeMenu === "menu_rab_list") {
      setActiveRabSubTab("list");
    }
  }, [activeMenu]);

  // ---------------------------------------------------------
  // FORM FILTER PENCARIAN DOKUMEN (5 FIELDS) FOR PEMBAHASAN 2
  // ---------------------------------------------------------
  const [filterValues, setFilterValues] = useState<SubmissionFilters>(() => ({ ...EMPTY_SUBMISSION_FILTERS }));
  const [appliedFilters, setAppliedFilters] = useState<SubmissionFilters>(() => ({ ...EMPTY_SUBMISSION_FILTERS }));

  function handleFilterChange<Key extends keyof SubmissionFilters>(key: Key, value: SubmissionFilters[Key]) {
    setFilterValues((current) => ({ ...current, [key]: value }));
  }

  const handleApplyFilter = () => setAppliedFilters(filterValues);

  const handleResetFilter = () => {
    const resetFilters = { ...EMPTY_SUBMISSION_FILTERS };
    setFilterValues(resetFilters);
    setAppliedFilters(resetFilters);
  };

  // Minimize States
  const [isPembahasan1Collapsed, setIsPembahasan1Collapsed] = useState(false);
  const [isPembahasan2Collapsed, setIsPembahasan2Collapsed] = useState(false);
  const [isUnifiedFormCollapsed, setIsUnifiedFormCollapsed] = useState(false);
  const [isResultsCollapsed, setIsResultsCollapsed] = useState(false);

  // Modals for Daftar RAB
  const [selectedDetailSubmission, setSelectedDetailSubmission] = useState<SubmissionData | null>(null);
  const [historyPreviewItem, setHistoryPreviewItem] = useState<SubmissionData | null>(null);
  // CRUD Modals: Edit & Delete & User Log History
  const [editItem, setEditItem] = useState<SubmissionData | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<SubmissionData | null>(null);
  const [historyLogItem, setHistoryLogItem] = useState<SubmissionData | null>(null);

  // Edit form state
  const [editFileName, setEditFileName] = useState("");
  const [editKategori, setEditKategori] = useState<string>(RAB_CATEGORY_OPTIONS[0].value);
  const [editDeskripsi, setEditDeskripsi] = useState<string>(RAB_CATEGORY_OPTIONS[0].description);
  const [editTahunAnggaran, setEditTahunAnggaran] = useState("2026");

  const handleOpenEdit = (sub: SubmissionData) => {
    setEditItem(sub);
    setEditFileName(sub.rabFileName);
    const matched = findRabCategory(sub.kategori || sub.kategori1);
    setEditKategori(matched ? matched.value : (sub.kategori || sub.kategori1 || RAB_CATEGORY_OPTIONS[0].value));
    setEditDeskripsi(sub.deskripsi || (matched ? matched.description : RAB_CATEGORY_OPTIONS[0].description));
    setEditTahunAnggaran(sub.tahunAnggaran || "2026");
  };

  const handleEditKategoriChange = (newVal: string) => {
    setEditKategori(newVal);
    const matched = RAB_CATEGORY_OPTIONS.find((c) => c.value === newVal);
    if (matched) {
      setEditDeskripsi(matched.description);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    const userLabel = `${currentUser.name} (${currentUser.id})`;
    const timeNow = formatIndonesianDateTime();
    const existingAudit = editItem.auditTrail || [];

    const updatedSub: SubmissionData = {
      ...editItem,
      rabFileName: editFileName.trim() || editItem.rabFileName,
      kategori: editKategori,
      kategori1: editKategori,
      deskripsi: editDeskripsi.trim(),
      tahunAnggaran: editTahunAnggaran,
      updatedBy: userLabel,
      auditTrail: [
        ...existingAudit,
        {
          action: "UPDATE",
          performedBy: userLabel,
          timestamp: timeNow,
          details: `Pembaruan metadata berkas PDF & kategori (${editFileName.trim()})`,
        },
      ],
    };

    if (onUpdateSubmission) {
      onUpdateSubmission(updatedSub);
    }
    setEditItem(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteCandidate) return;
    if (onDeleteSubmission) {
      onDeleteSubmission(deleteCandidate.id);
    }
    setDeleteCandidate(null);
  };

  // ---------------------------------------------------------
  // FORM PENGAJUAN RAB BARU STATES
  // ---------------------------------------------------------
  const [programs, setPrograms] = useState<string[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>("");

  const [kegiatans, setKegiatans] = useState<{ kegiatan: string; unitEselon1: string }[]>([]);
  const [selectedKegiatan, setSelectedKegiatan] = useState<string>("");

  const [kros, setKros] = useState<{ kro: string; unitEselon2: string; prioritas: string }[]>([]);
  const [selectedKro, setSelectedKro] = useState<string>("");

  const [ros, setRos] = useState<string[]>([]);
  const [selectedRo, setSelectedRo] = useState<string>("");

  // e. Tahun Anggaran
  const [selectedTahunAnggaran, setSelectedTahunAnggaran] = useState<string>("2026");

  const [currentUnitEselon1, setCurrentUnitEselon1] = useState<string>("");
  const [currentUnitEselon2, setCurrentUnitEselon2] = useState<string>("");
  const [currentPrioritas, setCurrentPrioritas] = useState<string>("");

  // Klasifikasi Kategori (Dropdown 4 Kategori) & Deskripsi (Kolom Teks Otomatis Terisi)
  const [formKategori, setFormKategori] = useState<string>(RAB_CATEGORY_OPTIONS[0].value);
  const [formDeskripsi, setFormDeskripsi] = useState<string>(RAB_CATEGORY_OPTIONS[0].description);

  const handleCategoryChange = (newVal: string) => {
    setFormKategori(newVal);
    const matched = RAB_CATEGORY_OPTIONS.find((c) => c.value === newVal);
    if (matched) {
      setFormDeskripsi(matched.description);
    } else {
      setFormDeskripsi("");
    }
  };

  // File upload state
  const [rabFile, setRabFile] = useState<File | null>(null);
  const [rabFileName, setRabFileName] = useState<string>("");
  const [torFile, setTorFile] = useState<File | null>(null);
  const [torFileName, setTorFileName] = useState<string>("");
  const [rabDataUrl, setRabDataUrl] = useState<string | undefined>(undefined);
  const [rabBlobUrl, setRabBlobUrl] = useState<string | undefined>(undefined);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Live Form Preview Modal
  const [previewOpen, setPreviewOpen] = useState(false);

  // AI Loading & Result States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgressText, setAnalysisProgressText] = useState("");
  const [currentSubmission, setCurrentSubmission] = useState<SubmissionData | null>(null);

  // Post-submit Trigger State (Daftar Dokumen Acuan Terkait)
  const [showReferenceDocsTrigger, setShowReferenceDocsTrigger] = useState(false);

  // Init Programs
  useEffect(() => {
    const list = getUniquePrograms();
    setPrograms(list);
  }, []);

  // Cascading Kegiatans
  useEffect(() => {
    if (!selectedProgram) {
      setKegiatans([]);
      setSelectedKegiatan("");
      setCurrentUnitEselon1("");
      return;
    }
    const kList = getKegiatansForProgram(selectedProgram);
    setKegiatans(kList);
    setSelectedKegiatan("");
    setCurrentUnitEselon1("");
  }, [selectedProgram]);

  // Cascading KROs
  useEffect(() => {
    if (!selectedProgram || !selectedKegiatan) {
      setKros([]);
      setSelectedKro("");
      setCurrentUnitEselon2("");
      setCurrentPrioritas("");
      return;
    }
    const kroList = getKrosForKegiatan(selectedProgram, selectedKegiatan);
    setKros(kroList);
    setSelectedKro("");
    setCurrentUnitEselon2("");
    setCurrentPrioritas("");
  }, [selectedProgram, selectedKegiatan]);

  // Cascading ROs
  useEffect(() => {
    if (!selectedProgram || !selectedKegiatan || !selectedKro) {
      setRos([]);
      setSelectedRo("");
      return;
    }
    const roList = getRosForKro(selectedProgram, selectedKegiatan, selectedKro);
    setRos(roList);
    setSelectedRo("");

    const match = HIERARCHY_DATA.find((h) => h.program === selectedProgram && h.kegiatan === selectedKegiatan && h.kro === selectedKro);
    if (match) {
      setCurrentUnitEselon1(match.unitEselon1);
      setCurrentUnitEselon2(match.unitEselon2);
      setCurrentPrioritas(match.prioritasCheck);
    }
  }, [selectedProgram, selectedKegiatan, selectedKro]);

  // Direct file processor
  const handleDirectFileUpload = (file: File) => {
    setRabFile(file);
    setRabFileName(file.name);
    setUploadError(null);

    if (rabBlobUrl && rabBlobUrl.startsWith("blob:")) {
      URL.revokeObjectURL(rabBlobUrl);
    }
    const blobUrl = URL.createObjectURL(file);
    setRabBlobUrl(blobUrl);

    const reader = new FileReader();
    reader.onload = (event) => {
      setRabDataUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    storePdfBlob(`temp_${file.name}`, file);
    storePdfBlob(file.name, file);
  };

  const handleRabUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleDirectFileUpload(file);
    }
  };

  const handleTorUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = "";
    if (!file) return;

    const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    if (!file.name.toLowerCase().endsWith(".pdf") || new TextDecoder().decode(header) !== "%PDF-") {
      setUploadError("Berkas TOR harus berupa PDF yang valid.");
      return;
    }

    setTorFile(file);
    setTorFileName(file.name);
    setUploadError(null);
    await storePdfBlob(`temp_tor_${file.name}`, file);
    await storePdfBlob(`tor_${file.name}`, file);
  };

  // Reset formulir.
  const handleResetForm = () => {
    setSelectedProgram("");
    setSelectedKegiatan("");
    setSelectedKro("");
    setSelectedRo("");
    setSelectedTahunAnggaran("2026");
    setCurrentUnitEselon1("");
    setCurrentUnitEselon2("");
    setCurrentPrioritas("");
    setFormKategori(RAB_CATEGORY_OPTIONS[0].value);
    setFormDeskripsi(RAB_CATEGORY_OPTIONS[0].description);

    if (rabBlobUrl && rabBlobUrl.startsWith("blob:")) {
      URL.revokeObjectURL(rabBlobUrl);
    }
    setRabBlobUrl(undefined);
    setRabFile(null);
    setRabFileName("");
    setTorFile(null);
    setTorFileName("");
    setRabDataUrl(undefined);
    setCurrentSubmission(null);
    setShowReferenceDocsTrigger(false);
    setUploadError(null);
  };

  // Relevant submissions for stats & table
  const relevantSubmissions = submissions;

  const waitingCount = relevantSubmissions.filter((s) => s.verificationStatus === "Menunggu").length;
  const acceptedCount = relevantSubmissions.filter((s) => s.verificationStatus === "Diterima").length;
  const rejectedCount = relevantSubmissions.filter((s) => s.verificationStatus === "Ditolak").length;

  // Filtered submissions based on 5-field filter form
  const filteredSubmissions = filterSubmissions(relevantSubmissions, appliedFilters);

  // Submit RAB and optional TOR to the local AI engine.
  const handleAiSubmit = async () => {
    if (!selectedProgram || !selectedKegiatan || !selectedKro || !selectedRo || !selectedTahunAnggaran) {
      setUploadError("Harap lengkapi seluruh pilihan hierarki anggaran (Program, Kegiatan, KRO, RO, dan Tahun Anggaran) sebelum mengajukan telaah AI.");
      return;
    }
    if (!rabFile) {
      setUploadError("Wajib mengunggah berkas dokumen PDF RAB sebelum mengajukan telaah AI.");
      return;
    }
    setUploadError(null);
    setIsAnalyzing(true);
    const regLabel = activeRegulations.length > 0 ? activeRegulations.map((r) => r.title).join(" & ") : "PMK Standar Biaya Masukan (SBM)";
    try {
      setAnalysisProgressText(`Mengirim RAB${torFile ? " dan TOR" : ""} ke AI lokal...`);
      const formData = new FormData();
      formData.append("rab_file", rabFile);
      if (torFile) formData.append("tor_file", torFile);
      formData.append("program", selectedProgram);
      formData.append("kegiatan", selectedKegiatan);
      formData.append("kro", selectedKro);
      formData.append("ro", selectedRo);
      formData.append("unit_eselon1", currentUnitEselon1 || "Direktorat Jenderal Komunikasi Publik dan Media");
      formData.append("unit_eselon2", currentUnitEselon2 || "Direktorat Informasi Publik");
      formData.append("prioritas", currentPrioritas || "Prioritas Nasional");
      formData.append("satker_user_id", currentUser.id);

      const apiBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/api/submissions/upload-and-check`, { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Pemeriksaan AI lokal gagal.");
      }

      const criteriaResults = data.ai_criteria_results;
      if (!Array.isArray(criteriaResults) || criteriaResults.length === 0) {
        throw new Error("Hasil pemeriksaan RAB dari server tidak lengkap.");
      }
      const analysis: RabAnalysisResult = {
        aiStatus: data.ai_status,
        aiScore: data.ai_score,
        aiReason: data.ai_reason,
        aiRecommendation: data.ai_recommendation,
        criteriaResults,
        activeRegulationTitle: data.activeRegulationTitle || regLabel,
        ticketNumber: data.ticket_number,
      };
      const torAnalysis = data.torAnalysis;
      if (torFile && (!torAnalysis || !Array.isArray(torAnalysis.criteriaResults))) {
        throw new Error("Hasil pemeriksaan TOR dari server tidak lengkap.");
      }

      const nowFormatted = formatIndonesianDateTime();
      const userLabel = `${currentUser.name} (${currentUser.id})`;
      const refDocs = [
        activeRegulations[0]?.title || "Peraturan Menteri Keuangan tentang Standar Biaya Masukan",
        "Petunjuk Teknis Penyusunan Dokumen RKA-K/L dan Rincian Anggaran Biaya Kementerian Komunikasi dan Digital RI",
        "Bagan Akun Standar (BAS) 6 Digit Belanja Operasional & Non-Operasional Perbendaharaan RI",
      ];
      const newSubmission: SubmissionData = {
        id: `SUB-${Date.now()}`,
        ticketNumber: analysis.ticketNumber || `RAB/KOMDIGI/${selectedTahunAnggaran}/${Math.floor(100 + Math.random() * 900)}`,
        satkerUserId: currentUser.id,
        satkerUserName: currentUser.name,
        satkerUnit: currentUser.unit,
        submittedAt: nowFormatted,
        program: selectedProgram,
        kegiatan: selectedKegiatan,
        kro: selectedKro,
        ro: selectedRo,
        tahunAnggaran: selectedTahunAnggaran,
        unitEselon1: currentUnitEselon1 || "Direktorat Jenderal Komunikasi Publik dan Media",
        unitEselon2: currentUnitEselon2 || "Direktorat Informasi Publik",
        prioritas: currentPrioritas || "Prioritas Nasional",
        rabFileName,
        rabFileSize: formatFileSize(rabFile.size),
        torFileName: torFile?.name,
        torAiStatus: torAnalysis?.aiStatus,
        torAiScore: torAnalysis?.aiScore,
        torAiReason: torAnalysis?.aiReason,
        torAiRecommendation: torAnalysis?.aiRecommendation,
        torCriteriaResults: torAnalysis?.criteriaResults,
        pdfDataUrl: rabBlobUrl || rabDataUrl,
        activeRegulationTitle: analysis.activeRegulationTitle || regLabel,
        kategori: formKategori || "Kategori 1",
        deskripsi: formDeskripsi.trim(),
        kategori1: formKategori || "Kategori 1",
        kategori2: "",
        kategori3: "",
        createdBy: userLabel,
        updatedBy: userLabel,
        auditTrail: [
          {
            action: "CREATE",
            performedBy: userLabel,
            timestamp: nowFormatted,
            details: `Pendaftaran berkas RAB PDF${torFile ? ` dan TOR PDF: ${torFile.name}` : ""}: ${rabFileName}`,
          },
        ],
        referenceDocuments: refDocs,
        aiStatus: analysis.aiStatus,
        aiScore: analysis.aiScore,
        aiReason: analysis.aiReason,
        aiRecommendation: analysis.aiRecommendation,
        criteriaResults: analysis.criteriaResults,
        verificationStatus: "Menunggu",
        verifikatorNotes: "",
        reviewHistory: [{ verifiedAt: nowFormatted, verificationStatus: "Menunggu", rabFileName }],
      };

      await storePdfBlob(newSubmission.id, rabFile);
      await storePdfBlob(newSubmission.ticketNumber, rabFile);
      await storePdfBlob(newSubmission.rabFileName, rabFile);
      if (torFile) {
        await storePdfBlob(`tor_${newSubmission.id}`, torFile);
      }
      onAddSubmission(newSubmission);
      setCurrentSubmission(newSubmission);
      setShowReferenceDocsTrigger(true);
      setIsResultsCollapsed(false);
      window.alert("Data pengajuan RAB berhasil disimpan.");
      onSelectMenu?.("satker_list");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Pemeriksaan dokumen oleh AI lokal gagal.", error);
      setUploadError(error instanceof Error ? error.message : "Pemeriksaan AI lokal gagal. Pastikan backend dan vLLM aktif.");
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgressText("");
    }
  };

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* Top Banner - Hanya muncul pada sub-tab list */}
      {activeRabSubTab === "list" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-slate-900 dark:text-slate-100 shadow-sm transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-1.5">
                <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Portal Satuan Kerja (Satker)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Daftar Dokumen RAB &amp; Riwayat Pengajuan</h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
                Pantau status verifikasi dokumen RAB, filter berdasarkan jenis dokumen, status, tahun anggaran dan bulan, serta kelola tindakan CRUD berkas.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-right shadow-2xs shrink-0">
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-semibold uppercase tracking-wider">Satker Pengusul:</span>
              <span className="font-bold text-slate-900 dark:text-white block text-sm mt-0.5">{currentUser.name}</span>
              <span className="text-slate-500 dark:text-slate-400 text-xs font-mono mt-0.5 block">ID (8 Digit): {currentUser.id}</span>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar indicating Active Sub-view from Sidebar with Status Counters - Hanya muncul pada sub-tab list */}
      {activeRabSubTab === "list" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 text-xs font-bold shadow-2xs">
              <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Sub Menu: Daftar &amp; Riwayat Dokumen RAB ({submissions.length} Berkas)</span>
            </div>
          </div>

          {/* Quick status counters */}
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Menunggu: <strong>{waitingCount}</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Diterima: <strong>{acceptedCount}</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Ditolak: <strong>{rejectedCount}</strong>
            </span>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* 1. VIEW SUB-TAB: DAFTAR & RIWAYAT RAB */}
      {/* ================================================================== */}
      {activeRabSubTab === "list" && (
        <div className="space-y-10 sm:space-y-12 animate-fadeIn">
          {/* SECTION 1: PEMBAHASAN 1 • RINGKASAN STATUS VERIFIKASI BERKAS PDF (TETAP SAMA) */}
          <div className="relative bg-white dark:bg-slate-900 border-2 border-cyan-500 dark:border-cyan-500 rounded-2xl p-6 sm:p-8 pt-8 sm:pt-9 shadow-sm space-y-6 sm:space-y-7 transition-all">
            {/* Outline Label Badge */}
            <div className="absolute -top-3.5 left-5 sm:left-6 z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border bg-cyan-600 text-white border-cyan-400 select-none">
              <FileCheck className="w-3.5 h-3.5" />
              <span>PEMBAHASAN 1 &bull; RINGKASAN STATUS VERIFIKASI BERKAS PDF</span>
            </div>

            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>1. Ringkasan Status Verifikasi Berkas Dokumen PDF RAB</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Statistik keseluruhan dokumen RAB yang diajukan beserta status kelolosan telaah verifikator</p>
              </div>

              <button
                type="button"
                onClick={() => setIsPembahasan1Collapsed(!isPembahasan1Collapsed)}
                className="h-8 px-3 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold"
                title={isPembahasan1Collapsed ? "Perluas Pembahasan 1" : "Minimize Pembahasan 1"}
              >
                <span>{isPembahasan1Collapsed ? "Perluas" : "Minimize"}</span>
                {isPembahasan1Collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {!isPembahasan1Collapsed && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
                {/* 1. Total Berkas PDF */}
                <div className="p-5 rounded-2xl border bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 shadow-2xs select-none">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Berkas PDF</span>
                    <FileSpreadsheet className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{relevantSubmissions.length}</div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Seluruh dokumen yang diinput</span>
                </div>

                {/* 2. Menunggu Verifikasi */}
                <div className="p-5 rounded-2xl border bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 shadow-2xs select-none">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Menunggu Verifikasi</span>
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">{waitingCount}</div>
                  <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1 block">Menunggu proses telaah</span>
                </div>

                {/* 3. Diterima */}
                <div className="p-5 rounded-2xl border bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 shadow-2xs select-none">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Diterima / Disetujui</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{acceptedCount}</div>
                  <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1 block">Memenuhi SBM &amp; disahkan DIPA</span>
                </div>

                {/* 4. Ditolak */}
                <div className="p-5 rounded-2xl border bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 shadow-2xs select-none">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wide">Ditolak / Perlu Revisi</span>
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">{rejectedCount}</div>
                  <span className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-1 block">Perlu perbaikan dari Satker</span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: PEMBAHASAN 2 • TABEL INFORMASI DOKUMEN PDF & FORM FILTER PENCARIAN DOKUMEN */}
          <div className="relative bg-white dark:bg-slate-900 border-2 border-blue-500 dark:border-blue-500 rounded-2xl p-6 sm:p-8 pt-8 sm:pt-9 shadow-sm space-y-6 sm:space-y-7 transition-all">
            {/* Outline Label Badge */}
            <div className="absolute -top-3.5 left-5 sm:left-6 z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border bg-blue-600 text-white border-blue-400 select-none">
              <FileText className="w-3.5 h-3.5" />
              <span>PEMBAHASAN 2 &bull; TABEL INFORMASI DOKUMEN PDF RAB</span>
            </div>

            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>2. Tabel Informasi Dokumen PDF Berdasarkan Status &amp; Aksi CRUD</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Gunakan form filter pencarian, kelola berkas dengan tombol aksi CRUD, dan pantau history pembuat (Create) serta pembaru (Update) berkas.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => onSelectMenu?.("satker_form")}
                    className="h-9 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer inline-flex items-center gap-2 text-xs font-bold"
                    title="Buka Form Pengajuan RAB Baru"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Pengajuan Baru</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsPembahasan2Collapsed(!isPembahasan2Collapsed)}
                  className="h-8 px-3 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  title={isPembahasan2Collapsed ? "Perluas Tabel" : "Minimize Tabel"}
                >
                  <span>{isPembahasan2Collapsed ? "Perluas" : "Minimize"}</span>
                  {isPembahasan2Collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isPembahasan2Collapsed && (
              <div className="space-y-6 animate-fadeIn">
                <SubmissionFilterPanel
                  filters={filterValues}
                  resultCount={filteredSubmissions.length}
                  totalCount={relevantSubmissions.length}
                  onChange={handleFilterChange}
                  onReset={handleResetFilter}
                  onApply={handleApplyFilter}
                />

                <SubmissionTable
                  submissions={filteredSubmissions}
                  isReadOnly={isReadOnly}
                  onOpenCrudHistory={setHistoryLogItem}
                  onOpenReviewHistory={handleOpenReviewHistory}
                  onOpenDetails={setSelectedDetailSubmission}
                  onPreview={setHistoryPreviewItem}
                  onEdit={handleOpenEdit}
                  onDelete={setDeleteCandidate}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* VIEW SUB-TAB: HISTORI REVIU BERKAS */}
      {/* ================================================================== */}
      {activeRabSubTab === "history" && reviewHistorySubmission && (
        <section className="space-y-8 sm:space-y-10 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 min-w-0">
              <button
                type="button"
                onClick={handleBackToDaftarRab}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer border border-slate-200 dark:border-slate-700 self-start sm:self-auto shrink-0"
                title="Kembali ke Daftar Dokumen RAB"
              >
                <ArrowLeft className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Kembali ke Daftar RAB</span>
              </button>

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-mono text-xs font-extrabold text-cyan-700 dark:text-cyan-400">{reviewHistorySubmission.ticketNumber}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">&bull; Diajukan {reviewHistorySubmission.submittedAt}</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5 truncate max-w-2xl" title={reviewHistorySubmission.rabFileName}>
                  {reviewHistorySubmission.rabFileName}
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold">
                <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Histori Reviu
              </div>
              {(activeRole === "satker" || activeRole === "superadmin") && latestHistoryEntry?.verificationStatus === "Ditolak" && (
                <button
                  type="button"
                  onClick={() => handleOpenRabReupload(reviewHistorySubmission)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white border border-amber-500 text-xs font-bold transition-colors cursor-pointer"
                  title="Upload PDF perbaikan untuk reviu terakhir yang ditolak"
                >
                  <Upload className="w-4 h-4" />
                  Upload Perbaikan RAB
                </button>
              )}
            </div>
          </div>

          <div className="relative bg-white dark:bg-slate-900 border-2 border-blue-500 dark:border-blue-500 rounded-2xl p-5 sm:p-7 pt-7 sm:pt-8 shadow-sm transition-all">
            <div className="absolute -top-3.5 left-5 sm:left-6 z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border bg-blue-600 text-white border-blue-400 select-none">
              <History className="w-3.5 h-3.5" />
              <span>HISTORI REVIU DOKUMEN RAB</span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/95 dark:bg-slate-800/95 border-b-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 uppercase font-black tracking-wider text-xs">
                    <tr>
                      <th className="px-4 py-4 w-16 text-center">No</th>
                      <th className="px-4 py-4">File RAB</th>
                      <th className="px-4 py-4">Tanggal Verifikasi</th>
                      <th className="px-4 py-4">Status Verifikasi</th>
                      <th className="px-4 py-4 text-center">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {getReviewHistory(reviewHistorySubmission).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-14 text-slate-400 dark:text-slate-500">
                          <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="font-bold text-xs">Belum ada histori reviu untuk berkas ini.</p>
                        </td>
                      </tr>
                    ) : (
                      getReviewHistory(reviewHistorySubmission).map((entry, index) => {
                        const canVerify = (activeRole === "superadmin" || activeRole === "verifikator") && entry.verificationStatus.trim().toLowerCase() === "menunggu";
                        return (
                        <tr key={`${entry.verifiedAt}-${index}`} className="hover:bg-sky-50/80 dark:hover:bg-slate-800/70 border-b border-slate-100 dark:border-slate-800/80 transition-colors">
                          <td className="px-4 py-4 text-center font-mono font-medium text-slate-400">{index + 1}</td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200 dark:border-rose-900 shrink-0">
                                <FileSpreadsheet className="w-4 h-4" />
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white">{entry.rabFileName || reviewHistorySubmission.rabFileName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">{entry.verifiedAt}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${entry.verificationStatus === "Diterima" ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" : entry.verificationStatus === "Menunggu" ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"}`}>
                              {entry.verificationStatus === "Diterima" ? <CheckCircle2 className="w-3.5 h-3.5" /> : entry.verificationStatus === "Menunggu" ? <Clock className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                              {entry.verificationStatus}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenReviewHistoryDetail(index)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-colors cursor-pointer"
                              title={canVerify ? "Verifikasi reviu ini" : "Lihat rincian hasil verifikator pada reviu ini"}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {canVerify ? "Verifikasi" : "Detail"}
                            </button>
                          </td>
                        </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeRabSubTab === "history_detail" && historicalReviewSubmission && (
        <section className="space-y-6 sm:space-y-8 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBackToReviewHistory}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Kembali ke Histori Reviu</span>
            </button>
          </div>
          <VerifikatorView
            currentUser={currentUser}
            onUpdateSubmission={onUpdateSubmission || (() => undefined)}
            permission="V"
            allowHistoricalStatusEdit={activeRole === "superadmin" || activeRole === "verifikator"}
            onHistoricalReviewChange={handleHistoricalReviewChange}
            showFinalDecision={activeRole === "satker" || activeRole === "superadmin" || activeRole === "verifikator"}
            regulations={regulations}
            reviewDetailSnapshot={historicalReviewSubmission}
          />
        </section>
      )}

      {activeRabSubTab === "reupload" && reuploadSubmission && (
        <section className="space-y-6 animate-fadeIn">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isReuploadAnalyzing}
              onClick={() => {
                setReuploadSubmission(null);
                setReuploadFile(null);
                setActiveRabSubTab("list");
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Kembali ke Daftar RAB
            </button>
            <span className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-400">{reuploadSubmission.ticketNumber}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-2xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upload Perbaikan RAB</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Unggah PDF pengganti untuk dokumen yang ditolak.</p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4">
              <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">Dokumen saat ini</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 break-all">{reuploadSubmission.rabFileName}</p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-5">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{reuploadFile?.name || "Pilih dokumen PDF perbaikan"}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Format PDF</p>
              </div>
              <label htmlFor="rab-reupload-input" className={`shrink-0 h-10 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-2 ${isReuploadAnalyzing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                <Upload className="w-4 h-4" />
                Pilih PDF
              </label>
              <input id="rab-reupload-input" type="file" accept="application/pdf,.pdf" onChange={handleReuploadFileChange} disabled={isReuploadAnalyzing} className="hidden" />
            </div>

            {reuploadError && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{reuploadError}</span>
              </div>
            )}

            {isReuploadAnalyzing && (
              <div className="flex items-center gap-2 text-xs font-medium text-cyan-700 dark:text-cyan-300" role="status">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{reuploadProgressText || "Memeriksa RAB dengan AI (LLM)..."}</span>
              </div>
            )}

            <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-5">
              <button type="button" onClick={handleSaveRabReupload} disabled={!reuploadFile || isReuploadAnalyzing} className="h-10 px-5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold inline-flex items-center gap-2">
                {isReuploadAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                {isReuploadAnalyzing ? reuploadProgressText || "Memeriksa dengan AI..." : "Periksa & Kirim Ulang dengan AI (LLM)"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ================================================================== */}
      {/* 2. VIEW SUB-TAB: FORM PENGAJUAN RAB BARU */}
      {/* ================================================================== */}
      {activeRabSubTab === "form" && (
        <div className="space-y-10 sm:space-y-12 animate-fadeIn">
          {/* GABUNGAN PEMBAHASAN 1 & PEMBAHASAN 2 MENJADI SATU KESATUAN FORM */}
          <div className="relative bg-white dark:bg-slate-900 border-2 border-cyan-500 dark:border-cyan-500 rounded-2xl p-6 sm:p-8 pt-8 sm:pt-9 shadow-sm space-y-6 sm:space-y-7 transition-all">
            {/* Outline Label Badge Terpadu */}
            <div className="absolute -top-3.5 left-5 sm:left-6 z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border bg-cyan-600 text-white border-cyan-400 select-none">
              <Upload className="w-3.5 h-3.5" />
              <span>PEMBAHASAN TERPADU &bull; FORMULIR TELAAH DOKUMEN TOR DAN RAB</span>
            </div>

            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Formulir Terpadu Hierarki Anggaran &amp; Berkas PDF TOR/RAB</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Lengkapi hierarki anggaran, unggah RAB dan TOR (opsional), lalu kirim untuk penelaahan AI lokal.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsUnifiedFormCollapsed(!isUnifiedFormCollapsed)}
                className="h-8 px-3 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold"
                title={isUnifiedFormCollapsed ? "Perluas Formulir" : "Minimize Formulir"}
              >
                <span>{isUnifiedFormCollapsed ? "Perluas" : "Minimize"}</span>
                {isUnifiedFormCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {!isUnifiedFormCollapsed && (
              <div className="space-y-6 animate-fadeIn">
                {/* SUB-SECTION A: HIERARKI ANGGARAN RKA-K/L (CASCADING DROPDOWN) */}
                <div className="p-5 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-4">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide block">A. Parameter Hierarki Anggaran RKA-K/L (Cascading)</span>

                  <div className="flex flex-col space-y-4">
                    {/* a. Program */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        a. Program <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="select-program"
                          value={selectedProgram}
                          onChange={(e) => setSelectedProgram(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white appearance-none pr-8 font-medium shadow-2xs"
                        >
                          <option value="" disabled>
                            -- Pilih Program Anggaran --
                          </option>
                          {programs.map((prog) => (
                            <option key={prog} value={prog} className="dark:bg-slate-800 dark:text-white">
                              {prog}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* b. Kegiatan */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        b. Kegiatan <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="select-kegiatan"
                          value={selectedKegiatan}
                          onChange={(e) => setSelectedKegiatan(e.target.value)}
                          disabled={!selectedProgram || kegiatans.length === 0}
                          className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white appearance-none pr-8 font-medium disabled:opacity-50 shadow-2xs"
                        >
                          <option value="" disabled>
                            -- Pilih Kegiatan --
                          </option>
                          {kegiatans.map((item) => (
                            <option key={item.kegiatan} value={item.kegiatan} className="dark:bg-slate-800 dark:text-white">
                              {item.kegiatan}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* c. KRO */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        c. Klasifikasi Rincian Output (KRO) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="select-kro"
                          value={selectedKro}
                          onChange={(e) => setSelectedKro(e.target.value)}
                          disabled={!selectedKegiatan || kros.length === 0}
                          className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white appearance-none pr-8 font-medium disabled:opacity-50 shadow-2xs"
                        >
                          <option value="" disabled>
                            -- Pilih KRO --
                          </option>
                          {kros.map((item) => (
                            <option key={item.kro} value={item.kro} className="dark:bg-slate-800 dark:text-white">
                              {item.kro}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* d. RO */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        d. Rincian Output (RO) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="select-ro"
                          value={selectedRo}
                          onChange={(e) => setSelectedRo(e.target.value)}
                          disabled={!selectedKro || ros.length === 0}
                          className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white appearance-none pr-8 font-medium disabled:opacity-50 shadow-2xs"
                        >
                          <option value="" disabled>
                            -- Pilih RO --
                          </option>
                          {ros.map((item) => (
                            <option key={item} value={item} className="dark:bg-slate-800 dark:text-white">
                              {item}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* e. Tahun Anggaran */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        e. Tahun Anggaran <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="input-tahun-anggaran"
                        type="text"
                        value={selectedTahunAnggaran}
                        onChange={(e) => setSelectedTahunAnggaran(e.target.value)}
                        placeholder="Contoh: 2026"
                        className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white font-medium shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Info Box Hierarchy */}
                  {(currentUnitEselon1 || currentUnitEselon2 || currentPrioritas) && (
                    <div className="p-3.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Unit Eselon I:</span>
                        <span className="text-slate-800 dark:text-slate-200 font-medium truncate block">{currentUnitEselon1 || "-"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Unit Eselon II:</span>
                        <span className="text-slate-800 dark:text-slate-200 font-medium truncate block">{currentUnitEselon2 || "-"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Prioritas:</span>
                        <span className="font-bold text-amber-700 dark:text-amber-400 block">{currentPrioritas || "Bukan Prioritas Nasional"}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* SUB-SECTION B: KLASIFIKASI KATEGORI & DESKRIPSI USULAN RAB */}
                <div className="p-5 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">B. Klasifikasi Kategori Usulan RAB</span>
                    </div>
                    <span className="text-[11px] text-cyan-700 dark:text-cyan-300 font-semibold bg-cyan-100/80 dark:bg-cyan-950/70 px-2.5 py-0.5 rounded-full border border-cyan-300 dark:border-cyan-800 w-fit">
                      Deskripsi otomatis terisi sesuai kategori yang dipilih
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Kategori (Dropdown pilihan: 4 Kategori RO) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Kategori <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="select-kategori"
                          value={formKategori}
                          onChange={(e) => handleCategoryChange(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white appearance-none pr-8 font-semibold shadow-2xs cursor-pointer"
                        >
                          {RAB_CATEGORY_OPTIONS.map((cat) => (
                            <option key={cat.value} value={cat.value} className="dark:bg-slate-800 dark:text-white">
                              {cat.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-normal">
                        Pilih kategori untuk memuat deskripsi klasifikasi RO secara otomatis.
                      </p>
                    </div>

                    {/* Deskripsi (Otomatis terisi & tidak bisa diedit) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Deskripsi <span className="text-slate-400 font-normal lowercase">(otomatis terisi)</span>
                      </label>
                      <div
                        id="view-deskripsi"
                        className="w-full min-h-[96px] p-3.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 shadow-2xs leading-relaxed select-text"
                      >
                        <p>{formDeskripsi || "Pilih kategori untuk memuat deskripsi..."}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SUB-SECTION C: UNGGAH BERKAS DOKUMEN PDF RAB */}
                <div className="p-5 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide block">C. Unggah Berkas Dokumen PDF RAB</span>
                    <span className="text-[11px] text-slate-400 font-medium">Format: .pdf</span>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5 bg-white dark:bg-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                          rabFile
                            ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                        }`}
                      >
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{rabFileName || "Belum ada berkas PDF dipilih"}</span>
                          {rabFile ? (
                            <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] rounded-full font-mono font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {formatFileSize(rabFile.size, 2)} &bull; PDF Terpilih
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[10px] rounded-full font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Wajib Unggah PDF
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pilih dokumen PDF RAB resmi Satker Anda untuk diperiksa kepatuhan tarif dan kalkulasi anggarannya.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
                      <label
                        htmlFor="rab-file-upload-input"
                        className="h-10 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-2xs inline-flex items-center justify-center gap-2"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>{rabFile ? "Ganti Berkas PDF" : "Pilih Berkas PDF"}</span>
                      </label>
                      <input id="rab-file-upload-input" type="file" accept=".pdf" onChange={handleRabUpload} className="hidden" />

                      {rabFile && (
                        <button
                          type="button"
                          onClick={() => setPreviewOpen(true)}
                          className="h-10 px-4 bg-sky-50 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700 hover:bg-cyan-100 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Preview PDF</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">D. Unggah TOR (Opsional)</span>
                    <span className="text-[11px] text-slate-400 font-medium">PDF dengan teks yang dapat diekstrak</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {torFileName || "Belum ada dokumen TOR"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Jika diunggah, TOR akan ditelaah dengan kriteria terpisah dan disimpan bersama hasil RAB.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {torFile && (
                        <>
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-300">{formatFileSize(torFile.size)}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setTorFile(null);
                              setTorFileName("");
                            }}
                            className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                          >
                            Hapus TOR
                          </button>
                        </>
                      )}
                      <label
                        htmlFor="tor-file-upload-input"
                        className="h-9 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-2"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {torFile ? "Ganti TOR" : "Pilih TOR"}
                      </label>
                      <input
                        id="tor-file-upload-input"
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleTorUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {uploadError && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* ACTION BUTTONS */}
                {/* Aturan Spesifik: Tombol Hapus/Reset Formulir HANYA MUNCUL setelah user selesai memilih berkas PDF */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    {rabFile !== null ? (
                      <button
                        id="btn-satker-reset"
                        type="button"
                        onClick={handleResetForm}
                        className="h-11 sm:h-12 px-5 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-300 dark:border-slate-700 hover:border-rose-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-98 shadow-2xs cursor-pointer animate-fadeIn"
                        title="Hapus / Reset Formulir (muncul setelah memilih berkas PDF)"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                        <span>Hapus / Reset Formulir</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Tombol reset formulir akan muncul setelah Anda memilih berkas PDF.</span>
                    )}
                  </div>

                  <button
                    id="btn-satker-submit"
                    type="button"
                    disabled={isAnalyzing}
                    onClick={handleAiSubmit}
                    className="h-11 sm:h-12 px-6 sm:px-8 bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2.5 shadow-md shadow-cyan-600/30 hover:shadow-lg active:scale-98 transition-all disabled:opacity-60 cursor-pointer ring-1 ring-cyan-500"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{analysisProgressText || "Memproses Pengecekan AI..."}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Submit &amp; Periksa RAB dengan AI (LLM)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI Loading Progress Banner */}
          {isAnalyzing && (
            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 shadow-xs transition-colors">
              <div className="inline-flex p-4 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 mb-2">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Engine AI LLM Sedang Menelaah Dokumen RAB</h3>
              <p className="text-xs text-cyan-700 dark:text-cyan-400 font-mono animate-pulse">{analysisProgressText}</p>
              <div className="max-w-md mx-auto bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full w-3/4 animate-pulse rounded-full" />
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TRIGGER POST-SUBMIT: DAFTAR DOKUMEN ACUAN TERKAIT BERKAS PDF  */}
          {/* MUNCUL KETIKA PENGAJUAN TELAH BERHASIL DILAKUKAN              */}
          {/* ------------------------------------------------------------- */}
          {showReferenceDocsTrigger && currentSubmission && (
            <div
              id="post-submit-reference-section"
              className="relative bg-emerald-50/70 dark:bg-emerald-950/40 border-2 border-emerald-500 dark:border-emerald-600 rounded-2xl p-6 sm:p-8 pt-8 sm:pt-9 shadow-sm space-y-5 animate-fadeIn"
            >
              {/* Outline Label Badge */}
              <div className="absolute -top-3.5 left-5 sm:left-6 z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border bg-emerald-600 text-white border-emerald-400 select-none">
                <BookOpen className="w-3.5 h-3.5" />
                <span>POST-SUBMIT TRIGGER &bull; DOKUMEN ACUAN TERKAIT BERKAS PDF</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-emerald-200/80 dark:border-emerald-800/80">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Pengajuan Berhasil &bull; Tiket {currentSubmission.ticketNumber}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      Berkas PDF "{currentSubmission.rabFileName}" telah terdaftar. Berikut adalah daftar dokumen acuan regulasi resmi terkait:
                    </p>
                  </div>
                </div>

                {onSelectMenu && (
                  <button
                    type="button"
                    onClick={() => onSelectMenu("satker_list")}
                    className="h-10 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all shrink-0"
                  >
                    <span>Lihat di Daftar RAB</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* List of Related Reference Documents */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider block">Daftar Dokumen Acuan Terkait Berkas PDF yang Baru Diunggah:</span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(currentSubmission.referenceDocuments || []).map((doc, idx) => (
                    <div key={idx} className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-start gap-3 shadow-2xs">
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                        <Scale className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block leading-snug">{doc}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 block">Dokumen Regulasi Acuan AI</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AI Results Section */}
          {currentSubmission && !isAnalyzing && (
            <div
              id="ai-results-section"
              className="relative bg-white dark:bg-slate-900 border-2 border-amber-500 dark:border-amber-500 rounded-2xl p-6 sm:p-8 pt-8 sm:pt-9 shadow-sm space-y-6 animate-fadeIn"
            >
              {/* Outline Label Badge */}
              <div className="absolute -top-3.5 left-5 sm:left-6 z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border bg-amber-600 text-white border-amber-400 select-none">
                <Sparkles className="w-3.5 h-3.5" />
                <span>HASIL PENELAAHAN AI LOKAL &bull; RAB DAN TOR</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Laporan Evaluasi Penapisan AI Dokumen RAB</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tiket: {currentSubmission.ticketNumber} &bull; Skor: {currentSubmission.aiScore}% ({currentSubmission.aiStatus})
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsResultsCollapsed(!isResultsCollapsed)}
                    className="h-9 px-3 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                  >
                    <span>{isResultsCollapsed ? "Perluas" : "Minimize"}</span>
                    {isResultsCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!isResultsCollapsed && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                    <div>
                      <strong className="text-slate-900 dark:text-white">Alasan AI: </strong>
                      <span className="text-slate-700 dark:text-slate-300">{currentSubmission.aiReason}</span>
                    </div>
                    {currentSubmission.aiRecommendation && (
                      <div>
                        <strong className="text-slate-900 dark:text-white">Rekomendasi AI: </strong>
                        <span className="text-slate-700 dark:text-slate-300 whitespace-pre-line">{currentSubmission.aiRecommendation}</span>
                      </div>
                    )}
                  </div>

                  {/* 20 Criteria Preview List */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold sticky top-0">
                        <tr>
                          <th className="px-4 py-3 w-12 text-center">No</th>
                          <th className="px-4 py-3">Kriteria Wajib SBM</th>
                          <th className="px-4 py-3 w-28 text-center">Hasil AI</th>
                          <th className="px-4 py-3">Catatan Bukti AI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {currentSubmission.criteriaResults.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                            <td className="px-4 py-2.5 text-center font-mono text-slate-400">{c.id}</td>
                            <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">{c.text}</td>
                            <td className="px-4 py-2.5 text-center">
                              {c.status === "passed" ? (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold">Lolos</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[11px] font-bold">Ditolak</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{c.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {currentSubmission.torFileName && currentSubmission.torCriteriaResults && (
                    <section className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-5">
                      <div>
                        <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                          Telaah TOR: {currentSubmission.torFileName}
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Skor {currentSubmission.torAiScore}% ({currentSubmission.torAiStatus}) &bull; {currentSubmission.torCriteriaResults.length} kriteria
                        </p>
                      </div>
                      {currentSubmission.torAiReason && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                          <strong className="text-slate-900 dark:text-white">Temuan TOR: </strong>
                          <span className="text-slate-700 dark:text-slate-300">{currentSubmission.torAiReason}</span>
                          {currentSubmission.torAiRecommendation && (
                            <p className="mt-2 whitespace-pre-line">
                              <strong className="text-slate-900 dark:text-white">Rekomendasi: </strong>
                              {currentSubmission.torAiRecommendation}
                            </p>
                          )}
                        </div>
                      )}
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold sticky top-0">
                            <tr>
                              <th className="px-4 py-3 w-12 text-center">No</th>
                              <th className="px-4 py-3">Kriteria TOR</th>
                              <th className="px-4 py-3 w-28 text-center">Hasil AI</th>
                              <th className="px-4 py-3">Catatan Bukti AI</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {currentSubmission.torCriteriaResults.map((criterion) => (
                              <tr key={criterion.id}>
                                <td className="px-4 py-2.5 text-center font-mono text-slate-400">{criterion.id}</td>
                                <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">{criterion.text}</td>
                                <td className="px-4 py-2.5 text-center">
                                  {criterion.status === "passed" ? (
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold">Lolos</span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[11px] font-bold">Perlu telaah</span>
                                  )}
                                </td>
                                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{criterion.notes}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL: DETAIL SUBMISSION (READ)                                     */}
      {/* ================================================================== */}
      {selectedDetailSubmission && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-slate-900 dark:text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 border border-cyan-200 dark:border-cyan-800">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold">Informasi Detail Dokumen RAB</h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 font-bold">
                      {selectedDetailSubmission.ticketNumber}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Diajukan pada {selectedDetailSubmission.submittedAt} &bull; {selectedDetailSubmission.satkerUserName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailSubmission(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Status Banner */}
              <div className="p-4 rounded-xl border flex items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status Verifikasi:</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white mt-0.5 block">{selectedDetailSubmission.verificationStatus}</span>
                  {selectedDetailSubmission.verifikatorNotes && <p className="text-slate-600 dark:text-slate-300 mt-1">Catatan: {selectedDetailSubmission.verifikatorNotes}</p>}
                </div>
                {(() => {
                  const detailCriteria = Array.isArray(selectedDetailSubmission.criteriaResults) ? selectedDetailSubmission.criteriaResults : [];
                  const detailTotal = detailCriteria.length > 0 ? detailCriteria.length : 20;
                  const detailPassed = detailCriteria.length > 0
                    ? detailCriteria.filter((c) => c.status === "passed").length
                    : (selectedDetailSubmission.aiScore !== undefined ? Math.round((selectedDetailSubmission.aiScore / 100) * detailTotal) : (selectedDetailSubmission.aiStatus === "LOLOS" ? 20 : 0));
                  return (
                    <span
                      className={`px-3 py-1 rounded-full font-bold text-xs ${
                        selectedDetailSubmission.aiStatus === "LOLOS"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                      }`}
                    >
                      AI: {selectedDetailSubmission.aiStatus} ({detailPassed}/{detailTotal})
                    </span>
                  );
                })()}
              </div>

              {selectedDetailSubmission.torFileName && (
                <section className="p-4 rounded-xl border border-violet-200 dark:border-violet-900 bg-violet-50/60 dark:bg-violet-950/20 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-900 dark:text-white">Dokumen TOR: {selectedDetailSubmission.torFileName}</h4>
                  <p className="text-slate-700 dark:text-slate-300">
                    Hasil telaah: {selectedDetailSubmission.torAiStatus || "Tidak tersedia"}
                    {typeof selectedDetailSubmission.torAiScore === "number" ? ` (${selectedDetailSubmission.torAiScore}%)` : ""}
                  </p>
                  {selectedDetailSubmission.torAiReason && <p className="text-slate-600 dark:text-slate-400">{selectedDetailSubmission.torAiReason}</p>}
                  {selectedDetailSubmission.torCriteriaResults && (
                    <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 space-y-1">
                      {selectedDetailSubmission.torCriteriaResults.map((criterion) => (
                        <li key={criterion.id}>
                          <strong>{criterion.status === "passed" ? "Lolos" : "Perlu telaah"}:</strong> {criterion.text} — {criterion.notes}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {/* Hierarchy and Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block text-[11px]">Hierarki Anggaran RKA-K/L</span>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Program:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">{selectedDetailSubmission.program}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Kegiatan:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">{selectedDetailSubmission.kegiatan}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">KRO &bull; RO:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                      {selectedDetailSubmission.kro} &bull; {selectedDetailSubmission.ro}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tahun Anggaran:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{selectedDetailSubmission.tahunAnggaran || "2026"}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block text-[11px]">Klasifikasi Kategori &amp; User Logging</span>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Kategori:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{selectedDetailSubmission.kategori || selectedDetailSubmission.kategori1 || "-"}</span>
                  </div>
                  {selectedDetailSubmission.deskripsi && (
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Deskripsi:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">{selectedDetailSubmission.deskripsi}</span>
                    </div>
                  )}
                  {selectedDetailSubmission.kategori2 && (
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Kategori 2 (Lama):</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">{selectedDetailSubmission.kategori2}</span>
                    </div>
                  )}
                  {selectedDetailSubmission.kategori3 && (
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Kategori 3 (Lama):</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">{selectedDetailSubmission.kategori3}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Created By:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{selectedDetailSubmission.createdBy || selectedDetailSubmission.satkerUserName}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedDetailSubmission(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL: EDIT DOKUMEN (UPDATE CRUD)                                  */}
      {/* ================================================================== */}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden transition-colors">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-slate-900 dark:text-white">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-base font-bold">Edit Metadata Dokumen RAB</h3>
              </div>
              <button type="button" onClick={() => setEditItem(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Dokumen PDF</label>
                <input
                  type="text"
                  value={editFileName}
                  onChange={(e) => setEditFileName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
                  <select
                    value={editKategori}
                    onChange={(e) => handleEditKategoriChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium cursor-pointer"
                  >
                    {RAB_CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tahun Anggaran</label>
                  <input
                    type="text"
                    value={editTahunAnggaran}
                    onChange={(e) => setEditTahunAnggaran(e.target.value)}
                    placeholder="Contoh: 2026"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi <span className="text-slate-400 font-normal lowercase">(otomatis terisi)</span>
                </label>
                <div className="w-full p-3 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed min-h-[72px] select-text">
                  <p>{editDeskripsi || "Pilih kategori untuk memuat deskripsi..."}</p>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400">
                Pembaruan ini akan dicatat ke dalam log history dengan akun pembaru: <strong className="text-slate-800 dark:text-slate-200">{currentUser.name}</strong>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL: KONFIRMASI HAPUS DOKUMEN (DELETE CRUD)                      */}
      {/* ================================================================== */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Konfirmasi Hapus Dokumen</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Tindakan ini akan menghapus dokumen dari sistem pengajuan RAB.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-bold block text-slate-900 dark:text-white truncate">{deleteCandidate.rabFileName}</span>
              <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">{deleteCandidate.ticketNumber}</span>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button type="button" onClick={handleConfirmDelete} className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs">
                Hapus Dokumen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL: LOG HISTORY CRUD FILE PDF (USER LOGGING AUDIT TRAIL)       */}
      {/* ================================================================== */}
      {historyLogItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden transition-colors">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-slate-900 dark:text-white">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-base font-bold">History CRUD Dokumen PDF</h3>
              </div>
              <button type="button" onClick={() => setHistoryLogItem(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block">{historyLogItem.rabFileName}</span>
                <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">{historyLogItem.ticketNumber}</span>
              </div>

              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide block">Aktivitas Pengguna (User Logging):</span>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                  {(historyLogItem.auditTrail && historyLogItem.auditTrail.length > 0
                    ? historyLogItem.auditTrail
                    : [
                        {
                          action: "CREATE" as const,
                          performedBy: historyLogItem.createdBy || `${historyLogItem.satkerUserName} (${historyLogItem.satkerUserId})`,
                          timestamp: historyLogItem.submittedAt,
                          details: `Pendaftaran dokumen awal: ${historyLogItem.rabFileName}`,
                        },
                      ]
                  ).map((entry, i) => (
                    <div key={i} className="p-3.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            entry.action === "CREATE"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : entry.action === "UPDATE"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {entry.action}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{entry.timestamp}</span>
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-white mt-1">Oleh: {entry.performedBy}</div>
                      {entry.details && <p className="text-[11px] text-slate-500 dark:text-slate-400">{entry.details}</p>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setHistoryLogItem(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History PDF Preview Modal */}
      {historyPreviewItem && (
        <PdfPreviewModal
          isOpen={!!historyPreviewItem}
          onClose={() => setHistoryPreviewItem(null)}
          fileName={historyPreviewItem.rabFileName}
          fileDataUrl={historyPreviewItem.pdfDataUrl}
          ticketNumber={historyPreviewItem.ticketNumber}
          submissionId={historyPreviewItem.id}
          title={`Pratinjau Dokumen RAB: ${historyPreviewItem.ticketNumber}`}
          metadata={{
            program: historyPreviewItem.program,
            kegiatan: historyPreviewItem.kegiatan,
            kro: historyPreviewItem.kro,
            ro: historyPreviewItem.ro,
            unit: historyPreviewItem.unitEselon1,
            satkerName: historyPreviewItem.satkerUserName,
            prioritas: historyPreviewItem.prioritas,
            aiStatus: historyPreviewItem.aiStatus,
            aiScore: historyPreviewItem.aiScore,
            submittedAt: historyPreviewItem.submittedAt,
          }}
          onUploadFile={async (file) => {
            await storePdfBlob(historyPreviewItem.id, file);
            await storePdfBlob(historyPreviewItem.ticketNumber, file);
            await storePdfBlob(file.name, file);
            const newUrl = URL.createObjectURL(file);
            const updated: SubmissionData = {
              ...historyPreviewItem,
              rabFileName: file.name,
              rabFileSize: formatFileSize(file.size),
              pdfDataUrl: newUrl,
            };
            setHistoryPreviewItem(updated);
            if (onUpdateSubmission) {
              onUpdateSubmission(updated);
            }
          }}
        />
      )}

      {/* PDF Preview Modal for RAB (Live Form) */}
      <PdfPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        fileName={rabFileName || "Dokumen Usulan RAB"}
        fileDataUrl={rabBlobUrl || rabDataUrl}
        title="Pratinjau Dokumen RAB (Rincian Anggaran Biaya)"
        ticketNumber="FORM-USULAN-BARU"
        metadata={{
          program: selectedProgram,
          kegiatan: selectedKegiatan,
          kro: selectedKro,
          ro: selectedRo,
          unit: currentUnitEselon1,
          satkerName: currentUser.name,
          prioritas: currentPrioritas,
        }}
        onUploadFile={handleDirectFileUpload}
      />

    </div>
  );
};
