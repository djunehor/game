import { useEffect, useState } from 'react';
import { useGame } from './store';
import { sound } from './engine/sound';
import { useNet } from './engine/net';
import { useAuth } from './engine/auth';
import { AuthScreen } from './components/AuthScreen';
import { CharacterCreator } from './components/CharacterCreator';
import { multiplayer } from './engine/multiplayer';
import { Hud } from './components/Hud';
import { GameOverlay } from './components/GameOverlay';
import { SocialPanel } from './components/SocialPanel';
import { VirtualJoystick } from './components/VirtualJoystick';
import { HouseChat } from './components/HouseChat';
import { HohChallengeOverlay } from './components/HohChallengeOverlay';
import { NominationsModal } from './components/NominationsModal';
import { EvictionModal } from './components/EvictionModal';
import { GameOverModal } from './components/GameOverModal';
import { DialogueModal } from './components/DialogueModal';
import { DiaryRoomModal } from './components/DiaryRoomModal';
import { EmoteBar } from './components/EmoteBar';
import { StoreModal } from './components/StoreModal';
import { GuidedTourModal } from './components/GuidedTourModal';
import { ToastContainer } from './components/ToastContainer';
import { GameCanvas } from './three/GameCanvas';
import { useTour } from './three/tourStore';
import type { Housemate } from './types';

export function App() {
  const rawState = useGame((s) => s.state);
  const token = useAuth((s) => s.token);
  const playerId = useAuth((s) => s.playerId);
  const profile = useAuth((s) => s.profile);
  const startGame = useGame((s) => s.startGame);
  const resetGame = useGame((s) => s.resetGame);

  // Only treat a locally-saved game as valid if it belongs to the logged-in account.
  const state = rawState && (!playerId || rawState.player.id === playerId) ? rawState : null;

  const [showSocial, setShowSocial] = useState(false);
  const [talkTarget, setTalkTarget] = useState<Housemate | null>(null);
  const [showDiaryRoom, setShowDiaryRoom] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [isTouch] = useState(
    () => typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0)
  );

  // Automatically start 3D guided tour for new housemates during onboarding
  useEffect(() => {
    if (state && state.phase === 'hoh' && !state.phaseDone && state.onboardingDone === false) {
      useTour.getState().startTour();
    }
  }, [state?.phase, state?.phaseDone, state?.onboardingDone]);

  // Sync party music with the Saturday night phase
  useEffect(() => {
    if (state?.phase === 'party' && !state.gameOver) {
      sound.startPartyMusic();
    } else {
      sound.stopPartyMusic();
    }
    return () => sound.stopPartyMusic();
  }, [state?.phase, state?.gameOver]);

  // Connect to the multiplayer server once a game is running
  useEffect(() => {
    if (state && !state.gameOver && !useNet.getState().houseId) {
      useGame.getState().connectToHouse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.player?.id]);

  // After logging in with a saved avatar, start the game automatically.
  useEffect(() => {
    if (token && profile && !state) {
      startGame(profile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, profile, state?.player?.id]);

  // Not logged in → auth gate.
  if (!token) {
    return <AuthScreen />;
  }

  // Logged in but no game yet (fresh signup) → character creation.
  if (!state) {
    return <CharacterCreator />;
  }

  const { phase, phaseDone } = state;

  return (
    <div className="fixed inset-0 overflow-hidden bg-ink">
      {/* 3D world */}
      <GameCanvas
        onTalk={setTalkTarget}
        onOpenDiaryRoom={() => setShowDiaryRoom(true)}
      />

      {/* Overlays */}
      <ToastContainer />
      <Hud state={state} />

      {/* Social Emote Bar */}
      <EmoteBar />

      {/* Social feed toggle */}
      <button
        onClick={() => setShowSocial((v) => !v)}
        className="absolute top-3 right-3 z-20 grid h-10 w-10 place-items-center rounded-2xl border border-white/15 bg-ink/70 text-lg text-white shadow-lg backdrop-blur transition hover:bg-ink"
        aria-label="Open social feed"
      >
        📱
      </button>

      {/* Store toggle */}
      <button
        onClick={() => setShowStore((v) => !v)}
        className="absolute top-3 right-16 z-20 grid h-10 w-10 place-items-center rounded-2xl border border-white/15 bg-ink/70 text-lg text-white shadow-lg backdrop-blur transition hover:bg-ink"
        aria-label="Open Biggie's Store"
      >
        🛒
      </button>

      {/* 3D Guided Tour toggle */}
      <button
        onClick={() => useTour.getState().startTour()}
        className="absolute top-3 right-32 z-20 grid h-10 w-10 place-items-center rounded-2xl border border-white/15 bg-ink/70 text-lg text-white shadow-lg backdrop-blur transition hover:bg-ink cursor-pointer"
        aria-label="Open 3D Guided Tour"
        title="3D Biggie House Tour"
      >
        📖
      </button>

      {/* Logout */}
      <button
        onClick={() => {
          multiplayer.disconnect();
          useAuth.getState().logout();
          resetGame();
        }}
        className="absolute top-3 right-46 z-20 grid h-10 w-10 place-items-center rounded-2xl border border-white/15 bg-ink/70 text-lg text-white shadow-lg backdrop-blur transition hover:bg-ink cursor-pointer"
        aria-label="Log out"
        title="Log out"
      >
        🚪
      </button>

      {showSocial && (
        <SocialPanel
          state={state}
          onClose={() => setShowSocial(false)}
          onTalk={(h) => {
            setTalkTarget(h);
            setShowSocial(false);
          }}
        />
      )}
      {showStore && <StoreModal state={state} onClose={() => setShowStore(false)} />}

      <HouseChat />

      {isTouch && <VirtualJoystick />}

      <GameOverlay state={state} />

      {/* Phase modals */}
      {showDiaryRoom && (
        <DiaryRoomModal
          player={state.player}
          onClose={() => setShowDiaryRoom(false)}
        />
      )}
      {talkTarget && (
        <DialogueModal
          housemate={talkTarget}
          player={state.player}
          onClose={() => setTalkTarget(null)}
        />
      )}
      {/* 3D Guided Tour in-game broadcast lower-third */}
      <GuidedTourModal isStandalone={state.onboardingDone !== false} />
      <HohChallengeOverlay />
      {phase === 'nominations' && !phaseDone && <NominationsModal state={state} />}
      {phase === 'eviction' && !phaseDone && <EvictionModal state={state} />}
      {phase === 'gameover' && <GameOverModal state={state} />}
    </div>
  );
}
