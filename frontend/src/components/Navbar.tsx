import React, { useEffect, useRef, useState } from "react";
import { UserAccount, UserRole, ActiveMenuKey } from "../types";
import { KeyRound, LogOut, Sun, Moon, Menu, ChevronDown } from "lucide-react";
import { getPageMetaForMenu } from "../utils/navigation";

interface NavbarProps {
  currentUser: UserAccount;
  activeRole: UserRole;
  activeMenu: ActiveMenuKey;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onOpenMobileSidebar: () => void;
  onOpenChangePassword: () => void;
  onLogout: () => void;
}

const ROLE_DISPLAY_NAME: Record<UserRole, string> = {
  superadmin: "Super Admin",
  verifikator: "ROCAN (verif)",
  satker: "Satuan Kerja",
};

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeRole,
  activeMenu,
  theme,
  onToggleTheme,
  onOpenMobileSidebar,
  onOpenChangePassword,
  onLogout,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pageMeta = getPageMetaForMenu(activeMenu);

  // Tutup dropdown profil bila klik di luar area tombolnya
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md print:hidden transition-colors">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Page Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer shrink-0"
            title="Buka Menu Navigasi"
            aria-label="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight truncate">{pageMeta.title}</h1>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">{pageMeta.subtitle}</p>
          </div>
        </div>

        {/* Right: Theme Toggle, Help, User Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            id="btn-toggle-theme"
            type="button"
            onClick={onToggleTheme}
            className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center hover:shadow"
            title={theme === "dark" ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
            aria-label="Toggle Dark Mode"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* User Profile Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              aria-haspopup="menu"
              aria-expanded={isUserMenuOpen}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-md shrink-0">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-xs font-bold text-slate-900 dark:text-white block truncate max-w-44">{currentUser.name}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate max-w-44">{ROLE_DISPLAY_NAME[activeRole]}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {isUserMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 py-2 z-50"
              >
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">NIP: {currentUser.id}</div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{currentUser.unit}</div>
                </div>

                <div className="py-1">
                  <button
                    id="btn-nav-change-password"
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenChangePassword();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-slate-400" />
                    <span>Ganti Password</span>
                  </button>
                  <button
                    id="btn-logout"
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Keluar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
