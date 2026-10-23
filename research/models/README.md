# Paper-book asset progress

Status on 23 October 2026. These are asset studies with initial browser integration; none is a claim of final visual acceptance or production readiness.

| Chapter | Editable Blender study | Offline render | Draft GLB |
|---|---|---|---|
| Start | [Source](start/start.blend) | [Render](start/start-render.png) | [Draft](start/start-geometry.glb) |
| Services | [Source](services/services.blend) | [Render](services/services-render.png) | [Draft](services/services-geometry.glb) |
| Work | [Source](work/work.blend) | [Render](work/work-render.png) | [Draft](work/work-geometry.glb) |
| Writing | [Source](writing/writing.blend) | [Render](writing/writing-render.png) | [Draft](writing/writing-geometry.glb) |
| About | [Source](about/about.blend) | [Render](about/about-render.png) | [Draft](about/about-geometry.glb) |
| Contact | [Source](contact/contact.blend) | [Render](contact/contact-render.png) | [Draft](contact/contact-geometry.glb) |

All six chapters now have offline Blender studies. This completes the study inventory, not the accepted website or WebGL integration. Initial browser integration is complete. Further material baking, page-turn mechanisms and visual review remain required. The required interactive portrait is unchanged.

Each chapter folder records its limitations, image provenance and export checks. The sources are authored under `tool/assets/`. The shared helpers initialize a fresh background Blender scene; they are not app runtime dependencies.

Start additionally has an optimized, dynamically lit WebGL asset and isolated preview review. See [preparation](start/webgl/README.md) and [browser evidence](../verification/start-webgl/README.md). Start now appears on the homepage; the other five modeled spreads appear at the top of their chapter destinations. Final visual acceptance and per-chapter surface baking remain pending.
