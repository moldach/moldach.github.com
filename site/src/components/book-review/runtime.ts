import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Fixed Studio treatment: lighting stays dynamic, with no visitor settings.
const studio = {
  key: 3.2,
  fill: 1.4,
  rim: 1,
  environment: 0.38,
  keyColor: 0xffebd3,
  fillColor: 0xf5f7ff,
  position: [-4, 9, 3],
} as const;

export async function mountChapterBook(root: HTMLElement) {
  const chapterIndex = Number(root.dataset.chapterIndex || 0);
  const modelUrl = root.dataset.model || '/models/start/start.glb';
  const fallbackUrl =
    root.dataset.modelFallback || '/models/start/start-fallback.glb';
  const position = JSON.parse(root.dataset.camera || '[0.12,13.6,14]') as [
    number,
    number,
    number,
  ];
  const lens = Number(root.dataset.lens || 51);
  const stage = root.querySelector<HTMLElement>('.stage')!;
  const canvas = root.querySelector<HTMLCanvasElement>('canvas')!;
  const status = root.querySelector<HTMLElement>('[role=status]')!;
  const metrics = root.querySelector<HTMLElement>('[data-metrics]')!;
  const abort = new AbortController();
  const signal = abort.signal;
  let closed = false;
  let model: THREE.Group | undefined;
  let asset = chapterIndex === 0 ? 'ktx2' : 'conventional';
  let fallbackReason: string | undefined;
  let resize: ResizeObserver | undefined;
  let controls: OrbitControls | undefined;
  let pmrem: THREE.PMREMGenerator | undefined;
  let environment: THREE.WebGLRenderTarget | undefined;
  let ktx: KTX2Loader | undefined;
  let renderer: THREE.WebGLRenderer | undefined;
  let textureBytes = 0;
  let reviewFloor: THREE.Mesh | undefined;
  let shadow: THREE.DirectionalLightShadow | undefined;
  const report: Record<string, unknown> = { state: 'loading' };
  const update = () => {
    metrics.textContent = JSON.stringify(report, null, 2);
    root.dataset.state = String(report.state);
  };
  root.querySelector<HTMLButtonElement>('[data-reset]')!.disabled = false;
  update();
  status.textContent = 'Opening the book…';
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
    abort.abort();
    root
      .querySelectorAll('[data-exhibit-hotspot]')
      .forEach((node) => node.remove());
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
    status.textContent = 'Book preview closed.';
    root
      .querySelectorAll<HTMLButtonElement>('[data-reset]')
      .forEach((control) => {
        control.disabled = true;
      });
  }
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
    renderer.toneMappingExposure = 1.5;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    renderer.shadowMap.autoUpdate = false;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f2ede3');
    const camera = new THREE.PerspectiveCamera(26.48, 1.5, 0.1, 80);
    const referencePosition = new THREE.Vector3(...position);
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
    function lighting() {
      const p = studio;
      key.intensity = p.key;
      fill.intensity = p.fill;
      rim.intensity = p.rim;
      key.color.set(p.keyColor);
      fill.color.set(p.fillColor);
      key.position.set(p.position[0], p.position[1], p.position[2]);
      scene.environmentIntensity = p.environment;
      renderer!.shadowMap.needsUpdate = true;
      report.lighting = 'studio';
      render();
    }
    const chapters = JSON.parse(root.dataset.chapters!) as {
      label: string;
      href: string;
    }[];
    const anchors = Array.from(
      root.querySelectorAll<HTMLAnchorElement>('[data-chapter]'),
    );
    const chapterBounds = new Map<number, THREE.Box3>();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    function projectTabs() {
      for (const [index, box] of chapterBounds) {
        const points = [];
        for (const x of [box.min.x, box.max.x])
          for (const y of [box.min.y, box.max.y])
            for (const z of [box.min.z, box.max.z])
              points.push(new THREE.Vector3(x, y, z).project(camera));
        const left =
          Math.min(...points.map((p) => (p.x + 1) * 0.5)) * stage.clientWidth;
        const right =
          Math.max(...points.map((p) => (p.x + 1) * 0.5)) * stage.clientWidth;
        const top =
          Math.min(...points.map((p) => (1 - p.y) * 0.5)) * stage.clientHeight;
        const bottom =
          Math.max(...points.map((p) => (1 - p.y) * 0.5)) * stage.clientHeight;
        const width = Math.max(right - left, 36),
          height = Math.max(bottom - top, 36);
        const anchor = anchors[index];
        if (!anchor) continue;
        anchor.style.left = `${(left + right - width) / 2}px`;
        anchor.style.top = `${(top + bottom - height) / 2}px`;
        anchor.style.width = `${width}px`;
        anchor.style.height = `${height}px`;
      }
    }
    function objectHref(object: THREE.Object3D) {
      if (object.userData.futureInteraction === 'portrait-dialog')
        return '#interactive-portrait';
      const href = object.userData.href;
      if (typeof href === 'string') {
        // Older preserved GLBs retain the original publication URL.
        if (href.includes('how-to-highlight-3d-brain-regions-2e6c15a35574'))
          return '/writing/highlighting-3d-brain-regions/';
        if (
          chapterIndex === 4 &&
          href === '/about/' &&
          /portrait/i.test(object.name)
        )
          return '#interactive-portrait';
        if (chapterIndex === 5 && href === '/contact/') return '#enquiry';
        const url = new URL(href, location.href);
        if (['http:', 'https:', 'mailto:'].includes(url.protocol)) return href;
      }
    }
    function openPortrait(event?: Event) {
      event?.preventDefault();
      document
        .querySelector<HTMLButtonElement>('[data-portrait-open]')
        ?.click();
    }
    const chapterAt = (event: PointerEvent) => {
      if (!model || report.state !== 'ready') return undefined;
      const rect = canvas.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        1 - ((event.clientY - rect.top) / rect.height) * 2,
      );
      raycaster.setFromCamera(pointer, camera);
      for (const hit of raycaster.intersectObject(model, true)) {
        let object: THREE.Object3D | null = hit.object;
        while (object) {
          const index = object.userData.chapterIndex;
          if (Number.isInteger(index)) return chapters[index]?.href;
          const href = objectHref(object);
          if (href) return href;
          object = object.parent;
        }
      }
      return undefined;
    };
    let press: { x: number; y: number; id: number; moved: boolean } | undefined;
    canvas.addEventListener(
      'pointerdown',
      (event) => {
        press = {
          x: event.clientX,
          y: event.clientY,
          id: event.pointerId,
          moved: false,
        };
      },
      { signal },
    );
    canvas.addEventListener(
      'pointercancel',
      () => {
        press = undefined;
      },
      { signal },
    );
    canvas.addEventListener(
      'pointerup',
      (event) => {
        const start = press;
        press = undefined;
        if (
          !start ||
          start.id !== event.pointerId ||
          start.moved ||
          Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6
        )
          return;
        const href = chapterAt(event);
        if (href === '#interactive-portrait') {
          document
            .querySelector<HTMLButtonElement>('[data-portrait-open]')
            ?.click();
        } else if (href) window.location.assign(href);
      },
      { signal },
    );
    canvas.addEventListener(
      'pointermove',
      (event) => {
        if (
          press &&
          Math.hypot(event.clientX - press.x, event.clientY - press.y) > 6
        )
          press.moved = true;
        canvas.style.cursor = chapterAt(event) ? 'pointer' : 'grab';
      },
      { signal },
    );
    function render() {
      if (closed || !renderer || !model || report.state === 'context-lost')
        return;
      camera.updateMatrixWorld();
      projectTabs();
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
      camera.setFocalLength(lens);
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
        update();
        status.textContent =
          'The book preview paused. You can still use the chapter tabs.';
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
      gltf = await loadAsset(loader, modelUrl);
    } catch (error) {
      if (closed) return;
      if (modelUrl === fallbackUrl) throw error;
      fallbackReason = String(error);
      asset = 'conventional';
      gltf = await loadAsset(
        new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),
        fallbackUrl,
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
    if ((chapterIndex === 0 && imageIds.size !== 10) || chapterIds.size !== 6)
      throw new Error('Required image or chapter metadata missing');
    scene.add(model);
    model.updateMatrixWorld(true);
    model.traverse((object) => {
      const index = object.userData.chapterIndex;
      if (!Number.isInteger(index)) return;
      const box = new THREE.Box3().setFromObject(object);
      if (box.isEmpty()) return;
      if (chapterBounds.has(index)) chapterBounds.get(index)!.union(box);
      else chapterBounds.set(index, box);
    });
    model.traverse((object) => {
      const name = object.name.replaceAll('_', ' ');
      if (
        !/^(Printed (Supervised|The Gamification|Highlighting)|Project nameplate|Matthew headshot photograph|Contact invitation|Original supervised embedding|Original Fitbit game scene|Source brain illustration relief)/.test(
          name,
        )
      )
        return;
      const href = objectHref(object);
      if (!href) return;
      const box = new THREE.Box3().setFromObject(object);
      if (box.isEmpty()) return;
      const link = document.createElement('a');
      link.href = href;
      link.dataset.exhibitHotspot = name;
      const label = document.createElement('span');
      label.className = 'sr-only';
      label.textContent = name.replace(/^(Printed |Project nameplate )/, '');
      link.append(label);
      if (href === '#interactive-portrait')
        link.addEventListener('click', openPortrait, { signal });
      chapterBounds.set(anchors.length, box);
      anchors.push(link);
      root.querySelector('.chapter-tabs')!.append(link);
    });
    lighting();
    stage.dataset.ready = '';
    report.state = 'ready';
    report.asset = asset;
    report.selectedChapter = root.dataset.chapterLabel || 'Start';
    report.chapterIndex = chapterIndex;
    report.approvedImages = [...imageIds].sort((a, b) => a - b);
    report.chapters = [...chapterIds].sort();
    report.fallbackReason = fallbackReason;
    report.dynamicLighting = true;
    report.estimatedTextureBytes = Math.round(textureBytes);
    report.textureMemoryScope =
      'Model textures and mipmaps only; excludes environment, shadow maps and driver overhead';
    report.physicalDeviceVerified = false;
    status.textContent = 'Book ready.';
    const assetUrl = asset === 'ktx2' ? modelUrl : fallbackUrl;
    const entry = performance
      .getEntriesByName(new URL(assetUrl, location.href).href)
      .at(-1) as PerformanceResourceTiming | undefined;
    report.modelTransferBytes = entry?.transferSize;
    report.modelEncodedBytes = entry?.encodedBodySize;
    render();
  } catch (error) {
    const message = String(error);
    cleanup();
    report.state = 'error';
    report.error = message;
    update();
    status.textContent =
      'Interactive view unavailable. You can still use the chapter tabs.';
  }
}
