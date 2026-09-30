import type { UserAccount } from "../types";
import { CheckCircle2, Edit3, Eye, Trash2 } from "lucide-react";

interface UserAccountsTableProps {
  users: UserAccount[];
  currentUser: UserAccount;
  onEdit: (user: UserAccount) => void;
  onDelete: (userId: string) => void;
}

export function UserAccountsTable({ users, currentUser, onEdit, onDelete }: UserAccountsTableProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-xs">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 uppercase font-mono tracking-wider">
          <tr>
            <th className="px-4 py-3.5">ID / NIP</th>
            <th className="px-4 py-3.5">Nama &amp; Gelar</th>
            <th className="px-4 py-3.5">Satuan Kerja / Unit</th>
            <th className="px-4 py-3.5">Role Terdaftar</th>
            <th className="px-4 py-3.5">Hak Akses Menu</th>
            <th className="px-4 py-3.5">Status</th>
            <th className="px-4 py-3.5 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {users.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-slate-400 dark:text-slate-500">
                Tidak ada akun yang cocok dengan kata kunci pencarian.
              </td>
            </tr>
          ) : (
            users.map((user) => {
              const access = user.menuAccess || "both";

              return (
                <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-cyan-700 dark:text-cyan-400">{user.id}</span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                    {user.name}
                    {user.id === currentUser.id && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-bold">Anda</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">{user.unit}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <span
                          key={role}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            role === "superadmin"
                              ? "bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800"
                              : role === "satker"
                                ? "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          }`}
                        >
                          {role === "superadmin" ? "Super Admin" : role === "satker" ? "Satker" : "Verifikator"}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        access === "both"
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          : access === "view"
                            ? "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                            : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                      }`}
                    >
                      {access === "both" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {access === "view" && <Eye className="w-3 h-3 text-sky-600" />}
                      {access === "edit" && <Edit3 className="w-3 h-3 text-amber-600" />}
                      <span>{access === "both" ? "View & Edit (Penuh)" : access === "view" ? "Hanya Lihat (View)" : "Hanya Ubah (Edit)"}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        user.isActive
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                          : "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300"
                      }`}
                    >
                      {user.isActive ? "Aktif" : "Non-Aktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(user)}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 transition-colors cursor-pointer"
                        title="Edit Pengguna & Hak Akses"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {user.id !== currentUser.id && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Yakin ingin menghapus akun "${user.name}" (${user.id})?`)) onDelete(user.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Hapus Akun Pengguna"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}