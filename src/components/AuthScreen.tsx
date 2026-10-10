import { useState } from 'react';
import { useAuth } from '../engine/auth';

export function AuthScreen() {
  const { signup, login, busy, error, clearError } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState('');

  const submit = async () => {
    setLocalError('');
    clearError();
    if (!username.trim() || !password) {
      setLocalError('Enter a username and password.');
      return;
    }
    if (mode === 'signup') {
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirm) {
        setLocalError('Passwords do not match.');
        return;
      }
      await signup(username.trim(), password, email.trim() || undefined);
    } else {
      await login(username.trim(), password);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-dvh bg-ink text-white">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
        <header className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-bbn/20 px-4 py-1.5 text-xs font-bold tracking-widest text-gold uppercase">
            <span className="size-2 animate-pulse-dot rounded-full bg-bbn" /> Big Brother Naija
          </div>
          <h1 className="font-display text-4xl font-semibold">Biggie's House</h1>
          <p className="mt-2 text-ink-soft">Sign in to enter the house and chase the ₦100M.</p>
        </header>

        {/* Mode tabs */}
        <div className="mb-6 flex overflow-hidden rounded-2xl border border-white/10">
          {(['signup', 'login'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setLocalError('');
                clearError();
              }}
              className={`flex-1 py-3 text-sm font-bold capitalize transition ${
                mode === m ? 'bg-bbn text-white' : 'bg-white/5 text-ink-soft hover:bg-white/10'
              }`}
            >
              {m === 'signup' ? 'Create account' : 'Log in'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. ada_hustler"
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium outline-none placeholder:text-white/30 focus:border-gold"
            />
          </label>

          {mode === 'signup' && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Email (optional)</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium outline-none placeholder:text-white/30 focus:border-gold"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium outline-none placeholder:text-white/30 focus:border-gold"
            />
          </label>

          {mode === 'signup' && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Confirm password</span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium outline-none placeholder:text-white/30 focus:border-gold"
              />
            </label>
          )}

          {displayError && (
            <p className="rounded-xl bg-bbn/20 px-4 py-3 text-sm font-semibold text-gold">{displayError}</p>
          )}

          <button
            onClick={submit}
            disabled={busy}
            className="w-full rounded-2xl bg-bbn py-4 text-base font-bold text-white shadow-lg shadow-bbn/30 transition hover:bg-bbn-deep disabled:opacity-50"
          >
            {busy ? 'Please wait…' : mode === 'signup' ? 'Create account →' : 'Log in →'}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-ink-soft">
          By continuing you agree to Biggie's house rules. 18+ only.
        </p>
      </div>
    </div>
  );
}
