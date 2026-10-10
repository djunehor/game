import { useGame } from '../store';
import { Modal } from './Modal';
import { GRAND_PRIZE } from '../types';

export function OnboardingModal() {
  const completeOnboarding = useGame((s) => s.completeOnboarding);

  return (
    <Modal>
      <div className="px-6 py-7">
        <div className="text-center">
          <div className="text-6xl">🏠</div>
          <h2 className="mt-3 font-display text-3xl font-semibold">Welcome to Biggie's House</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
            Survive the house, win the fans, and walk out with{' '}
            <span className="font-bold text-gold-deep">₦{GRAND_PRIZE.toLocaleString()}</span>.
          </p>
        </div>

        <div className="mt-5 space-y-3">
          <section className="rounded-2xl bg-mist p-4">
            <h3 className="mb-2 text-xs font-black tracking-widest text-bbn uppercase">🎮 Controls</h3>
            <ul className="space-y-1 text-sm text-ink">
              <li><b>WASD / arrows</b> — move · <b>Shift</b> — sprint</li>
              <li><b>Q / E</b> — orbit camera · <b>Click floor</b> — walk there</li>
              <li><b>E / F</b> near a housemate — talk, flirt, or clash</li>
            </ul>
          </section>

          <section className="rounded-2xl bg-mist p-4">
            <h3 className="mb-2 text-xs font-black tracking-widest text-bbn uppercase">📅 Your week</h3>
            <ul className="space-y-1 text-sm text-ink">
              <li><b>Mon</b> — Head of House challenge (collect the golden rings in the Arena)</li>
              <li><b>Tue–Thu</b> — daily actions: cook, gist, train, build clout</li>
              <li><b>Fri</b> — nominations (allies won't nominate you)</li>
              <li><b>Sat</b> — Saturday night party 🪩</li>
              <li><b>Sun</b> — live eviction. Lowest clout goes home.</li>
            </ul>
          </section>

          <section className="rounded-2xl bg-mist p-4">
            <h3 className="mb-2 text-xs font-black tracking-widest text-bbn uppercase">⚡ Stay alive</h3>
            <p className="text-sm text-ink">
              Keep your <b>energy</b>, <b>hunger</b> and <b>sanity</b> topped up — run low and the
              house (and the fans) will turn on you. Earn <b>BB Coins</b> from sponsor tasks and
              spend them at the 🛒 store.
            </p>
          </section>
        </div>

        <button
          onClick={completeOnboarding}
          className="mt-5 w-full rounded-2xl bg-bbn py-3.5 text-base font-bold text-white shadow-lg shadow-bbn/25 transition hover:bg-bbn-deep"
        >
          Enter the House →
        </button>
      </div>
    </Modal>
  );
}
