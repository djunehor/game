import { useState } from 'react';
import type { CreationConfig, Gender, Hairstyle, Profession, Trait } from '../types';
import { ACCENT_COLORS, AVATAR_EMOJIS, HAIRSTYLES, PROFESSIONS, SKIN_TONES, STATES_OF_ORIGIN, TRAITS } from '../data/profileOptions';
import { useGame } from '../store';
import { AvatarPreview3D } from './AvatarPreview3D';

export function CharacterCreator() {
  const startGame = useGame((s) => s.startGame);

  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<Gender>('F');
  const [age, setAge] = useState(25);
  const [stateOfOrigin, setStateOfOrigin] = useState('Lagos');
  const [profession, setProfession] = useState<Profession>('Musician & Vibe Machine');
  const [trait, setTrait] = useState<Trait>('Strategic Schemer');
  const [avatar, setAvatar] = useState('😎');
  const [accentColor, setAccentColor] = useState(ACCENT_COLORS[0]);
  const [skinTone, setSkinTone] = useState(SKIN_TONES[2]);
  const [hairstyle, setHairstyle] = useState<Hairstyle>('afro');
  const [error, setError] = useState('');

  const submit = () => {
    if (!name.trim() || !nickname.trim()) {
      setError('Give yourself a name and a nickname to enter the house.');
      return;
    }
    const config: CreationConfig = {
      name: name.trim(),
      nickname: nickname.trim(),
      gender,
      age,
      stateOfOrigin,
      profession,
      trait,
      avatar,
      accentColor,
      skinTone,
      hairstyle,
    };
    startGame(config);
  };

  const selectedTraitMeta = TRAITS.find((t) => t.id === trait);
  const selectedProfessionMeta = PROFESSIONS.find((p) => p.id === profession);

  return (
    <div className="min-h-dvh bg-ink text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 pb-32">
        <header className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-bbn/20 px-4 py-1.5 text-xs font-bold tracking-widest text-gold uppercase">
            <span className="size-2 animate-pulse-dot rounded-full bg-bbn" /> Big Brother Naija
          </div>
          <h1 className="font-display text-4xl font-semibold sm:text-5xl">Create Your Housemate</h1>
          <p className="mt-2 text-ink-soft">One person walks out with ₦100,000,000. Customize your 3D avatar and make them remember you.</p>
        </header>

        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
          {/* Left Column: Interactive 3D Avatar Customization Stage */}
          <div className="mb-6 lg:mb-0 lg:col-span-5 lg:sticky lg:top-8 space-y-4">
            <AvatarPreview3D
              gender={gender}
              accentColor={accentColor}
              skinTone={skinTone}
              nickname={nickname}
              avatarEmoji={avatar}
            />

            {/* Quick Housemate Summary Card */}
            <div className="rounded-3xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{avatar}</span>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {nickname || name || 'Your Housemate'}
                    </h3>
                    <p className="text-[11px] text-ink-soft">
                      {gender === 'F' ? 'Female' : 'Male'} · Age {age} · {stateOfOrigin}
                    </p>
                  </div>
                </div>
                <div
                  className="size-4 rounded-full ring-2 ring-white/20"
                  style={{ backgroundColor: accentColor }}
                  title="Outfit Accent"
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-xl bg-white/5 p-2 ring-1 ring-white/5">
                  <div className="text-ink-soft">Profession</div>
                  <div className="font-bold text-white truncate">
                    {selectedProfessionMeta?.emoji} {profession}
                  </div>
                </div>
                <div className="rounded-xl bg-white/5 p-2 ring-1 ring-white/5">
                  <div className="text-ink-soft">Trait</div>
                  <div className="font-bold text-white truncate">
                    {selectedTraitMeta?.emoji} {trait}
                  </div>
                </div>
              </div>

              <div className="mt-2 text-center text-[10px] text-ink-soft">
                💡 Tip: Drag avatar to inspect 360° · Switch to Walk to check stride
              </div>
            </div>
          </div>

          {/* Right Column: Identity, Profession, Personality & Style Configuration */}
          <div className="lg:col-span-7 space-y-6">
            {/* Identity */}
            <section className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
              <h2 className="mb-4 text-sm font-bold tracking-widest text-gold uppercase">Identity</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Full name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Adaeze Okonkwo"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium outline-none placeholder:text-white/30 focus:border-gold"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Nickname</span>
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="e.g. Ada"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium outline-none placeholder:text-white/30 focus:border-gold"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Gender / Model</span>
                  <div className="flex overflow-hidden rounded-xl border border-white/10">
                    {(['F', 'M'] as Gender[]).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`flex-1 py-3 text-sm font-bold transition ${
                          gender === g ? 'bg-bbn text-white' : 'bg-white/5 text-ink-soft hover:bg-white/10'
                        }`}
                      >
                        {g === 'F' ? 'Woman' : 'Man'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Age</span>
                  <input
                    type="number"
                    min={21}
                    max={40}
                    value={age}
                    onChange={(e) => setAge(Math.max(21, Math.min(40, Number(e.target.value))))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <span className="mb-1.5 block text-xs font-semibold text-ink-soft">State of origin</span>
                  <select
                    value={stateOfOrigin}
                    onChange={(e) => setStateOfOrigin(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm font-medium outline-none focus:border-gold"
                  >
                    {STATES_OF_ORIGIN.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Profession */}
            <section className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
              <h2 className="mb-4 text-sm font-bold tracking-widest text-gold uppercase">Profession</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PROFESSIONS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProfession(p.id)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      profession === p.id
                        ? 'border-gold bg-gold/10'
                        : 'border-white/10 bg-white/5 hover:border-white/25'
                    }`}
                  >
                    <div className="text-2xl">{p.emoji}</div>
                    <div className="mt-1 text-xs leading-tight font-bold">{p.id}</div>
                    <div className="mt-0.5 text-[10px] leading-snug text-ink-soft">{p.tagline}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Trait */}
            <section className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
              <h2 className="mb-4 text-sm font-bold tracking-widest text-gold uppercase">Personality</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {TRAITS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTrait(t.id)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      trait === t.id ? 'border-gold bg-gold/10' : 'border-white/10 bg-white/5 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{t.emoji}</span>
                      <span className="text-sm font-bold">{t.id}</span>
                    </div>
                    <div className="mt-1 text-[11px] leading-snug text-ink-soft">{t.description}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Look & Avatar Styling */}
            <section className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
              <h2 className="mb-4 text-sm font-bold tracking-widest text-gold uppercase">Look & Styling</h2>

              {/* Status Emoji Badge */}
              <div>
                <span className="mb-2 block text-xs font-semibold text-ink-soft">
                  Signature Status Emoji (Chat & HUD Badge)
                </span>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setAvatar(e)}
                      className={`grid h-11 w-11 place-items-center rounded-xl text-xl transition ${
                        avatar === e ? 'bg-gold/20 ring-2 ring-gold' : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Outfit Accent Colour */}
              <div className="mt-5">
                <span className="mb-2 block text-xs font-semibold text-ink-soft">
                  Outfit Accent Colour (Podium & Rim Lighting)
                </span>
                <div className="flex flex-wrap gap-2">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAccentColor(c)}
                      className={`h-9 w-9 rounded-full transition ${
                        accentColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-ink scale-110' : 'hover:scale-105'
                      }`}
                      style={{ background: c }}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>

              {/* Skin Tone */}
              <div className="mt-5">
                <span className="mb-2 block text-xs font-semibold text-ink-soft">Skin tone</span>
                <div className="flex gap-2">
                  {SKIN_TONES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSkinTone(c)}
                      className={`h-9 w-9 rounded-full transition ${
                        skinTone === c ? 'ring-2 ring-white ring-offset-2 ring-offset-ink scale-110' : 'hover:scale-105'
                      }`}
                      style={{ background: c }}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>

              {/* Hairstyle */}
              <div className="mt-5">
                <span className="mb-2 block text-xs font-semibold text-ink-soft">Hairstyle</span>
                <div className="flex flex-wrap gap-2">
                  {HAIRSTYLES.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setHairstyle(h.id)}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                        hairstyle === h.id
                          ? 'border-gold bg-gold/10 text-white'
                          : 'border-white/10 bg-white/5 text-ink-soft hover:border-white/25'
                      }`}
                    >
                      <span className="text-base">{h.emoji}</span> {h.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {error && <p className="mb-4 rounded-xl bg-bbn/20 px-4 py-3 text-sm font-semibold text-gold">{error}</p>}
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-ink/90 p-4 backdrop-blur z-20">
        <div className="mx-auto flex max-w-5xl gap-3">
          <button
            type="button"
            onClick={() =>
              startGame({
                name: 'Ebuka Star',
                nickname: 'E-Star',
                gender: 'M',
                age: 27,
                stateOfOrigin: 'Lagos',
                profession: 'Musician & Vibe Machine',
                trait: 'Pepper Dem',
                avatar: '😎',
                accentColor: '#e63946',
                skinTone: '#8d5524',
                hairstyle: 'lowcut',
              })
            }
            className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-sm font-bold text-white transition hover:bg-white/20"
          >
            🎲 Quick Start
          </button>
          <button
            type="button"
            onClick={submit}
            className="flex-1 rounded-2xl bg-bbn py-4 text-lg font-bold text-white shadow-lg shadow-bbn/30 transition hover:bg-bbn-deep"
          >
            Enter the Biggie House 🏠
          </button>
        </div>
      </div>
    </div>
  );
}
