# Contact spread asset study — 23 October 2026

Target: `research/design/chapters/round-2/06-contact.png`, the agreed conversation-room concept. This is an editable Blender scene, offline Cycles render and draft GLB, separate from website integration.

Run from repository root: `blender --background --python tool/assets/build_contact.py`. Shared `paper_scene.py` helpers initialize a fresh background Blender scene.

Outputs: `contact.blend`, `contact-render.png`, `contact-geometry.glb`, `provenance.json` and `validation.json`. All geometry and materials are authored; no full concept image is projected onto the scene. Fonts stay external in the editable source and become geometry in the draft GLB.

The Contact study uses a lower camera angle so the chair forms and table pedestal remain visible; shared helper defaults for earlier studies are unchanged.

The spread contains:
- A continuous, thick semicircular cobalt arch with separate standing legs and scored paper seams.
- Two cream tub chairs with curved wraparound shells, seat cushions, blue pillows and small folded feet.
- A coral round table with tapered pedestal, an oval paper rug and folded stage.
- Pleated architectural screens, two speech-bubble panels and blue paper plants.
- A leaning invitation reading “Start a conversation →” and “Or send an email,” with paper supports and small abstract books.
- All six physical chapter tags, with Contact active.

Contact entry points retain `/contact/` metadata. The email label retains the existing site's `mailto:moldach686@gmail.com` destination, verified against `site/src/pages/contact.astro`. This is **not an implemented form, browser hotspot, chat service or delivered enquiry**. No message was sent and no invented phone number or address is shown in the scene.

The new asset does not change the website preview, contact form configuration or required face interaction. Procedural micro-bump and studio illumination are not baked for browser parity. Fine paper finish, binding/composition, final visual acceptance, material baking, browser integration and performance remain separate acceptance work. Structural GLB checks and a render do not establish those results.
