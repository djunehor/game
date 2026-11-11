export interface GameStats {
  relaysDestroyed: number;
  totalRelays: number;
  enemiesEliminated: number;
  shotsFired: number;
  shotsHit: number;
  timeElapsed: number; // in seconds
}

export type GamePhase = 'briefing' | 'playing' | 'victory' | 'defeat';

export class GameState {
  public health: number = 100;
  public maxHealth: number = 100;
  public phase: GamePhase = 'briefing';

  public relaysDestroyed: number = 0;
  public readonly totalRelays: number = 3;

  public enemiesEliminated: number = 0;
  public totalEnemies: number = 6;

  public shotsFired: number = 0;
  public shotsHit: number = 0;
  public startTime: number = 0;
  public endTime: number = 0;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.health = this.maxHealth;
    this.phase = 'briefing';
    this.relaysDestroyed = 0;
    this.enemiesEliminated = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.startTime = 0;
    this.endTime = 0;
  }

  public start(): void {
    this.phase = 'playing';
    this.startTime = performance.now();
  }

  public takeDamage(amount: number): boolean {
    if (this.phase !== 'playing') return false;
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.phase = 'defeat';
      this.endTime = performance.now();
      return true; // died
    }
    return false;
  }

  public heal(amount: number): void {
    if (this.phase !== 'playing') return;
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  public destroyRelay(): boolean {
    if (this.phase !== 'playing') return false;
    this.relaysDestroyed = Math.min(this.totalRelays, this.relaysDestroyed + 1);
    this.checkVictory();
    return true;
  }

  public eliminateEnemy(): void {
    if (this.phase !== 'playing') return;
    this.enemiesEliminated++;
  }

  public recordShot(hit: boolean): void {
    if (this.phase !== 'playing') return;
    this.shotsFired++;
    if (hit) {
      this.shotsHit++;
    }
  }

  public checkVictory(): boolean {
    if (this.relaysDestroyed >= this.totalRelays) {
      return true;
    }
    return false;
  }

  public triggerExtraction(): boolean {
    if (this.phase !== 'playing') return false;
    if (this.checkVictory()) {
      this.phase = 'victory';
      this.endTime = performance.now();
      return true;
    }
    return false;
  }

  public getAccuracy(): number {
    if (this.shotsFired === 0) return 0;
    return Math.round((this.shotsHit / this.shotsFired) * 100);
  }

  public getElapsedTime(): number {
    if (this.startTime === 0) return 0;
    const end = this.endTime > 0 ? this.endTime : performance.now();
    return Math.floor((end - this.startTime) / 1000);
  }

  public getFormattedTime(): string {
    const totalSeconds = this.getElapsedTime();
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

