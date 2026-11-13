# Rendering a 3D film

```sh
npm ci
npm run build
npx playwright-core install --with-deps chromium
node dist/cli/main.js validate examples/capsule.json
AETHER_WEBGL=software node dist/cli/main.js render examples/capsule.json out/capsule.mp4 --workers 2
node dist/cli/main.js verify examples/capsule.json out/capsule.mp4
```

Omit AETHER_WEBGL to use Chromium's installed graphics configuration. Hardware GPU performance has not been benchmarked. Software mode explicitly selects SwiftShader for headless hosts. A startup failure or lost WebGL context aborts the render. The native Canvas backend supports 2D films.

Set engine to "three". Each shot has a world plus its normal 2D objects list, which is composited above the 3D pass. World units use right-handed XYZ with Y up. A perspective camera takes position and target triples and a vertical field of view in degrees. Near/far clipping planes are 0.05 and 10000. A vector track is a triple of numbers or scalar keyframe arrays. Keys use scene-local frames and the same easing rules as 2D. A spatial reveal can use keyed model positions and camera motion across an assembly, as the capsule example demonstrates. Shot boundaries are cuts.

|Element|Parameters|
|---|---|
|Lights|Ambient uses color and intensity. Directional adds a position and lights toward the origin.|
|Models|Unique id, shape, material, optional position, rotation in XYZ degrees and per-axis scale.|
|Primitives|Box size [x,y,z], sphere radius, cylinder radiusTop/radiusBottom/height, torus radius/tube.|
|Material|Hex color, roughness and metalness in [0,1], optional flat shading.|
|Imported OBJ|Declare a local .obj in assets, then use shape {"kind":"obj","asset":"id"}. Supports positive one-based vertex indices and triangles or convex polygons. Pre-triangulate concave faces. Normals are computed locally. External material libraries, texture coordinates, negative indices, animation and external URLs are unsupported.|

WorldScene(world,aspect,background,assets) builds Three.js objects. seek(frame) samples all transforms directly. dispose() releases geometry and materials. The browser owns one WebGL context per worker, and disposes shot resources when the active shot changes. Three.js and its TypeScript declarations retain their upstream MIT licenses. The capsule model was authored for this repository.
