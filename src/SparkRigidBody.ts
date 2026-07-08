import type { IRigidBody } from './interfaces/IRigidBody';
import type { BodyType } from './interfaces/IPhysicsWorld';
import type { ICollider } from './interfaces/ICollider';

export type SparkBodyHandle = any;

export class SparkRigidBody implements IRigidBody {
  readonly b3Body: SparkBodyHandle;
  readonly handle: number;
  readonly type: BodyType;
  private _enabled = true;
  private _colliders: ICollider[] = [];

  constructor(b3Body: SparkBodyHandle, handle: number, type: string) {
    this.b3Body = b3Body;
    this.handle = handle;
    this.type = type as BodyType;
    b3Body.setUserData(handle);
  }

  get isEnabled(): boolean {
    return this._enabled;
  }

  addCollider(collider: ICollider): void {
    this._colliders.push(collider);
  }

  getColliders(): ICollider[] {
    return [...this._colliders];
  }

  position(): { x: number; y: number; z: number } {
    return this.b3Body.getPosition();
  }

  setPosition(x: number, y: number, z: number): void {
    const rot = this.b3Body.getRotation();
    this.b3Body.setTransform({ x, y, z }, rot);
  }

  rotation(): { x: number; y: number; z: number; w: number } {
    return this.b3Body.getRotation();
  }

  setRotation(x: number, y: number, z: number, w: number): void {
    const pos = this.b3Body.getPosition();
    this.b3Body.setTransform(pos, { x, y, z, w });
  }

  setEnabled(enabled: boolean): void {
    this._enabled = enabled;
    this.b3Body.setEnabled(enabled);
  }

  setGravityScale(scale: number): void {
    this.b3Body.setGravityScale(scale);
  }

  setLinearDamping(damping: number): void {
    this.b3Body.setLinearDamping(damping);
  }

  setAngularDamping(damping: number): void {
    this.b3Body.setAngularDamping(damping);
  }

  applyForce(force: { x: number; y: number; z: number }, point: { x: number; y: number; z: number }): void {
    this.b3Body.applyForce(force, point, true);
  }

  applyImpulse(impulse: { x: number; y: number; z: number }, _point: { x: number; y: number; z: number }): void {
    this.b3Body.applyLinearImpulseToCenter(impulse, true);
  }

  setLinearVelocity(velocity: { x: number; y: number; z: number }): void {
    this.b3Body.setLinearVelocity(velocity);
  }

  getLinearVelocity(): { x: number; y: number; z: number } {
    return this.b3Body.getLinearVelocity();
  }

  destroy(): void {
    this._colliders.length = 0;
    if (this.b3Body.isValid()) {
      this.b3Body.destroy();
    }
  }
}
