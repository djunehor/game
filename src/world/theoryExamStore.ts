import { create } from 'zustand';
import { DRIVING_THEORY_SCENARIOS, type TheoryScenario } from '../data/drivingTheoryScenarios';
import { useEconomyStore } from './economyStore';
import { sound } from '../engine/sound';

export type CameraViewMode = 'cockpit' | 'third_person' | 'aerial';

export interface ExamEvaluationResult {
  isPassed: boolean;
  scorePercent: number;
  correctCount: number;
  totalCorrect: number;
  faultPointsAwarded: number;
  rewardEarnedNaira: number;
  feedbackGerman: string;
  feedbackEnglish: string;
}

interface TheoryExamState {
  isOpen: boolean;
  currentScenarioId: string;
  playbackTime: number;
  isPlaying: boolean;
  isFrozen: boolean;
  replaysRemaining: number;
  selectedOptionIds: number[];
  hasSubmitted: boolean;
  evaluationResult: ExamEvaluationResult | null;
  cameraMode: CameraViewMode;
  indicatorActive: 'none' | 'left' | 'right';

  // Actions
  openExam: (scenarioId?: string) => void;
  closeExam: () => void;
  play: () => void;
  pause: () => void;
  replay: () => void;
  tick: (deltaSeconds: number) => void;
  toggleOption: (optionId: number) => void;
  submitAnswers: () => ExamEvaluationResult;
  switchScenario: (scenarioId: string) => void;
  setCameraMode: (mode: CameraViewMode) => void;
  resetExam: () => void;
}

const MAX_REPLAYS = 5; // Official German Driving Exam video limit: 5 views maximum

export const useTheoryExamStore = create<TheoryExamState>((set, get) => ({
  isOpen: false,
  currentScenarioId: DRIVING_THEORY_SCENARIOS[0].id,
  playbackTime: 0,
  isPlaying: false,
  isFrozen: false,
  replaysRemaining: MAX_REPLAYS,
  selectedOptionIds: [],
  hasSubmitted: false,
  evaluationResult: null,
  cameraMode: 'cockpit',
  indicatorActive: 'none',

  openExam: (scenarioId?: string) => {
    const id = scenarioId || get().currentScenarioId || DRIVING_THEORY_SCENARIOS[0].id;
    set({
      isOpen: true,
      currentScenarioId: id,
      playbackTime: 0,
      isPlaying: true,
      isFrozen: false,
      replaysRemaining: MAX_REPLAYS,
      selectedOptionIds: [],
      hasSubmitted: false,
      evaluationResult: null,
      cameraMode: 'cockpit',
      indicatorActive: id === 'radfahrer_abwaerts' ? 'right' : 'none',
    });
  },

  closeExam: () => {
    set({
      isOpen: false,
      isPlaying: false,
    });
  },

  play: () => {
    if (!get().isFrozen) {
      set({ isPlaying: true });
    }
  },

  pause: () => {
    set({ isPlaying: false });
  },

  replay: () => {
    const remaining = get().replaysRemaining;
    if (remaining <= 0) {
      sound.playBiggieBuzzer();
      return;
    }
    const currentId = get().currentScenarioId;
    set({
      playbackTime: 0,
      isPlaying: true,
      isFrozen: false,
      replaysRemaining: remaining - 1,
      indicatorActive: currentId === 'radfahrer_abwaerts' ? 'right' : 'none',
    });
    sound.playRewardChime();
  },

  tick: (deltaSeconds: number) => {
    const state = get();
    if (!state.isPlaying || state.isFrozen) return;

    const scenario =
      DRIVING_THEORY_SCENARIOS.find((s) => s.id === state.currentScenarioId) ??
      DRIVING_THEORY_SCENARIOS[0];

    const nextTime = state.playbackTime + deltaSeconds;

    // Check freeze point
    if (nextTime >= scenario.freezeAtSecond) {
      set({
        playbackTime: scenario.freezeAtSecond,
        isPlaying: false,
        isFrozen: true,
      });
      sound.playBiggieBuzzer(); // Auditory prompt that video has paused for questions
    } else {
      set({ playbackTime: nextTime });
    }
  },

  toggleOption: (optionId: number) => {
    if (get().hasSubmitted) return;
    set((s) => {
      const exists = s.selectedOptionIds.includes(optionId);
      const next = exists
        ? s.selectedOptionIds.filter((id) => id !== optionId)
        : [...s.selectedOptionIds, optionId];
      return { selectedOptionIds: next };
    });
  },

  submitAnswers: () => {
    const state = get();
    const scenario =
      DRIVING_THEORY_SCENARIOS.find((s) => s.id === state.currentScenarioId) ??
      DRIVING_THEORY_SCENARIOS[0];

    const correctOptionIds = scenario.options
      .filter((opt) => opt.isCorrect)
      .map((opt) => opt.id);

    const selected = state.selectedOptionIds;

    // All correct options must be selected, and NO incorrect options may be selected
    const hasAllCorrect = correctOptionIds.every((id) => selected.includes(id));
    const hasNoIncorrect = selected.every((id) => correctOptionIds.includes(id));
    const isPassed = hasAllCorrect && hasNoIncorrect;

    const totalCorrect = correctOptionIds.length;
    const correctlyChosen = selected.filter((id) => correctOptionIds.includes(id)).length;
    const incorrectlyChosen = selected.filter((id) => !correctOptionIds.includes(id)).length;

    const scorePercent = isPassed
      ? 100
      : Math.max(0, Math.round(((correctlyChosen - incorrectlyChosen) / totalCorrect) * 100));

    const faultPoints = isPassed ? 0 : scenario.points;
    const rewardNaira = isPassed ? 10000 : 0; // ₦10,000 award for passing the exam scenario!

    if (isPassed && rewardNaira > 0) {
      useEconomyStore
        .getState()
        .earn(rewardNaira, `Passed German Driving Theory Scenario: ${scenario.titleEnglish}`);
      sound.playRewardChime();
    } else {
      sound.playBiggieBuzzer();
    }

    const result: ExamEvaluationResult = {
      isPassed,
      scorePercent,
      correctCount: correctlyChosen,
      totalCorrect,
      faultPointsAwarded: faultPoints,
      rewardEarnedNaira: rewardNaira,
      feedbackGerman: isPassed
        ? `Hervorragend bestanden! 0 Fehlerpunkte. ${scenario.explanationGerman}`
        : `Leider nicht bestanden (${faultPoints} Fehlerpunkte erhalten). ${scenario.explanationGerman}`,
      feedbackEnglish: isPassed
        ? `Passed with 0 fault points! Awarded ₦${rewardNaira.toLocaleString()}. ${scenario.explanationEnglish}`
        : `Failed (${faultPoints} fault points incurred). ${scenario.explanationEnglish}`,
    };

    set({
      hasSubmitted: true,
      evaluationResult: result,
      isPlaying: false,
    });

    return result;
  },

  switchScenario: (scenarioId: string) => {
    const exists = DRIVING_THEORY_SCENARIOS.some((s) => s.id === scenarioId);
    const validId = exists ? scenarioId : DRIVING_THEORY_SCENARIOS[0].id;
    set({
      currentScenarioId: validId,
      playbackTime: 0,
      isPlaying: true,
      isFrozen: false,
      replaysRemaining: MAX_REPLAYS,
      selectedOptionIds: [],
      hasSubmitted: false,
      evaluationResult: null,
      indicatorActive: validId === 'radfahrer_abwaerts' ? 'right' : 'none',
    });
  },

  setCameraMode: (mode: CameraViewMode) => {
    set({ cameraMode: mode });
  },

  resetExam: () => {
    set({
      isOpen: false,
      currentScenarioId: DRIVING_THEORY_SCENARIOS[0].id,
      playbackTime: 0,
      isPlaying: false,
      isFrozen: false,
      replaysRemaining: MAX_REPLAYS,
      selectedOptionIds: [],
      hasSubmitted: false,
      evaluationResult: null,
      cameraMode: 'cockpit',
      indicatorActive: 'none',
    });
  },
}));

export function getCurrentScenario(id?: string): TheoryScenario {
  const targetId = id || useTheoryExamStore.getState().currentScenarioId;
  return (
    DRIVING_THEORY_SCENARIOS.find((s) => s.id === targetId) ?? DRIVING_THEORY_SCENARIOS[0]
  );
}
