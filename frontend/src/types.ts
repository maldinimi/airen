export type UserRole = "superadmin" | "satker" | "verifikator";

export type MenuAccessLevel = "view" | "edit" | "both";

export type AccessPermission = "E" | "V" | "NONE";

export type StandardMenuKey = "menu_users" | "menu_acuan" | "menu_checklist" | "menu_master_ro" | "menu_rab_list";

export type ActiveMenuKey =
  | StandardMenuKey
  | "admin_users"
  | "admin_regulations"
  | "admin_add_regulation"
  | "satker_list"
  | "satker_form"
  | "verifikator_checklist"
  | "menu_master_ro"
  | "master_ro_list"
  | "master_ro_add";

// Matriks Hak Akses Berdasarkan Tabel Peran (Excel: E = Edit, V = View, NONE = Tidak ada akses)
export const ROLE_PERMISSIONS_MATRIX: Record<StandardMenuKey, Record<UserRole, AccessPermission>> = {
  menu_users: { superadmin: "E", verifikator: "NONE", satker: "NONE" },
  menu_acuan: { superadmin: "E", verifikator: "E", satker: "V" },
  menu_checklist: { superadmin: "E", verifikator: "E", satker: "V" },
  menu_master_ro: { superadmin: "E", verifikator: "E", satker: "V" },
  menu_rab_list: { superadmin: "E", verifikator: "V", satker: "E" },
};

export interface UserAccount {
  id: string; // 8 character ID (e.g. 19850115 / ADM88001)
  name: string;
  unit: string;
  roles: UserRole[]; // Can have 1, 2, or 3 roles
  activeRole: UserRole;
  password: string;
  isActive: boolean;
  createdAt: string;
  phone?: string;
  menuAccess?: MenuAccessLevel; // "view" | "edit" | "both" (default: "both")
}

export interface HierarchyItem {
  id?: string;
  program: string;
  unitEselon1: string;
  kegiatan: string;
  unitEselon2: string;
  prioritasCheck: string;
  kro: string;
  ro: string;
}

export interface ChecklistCriterion {
  id: number;
  text: string;
  status: "passed" | "failed"; // AI status
  notes: string; // AI findings notes
  category?: string;
  verifierStatus: "Lolos" | "Ditolak"; // Verifier override per row
  verifierNotes: string; // Verifier notes per row
}

export interface MasterCriterion {
  id: number;
  text: string;
  description: string;
  isActive: boolean;
}

export interface RegulationDocument {
  id: string;
  title: string;
  category: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  dateInserted?: string; // Tanggal Dimasukkan
  uploadedBy: string;
  isActive: boolean;
  targetYear?: string;
  description?: string;
  extractedRulesSummary?: string;
  pdfDataUrl?: string;
}

export interface SubmissionAuditEntry {
  action: "CREATE" | "UPDATE" | "DELETE" | "REUPLOAD";
  performedBy: string; // ID / NIP & Name
  timestamp: string;
  details?: string;
}

export interface VerificationHistoryEntry {
  verifiedAt: string;
  verificationStatus: "Menunggu" | "Diterima" | "Ditolak";
  rabFileName?: string;
  verifiedBy?: string;
  verifiedByNip?: string;
  verifikatorNotes?: string;
  aiStatus?: "LOLOS" | "TIDAK LOLOS";
  aiScore?: number;
  aiReason?: string;
  aiRecommendation?: string;
  criteriaResults?: ChecklistCriterion[];
}

export interface SubmissionData {
  id: string;
  ticketNumber: string;
  satkerUserId: string; // 8 characters
  satkerUserName: string;
  satkerUnit: string;
  submittedAt: string;
  program: string;
  kegiatan: string;
  kro: string;
  ro: string;
  unitEselon1: string;
  unitEselon2: string;
  prioritas: string;
  rabFileName: string;
  rabFileSize: string;
  pdfDataUrl?: string;
  activeRegulationTitle?: string;

  // Category & Description & Budget Year
  kategori?: string;
  deskripsi?: string;
  tahunAnggaran?: string;
  kategori1?: string;
  kategori2?: string;
  kategori3?: string;

  // User Logging / Audit Trail
  createdBy?: string;
  updatedBy?: string;
  auditTrail?: SubmissionAuditEntry[];

  // Related Reference Documents
  referenceDocuments?: string[];

  // AI LLM Analysis Result for RAB
  aiStatus: "LOLOS" | "TIDAK LOLOS";
  aiScore: number;
  aiReason: string;
  aiRecommendation: string;
  criteriaResults: ChecklistCriterion[];

  // Verifikator Review
  verificationStatus: "Menunggu" | "Diterima" | "Ditolak";
  verifikatorNotes: string;
  verifiedBy?: string;
  verifiedByNip?: string;
  verifiedAt?: string;
  reviewHistory?: VerificationHistoryEntry[];
}
