import type { ICollider } from './ICollider';
export interface CharacterControllerConfig {
    offset: number;
    snapToGround: boolean;
    snapToGroundDistance: number;
    autostepMaxHeight: number;
    autostepMinWidth: number;
    maxSlopeAngle: number;
}
export interface ICharacterController {
    readonly config: CharacterControllerConfig;
    computeMovement(position: {
        x: number;
        y: number;
        z: number;
    }, velocity: {
        x: number;
        y: number;
        z: number;
    }, dt: number, colliders: ICollider[]): {
        position: {
            x: number;
            y: number;
            z: number;
        };
        grounded: boolean;
    };
    setCollisionGroups(membership: number, filter: number): void;
    destroy(): void;
}
//# sourceMappingURL=ICharacterController.d.ts.map