async (page) => {
  const result = {},
    assert = (ok, msg) => {
      if (!ok) throw Error(msg);
    };
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:4321/writing/");
  await page.locator("[data-visual-card]").first().scrollIntoViewIfNeeded();
  const first = page.locator("[data-visual-card]").first();
  const box = await first.boundingBox();
  await page.mouse.move(box.x + box.width * 0.8, box.y + 80, { steps: 10 });
  await page.waitForTimeout(120);
  result.hoverTransform = await first
    .locator(".exhibit-image")
    .evaluate((el) => getComputedStyle(el).transform);
  assert(result.hoverTransform !== "none", "hover tilt");
  const oil = page.locator("[data-pointer-surface]");
  const withTrail = await oil.screenshot();
  await page.mouse.move(1250, 700);
  await page.waitForTimeout(2400);
  const idle = await oil.screenshot();
  assert(!withTrail.equals(idle), "oil changes and clears");
  result.oilTrail = true;
  const style = page.locator("[data-article-id=faststyletransfer]");
  await style.hover();
  await page.waitForFunction(() => {
    const v = document.querySelector("[data-card-video]");
    return !v.paused && v.currentTime > 0;
  });
  result.hoverVideo = true;
  await page.waitForFunction(
    () => document.querySelector("[data-card-video]").paused,
  );
  result.previewStops = true;
  await page.screenshot({ path: "output/playwright/archive-final.png" });
  await page.goto("http://127.0.0.1:4321/");
  await page.waitForFunction(
    () => document.querySelector("[data-book]").dataset.webgl === "ready",
  );
  await page.locator("[data-pause-book]").click();
  await page.getByRole("tab", { name: "Writing", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector("[data-book]").dataset.chapter === "Writing",
  );
  const c = page.locator(".book-canvas");
  const r = await c.boundingBox();
  // Projection of the left exhibit centre at this known camera/scene configuration.
  await page.mouse.click(r.x + r.width * 0.333, r.y + r.height * 0.4104);
  await page.waitForURL("**/writing/supervised-umap/");
  result.meshArticle = true;
  await page.goBack();
  await page.waitForFunction(
    () => document.querySelector("[data-book]")?.dataset.webgl === "ready",
  );
  assert(
    (await page.locator("[data-book]").getAttribute("data-chapter")) ===
      "Writing",
    "Back restores chapter",
  );
  result.back = true;
  await page.locator(".book-canvas").evaluate((el) => {
    window.__lost = el.getContext("webgl2").getExtension("WEBGL_lose_context");
    window.__lost.loseContext();
  });
  await page.waitForFunction(
    () => document.querySelector("[data-book]").dataset.webgl === "lost",
  );
  await page.evaluate(() => window.__lost.restoreContext());
  await page.waitForFunction(
    () => document.querySelector("[data-book]").dataset.webgl === "ready",
  );
  result.contextRestore = true;
  result.errors = errors;
  assert(errors.length === 0, "no runtime errors: " + errors.join(","));
  return result;
};
