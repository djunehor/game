import { SoundEngine } from '../audio/SoundEngine';

export interface TutorialStep {
  id: string;
  stepNumber: number;
  totalSteps: number;
  title: string;
  instruction: string;
  keyHint: string;
}

export class TutorialManager {
  private sound: SoundEngine;
  public isActive: boolean = false;
  public currentStepIndex: number = 0;

  private bannerElement: HTMLElement | null = null;
  private titleElement: HTMLElement | null = null;
  private instructionElement: HTMLElement | null = null;
  private hintElement: HTMLElement | null = null;
  private statusElement: HTMLElement | null = null;

  // Tracking state for completion detection
  private initialYaw: number = 0;
  private startPosition: { x: number; z: number } = { x: 0, z: 0 };
  private latestYaw: number = 0;
  private latestPos: { x: number; z: number } = { x: 0, z: 0 };
  private stepCooldown: boolean = false;

  private readonly steps: TutorialStep[] = [
    {
      id: 'turn_left',
      stepNumber: 1,
      totalSteps: 8,
      title: 'CALIBRATION 1/8: TURN LEFT',
      instruction: 'Orient sensor suite to port-side (left)',
      keyHint: 'Press [ArrowLeft]',
    },
    {
      id: 'turn_right',
      stepNumber: 2,
      totalSteps: 8,
      title: 'CALIBRATION 2/8: TURN RIGHT',
      instruction: 'Orient sensor suite to starboard-side (right)',
      keyHint: 'Press [ArrowRight]',
    },
    {
      id: 'move_forward',
      stepNumber: 3,
      totalSteps: 8,
      title: 'CALIBRATION 3/8: MOVE FORWARD',
      instruction: 'Advance forward across the wet tarmac',
      keyHint: 'Press [W] or [ArrowUp]',
    },
    {
      id: 'strafe',
      stepNumber: 4,
      totalSteps: 8,
      title: 'CALIBRATION 4/8: TACTICAL STRAFE',
      instruction: 'Strafe sideways to evade hostile sightlines',
      keyHint: 'Press [A] or [D]',
    },
    {
      id: 'jump',
      stepNumber: 5,
      totalSteps: 8,
      title: 'CALIBRATION 5/8: VERTICAL JUMP',
      instruction: 'Leap upward to clear low obstacles',
      keyHint: 'Press [Space]',
    },
    {
      id: 'aim_ads',
      stepNumber: 6,
      totalSteps: 8,
      title: 'CALIBRATION 6/8: AIM DOWN SIGHTS (ADS)',
      instruction: 'Raise weapon holographic sight to eye level',
      keyHint: 'Press [Q]',
    },
    {
      id: 'fire',
      stepNumber: 7,
      totalSteps: 8,
      title: 'CALIBRATION 7/8: FIRE CARBINE',
      instruction: 'Discharge single round downrange',
      keyHint: 'Press [F]',
    },
    {
      id: 'reload',
      stepNumber: 8,
      totalSteps: 8,
      title: 'CALIBRATION 8/8: CYCLE MAGAZINE',
      instruction: 'Reload tactical 5.56mm magazine',
      keyHint: 'Press [R]',
    },
  ];

  constructor(sound: SoundEngine) {
    this.sound = sound;
  }

  public initDOM(): void {
    this.bannerElement = document.getElementById('tutorial-banner');
    this.titleElement = document.getElementById('tutorial-title');
    this.instructionElement = document.getElementById('tutorial-instruction');
    this.hintElement = document.getElementById('tutorial-hint');
    this.statusElement = document.getElementById('tutorial-status');
  }

  public start(currentYaw: number, currentPos: { x: number; z: number }): void {
    this.isActive = true;
    this.currentStepIndex = 0;
    this.initialYaw = currentYaw;
    this.startPosition = { x: currentPos.x, z: currentPos.z };
    this.latestYaw = currentYaw;
    this.latestPos = { x: currentPos.x, z: currentPos.z };
    this.stepCooldown = false;

    if (this.bannerElement) {
      this.bannerElement.classList.remove('hidden');
    }
    this.renderCurrentStep();
  }

  public stop(): void {
    this.isActive = false;
    if (this.bannerElement) {
      this.bannerElement.classList.add('hidden');
    }
  }

  private renderCurrentStep(): void {
    const step = this.steps[this.currentStepIndex];
    if (!step) return;

    if (this.titleElement) this.titleElement.innerText = step.title;
    if (this.instructionElement) this.instructionElement.innerText = step.instruction;
    if (this.hintElement) this.hintElement.innerText = step.keyHint;
    if (this.statusElement) {
      this.statusElement.innerText = 'STATUS: AWAITING INPUT';
      this.statusElement.className = 'tutorial-status pending';
    }
  }

  public confirmStep(): void {
    if (this.stepCooldown || !this.isActive) return;
    this.stepCooldown = true;

    this.sound.playHitMarker();

    if (this.statusElement) {
      this.statusElement.innerText = 'STATUS: CONFIRMED [OK]';
      this.statusElement.className = 'tutorial-status confirmed';
    }

    setTimeout(() => {
      this.currentStepIndex++;
      this.stepCooldown = false;
      this.initialYaw = this.latestYaw;
      this.startPosition = { x: this.latestPos.x, z: this.latestPos.z };

      if (this.currentStepIndex >= this.steps.length) {
        this.completeTutorial();
      } else {
        this.renderCurrentStep();
      }
    }, 500);
  }

  private completeTutorial(): void {
    if (this.titleElement) this.titleElement.innerText = 'SYSTEMS OPERATIONAL // CALIBRATION 100%';
    if (this.instructionElement) this.instructionElement.innerText = 'ALL CONTROLS VERIFIED. COMMENCE PRIMARY MISSION.';
    if (this.hintElement) this.hintElement.innerText = 'Objective: Destroy 3 Security Relays and Reach Extraction.';
    if (this.statusElement) {
      this.statusElement.innerText = 'STATUS: COMPLETE';
      this.statusElement.className = 'tutorial-status confirmed';
    }

    setTimeout(() => {
      this.stop();
    }, 2400);
  }

  public checkProgress(
    yaw: number,
    pos: { x: number; z: number },
    isGrounded: boolean,
    isAiming: boolean,
    firedShot: boolean,
    isReloading: boolean
  ): void {
    this.latestYaw = yaw;
    this.latestPos = { x: pos.x, z: pos.z };

    if (!this.isActive || this.stepCooldown) return;

    const step = this.steps[this.currentStepIndex];
    if (!step) return;

    switch (step.id) {
      case 'turn_left': {
        if (yaw - this.initialYaw > 0.22) {
          this.confirmStep();
        }
        break;
      }
      case 'turn_right': {
        if (this.initialYaw - yaw > 0.22) {
          this.confirmStep();
        }
        break;
      }
      case 'move_forward': {
        const dx = pos.x - this.startPosition.x;
        const dz = pos.z - this.startPosition.z;
        const forwardDist = dx * (-Math.sin(yaw)) + dz * (-Math.cos(yaw));
        if (forwardDist > 1.2) {
          this.confirmStep();
        }
        break;
      }
      case 'strafe': {
        const dx = pos.x - this.startPosition.x;
        const dz = pos.z - this.startPosition.z;
        const lateralDist = Math.abs(dx * Math.cos(yaw) + dz * (-Math.sin(yaw)));
        if (lateralDist > 0.8) {
          this.confirmStep();
        }
        break;
      }
      case 'jump': {
        if (!isGrounded) {
          this.confirmStep();
        }
        break;
      }
      case 'aim_ads': {
        if (isAiming) {
          this.confirmStep();
        }
        break;
      }
      case 'fire': {
        if (firedShot) {
          this.confirmStep();
        }
        break;
      }
      case 'reload': {
        if (isReloading) {
          this.confirmStep();
        }
        break;
      }
    }
  }
}
