import type { BodyType } from './IPhysicsWorld';
export interface IRigidBody {
    readonly type: BodyType;
    readonly isEnabled: boolean;
    position(): {
        x: number;
        y: number;
        z: number;
    };
    setPosition(x: number, y: number, z: number): void;
    rotation(): {
        x: number;
        y: number;
        z: number;
        w: number;
    };
    setRotation(x: number, y: number, z: number, w: number): void;
    setEnabled(enabled: boolean): void;
    setGravityScale(scale: number): void;
    setLinearDamping(damping: number): void;
    setAngularDamping(damping: number): void;
    applyForce(force: {
        x: number;
        y: number;
        z: number;
    }, point: {
        x: number;
        y: number;
        z: number;
    }): void;
    applyImpulse(impulse: {
        x: number;
        y: number;
        z: number;
    }, point: {
        x: number;
        y: number;
        z: number;
    }): void;
    setLinearVelocity(velocity: {
        x: number;
        y: number;
        z: number;
    }): void;
    getLinearVelocity(): {
        x: number;
        y: number;
        z: number;
    };
    destroy(): void;
}
//# sourceMappingURL=IRigidBody.d.ts.map