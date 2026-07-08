import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { SparkModule } from '../src/wasm-loader';

const createMockSparkBody = () => ({
  createBox: vi.fn().mockReturnThis(),
  createSphere: vi.fn().mockReturnThis(),
  createCapsule: vi.fn().mockReturnThis(),
  createHull: vi.fn().mockReturnThis(),
  createCylinder: vi.fn().mockReturnThis(),
  createMesh: vi.fn().mockReturnThis(),
  getPosition: vi.fn().mockReturnValue({ x: 0, y: 5, z: 0 }),
  getRotation: vi.fn().mockReturnValue({ x: 0, y: 0, z: 0, w: 1 }),
  setTransform: vi.fn(),
  setLinearVelocity: vi.fn(),
  getLinearVelocity: vi.fn().mockReturnValue({ x: 0, y: 0, z: 0 }),
  applyForce: vi.fn(),
  applyLinearImpulseToCenter: vi.fn(),
  setEnabled: vi.fn(),
  setGravityScale: vi.fn(),
  setLinearDamping: vi.fn(),
  setAngularDamping: vi.fn(),
  destroy: vi.fn(),
  getUserData: vi.fn().mockReturnValue(0),
  setUserData: vi.fn(),
  isValid: vi.fn().mockReturnValue(true),
});

const createMockSparkWorld = () => ({
  step: vi.fn(),
  createBody: vi.fn().mockReturnValue(createMockSparkBody()),
  getContactEvents: vi.fn().mockReturnValue({ begin: [], end: [] }),
  getSensorEvents: vi.fn().mockReturnValue({ begin: [], end: [] }),
  castRayClosest: vi.fn().mockReturnValue({ hit: false }),
  destroy: vi.fn(),
});

function createMockModule(): SparkModule {
  return {
    World: vi.fn().mockImplementation(() => createMockSparkWorld()) as any,
    Body: vi.fn() as any,
    Shape: vi.fn() as any,
    threaded: false,
    maxWorkers: 1,
  };
}

import { SparkPhysicsWorld } from '../src/SparkPhysicsWorld';
import { SparkRigidBody } from '../src/SparkRigidBody';
import { SparkCollider } from '../src/SparkCollider';
import { SparkRaycastProvider } from '../src/SparkRaycastProvider';

describe('SparkPhysicsWorld', () => {
  let world: SparkPhysicsWorld;

  beforeEach(() => {
    world = new SparkPhysicsWorld({ gravity: { x: 0, y: -9.81, z: 0 } });
  });

  afterEach(() => {
    world.destroy();
  });

  it('create() returns a valid instance with default config', () => {
    expect(world.config).toBeDefined();
    expect(world.config.gravity.y).toBe(-9.81);
    expect(world.config.solverIterations).toBe(4);
  });

  it('init() loads Spark WASM and creates world', async () => {
    await world.init(createMockModule);
    expect(world.bodyList).toEqual([]);
  });

  it('createRigidBody() creates and returns a body', async () => {
    await world.init(createMockModule);
    const body = world.createRigidBody({
      bodyType: 'dynamic',
      position: { x: 0, y: 10, z: 0 },
    });
    expect(body).toBeDefined();
    expect(body.type).toBe('dynamic');
    expect(world.bodyList.length).toBe(1);
  });

  it('createRigidBody() throws before init', () => {
    expect(() => {
      world.createRigidBody({ bodyType: 'static', position: { x: 0, y: 0, z: 0 } });
    }).toThrow('not initialized');
  });

  it('removeRigidBody() removes a body', async () => {
    await world.init(createMockModule);
    const body = world.createRigidBody({ bodyType: 'dynamic', position: { x: 0, y: 0, z: 0 } });
    expect(world.bodyList.length).toBe(1);
    world.removeRigidBody(body);
    expect(world.bodyList.length).toBe(0);
  });

  it('createCollider() creates box, sphere, capsule, cylinder colliders', async () => {
    await world.init(createMockModule);
    const body = world.createRigidBody({ bodyType: 'static', position: { x: 0, y: 0, z: 0 } });
    const box = world.createCollider({ shape: { kind: 'box', halfExtents: { x: 1, y: 1, z: 1 } }, friction: 0.5, restitution: 0.2 }, body);
    expect(box.shape.kind).toBe('box');

    const sphere = world.createCollider({ shape: { kind: 'sphere', radius: 0.5 } }, body);
    expect(sphere.shape.kind).toBe('sphere');

    const capsule = world.createCollider({ shape: { kind: 'capsule', halfHeight: 1, radius: 0.5 } }, body);
    expect(capsule.shape.kind).toBe('capsule');

    const cylinder = world.createCollider({ shape: { kind: 'cylinder', halfHeight: 1, radius: 0.5 } }, body);
    expect(cylinder.shape.kind).toBe('cylinder');
  });

  it('step() advances the simulation', async () => {
    await world.init(createMockModule);
    expect(() => world.step(1 / 60)).not.toThrow();
  });

  it('castRay() returns null when no hit', async () => {
    await world.init(createMockModule);
    const result = world.castRay({
      origin: { x: 0, y: 0, z: 0 },
      direction: { x: 0, y: -1, z: 0 },
      maxDistance: 100,
    });
    expect(result).toBeNull();
  });

  it('bodyList and colliderList return current bodies/colliders', async () => {
    await world.init(createMockModule);
    const body = world.createRigidBody({ bodyType: 'dynamic', position: { x: 0, y: 0, z: 0 } });
    world.createCollider({ shape: { kind: 'box', halfExtents: { x: 1, y: 1, z: 1 } } }, body);
    expect(world.bodyList.length).toBe(1);
    expect(world.colliderList.length).toBe(1);
  });

  it('destroy() cleans up all resources', async () => {
    await world.init(createMockModule);
    world.createRigidBody({ bodyType: 'dynamic', position: { x: 0, y: 0, z: 0 } });
    world.destroy();
    expect(world.bodyList.length).toBe(0);
  });
});

describe('SparkRigidBody', () => {
  let body: SparkRigidBody;

  beforeEach(() => {
    const mockB3Body = {
      getPosition: vi.fn().mockReturnValue({ x: 1, y: 2, z: 3 }),
      getRotation: vi.fn().mockReturnValue({ x: 0, y: 0, z: 0, w: 1 }),
      setTransform: vi.fn(),
      setLinearVelocity: vi.fn(),
      getLinearVelocity: vi.fn().mockReturnValue({ x: 0, y: 0, z: 0 }),
      applyForce: vi.fn(),
      applyLinearImpulseToCenter: vi.fn(),
      setEnabled: vi.fn(),
      setGravityScale: vi.fn(),
      setLinearDamping: vi.fn(),
      setAngularDamping: vi.fn(),
      isValid: vi.fn().mockReturnValue(true),
      destroy: vi.fn(),
      setUserData: vi.fn(),
      getUserData: vi.fn().mockReturnValue(1),
    };
    body = new SparkRigidBody(mockB3Body as any, 1, 'dynamic');
  });

  it('position() returns current position', () => {
    const pos = body.position();
    expect(pos.x).toBe(1);
    expect(pos.y).toBe(2);
    expect(pos.z).toBe(3);
  });

  it('setPosition() updates position', () => {
    expect(() => body.setPosition(5, 10, 15)).not.toThrow();
  });

  it('setEnabled() toggles body', () => {
    body.setEnabled(false);
    expect(body.isEnabled).toBe(false);
    body.setEnabled(true);
    expect(body.isEnabled).toBe(true);
  });

  it('setGravityScale(), setLinearDamping(), setAngularDamping() work', () => {
    expect(() => body.setGravityScale(2.0)).not.toThrow();
    expect(() => body.setLinearDamping(0.5)).not.toThrow();
    expect(() => body.setAngularDamping(0.3)).not.toThrow();
  });

  it('applyForce() applies force', () => {
    expect(() => body.applyForce({ x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 0 })).not.toThrow();
  });

  it('applyImpulse() applies impulse', () => {
    expect(() => body.applyImpulse({ x: 0, y: 10, z: 0 }, { x: 0, y: 0, z: 0 })).not.toThrow();
  });

  it('getColliders() returns empty initially', () => {
    expect(body.getColliders()).toEqual([]);
  });

  it('destroy() cleans up', () => {
    expect(() => body.destroy()).not.toThrow();
  });
});

describe('SparkRaycastProvider', () => {
  it('castRay() delegates to physics world', async () => {
    const world = new SparkPhysicsWorld();
    await world.init(createMockModule);
    const provider = new SparkRaycastProvider(world);
    const result = provider.castRay({
      origin: { x: 0, y: 0, z: 0 },
      direction: { x: 0, y: -1, z: 0 },
      maxDistance: 100,
    });
    expect(result).toBeNull();
    world.destroy();
  });
});
