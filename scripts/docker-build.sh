#!/usr/bin/env bash
# Build Spark WASM using Docker with emscripten/emsdk.
#
# Usage:
#   scripts/docker-build.sh                       # standard + deluxe, Release
#   FLAVOURS=standard scripts/docker-build.sh
#   TARGET_TYPE=Debug scripts/docker-build.sh
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
ROOT="$(dirname "$DIR")"

FLAVOURS="${FLAVOURS:-standard deluxe}"
TARGET_TYPE="${TARGET_TYPE:-Release}"

echo "==> Building spark-builder Docker image"
docker build -t spark-builder -f "$DIR/Dockerfile" "$DIR/../../"

echo "==> Building Spark WASM via Docker (flavours=$FLAVOURS, target=$TARGET_TYPE)"

docker run --rm \
  -v "$ROOT:/build" \
  -e "FLAVOURS=$FLAVOURS" \
  -e "TARGET_TYPE=$TARGET_TYPE" \
  spark-builder \
  bash /build/scripts/build-spark.sh

echo "==> Spark build complete"
ls -la "$ROOT/dist/"
