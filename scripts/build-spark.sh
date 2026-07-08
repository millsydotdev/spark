#!/usr/bin/env bash
# Build Spark physics engine WASM.
#
# Features:
#   - Cylinder shape via hull tessellation
#   - Mesh/trimesh shapes
#   - Multi-hit raycast via callback-based b3World_CastRay
#   - All per-body properties (gravityScale, damping, CCD/bullet, filters)
#
# Flavours:
#   standard   SIMD, single threaded
#   deluxe     SIMD + wasm threads (SharedArrayBuffer, pthreads)
#
# Usage:
#   scripts/build-spark.sh                 build both flavours, Release
#   FLAVOURS=standard scripts/build-spark.sh
#   TARGET_TYPE=Debug scripts/build-spark.sh
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
ROOT="$(dirname "$DIR")"

FLAVOURS="${FLAVOURS:-standard deluxe}"
TARGET_TYPE="${TARGET_TYPE:-Release}"
BOX3D_SRC="$ROOT/deps/box3d"

if [ ! -f "$BOX3D_SRC/CMakeLists.txt" ]; then
  echo "deps/box3d missing. Mount or copy Box3D source to $BOX3D_SRC" >&2
  exit 1
fi

command -v emcc >/dev/null || { echo "emcc not found. Use emscripten/emsdk Docker image." >&2; exit 1; }

mkdir -p "$ROOT/dist" "$ROOT/build"

for FLAVOUR in $FLAVOURS; do
  CMAKE_BUILD_DIR="$ROOT/build/cmake-$FLAVOUR-$TARGET_TYPE"

  FLAVOUR_FLAGS=()
  BASENAME="spark"
  case "$FLAVOUR" in
    standard)
      ;;
    deluxe)
      FLAVOUR_FLAGS=(-pthread)
      BASENAME="spark.deluxe"
      ;;
    *)
      echo "Unknown flavour: $FLAVOUR (expected standard or deluxe)" >&2
      exit 1
      ;;
  esac

  echo "==> cmake ($FLAVOUR, $TARGET_TYPE)"
  CFLAGS="${FLAVOUR_FLAGS[*]:-}" emcmake cmake \
    -S "$BOX3D_SRC" \
    -B "$CMAKE_BUILD_DIR" \
    -DCMAKE_BUILD_TYPE="$TARGET_TYPE" \
    -DBOX3D_SAMPLES=OFF \
    -DBOX3D_UNIT_TESTS=OFF \
    -DBOX3D_BENCHMARKS=OFF \
    -DBOX3D_DOCS=OFF \
    -DBOX3D_VALIDATE=OFF \
    -G "Ninja" \
    > "$CMAKE_BUILD_DIR.cmake.log" 2>&1 || { cat "$CMAKE_BUILD_DIR.cmake.log" >&2; exit 1; }

  echo "==> build libbox3d.a ($FLAVOUR)"
  cmake --build "$CMAKE_BUILD_DIR" -j"$(nproc)" > "$CMAKE_BUILD_DIR.build.log" 2>&1 \
    || { tail -50 "$CMAKE_BUILD_DIR.build.log" >&2; exit 1; }

  LIB="$CMAKE_BUILD_DIR/src/libbox3d.a"
  [ -f "$LIB" ] || { echo "missing $LIB" >&2; exit 1; }

  EMCC_OPTS=(
    -std=c++17
    -lembind
    -sMODULARIZE=1
    -sEXPORT_ES6=1
    -sEXPORT_NAME=SparkPhysics
    -sENVIRONMENT=web,worker,node
    -sALLOW_MEMORY_GROWTH=1
    -sALLOW_TABLE_GROWTH=1
    -sFILESYSTEM=0
    -sEXPORTED_RUNTIME_METHODS=HEAPF32,HEAPU8,HEAPU32
    -msimd128
    -msse2
  )

  if [ "$FLAVOUR" = "deluxe" ]; then
    EMCC_OPTS+=(
      -pthread
      "-sPTHREAD_POOL_SIZE=(globalThis.navigator&&navigator.hardwareConcurrency)||8"
    )
  fi

  case "$TARGET_TYPE" in
    Debug)
      EMCC_OPTS+=(-g3 -gsource-map -sASSERTIONS=2)
      ;;
    *)
      EMCC_OPTS+=(-O3)
      ;;
  esac

  echo "==> emcc link ($FLAVOUR) -> dist/$BASENAME.mjs"
  emcc "$ROOT/csrc/glue.cpp" "$LIB" \
    -I "$BOX3D_SRC/include" \
    "${EMCC_OPTS[@]}" \
    "${FLAVOUR_FLAGS[@]:-}" \
    -o "$ROOT/dist/$BASENAME.mjs"
done

cp "$ROOT/src/entry.mjs" "$ROOT/dist/entry.mjs"

echo "==> done"
ls -la "$ROOT/dist"
