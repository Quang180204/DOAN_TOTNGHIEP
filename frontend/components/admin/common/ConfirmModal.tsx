'use client';

import { ExclamationTriangleIcon, XCircleIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'danger' | 'success' | 'warning';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  type,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const config =
    type === 'danger'
      ? {
          icon: XCircleIcon,
          iconClass: 'bg-rose-100 text-rose-600',
          buttonClass: 'bg-rose-600 hover:bg-rose-700',
        }
      : type === 'success'
        ? {
            icon: CheckCircleIcon,
            iconClass: 'bg-emerald-100 text-emerald-600',
            buttonClass: 'bg-emerald-600 hover:bg-emerald-700',
          }
        : {
            icon: ExclamationTriangleIcon,
            iconClass: 'bg-amber-100 text-amber-600',
            buttonClass: 'bg-sky-600 hover:bg-sky-700',
          };

  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_32px_80px_-34px_rgba(15,23,42,0.45)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${config.iconClass}`}>
            <Icon className="h-8 w-8" />
          </div>
          <div
            className="text-center text-sm leading-7 text-slate-600"
            dangerouslySetInnerHTML={{ __html: message }}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-2xl px-5 py-2.5 text-sm font-medium text-white transition ${config.buttonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
