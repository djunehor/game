import type { ReactNode } from 'react';

export function Modal({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose?: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="animate-pop-in max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ title, subtitle, emoji }: { title: string; subtitle?: string; emoji?: string }) {
  return (
    <div className="sticky top-0 border-b border-black/5 bg-white px-6 pt-6 pb-4">
      <div className="flex items-center gap-3">
        {emoji && <span className="text-3xl">{emoji}</span>}
        <div>
          <h2 className="font-display text-2xl leading-tight font-semibold">{title}</h2>
          {subtitle && <p className="text-sm text-ink-soft">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
