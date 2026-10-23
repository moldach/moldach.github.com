# Start WebGL asset preparation

The baseline `../start.blend` and `../start-render.png` are preserved. The new asset is available only in the isolated local review at `/review/start/`. The homepage renderer, other five chapters, portrait and published legacy root are unchanged.

## Reproduce

Requirements: Blender 5.2.3 LTS, Node compatible with the site package, and Khronos KTX-Software 4.4.2 (`toktx` on PATH). The editable source references macOS Georgia, Arial and Courier New fonts; a rebuild on another OS needs licensed equivalents installed before text conversion. Native KTX tools were obtained from the official Darwin-arm64 package and extracted into a temporary directory; they are not redistributed in this repository.

From repository root:

```sh
blender --background --python tool/assets/prepare_start_webgl.py
cd site
npm ci
npm run assets:start
npm run dev -- --port 4322
```

The first stage loads the existing Blender source without saving over it, bakes a shared 512px tangent-space fiber normal, removes 29 hidden interior sheets, closes the exposed page stack, evaluates bevels and text, generates missing UVs and joins only material-compatible meshes within semantic groups. It retains 41 individual key objects, three movable film groups, photo mounts, terminal, six chapter groups and article/image metadata. Page-turn hinges are not rigged.

The second stage uses pinned glTF Transform 4.5.1, Meshoptimizer 1.3.0 and Sharp 0.35.5. It deduplicates, welds and simplifies with a bounded error and locked borders; caps image textures at 1024px without stretching; and exports Meshopt geometry with UASTC KTX2 textures plus a JPEG/PNG fallback. All ten image-to-material assignments and all six chapter IDs are checked before completion. The intermediate uncompressed GLB is ignored; final variants and poster are tracked under `site/public/models/start/`.

Only surface detail is baked. Base colors/approved photographs, roughness and tangent normals feed PBR materials; there are no baked lights, highlights, ambient occlusion or cast-shadow textures. Original photo and article sources are unchanged. Image-selection approval does not establish final browser visual acceptance.

## Dynamic preview contract

The glTF is Y-up. The reference camera is `(0.12, 13.6, 14)`, looking at `(0, 0.7, 0)`, using a 51 mm lens with a 36 mm horizontal sensor at 3:2 aspect. The lighting configuration is in `site/src/components/book-review/runtime.ts`: AgX tone mapping, default exposure 1.5, a generated RoomEnvironment and studio/neutral/contrast directional-light presets. No remote assets or CDNs are required.

Soft VSM shadows are applied to structural paper, mounts and terminal. Keycaps, print and photo overlays keep dynamic PBR shading while skipping redundant shadow submissions. Shadows update when lighting changes; normal inspection uses cached shadow maps. Rendering is on demand, with a 120-frame measurement mode and no idle animation.

Loading/transcode failure switches to the conventional-texture GLB. Each load has a 15-second deadline and late results are disposed. If both models fail, WebGL is unavailable or the context is lost, the original Blender poster remains visible. Close/pagehide cancels frames, disconnects observers/controls, aborts listeners, disposes scene materials/geometries/textures, render targets and decoder workers, and explicitly releases the WebGL context. Three.js internal allocation counters can retain bookkeeping entries after context release; these are not a claim of zero driver memory.

## Verification and limits

`asset-report.json` records file sizes, triangles and image/chapter checks. Browser results, matching-camera captures, comparison HTML and limitations are in `research/verification/start-webgl/`. The review route is emitted only in preview builds, is noindexed and does not enter production HTML or sitemap. A nondeployed production fixture verifies that exclusion without claiming ownership of any domain.

Fine paper response, indirect illumination and contact shadows differ from Cycles. Geometry is retained for inspection and later animation; this is not a screenshot projected onto a single plane. Physical phones, Safari and sustained GPU/thermal performance are not verified. Final visual acceptance and homepage integration remain separate.

Sources: [Three.js compressed glTF loading](https://github.com/mrdoob/three.js/blob/r186/examples/webgl_loader_gltf_compressed.html), [glTF Transform CLI](https://gltf-transform.dev/cli), [Khronos KTX tools](https://github.com/KhronosGroup/KTX-Software/releases/tag/v4.4.2). Decoder notices are included in `site/public/decoders/`.
