"use client";

import { AlertTriangle, Info, CheckCircle2, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "success";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const icons = {
    danger: <AlertTriangle className="text-red-600" size={24} />,
    warning: <AlertTriangle className="text-amber-600" size={24} />,
    info: <Info className="text-blue-600" size={24} />,
    success: <CheckCircle2 className="text-emerald-600" size={24} />,
  };

  const btnColors = {
    danger: "bg-red-600 hover:bg-red-700 text-white",
    warning: "bg-amber-600 hover:bg-amber-700 text-white",
    info: "bg-blue-600 hover:bg-blue-700 text-white",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 shrink-0">
            {icons[variant]}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900 leading-snug">{title}</h3>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer ${btnColors[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ToastBanner({
  message,
  type = "info",
  onClose,
}: {
  message: string | null;
  type?: "success" | "error" | "info";
  onClose: () => void;
}) {
  if (!message) return null;

  const bgStyles = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  return (
    <div
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-lg border shadow-lg text-xs font-medium animate-in slide-in-from-bottom-3 duration-200 ${bgStyles[type]}`}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        aria-label="Close notification"
        className="p-0.5 rounded-full hover:bg-black/10 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
