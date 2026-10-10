import { useState } from 'react';
import type { GameState } from '../types';
import { TwitterFeed } from './TwitterFeed';
import { HousemateList } from './HousemateList';
import { EventLog } from './EventLog';

type Tab = 'twitter' | 'housemates' | 'log';

export function SocialPanel({ state, onClose }: { state: GameState; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('twitter');

  return (
    <div className="absolute inset-y-0 right-0 z-30 flex w-full max-w-sm flex-col border-l border-white/10 bg-ink/95 text-white shadow-2xl backdrop-blur">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="font-display text-lg font-semibold">📱 Biggie Feed</span>
        <button
          onClick={onClose}
          className="ml-auto grid h-8 w-8 place-items-center rounded-full bg-white/10 text-sm font-bold hover:bg-white/20"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="flex gap-1 p-2">
        {(
          [
            ['twitter', 'Feed'],
            ['housemates', 'Housemates'],
            ['log', 'Log'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-xl py-2 text-sm font-bold transition ${
              tab === key ? 'bg-white text-ink' : 'text-white/60 hover:bg-white/10'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="scroll-thin flex-1 space-y-2 overflow-y-auto p-3">
        {tab === 'twitter' && <TwitterFeed state={state} />}
        {tab === 'housemates' && <HousemateList state={state} />}
        {tab === 'log' && <EventLog state={state} />}
      </div>
    </div>
  );
}
