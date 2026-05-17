'use client';

import { useEffect, useRef, useState } from 'react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';

interface ActionItem {
  label: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
}

interface ActionMenuProps {
  items: ActionItem[];
}

export default function ActionMenu({ items }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.55)] transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
        aria-label="Hành động"
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 min-w-[190px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="p-2">
            {items.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className={`flex w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  item.tone === 'danger'
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-slate-700 hover:bg-sky-50 hover:text-sky-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
