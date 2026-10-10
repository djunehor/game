import { useState } from 'react';
import { useNet } from '../engine/net';
import { multiplayer } from '../engine/multiplayer';

export function HouseChat() {
  const chat = useNet((s) => s.chat);
  const connected = useNet((s) => s.connected);
  const houseName = useNet((s) => s.houseName);
  const liveCount = useNet((s) => s.liveCount);
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    multiplayer.sendChat(t);
    setText('');
  };

  return (
    <div className="absolute bottom-24 right-3 z-20 flex flex-col items-end gap-2">
      {/* Connection + house badge */}
      <div className="flex items-center gap-2 rounded-full bg-ink/80 px-3 py-1.5 text-[11px] font-bold text-white shadow-lg backdrop-blur">
        <span className={`size-2 rounded-full ${connected ? 'bg-lawn' : 'bg-bbn'} animate-pulse-dot`} />
        {connected ? (
          <span>
            {houseName} · {liveCount}/20 live
          </span>
        ) : (
          <span>connecting…</span>
        )}
      </div>

      {open && (
        <div className="flex w-72 flex-col overflow-hidden rounded-2xl border border-white/15 bg-ink/90 shadow-2xl backdrop-blur">
          <div className="scroll-thin flex h-56 flex-col gap-1.5 overflow-y-auto p-3">
            {chat.length === 0 && (
              <p className="text-center text-xs text-white/50">Say hi to the house 👋</p>
            )}
            {chat.map((c) => (
              <div key={c.id} className="text-sm leading-snug">
                <span className="font-bold text-gold">{c.senderAvatar} {c.senderName}: </span>
                <span className="text-white/90">{c.text}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-white/10 p-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Chat to the house…"
              className="min-w-0 flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:bg-white/15"
            />
            <button
              onClick={send}
              className="rounded-xl bg-bbn px-3 py-2 text-sm font-bold text-white transition hover:bg-bbn-deep"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-ink/70 text-lg text-white shadow-lg backdrop-blur transition hover:bg-ink"
        aria-label="Toggle house chat"
      >
        💬
      </button>
    </div>
  );
}
