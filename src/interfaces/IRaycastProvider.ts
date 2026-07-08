import type { IRigidBody } from './IRigidBody';
import type { ICollider } from './ICollider';

export interface RayInput {
  origin: { x: number; y: number; z: number };
  direction: { x: number; y: number; z: number };
  maxDistance: number;
  filter?: { groups?: number; excludeBody?: IRigidBody };
}

export interface RaycastHit {
  point: { x: number; y: number; z: number };
  normal: { x: number; y: number; z: number };
  distance: number;
  collider: ICollider;
  body: IRigidBody;
  entityId: string | null;
}

export interface IRaycastProvider {
  castRay(input: RayInput): RaycastHit | null;
  castRayAll(input: RayInput): RaycastHit[];
}
