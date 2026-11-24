export class SimulationClock {
  private timerId: NodeJS.Timeout | null = null;
  private intervalMs: number = 100; // Base tick rate: 10Hz (100ms per tick)
  private speed: number = 1.0;
  private elapsedMs: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private onTickCallback?: (elapsedMs: number, dt: number) => void;

  constructor(onTick?: (elapsedMs: number, dt: number) => void) {
    this.onTickCallback = onTick;
  }

  public setSpeed(speed: number): void {
    if (speed <= 0) return;
    this.speed = speed;
    if (this.isRunning && !this.isPaused) {
      this.restartTimer();
    }
  }

  public getSpeed(): number {
    return this.speed;
  }

  public getElapsedMs(): number {
    return this.elapsedMs;
  }

  public getFormattedTime(): string {
    const totalSeconds = Math.floor(this.elapsedMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const millis = Math.floor((this.elapsedMs % 1000) / 100);

    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    return `${mm}:${ss}.${millis}`;
  }

  public start(): void {
    if (this.isRunning && !this.isPaused) return;

    this.isRunning = true;
    this.isPaused = false;
    this.restartTimer();
  }

  public pause(): void {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    this.clearTimer();
  }

  public resume(): void {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this.restartTimer();
  }

  public stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    this.clearTimer();
  }

  public reset(): void {
    this.stop();
    this.elapsedMs = 0;
  }

  /**
   * Deterministic manual single tick step (great for testing and frame-stepping).
   */
  public step(dtMs: number = 100): void {
    this.elapsedMs += dtMs;
    if (this.onTickCallback) {
      this.onTickCallback(this.elapsedMs, dtMs);
    }
  }

  private restartTimer(): void {
    this.clearTimer();
    const actualInterval = Math.max(10, Math.round(this.intervalMs / this.speed));
    this.timerId = setInterval(() => {
      // Simulate advance of intervalMs in simulation time
      const dt = this.intervalMs;
      this.elapsedMs += dt;
      if (this.onTickCallback) {
        this.onTickCallback(this.elapsedMs, dt);
      }
    }, actualInterval);
  }

  private clearTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public getState() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      speed: this.speed,
      elapsedMs: this.elapsedMs,
      timeFormatted: this.getFormattedTime(),
    };
  }
}
