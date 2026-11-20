async (page) => {
  const browser = page.context().browser(),
    result = {},
    check = (ok, msg) => {
      if (!ok) throw Error(msg);
    };
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const m = await mobile.newPage();
  await m.goto("http://127.0.0.1:4321/");
  await m.waitForFunction(
    () => document.querySelector("[data-book]").dataset.webgl === "ready",
  );
  for (const label of [
    "Services",
    "Work",
    "Writing",
    "About",
    "Contact",
    "Start",
  ]) {
    await m.getByRole("tab", { name: label, exact: true }).tap();
    await m.waitForFunction(
      (label) =>
        document.querySelector("[data-book]").dataset.chapter === label,
      label,
    );
    await m.waitForFunction(
      () =>
        document.querySelector("[role=tabpanel]").getAttribute("aria-busy") ===
        "false",
    );
  }
  await m
    .locator(".book-stage")
    .screenshot({ path: "output/playwright/reference-mobile.png" });
  check(
    await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    "mobile overflow",
  );
  result.touchTags = true;
  await mobile.close();
  const reduced = await browser.newContext({ reducedMotion: "reduce" });
  const r = await reduced.newPage();
  await r.goto("http://127.0.0.1:4321/");
  await r.waitForFunction(
    () => document.querySelector("[data-book]").dataset.webgl === "ready",
  );
  check(
    await r.locator("[data-pause-book]").isDisabled(),
    "reduced turns disabled",
  );
  await r.getByRole("tab", { name: "Work", exact: true }).click();
  await r.waitForFunction(
    () => document.querySelector("[data-book]").dataset.chapter === "Work",
  );
  check(
    (await r.locator("[role=tabpanel]").getAttribute("aria-busy")) === "false",
    "reduced switches immediately",
  );
  result.reducedMotion = true;
  await reduced.close();
  const fallback = await browser.newContext();
  await fallback.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === "webgl" || type === "webgl2") return null;
      return get.call(this, type, ...args);
    };
  });
  const f = await fallback.newPage();
  await f.goto("http://127.0.0.1:4321/");
  await f.waitForFunction(
    () => document.querySelector("[data-book]").dataset.webgl === "unavailable",
  );
  check((await f.locator(".paper-tabs a").count()) === 6, "fallback links");
  await f
    .locator(".book-stage")
    .screenshot({ path: "output/playwright/reference-fallback.png" });
  result.webglFallback = true;
  await fallback.close();
  const nojs = await browser.newContext({ javaScriptEnabled: false });
  const n = await nojs.newPage();
  await n.goto("http://127.0.0.1:4321/");
  check((await n.locator(".paper-tabs a").count()) === 6, "noJS chapter links");
  result.noJS = true;
  await nojs.close();
  await page.goto("http://127.0.0.1:4321/writing/");
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(20, 20);
  await page.mouse.move(30, 25);
  await page.waitForTimeout(700);
  await page.screenshot({ path: "output/playwright/oil-baseline.png" });
  await page.mouse.move(600, 400, { steps: 24 });
  await page.screenshot({ path: "output/playwright/oil-active.png" });
  await page.waitForTimeout(650);
  await page.screenshot({ path: "output/playwright/oil-idle.png" });
  result.oilIdleAfter650ms = true;
  return result;
};
