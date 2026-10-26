import { finishTier, finishStudio } from './finish-policy.mjs';
import type { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { chapterOrder } from '../../lib/book-order.mjs';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  duration,
  pose,
  clamp,
  ease,
  turnDuration,
  skipPose,
} from './motion.mjs';
import assets from '../../../public/models/page-turn/manifest.json';
const assetFor = (chapter: Chapter) =>
  assets.chapters.find((item) => item.chapter === chapter)!;
type Chapter = 'start' | 'services' | 'work' | 'writing' | 'about' | 'contact';
const order = chapterOrder as Chapter[];
const chapterHref = (chapter: Chapter) =>
  chapter === 'start' ? '/' : `/${chapter}/`;
const label = (chapter: Chapter) => chapter[0].toUpperCase() + chapter.slice(1);
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
  const initial: Chapter = order.includes(root.dataset.initial as Chapter)
    ? (root.dataset.initial as Chapter)
    : 'start';
  const finish = root.dataset.finish === 'work-v1';
  const tier = finishTier({
    width: innerWidth,
    coarse: matchMedia('(pointer: coarse)').matches,
    memory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
  });
  type FinishAsset = {
    url: string;
    fallback: string;
    bytes: number;
    estimatedTextureBytes: number;
    rigs: string[];
  };
  let finishAssets: { shared: FinishAsset; work: FinishAsset } | undefined;
  const pageNavigation = root.dataset.navigation === 'page';
  const anchors = [
    ...root.querySelectorAll<HTMLAnchorElement>('[data-chapter]'),
  ];
  const abort = new AbortController(),
    signal = abort.signal,
    reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const models = new Map<Chapter, Model>(),
    tabBounds = new Map<number, THREE.Box3>();
  const exhibits: { chapter: Chapter; link: HTMLAnchorElement }[] = [];
  const report: Record<string, unknown> = {
    state: 'loading',
    selected: initial,
    lighting: 'studio',
    finish,
    tier: finish ? tier : 'original',
    physicalDeviceVerified: false,
    drawCalls: 0,
    triangles: 0,
    peakDrawCalls: 0,
    peakTriangles: 0,
    frameIntervals: [],
    completedTurns: [],
  };
  let renderer: THREE.WebGLRenderer | undefined,
    controls: OrbitControls | undefined,
    observer: ResizeObserver | undefined,
    pmrem: THREE.PMREMGenerator | undefined,
    environment: THREE.WebGLRenderTarget | undefined;
  let scene: THREE.Scene | undefined,
    leaf: THREE.Mesh | undefined,
    original: Float32Array | undefined;
  let ktx: KTX2Loader | undefined;
  let shadow: THREE.DirectionalLightShadow | undefined;
  const retiredBooks: THREE.Object3D[] = [];
  const tabMaterials: {
    index: number;
    surface: boolean;
    material: THREE.MeshStandardMaterial;
  }[] = [];
  let selected: Chapter = initial,
    requested: Chapter = initial,
    closed = false,
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
    exhibits.forEach(({ link }) => link.remove());
    cancelAnimationFrame(frame);
    observer?.disconnect();
    controls?.dispose();
    // Legacy book materials may also be used by their chapter content.
    // Keep those resources alive until the entire canvas is closed.
    retiredBooks.forEach((book) => scene?.add(book));
    if (scene) dispose(scene);
    for (const m of models.values()) if (!m.root.parent) dispose(m.root);
    shadow?.dispose();
    environment?.dispose();
    pmrem?.dispose();
    ktx?.dispose();
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
    renderer.setPixelRatio(
      Math.min(devicePixelRatio, finish && tier === 'compact' ? 1.25 : 1.5),
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.AgXToneMapping;
    renderer.toneMappingExposure = finish ? finishStudio.exposure : 1.5;
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
            position:
              chapter === 'contact'
                ? new THREE.Vector3(0.12, 11.8, 15)
                : new THREE.Vector3(0.12, 15, 12),
            target: new THREE.Vector3(0, 0.7, 0),
            lens: chapter === 'contact' ? 59 : 57,
          };
    const wideCamera = {
      position: new THREE.Vector3(0.12, 17, 18),
      target: new THREE.Vector3(0, 2, 0),
      lens: 48,
    };
    let focalLength =
      pageNavigation || finish ? restingCamera(initial).lens : 48;
    function frameCamera(
      time?: number,
      from: Chapter = selected,
      to: Chapter = selected,
    ) {
      if (!pageNavigation && !finish) return;
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
    scene.environmentIntensity = finish
      ? finishStudio.environmentIntensity
      : 0.38;
    const key = new THREE.DirectionalLight(
      0xffebd3,
      finish ? finishStudio.key : 3.2,
    );
    key.position.set(-4, 9, 3);
    key.castShadow = true;
    shadow = key.shadow;
    key.shadow.mapSize.set(
      finish && tier === 'enhanced' ? 2048 : 1024,
      finish && tier === 'enhanced' ? 2048 : 1024,
    );
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
    const fill = new THREE.DirectionalLight(
      0xf5f7ff,
      finish ? finishStudio.fill : 1.4,
    );
    fill.position.set(5, 7, -1);
    const rim = new THREE.DirectionalLight(
      0xffefdb,
      finish ? finishStudio.rim : 1,
    );
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
        const active = item.index === order.indexOf(selected);
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
      exhibits.forEach(({ chapter, link }) => {
        link.hidden = chapter !== selected;
      });
      anchors.slice(0, 6).forEach((a, i) => {
        if (i === order.indexOf(selected))
          a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
      const href = chapterHref(selected);
      open.href = href;
      open.textContent = `Open ${label(selected)} chapter page ↗`;
      root.querySelector('[data-current]')!.textContent = label(selected);
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
      status.textContent = `${label(chapter)} chapter open.`;
      render(true);
    }
    function showFrame(time: number) {
      const t = transition!;
      const count = Math.abs(order.indexOf(t.to) - order.indexOf(t.from));
      if (count > 1) {
        const p = skipPose(time, count);
        const direction = Math.sign(
          order.indexOf(t.to) - order.indexOf(t.from),
        );
        for (const model of models.values()) model.content.visible = false;
        const source = models.get(t.from)!,
          destination = models.get(t.to)!;
        source.content.visible = time < 350;
        destination.content.visible = p.incoming > 0;
        rigPose(source, p.outgoing);
        rigPose(destination, 1 - p.incoming);
        frameCamera(p.cameraTime, t.from, t.to);
        leaf!.visible = p.turning;
        turnLeaf(direction > 0 ? p.leaf : 1 - p.leaf);
        report.leafNumber = p.index + 1;
        report.turnCount = count;
        report.progress = clamp(time / turnDuration(count));
        exhibits.forEach(({ link }) => {
          link.hidden = true;
        });
        render(true);
        return;
      }
      const p = pose(time);
      frameCamera(time, t.from, t.to);
      const from = models.get(t.from)!,
        to = models.get(t.to)!;
      from.content.visible = p.leaf < 0.5;
      to.content.visible = p.leaf >= 0.5;
      rigPose(from, 0, time);
      rigPose(to, 0, time, true);
      leaf!.visible = time >= 350 && time < 1150;
      turnLeaf(
        order.indexOf(t.to) > order.indexOf(t.from) ? p.leaf : 1 - p.leaf,
      );
      exhibits.forEach(({ link }) => {
        link.hidden = true;
      });
      report.progress = clamp(time / duration);
      render(true);
    }
    function navigateSettled() {
      if (
        !pageNavigation ||
        location.pathname === chapterHref(selected) ||
        requested !== selected
      )
        return;
      location.assign(chapterHref(selected));
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
      const count = Math.abs(order.indexOf(t.to) - order.indexOf(t.from));
      const total = turnDuration(count);
      showFrame(Math.min(total, t.elapsed));
      if (t.elapsed >= total) {
        const direction = Math.sign(
          order.indexOf(t.to) - order.indexOf(t.from),
        );
        for (let i = 0; i < count; i++) {
          const index = order.indexOf(t.from) + i * direction;
          (report.completedTurns as unknown[]).push({
            from: order[index],
            to: order[index + direction],
          });
        }
        settle(t.to);
        if (requested !== selected) void advance();
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
    const loading = new Map<Chapter, Promise<void>>();
    let failed: Chapter | undefined;
    async function ensureChapter(chapter: Chapter) {
      if (models.has(chapter)) return;
      if (loading.has(chapter)) return loading.get(chapter)!;
      const promise = (async () => {
        const model = register(
          await (finishAssets && chapter === 'work'
            ? loadFinish(finishAssets.work)
            : load(assetFor(chapter).url)),
          chapter,
        );
        model.content.visible = false;
        rigPose(model, 1);
        report[chapter + 'Ready'] = true;
      })();
      loading.set(chapter, promise);
      try {
        await promise;
      } finally {
        loading.delete(chapter);
      }
    }
    async function advance() {
      if (closed || transition || !models.has(selected)) return;
      if (requested === selected) {
        settle(selected);
        navigateSettled();
        return;
      }
      const next = requested;
      status.textContent = `Preparing ${label(next)}…`;
      report.state = 'loading';
      publish();
      try {
        // Load the final spread before folding anything; skipped scenes stay folded.
        await ensureChapter(next);
        if (closed || transition) return;
        // The visitor may have changed direction while this model loaded.
        const desired = requested;
        if (next !== desired) {
          void advance();
          return;
        }
        failed = undefined;
        delete report.loadError;
        retry.hidden = true;
        if (pendingInstant || reduced.matches) {
          settle(next);
          navigateSettled();
        } else begin(next);
      } catch (error) {
        if (closed) return;
        failed = next;
        report.state = 'error';
        report.loadError = String(error);
        retry.hidden = false;
        open.href = chapterHref(requested);
        open.textContent = `Open ${label(requested)} without animation ↗`;
        status.textContent = `${label(next)} could not load. Retry or use the ordinary chapter link.`;
        publish();
      }
    }
    function choose(chapter: Chapter, instant = false) {
      requested = chapter;
      pendingInstant = instant;
      if (closed) return;
      if (failed && pageNavigation) {
        location.assign(chapterHref(chapter));
        return;
      }
      if (instant || reduced.matches) {
        cancelAnimationFrame(frame);
        frame = 0;
        if (transition) {
          settle(transition.from);
        }
      }
      void advance();
    }
    for (const a of anchors.slice(0, 6))
      a.addEventListener(
        'click',
        (event) => {
          if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey)
            return;
          event.preventDefault();
          event.stopPropagation();
          choose(order[Number(a.dataset.chapter)], event.detail === 0);
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
            !order.some((chapter) => chapterHref(chapter) === url.pathname)
          )
            return;
          event.preventDefault();
          root.scrollIntoView({ block: 'start', behavior: 'instant' });
          choose(
            order.find((chapter) => chapterHref(chapter) === url.pathname)!,
            event.detail === 0,
          );
        },
        { signal },
      );
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    if (finish) {
      const { KTX2Loader: Decoder } =
        await import('three/addons/loaders/KTX2Loader.js');
      ktx = new Decoder()
        .setTranscoderPath('/decoders/basis/')
        .detectSupport(renderer);
      loader.setKTX2Loader(ktx);
    }
    async function loadFinish(asset: FinishAsset) {
      try {
        if (new URLSearchParams(location.search).has('fallback'))
          throw Error('Conventional texture inspection');
        const model = await load(asset.url);
        report.textureFormat = 'ktx2';
        return model;
      } catch (error) {
        if (closed) throw error;
        const model = await load(asset.fallback);
        report.textureFormat = 'conventional';
        report.textureFallbackReason = String(error);
        return model;
      }
    }
    async function load(url: string) {
      let timer: ReturnType<typeof setTimeout>;
      let expired = false;
      return await new Promise<GLTF>((resolve, reject) => {
        timer = setTimeout(
          () => {
            expired = true;
            reject(Error('Model loading timed out'));
          },
          finish ? 90000 : 15000,
        );
        loader.load(
          url,
          (g) => {
            clearTimeout(timer);
            if (closed || expired) {
              dispose(g.scene);
              if (closed) reject(Error('Review closed'));
              return;
            }
            const entry = performance
              .getEntriesByName(new URL(url, location.href).href)
              .at(-1) as PerformanceResourceTiming | undefined;
            const resources = (report.resources ||= []) as unknown[];
            resources.push({
              url,
              encodedBytes: entry?.encodedBodySize ?? null,
              transferBytes: entry?.transferSize ?? null,
              durationMs: entry?.duration ?? null,
            });
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
    function registerTabs(book: THREE.Object3D) {
      book.traverse((o) => {
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
      book.traverse((o) => {
        const i = o.userData.chapterIndex;
        if (Number.isInteger(i)) {
          const box = new THREE.Box3().setFromObject(o);
          if (!box.isEmpty()) {
            if (tabBounds.has(i)) tabBounds.get(i)!.union(box);
            else tabBounds.set(i, box);
          }
        }
      });
    }
    function register(gltf: GLTF, chapter: Chapter) {
      // The review has its own shared book; discard legacy duplicates before adding chapters.
      if (finishAssets) {
        const duplicates: THREE.Object3D[] = [];
        gltf.scene.traverse((o) => {
          if (o.userData.role === 'shared-book') duplicates.push(o);
        });
        duplicates.forEach((o) => {
          o.removeFromParent();
          retiredBooks.push(o);
        });
      }
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
          if (finish && mat.userData.materialId === 'glass') {
            // A thin cover lens needs specular reflections, not a second blurred
            // scene render through a volume. Keep the original print legible.
            const lens = mat as THREE.MeshPhysicalMaterial;
            lens.transmission = 0;
            lens.transparent = true;
            lens.opacity = 0.08;
            lens.depthWrite = false;
            lens.side = THREE.FrontSide;
            lens.clearcoat = 1;
            lens.clearcoatRoughness = 0.025;
          }
          const detail = /Printed|Approved|legend/i.test(mat.name) || (finish && mat.userData.materialId === 'glass');
          mesh.castShadow = mesh.receiveShadow = !detail;
        }
      });
      if (
        !content ||
        rigs.length !==
          (finishAssets && chapter === 'work'
            ? finishAssets.work.rigs.length
            : assetFor(chapter).rigs.length) ||
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
        if (!finishAssets) registerTabs(gltf.scene);
        report.approvedImages = [...ids].sort((a, b) => a - b);
      }
      gltf.scene.traverse((object) => {
        const name = object.name.replaceAll('_', ' ');
        if (
          !/^(Printed (Supervised|The Gamification|Highlighting)|Project nameplate|Matthew headshot photograph|Contact invitation|Original supervised embedding|Original Fitbit game scene|Source brain illustration relief)/.test(
            name,
          )
        )
          return;
        let href = object.userData.href;
        const portrait =
          object.userData.futureInteraction === 'portrait-dialog' ||
          (chapter === 'about' && /headshot/i.test(name));
        if (portrait) href = '#interactive-portrait';
        if (typeof href !== 'string') return;
        if (href.includes('how-to-highlight-3d-brain-regions-2e6c15a35574'))
          href = '/writing/highlighting-3d-brain-regions/';
        if (chapter === 'contact' && href === '/contact/') href = '#enquiry';
        if (
          !['http:', 'https:', 'mailto:'].includes(
            new URL(href, location.href).protocol,
          )
        )
          return;
        const box = new THREE.Box3().setFromObject(object);
        if (box.isEmpty()) return;
        const link = document.createElement('a');
        link.href = href;
        link.dataset.exhibitHotspot = name;
        link.hidden = true;
        const text = document.createElement('span');
        text.textContent = name.replace(/^(Printed |Project nameplate )/, '');
        link.append(text);
        if (portrait)
          link.addEventListener(
            'click',
            (event) => {
              event.preventDefault();
              document
                .querySelector<HTMLButtonElement>('[data-portrait-open]')
                ?.click();
            },
            { signal },
          );
        tabBounds.set(anchors.length, box);
        anchors.push(link);
        exhibits.push({ chapter, link });
        root.querySelector('.tabs')!.append(link);
      });
      report[chapter + 'Rigs'] = rigs.map((r) => r.node.userData.rigId);
      return model;
    }
    retry.addEventListener(
      'click',
      () => {
        failed = undefined;
        void advance();
      },
      { signal },
    );
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
              choose(order[i]);
              return;
            }
            if (
              !transition &&
              o.userData.futureInteraction === 'portrait-dialog'
            ) {
              document
                .querySelector<HTMLButtonElement>('[data-portrait-open]')
                ?.click();
              return;
            }
            if (!transition && typeof o.userData.href === 'string') {
              let href = o.userData.href;
              if (
                href.includes('how-to-highlight-3d-brain-regions-2e6c15a35574')
              )
                href = '/writing/highlighting-3d-brain-regions/';
              if (selected === 'contact' && href === '/contact/')
                href = '#enquiry';
              const url = new URL(href, location.href);
              if (['http:', 'https:', 'mailto:'].includes(url.protocol))
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
          const e = event as CustomEvent<{
            progress: number;
            to: Chapter;
            from?: Chapter;
          }>;
          cancelAnimationFrame(frame);
          frame = 0;
          if (!models.has(e.detail.to)) return;
          const from =
            e.detail.from || (e.detail.to === 'start' ? 'services' : 'start');
          if (!models.has(from)) return;
          for (const model of models.values()) model.content.visible = false;
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
    if (finish && new URLSearchParams(location.search).has('capture')) {
      root.addEventListener('review-camera', (event) => {
        const detail = (event as CustomEvent<{position: number[]; target: number[]; lens: number}>).detail;
        camera.position.fromArray(detail.position);
        controls!.target.fromArray(detail.target);
        focalLength = detail.lens;
        camera.setFocalLength(focalLength);
        camera.lookAt(controls!.target);
        camera.updateProjectionMatrix();
        render();
      }, {signal});
    }
    if (finish) {
      const response = await fetch('/models/work-finish/v1/manifest.json', {
        signal,
      });
      if (!response.ok) throw Error('Work finish manifest unavailable');
      const manifest = await response.json();
      finishAssets = manifest.tiers[tier];
      const shared = await loadFinish(finishAssets!.shared);
      scene.add(shared.scene);
      shared.scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) mesh.castShadow = mesh.receiveShadow = true;
      });
      shared.scene.updateMatrixWorld(true);
      registerTabs(shared.scene);
      report.downloadBytes =
        finishAssets!.shared.bytes + finishAssets!.work.bytes;
      report.estimatedTextureBytes =
        finishAssets!.shared.estimatedTextureBytes +
        finishAssets!.work.estimatedTextureBytes;
    } else await ensureChapter('start');
    if (initial !== 'start' || finish) await ensureChapter(initial);
    controls.saveState();
    stage.dataset.ready = '';
    settle(initial);
    if (requested !== selected) void advance();
  } catch (error) {
    if (closed) return;
    cleanup();
    report.state = 'error';
    publish();
    status.textContent =
      'The 3D preview could not load. Use the ordinary chapter links.';
    if (finish) {
      retry.hidden = false;
      retry.addEventListener('click', () => {
        retry.hidden = true;
        canvas.replaceWith(canvas.cloneNode(false));
        void mountPageTurn(root);
      }, { once: true });
    }
    console.warn('Page-turn preview unavailable', error);
  }
}
