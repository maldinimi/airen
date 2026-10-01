import type { SubmissionData, VerificationHistoryEntry } from "../types";
import { parseSubmittedDateToYMD } from "./dateUtils";

export interface SubmissionFilters {
  jenisDokumen: string;
  status: "all" | "Menunggu" | "Diterima" | "Ditolak";
  tahun: string;
  startDate: string;
  endDate: string;
}

export function filterSubmissions(
  submissions: SubmissionData[],
  filters: SubmissionFilters,
): SubmissionData[] {
  const query = filters.jenisDokumen.trim().toLowerCase();

  return submissions.filter((submission) => {
    if (query) {
      const searchableFields = [
        submission.rabFileName,
        submission.kategori || submission.kategori1 || "",
        submission.deskripsi || "",
        submission.kategori2 || "",
        submission.kategori3 || "",
        submission.program,
        submission.kegiatan,
      ];

      if (!searchableFields.some((field) => field.toLowerCase().includes(query))) return false;
    }

    if (filters.status !== "all" && submission.verificationStatus !== filters.status) return false;

    if (
      filters.tahun !== "all" &&
      submission.tahunAnggaran !== filters.tahun &&
      !submission.submittedAt.includes(filters.tahun) &&
      !submission.ticketNumber.includes(filters.tahun)
    ) {
      return false;
    }

    if (filters.startDate || filters.endDate) {
      const submittedDate = parseSubmittedDateToYMD(submission.submittedAt);
      if (submittedDate && filters.startDate && submittedDate < filters.startDate) return false;
      if (submittedDate && filters.endDate && submittedDate > filters.endDate) return false;
    }

    return true;
  });
}

export function getReviewHistory(submission: SubmissionData): VerificationHistoryEntry[] {
  const history: VerificationHistoryEntry[] = submission.reviewHistory?.length
    ? submission.reviewHistory
    : submission.verifiedAt && submission.verificationStatus !== "Menunggu"
      ? [{ verifiedAt: submission.verifiedAt, verificationStatus: submission.verificationStatus }]
      : submission.verificationStatus === "Menunggu"
        ? [{ verifiedAt: submission.submittedAt, verificationStatus: "Menunggu" }]
        : [];
  const auditTrail = submission.auditTrail || [];
  const extractFileName = (details?: string) => {
    const separatorIndex = details?.indexOf(": ") ?? -1;
    return separatorIndex >= 0 ? details!.slice(separatorIndex + 2).trim() : undefined;
  };
  const creationEvent = auditTrail.find((event) => event.action === "CREATE");
  const reuploadEvents = auditTrail
    .filter((event) => event.action === "REUPLOAD")
    .map((event) => ({ timestamp: event.timestamp, fileName: extractFileName(event.details) }))
    .filter((event): event is { timestamp: string; fileName: string } => Boolean(event.fileName));

  let currentFileName = extractFileName(creationEvent?.details) || submission.rabFileName;
  let reuploadIndex = 0;

  return history.map((entry) => {
    const matchingReupload = reuploadEvents[reuploadIndex];
    if (entry.verificationStatus === "Menunggu" && matchingReupload?.timestamp === entry.verifiedAt) {
      currentFileName = matchingReupload.fileName;
      reuploadIndex += 1;
    }
    if (entry.rabFileName) currentFileName = entry.rabFileName;

    return { ...entry, rabFileName: entry.rabFileName || currentFileName };
  });
}

export function getHistoricalSubmission(
  submission: SubmissionData,
  entry: VerificationHistoryEntry,
): SubmissionData {
  const history = submission.reviewHistory || [];
  const canUseSubmissionReviewDetails = history.length <= 1 || history.at(-1) === entry;

  return {
    ...submission,
    rabFileName: entry.rabFileName || submission.rabFileName,
    verificationStatus: entry.verificationStatus,
    verifiedAt: entry.verifiedAt,
    verifiedBy: entry.verifiedBy ?? (canUseSubmissionReviewDetails ? submission.verifiedBy : undefined),
    verifiedByNip: entry.verifiedByNip ?? (canUseSubmissionReviewDetails ? submission.verifiedByNip : undefined),
    verifikatorNotes: entry.verifikatorNotes ?? (canUseSubmissionReviewDetails ? submission.verifikatorNotes : ""),
    aiStatus: entry.aiStatus || submission.aiStatus,
    aiScore: entry.aiScore ?? submission.aiScore,
    aiReason: entry.aiReason || submission.aiReason,
    aiRecommendation: entry.aiRecommendation || submission.aiRecommendation,
    criteriaResults: entry.criteriaResults ?? (canUseSubmissionReviewDetails ? submission.criteriaResults : []),
  };
}