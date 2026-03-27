"use client";

import { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** If true, shows a "Ungespeicherte Änderungen" warning before closing */
  hasUnsavedChanges?: boolean;
  children: React.ReactNode;
  /** Width class. Defaults to w-[480px] */
  widthClass?: string;
}

export function DrawerShell({
  open,
  onClose,
  title,
  subtitle,
  hasUnsavedChanges = false,
  children,
  widthClass = "w-[480px]",
}: DrawerShellProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      if (!window.confirm("Du hast ungespeicherte Änderungen. Wirklich schließen?")) return;
    }
    onClose();
  }, [hasUnsavedChanges, onClose]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer panel — slides in from right */}
      <div
        className={cn(
          "absolute right-0 top-0 h-full bg-white shadow-2xl flex flex-col",
          "border-l border-slate-200",
          widthClass,
          "max-w-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="min-w-0 pr-4">
            <h2 className="text-sm font-semibold text-slate-900 leading-tight">{title}</h2>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Schließen"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
