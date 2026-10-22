async (page) => {
  const browser = page.context().browser(),
    result = {};
  const assert = (ok, message) => {
    if (!ok) throw Error(message);
  };
  const blocked = await browser.newContext({
    viewport: { width: 1100, height: 850 },
  });
  await blocked.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (
        type === "webgl" ||
        type === "webgl2" ||
        type === "experimental-webgl"
      )
        return null;
      return original.call(this, type, ...args);
    };
  });
  const b = await blocked.newPage();
  await b.goto("http://127.0.0.1:4321/");
  await b.waitForFunction(
    () => document.querySelector("[data-book]").dataset.webgl === "unavailable",
  );
  assert(
    (await b.locator(".paper-tabs a").count()) === 6,
    "HTML chapters survive WebGL failure",
  );
  result.bookFallback = true;
  await b.locator("[data-portrait-open]").click();
  await b.waitForFunction(
    () =>
      document.querySelector("[data-portrait]").dataset.faceRenderer ===
      "canvas",
  );
  const fc = b.locator("[data-face]");
  await b.waitForFunction(
    () =>
      document.querySelector("[data-portrait]").dataset.facePull === "0.000",
  );
  const before = await fc.screenshot();
  const r = await fc.boundingBox();
  await b.mouse.move(r.x + r.width * 0.5, r.y + r.height * 0.5);
  await b.mouse.down();
  await b.mouse.move(r.x + r.width * 0.7, r.y + r.height * 0.4, { steps: 8 });
  await b.waitForTimeout(100);
  const after = await fc.screenshot();
  assert(!before.equals(after), "Canvas fallback visibly deforms");
  result.canvasDeformation = true;
  await b.screenshot({ path: "output/playwright/portrait-fallback.png" });
  await b.mouse.up();
  await b.waitForFunction(
    () =>
      Number(document.querySelector("[data-portrait]").dataset.facePull) <
      0.002,
  );
  result.canvasSpring = true;
  await blocked.close();
  const reduced = await browser.newContext({
    reducedMotion: "reduce",
    viewport: { width: 1000, height: 800 },
  });
  const m = await reduced.newPage();
  await m.goto("http://127.0.0.1:4321/");
  await m.waitForFunction(
    () => document.querySelector("[data-book]").dataset.webgl === "ready",
  );
  assert(
    (await m.locator("[data-pause-book]").getAttribute("aria-pressed")) ===
      "true",
    "reduced motion starts paused",
  );
  assert(
    (await m
      .locator("[data-pointer-surface]")
      .evaluate((el) => getComputedStyle(el).display)) === "none",
    "reduced oil disabled",
  );
  await m.locator("[data-portrait-open]").click();
  await m.waitForFunction(
    () => document.querySelector("[data-portrait]").dataset.faceRenderer,
  );
  await m.locator("[data-face]").focus();
  await m.keyboard.press("ArrowLeft");
  await m.keyboard.press("Space");
  await m.waitForFunction(
    () =>
      document.querySelector("[data-portrait]").dataset.facePull === "0.000",
  );
  result.reducedMotion = true;
  await reduced.close();
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const t = await mobile.newPage();
  await t.goto("http://127.0.0.1:4321/writing/");
  assert(
    (await t.locator("[data-visual-card]").count()) === 7,
    "mobile archive",
  );
  assert(
    await t.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    "no horizontal overflow",
  );
  await t.screenshot({ path: "output/playwright/archive-mobile.png" });
  await t.locator("[data-portrait-open]").tap();
  await t.waitForFunction(
    () => document.querySelector("[data-portrait]").dataset.faceRenderer,
  );
  await t.locator("[data-face]").scrollIntoViewIfNeeded();
  const tr = await t.locator("[data-face]").boundingBox(),
    cdp = await mobile.newCDPSession(t);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: tr.x + tr.width * 0.5, y: tr.y + tr.height * 0.5 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: tr.x + tr.width * 0.7, y: tr.y + tr.height * 0.4 }],
  });
  await t.waitForTimeout(100);
  assert(
    Number(await t.locator("[data-portrait]").getAttribute("data-face-pull")) >
      0.2,
    "touch deforms",
  );
  await t.screenshot({ path: "output/playwright/portrait-touch.png" });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await t.waitForFunction(
    () =>
      Number(document.querySelector("[data-portrait]").dataset.facePull) <
      0.002,
  );
  result.touchEmulation = true;
  await t.getByRole("button", { name: "Close portrait" }).tap();
  await t.goto("http://127.0.0.1:4321/");
  await t.waitForFunction(
    () => document.querySelector("[data-book]").dataset.webgl === "ready",
  );
  await t.getByRole("tab", { name: "Work", exact: true }).tap();
  await t.waitForTimeout(1000);
  await t.screenshot({ path: "output/playwright/book-mobile.png" });
  assert(
    await t.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    "mobile book overflow",
  );
  await mobile.close();
  const nojs = await browser.newContext({ javaScriptEnabled: false });
  const n = await nojs.newPage();
  await n.goto("http://127.0.0.1:4321/writing/");
  assert(
    (await n.locator("[data-visual-card]").count()) === 7,
    "no-JS archive",
  );
  assert(
    (await n.locator("[data-visual-card] a").count()) === 0,
    "cards are real anchor roots",
  );
  result.noJSArchive = true;
  await nojs.close();
  return result;
};
