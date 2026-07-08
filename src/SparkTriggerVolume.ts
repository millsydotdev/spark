import type { TriggerVolumeDescriptor } from './interfaces/ITriggerVolume';
import type { IRigidBody } from './interfaces/IRigidBody';

export type SparkWorldHandle = any;

let volumeIdCounter = 0;

export class SparkTriggerVolume {
  readonly id: string;
  private _enabled = true;
  private _onEnter: ((body: IRigidBody, entityId: string | null) => void) | null = null;
  private _onExit: ((body: IRigidBody, entityId: string | null) => void) | null = null;
  private b3Body: any = null;
  private world: SparkWorldHandle;

  constructor(world: SparkWorldHandle, descriptor: TriggerVolumeDescriptor) {
    this.world = world;
    this.id = `trigger_${++volumeIdCounter}`;

    this.b3Body = world.createBody({
      type: 'static',
      position: descriptor.position,
      isSensor: true,
      userData: -1,
    });

    const shapeOptions = {
      isSensor: true,
      enableSensorEvents: true,
      filter: { maskBits: descriptor.collisionFilter },
    };

    switch (descriptor.shape.kind) {
      case 'box':
        this.b3Body.createBox({ ...shapeOptions, halfExtents: descriptor.shape.halfExtents });
        break;
      case 'sphere':
        this.b3Body.createSphere({ ...shapeOptions, radius: descriptor.shape.radius });
        break;
      case 'capsule':
        this.b3Body.createCapsule({ ...shapeOptions, height: descriptor.shape.halfHeight * 2, radius: descriptor.shape.radius });
        break;
      default:
        this.b3Body.createSphere({ ...shapeOptions, radius: 1 });
    }
  }

  get isEnabled(): boolean { return this._enabled; }

  get onEnter(): ((body: IRigidBody, entityId: string | null) => void) | null { return this._onEnter; }
  set onEnter(handler: ((body: IRigidBody, entityId: string | null) => void) | null) { this._onEnter = handler; }

  get onExit(): ((body: IRigidBody, entityId: string | null) => void) | null { return this._onExit; }
  set onExit(handler: ((body: IRigidBody, entityId: string | null) => void) | null) { this._onExit = handler; }

  setEnabled(enabled: boolean): void { this._enabled = enabled; }

  setPosition(x: number, y: number, z: number): void {
    if (this.b3Body) {
      this.b3Body.setTransform({ x, y, z }, { x: 0, y: 0, z: 0, w: 1 });
    }
  }

  processSensorEvents(rigidBodyMap: Map<number, IRigidBody>): void {
    if (!this._enabled || !this.world) return;

    const events = this.world.getSensorEvents();
    if (!events) return;

    for (const event of events.begin) {
      if (event.visitorUserData === -1 || event.sensorUserData === -1) {
        const otherUserData = event.sensorUserData === -1 ? event.visitorUserData : event.sensorUserData;
        const otherBody = rigidBodyMap.get(otherUserData) ?? null;
        if (otherBody && this._onEnter) {
          this._onEnter(otherBody, null);
        }
      }
    }

    for (const event of events.end) {
      if (event.visitorUserData === -1 || event.sensorUserData === -1) {
        const otherUserData = event.sensorUserData === -1 ? event.visitorUserData : event.sensorUserData;
        const otherBody = rigidBodyMap.get(otherUserData) ?? null;
        if (otherBody && this._onExit) {
          this._onExit(otherBody, null);
        }
      }
    }
  }

  destroy(): void {
    if (this.b3Body) {
      this.b3Body.destroy();
      this.b3Body = null;
    }
    this._onEnter = null;
    this._onExit = null;
  }
}
