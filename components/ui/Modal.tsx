'use client';

import { useEffect, useRef, type ReactNode, KeyboardEvent } from 'react';
import clsx from 'clsx';
import { Portal } from './Portal';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: ModalSize;
    showCloseButton?: boolean;
    closeOnBackdrop?: boolean;
    closeOnEsc?: boolean;
    overlayBlur?: boolean; // frosted overlay
    overlayOpacity?: number; // 0..100 (Tailwind /xx)
    className?: string; // extra dialog classes
    bodyClassName?: string; // inner scrollable area
    initialFocusRef?: React.RefObject<HTMLElement>; // focus target
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
}

const sizeMap: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
};

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = '2xl',
    showCloseButton = true,
    closeOnBackdrop = true,
    closeOnEsc = true,
    overlayBlur = true,
    overlayOpacity = 25,
    className,
    bodyClassName,
    initialFocusRef,
    ...aria
}: ModalProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    // Body scroll lock
    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [isOpen]);

    // Focus handling
    useEffect(() => {
        if (!isOpen) return;
        const toFocus = initialFocusRef?.current ?? dialogRef.current;
        toFocus?.focus();
    }, [isOpen, initialFocusRef]);

    // Focus trap
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Escape' && closeOnEsc) {
            e.stopPropagation();
            onClose();
            return;
        }
        if (e.key !== 'Tab') return;

        const root = dialogRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll<HTMLElement>(
            'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        const list = Array.from(focusables).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
        if (list.length === 0) return;

        const first = list[0];
        const last = list[list.length - 1];

        if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        }
    };

    if (!isOpen) return null;

    return (
        <Portal>
            {/* Overlay */}
            <div
                className={clsx(
                    'fixed inset-0 z-50 flex items-center justify-center p-4',
                )}
                aria-modal="true"
                role="dialog"
                onKeyDown={handleKeyDown}
            >
                <div
                    className={clsx(
                        'fixed inset-0 transition-opacity',
                        overlayBlur && 'backdrop-blur-[2px]',
                        `bg-black/${overlayOpacity}`
                    )}
                    onClick={() => closeOnBackdrop && onClose()}
                />

                {/* Dialog */}
                <div
                    ref={dialogRef}
                    tabIndex={-1}
                    className={clsx(
                        'relative z-50 w-full',
                        sizeMap[size],
                        'bg-white rounded-2xl shadow-2xl outline-none',
                        'max-h-[90vh] flex flex-col',
                        'transition-transform duration-200',
                        'animate-[modalIn_.2s_ease-out]',
                        className
                    )}
                    aria-labelledby={aria['aria-labelledby']}
                    aria-describedby={aria['aria-describedby']}
                >
                    {/* Header */}
                    {(title || showCloseButton) && (
                        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                            {title ? (
                                <h2 id={aria['aria-labelledby'] || 'modal-title'} className="text-lg font-semibold text-gray-900">
                                    {title}
                                </h2>
                            ) : <span />}
                            {showCloseButton && (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                    aria-label="Close dialog"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Body */}
                    <div className={clsx('flex-1 overflow-y-auto px-6 py-4', bodyClassName)}>
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <div className="sticky bottom-0 z-10 px-6 py-4 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                            {footer}
                        </div>
                    )}
                </div>
            </div>

            {/* Tiny keyframe for pop-in */}
            <style jsx global>{`
        @keyframes modalIn {
          0% { transform: translateY(6px) scale(0.98); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
        </Portal>
    );
}
