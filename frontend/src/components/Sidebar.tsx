import React from "react";
import { Users, FolderArchive, ListChecks, Layers, FileSpreadsheet, ShieldCheck, ChevronsLeft, ChevronsRight } from "lucide-react";
import { UserRole, ActiveMenuKey, UserAccount } from "../types";
import { getOrderedMenuKeysForRole } from "../utils/navigation";

interface SidebarProps {
  activeRole: UserRole;
  activeMenu: ActiveMenuKey;
  onSelectMenu: (menu: ActiveMenuKey) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentUser: UserAccount;
  counts?: {
    users?: number;
    regulations?: number;
    submissions?: number;
    pendingSubmissions?: number;
    criteria?: number;
    masterRo?: number;
  };
}

const ROLE_INFO: Record<UserRole, { title: string; color: string; iconColor: string }> = {
  superadmin: {
    title: "Super Admin",
    color: "bg-cyan-600 text-white",
    iconColor: "text-cyan-600 dark:text-cyan-400",
  },
  verifikator: {
    title: "ROCAN (verif)",
    color: "bg-emerald-600 text-white",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  satker: {
    title: "Satker",
    color: "bg-blue-600 text-white",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
};

// Definisi seluruh menu fungsional. `order` mengikuti ROLE_ORDER_MAP di utils/navigation.
const ALL_MENU_ITEMS: Array<{
  key: Parameters<typeof getOrderedMenuKeysForRole>[0] extends never ? never : string;
  label: string;
  sublabel: string;
  icon: React.ElementType;
}> = [
  { key: "menu_users", label: "Management User", sublabel: "Kelola akun & hak akses", icon: Users },
  { key: "menu_acuan", label: "Input Acuan", sublabel: "Regulasi & ketentuan AI", icon: FolderArchive },
  { key: "menu_checklist", label: "Input Checklist", sublabel: "20 kriteria evaluasi AI", icon: ListChecks },
  { key: "menu_master_ro", label: "Input Master RO", sublabel: "Hierarki & katalog RO", icon: Layers },
  { key: "menu_rab_list", label: "Daftar RAB", sublabel: "Pengajuan & riwayat dokumen", icon: FileSpreadsheet },
  { key: "menu_verification", label: "Verifikasi", sublabel: "Telaah & evaluasi dokumen", icon: ShieldCheck },
];

// Menu aktif juga considers sub-halaman (mis. satker_form tetap menandai menu_rab_list)
const ACTIVE_ALIASES: Record<string, string[]> = {
  menu_users: ["admin_users"],
  menu_acuan: ["admin_regulations", "admin_add_regulation"],
  menu_checklist: ["verifikator_checklist"],
  menu_master_ro: ["master_ro_list", "master_ro_add"],
  menu_rab_list: ["satker_list", "satker_form"],
  menu_verification: ["verifikator_review"],
};

export const Sidebar: React.FC<SidebarProps> = ({ activeRole, activeMenu, onSelectMenu, isCollapsed, onToggleCollapse, currentUser, counts = {} }) => {
  const roleInfo = ROLE_INFO[activeRole];

  const isMenuActive = (menuKey: string) => {
    if (activeMenu === menuKey) return true;
    return ACTIVE_ALIASES[menuKey]?.includes(activeMenu as string) ?? false;
  };

  const orderedKeys = getOrderedMenuKeysForRole(activeRole);
  const visibleMenus = orderedKeys
    .map((key) => ALL_MENU_ITEMS.find((item) => item.key === key))
    .filter((item): item is (typeof ALL_MENU_ITEMS)[number] => item !== undefined);

  // Jumlah dokumen menunggu verifikasi, dipakai pada lencana menu Verifikasi
  const getBadgeCount = (key: string) => {
    switch (key) {
      case "menu_users":
        return counts.users;
      case "menu_acuan":
        return counts.regulations;
      case "menu_checklist":
        return counts.criteria;
      case "menu_master_ro":
        return counts.masterRo;
      case "menu_rab_list":
        return counts.submissions;
      case "menu_verification":
        return counts.pendingSubmissions;
      default:
        return undefined;
    }
  };

  return (
    <aside
      className={`bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 z-30 shrink-0 select-none shadow-xl shadow-slate-200/30 dark:shadow-slate-900/30 h-full ${
        isCollapsed ? "w-20" : "w-72"
      }`}
    >
      <div className="flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              type="button"
              onClick={() => onSelectMenu(orderedKeys[0])}
              className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-cyan-200 dark:hover:ring-cyan-800 transition-all"
              title="Kembali ke menu utama"
              aria-label="Kembali ke menu utama"
            >
              <img src="/logo-komdigi-emblem.svg" alt="Logo Komdigi RI" className="w-8 h-8 object-contain" />
            </button>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Kementerian Komdigi RI</div>
                <div className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                  SI-RAB <span className="text-cyan-600 dark:text-cyan-400">AI</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            type="button"
            className="p-2 rounded-xl transition-all cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            title={isCollapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
            aria-label={isCollapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
          >
            {isCollapsed ? <ChevronsRight className="w-5 h-5" /> : <ChevronsLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Section Label */}
        <div className="px-5 pt-5 pb-2">
          {isCollapsed ? (
            <div className="h-px bg-slate-200 dark:bg-slate-700" />
          ) : (
            <div className="flex items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Menu Navigasi</span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="px-3 space-y-1 pb-4">
          {visibleMenus.map((item) => {
            const active = isMenuActive(item.key);
            const Icon = item.icon;
            const badgeCount = getBadgeCount(item.key);

            return (
              <button
                key={item.key}
                id={`sidebar-menu-${item.key}`}
                type="button"
                onClick={() => onSelectMenu(item.key as ActiveMenuKey)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer group ${
                  active
                    ? "bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
                title={`${item.label} - ${item.sublabel}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 ${
                      active ? "bg-sky-200/60 dark:bg-sky-900/40" : "bg-slate-100 dark:bg-slate-800 group-hover:scale-105"
                    }`}
                  >
                    <Icon className={`w-4.5 h-4.5 transition-colors ${active ? "text-sky-600 dark:text-sky-400" : roleInfo.iconColor}`} />
                  </div>
                  {!isCollapsed && (
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold truncate">{item.label}</div>
                      <div
                        className={`text-[11px] truncate transition-colors ${
                          active ? "text-sky-600/80 dark:text-sky-400/80" : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {item.sublabel}
                      </div>
                    </div>
                  )}
                </div>

                {!isCollapsed && badgeCount !== undefined && (
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                      active ? "bg-sky-200/70 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Snapshot */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
        {!isCollapsed && (
          <div className="p-3 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${roleInfo.color} flex items-center justify-center text-white text-sm font-bold shadow-md shrink-0`}>
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentUser.name}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{roleInfo.title}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
