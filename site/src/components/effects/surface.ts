// Original thin-film interference field: no reference-site assets or code.
export function mountSurface(canvas: HTMLCanvasElement) {
  const allowed = matchMedia(
    '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
  );
  if (!allowed.matches) return;
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    powerPreference: 'low-power',
    premultipliedAlpha: false,
  });
  if (!gl) {
    canvas.remove();
    return;
  }
  const vertex = `attribute vec2 position; void main(){gl_Position=vec4(position,0.,1.);}`;
  const fragment = `precision mediump float;
    uniform vec2 resolution; uniform vec3 trail[20]; uniform float time;
    void main(){
      vec2 uv=gl_FragCoord.xy/resolution; vec2 p=uv*vec2(resolution.x/resolution.y,1.);
      float field=0.;
      for(int i=0;i<19;i++){
        vec2 a=trail[i].xy*vec2(resolution.x/resolution.y,1.);
        vec2 b=trail[i+1].xy*vec2(resolution.x/resolution.y,1.);
        vec2 direction=b-a;
        float along=clamp(dot(p-a,direction)/max(dot(direction,direction),.000001),0.,1.);
        vec2 delta=p-(a+direction*along);
        float strength=mix(trail[i].z,trail[i+1].z,along);
        field=max(field,exp(-dot(delta,delta)*1600.)*strength);
      }
      float ripple=sin(p.x*19.+sin(p.y*17.+time*.5)*2.)*.12;
      float thickness=field*12.+ripple;
      vec3 color=.78+.22*cos(6.28318*(vec3(.08,.4,.7)+thickness*.19));
      float edge=smoothstep(.08,.16,field)*(1.-smoothstep(.32,.58,field));
      gl_FragColor=vec4(color,edge*.055);
    }`;
  const program = gl.createProgram()!;
  const shaders = [vertex, fragment].map((source, i) => {
    const shader = gl.createShader(i ? gl.FRAGMENT_SHADER : gl.VERTEX_SHADER)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
    return shader;
  });
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    shaders.forEach((s) => gl.deleteShader(s));
    canvas.remove();
    return;
  }
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const uResolution = gl.getUniformLocation(program, 'resolution'),
    uTrail = gl.getUniformLocation(program, 'trail[0]'),
    uTime = gl.getUniformLocation(program, 'time');
  const trail = new Float32Array(60);
  let frame = 0,
    lastMove = 0,
    pointer = [-5, -5],
    lastFrame = 0;
  const abort = new AbortController(),
    signal = abort.signal;
  function resize() {
    canvas.width = Math.round(innerWidth * 0.65);
    canvas.height = Math.round(innerHeight * 0.65);
    gl!.viewport(0, 0, canvas.width, canvas.height);
    gl!.uniform2f(uResolution, canvas.width, canvas.height);
  }
  function draw(time: number) {
    frame = 0;
    if (!allowed.matches || document.hidden) {
      canvas.style.opacity = '0';
      return;
    }
    if (time - lastFrame < 30) {
      frame = requestAnimationFrame(draw);
      return;
    }
    lastFrame = time;
    for (let i = 19; i > 0; i--) {
      trail[i * 3] += (trail[(i - 1) * 3] - trail[i * 3]) * 0.42;
      trail[i * 3 + 1] += (trail[(i - 1) * 3 + 1] - trail[i * 3 + 1]) * 0.42;
      trail[i * 3 + 2] = trail[(i - 1) * 3 + 2] * 0.65;
    }
    trail[0] = pointer[0];
    trail[1] = pointer[1];
    trail[2] = Math.max(0, 1 - (time - lastMove) / 140);
    gl!.uniform3fv(uTrail, trail);
    gl!.uniform1f(uTime, time / 1000);
    gl!.drawArrays(gl!.TRIANGLES, 0, 6);
    canvas.style.opacity = '1';
    if (time - lastMove < 500) frame = requestAnimationFrame(draw);
    else {
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
    }
  }
  window.addEventListener(
    'pointermove',
    (event) => {
      if (!allowed.matches || event.pointerType === 'touch') return;
      pointer = [event.clientX / innerWidth, 1 - event.clientY / innerHeight];
      const now = performance.now();
      if (!lastMove || now - lastMove > 500)
        for (let i = 0; i < 20; i++) {
          trail[i * 3] = pointer[0];
          trail[i * 3 + 1] = pointer[1];
          trail[i * 3 + 2] = 0;
        }
      lastMove = now;
      if (!frame) frame = requestAnimationFrame(draw);
    },
    { signal, passive: true },
  );
  const cards = document.querySelectorAll<HTMLElement>('[data-visual-card]');
  cards.forEach((card) => {
    const video = card.querySelector<HTMLVideoElement>('[data-card-video]');
    if (video) {
      card.addEventListener(
        'pointerenter',
        () => {
          if (!allowed.matches) return;
          video.muted = true;
          video
            .play()
            .then(() => {
              if (card.matches(':hover') && allowed.matches)
                card.classList.add('is-previewing');
              else video.pause();
            })
            .catch(() => {});
        },
        { signal },
      );
      const stopPreview = () => {
        video.pause();
        video.currentTime = 0;
        card.classList.remove('is-previewing');
      };
      card.addEventListener('pointerleave', stopPreview, { signal });
      video.addEventListener(
        'timeupdate',
        () => {
          if (video.currentTime >= 4) stopPreview();
        },
        { signal },
      );
      document.addEventListener('visibilitychange', stopPreview, { signal });
      allowed.addEventListener('change', stopPreview, { signal });
    }

    card.addEventListener(
      'pointermove',
      (event) => {
        if (!allowed.matches) return;
        const rect = card.getBoundingClientRect(),
          x = (event.clientX - rect.left) / rect.width,
          y = (event.clientY - rect.top) / rect.height;
        card.style.setProperty('--px', `${x * 100}%`);
        card.style.setProperty('--py', `${y * 100}%`);
        card.style.setProperty('--rx', `${(0.5 - y) * 4}deg`);
        card.style.setProperty('--ry', `${(x - 0.5) * 5}deg`);
      },
      { signal, passive: true },
    );
    card.addEventListener(
      'pointerleave',
      () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      },
      { signal },
    );
  });
  window.addEventListener('resize', resize, { signal, passive: true });
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    canvas.style.opacity = '0';
  }
  document.addEventListener('visibilitychange', stop, { signal });
  allowed.addEventListener(
    'change',
    () => {
      stop();
      cards.forEach((card) => card.removeAttribute('style'));
    },
    { signal },
  );
  canvas.addEventListener(
    'webglcontextlost',
    (event) => {
      event.preventDefault();
      stop();
      abort.abort();
    },
    { signal },
  );
  window.addEventListener(
    'pagehide',
    (event) => {
      if (event.persisted) {
        stop();
        return;
      }
      stop();
      abort.abort();
      gl!.deleteBuffer(buffer);
      gl!.deleteProgram(program);
      shaders.forEach((s) => gl!.deleteShader(s));
    },
    { once: true },
  );
  resize();
}
