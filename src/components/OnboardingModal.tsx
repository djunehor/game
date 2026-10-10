import { GuidedTourModal } from './GuidedTourModal';

export function OnboardingModal({ onClose }: { onClose?: () => void }) {
  return <GuidedTourModal onClose={onClose} />;
}
