import type { ICharacterController, CharacterControllerConfig } from './interfaces/ICharacterController';
import type { ICollider } from './interfaces/ICollider';

export class SparkCharacterController implements ICharacterController {
  private _config: CharacterControllerConfig;
  private membership = 0;
  private filter = 0;

  constructor(config?: Partial<CharacterControllerConfig>) {
    this._config = {
      offset: config?.offset ?? 0.01,
      snapToGround: config?.snapToGround ?? true,
      snapToGroundDistance: config?.snapToGroundDistance ?? 0.5,
      autostepMaxHeight: config?.autostepMaxHeight ?? 0.3,
      autostepMinWidth: config?.autostepMinWidth ?? 0.2,
      maxSlopeAngle: config?.maxSlopeAngle ?? 45,
    };
  }

  get config(): CharacterControllerConfig {
    return { ...this._config };
  }

  computeMovement(
    position: { x: number; y: number; z: number },
    velocity: { x: number; y: number; z: number },
    dt: number,
    _colliders: ICollider[],
  ): { position: { x: number; y: number; z: number }; grounded: boolean } {
    const newPos = {
      x: position.x + velocity.x * dt,
      y: position.y + velocity.y * dt,
      z: position.z + velocity.z * dt,
    };
    const grounded = position.y <= 0.01 && velocity.y <= 0;
    return { position: newPos, grounded };
  }

  setCollisionGroups(membership: number, filter: number): void {
    this.membership = membership;
    this.filter = filter;
  }

  destroy(): void {
  }
}
