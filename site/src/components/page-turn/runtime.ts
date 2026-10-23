import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { duration, pose, clamp, ease } from './motion.mjs';
import assets from '../../../public/models/page-turn/manifest.json';
const assetFor = (chapter: Chapter) =>
  assets.chapters.find((item) => item.chapter === chapter)!;
type Chapter = 'start' | 'services';
type Rig = {
  node: THREE.Object3D;
  order: number;
  rest: THREE.Quaternion;
  folded: THREE.Quaternion;
  restScale: THREE.Vector3;
  foldedScale: THREE.Vector3;
};
type Model = { root: THREE.Group; content: THREE.Object3D; rigs: Rig[] };
export async function mountPageTurn(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>('[data-stage]')!,
    canvas = root.querySelector<HTMLCanvasElement>('canvas')!,
    status = root.querySelector<HTMLElement>('[role=status]')!;
  const open = root.querySelector<HTMLAnchorElement>('[data-open-chapter]')!,
    retry = root.querySelector<HTMLButtonElement>('[data-retry]')!,
    metrics = root.querySelector<HTMLElement>('[data-metrics]')!;
  const initial: Chapter =
    root.dataset.initial === 'services' ? 'services' : 'start';
  const pageNavigation = root.dataset.navigation === 'page';
  const anchors = [
    ...root.querySelectorAll<HTMLAnchorElement>('[data-chapter]'),
  ];
  const abort = new AbortController(),
    signal = abort.signal,
    reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const models = new Map<Chapter, Model>(),
    tabBounds = new Map<number, THREE.Box3>();
  const report: Record<string, unknown> = {
    state: 'loading',
    selected: initial,
    lighting: 'studio',
    physicalDeviceVerified: false,
    drawCalls: 0,
    triangles: 0,
    peakDrawCalls: 0,
    peakTriangles: 0,
    frameIntervals: [],
  };
  let renderer: THREE.WebGLRenderer | undefined,
    controls: OrbitControls | undefined,
    observer: ResizeObserver | undefined,
    pmrem: THREE.PMREMGenerator | undefined,
    environment: THREE.WebGLRenderTarget | undefined;
  let scene: THREE.Scene | undefined,
    leaf: THREE.Mesh | undefined,
    original: Float32Array | undefined;
  let shadow: THREE.DirectionalLightShadow | undefined;
  const tabMaterials: {
    index: number;
    surface: boolean;
    material: THREE.MeshStandardMaterial;
  }[] = [];
  let selected: Chapter = initial,
    requested: Chapter = initial,
    closed = false,
    servicesLoading = false,
    pendingInstant = false,
    frame = 0,
    hidden = document.hidden;
  let transition:
    { from: Chapter; to: Chapter; elapsed: number; last: number } | undefined;
  const publish = () => {
    root.dataset.state = String(report.state);
    root.dataset.selected = selected;
    report.selected = selected;
    metrics.textContent = JSON.stringify(report);
  };
  const dispose = (object: THREE.Object3D) => {
    const geometries = new Set<THREE.BufferGeometry>(),
      materials = new Set<THREE.Material>(),
      textures = new Set<THREE.Texture>();
    object.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      geometries.add(m.geometry);
      for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
        materials.add(mat);
        for (const v of Object.values(mat))
          if (v instanceof THREE.Texture) textures.add(v);
      }
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => {
      if (t.image instanceof ImageBitmap) t.image.close();
      t.dispose();
    });
  };
  function cleanup() {
    if (closed) return;
    closed = true;
    abort.abort();
    cancelAnimationFrame(frame);
    observer?.disconnect();
    controls?.dispose();
    if (scene) dispose(scene);
    for (const m of models.values()) if (!m.root.parent) dispose(m.root);
    shadow?.dispose();
    environment?.dispose();
    pmrem?.dispose();
    renderer?.dispose();
    renderer?.forceContextLoss();
    delete stage.dataset.ready;
    report.state = 'closed';
    report.resourcesDisposed = true;
    publish();
  }
  window.addEventListener('pagehide', cleanup, { signal });
  publish();
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'low-power',
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.AgXToneMapping;
    renderer.toneMappingExposure = 1.5;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.info.autoReset = false;
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#f2ede3');
    const camera = new THREE.PerspectiveCamera(30, 1.5, 0.1, 80);
    camera.position.set(0.12, 17, 18);
    camera.lookAt(0, 2, 0);
    controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 2, 0);
    controls.enablePan = false;
    controls.minDistance = 16;
    controls.maxDistance = 29;
    controls.minPolarAngle = 0.35;
    controls.maxPolarAngle = 1.3;
    controls.update();
    const restingCamera = (chapter: Chapter) =>
      chapter === 'start'
        ? {
            position: new THREE.Vector3(0.12, 13.6, 14),
            target: new THREE.Vector3(0, 0.7, 0),
            lens: 51,
          }
        : {
            position: new THREE.Vector3(0.12, 15, 12),
            target: new THREE.Vector3(0, 0.7, 0),
            lens: 57,
          };
    const wideCamera = {
      position: new THREE.Vector3(0.12, 17, 18),
      target: new THREE.Vector3(0, 2, 0),
      lens: 48,
    };
    let focalLength = pageNavigation ? restingCamera(initial).lens : 48;
    function frameCamera(
      time?: number,
      from: Chapter = selected,
      to: Chapter = selected,
    ) {
      if (!pageNavigation) return;
      const incoming = time !== undefined && time >= 1150;
      const a =
        time === undefined
          ? restingCamera(to)
          : incoming
            ? wideCamera
            : restingCamera(from);
      const b =
        time === undefined ? a : incoming ? restingCamera(to) : wideCamera;
      const amount =
        time === undefined
          ? 0
          : incoming
            ? ease((time - 1150) / 450)
            : ease(time / 350);
      camera.position.copy(a.position).lerp(b.position, amount);
      controls!.target.copy(a.target).lerp(b.target, amount);
      focalLength = THREE.MathUtils.lerp(a.lens, b.lens, amount);
      camera.setFocalLength(focalLength);
      camera.lookAt(controls!.target);
      camera.updateProjectionMatrix();
    }
    frameCamera(undefined, initial, initial);
    const room = new RoomEnvironment();
    pmrem = new THREE.PMREMGenerator(renderer);
    environment = pmrem.fromScene(room, 0.04);
    room.dispose();
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.38;
    const key = new THREE.DirectionalLight(0xffebd3, 3.2);
    key.position.set(-4, 9, 3);
    key.castShadow = true;
    shadow = key.shadow;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.radius = 10;
    key.shadow.blurSamples = 16;
    Object.assign(key.shadow.camera, {
      left: -8,
      right: 8,
      top: 8,
      bottom: -8,
      far: 30,
    });
    key.shadow.bias = -0.0002;
    key.shadow.normalBias = 0.012;
    const fill = new THREE.DirectionalLight(0xf5f7ff, 1.4);
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
    const paper = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setRGB(0.91, 0.84, 0.7),
      roughness: 0.86,
      side: THREE.DoubleSide,
    });
    const geometry = new THREE.BoxGeometry(5, 0.018, 5.6, 64, 1, 20);
    geometry.translate(2.5, 0, 0);
    leaf = new THREE.Mesh(geometry, paper);
    leaf.castShadow = leaf.receiveShadow = true;
    leaf.visible = false;
    original = Float32Array.from(geometry.attributes.position.array);
    scene.add(leaf);
    const raycaster = new THREE.Raycaster(),
      pointer = new THREE.Vector2();
    function projectTabs() {
      for (const [i, box] of tabBounds) {
        const points = [];
        for (const x of [box.min.x, box.max.x])
          for (const y of [box.min.y, box.max.y])
            for (const z of [box.min.z, box.max.z])
              points.push(new THREE.Vector3(x, y, z).project(camera));
        const left =
            Math.min(...points.map((p) => (p.x + 1) * 0.5)) * stage.clientWidth,
          right =
            Math.max(...points.map((p) => (p.x + 1) * 0.5)) * stage.clientWidth,
          top =
            Math.min(...points.map((p) => (1 - p.y) * 0.5)) *
            stage.clientHeight,
          bottom =
            Math.max(...points.map((p) => (1 - p.y) * 0.5)) *
            stage.clientHeight;
        Object.assign(anchors[i].style, {
          left: `${left}px`,
          top: `${top}px`,
          width: `${Math.max(36, right - left)}px`,
          height: `${Math.max(36, bottom - top)}px`,
        });
      }
    }
    function render(shadows = false) {
      if (closed || !renderer || hidden) return;
      camera.updateMatrixWorld();
      projectTabs();
      renderer.shadowMap.needsUpdate = shadows;
      renderer.info.reset();
      renderer.render(scene!, camera);
      report.drawCalls = renderer.info.render.calls;
      report.triangles = renderer.info.render.triangles;
      report.camera = {
        position: camera.position.toArray(),
        target: controls!.target.toArray(),
        focalLength: camera.getFocalLength(),
      };
      report.peakDrawCalls = Math.max(
        Number(report.peakDrawCalls),
        renderer.info.render.calls,
      );
      report.peakTriangles = Math.max(
        Number(report.peakTriangles),
        renderer.info.render.triangles,
      );
      publish();
    }
    controls.addEventListener('change', () => render());
    function rigPose(
      model: Model,
      fold: number,
      time?: number,
      incoming = false,
    ) {
      for (const rig of model.rigs) {
        const amount =
          time === undefined
            ? fold
            : incoming
              ? 1 - pose(time, rig.order).incoming
              : pose(time, rig.order).outgoing;
        rig.node.quaternion.slerpQuaternions(rig.rest, rig.folded, amount);
        rig.node.scale.copy(rig.restScale).lerp(rig.foldedScale, amount);
      }
    }
    function turnLeaf(progress: number) {
      const p = progress,
        positions = leaf!.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const r = original![i * 3],
          thickness = original![i * 3 + 1],
          z = original![i * 3 + 2],
          t = r / 5;
        const angle = Math.PI * p + 0.5 * Math.sin(Math.PI * p) * t;
        const arch = 0.3 * Math.sin(Math.PI * t) + 0.13 * t;
        positions.setXYZ(
          i,
          r * Math.cos(angle) - thickness * Math.sin(angle),
          0.32 +
            Math.max(0, -z - 1.3) ** 1.3 * 0.65 +
            r * Math.sin(angle) +
            arch +
            thickness * Math.cos(angle),
          z,
        );
      }
      positions.needsUpdate = true;
      leaf!.geometry.computeVertexNormals();
    }
    function tabs() {
      for (const item of tabMaterials) {
        const active = item.index === (selected === 'start' ? 0 : 1);
        item.material.color.setRGB(
          ...((item.surface
            ? active
              ? [0.004, 0.02, 0.08]
              : [0.91, 0.84, 0.7]
            : active
              ? [0.91, 0.84, 0.7]
              : [0.008, 0.024, 0.049]) as [number, number, number]),
        );
      }
      anchors.forEach((a, i) => {
        if (i === (selected === 'start' ? 0 : 1))
          a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
      const href = selected === 'start' ? '/' : '/services/';
      open.href = href;
      open.textContent = `Open ${selected === 'start' ? 'Start' : 'Services'} chapter page ↗`;
      root.querySelector('[data-current]')!.textContent =
        selected === 'start' ? 'Start' : 'Services';
    }
    function settle(chapter: Chapter) {
      for (const [id, m] of models) {
        m.content.visible = id === chapter;
        rigPose(m, id === chapter ? 0 : 1);
      }
      selected = chapter;
      leaf!.visible = false;
      transition = undefined;
      controls!.enabled = true;
      frameCamera(undefined, chapter, chapter);
      controls!.update();
      controls!.saveState();
      report.state = 'settled';
      report.progress = 1;
      tabs();
      status.textContent = `${chapter === 'start' ? 'Start' : 'Services'} chapter open.`;
      render(true);
    }
    function showFrame(time: number) {
      const t = transition!;
      const p = pose(time);
      frameCamera(time, t.from, t.to);
      const from = models.get(t.from)!,
        to = models.get(t.to)!;
      from.content.visible = p.leaf < 0.5;
      to.content.visible = p.leaf >= 0.5;
      rigPose(from, 0, time);
      rigPose(to, 0, time, true);
      leaf!.visible = time >= 350 && time < 1150;
      turnLeaf(t.to === 'services' ? p.leaf : 1 - p.leaf);
      report.progress = clamp(time / duration);
      render(true);
    }
    function navigateSettled() {
      if (!pageNavigation || selected === initial || requested !== selected)
        return;
      location.assign(selected === 'start' ? '/' : '/services/');
    }
    function tick(now: number) {
      frame = 0;
      if (closed || hidden || !transition) return;
      const t = transition;
      if (t.last) {
        const dt = now - t.last;
        t.elapsed += dt;
        const samples = report.frameIntervals as number[];
        if (samples.length < 240) samples.push(dt);
      }
      t.last = now;
      showFrame(Math.min(duration, t.elapsed));
      if (t.elapsed >= duration) {
        settle(t.to);
        if (requested !== selected) begin(requested);
        else navigateSettled();
      } else frame = requestAnimationFrame(tick);
    }
    function begin(chapter: Chapter) {
      if (chapter === selected || transition || !models.has(chapter)) return;
      transition = { from: selected, to: chapter, elapsed: 0, last: 0 };
      controls!.enabled = false;
      controls!.reset();
      report.state = 'turning';
      status.textContent = `Turning to ${chapter}…`;
      report.frameIntervals = [];
      frame = requestAnimationFrame(tick);
    }
    function choose(chapter: Chapter, instant = false) {
      requested = chapter;
      pendingInstant = instant;
      if (closed) return;
      if (pageNavigation && report.servicesError) {
        location.assign(chapter === 'start' ? '/' : '/services/');
        return;
      }
      if (!models.has(selected)) {
        status.textContent =
          'Preparing the book. Your chapter selection is queued.';
        return;
      }
      if (!models.has(chapter)) {
        status.textContent =
          'Services is loading. The current chapter remains open.';
        if (!servicesLoading) void loadServices();
        return;
      }
      if (instant || reduced.matches) {
        cancelAnimationFrame(frame);
        frame = 0;
        settle(chapter);
        navigateSettled();
        return;
      }
      begin(chapter);
    }
    for (const a of anchors.slice(0, 2))
      a.addEventListener(
        'click',
        (event) => {
          if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey)
            return;
          event.preventDefault();
          event.stopPropagation();
          choose(
            a.dataset.chapter === '0' ? 'start' : 'services',
            event.detail === 0,
          );
        },
        { signal },
      );
    if (pageNavigation)
      document.addEventListener(
        'click',
        (event) => {
          if (
            event.defaultPrevented ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey
          )
            return;
          const link = (event.target as Element)?.closest<HTMLAnchorElement>(
            'a[href]',
          );
          if (
            !link ||
            root.contains(link) ||
            link.target ||
            link.hasAttribute('download')
          )
            return;
          const url = new URL(link.href, location.href);
          if (
            url.origin !== location.origin ||
            url.search ||
            url.hash ||
            !['/', '/services/'].includes(url.pathname)
          )
            return;
          event.preventDefault();
          root.scrollIntoView({ block: 'start', behavior: 'instant' });
          choose(
            url.pathname === '/' ? 'start' : 'services',
            event.detail === 0,
          );
        },
        { signal },
      );
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    async function load(url: string) {
      let timer: ReturnType<typeof setTimeout>;
      let expired = false;
      return await new Promise<GLTF>((resolve, reject) => {
        timer = setTimeout(() => {
          expired = true;
          reject(Error('Model loading timed out'));
        }, 15000);
        loader.load(
          url,
          (g) => {
            clearTimeout(timer);
            if (closed || expired) {
              dispose(g.scene);
              if (closed) reject(Error('Review closed'));
              return;
            }
            resolve(g);
          },
          undefined,
          (e) => {
            clearTimeout(timer);
            reject(e);
          },
        );
      });
    }
    function register(gltf: GLTF, chapter: Chapter) {
      const rigs: Rig[] = [];
      let content: THREE.Object3D | undefined;
      const ids = new Set<number>();
      gltf.scene.traverse((o) => {
        if (o.userData.role === 'chapter-content') content = o;
        if (o.userData.approvedImageNumber)
          ids.add(o.userData.approvedImageNumber);
        if (o.userData.rigId) {
          const data = o.userData;
          if (!data.rest || !data.folded) throw Error('Incomplete rig');
          rigs.push({
            node: o,
            order: data.order,
            rest: new THREE.Quaternion().fromArray(data.rest.rotation),
            folded: new THREE.Quaternion().fromArray(data.folded.rotation),
            restScale: new THREE.Vector3().fromArray(data.rest.scale),
            foldedScale: new THREE.Vector3().fromArray(data.folded.scale),
          });
        }
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          const detail = /Printed|Approved|legend/i.test(mat.name);
          mesh.castShadow = mesh.receiveShadow = !detail;
        }
      });
      if (
        !content ||
        rigs.length !== assetFor(chapter).rigs.length ||
        (chapter === 'start' && ids.size !== 10)
      ) {
        dispose(gltf.scene);
        throw Error('Required rig or image metadata missing');
      }
      const model = { root: gltf.scene, content, rigs };
      models.set(chapter, model);
      scene!.add(gltf.scene);
      gltf.scene.updateMatrixWorld(true);
      if (chapter === 'start') {
        gltf.scene.traverse((o) => {
          if (typeof o.userData.tabSurface !== 'boolean') return;
          o.traverse((child) => {
            const mesh = child as THREE.Mesh;
            if (!mesh.isMesh) return;
            const material = (
              mesh.material as THREE.MeshStandardMaterial
            ).clone();
            mesh.material = material;
            tabMaterials.push({
              index: o.userData.chapterIndex,
              surface: o.userData.tabSurface,
              material,
            });
          });
        });
        gltf.scene.traverse((o) => {
          const i = o.userData.chapterIndex;
          if (Number.isInteger(i)) {
            const box = new THREE.Box3().setFromObject(o);
            if (!box.isEmpty()) {
              if (tabBounds.has(i)) tabBounds.get(i)!.union(box);
              else tabBounds.set(i, box);
            }
          }
        });
        report.approvedImages = [...ids].sort((a, b) => a - b);
      }
      report[chapter + 'Rigs'] = rigs.map((r) => r.node.userData.rigId);
      return model;
    }
    async function loadServices() {
      if (servicesLoading || closed) return;
      servicesLoading = true;
      status.textContent =
        'Loading Services; the current chapter remains available.';
      retry.hidden = true;
      try {
        const model = register(
          await load(assetFor('services').url),
          'services',
        );
        model.content.visible = false;
        rigPose(model, 1);
        if (initial === 'services' && report.state === 'loading') {
          stage.dataset.ready = '';
          settle('services');
        }
        report.servicesReady = true;
        delete report.servicesError;
        if (requested !== selected) choose(requested, pendingInstant);
        else {
          status.textContent = pageNavigation
            ? 'Book ready.'
            : 'Choose Services to turn the page.';
          render();
        }
      } catch (error) {
        if (closed) return;
        status.textContent =
          'Services could not load. Retry or open its ordinary chapter page.';
        retry.hidden = false;
        report.servicesError = String(error);
        publish();
      } finally {
        servicesLoading = false;
      }
    }
    retry.addEventListener('click', () => void loadServices(), { signal });
    // Mouse/touch mesh navigation stays distinct from camera dragging.
    let press: { x: number; y: number; moved: boolean } | undefined;
    canvas.addEventListener(
      'pointerdown',
      (e) => {
        press = { x: e.clientX, y: e.clientY, moved: false };
      },
      { signal },
    );
    canvas.addEventListener(
      'pointermove',
      (e) => {
        if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 6)
          press.moved = true;
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
      (e) => {
        const p = press;
        press = undefined;
        if (!p || p.moved || Math.hypot(e.clientX - p.x, e.clientY - p.y) > 6)
          return;
        const rect = canvas.getBoundingClientRect();
        pointer.set(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          1 - ((e.clientY - rect.top) / rect.height) * 2,
        );
        raycaster.setFromCamera(pointer, camera);
        for (const hit of raycaster.intersectObjects(
          [...models.values()].map((m) => m.root),
          true,
        )) {
          let ancestor: THREE.Object3D | null = hit.object;
          let visible = true;
          while (ancestor) {
            if (!ancestor.visible) visible = false;
            ancestor = ancestor.parent;
          }
          if (!visible) continue;
          let o: THREE.Object3D | null = hit.object;
          while (o) {
            if (!o.visible) break;
            const i = o.userData.chapterIndex;
            if (Number.isInteger(i)) {
              if (i < 2) choose(i === 0 ? 'start' : 'services');
              else location.assign(anchors[i].href);
              return;
            }
            if (!transition && typeof o.userData.href === 'string') {
              const url = new URL(o.userData.href, location.href);
              if (['http:', 'https:'].includes(url.protocol))
                location.assign(url.href);
              return;
            }
            o = o.parent;
          }
        }
      },
      { signal },
    );
    document.addEventListener(
      'visibilitychange',
      () => {
        hidden = document.hidden;
        if (hidden) {
          cancelAnimationFrame(frame);
          frame = 0;
          if (transition) transition.last = 0;
        } else if (transition) frame = requestAnimationFrame(tick);
        else render();
      },
      { signal },
    );
    reduced.addEventListener(
      'change',
      () => {
        if (reduced.matches && transition) choose(requested, true);
      },
      { signal },
    );
    canvas.addEventListener(
      'webglcontextlost',
      (e) => {
        e.preventDefault();
        cleanup();
        status.textContent =
          'Graphics unavailable. Use the chapter links below.';
        report.state = 'error';
        publish();
      },
      { signal },
    );
    observer = new ResizeObserver(() => {
      renderer!.setSize(stage.clientWidth, stage.clientHeight, false);
      camera.aspect = stage.clientWidth / stage.clientHeight;
      camera.setFocalLength(focalLength);
      camera.updateProjectionMatrix();
      render();
    });
    observer.observe(stage);
    // Deterministic capture hook is available only with an explicit review query.
    if (new URLSearchParams(location.search).has('capture'))
      root.addEventListener(
        'review-seek',
        (event) => {
          const e = event as CustomEvent<{ progress: number; to: Chapter }>;
          cancelAnimationFrame(frame);
          frame = 0;
          if (!models.has(e.detail.to)) return;
          const from = e.detail.to === 'start' ? 'services' : 'start';
          transition = {
            from,
            to: e.detail.to,
            elapsed: duration * clamp(e.detail.progress),
            last: 0,
          };
          report.state = 'turning';
          showFrame(transition.elapsed);
        },
        { signal },
      );
    register(await load(assetFor('start').url), 'start');
    controls.saveState();
    if (initial === 'start') {
      stage.dataset.ready = '';
      settle('start');
    } else {
      models.get('start')!.content.visible = false;
    }
    void loadServices();
  } catch (error) {
    if (closed) return;
    cleanup();
    report.state = 'error';
    publish();
    status.textContent =
      'The 3D preview could not load. Use the ordinary chapter links.';
    console.warn('Page-turn preview unavailable', error);
  }
}
