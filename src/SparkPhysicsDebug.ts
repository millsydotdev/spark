import type { IPhysicsDebug, PhysicsDebugFrame } from './interfaces/IPhysicsDebug';

export class SparkPhysicsDebug implements IPhysicsDebug {
  private _enabled = false;

  get enabled(): boolean { return this._enabled; }

  toggle(): void {
    this._enabled = !this._enabled;
  }

  getDebugData(): PhysicsDebugFrame {
    return { colliders: [], contactPoints: [] };
  }
}
