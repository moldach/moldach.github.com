import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

type Preset = 'studio' | 'neutral' | 'contrast';
const presets = {
  studio: {
    key: 3.2,
    fill: 1.4,
    rim: 1,
    environment: 0.38,
    keyColor: 0xffebd3,
    fillColor: 0xf5f7ff,
    position: [-4, 9, 3],
  },
  neutral: {
    key: 2.7,
    fill: 1.6,
    rim: 0.6,
    environment: 0.45,
    keyColor: 0xffffff,
    fillColor: 0xffffff,
    position: [0, 9, 4],
  },
  contrast: {
    key: 4,
    fill: 0.3,
    rim: 1.2,
    environment: 0.18,
    keyColor: 0xffd0a0,
    fillColor: 0x8eb8ff,
    position: [-7, 4, 1],
  },
} as const;

export async function mountStartReview(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>('.stage')!;
  const canvas = root.querySelector<HTMLCanvasElement>('canvas')!;
  const status = root.querySelector<HTMLElement>('[role=status]')!;
  const metrics = root.querySelector<HTMLElement>('[data-metrics]')!;
  const close = root.querySelector<HTMLButtonElement>('[data-close]')!;
  const measure = root.querySelector<HTMLButtonElement>('[data-measure]')!;
  const exposure = root.querySelector<HTMLInputElement>('input[type=range]')!;
  const abort = new AbortController();
  const signal = abort.signal;
  let closed = false;
  let model: THREE.Group | undefined;
  let asset = 'ktx2';
  let fallbackReason: string | undefined;
  let frame = 0;
  let resize: ResizeObserver | undefined;
  let controls: OrbitControls | undefined;
  let pmrem: THREE.PMREMGenerator | undefined;
  let environment: THREE.WebGLRenderTarget | undefined;
  let ktx: KTX2Loader | undefined;
  let renderer: THREE.WebGLRenderer | undefined;
  let textureBytes = 0;
  let reviewFloor: THREE.Mesh | undefined;
  let shadow: THREE.DirectionalLightShadow | undefined;
  const samples: number[] = [];
  const report: Record<string, unknown> = { state: 'loading' };
  const update = () => {
    metrics.textContent = JSON.stringify(report, null, 2);
    root.dataset.state = String(report.state);
  };
  function disposeModel(object: THREE.Object3D) {
    const geometries = new Set<THREE.BufferGeometry>(),
      materials = new Set<THREE.Material>(),
      textures = new Set<THREE.Texture>();
    object.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      geometries.add(mesh.geometry);
      for (const material of Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material]) {
        materials.add(material);
        for (const value of Object.values(material))
          if (value instanceof THREE.Texture) textures.add(value);
      }
    });
    for (const geometry of geometries) geometry.dispose();
    for (const texture of textures) {
      texture.dispose();
      const image = texture.image;
      if (image instanceof ImageBitmap) image.close();
    }
    for (const material of materials) material.dispose();
  }
  function cleanup() {
    if (closed) return;
    closed = true;
    cancelAnimationFrame(frame);
    abort.abort();
    resize?.disconnect();
    controls?.dispose();
    if (model) disposeModel(model);
    if (reviewFloor) disposeModel(reviewFloor);
    shadow?.dispose();
    environment?.dispose();
    pmrem?.dispose();
    ktx?.dispose();
    renderer?.dispose();
    renderer?.forceContextLoss();
    delete stage.dataset.ready;
    report.state = 'closed';
    report.resourcesDisposed = true;
    report.contextReleased = renderer?.getContext().isContextLost() ?? true;
    report.gpuMemoryAfterDispose = renderer
      ? { ...renderer.info.memory }
      : null;
    update();
    status.textContent = '3D review closed. Blender baseline shown.';
    root
      .querySelectorAll<HTMLInputElement | HTMLButtonElement>('input,button')
      .forEach((control) => {
        control.disabled = true;
      });
  }
  close.addEventListener('click', cleanup, { signal });
  window.addEventListener('pagehide', cleanup, { signal });
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'low-power',
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.info.autoReset = false;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.AgXToneMapping;
    renderer.toneMappingExposure = Number(exposure.value);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    renderer.shadowMap.autoUpdate = false;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f2ede3');
    const camera = new THREE.PerspectiveCamera(26.48, 1.5, 0.1, 80);
    const referencePosition = new THREE.Vector3(0.12, 13.6, 14);
    const referenceTarget = new THREE.Vector3(0, 0.7, 0);
    camera.position.copy(referencePosition);
    camera.lookAt(referenceTarget);
    controls = new OrbitControls(camera, canvas);
    controls.target.copy(referenceTarget);
    controls.update();
    controls.enablePan = false;
    controls.minDistance = 12;
    controls.maxDistance = 27;
    controls.minPolarAngle = 0.25;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.enableDamping = false;
    pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    environment = pmrem.fromScene(room, 0.04);
    room.dispose();
    scene.environment = environment.texture;
    const key = new THREE.DirectionalLight();
    key.castShadow = true;
    shadow = key.shadow;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.radius = 10;
    key.shadow.blurSamples = 16;
    key.shadow.camera.left = -8;
    key.shadow.camera.right = 8;
    key.shadow.camera.top = 8;
    key.shadow.camera.bottom = -8;
    key.shadow.camera.far = 30;
    key.shadow.bias = -0.0002;
    key.shadow.normalBias = 0.012;
    const fill = new THREE.DirectionalLight();
    fill.position.set(5, 7, -1);
    const rim = new THREE.DirectionalLight(0xffefdb, 1);
    rim.position.set(-1, 5, -6);
    scene.add(key, fill, rim);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color().setRGB(0.9, 0.84, 0.74),
        roughness: 0.95,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.33;
    floor.receiveShadow = true;
    scene.add(floor);
    reviewFloor = floor;
    function lighting(name: Preset) {
      const p = presets[name];
      key.intensity = p.key;
      fill.intensity = p.fill;
      rim.intensity = p.rim;
      key.color.set(p.keyColor);
      fill.color.set(p.fillColor);
      key.position.set(p.position[0], p.position[1], p.position[2]);
      scene.environmentIntensity = p.environment;
      renderer!.shadowMap.needsUpdate = true;
      report.lighting = name;
      render();
    }
    function render() {
      if (closed || !renderer || !model || report.state === 'context-lost')
        return;
      const updatesShadow = renderer.shadowMap.needsUpdate;
      renderer.info.reset();
      renderer.render(scene, camera);
      if (updatesShadow)
        report.shadowUpdateDrawCalls = renderer.info.render.calls;
      report.camera = {
        position: camera.position.toArray(),
        target: controls!.target.toArray(),
      };
      report.drawCalls = renderer.info.render.calls;
      report.triangles = renderer.info.render.triangles;
      report.textureCount = renderer.info.memory.textures;
      report.estimatedTextureBytes = textureBytes;
      update();
    }
    controls.addEventListener('change', render);
    root
      .querySelectorAll<HTMLInputElement>('input[name=lighting]')
      .forEach((input) =>
        input.addEventListener(
          'change',
          () => lighting(input.value as Preset),
          { signal },
        ),
      );
    exposure.addEventListener(
      'input',
      () => {
        renderer!.toneMappingExposure = Number(exposure.value);
        root.querySelector('output')!.textContent = exposure.value;
        render();
      },
      { signal },
    );
    const reset = () => {
      camera.position.copy(referencePosition);
      controls!.target.copy(referenceTarget);
      controls!.update();
      render();
    };
    root
      .querySelector('[data-reset]')!
      .addEventListener('click', reset, { signal });
    canvas.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          reset();
          return;
        }
        if (
          !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(
            event.key,
          )
        )
          return;
        event.preventDefault();
        const offset = camera.position.clone().sub(controls!.target);
        const spherical = new THREE.Spherical().setFromVector3(offset);
        if (event.key === 'ArrowLeft') spherical.theta -= 0.06;
        if (event.key === 'ArrowRight') spherical.theta += 0.06;
        if (event.key === 'ArrowUp')
          spherical.phi = Math.max(0.25, spherical.phi - 0.06);
        if (event.key === 'ArrowDown')
          spherical.phi = Math.min(Math.PI / 2.05, spherical.phi + 0.06);
        camera.position
          .copy(controls!.target)
          .add(new THREE.Vector3().setFromSpherical(spherical));
        controls!.update();
        render();
      },
      { signal },
    );
    resize = new ResizeObserver(() => {
      const width = stage.clientWidth,
        height = stage.clientHeight;
      renderer!.setSize(width, height, false);
      camera.aspect = width / height;
      // Match Blender horizontal sensor fit; preserve full composition on narrow screens.
      camera.setFocalLength(51);
      camera.updateProjectionMatrix();
      render();
    });
    resize.observe(stage);
    canvas.addEventListener(
      'webglcontextlost',
      (event) => {
        event.preventDefault();
        delete stage.dataset.ready;
        report.state = 'context-lost';
        measure.disabled = true;
        update();
        status.textContent =
          'Graphics context lost. Blender baseline shown; reload to retry.';
        cancelAnimationFrame(frame);
      },
      { signal },
    );
    ktx = new KTX2Loader()
      .setTranscoderPath('/decoders/basis/')
      .setWorkerLimit(2)
      .detectSupport(renderer);
    const loader = new GLTFLoader()
      .setMeshoptDecoder(MeshoptDecoder)
      .setKTX2Loader(ktx);
    async function loadAsset(
      assetLoader: GLTFLoader,
      url: string,
    ): Promise<GLTF> {
      let expired = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const work = assetLoader.loadAsync(url).then((result) => {
        if (expired || closed) {
          disposeModel(result.scene);
          throw new Error('Review closed or load expired');
        }
        return result;
      });
      const deadline = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          expired = true;
          reject(new Error('Asset load exceeded 15 seconds'));
        }, 15000);
      });
      try {
        return await Promise.race([work, deadline]);
      } finally {
        clearTimeout(timer);
      }
    }
    let gltf;
    try {
      if (new URLSearchParams(location.search).has('fallback'))
        throw new Error('Conventional-texture review requested');
      gltf = await loadAsset(loader, '/models/start/start.glb');
    } catch (error) {
      if (closed) return;
      fallbackReason = String(error);
      asset = 'conventional';
      gltf = await loadAsset(
        new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),
        '/models/start/start-fallback.glb',
      );
    }
    if (closed) {
      disposeModel(gltf.scene);
      return;
    }
    model = gltf.scene;
    const imageIds = new Set<number>(),
      chapterIds = new Set<number>(),
      seenTextures = new Set<THREE.Texture>();
    model.traverse((obj) => {
      if (obj.userData.approvedImageNumber)
        imageIds.add(obj.userData.approvedImageNumber);
      if (obj.userData.chapterIndex !== undefined)
        chapterIds.add(obj.userData.chapterIndex);
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const material = mesh.material as THREE.MeshStandardMaterial;
      // Quantization may put a mesh beneath its original named node. Resolve
      // semantic ancestry rather than relying on the generated mesh name.
      let smallDetail =
        material.name.startsWith('Approved ') ||
        material.name.includes('Printed');
      const inspect = (node: THREE.Object3D) => {
        if (/Keyboard|^Printed[_ ]/.test(node.name)) smallDetail = true;
      };
      inspect(mesh);
      mesh.traverseAncestors(inspect);
      mesh.castShadow = !smallDetail;
      mesh.receiveShadow = !smallDetail;
      for (const tex of [material.map, material.normalMap]) {
        if (!tex || seenTextures.has(tex)) continue;
        seenTextures.add(tex);
        if (tex instanceof THREE.CompressedTexture)
          textureBytes += tex.mipmaps.reduce(
            (sum, mip) => sum + mip.data.byteLength,
            0,
          );
        else {
          const image = tex.image;
          if (
            image &&
            typeof image === 'object' &&
            'width' in image &&
            'height' in image
          )
            textureBytes +=
              (Number(image.width) * Number(image.height) * 4 * 4) / 3;
        }
      }
    });
    if (imageIds.size !== 10 || chapterIds.size !== 6)
      throw new Error('Required image or chapter metadata missing');
    scene.add(model);
    lighting('studio');
    stage.dataset.ready = '';
    report.state = 'ready';
    report.asset = asset;
    report.approvedImages = [...imageIds].sort((a, b) => a - b);
    report.chapters = [...chapterIds].sort();
    report.fallbackReason = fallbackReason;
    report.dynamicLighting = true;
    report.estimatedTextureBytes = Math.round(textureBytes);
    report.textureMemoryScope =
      'Model textures and mipmaps only; excludes environment, shadow maps and driver overhead';
    report.physicalDeviceVerified = false;
    status.textContent = `${asset === 'ktx2' ? 'KTX2 + Meshopt' : 'Conventional textures + Meshopt'} · dynamic lighting`;
    const assetUrl =
      asset === 'ktx2'
        ? '/models/start/start.glb'
        : '/models/start/start-fallback.glb';
    const entry = performance
      .getEntriesByName(new URL(assetUrl, location.href).href)
      .at(-1) as PerformanceResourceTiming | undefined;
    report.modelTransferBytes = entry?.transferSize;
    report.modelEncodedBytes = entry?.encodedBodySize;
    render();
    measure.addEventListener(
      'click',
      () => {
        measure.disabled = true;
        samples.length = 0;
        let previous = performance.now();
        const sample = (now: number) => {
          if (closed || document.hidden || report.state !== 'ready') {
            measure.disabled = closed;
            return;
          }
          if (samples.length) samples.push(now - previous);
          else samples.push(0);
          previous = now;
          render();
          if (samples.length < 121) frame = requestAnimationFrame(sample);
          else {
            const sorted = samples.slice(1).sort((a, b) => a - b);
            report.frameTiming = {
              frames: 120,
              medianMs: sorted[60],
              p95Ms: sorted[114],
              scope:
                'Foreground requestAnimationFrame intervals including render submission; not GPU timer or physical-device proof',
            };
            update();
            measure.disabled = false;
          }
        };
        frame = requestAnimationFrame(sample);
      },
      { signal },
    );
  } catch (error) {
    const message = String(error);
    cleanup();
    report.state = 'error';
    report.error = message;
    update();
    status.textContent =
      '3D unavailable. Blender baseline shown. Reload to retry.';
  }
}
