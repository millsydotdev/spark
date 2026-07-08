import type { IRigidBody } from './IRigidBody';
import type { ICollider, ColliderDescriptor } from './ICollider';
import type { ITriggerVolume, TriggerVolumeDescriptor } from './ITriggerVolume';
export type BodyType = 'static' | 'dynamic' | 'kinematic';
export interface RigidBodyDescriptor {
    position: {
        x: number;
        y: number;
        z: number;
    };
    rotation?: {
        x: number;
        y: number;
        z: number;
        w: number;
    };
    bodyType: BodyType;
    enabled?: boolean;
}
export interface PhysicsRayInput {
    origin: {
        x: number;
        y: number;
        z: number;
    };
    direction: {
        x: number;
        y: number;
        z: number;
    };
    maxDistance: number;
    filter?: {
        groups?: number;
        excludeBody?: IRigidBody;
    };
}
export interface PhysicsRaycastHit {
    point: {
        x: number;
        y: number;
        z: number;
    };
    normal: {
        x: number;
        y: number;
        z: number;
    };
    distance: number;
    collider: ICollider;
    body: IRigidBody;
    entityId: string | null;
}
export interface CollisionPair {
    bodyA: IRigidBody;
    bodyB: IRigidBody;
    colliderA: ICollider;
    colliderB: ICollider;
    contactPoints: Array<{
        position: {
            x: number;
            y: number;
            z: number;
        };
        normal: {
            x: number;
            y: number;
            z: number;
        };
        penetration: number;
    }>;
}
export interface PhysicsWorldConfig {
    gravity: {
        x: number;
        y: number;
        z: number;
    };
    solverIterations: number;
    ccdEnabled: boolean;
    fixedTimestep: number;
}
export interface IPhysicsWorld {
    readonly config: PhysicsWorldConfig;
    init(): Promise<void>;
    step(dt: number): void;
    destroy(): void;
    createRigidBody(descriptor: RigidBodyDescriptor): IRigidBody;
    removeRigidBody(body: IRigidBody): void;
    createCollider(descriptor: ColliderDescriptor, body: IRigidBody): ICollider;
    removeCollider(collider: ICollider): void;
    createTriggerVolume(descriptor: TriggerVolumeDescriptor): ITriggerVolume;
    removeTriggerVolume(volume: ITriggerVolume): void;
    castRay(input: PhysicsRayInput): PhysicsRaycastHit | null;
    castRayAll(input: PhysicsRayInput): PhysicsRaycastHit[];
    readonly bodyList: IRigidBody[];
    readonly colliderList: ICollider[];
    onCollisionEnter: ((pair: CollisionPair) => void) | null;
    onCollisionExit: ((pair: CollisionPair) => void) | null;
}
//# sourceMappingURL=IPhysicsWorld.d.ts.map