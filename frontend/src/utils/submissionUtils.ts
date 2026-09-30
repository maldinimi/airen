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
  if (submission.reviewHistory?.length) return submission.reviewHistory;

  if (submission.verifiedAt && submission.verificationStatus !== "Menunggu") {
    return [{ verifiedAt: submission.verifiedAt, verificationStatus: submission.verificationStatus }];
  }

  return submission.verificationStatus === "Menunggu"
    ? [{ verifiedAt: submission.submittedAt, verificationStatus: "Menunggu" }]
    : [];
}

export function getHistoricalSubmission(
  submission: SubmissionData,
  entry: VerificationHistoryEntry,
): SubmissionData {
  return {
    ...submission,
    verificationStatus: entry.verificationStatus,
    verifiedAt: entry.verifiedAt,
    verifiedBy: entry.verifiedBy || submission.verifiedBy,
    verifiedByNip: entry.verifiedByNip || submission.verifiedByNip,
    verifikatorNotes: entry.verifikatorNotes ?? submission.verifikatorNotes,
    aiStatus: entry.aiStatus || submission.aiStatus,
    aiScore: entry.aiScore ?? submission.aiScore,
    aiReason: entry.aiReason || submission.aiReason,
    aiRecommendation: entry.aiRecommendation || submission.aiRecommendation,
    criteriaResults: entry.criteriaResults || submission.criteriaResults,
  };
}