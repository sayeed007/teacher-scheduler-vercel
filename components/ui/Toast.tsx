'use client';

import { useEffect, useState } from 'react';
import { toast as toastApi, type Toast as ToastType } from '@/lib/api-client';
import clsx from 'clsx';

export function ToastContainer() {
  const [toasts, setToasts] = useState<(ToastType & { exiting?: boolean })[]>([]);

  useEffect(() => {
    const unsubscribe = toastApi.subscribe((newToast) => {
      setToasts((prev) => [...prev, newToast]);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === newToast.id ? { ...t, exiting: true } : t))
        );

        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, 300);
      }, 5000);
    });

    return unsubscribe;
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function Toast({ toast }: { toast: ToastType & { exiting?: boolean } }) {
  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  };

  const textColors = {
    success: 'text-green-900',
    error: 'text-red-900',
    warning: 'text-yellow-900',
    info: 'text-blue-900'
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  return (
    <div
      className={clsx(
        'pointer-events-auto min-w-[300px] max-w-[400px] rounded-lg border-2 p-4 shadow-lg transition-all duration-300',
        bgColors[toast.type],
        toast.exiting
          ? 'translate-x-[500px] opacity-0'
          : 'translate-x-0 opacity-100'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={clsx(
            'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold',
            textColors[toast.type]
          )}
        >
          {icons[toast.type]}
        </div>

        <div className="flex-1 min-w-0">
          <p className={clsx('font-semibold text-sm', textColors[toast.type])}>
            {toast.message}
          </p>
          {toast.description && (
            <p className={clsx('text-xs mt-1 opacity-80', textColors[toast.type])}>
              {toast.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
