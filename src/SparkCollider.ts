import type { ICollider, ColliderShapeDescriptor } from './interfaces/ICollider';

export type SparkShapeHandle = any;

export class SparkCollider implements ICollider {
  readonly b3Shape: SparkShapeHandle;
  readonly shape: ColliderShapeDescriptor;
  readonly handle: number;

  constructor(b3Shape: SparkShapeHandle, shape: ColliderShapeDescriptor) {
    this.b3Shape = b3Shape;
    this.shape = shape;
    this.handle = b3Shape.getUserData();
  }

  setCollisionGroups(membership: number, filter: number): void {
    this.b3Shape.setFilter({ categoryBits: membership, maskBits: filter });
  }

  setSensor(_enabled: boolean): void {
    // Toggling sensor at runtime after shape creation is not supported
  }

  setRestitution(restitution: number): void {
    this.b3Shape.setRestitution(restitution);
  }

  setFriction(friction: number): void {
    this.b3Shape.setFriction(friction);
  }

  destroy(): void {
    if (this.b3Shape.isValid()) {
      this.b3Shape.destroy(true);
    }
  }
}
