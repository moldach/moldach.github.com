async (page) => {
  const base = "http://127.0.0.1:4327/review/work-finish/",
    results = {},
    errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  const ready = (p) =>
    p.waitForFunction(
      () =>
        document.querySelector("[data-page-turn]")?.dataset.state === "settled",
      null,
      { timeout: 90000 },
    );
  const metrics = (p) =>
    p.locator("[data-metrics]").evaluate((e) => JSON.parse(e.textContent));
  await page.setViewportSize({ width: 1536, height: 1250 });
  await page.goto(base + "?capture");
  await ready(page);
  results.enhanced = await metrics(page);
  await page.screenshot({ path: "output/playwright/work-finish-enhanced.png" });
  for (const [name, position, target] of [
    ['basket', [-5,3.6,4], [-3.2,1.45,-.1]],
    ['device', [1,3.5,4], [-.15,2,-.3]],
    ['map', [6,5,3], [3.3,1,-.5]],
  ]) {
    await page.locator('[data-page-turn]').evaluate((e, detail) => e.dispatchEvent(new CustomEvent('review-camera', {detail})), {position,target,lens:65});
    await page.screenshot({path:`output/playwright/work-finish-close-${name}.png`});
  }
  await page.locator('[data-page-turn]').evaluate(e=>e.dispatchEvent(new CustomEvent('review-camera',{detail:{position:[.12,15,12],target:[0,.7,0],lens:57}})));
  results.links = await page
    .locator("[data-exhibit-hotspot]")
    .evaluateAll((a) =>
      a.map((e) => ({
        label: e.dataset.exhibitHotspot,
        href: e.getAttribute("href"),
        hidden: e.hidden,
      })),
    );
  if (!results.links.some((l) => l.href === "/work/#puttpulse" && !l.hidden))
    throw Error("PuttPulse hotspot missing");
  await page.locator('[data-chapter="1"]').click();
  await ready(page);
  results.forward = await metrics(page);
  await page.locator('[data-chapter="2"]').click();
  await ready(page);
  results.return = await metrics(page);
  // Deterministic intermediate poses share the actual runtime rig path.
  for (const progress of [0.15, 0.25, 0.5, 0.75]) {
    await page
      .locator("[data-page-turn]")
      .evaluate(
        (e, p) =>
          e.dispatchEvent(
            new CustomEvent("review-seek", {
              detail: { from: "work", to: "services", progress: p },
            }),
          ),
        progress,
      );
    await page.screenshot({
      path: `output/playwright/work-finish-fold-${progress}.png`,
    });
  }
  await page.goto(base + "?fallback");
  await ready(page);
  results.fallback = await metrics(page);
  if (results.fallback.textureFormat !== "conventional")
    throw Error("Fallback missing");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator('[data-chapter="3"]').click();
  await ready(page);
  results.reduced = await metrics(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const browser = page.context().browser(),
    mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
  const p = await mobile.newPage();
  await p.goto(base);
  await ready(p);
  results.compact = await metrics(p);
  if (results.compact.tier !== "compact") throw Error("Wrong mobile tier");
  await p.screenshot({ path: "output/playwright/work-finish-compact.png" });
  await p.locator('[data-chapter="1"]').tap();
  await ready(p);
  results.mobileTurn = await metrics(p);
  await mobile.close();
  const nojs = await browser.newContext({ javaScriptEnabled: false });
  const n = await nojs.newPage();
  await n.goto(base);
  results.noJS = {
    poster: await n.locator("[data-stage] img").isVisible(),
    links: await n.locator("[data-chapter]").count(),
  };
  await nojs.close();
  const nogl = await browser.newContext();
  await nogl.addInitScript(() => {
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
  const g = await nogl.newPage();
  await g.goto(base);
  await g.waitForFunction(
    () => document.querySelector("[data-page-turn]").dataset.state === "error",
  );
  results.noGL = {
    poster: await g.locator("[data-stage] img").isVisible(),
    links: await g.locator("[data-chapter]").count(),
  };
  await nogl.close();
  const fail = await browser.newContext();
  await fail.route("**/models/work-finish/v1/*work-*.glb", (r) => r.abort());
  const f = await fail.newPage();
  await f.goto(base);
  await f.waitForFunction(
    () => document.querySelector("[data-page-turn]").dataset.state === "error",
  );
  results.failedLoad = {
    poster: await f.locator("[data-stage] img").isVisible(),
    retry: await f.locator("[data-retry]").isVisible(),
  };
  await fail.unrouteAll();
  await f.locator("[data-retry]").click();
  await ready(f);
  results.retried = (await metrics(f)).state;
  await fail.close();
  await page.goto(base);
  await ready(page);
  await page.setViewportSize({ width: 600, height: 900 });
  results.resizeTier = (await metrics(page)).tier;
  if (results.resizeTier !== "enhanced") throw Error("Tier changed on resize");
  await page.locator('[data-chapter="0"]').focus();
  await page.keyboard.press("Enter");
  await ready(page);
  results.keyboard = await metrics(page);
  await page.evaluate(() =>
    window.dispatchEvent(new PageTransitionEvent("pagehide")),
  );
  results.disposal = await metrics(page);
  if (!results.disposal.resourcesDisposed)
    throw Error("Resources not disposed");
  results.errors = errors;
  if (errors.length) throw Error(errors.join("\n"));
  return results;
}
