# Paper-book asset progress

Status on 23 October 2026. These are asset studies; none is a claim of final visual acceptance, browser integration, or production readiness.

| Chapter | Editable Blender study | Offline render | Draft GLB |
|---|---|---|---|
| Start | [Source](start/start.blend) | [Render](start/start-render.png) | [Draft](start/start-geometry.glb) |
| Services | [Source](services/services.blend) | [Render](services/services-render.png) | [Draft](services/services-geometry.glb) |
| Work | [Source](work/work.blend) | [Render](work/work-render.png) | [Draft](work/work-geometry.glb) |
| Writing | [Source](writing/writing.blend) | [Render](writing/writing-render.png) | [Draft](writing/writing-geometry.glb) |
| About | [Source](about/about.blend) | [Render](about/about-render.png) | [Draft](about/about-geometry.glb) |
| Contact | [Source](contact/contact.blend) | [Render](contact/contact-render.png) | [Draft](contact/contact-geometry.glb) |

All six chapters now have offline Blender studies. This completes the study inventory, not the accepted website or WebGL integration. Browser integration, material baking, page-turn mechanisms and visual review are still required. The existing site preview and its required interactive portrait are unchanged by these studies.

Each chapter folder records its limitations, image provenance and export checks. The sources are authored under `tool/assets/`. The shared helpers initialize a fresh background Blender scene; they are not app runtime dependencies.
