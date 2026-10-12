import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useTheoryExamStore } from '../world/theoryExamStore';
import { DRIVING_THEORY_SCENARIOS } from '../data/drivingTheoryScenarios';
import { DrivingTheorySimulation } from '../three/DrivingTheorySimulation';

export function DrivingTheoryModal() {
  const store = useTheoryExamStore();
  const state = useTheoryExamStore.getState();

  const isOpen = store.isOpen || state.isOpen;
  const currentScenarioId = state.currentScenarioId || store.currentScenarioId;
  const playbackTime = typeof state.playbackTime === 'number' ? state.playbackTime : store.playbackTime;
  const isPlaying = store.isPlaying || state.isPlaying;
  const isFrozen = store.isFrozen || state.isFrozen;
  const replaysRemaining = typeof state.replaysRemaining === 'number' ? state.replaysRemaining : store.replaysRemaining;
  const selectedOptionIds = state.selectedOptionIds?.length ? state.selectedOptionIds : store.selectedOptionIds;
  const hasSubmitted = store.hasSubmitted || state.hasSubmitted;
  const evaluationResult = state.evaluationResult || store.evaluationResult;
  const cameraMode = state.cameraMode || store.cameraMode;
  const indicatorActive = state.indicatorActive || store.indicatorActive;

  const closeExam = useTheoryExamStore((s) => s.closeExam);
  const play = useTheoryExamStore((s) => s.play);
  const pause = useTheoryExamStore((s) => s.pause);
  const replay = useTheoryExamStore((s) => s.replay);
  const toggleOption = useTheoryExamStore((s) => s.toggleOption);
  const submitAnswers = useTheoryExamStore((s) => s.submitAnswers);
  const switchScenario = useTheoryExamStore((s) => s.switchScenario);
  const setCameraMode = useTheoryExamStore((s) => s.setCameraMode);

  const [language, setLanguage] = useState<'de' | 'en'>('de');

  if (!isOpen) return null;

  const scenario =
    DRIVING_THEORY_SCENARIOS.find((s) => s.id === currentScenarioId) ??
    DRIVING_THEORY_SCENARIOS[0];

  const calculatedSpeed = isFrozen
    ? 0
    : Math.max(
        0,
        Math.round(
          scenario.initialSpeedKmh * (1 - (playbackTime / scenario.durationSeconds) * 0.7)
        )
      );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative flex flex-col w-full max-w-6xl h-[94vh] max-h-[880px] rounded-3xl border border-sky-500/30 bg-slate-950/95 text-white shadow-2xl overflow-hidden ring-1 ring-sky-500/20">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-1.5 rounded-xl bg-white/10">🇩🇪</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-white">
                  Fahrschule Theorieprüfung · Klasse B
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Offizielle Videofrage
                </span>
              </div>
              <p className="text-xs text-slate-400">
                German Driver&apos;s License Theory Examination · Animated Traffic Scenarios
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Toggle */}
            <div className="flex items-center rounded-xl bg-slate-900 border border-white/10 p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setLanguage('de')}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                  language === 'de' ? 'bg-sky-600 text-white shadow' : 'text-slate-400'
                }`}
              >
                DE
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                  language === 'en' ? 'bg-sky-600 text-white shadow' : 'text-slate-400'
                }`}
              >
                EN
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={closeExam}
              className="flex items-center justify-center h-8 w-8 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
              aria-label="Close Driving Theory Exam"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scenario Selectors */}
        <div className="flex items-center gap-2 px-5 py-2 border-b border-white/10 bg-slate-900/60 overflow-x-auto no-scrollbar">
          {DRIVING_THEORY_SCENARIOS.map((scen, idx) => {
            const isSelected = scen.id === currentScenarioId;
            return (
              <button
                key={scen.id}
                type="button"
                onClick={() => switchScenario(scen.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-md ring-1 ring-sky-300'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-white/5'
                }`}
              >
                <span>{scen.signEmoji}</span>
                <span>{`Frage ${idx + 1}: ${language === 'de' ? scen.titleGerman : scen.titleEnglish}`}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content: Split View */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column: 3D Animated Video Scenario (7 cols) */}
          <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-white/10 bg-slate-950 relative">
            {/* 3D Canvas Viewport */}
            <div className="relative flex-1 w-full min-h-[300px] overflow-hidden bg-slate-900">
              <Canvas
                shadows
                camera={{
                  position:
                    cameraMode === 'cockpit'
                      ? [0, 1.2, 44.8]
                      : cameraMode === 'third_person'
                      ? [0, 3.2, 50]
                      : [0, 25, 20],
                  fov: cameraMode === 'cockpit' ? 62 : 55,
                }}
              >
                <DrivingTheorySimulation />
              </Canvas>

              {/* Cockpit HUD Overlays: Speedometer & Mirrors */}
              <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none select-none">
                {/* Speedometer Gauge */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-black/75 border border-white/15 backdrop-blur-md shadow-lg">
                  <span className="text-sm">🧭</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Tacho</span>
                    <span className="text-sm font-extrabold text-amber-300">
                      {calculatedSpeed} km/h
                    </span>
                  </div>
                </div>

                {/* Turn Indicator */}
                {indicatorActive === 'right' && (
                  <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-bold text-xs animate-pulse">
                    <span>➡️</span>
                    <span>Blinker Rechts</span>
                  </div>
                )}
              </div>

              {/* Rearview Mirror Preview (Rückspiegel) */}
              <div className="absolute top-3 right-3 pointer-events-none select-none hidden sm:flex flex-col items-center p-2 rounded-xl bg-black/80 border border-white/20 backdrop-blur-md shadow-xl w-36">
                <span className="text-[9px] uppercase font-bold text-slate-400 mb-1">
                  🔍 Rückspiegel
                </span>
                <div className="flex items-center justify-center w-full h-8 rounded bg-slate-900/90 border border-white/10 text-xs text-slate-300">
                  🚗 Freie Sicht
                </div>
              </div>

              {/* Exterior Right Wing Mirror (Außenspiegel Rechts for Cyclist) */}
              {currentScenarioId === 'radfahrer_abwaerts' && (
                <div className="absolute bottom-16 right-3 pointer-events-none select-none flex flex-col items-center p-2 rounded-xl bg-black/85 border border-amber-500/40 backdrop-blur-md shadow-2xl w-40 animate-pulse">
                  <span className="text-[9px] uppercase font-bold text-amber-300 mb-1">
                    ⚠️ Außenspiegel Rechts
                  </span>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/20 text-xs font-bold text-amber-200">
                    <span>🚴</span>
                    <span>Radfahrer nähert sich!</span>
                  </div>
                </div>
              )}

              {/* Critical Freeze Banner Alert */}
              {isFrozen && (
                <div className="absolute inset-x-3 bottom-14 flex items-center justify-between p-3 rounded-2xl bg-amber-500/90 text-black shadow-2xl backdrop-blur-md animate-bounce">
                  <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
                    <span className="text-xl">⚠️</span>
                    <span>Filmsequenz angehalten! Bitte Frage beantworten.</span>
                  </div>
                  <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-black/20">
                    Standbild
                  </span>
                </div>
              )}

              {/* Camera Perspective Angle Selector */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center rounded-xl bg-black/70 border border-white/10 p-0.5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setCameraMode('cockpit')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    cameraMode === 'cockpit' ? 'bg-sky-600 text-white shadow' : 'text-slate-400'
                  }`}
                >
                  Cockpit
                </button>
                <button
                  type="button"
                  onClick={() => setCameraMode('third_person')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    cameraMode === 'third_person' ? 'bg-sky-600 text-white shadow' : 'text-slate-400'
                  }`}
                >
                  Verfolger
                </button>
                <button
                  type="button"
                  onClick={() => setCameraMode('aerial')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    cameraMode === 'aerial' ? 'bg-sky-600 text-white shadow' : 'text-slate-400'
                  }`}
                >
                  Draufsicht
                </button>
              </div>
            </div>

            {/* Video Controls Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-slate-900/80">
              <div className="flex items-center gap-2">
                {/* Play / Pause Toggle */}
                <button
                  type="button"
                  onClick={() => (isPlaying ? pause() : play())}
                  disabled={isFrozen}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isFrozen
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <span>{isPlaying ? '⏸️' : '▶️'}</span>
                  <span>{isPlaying ? 'Pause' : 'Abspielen'}</span>
                </button>

                {/* Official Exam Replay Button */}
                <button
                  type="button"
                  onClick={replay}
                  disabled={replaysRemaining <= 0}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    replaysRemaining > 0
                      ? 'bg-sky-600 hover:bg-sky-500 text-white shadow'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                  }`}
                >
                  <span>🔄</span>
                  <span>Film wiederholen</span>
                </button>
              </div>

              {/* Replay Counter Banner (Max 5 Views Allowed) */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 hidden sm:inline">Wiederholungen:</span>
                <span className="px-2 py-0.5 rounded-lg bg-sky-950 text-sky-300 font-extrabold border border-sky-500/30">
                  {replaysRemaining} von 5 verbleibend
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  {playbackTime.toFixed(1)}s / {scenario.durationSeconds}s
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Questionnaire & StVO Verification (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between p-5 sm:p-6 overflow-y-auto bg-slate-900/30">
            <div>
              {/* Question Metadata Card */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-red-600/20 text-red-300 border border-red-500/30">
                  {scenario.points} Fehlerpunkte
                </span>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  {scenario.stvoSection}
                </span>
              </div>

              {/* Main Question Text */}
              <h3 className="text-base sm:text-lg font-black text-white mb-1 leading-snug">
                {language === 'de' ? scenario.questionGerman : scenario.questionEnglish}
              </h3>
              <p className="text-xs text-slate-400 mb-5">
                {language === 'de'
                  ? 'Wählen Sie alle zutreffenden Aussagen aus (Mehrfachauswahl möglich):'
                  : 'Select all applicable statements (multiple choices possible):'}
              </p>

              {/* Multiple Choice Options List */}
              <div className="flex flex-col gap-3">
                {scenario.options.map((opt) => {
                  const isChecked = selectedOptionIds.includes(opt.id);
                  const showCorrect = hasSubmitted && opt.isCorrect;
                  const showWrong = hasSubmitted && !opt.isCorrect && isChecked;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleOption(opt.id)}
                      disabled={hasSubmitted}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                        showCorrect
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200'
                          : showWrong
                          ? 'border-red-500 bg-red-500/20 text-red-200'
                          : isChecked
                          ? 'border-sky-500 bg-sky-500/20 text-white shadow-md'
                          : 'border-white/10 bg-slate-900/60 hover:bg-slate-900 text-slate-300'
                      }`}
                    >
                      {/* Checkbox Icon */}
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border text-xs font-black mt-0.5 ${
                          showCorrect
                            ? 'border-emerald-400 bg-emerald-500 text-black'
                            : showWrong
                            ? 'border-red-400 bg-red-500 text-white'
                            : isChecked
                            ? 'border-sky-400 bg-sky-500 text-black'
                            : 'border-white/30 bg-black/40 text-transparent'
                        }`}
                      >
                        ✓
                      </span>

                      <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-semibold leading-relaxed">
                          {language === 'de' ? opt.textGerman : opt.textEnglish}
                        </span>
                        {language === 'de' && (
                          <span className="text-[11px] text-slate-400 mt-0.5">
                            {opt.textEnglish}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Evaluation Feedback Section */}
              {hasSubmitted && evaluationResult && (
                <div
                  className={`p-4 mt-5 rounded-2xl border ${
                    evaluationResult.isPassed
                      ? 'border-emerald-500/40 bg-emerald-950/50 text-emerald-200'
                      : 'border-red-500/40 bg-red-950/50 text-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black">
                      {evaluationResult.isPassed
                        ? '🎉 Richtig beantwortet! (Bestanden)'
                        : '❌ Falsch beantwortet (0 Punkte)'}
                    </span>
                    <span className="text-xs font-bold font-mono">
                      {evaluationResult.faultPointsAwarded} Fehlerpunkte
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-300 mb-2">
                    {language === 'de' ? scenario.explanationGerman : scenario.explanationEnglish}
                  </p>

                  {evaluationResult.isPassed && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mt-2">
                      <span>💰</span>
                      <span>Belohnung erhalten: +₦10,000 im Wallet gutgeschrieben!</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Action Button */}
            <div className="pt-4 border-t border-white/10 mt-4">
              {!hasSubmitted ? (
                <button
                  type="button"
                  onClick={submitAnswers}
                  disabled={selectedOptionIds.length === 0}
                  className={`w-full py-3.5 rounded-2xl text-sm font-extrabold transition-all shadow-xl cursor-pointer ${
                    selectedOptionIds.length > 0
                      ? 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white active:scale-98'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                  }`}
                >
                  {selectedOptionIds.length > 0
                    ? 'Antwort abgeben (Submit Answer)'
                    : 'Bitte Antwort auswählen (Select Option)'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = DRIVING_THEORY_SCENARIOS.findIndex(
                      (s) => s.id === currentScenarioId
                    );
                    const nextIndex = (currentIndex + 1) % DRIVING_THEORY_SCENARIOS.length;
                    switchScenario(DRIVING_THEORY_SCENARIOS[nextIndex].id);
                  }}
                  className="w-full py-3.5 rounded-2xl text-sm font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition active:scale-98 shadow-xl cursor-pointer"
                >
                  Nächste Videofrage aufrufen → (Next Question)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
