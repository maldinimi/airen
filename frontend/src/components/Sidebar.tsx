import React from "react";
import { Users, FolderArchive, FileSpreadsheet, ListChecks, Layers, ChevronsLeft, ChevronsRight, X } from "lucide-react";
import { UserRole, ActiveMenuKey, UserAccount, StandardMenuKey, ROLE_PERMISSIONS_MATRIX, AccessPermission } from "../types";

interface SidebarProps {
  activeRole: UserRole;
  activeMenu: ActiveMenuKey;
  onSelectMenu: (menu: ActiveMenuKey) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  currentUser: UserAccount;
  counts?: {
    users?: number;
    regulations?: number;
    submissions?: number;
    criteria?: number;
    masterRo?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({ activeRole, activeMenu, onSelectMenu, isCollapsed, onToggleCollapse, isMobileOpen, onCloseMobile, currentUser, counts = {} }) => {
  const getRoleHeaderInfo = () => {
    switch (activeRole) {
      case "superadmin":
        return {
          title: "Super Admin",
          color: "bg-cyan-600 text-white",
          sub: "Pusat Kendali Pengguna & Regulasi",
          activeBg: "bg-cyan-600 text-white shadow-md shadow-cyan-600/30 ring-1 ring-cyan-500",
          iconColor: "text-cyan-600 dark:text-cyan-400",
        };
      case "verifikator":
        return {
          title: "ROCAN (verif)",
          color: "bg-emerald-600 text-white",
          sub: "Biro Perencanaan & Verifikasi RAB",
          activeBg: "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-500",
          iconColor: "text-emerald-600 dark:text-emerald-400",
        };
      case "satker":
        return {
          title: "Satker",
          color: "bg-blue-600 text-white",
          sub: "Pengusul & Pembuat Dokumen RAB",
          activeBg: "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-500",
          iconColor: "text-blue-600 dark:text-blue-400",
        };
    }
  };

  const roleInfo = getRoleHeaderInfo();
  const isSidebarCompact = isCollapsed && !isMobileOpen;

  const isUsersActive = activeMenu === "menu_users" || activeMenu === "admin_users";
  const isAcuanActive = activeMenu === "menu_acuan" || activeMenu === "admin_regulations" || (activeMenu as string) === "admin_add_regulation";
  const isMasterRoActive = activeMenu === "menu_master_ro" || (activeMenu as string) === "master_ro_list" || (activeMenu as string) === "master_ro_add";
  const isRabListActive = activeMenu === "menu_rab_list" || activeMenu === "satker_list" || activeMenu === "satker_form";

  // Helper to determine if a standard menu key is currently active
  const isMenuActive = (targetKey: StandardMenuKey) => {
    if (activeMenu === targetKey) return true;
    if (targetKey === "menu_users" && isUsersActive) return true;
    if (targetKey === "menu_acuan" && isAcuanActive) return true;
    if (targetKey === "menu_checklist" && activeMenu === "verifikator_checklist") return true;
    if (targetKey === "menu_master_ro" && isMasterRoActive) return true;
    if (targetKey === "menu_rab_list" && isRabListActive) return true;
    return false;
  };

  // Master definitions of the 6 functional menus
  const allMenuItems: Array<{
    key: StandardMenuKey;
    label: string;
    sublabel: string;
    icon: React.ElementType;
    badgeCount?: number;
  }> = [
    {
      key: "menu_users",
      label: "Management User",
      sublabel: "Hak Akses & Kelola Akun",
      icon: Users,
      badgeCount: counts.users ?? 3,
    },
    {
      key: "menu_acuan",
      label: "Input Acuan",
      sublabel: "Ketentuan & Regulasi AI",
      icon: FolderArchive,
      badgeCount: counts.regulations ?? 2,
    },
    {
      key: "menu_checklist",
      label: "Input Checklist",
      sublabel: "Master 20 Kriteria AI",
      icon: ListChecks,
      badgeCount: counts.criteria ?? 20,
    },
    {
      key: "menu_master_ro",
      label: "Input Master RO",
      sublabel: "Katalog & Hierarki RO",
      icon: Layers,
      badgeCount: counts.masterRo ?? 58,
    },
    {
      key: "menu_rab_list",
      label: "Daftar RAB",
      sublabel: "Riwayat & Pengajuan RAB",
      icon: FileSpreadsheet,
      badgeCount: counts.submissions ?? 0,
    },
  ];

  // Specific ordering per role:
  // - Super Admin: 1 to 5
  // - ROCAN (verif): Daftar RAB, Input Acuan, Input Checklist, Input Master RO
  // - Satker: Daftar RAB, Input Acuan, Input Checklist, Input Master RO
  const getOrderedMenuKeysForRole = (role: UserRole): StandardMenuKey[] => {
    switch (role) {
      case "superadmin":
        return ["menu_users", "menu_acuan", "menu_checklist", "menu_master_ro", "menu_rab_list"];
      case "verifikator":
        return ["menu_rab_list", "menu_acuan", "menu_checklist", "menu_master_ro"];
      case "satker":
        return ["menu_rab_list", "menu_acuan", "menu_checklist", "menu_master_ro"];
    }
  };

  const orderedKeys = getOrderedMenuKeysForRole(activeRole);

  // Filter out any menu where permission is "NONE"
  const visibleMenus = orderedKeys
    .map((key) => {
      const item = allMenuItems.find((m) => m.key === key);
      const perm: AccessPermission = ROLE_PERMISSIONS_MATRIX[key]?.[activeRole] || "NONE";
      return { item, permission: perm };
    })
    .filter((entry): entry is { item: (typeof allMenuItems)[0]; permission: AccessPermission } => {
      return entry.item !== undefined && entry.permission !== "NONE";
    });

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] overflow-y-auto bg-white dark:bg-slate-900 border-r border-sky-200/80 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 md:static md:inset-auto md:z-30 md:max-w-none md:overflow-visible md:transition-[width] shrink-0 select-none shadow-xs ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 ${isCollapsed ? "md:w-20" : "md:w-64"}`}
    >
      {/* Top Header & Navigation Links */}
      <div>
        {/* Sidebar Header & Collapse Toggle */}
        <div className="h-14 px-3.5 flex items-center justify-between border-b border-sky-100 dark:border-slate-800">
          {!isSidebarCompact ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">Menu Navigasi</span>
            </div>
          ) : (
            <div className="w-full flex justify-center">{/* Spacer when collapsed */}</div>
          )}

          {/* Collapse Toggle Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Tutup Menu Navigasi"
            aria-label="Tutup menu navigasi"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleCollapse}
            className="hidden md:inline-flex p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title={isSidebarCompact ? "Perluas Sidebar" : "Perkecil Sidebar"}
            type="button"
          >
            {isSidebarCompact ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Dedicated Role Badge Section (Single Role) */}
        <div className="px-4 pt-4 pb-2">
          {!isSidebarCompact ? (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Role Akun</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{roleInfo.title}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleInfo.color}`}>Aktif</span>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className={`w-3 h-3 rounded-full ${roleInfo.color}`} title={roleInfo.title} />
            </div>
          )}
        </div>

        {/* Section Title */}
        <div className="px-5 pt-3 pb-1">
          {!isSidebarCompact ? (
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Menu Akses</span>
              <span className="text-[10px] text-slate-400 font-mono">{visibleMenus.length} Menu</span>
            </div>
          ) : (
            <div className="h-2 border-b border-slate-100 dark:border-slate-800"></div>
          )}
        </div>

        {/* Dynamic Navigation Items based on RBAC matrix */}
        <nav className="px-3 space-y-1.5 pt-2">
          {visibleMenus.map(({ item, permission }) => {
            const isRabList = item.key === "menu_rab_list";
            const active = isMenuActive(item.key);
            const Icon = item.icon;

            if (isRabList) {
              return (
                <div key={item.key}>
                  <button
                    id={`sidebar-menu-${item.key}`}
                    type="button"
                    onClick={() => onSelectMenu("satker_list")}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left font-bold transition-all cursor-pointer ${
                      active ? roleInfo.activeBg : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                    title={`${item.label} (${permission === "E" ? "Edit" : "View Only"})`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`w-5 h-5 shrink-0 ${active ? "text-white" : roleInfo.iconColor}`} />
                      {!isSidebarCompact && (
                        <div className="truncate">
                          <div className="text-xs font-bold truncate flex items-center gap-1.5">
                            <span>{item.label}</span>
                          </div>
                          <div className={`text-[10px] font-normal truncate ${active ? "text-white/80" : "text-slate-400 dark:text-slate-500"}`}>{item.sublabel}</div>
                        </div>
                      )}
                    </div>

                    {!isSidebarCompact && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* E / V Permission Indicator Pill */}
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border select-none ${
                            active
                              ? "bg-white/20 text-white border-white/30"
                              : permission === "E"
                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                : "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30"
                          }`}
                          title={permission === "E" ? "Hak Akses: Edit (E)" : "Hak Akses: View Only (V)"}
                        >
                          {permission === "E" ? "E" : "V"}
                        </span>

                        {/* Numeric Count Pill if available */}
                        {item.badgeCount !== undefined && (
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                              active ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {item.badgeCount}
                          </span>
                        )}

                      </div>
                    )}
                  </button>
                </div>
              );
            }

            return (
              <button
                key={item.key}
                id={`sidebar-menu-${item.key}`}
                type="button"
                onClick={() => onSelectMenu(item.key)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left font-bold transition-all cursor-pointer ${
                  active ? roleInfo.activeBg : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                title={`${item.label} (${permission === "E" ? "Edit" : "View Only"})`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-5 h-5 shrink-0 ${active ? "text-white" : roleInfo.iconColor}`} />
                  {!isSidebarCompact && (
                    <div className="truncate">
                      <div className="text-xs font-bold truncate flex items-center gap-1.5">
                        <span>{item.label}</span>
                      </div>
                      <div className={`text-[10px] font-normal truncate ${active ? "text-white/80" : "text-slate-400 dark:text-slate-500"}`}>{item.sublabel}</div>
                    </div>
                  )}
                </div>

                {!isSidebarCompact && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* E / V Permission Indicator Pill */}
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border select-none ${
                        active
                          ? "bg-white/20 text-white border-white/30"
                          : permission === "E"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                            : "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30"
                      }`}
                      title={permission === "E" ? "Hak Akses: Edit (E)" : "Hak Akses: View Only (V)"}
                    >
                      {permission === "E" ? "E" : "V"}
                    </span>

                    {/* Numeric Count Pill if available */}
                    {item.badgeCount !== undefined && (
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                          active ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {item.badgeCount}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Section: User Snapshot */}
      <div className="p-3 border-t border-sky-100 dark:border-slate-800 space-y-2">
        {!isSidebarCompact && (
          <div className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="font-bold text-slate-900 dark:text-white truncate">{currentUser.name}</div>
            <div className="flex items-center justify-between text-[10px] font-mono pt-0.5">
              <span>NIP: {currentUser.id}</span>
              <span className={`px-1.5 py-0.2 rounded font-bold ${roleInfo.color}`}>{roleInfo.title}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
