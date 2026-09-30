import React, { useState } from "react";
import { X, KeyRound, Check, AlertCircle } from "lucide-react";
import { UserAccount } from "../types";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onUpdatePassword: (newPassword: string) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, currentUser, onUpdatePassword }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (oldPassword !== currentUser.password) {
      setError("Password lama yang Anda masukkan tidak sesuai.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password baru minimal terdiri dari 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok dengan password baru.");
      return;
    }

    onUpdatePassword(newPassword);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div id="change-password-dialog" className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-colors">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400 rounded-xl">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Ganti Password Akun</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">User ID: {currentUser.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <Check className="w-4 h-4 shrink-0" />
              <span>Password berhasil diperbarui!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password Lama</label>
            <input
              id="input-old-password"
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Masukkan password lama"
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-hidden text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password Baru</label>
            <input
              id="input-new-password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-hidden text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Konfirmasi Password Baru</label>
            <input
              id="input-confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-hidden text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              id="btn-save-new-password"
              type="submit"
              disabled={success}
              className="px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              Simpan Password Baru
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
