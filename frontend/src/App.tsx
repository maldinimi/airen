import { lazy, Suspense, useState, useEffect } from "react";
import { UserAccount, UserRole, SubmissionData, RegulationDocument, ActiveMenuKey, ROLE_PERMISSIONS_MATRIX, HierarchyItem } from "./types";
import { LoginView } from "./components/LoginView";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { ChangePasswordModal } from "./components/ChangePasswordModal";
import {
  clearCurrentUser,
  loadCurrentUser,
  loadMasterRoList,
  loadRegulations,
  loadSubmissions,
  loadTheme,
  loadUsers,
  saveCurrentUser,
  saveMasterRoList,
  saveRegulations,
  saveSubmissions,
  saveTheme,
  saveUsers,
} from "./utils/appStorage";
import { getDefaultMenuForRole, toStandardMenuKey } from "./utils/navigation";

const SuperAdminView = lazy(() => import("./components/SuperAdminView").then((module) => ({ default: module.SuperAdminView })));
const SatkerView = lazy(() => import("./components/SatkerView").then((module) => ({ default: module.SatkerView })));
const VerifikatorView = lazy(() => import("./components/VerifikatorView").then((module) => ({ default: module.VerifikatorView })));
const MasterRoView = lazy(() => import("./components/MasterRoView").then((module) => ({ default: module.MasterRoView })));

export default function App() {
  const [users, setUsers] = useState<UserAccount[]>(loadUsers);
  const [regulations, setRegulations] = useState<RegulationDocument[]>(loadRegulations);
  const [masterRoList, setMasterRoList] = useState<HierarchyItem[]>(loadMasterRoList);
  const [submissions, setSubmissions] = useState<SubmissionData[]>(loadSubmissions);

  // Current Logged-in User
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(loadCurrentUser);

  // Dedicated Single Role per Account
  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    if (currentUser) {
      return currentUser.roles[0] || currentUser.activeRole || "satker";
    }
    return "satker";
  });

  // Dynamic Navigation Menu Key - initialized according to activeRole & RBAC table
  const [activeMenu, setActiveMenu] = useState<ActiveMenuKey>(() => {
    const role = currentUser?.roles?.[0];
    return role ? getDefaultMenuForRole(role) : "menu_users";
  });

  // Sidebar Collapsed State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [activeMenu]);

  // Theme State: 'light' or 'dark' (Persistent)
  const [theme, setTheme] = useState<"light" | "dark">(loadTheme);

  // Sync theme to <html> tag classList and localStorage
  useEffect(() => {
    saveTheme(theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Modals
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => saveUsers(users), [users]);
  useEffect(() => saveMasterRoList(masterRoList), [masterRoList]);
  useEffect(() => saveRegulations(regulations), [regulations]);
  useEffect(() => saveSubmissions(submissions), [submissions]);

  // Sync currentUser and verify activeMenu permission
  useEffect(() => {
    try {
      if (currentUser) {
        saveCurrentUser(currentUser);
        const role = currentUser.roles[0] || currentUser.activeRole || "satker";
        setActiveRole(role);

        // Ensure activeMenu is allowed for the user's role
        setActiveMenu((currMenu) => {
          const std = toStandardMenuKey(currMenu);
          const perm = ROLE_PERMISSIONS_MATRIX[std]?.[role] || "NONE";
          if (perm !== "NONE") {
            return currMenu;
          }
          return getDefaultMenuForRole(role);
        });
      } else {
        clearCurrentUser();
      }
    } catch (e) {
      console.warn("Could not sync currentUser to localStorage:", e);
    }
  }, [currentUser]);

  // Handle Login
  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    const role = user.roles[0] || user.activeRole || "satker";
    setActiveRole(role);
    setActiveMenu(getDefaultMenuForRole(role));
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    clearCurrentUser();
  };

  // User CRUD by Super Admin
  const handleAddUser = (newUser: UserAccount) => {
    setUsers((current) => [newUser, ...current]);
  };

  const handleUpdateUser = (updatedUser: UserAccount) => {
    setUsers((current) => current.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      const role = updatedUser.roles[0] || updatedUser.activeRole || "satker";
      setActiveRole(role);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((current) => current.filter((user) => user.id !== userId));
  };

  // Regulation Documents CRUD
  const handleAddRegulation = (newReg: RegulationDocument) => {
    setRegulations((current) => [newReg, ...current]);
  };

  const handleUpdateRegulation = (updatedReg: RegulationDocument) => {
    setRegulations((current) => current.map((regulation) => (regulation.id === updatedReg.id ? updatedReg : regulation)));
  };

  const handleDeleteRegulation = (regId: string) => {
    setRegulations((current) => current.filter((regulation) => regulation.id !== regId));
  };

  const handleToggleRegulationActive = (regId: string) => {
    setRegulations((current) => current.map((regulation) => regulation.id === regId ? { ...regulation, isActive: !regulation.isActive } : regulation));
  };

  // Master RO CRUD
  const handleAddMasterRo = (newItem: HierarchyItem) => {
    setMasterRoList((current) => [newItem, ...current]);
  };

  const handleUpdateMasterRo = (updatedItem: HierarchyItem) => {
    setMasterRoList((current) => current.map((item) => item.id === updatedItem.id ? updatedItem : item));
  };

  const handleDeleteMasterRo = (itemId: string) => {
    setMasterRoList((current) => current.filter((item) => item.id !== itemId));
  };

  // Change Password
  const handleUpdatePassword = (newPassword: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, password: newPassword };
    setCurrentUser(updated);
    setUsers((current) => current.map((user) => user.id === updated.id ? updated : user));
  };

  // SatKer Submission
  const handleAddSubmission = (newSub: SubmissionData) => {
    setSubmissions((current) => [newSub, ...current]);
  };

  // Verifikator Decision Update
  const handleUpdateSubmission = (updatedSub: SubmissionData) => {
    setSubmissions((current) => current.map((submission) => submission.id === updatedSub.id ? updatedSub : submission));
  };

  // SatKer / Super Admin Delete Submission
  const handleDeleteSubmission = (submissionId: string) => {
    setSubmissions((current) => current.filter((submission) => submission.id !== submissionId));
  };

  // If not logged in, render Login View
  if (!currentUser) {
    return <LoginView users={users} theme={theme} onToggleTheme={handleToggleTheme} onLoginSuccess={handleLogin} />;
  }

  // Canonical standard menu and permission for current view
  const stdKey = toStandardMenuKey(activeMenu);
  const currentPermission = ROLE_PERMISSIONS_MATRIX[stdKey]?.[activeRole] || "NONE";

  return (
    <div className="h-screen bg-sky-100/75 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans transition-colors duration-200 antialiased overflow-hidden">
      {/* Overlay gelap saat sidebar terbuka di layar kecil */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      <div
        className={`fixed lg:relative inset-y-0 left-0 z-50 lg:z-30 transform transition-transform duration-300 ease-in-out h-full ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${isMobileSidebarOpen ? "visible" : "invisible lg:visible"} ${isSidebarCollapsed ? "hidden lg:block" : "block"}`}
      >
        {/* Sidebar Navigasi Dinamis Berdasarkan Role (Super Admin, ROCAN, Satker) */}
        <Sidebar
          activeRole={activeRole}
          activeMenu={activeMenu}
          onSelectMenu={(menu) => {
            setActiveMenu(menu);
            setIsMobileSidebarOpen(false);
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => {
            if (window.innerWidth < 1024) {
              setIsMobileSidebarOpen((prev) => !prev);
            } else {
              setIsSidebarCollapsed((prev) => !prev);
            }
          }}
          currentUser={currentUser}
          counts={{
            users: users.length,
            regulations: regulations.filter((r) => r.isActive).length,
            submissions: submissions.length,
            pendingSubmissions: submissions.filter((s) => s.verificationStatus === "Menunggu").length,
            criteria: 20,
            masterRo: masterRoList.length,
          }}
        />
      </div>

      {/* MainContent: Area Dinamis Menampilkan Isi Halaman Sesuai Matriks Hak Akses (E & V) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar
          currentUser={currentUser}
          activeRole={activeRole}
          activeMenu={activeMenu}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenChangePassword={() => setIsPasswordModalOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            {currentPermission === "NONE" ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3">
                <p className="font-bold text-sm text-slate-700 dark:text-slate-300">Anda tidak memiliki hak akses ke modul menu ini.</p>
                <button
                  type="button"
                  onClick={() => setActiveMenu(getDefaultMenuForRole(activeRole))}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Kembali ke Menu Utama
                </button>
              </div>
            ) : (
              <Suspense fallback={<div className="py-12 text-center text-sm text-slate-500" role="status">Memuat halaman...</div>}>
                <>
                {/* 1. MANAGEMENT USER */}
                {stdKey === "menu_users" && (
                  <SuperAdminView
                    users={users}
                    currentUser={currentUser}
                    regulations={regulations}
                    activeMenu={activeMenu}
                    permission="E"
                    onSelectMenu={setActiveMenu}
                    onAddUser={handleAddUser}
                    onUpdateUser={handleUpdateUser}
                    onDeleteUser={handleDeleteUser}
                    onAddRegulation={handleAddRegulation}
                    onUpdateRegulation={handleUpdateRegulation}
                    onDeleteRegulation={handleDeleteRegulation}
                    onToggleRegulationActive={handleToggleRegulationActive}
                  />
                )}

                {/* 2. INPUT ACUAN (ARSIP REGULASI) */}
                {stdKey === "menu_acuan" && (
                  <SuperAdminView
                    users={users}
                    currentUser={currentUser}
                    regulations={regulations}
                    activeMenu={activeMenu}
                    permission={currentPermission}
                    onSelectMenu={setActiveMenu}
                    onAddUser={handleAddUser}
                    onUpdateUser={handleUpdateUser}
                    onDeleteUser={handleDeleteUser}
                    onAddRegulation={handleAddRegulation}
                    onUpdateRegulation={handleUpdateRegulation}
                    onDeleteRegulation={handleDeleteRegulation}
                    onToggleRegulationActive={handleToggleRegulationActive}
                  />
                )}

                {/* 3. INPUT CHECKLIST (MASTER 20 KRITERIA) */}
                {stdKey === "menu_checklist" && (
                  <VerifikatorView
                    currentUser={currentUser}
                    onUpdateSubmission={handleUpdateSubmission}
                    activeMenu="verifikator_checklist"
                    permission={currentPermission}
                    regulations={regulations}
                  />
                )}

                {/* 4. INPUT MASTER RO */}
                {stdKey === "menu_master_ro" && (
                  <MasterRoView
                    permission={currentPermission}
                    currentUser={currentUser}
                    hierarchyData={masterRoList}
                    onAddMasterRo={handleAddMasterRo}
                    onUpdateMasterRo={handleUpdateMasterRo}
                    onDeleteMasterRo={handleDeleteMasterRo}
                    activeMenu={activeMenu}
                    onSelectMenu={setActiveMenu}
                  />
                )}

                {/* 5. DAFTAR RAB (PENGAJUAN & RIWAYAT) */}
                {stdKey === "menu_rab_list" && (
                  <SatkerView
                    currentUser={currentUser}
                    activeRole={activeRole}
                    onAddSubmission={handleAddSubmission}
                    onUpdateSubmission={handleUpdateSubmission}
                    onDeleteSubmission={handleDeleteSubmission}
                    submissions={submissions}
                    regulations={regulations}
                    activeMenu={activeMenu}
                    onSelectMenu={setActiveMenu}
                  />
                )}

                </>
              </Suspense>
            )}
        </main>
      </div>

      {/* Modals */}
      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} currentUser={currentUser} onUpdatePassword={handleUpdatePassword} />
    </div>
  );
}
