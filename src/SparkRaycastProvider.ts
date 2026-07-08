import type { IRaycastProvider, RayInput, RaycastHit } from './interfaces/IRaycastProvider';
import type { IPhysicsWorld } from './interfaces/IPhysicsWorld';

export class SparkRaycastProvider implements IRaycastProvider {
  private physicsWorld: IPhysicsWorld;

  constructor(physicsWorld: IPhysicsWorld) {
    this.physicsWorld = physicsWorld;
  }

  castRay(input: RayInput): RaycastHit | null {
    const result = this.physicsWorld.castRay({
      origin: input.origin,
      direction: input.direction,
      maxDistance: input.maxDistance,
      filter: input.filter as any,
    });

    if (!result) return null;

    return {
      point: result.point,
      normal: result.normal,
      distance: result.distance,
      collider: result.collider,
      body: result.body,
      entityId: result.entityId,
    };
  }

  castRayAll(input: RayInput): RaycastHit[] {
    return this.physicsWorld.castRayAll({
      origin: input.origin,
      direction: input.direction,
      maxDistance: input.maxDistance,
      filter: input.filter as any,
    }).map((r) => ({
      point: r.point,
      normal: r.normal,
      distance: r.distance,
      collider: r.collider,
      body: r.body,
      entityId: r.entityId,
    }));
  }
}
