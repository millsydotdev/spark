export type ColliderShapeDescriptor =
  | { kind: 'box'; halfExtents: { x: number; y: number; z: number } }
  | { kind: 'sphere'; radius: number }
  | { kind: 'capsule'; halfHeight: number; radius: number }
  | { kind: 'cylinder'; halfHeight: number; radius: number }
  | { kind: 'convexHull'; vertices: Float32Array }
  | { kind: 'trimesh'; vertices: Float32Array; indices: Uint32Array };

export interface ColliderDescriptor {
  shape: ColliderShapeDescriptor;
  collisionGroups?: { membership: number; filter: number };
  isSensor?: boolean;
  restitution?: number;
  friction?: number;
}

export interface ICollider {
  readonly shape: ColliderShapeDescriptor;
  setCollisionGroups(membership: number, filter: number): void;
  setSensor(enabled: boolean): void;
  setRestitution(restitution: number): void;
  setFriction(friction: number): void;
  destroy(): void;
}
