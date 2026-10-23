async (page) => {
  const check = (value, message) => {
    if (!value) throw Error(message);
  };
  const result = {};
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:4321/");
  await page.waitForFunction(
    () => document.querySelector("[data-book]").dataset.webgl === "ready",
  );
  result.geometry = await page
    .locator("[data-book]")
    .getAttribute("data-book-geometry");
  result.vertices = Number(
    await page.locator("[data-book]").getAttribute("data-vertex-count"),
  );
  result.depth = Number(
    await page.locator("[data-book]").getAttribute("data-relief-depth"),
  );
  check(
    result.geometry === "textured-relief" &&
      result.vertices > 20000 &&
      result.depth > 1,
    "real relief mesh active",
  );
  for (const label of [
    "Start",
    "Services",
    "Work",
    "Writing",
    "About",
    "Contact",
  ]) {
    await page.getByRole("tab", { name: label, exact: true }).focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(
      (label) =>
        document.querySelector("[data-book]").dataset.chapter === label,
      label,
    );
    await page.waitForFunction(
      () =>
        document.querySelector("[role=tabpanel]").getAttribute("aria-busy") ===
        "false",
    );
    await page.locator("[data-open-chapter]").focus();
    await page
      .locator(".book-stage")
      .screenshot({
        path: `output/playwright/reference-${label.toLowerCase()}.png`,
      });
  }
  await page.getByRole("tab", { name: "Services", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () => document.querySelector("[data-book]").dataset.chapter === "Services",
  );
  const canvas = page.locator(".book-canvas");
  await canvas.screenshot({ path: "output/playwright/reference-canvas.png" });
  const bounds = await canvas.boundingBox();
  await page.evaluate(
    ({ width, height }) => {
      const poster = document.querySelector(".book-artwork");
      const copy = document.createElement("img");
      copy.id = "comparison-source";
      copy.src = poster.src;
      copy.style.cssText = `position:fixed;left:0;top:0;width:${width}px;height:${height}px;z-index:99999`;
      document.body.append(copy);
      return copy.decode();
    },
    { width: bounds.width, height: bounds.height },
  );
  await page
    .locator("#comparison-source")
    .screenshot({ path: "output/playwright/reference-source.png" });
  await page.locator("#comparison-source").evaluate((el) => el.remove());
  await canvas.focus();
  await page.waitForTimeout(60);
  const before = await canvas.screenshot();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(60);
  const moved = await canvas.screenshot();
  check(
    !before.equals(moved),
    "depth inspection changes actual rendered pixels",
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(60);
  const reset = await canvas.screenshot({
    path: "output/playwright/reference-reset.png",
  });
  check(before.equals(reset), "Escape restores the identical reference pose");
  result.depthInspection = true;
  result.identicalPoseReset = true;
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.waitForTimeout(60);
  const pointerBefore = await canvas.screenshot();
  await page.mouse.move(
    box.x + box.width * 0.3 + 35,
    box.y + box.height * 0.5,
    { steps: 5 },
  );
  await page.mouse.up();
  await page.waitForTimeout(60);
  check(
    !pointerBefore.equals(await canvas.screenshot()),
    "pointer drag changes the rendered view",
  );
  await page.keyboard.press("Escape");
  result.pointerInspection = true;
  await page.getByRole("tab", { name: "Writing", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () => document.querySelector("[data-book]").dataset.chapter === "Writing",
  );
  const r = await canvas.boundingBox();
  await page.mouse.click(r.x + r.width * 0.51, r.y + r.height * 0.3);
  await page.waitForURL("**/writing/supervised-umap/");
  await page.goBack();
  await page.waitForFunction(
    () => document.querySelector("[data-book]")?.dataset.webgl === "ready",
  );
  check(
    (await page.locator("[data-book]").getAttribute("data-chapter")) ===
      "Writing",
    "Back restores chapter",
  );
  result.articleAndBack = true;
  await page.locator(".book-canvas").evaluate((el) => {
    window.__bookLoss = el
      .getContext("webgl2")
      .getExtension("WEBGL_lose_context");
    window.__bookLoss.loseContext();
  });
  await page.waitForFunction(
    () => document.querySelector("[data-book]").dataset.webgl === "lost",
  );
  await page.evaluate(() => window.__bookLoss.restoreContext());
  await page.waitForFunction(
    () => document.querySelector("[data-book]").dataset.webgl === "ready",
  );
  result.contextRecovery = true;
  await page.goto("http://127.0.0.1:4321/writing/");
  await page.mouse.move(80, 400);
  await page.mouse.move(600, 400, { steps: 20 });
  await page.screenshot({ path: "output/playwright/subtle-trail.png" });
  await page.waitForTimeout(650);
  await page.screenshot({ path: "output/playwright/subtle-trail-cleared.png" });
  result.trailCapture = true;
  result.errors = errors;
  check(!errors.length, "no page errors");
  return result;
};
