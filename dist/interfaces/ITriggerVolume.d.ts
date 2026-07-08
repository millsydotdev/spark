import type { IRigidBody } from './IRigidBody';
import type { ColliderShapeDescriptor } from './ICollider';
export interface TriggerVolumeDescriptor {
    shape: ColliderShapeDescriptor;
    position: {
        x: number;
        y: number;
        z: number;
    };
    collisionFilter: number;
}
export interface ITriggerVolume {
    readonly id: string;
    readonly isEnabled: boolean;
    setEnabled(enabled: boolean): void;
    setPosition(x: number, y: number, z: number): void;
    onEnter: ((body: IRigidBody, entityId: string | null) => void) | null;
    onExit: ((body: IRigidBody, entityId: string | null) => void) | null;
    destroy(): void;
}
//# sourceMappingURL=ITriggerVolume.d.ts.map