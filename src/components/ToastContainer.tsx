import { useToast, type ToastMessage } from '../engine/toastStore';

export function ToastContainer({ toasts: propToasts }: { toasts?: ToastMessage[] } = {}) {
  const storeToasts = useToast((s) => s.toasts);
  const toasts = propToasts ?? storeToasts;
  const removeToast = useToast((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-16 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => removeToast(t.id)}
          className={`pointer-events-auto flex items-center gap-2.5 rounded-2xl px-4 py-2.5 shadow-2xl backdrop-blur-md transition-all duration-300 animate-pop-in cursor-pointer ${
            t.type === 'warning'
              ? 'border border-amber-500/50 bg-amber-950/90 text-amber-100'
              : t.type === 'info'
                ? 'border border-sky-500/50 bg-sky-950/90 text-sky-100'
                : 'border border-lawn/60 bg-ink/90 text-white'
          }`}
        >
          {t.emoji && <span className="text-2xl drop-shadow">{t.emoji}</span>}
          <div className="flex flex-col">
            <span className="text-xs font-black tracking-wide">{t.title}</span>
            {t.description && (
              <span className="text-[11px] font-semibold text-white/70">{t.description}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
