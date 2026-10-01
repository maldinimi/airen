import { RegulationDocument } from "../types";

export const INITIAL_REGULATIONS: RegulationDocument[] = [
  {
    id: "REG-2026-001",
    title: "Peraturan Menteri Keuangan No. 49/PMK.02/2023 tentang Standar Biaya Masukan",
    category: "Standar Biaya Masukan (SBM)",
    fileName: "PMK_49_2023_Standar_Biaya_Masukan.pdf",
    fileSize: "2.4 MB",
    uploadDate: "2026-01-12",
    uploadedBy: "19850115 (Super Admin)",
    isActive: true,
    targetYear: "2026",
    description: "Batas tarif tertinggi biaya operasional: honorarium narasumber, konsumsi rapat, uang harian perjalanan dinas, transport lokal, dan sewa fasilitas kegiatan kementerian/lembaga.",
    extractedRulesSummary: `1. Akun 521211 (Belanja Bahan): Hanya untuk konsumsi operasional habis pakai dan bahan pendukung kegiatan non-fisik; tidak diperkenankan untuk belanja modal inventaris.
2. Akun 521213 & 522151 (Honorarium Narasumber/Pakar):
   - Pejabat Menteri/Setingkat: Maksimal Rp 1.700.000 / Orang-Jam (OJ)
   - Pejabat Eselon I / Pakar Utama: Maksimal Rp 1.400.000 / OJ
   - Pejabat Eselon II / Pakar Madya: Maksimal Rp 1.000.000 / OJ
   - Pejabat Eselon III ke bawah / Pelaksana: Maksimal Rp 900.000 / OJ
   - Moderator: Maksimal Rp 700.000 / Kali kegiatan
3. Akun 521219 (Belanja Konsumsi Rapat):
   - Snack Rapat Biasa: Maksimal Rp 23.000 / Orang / Kali
   - Makan Siang/Malam Rapat Biasa: Maksimal Rp 51.000 / Orang / Kali
   - Konsumsi Rapat Fullboard: Termasuk dalam paket meeting sewa ruang/hotel
4. Akun 524111 (Biaya Perjalanan Dinas Dalam Negeri):
   - Uang Harian Meeting Fullboard di Luar Kota: Maksimal Rp 150.000 / Hari
   - Uang Harian Perjadin Biasa (DKI Jakarta): Maksimal Rp 430.000 / Hari
   - Transportasi Lokal (PP Kota yang sama): Maksimal Rp 150.000 / Kali
5. Akun 522141 (Sewa Gedung / Ruang Rapat):
   - Sewa ruang rapat hotel paket halfday: Maksimal Rp 250.000 / Orang / Hari
   - Sewa ruang rapat hotel paket fullday: Maksimal Rp 375.000 / Orang / Hari
6. Ketentuan Perpajakan:
   - PPh Pasal 21 atas honorarium PNS Gol IV: 15%
   - PPh Pasal 21 atas honorarium PNS Gol III: 5%
   - PPh Pasal 21 atas honorarium Non-PNS (memiliki NPWP): Tarif progresif Pasal 17 (efektif 5%)
   - PPN 12%: Dikenakan atas pengadaan barang/jasa kena pajak dari rekanan PKP senilai di atas Rp 2.000.000.`,
  },
  {
    id: "REG-2026-002",
    title: "Petunjuk Teknis Tata Kelola Anggaran & Penelaahan RAB Kementerian Komunikasi dan Digital RI",
    category: "Petunjuk Teknis & BAS Komdigi",
    fileName: "Juknis_Penyusunan_RAB_Komdigi_2026.pdf",
    fileSize: "1.8 MB",
    uploadDate: "2026-01-20",
    uploadedBy: "19850115 (Super Admin)",
    isActive: true,
    targetYear: "2026",
    description: "Ketentuan standar penulisan kode BAS 6 digit Ditjen Perbendaharaan, pembagian biaya utama/pendukung, larangan duplikasi anggaran, serta validasi tanda tangan & NIP PPK.",
    extractedRulesSummary: `1. Bagan Akun Standar (BAS 6 digit):
   - Seluruh akun belanja wajib menggunakan kode BAS 6 digit resmi Kementerian Keuangan (contoh: 521211, 521213, 521219, 522111, 522141, 522151, 524111).
2. Rasionalitas & Kejelasan Komponen Biaya:
   - Setiap baris biaya harus mencantumkan rincian volume x frekuensi x satuan ukur x tarif satuan secara eksplisit.
   - Dilarang mencantumkan komponen gelondongan (contoh: "Biaya Operasional Rp 50.000.000" tanpa rincian spesifikasi).
3. Pemisahan Biaya Utama vs Biaya Pendukung:
   - Biaya pendukung (konsumsi, ATK pendukung, dokumentasi) tidak boleh melebihi 15% dari total keseluruhan anggaran output kegiatan.
4. Lembar Pengesahan:
   - Berkas RAB wajib memiliki lembar pengesahan resmi bertanda tangan digital/basah Pejabat Pembuat Komitmen (PPK) lengkap beserta NIP resmi 18 digit.`,
  },
];
