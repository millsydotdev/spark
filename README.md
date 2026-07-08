# Spark Physics Engine

A high-performance 3D rigid body physics engine for the web, compiled to WebAssembly with SIMD support.

Spark is a standalone physics engine (inspired by Box3D) with TypeScript-first API design, optimized for browser and Node.js environments.

## Features

- **Rigid body simulation** — static, dynamic, kinematic bodies
- **Collision shapes** — box, sphere, capsule, cylinder, convex hull, mesh (trimesh)
- **Joints** — revolute (hinge), distance (spring), spherical (ball-socket), prismatic (slider), weld, motor, wheel, parallel
- **Raycasting** — single-hit (`castRay`) and multi-hit (`castRayAll`)
- **Collision events** — begin/end contact callbacks
- **Sensor triggers** — enter/exit events for volume detection
- **Per-body properties** — gravity scale, linear/angular damping, CCD (bullet mode)
- **Runtime property changes** — friction, restitution, collision filters
- **Sleep management** — automatic body sleeping for CPU savings
- **SIMD acceleration** — SSE2/Neon via WASM SIMD
- **Multithreading** — optional pthreads-based parallel solver (deluxe build)
- **Deterministic** — reproducible simulations across platforms and thread counts

## Installation

```bash
npm install @millsydotdev/spark
```

## Quick Start

```typescript
import { SparkPhysicsWorld } from '@millsydotdev/spark';

const world = new SparkPhysicsWorld({
  gravity: { x: 0, y: -9.81, z: 0 },
});

await world.init();

const ground = world.createRigidBody({
  bodyType: 'static',
  position: { x: 0, y: -0.5, z: 0 },
});
world.createCollider({
  shape: { kind: 'box', halfExtents: { x: 20, y: 0.5, z: 20 } },
  friction: 0.5,
}, ground);

const ball = world.createRigidBody({
  bodyType: 'dynamic',
  position: { x: 0, y: 5, z: 0 },
});
world.createCollider({
  shape: { kind: 'sphere', radius: 0.5 },
  restitution: 0.8,
}, ball);

// Step the simulation
world.step(1 / 60);

// Ball has fallen
console.log(ball.position()); // { x: ~0, y: ~0.5, z: ~0 }
```

## API

### SparkPhysicsWorld

| Method | Description |
|--------|-------------|
| `init()` | Loads WASM and initializes the physics world |
| `step(dt)` | Advances simulation by `dt` seconds |
| `createRigidBody(descriptor)` | Creates a rigid body |
| `removeRigidBody(body)` | Removes a rigid body |
| `createCollider(descriptor, body)` | Attaches a collider shape to a body |
| `removeCollider(collider)` | Removes a collider |
| `createTriggerVolume(descriptor)` | Creates a trigger/sensor volume |
| `removeTriggerVolume(volume)` | Removes a trigger volume |
| `castRay(input)` | Casts a ray, returns closest hit |
| `castRayAll(input)` | Casts a ray, returns all hits |
| `bodyList` | Array of all rigid bodies |
| `colliderList` | Array of all colliders |
| `onCollisionEnter/Exit` | Collision event callbacks |
| `destroy()` | Cleans up all resources |

### Supported Collider Shapes

- `box` — box with half-extents
- `sphere` — sphere with radius
- `capsule` — capsule with half-height and radius
- `cylinder` — cylinder with half-height and radius
- `convexHull` — convex hull from vertex array
- `trimesh` — triangle mesh from vertices and indices

### Body Properties (Runtime Settable)

- `setGravityScale(scale)` — per-body gravity multiplier
- `setLinearDamping(damping)` — linear velocity damping
- `setAngularDamping(damping)` — angular velocity damping
- `setLinearVelocity(velocity)` — set linear velocity
- `applyForce(force, point)` — apply force at world point
- `applyImpulse(impulse, point)` — apply impulse at world point

### Collider Properties (Runtime Settable)

- `setFriction(friction)` — change friction coefficient
- `setRestitution(restitution)` — change bounciness
- `setCollisionGroups(membership, filter)` — change collision filtering
- `setSensor(enabled)` — toggle sensor mode

## Build from Source

```bash
git clone https://github.com/millsydotdev/spark.git
cd spark
npm install
npm run build:wasm   # Build the WASM binary (requires Docker)
npm run build        # Build TypeScript + WASM
npm test             # Run tests
```

## License

MIT
