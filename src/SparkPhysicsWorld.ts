import type {
  IPhysicsWorld,
  RigidBodyDescriptor,
  PhysicsRayInput,
  PhysicsRaycastHit,
  CollisionPair,
  PhysicsWorldConfig,
} from './interfaces/IPhysicsWorld';
import type { IRigidBody } from './interfaces/IRigidBody';
import type { ICollider, ColliderDescriptor } from './interfaces/ICollider';
import type { ITriggerVolume, TriggerVolumeDescriptor } from './interfaces/ITriggerVolume';
import { SparkRigidBody } from './SparkRigidBody';
import { SparkCollider } from './SparkCollider';
import { SparkTriggerVolume } from './SparkTriggerVolume';

interface SparkModule {
  World: new (config?: any) => any
  Body: new (...args: any[]) => any
  Shape: new (...args: any[]) => any
  threaded: boolean
  maxWorkers: number
}

export class SparkPhysicsWorld implements IPhysicsWorld {
  private module: any = null;
  private world: any = null;
  private rigidBodies = new Map<number, SparkRigidBody>();
  private colliderMap = new Map<number, SparkCollider>();
  private triggerVolumes = new Map<string, SparkTriggerVolume>();
  private nextBodyHandle = 1;

  private _config: PhysicsWorldConfig;
  private _onCollisionEnter: ((pair: CollisionPair) => void) | null = null;
  private _onCollisionExit: ((pair: CollisionPair) => void) | null = null;

  constructor(config?: Partial<PhysicsWorldConfig>) {
    this._config = {
      gravity: config?.gravity ?? { x: 0, y: -9.81, z: 0 },
      solverIterations: config?.solverIterations ?? 4,
      ccdEnabled: config?.ccdEnabled ?? true,
      fixedTimestep: config?.fixedTimestep ?? 1 / 60,
    };
  }

  get config(): PhysicsWorldConfig { return { ...this._config }; }
  get onCollisionEnter(): ((pair: CollisionPair) => void) | null { return this._onCollisionEnter; }
  set onCollisionEnter(handler: ((pair: CollisionPair) => void) | null) { this._onCollisionEnter = handler; }
  get onCollisionExit(): ((pair: CollisionPair) => void) | null { return this._onCollisionExit; }
  set onCollisionExit(handler: ((pair: CollisionPair) => void) | null) { this._onCollisionExit = handler; }

  get b3World(): any { return this.world; }

  get bodyList(): IRigidBody[] { return [...this.rigidBodies.values()]; }
  get colliderList(): ICollider[] { return [...this.colliderMap.values()]; }

  async init(): Promise<void> {
    const { default: SparkMod } = await import('./spark.mjs');
    this.module = await SparkMod() as SparkModule;

    this.world = new this.module.World({
      gravity: { x: 0, y: this._config.gravity.y, z: 0 },
      enableSleep: true,
      enableContinuous: this._config.ccdEnabled,
    });
  }

  step(dt: number): void {
    if (!this.world) return;

    this.world.step(dt, Math.max(1, this._config.solverIterations));

    if (this._onCollisionEnter || this._onCollisionExit) {
      this.processContactEvents();
    }

    this.processBodyEvents();
  }

  private processContactEvents(): void {
    if (!this.world) return;
    const events = this.world.getContactEvents();

    if (this._onCollisionEnter) {
      for (const contact of events.begin) {
        const bodyA = this.findBodyByShapeUserData(contact.shapeUserDataA);
        const bodyB = this.findBodyByShapeUserData(contact.shapeUserDataB);
        if (bodyA && bodyB) {
          this._onCollisionEnter({
            bodyA,
            bodyB,
            colliderA: (bodyA as SparkRigidBody).getColliders()[0]!,
            colliderB: (bodyB as SparkRigidBody).getColliders()[0]!,
            contactPoints: [],
          });
        }
      }
    }

    if (this._onCollisionExit) {
      for (const contact of events.end) {
        const bodyA = this.findBodyByShapeUserData(contact.shapeUserDataA);
        const bodyB = this.findBodyByShapeUserData(contact.shapeUserDataB);
        if (bodyA && bodyB) {
          this._onCollisionExit({
            bodyA,
            bodyB,
            colliderA: (bodyA as SparkRigidBody).getColliders()[0]!,
            colliderB: (bodyB as SparkRigidBody).getColliders()[0]!,
            contactPoints: [],
          });
        }
      }
    }

    this.processSensorEvents();
  }

  private processSensorEvents(): void {
    const bodyMap = new Map<number, IRigidBody>();
    for (const [handle, body] of this.rigidBodies) {
      bodyMap.set(handle, body);
    }
    for (const [, volume] of this.triggerVolumes) {
      volume.processSensorEvents(bodyMap);
    }
  }

  private processBodyEvents(): void {
  }

  destroy(): void {
    for (const [, body] of this.rigidBodies) body.destroy();
    this.rigidBodies.clear();
    this.colliderMap.clear();
    this.triggerVolumes.clear();
    if (this.world) {
      this.world.destroy();
      this.world = null;
    }
  }

  createRigidBody(descriptor: RigidBodyDescriptor): IRigidBody {
    if (!this.world) throw new Error('[Spark] Physics world not initialized');

    const b3Body = this.world.createBody({
      type: descriptor.bodyType,
      position: descriptor.position,
      rotation: descriptor.rotation ?? { x: 0, y: 0, z: 0, w: 1 },
      userData: this.nextBodyHandle,
    });

    const handle = this.nextBodyHandle++;
    const body = new SparkRigidBody(b3Body, handle, descriptor.bodyType);
    this.rigidBodies.set(handle, body);
    return body;
  }

  removeRigidBody(body: IRigidBody): void {
    if (!this.world) return;
    const sparkBody = body as SparkRigidBody;
    sparkBody.destroy();
    this.rigidBodies.delete(sparkBody.handle);
  }

  createCollider(descriptor: ColliderDescriptor, body: IRigidBody): ICollider {
    if (!this.world) throw new Error('[Spark] Physics world not initialized');

    const b3Body = (body as SparkRigidBody).b3Body;

    const hasFilter = descriptor.collisionGroups !== undefined;
    const shapeOptions = {
      density: 1.0,
      friction: descriptor.friction ?? 0.5,
      restitution: descriptor.restitution ?? 0.2,
      isSensor: descriptor.isSensor ?? false,
      ...(hasFilter ? { filter: { categoryBits: descriptor.collisionGroups!.membership, maskBits: descriptor.collisionGroups!.filter } } : {}),
    } as any;

    let b3Shape: any;
    switch (descriptor.shape.kind) {
      case 'box':
        b3Shape = b3Body.createBox({ ...shapeOptions, halfExtents: descriptor.shape.halfExtents });
        break;
      case 'sphere':
        b3Shape = b3Body.createSphere({ ...shapeOptions, radius: descriptor.shape.radius });
        break;
      case 'capsule':
        b3Shape = b3Body.createCapsule({ ...shapeOptions, height: descriptor.shape.halfHeight * 2, radius: descriptor.shape.radius });
        break;
      case 'cylinder':
        b3Shape = b3Body.createCylinder({ ...shapeOptions, height: descriptor.shape.halfHeight * 2, radius: descriptor.shape.radius });
        break;
      case 'convexHull': {
        const verts = descriptor.shape.vertices;
        const points: Array<{ x: number; y: number; z: number }> = [];
        for (let i = 0; i < verts.length; i += 3) {
          points.push({ x: verts[i]!, y: verts[i + 1]!, z: verts[i + 2]! });
        }
        b3Shape = b3Body.createHull({ ...shapeOptions, points });
        break;
      }
      case 'trimesh': {
        const verts = descriptor.shape.vertices;
        const pointObjs: Array<{ x: number; y: number; z: number }> = [];
        for (let i = 0; i < verts.length; i += 3) {
          pointObjs.push({ x: verts[i]!, y: verts[i + 1]!, z: verts[i + 2]! });
        }
        b3Shape = b3Body.createMesh({ ...shapeOptions, vertices: pointObjs, indices: descriptor.shape.indices ?? [] });
        break;
      }
      default:
        throw new Error(`[Spark] Unsupported shape kind: ${(descriptor.shape as any).kind}`);
    }

    const collider = new SparkCollider(b3Shape, descriptor.shape);
    const shapeHandle = b3Shape.getUserData() ?? this.colliderMap.size + 1;
    this.colliderMap.set(shapeHandle, collider);
    (body as SparkRigidBody).addCollider(collider);
    return collider;
  }

  removeCollider(collider: ICollider): void {
    const sparkCollider = collider as SparkCollider;
    sparkCollider.destroy();
  }

  createTriggerVolume(descriptor: TriggerVolumeDescriptor): ITriggerVolume {
    if (!this.world) throw new Error('[Spark] Physics world not initialized');
    const volume = new SparkTriggerVolume(this.world, descriptor);
    this.triggerVolumes.set(volume.id, volume);
    return volume;
  }

  removeTriggerVolume(volume: ITriggerVolume): void {
    this.triggerVolumes.delete(volume.id);
    volume.destroy();
  }

  castRay(input: PhysicsRayInput): PhysicsRaycastHit | null {
    if (!this.world) return null;

    const rayFilter = input.filter?.groups !== undefined
      ? { maskBits: input.filter.groups }
      : undefined;

    const translation = {
      x: input.direction.x * input.maxDistance,
      y: input.direction.y * input.maxDistance,
      z: input.direction.z * input.maxDistance,
    };

    const result = rayFilter
      ? this.world.castRayClosest(input.origin, translation, rayFilter)
      : this.world.castRayClosest(input.origin, translation);

    if (!result || !result.hit) return null;

    let body: IRigidBody | undefined;
    if (result.bodyUserData) {
      body = this.findBodyByUserData(result.bodyUserData);
    }
    if (!body) {
      for (const [, b] of this.rigidBodies) {
        if ((b as SparkRigidBody).b3Body === result.shape.getBody?.()) {
          body = b;
          break;
        }
      }
    }
    if (!body) return null;

    const distance = result.fraction * input.maxDistance;

    return {
      point: result.point,
      normal: result.normal,
      distance,
      collider: this.colliderMap.get(result.shapeUserData) ?? (body as SparkRigidBody).getColliders()[0]!,
      body,
      entityId: null,
    };
  }

  castRayAll(input: PhysicsRayInput): PhysicsRaycastHit[] {
    if (!this.world) return [];

    const translation = {
      x: input.direction.x * input.maxDistance,
      y: input.direction.y * input.maxDistance,
      z: input.direction.z * input.maxDistance,
    };

    const rayFilter = input.filter?.groups !== undefined
      ? { maskBits: input.filter.groups }
      : undefined;

    const results: any[] = rayFilter
      ? this.world.castRayAll(input.origin, translation, rayFilter)
      : this.world.castRayAll(input.origin, translation);

    if (!results || results.length === 0) return [];

    const bodyCache = new Map<number, IRigidBody>();

    return results.map((r: any) => {
      let body = r.bodyUserData ? bodyCache.get(r.bodyUserData) ?? this.findBodyByUserData(r.bodyUserData) : undefined;
      if (body) bodyCache.set(r.bodyUserData!, body);

      if (!body) {
        for (const [, b] of this.rigidBodies) {
          if ((b as SparkRigidBody).b3Body === r.shape?.getBody?.()) {
            body = b;
            break;
          }
        }
      }
      if (!body) return null;

      return {
        point: r.point,
        normal: r.normal,
        distance: r.fraction * input.maxDistance,
        collider: this.colliderMap.get(r.shapeUserData) ?? (body as SparkRigidBody).getColliders()[0]!,
        body,
        entityId: null,
      };
    }).filter(Boolean) as PhysicsRaycastHit[];
  }

  private findBodyByShapeUserData(shapeUserData: number): IRigidBody | undefined {
    for (const [, body] of this.rigidBodies) {
      for (const collider of body.getColliders()) {
        const sparkCollider = collider as SparkCollider;
        if (sparkCollider.handle === shapeUserData) {
          return body;
        }
      }
    }
    return undefined;
  }

  private findBodyByUserData(userData: number): IRigidBody | undefined {
    for (const [, body] of this.rigidBodies) {
      if (body.handle === userData) return body;
    }
    return undefined;
  }
}
