export interface PhysicsDebugFrame {
  colliders: Array<{
    vertices: Float32Array;
    indices: Uint32Array;
    color: { r: number; g: number; b: number };
    isActive: boolean;
  }>;
  contactPoints: Array<{
    position: { x: number; y: number; z: number };
    normal: { x: number; y: number; z: number };
    penetration: number;
  }>;
}

export interface IPhysicsDebug {
  readonly enabled: boolean;
  toggle(): void;
  getDebugData(): PhysicsDebugFrame;
}
