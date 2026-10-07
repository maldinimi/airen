import type { ActiveMenuKey, StandardMenuKey, UserRole } from "../types";

export function toStandardMenuKey(menuKey: ActiveMenuKey | string): StandardMenuKey {
  switch (menuKey) {
    case "menu_users":
    case "admin_users":
      return "menu_users";
    case "menu_acuan":
    case "admin_regulations":
    case "admin_add_regulation":
      return "menu_acuan";
    case "menu_checklist":
    case "verifikator_checklist":
      return "menu_checklist";
    case "menu_master_ro":
    case "master_ro_list":
    case "master_ro_add":
      return "menu_master_ro";
    case "menu_rab_list":
    case "satker_list":
    case "satker_form":
      return "menu_rab_list";
    case "menu_verification":
    case "verifikator_review":
      return "menu_verification";
    default:
      return "menu_users";
  }
}

// Menu awal yang dibuka tiap role setelah login
export function getDefaultMenuForRole(role: UserRole): StandardMenuKey {
  switch (role) {
    case "superadmin":
      return "menu_users";
    case "verifikator":
      return "menu_acuan";
    case "satker":
      return "menu_rab_list";
  }
}

// Urutan menu per role pada Sidebar
export function getOrderedMenuKeysForRole(role: UserRole): StandardMenuKey[] {
  switch (role) {
    case "superadmin":
      return ["menu_users", "menu_acuan", "menu_checklist", "menu_master_ro", "menu_rab_list"];
    case "verifikator":
      return ["menu_acuan", "menu_checklist", "menu_master_ro", "menu_verification"];
    case "satker":
      return ["menu_rab_list", "menu_acuan", "menu_checklist", "menu_master_ro"];
  }
}

// Judul dan subtitle halaman pada Navbar, mengikuti menu aktif
export function getPageMetaForMenu(menuKey: ActiveMenuKey | string): { title: string; subtitle: string } {
  switch (menuKey) {
    case "menu_users":
    case "admin_users":
      return { title: "Management User", subtitle: "Kelola akun pengguna & hak akses sistem" };
    case "menu_acuan":
    case "admin_regulations":
    case "admin_add_regulation":
      return { title: "Input Acuan", subtitle: "Regulasi & ketentuan standar AI" };
    case "menu_checklist":
    case "verifikator_checklist":
      return { title: "Input Checklist", subtitle: "20 kriteria evaluasi AI untuk verifikasi dokumen" };
    case "menu_master_ro":
    case "master_ro_list":
    case "master_ro_add":
      return { title: "Input Master RO", subtitle: "Hierarki & katalog Result Organization" };
    case "menu_rab_list":
    case "satker_list":
    case "satker_form":
      return { title: "Pengajuan Dokumen RAB", subtitle: "Formulir penyusunan, unggah berkas PDF & tela otomatis AI" };
    case "menu_verification":
    case "verifikator_review":
      return { title: "Verifikasi Dokumen", subtitle: "Telaah anggaran & penilaian AI terhadap dokumen RAB" };
    default:
      return { title: "Sistem Pengecekan File RAB AI", subtitle: "Kementerian Komunikasi dan Digital RI" };
  }
}

