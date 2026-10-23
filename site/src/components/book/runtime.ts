import * as THREE from 'three';
import { reliefGeometry, tagCenters } from './reference-depth';
import { openingModel } from './opening-model';

type Link = {
  label: string;
  href: string;
  area?: [number, number, number, number];
};
type Chapter = { label: string; href: string };
type Spread = {
  mesh: THREE.Object3D;
  texture: THREE.Texture;
};

// Baked artwork is sampled in its encoded colour space. No added lighting or
// tone mapping changes the approved illustration's palette.
function artworkMaterial(texture: THREE.Texture | null = null) {
  return new THREE.RawShaderMaterial({
    uniforms: { artwork: { value: texture } },
    vertexShader: `precision highp float;
      uniform mat4 projectionMatrix, modelViewMatrix;
      attribute vec3 position; attribute vec2 uv; varying vec2 imageUV;
      void main(){imageUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `precision highp float;
      uniform sampler2D artwork; varying vec2 imageUV;
      void main(){gl_FragColor=texture2D(artwork,imageUV);}`,
    side: THREE.DoubleSide,
  });
}

export async function mountBook(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas')!;
  const poster = root.querySelector<HTMLImageElement>('.book-artwork')!;
  const controls = root.querySelector<HTMLElement>('.book-controls')!;
  const status = root.querySelector<HTMLElement>('[data-book-status]')!;
  const panel = root.querySelector<HTMLElement>('[role=tabpanel]')!;
  const open = root.querySelector<HTMLAnchorElement>('[data-open-chapter]')!;
  const pause = root.querySelector<HTMLButtonElement>('[data-pause-book]')!;
  const view = root.querySelector<HTMLButtonElement>('[data-artwork-view]')!;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const sources = JSON.parse(root.dataset.chapterArtwork!) as string[];
  const chapters = JSON.parse(root.dataset.chapters!) as Chapter[];
  const writing = JSON.parse(root.dataset.exhibitLinks!) as Link[];
  const links: Link[][] = [
    [
      {
        label: 'Fast style transfer',
        href: '/writing/faststyletransfer/',
        area: [0.48, 0.03, 0.48, 0.68],
      },
    ],
    [
      {
        label: 'Find the opportunity',
        href: '/services/ai-opportunity-assessment/',
        area: [0.12, 0.23, 0.25, 0.4],
      },
      {
        label: 'Build a focused solution',
        href: '/services/ai-workflow-automation/',
        area: [0.39, 0.26, 0.25, 0.37],
      },
      {
        label: 'Help the team adopt it',
        href: '/services/ai-training-adoption/',
        area: [0.67, 0.26, 0.25, 0.37],
      },
    ],
    [
      {
        label: 'PuttPulse',
        href: '/work/#puttpulse',
        area: [0.05, 0.26, 0.32, 0.4],
      },
      {
        label: 'Shiny-filteRs',
        href: '/work/#shiny-filters',
        area: [0.37, 0.08, 0.23, 0.56],
      },
      {
        label: 'Hinuhinu',
        href: '/work/#hinuhinu',
        area: [0.6, 0.17, 0.36, 0.5],
      },
    ],
    writing.map((link, i) => ({
      ...link,
      area: (
        [
          [0.4, 0.08, 0.24, 0.43],
          [0.63, 0.17, 0.17, 0.41],
          [0.79, 0.25, 0.18, 0.4],
        ] as [number, number, number, number][]
      )[i],
    })),
    [
      {
        label: 'About Matthew',
        href: '/about/',
        area: [0.51, 0.09, 0.24, 0.35],
      },
      {
        label: 'Experience / CV',
        href: '/experience/',
        area: [0.76, 0.17, 0.17, 0.31],
      },
    ],
    [
      {
        label: 'Start a conversation',
        href: '/contact/',
        area: [0.74, 0.31, 0.19, 0.26],
      },
    ],
  ];
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xa5a1a0, 1.3));
  const sun = new THREE.DirectionalLight(0xfff7ed, 2.1);
  sun.position.set(-4, 7, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(512, 512);
  sun.shadow.radius = 4;
  sun.shadow.camera.left = -7;
  sun.shadow.camera.right = 7;
  sun.shadow.camera.top = 7;
  sun.shadow.camera.bottom = -7;
  sun.shadow.normalBias = 0.025;
  scene.add(sun);
  const camera = new THREE.OrthographicCamera(-5, 5, 10 / 3, -10 / 3, 0.1, 40);
  camera.position.z = 12;
  const modelCamera = new THREE.PerspectiveCamera(29, 1.5, 0.1, 40);
  modelCamera.position.z = 14.5;
  const activeCamera = () => (selected === 0 ? modelCamera : camera);
  const book = new THREE.Group();
  scene.add(book);
  const cache = new Map<number, Spread>();
  const pending = new Map<number, Promise<Spread>>();
  const loader = new THREE.TextureLoader();
  const abort = new AbortController(),
    signal = abort.signal;
  let selected = 0,
    version = 0,
    frame = 0,
    visible = true,
    lost = false,
    artwork = false,
    ready = false;
  let playing = !motion.matches,
    yaw = 0,
    pitch = 0;
  let drag: { id: number; x: number; y: number; distance: number } | undefined;
  let turn: { start: number; from: Spread; to: Spread } | undefined;
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role=tab]')];
  const sheetGeometry = new THREE.PlaneGeometry(4.3, 4.15, 48, 32);
  const sheetUV = sheetGeometry.attributes.uv;
  for (let i = 0; i < sheetUV.count; i++)
    sheetUV.setXY(
      i,
      0.5 + sheetUV.getX(i) * 0.43,
      0.24 + sheetUV.getY(i) * 0.62,
    );
  const sheet = new THREE.Mesh(sheetGeometry, artworkMaterial());
  const hinge = new THREE.Group();
  hinge.position.set(0, 0.32, 0.1);
  sheet.position.x = 2.15;
  hinge.add(sheet);
  book.add(hinge);
  hinge.visible = false;
  async function load(index: number) {
    if (cache.has(index)) return cache.get(index)!;
    let task = pending.get(index);
    if (!task) {
      task = (async () => {
        const texture = await loader.loadAsync(sources[index]);
        texture.colorSpace = THREE.NoColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        const mesh =
          index === 0
            ? await openingModel(sources[0])
            : new THREE.Mesh(reliefGeometry(index), artworkMaterial(texture));
        mesh.visible = false;
        book.add(mesh);
        const result = { mesh, texture };
        cache.set(index, result);
        return result;
      })();
      pending.set(index, task);
    }
    try {
      return await task;
    } finally {
      pending.delete(index);
    }
  }
  function render(time = performance.now()) {
    frame = 0;
    if (!ready || lost || artwork || !visible || document.hidden) return;
    if (turn) {
      const t = Math.min(1, (time - turn.start) / 650),
        ease = t * t * (3 - 2 * t);
      hinge.rotation.y = -Math.PI * ease;
      hinge.visible = t > 0 && t < 1;
      if (t >= 0.5) {
        turn.from.mesh.visible = false;
        turn.to.mesh.visible = true;
      }
      if (t === 1) {
        turn = undefined;
        hinge.visible = false;
        panel.setAttribute('aria-busy', 'false');
      }
    }
    book.rotation.set(pitch, yaw, 0);
    renderer.render(scene, activeCamera());
    if (selected === 0) {
      const point = new THREE.Vector3();
      cache.get(0)?.mesh.traverse((object) => {
        const index = object.userData.chapterIndex;
        if (Number.isInteger(index)) {
          object.getWorldPosition(point);
          point.project(modelCamera);
          tabs[index].style.left = `${(point.x + 1) * 50}%`;
          tabs[index].style.top = `${(1 - point.y) * 50}%`;
        }
      });
    }
    if (turn) request();
  }
  function request() {
    if (ready && !frame && !lost && !artwork && visible && !document.hidden)
      frame = requestAnimationFrame(render);
  }
  function finishTurn() {
    if (!turn) return;
    turn.from.mesh.visible = false;
    turn.to.mesh.visible = true;
    turn = undefined;
    hinge.visible = false;
    panel.setAttribute('aria-busy', 'false');
  }
  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    const aspect = width / height;
    const w = aspect >= 1.5 ? (20 / 3) * aspect : 10,
      h = aspect >= 1.5 ? 20 / 3 : 10 / aspect;
    camera.left = -w / 2;
    camera.right = w / 2;
    camera.top = h / 2;
    camera.bottom = -h / 2;
    camera.updateProjectionMatrix();
    modelCamera.aspect = aspect;
    modelCamera.updateProjectionMatrix();
    request();
  }
  async function select(index: number, instant = false) {
    const intent = ++version;
    panel.setAttribute('aria-busy', 'true');
    status.textContent = `Opening ${chapters[index].label}…`;
    let next: Spread;
    try {
      next = await load(index);
    } catch {
      if (intent === version) {
        panel.setAttribute('aria-busy', 'false');
        status.textContent =
          'Artwork could not load. Use the main navigation to continue.';
      }
      return;
    }
    if (intent !== version) return;
    finishTurn();
    const previous = cache.get(selected);
    selected = index;
    yaw = 0;
    pitch = 0;
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      tab.style.left = `${tagCenters[index][i] * 100}%`;
      tab.style.top = `${index === 4 ? 80 : 79}%`;
    });
    root.querySelectorAll<HTMLElement>('.paper-tabs a').forEach((link, i) => {
      link.style.left = `${tagCenters[index][i] * 100}%`;
      link.style.top = `${index === 4 ? 80 : 79}%`;
    });
    open.href = chapters[index].href;
    open.textContent = `Open ${chapters[index].label} ↗`;
    panel.setAttribute('aria-labelledby', `book-tab-${index}`);
    root.dataset.chapter = chapters[index].label;
    history.replaceState({ ...history.state, bookChapter: index }, '');
    poster.removeAttribute('srcset');
    poster.src = sources[index];
    poster.alt = `${chapters[index].label} chapter — approved paper-book artwork`;
    const list = root.querySelector<HTMLElement>('[data-exhibit-list]')!;
    list.replaceChildren();
    links[index].forEach((link) => {
      const li = document.createElement('li'),
        a = document.createElement('a');
      a.href = link.href;
      a.textContent = `${link.label} ↗`;
      li.append(a);
      list.append(li);
    });
    list.hidden = false;
    status.textContent =
      index === 0
        ? 'Opening spread · modeled objects. Drag to explore; Escape resets the view.'
        : `${chapters[index].label} · concept artwork relief. Escape resets the view.`;
    if (
      previous &&
      selected !== 0 &&
      previous.mesh instanceof THREE.Mesh &&
      previous !== next &&
      playing &&
      !motion.matches &&
      !instant &&
      !artwork &&
      !lost
    ) {
      sheet.material.uniforms.artwork.value = previous.texture;
      turn = { start: performance.now(), from: previous, to: next };
    } else {
      if (previous) previous.mesh.visible = false;
      next.mesh.visible = true;
      panel.setAttribute('aria-busy', 'false');
    }
    root.dataset.bookGeometry =
      index === 0 ? 'modeled-opening' : 'textured-relief';
    let vertices = 0,
      objects = 0;
    next.mesh.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        vertices += object.geometry.attributes.position.count;
        objects++;
      }
    });
    root.dataset.vertexCount = String(vertices);
    root.dataset.objectCount = String(objects);
    root.dataset.reliefDepth =
      index === 0
        ? ''
        : String((next.mesh as THREE.Mesh).geometry.boundingBox!.max.z);
    canvas.setAttribute(
      'aria-label',
      index === 0
        ? 'Modeled paper pop-up book. Drag or use arrow keys to inspect the terminal, photographs and film ribbons. Escape resets the view.'
        : 'Concept artwork relief. Drag gently to inspect; Escape resets the view.',
    );
    request();
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener(
      'click',
      (event) => {
        void select(i, event.detail === 0);
      },
      { signal },
    );
    tab.addEventListener(
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
        tabs[index].focus();
        void select(index, true);
      },
      { signal },
    );
  });
  function updatePause() {
    pause.textContent = motion.matches
      ? 'Reduced motion'
      : playing
        ? 'Pause page turns'
        : 'Animate page turns';
    pause.disabled = motion.matches;
    pause.setAttribute('aria-pressed', String(!playing));
  }
  pause.addEventListener(
    'click',
    () => {
      playing = !playing;
      finishTurn();
      updatePause();
      request();
    },
    { signal },
  );
  view.addEventListener(
    'click',
    () => {
      finishTurn();
      artwork = !artwork;
      canvas.hidden = artwork;
      controls.hidden = artwork;
      root.classList.toggle('is-3d', !artwork);
      view.textContent = artwork ? 'Inspect in 3D' : 'View artwork';
      request();
    },
    { signal },
  );
  canvas.addEventListener(
    'pointerdown',
    (event) => {
      drag = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        distance: 0,
      };
      canvas.setPointerCapture(event.pointerId);
    },
    { signal },
  );
  canvas.addEventListener(
    'pointermove',
    (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      const dx = event.clientX - drag.x,
        dy = event.clientY - drag.y;
      drag.distance += Math.abs(dx) + Math.abs(dy);
      yaw = THREE.MathUtils.clamp(
        yaw + dx * 0.003,
        selected === 0 ? -0.45 : -0.11,
        selected === 0 ? 0.45 : 0.11,
      );
      pitch = THREE.MathUtils.clamp(
        pitch + dy * 0.002,
        selected === 0 ? -0.25 : -0.075,
        selected === 0 ? 0.25 : 0.075,
      );
      drag.x = event.clientX;
      drag.y = event.clientY;
      request();
    },
    { signal },
  );
  const ray = new THREE.Raycaster();
  canvas.addEventListener(
    'pointerup',
    (event) => {
      if (drag && drag.distance < 5 && !turn) {
        const r = canvas.getBoundingClientRect();
        ray.setFromCamera(
          new THREE.Vector2(
            ((event.clientX - r.left) / r.width) * 2 - 1,
            (-(event.clientY - r.top) / r.height) * 2 + 1,
          ),
          activeCamera(),
        );
        const hit = ray.intersectObject(cache.get(selected)!.mesh, true)[0];
        if (selected === 0 && hit) {
          let object: THREE.Object3D | null = hit.object;
          while (object && !object.userData.href) object = object.parent;
          if (object?.userData.href) location.assign(object.userData.href);
        }
        if (selected !== 0 && hit?.uv) {
          const x = hit.uv.x,
            y = 1 - hit.uv.y;
          const link = links[selected].find((link) => {
            const a = link.area;
            return (
              a &&
              x >= a[0] &&
              x <= a[0] + a[2] &&
              y >= a[1] &&
              y <= a[1] + a[3]
            );
          });
          if (link) location.assign(link.href);
        }
      }
      drag = undefined;
    },
    { signal },
  );
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
        !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Escape'].includes(
          event.key,
        )
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
              ? 0.025
              : event.key === 'ArrowLeft'
                ? -0.025
                : 0),
          selected === 0 ? -0.45 : -0.11,
          selected === 0 ? 0.45 : 0.11,
        );
        pitch = THREE.MathUtils.clamp(
          pitch +
            (event.key === 'ArrowDown'
              ? 0.02
              : event.key === 'ArrowUp'
                ? -0.02
                : 0),
          selected === 0 ? -0.25 : -0.075,
          selected === 0 ? 0.25 : 0.075,
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
      finishTurn();
      canvas.hidden = true;
      controls.hidden = true;
      root.classList.remove('is-3d');
      root.dataset.webgl = 'lost';
      status.textContent =
        'Artwork view. Use the printed tags or exhibit links to continue.';
    },
    { signal },
  );
  canvas.addEventListener(
    'webglcontextrestored',
    () => {
      lost = false;
      canvas.hidden = artwork;
      controls.hidden = artwork;
      root.classList.toggle('is-3d', !artwork);
      root.dataset.webgl = 'ready';
      status.textContent = `${chapters[selected].label}. Drag gently to inspect depth; Escape resets the view.`;
      request();
    },
    { signal },
  );
  motion.addEventListener(
    'change',
    () => {
      playing = !motion.matches;
      finishTurn();
      updatePause();
      request();
    },
    { signal },
  );
  const intersection = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (!visible) {
      finishTurn();
      cancelAnimationFrame(frame);
      frame = 0;
    }
    request();
  });
  intersection.observe(root);
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) {
        finishTurn();
        cancelAnimationFrame(frame);
        frame = 0;
      }
      request();
    },
    { signal },
  );
  window.addEventListener('pageshow', request, { signal });
  function dispose() {
    abort.abort();
    observer.disconnect();
    intersection.disconnect();
    cancelAnimationFrame(frame);
    cache.forEach((spread) => {
      if (spread.mesh.userData.dispose) spread.mesh.userData.dispose();
      else if (spread.mesh instanceof THREE.Mesh) {
        spread.mesh.geometry.dispose();
        spread.mesh.material.dispose();
      }
      spread.texture.dispose();
    });
    sheetGeometry.dispose();
    sheet.material.dispose();
    renderer.dispose();
  }
  window.addEventListener(
    'pagehide',
    (event) => {
      if (!event.persisted) dispose();
    },
    { once: true },
  );
  try {
    const initial =
      Number.isInteger(history.state?.bookChapter) &&
      history.state.bookChapter >= 0 &&
      history.state.bookChapter < 6
        ? history.state.bookChapter
        : 0;
    await load(initial);
    selected = initial;
    cache.get(initial)!.mesh.visible = true;
    canvas.hidden = false;
    resize();
    await renderer.compileAsync(scene, activeCamera());
    ready = true;
    await select(initial, true);
    root.classList.add('is-3d');
    root.dataset.webgl = 'ready';
    controls.hidden = false;
    root.querySelector<HTMLElement>('.book-view-toggle')!.hidden = false;
    updatePause();
    resize();
  } catch (error) {
    dispose();
    throw error;
  }
}
