import * as THREE from 'three';
import {
  box,
  material,
  batchStatic,
  disposeTree,
  palette as p,
} from './primitives';
import { buildScene, type Artwork } from './scenes';

// The shared motion curve: cubic-bezier(0.77, 0, 0.175, 1).
function turnEase(elapsed: number) {
  if (elapsed <= 0 || elapsed >= 1) return elapsed;
  let low = 0,
    high = 1,
    t = 0.5;
  for (let i = 0; i < 14; i++) {
    t = (low + high) / 2;
    const x =
      3 * (1 - t) * (1 - t) * t * 0.77 +
      3 * (1 - t) * t * t * 0.175 +
      t * t * t;
    if (x < elapsed) low = t;
    else high = t;
  }
  return 3 * (1 - t) * t * t + t * t * t;
}

export async function mountBook(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas')!;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene();
  try {
    const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 70);
    camera.position.set(3.6, 7.5, 11.7);
    camera.lookAt(0, 0.85, 0);
    scene.add(new THREE.HemisphereLight('#fff4dc', '#c2b7a6', 1.7));
    const sun = new THREE.DirectionalLight('#fff5e5', 3.2);
    sun.position.set(-4, 9, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, {
      left: -8,
      right: 8,
      top: 8,
      bottom: -8,
      near: 0.5,
      far: 30,
    });
    sun.shadow.bias = -0.001;
    sun.shadow.normalBias = 0.04;
    scene.add(sun);
    const fill = new THREE.DirectionalLight('#aec5ff', 1.4);
    fill.position.set(5, 3, -4);
    scene.add(fill);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.ShadowMaterial({ color: '#736450', opacity: 0.17 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.4;
    floor.receiveShadow = true;
    scene.add(floor);
    const book = new THREE.Group();
    scene.add(book);
    box(book, [8.5, 0.12, 5.65], [0, -0.28, 0], p.blue);
    for (let i = 0; i < 7; i++)
      box(
        book,
        [8.25 - i * 0.025, 0.045, 5.4 - i * 0.02],
        [0, -0.19 + i * 0.052, 0],
        i % 2 ? p.paper : p.cream,
      );
    const page = new THREE.PlaneGeometry(8.15, 5.25, 48, 2);
    page.rotateX(-Math.PI / 2);
    const positions = page.attributes.position;
    for (let i = 0; i < positions.count; i++)
      positions.setY(
        i,
        0.22 + 0.08 * (1 - Math.exp(-Math.abs(positions.getX(i)) * 2)),
      );
    page.computeVertexNormals();
    const spread = new THREE.Mesh(page, material(p.cream).clone());
    spread.receiveShadow = true;
    book.add(spread);
    box(book, [0.05, 0.04, 5.3], [0, 0.3, 0], '#d6c5a5');
    // Visible deckled layers, stitched binding, gilt cover corners and bookmark.
    for (let i = 0; i < 20; i++) {
      const z = -2.45 + i * 0.25;
      box(book, [0.035, 0.018, 0.09], [0, 0.31, z], '#bca987');
    }
    for (const x of [-4.12, 4.12])
      for (const z of [-2.63, 2.63]) {
        box(
          book,
          [0.5, 0.025, 0.07],
          [x - Math.sign(x) * 0.2, -0.205, z],
          '#ba9458',
        );
        box(
          book,
          [0.07, 0.025, 0.4],
          [x, -0.205, z - Math.sign(z) * 0.16],
          '#ba9458',
        );
      }
    const bookmark = box(
      book,
      [0.27, 0.025, 1.15],
      [3.15, -0.12, 2.9],
      p.coral,
    );
    bookmark.rotation.y = -0.15;
    const printCanvas = document.createElement('canvas');
    printCanvas.width = 1024;
    printCanvas.height = 640;
    const print = printCanvas.getContext('2d')!;
    print.fillStyle = p.cream;
    print.fillRect(0, 0, 1024, 640);
    print.strokeStyle = '#dbcfb7';
    print.lineWidth = 1;
    for (let i = 0; i < 24; i++) {
      print.beginPath();
      print.moveTo(40 + i * 40, 40);
      print.lineTo(40 + i * 40, 600);
      print.stroke();
    }
    for (let i = 0; i < 15; i++) {
      print.beginPath();
      print.moveTo(40, 40 + i * 40);
      print.lineTo(984, 40 + i * 40);
      print.stroke();
    }
    print.fillStyle = '#85775f';
    print.font = '18px monospace';
    print.fillText('MATTHEW OLDACH / THE PAPER WORKSHOP', 60, 585);
    print.fillText('IDEAS → SYSTEMS → PEOPLE', 620, 585);
    const printTexture = new THREE.CanvasTexture(printCanvas);
    printTexture.colorSpace = THREE.SRGBColorSpace;
    (spread.material as THREE.MeshStandardMaterial).map = printTexture;
    batchStatic(book);
    await document.fonts.ready;
    const loader = new THREE.TextureLoader();
    const artwork = JSON.parse(root.dataset.artwork!) as Record<
      keyof Artwork,
      string
    >;
    const art = Object.fromEntries(
      await Promise.all(
        Object.entries(artwork).map(async ([name, url]) => {
          const texture = await loader.loadAsync(url);
          texture.colorSpace = THREE.SRGBColorSpace;
          return [name, texture];
        }),
      ),
    ) as Artwork;
    const chapters = JSON.parse(root.dataset.chapters!) as {
      label: string;
      href: string;
    }[];
    const exhibits = JSON.parse(root.dataset.exhibitLinks!);
    const scenes = Array.from({ length: 6 }, () => new THREE.Group());
    const loaded = new Set<number>();
    const pending = new Map<number, Promise<void>>();
    async function loadChapter(index: number) {
      if (loaded.has(index)) return;
      let task = pending.get(index);
      if (!task) {
        task = (async () => {
          await new Promise((resolve) => setTimeout(resolve, 0));
          const chapter = await buildScene(art, exhibits, index);
          chapter.visible = false;
          scenes[index].removeFromParent();
          scenes[index] = chapter;
          book.add(chapter);
          loaded.add(index);
        })();
        pending.set(index, task);
      }
      try {
        await task;
      } finally {
        pending.delete(index);
      }
    }
    await loadChapter(0);
    scenes[0].visible = true;
    const turning = new THREE.Group();
    turning.position.y = 0.32;
    book.add(turning);
    box(turning, [4.05, 0.04, 5.25], [2.025, 0, 0], p.cream);
    turning.visible = false;
    let ready = false;
    let selected = 0,
      next = 0,
      turnStart = 0,
      frame = 0,
      visible = true,
      playing = !motion.matches,
      artworkView = false,
      lost = false;
    let yaw = 0,
      pitch = 0,
      drag: { x: number; y: number; id: number; distance: number } | undefined;
    const controls = root.querySelector<HTMLElement>('.book-controls')!;
    const pause = root.querySelector<HTMLButtonElement>('[data-pause-book]')!;
    const open = root.querySelector<HTMLAnchorElement>('[data-open-chapter]')!;
    const status = root.querySelector<HTMLElement>('[data-book-status]')!;
    const abort = new AbortController();
    const signal = abort.signal;
    const tabButtons = [
      ...root.querySelectorAll<HTMLButtonElement>('[data-chapter]'),
    ];
    let lastRender = 0;
    function render(time = performance.now()) {
      frame = 0;
      if (lost || artworkView || !visible || document.hidden) return;
      if (playing && !turnStart && time - lastRender < 32) {
        request();
        return;
      }
      lastRender = time;
      if (turnStart) {
        const progress = turnEase(Math.min((time - turnStart) / 800, 1));
        turning.visible = progress < 1;
        turning.rotation.z = Math.PI * progress;
        scenes[selected].scale.y = Math.max(
          0.04,
          Math.abs(Math.cos(progress * Math.PI)),
        );
        if (progress >= 0.5 && selected !== next) {
          scenes[selected].visible = false;
          scenes[selected].scale.y = 1;
          selected = next;
          scenes[selected].visible = true;
        }
        if (progress === 1) {
          turnStart = 0;
          root
            .querySelector('[role=tabpanel]')!
            .setAttribute('aria-busy', 'false');
          scenes[selected].scale.y = 1;
        }
      }
      book.rotation.y =
        yaw +
        (playing && !motion.matches ? Math.sin(time * 0.0003) * 0.035 : 0);
      book.rotation.x = pitch;
      if (playing && !motion.matches)
        scenes[selected].traverse((object) => {
          const motion = object.userData.motion;
          if (motion === 'float') {
            object.position.y =
              object.userData.baseY +
              Math.sin(time * 0.0014 + object.id) * 0.07;
            object.rotation.z = Math.sin(time * 0.001 + object.id) * 0.06;
          }
        });
      renderer.render(scene, camera);
      if ((playing && !motion.matches) || turnStart) request();
    }
    function request() {
      if (
        ready &&
        !frame &&
        !artworkView &&
        !lost &&
        visible &&
        !document.hidden
      )
        frame = requestAnimationFrame(render);
    }
    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      // Keep both covers in frame on upright phone layouts.
      const distance = camera.aspect < 1.3 ? 1.2 : 1;
      camera.position.set(3.6 * distance, 7.5 * distance, 11.7 * distance);
      camera.lookAt(0, 0.85, 0);
      camera.updateProjectionMatrix();
      request();
    }
    let selectionVersion = 0;
    async function select(index: number, instant = false) {
      const version = ++selectionVersion;
      if (!loaded.has(index)) {
        status.textContent = `Opening ${chapters[index].label}…`;
        root
          .querySelector('[role=tabpanel]')!
          .setAttribute('aria-busy', 'true');
        try {
          await loadChapter(index);
        } catch {
          if (version === selectionVersion) {
            status.textContent =
              'This scene could not load. Use the page navigation to keep exploring.';
            root
              .querySelector('[role=tabpanel]')!
              .setAttribute('aria-busy', 'false');
          }
          return;
        }
        if (version !== selectionVersion) return;
      }
      if (turnStart) {
        turnStart = 0;
        turning.visible = false;
        scenes.forEach((scene) => {
          scene.visible = false;
          scene.scale.y = 1;
        });
        selected = next;
        scenes[selected].visible = true;
      }
      next = index;
      tabButtons.forEach((b, i) => {
        b.setAttribute('aria-selected', String(i === index));
        b.tabIndex = i === index ? 0 : -1;
      });
      open.href = chapters[index].href;
      open.textContent = `Open ${chapters[index].label} ↗`;
      status.textContent = `${chapters[index].label} chapter. Drag to rotate the book.`;
      root.dataset.chapter = chapters[index].label;
      root.querySelector<HTMLElement>('[data-exhibit-list]')!.hidden =
        index !== 3;
      history.replaceState({ ...history.state, bookChapter: index }, '');
      root
        .querySelector('[role=tabpanel]')!
        .setAttribute('aria-labelledby', `book-tab-${index}`);
      if (instant || !playing || motion.matches || index === selected) {
        scenes[selected].visible = false;
        selected = index;
        scenes[selected].visible = true;
      } else turnStart = performance.now();
      root
        .querySelector('[role=tabpanel]')!
        .setAttribute('aria-busy', String(Boolean(turnStart)));
      request();
    }
    tabButtons.forEach((button, i) => {
      button.addEventListener('click', () => select(i), { signal });
      button.addEventListener(
        'keydown',
        (event) => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key))
            return;
          event.preventDefault();
          const index =
            event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? 5
                : (i + (event.key === 'ArrowRight' ? 1 : 5)) % 6;
          tabButtons[index].focus();
          select(index, true);
        },
        { signal },
      );
    });
    pause.addEventListener(
      'click',
      () => {
        playing = !playing;
        if (!playing && turnStart) select(next, true);
        pause.textContent = playing ? 'Pause motion' : 'Play motion';
        pause.setAttribute('aria-pressed', String(!playing));
        if (!playing && frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
        request();
      },
      { signal },
    );
    root
      .querySelector<HTMLButtonElement>('[data-artwork-view]')!
      .addEventListener(
        'click',
        (event) => {
          artworkView = !artworkView;
          canvas.hidden = artworkView;
          root.classList.toggle('is-3d', !artworkView);
          controls.hidden = artworkView;
          (event.currentTarget as HTMLButtonElement).textContent = artworkView
            ? 'Explore in 3D'
            : 'View concept artwork';
          request();
        },
        { signal },
      );
    canvas.addEventListener(
      'pointerdown',
      (event) => {
        drag = {
          x: event.clientX,
          y: event.clientY,
          id: event.pointerId,
          distance: 0,
        };
        canvas.setPointerCapture(event.pointerId);
      },
      { signal },
    );
    canvas.addEventListener(
      'pointermove',
      (event) => {
        if (!drag) return;
        drag.distance +=
          Math.abs(event.clientX - drag.x) + Math.abs(event.clientY - drag.y);
        yaw = THREE.MathUtils.clamp(
          yaw + (event.clientX - drag.x) * 0.004,
          -0.45,
          0.45,
        );
        pitch = THREE.MathUtils.clamp(
          pitch + (event.clientY - drag.y) * 0.002,
          -0.15,
          0.2,
        );
        drag.x = event.clientX;
        drag.y = event.clientY;
        request();
      },
      { signal },
    );
    const raycaster = new THREE.Raycaster();
    const release = (event: PointerEvent) => {
      if (drag && drag.distance < 6 && selected === 3 && !turnStart) {
        const rect = canvas.getBoundingClientRect();
        raycaster.setFromCamera(
          new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            (-(event.clientY - rect.top) / rect.height) * 2 + 1,
          ),
          camera,
        );
        for (const hit of raycaster.intersectObject(scenes[selected], true)) {
          let object: THREE.Object3D | null = hit.object;
          while (object && !object.userData.href) object = object.parent;
          if (object?.userData.href) {
            location.assign(object.userData.href);
            break;
          }
        }
      }
      drag = undefined;
    };
    canvas.addEventListener('pointerup', release, { signal });
    canvas.addEventListener(
      'pointercancel',
      () => {
        drag = undefined;
      },
      { signal },
    );
    canvas.addEventListener(
      'keydown',
      (event) => {
        if (
          ![
            'ArrowLeft',
            'ArrowRight',
            'ArrowUp',
            'ArrowDown',
            'Escape',
          ].includes(event.key)
        )
          return;
        event.preventDefault();
        if (event.key === 'Escape') {
          yaw = 0;
          pitch = 0;
        } else {
          yaw = THREE.MathUtils.clamp(
            yaw +
              (event.key === 'ArrowRight'
                ? 0.08
                : event.key === 'ArrowLeft'
                  ? -0.08
                  : 0),
            -0.45,
            0.45,
          );
          pitch = THREE.MathUtils.clamp(
            pitch +
              (event.key === 'ArrowDown'
                ? 0.05
                : event.key === 'ArrowUp'
                  ? -0.05
                  : 0),
            -0.15,
            0.2,
          );
        }
        request();
      },
      { signal },
    );
    canvas.addEventListener(
      'webglcontextlost',
      (event) => {
        event.preventDefault();
        lost = true;
        canvas.hidden = true;
        root.classList.remove('is-3d');
        controls.hidden = true;
        root.dataset.webgl = 'lost';
        root.querySelector<HTMLElement>('.book-view-toggle')!.hidden = true;
      },
      { signal },
    );
    canvas.addEventListener(
      'webglcontextrestored',
      () => {
        lost = false;
        canvas.hidden = artworkView;
        root.classList.toggle('is-3d', !artworkView);
        controls.hidden = artworkView;
        root.dataset.webgl = 'ready';
        root.querySelector<HTMLElement>('.book-view-toggle')!.hidden = false;
        request();
      },
      { signal },
    );
    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (!visible && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      request();
    });
    observer.observe(root);
    const size = new ResizeObserver(resize);
    size.observe(canvas);
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden && frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
        request();
      },
      { signal },
    );
    motion.addEventListener(
      'change',
      () => {
        playing = !motion.matches;
        if (motion.matches && turnStart) select(next, true);
        pause.textContent = playing ? 'Pause motion' : 'Play motion';
        pause.setAttribute('aria-pressed', String(!playing));
        request();
      },
      { signal },
    );
    window.addEventListener(
      'pagehide',
      (event) => {
        if (event.persisted) return;
        abort.abort();
        observer.disconnect();
        size.disconnect();
        cancelAnimationFrame(frame);
        disposeTree(scene);
        renderer.dispose();
      },
      { once: true },
    );
    pause.textContent = playing ? 'Pause motion' : 'Play motion';
    pause.setAttribute('aria-pressed', String(!playing));
    canvas.hidden = false;
    resize();
    await renderer.compileAsync(scene, camera);
    ready = true;
    controls.hidden = false;
    canvas.hidden = false;
    await select(
      Number.isInteger(history.state?.bookChapter) &&
        history.state.bookChapter >= 0 &&
        history.state.bookChapter < 6
        ? history.state.bookChapter
        : 0,
      true,
    );
    root.classList.add('is-3d');
    root.dataset.webgl = 'ready';
    root.querySelector<HTMLElement>('.book-view-toggle')!.hidden = false;
    resize();
  } catch (error) {
    disposeTree(scene);
    renderer.dispose();
    throw error;
  }
}
