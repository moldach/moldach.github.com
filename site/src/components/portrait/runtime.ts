import * as THREE from 'three';

// A photo relief, not a reconstruction of unseen head geometry.
export async function mountPortrait(root: HTMLElement) {
  let canvas = root.querySelector<HTMLCanvasElement>('[data-face]')!;
  const stage = root.querySelector<HTMLElement>('.portrait-stage')!;
  const status = root.querySelector<HTMLElement>('[data-face-status]')!;
  const hand = root.querySelector<HTMLElement>('.portrait-hand')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const image = new Image();
  image.src = root.dataset.texture!;
  await image.decode();
  let renderer: THREE.WebGLRenderer | undefined;
  let fallback: CanvasRenderingContext2D | null = null;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1.2, 1.2, 1.2, -1.2, 0.1, 10);
  camera.position.z = 4;
  const geometry = new THREE.PlaneGeometry(2, 2, 64, 64);
  const dynamicPositions = geometry.attributes.position;
  if (dynamicPositions instanceof THREE.BufferAttribute)
    dynamicPositions.setUsage(THREE.DynamicDrawUsage);
  const original = Float32Array.from(geometry.attributes.position.array);
  const texture = new THREE.Texture(image);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.75,
    side: THREE.DoubleSide,
  });
  scene.add(new THREE.Mesh(geometry, material));
  scene.add(new THREE.HemisphereLight('#fff2de', '#5672b5', 2.5));
  const light = new THREE.DirectionalLight('#fff8ee', 2);
  light.position.set(-2, 3, 5);
  scene.add(light);
  const regions: Record<string, [number, number]> = {
    nose: [0, -0.02],
    left: [-0.28, -0.08],
    right: [0.28, -0.08],
    forehead: [0, 0.48],
    chin: [0, -0.6],
  };
  let anchor = regions.nose;
  const pins: { anchor: number[]; pull: number[] }[] = [];
  function freeze() {
    if (Math.hypot(...pull) < 0.001) return;
    if (pins.length >= 20) {
      status.textContent = '20 points frozen. Reset the face to start again.';
      return;
    }
    pins.push({ anchor: [...anchor], pull: [...pull] });
    pull = [0, 0];
    velocity = [0, 0];
    dragging = held = false;
    stage.classList.remove('is-grabbing');
    status.textContent = `${pins.length} points frozen. Grab another region; Reset clears all points.`;
    request();
  }
  let pull = [0, 0],
    velocity = [0, 0];
  let dragging = false,
    held = false,
    active = true,
    frame = 0,
    last = 0;
  let pointer: number | undefined;
  const abort = new AbortController();
  const signal = abort.signal;
  const clamp = (n: number) => Math.max(-0.55, Math.min(0.55, n));
  root
    .querySelector('[data-face-freeze]')!
    .addEventListener('click', freeze, { signal });
  root.querySelector('dialog')!.addEventListener(
    'keydown',
    (event) => {
      if (
        event.key.toLowerCase() === 'f' &&
        !event.repeat &&
        !(event.target instanceof HTMLSelectElement)
      ) {
        event.preventDefault();
        freeze();
      }
    },
    { signal },
  );
  function fallbackMode() {
    renderer?.dispose();
    renderer = undefined;
    const focused = document.activeElement === canvas;
    const replacement = canvas.cloneNode() as HTMLCanvasElement;
    canvas.replaceWith(replacement);
    canvas = replacement;
    if (focused) canvas.focus();
    fallback = canvas.getContext('2d');
    root.dataset.faceRenderer = 'canvas';
    bindCanvas();
    resize();
    request();
  }
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    root.dataset.faceRenderer = 'webgl';
  } catch {
    fallbackMode();
  }
  function point(event: PointerEvent): [number, number] {
    const rect = canvas.getBoundingClientRect();
    return [
      ((event.clientX - rect.left) / rect.width - 0.5) * 2.4,
      (0.5 - (event.clientY - rect.top) / rect.height) * 2.4,
    ];
  }
  function warp(x: number, y: number): [number, number, number] {
    const distance = (x - anchor[0]) ** 2 + (y - anchor[1]) ** 2;
    const edge = Math.max(0, 1 - Math.max(Math.abs(x), Math.abs(y)) ** 6);
    const weight = Math.exp(-distance / 0.15) * edge;
    const relief =
      0.1 * Math.exp(-(x * x * 3 + y * y)) +
      0.07 * Math.exp(-(x * x + (y + 0.02) ** 2) / 0.08);
    let dx = pull[0] * weight,
      dy = pull[1] * weight;
    let depth = Math.hypot(...pull) * weight * 0.25;
    for (const pin of pins) {
      const w =
        Math.exp(
          -((x - pin.anchor[0]) ** 2 + (y - pin.anchor[1]) ** 2) / 0.15,
        ) * edge;
      dx += pin.pull[0] * w;
      dy += pin.pull[1] * w;
      depth += Math.hypot(...pin.pull) * w * 0.25;
    }
    return [x + clamp(dx), y + clamp(dy), relief + Math.min(depth, 0.35)];
  }
  function draw() {
    if (renderer) {
      const positions = geometry.attributes.position;
      for (let i = 0; i < positions.count; i++)
        positions.setXYZ(i, ...warp(original[i * 3], original[i * 3 + 1]));
      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      renderer.render(scene, camera);
    } else if (fallback) {
      // Affine textured triangles share the same displacement field as the 3D mesh.
      const ctx = fallback,
        size = canvas.width,
        cells = 24;
      ctx.clearRect(0, 0, size, size);
      const dest = (x: number, y: number) => {
        const w = warp(x * 2 - 1, 1 - y * 2);
        return [(w[0] / 2.4 + 0.5) * size, (0.5 - w[1] / 2.4) * size];
      };
      for (let y = 0; y < cells; y++)
        for (let x = 0; x < cells; x++) {
          const u = x / cells,
            v = y / cells,
            step = 1 / cells;
          const a = dest(u, v),
            b = dest(u + step, v),
            c = dest(u, v + step),
            d = dest(u + step, v + step);
          triangle([a, b, c], [u, v], false);
          triangle([d, c, b], [u + step, v + step], true);
        }
      function triangle(points: number[][], origin: number[], flip: boolean) {
        const [a, b, c] = points,
          unit = image.width / cells,
          sign = flip ? -1 : 1;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.lineTo(c[0], c[1]);
        ctx.closePath();
        ctx.clip();
        ctx.setTransform(
          (b[0] - a[0]) / (unit * sign),
          (b[1] - a[1]) / (unit * sign),
          (c[0] - a[0]) / (unit * sign),
          (c[1] - a[1]) / (unit * sign),
          a[0],
          a[1],
        );
        ctx.drawImage(
          image,
          -origin[0] * image.width,
          -origin[1] * image.height,
        );
        ctx.restore();
      }
    }
    root.dataset.facePull = Math.hypot(...pull).toFixed(3);
    root.dataset.facePins = String(pins.length);
  }
  function tick(time: number) {
    frame = 0;
    const dt = Math.min((time - (last || time - 16)) / 1000, 0.025);
    last = time;
    if (!dragging && !held) {
      for (let i = 0; i < 2; i++) {
        velocity[i] += (-100 * pull[i] - 10 * velocity[i]) * dt;
        pull[i] += velocity[i] * dt;
      }
      if (Math.hypot(...pull) < 0.001 && Math.hypot(...velocity) < 0.005) {
        pull = [0, 0];
        velocity = [0, 0];
      }
    }
    draw();
    if (!dragging && !held && Math.hypot(...pull) > 0) request();
  }
  function request() {
    if (active && !document.hidden && !frame)
      frame = requestAnimationFrame(tick);
  }
  function release() {
    dragging = held = false;
    pointer = undefined;
    stage.classList.remove('is-grabbing');
    if (reduced.matches) {
      pull = [0, 0];
      velocity = [0, 0];
    }
    request();
  }
  function bindCanvas() {
    canvas.addEventListener(
      'pointerdown',
      (event) => {
        canvas.focus({ preventScroll: true });
        const handRect = stage.getBoundingClientRect();
        hand.style.left = `${event.clientX - handRect.left}px`;
        hand.style.top = `${event.clientY - handRect.top}px`;
        anchor = point(event).map((n) =>
          Math.max(-0.85, Math.min(0.85, n)),
        ) as [number, number];
        pull = [0, 0];
        velocity = [0, 0];
        dragging = true;
        held = false;
        pointer = event.pointerId;
        canvas.setPointerCapture(event.pointerId);
        stage.classList.add('is-grabbing');
      },
      { signal },
    );
    canvas.addEventListener(
      'pointermove',
      (event) => {
        const rect = stage.getBoundingClientRect();
        hand.style.left = `${event.clientX - rect.left}px`;
        hand.style.top = `${event.clientY - rect.top}px`;
        if (!dragging || pointer !== event.pointerId) return;
        const p = point(event);
        pull = [clamp(p[0] - anchor[0]), clamp(p[1] - anchor[1])];
        request();
      },
      { signal },
    );
    canvas.addEventListener('pointerup', release, { signal });
    canvas.addEventListener('pointercancel', release, { signal });
    canvas.addEventListener('lostpointercapture', release, { signal });
    canvas.addEventListener(
      'keydown',
      (event) => {
        if (event.key === ' ') {
          event.preventDefault();
          release();
          return;
        }
        if (
          !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(
            event.key,
          )
        )
          return;
        event.preventDefault();
        held = true;
        dragging = false;
        anchor =
          regions[
            root.querySelector<HTMLSelectElement>('[data-face-region]')!.value
          ];
        pull = [
          clamp(
            pull[0] +
              (event.key === 'ArrowRight'
                ? 0.08
                : event.key === 'ArrowLeft'
                  ? -0.08
                  : 0),
          ),
          clamp(
            pull[1] +
              (event.key === 'ArrowUp'
                ? 0.08
                : event.key === 'ArrowDown'
                  ? -0.08
                  : 0),
          ),
        ];
        velocity = [0, 0];
        draw();
        status.textContent =
          'Face stretched. F freezes this point; Space releases the current pull; Reset clears everything.';
      },
      { signal },
    );
    canvas.addEventListener(
      'webglcontextlost',
      (event) => {
        event.preventDefault();
        fallbackMode();
      },
      { signal },
    );
  }
  function resize() {
    const size = Math.max(1, Math.round(stage.clientWidth));
    if (renderer) renderer.setSize(size, size, false);
    else canvas.width = canvas.height = Math.min(size * devicePixelRatio, 800);
    request();
  }
  if (renderer) bindCanvas();
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
        release();
      } else request();
    },
    { signal },
  );
  window.addEventListener(
    'pagehide',
    (event) => {
      if (event.persisted) return;
      abort.abort();
      observer.disconnect();
      renderer?.dispose();
      geometry.dispose();
      material.dispose();
      texture.dispose();
      cancelAnimationFrame(frame);
    },
    { once: true },
  );
  resize();
  return {
    reset() {
      pins.length = 0;
      pull = [0, 0];
      velocity = [0, 0];
      held = dragging = false;
      stage.classList.remove('is-grabbing');
      status.textContent = 'Portrait reset.';
      request();
    },
    stop() {
      active = false;
      stage.classList.remove('is-grabbing');
      pointer = undefined;
      cancelAnimationFrame(frame);
      frame = 0;
      pull = [0, 0];
      velocity = [0, 0];
      dragging = held = false;
    },
    start() {
      active = true;
      last = 0;
      resize();
    },
  };
}
