FROM emscripten/emsdk:4.0.18

RUN apt-get update && apt-get install -y ninja-build && rm -rf /var/lib/apt/lists/*

WORKDIR /build
CMD ["bash", "scripts/build-spark.sh"]
