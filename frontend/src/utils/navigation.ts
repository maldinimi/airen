import type { ActiveMenuKey, StandardMenuKey, UserRole } from "../types";

export function toStandardMenuKey(menuKey: ActiveMenuKey | string): StandardMenuKey {
  switch (menuKey) {
    case "menu_users":
    case "admin_users":
    case "admin_add_user":
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
    default:
      return "menu_users";
  }
}

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