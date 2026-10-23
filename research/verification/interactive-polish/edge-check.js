async (page) => {
  const result = {},
    assert = (ok, msg) => {
      if (!ok) throw Error(msg);
    };
  await page.goto("http://127.0.0.1:4321/");
  await page.waitForFunction(
    () => document.querySelector("[data-book]").dataset.webgl === "ready",
  );
  await page.locator("[data-book]").evaluate((root) => {
    for (const i of [1, 2, 3, 4, 5])
      root.querySelectorAll("[role=tab]")[i].click();
  });
  await page.waitForFunction(
    () => document.querySelector("[data-book]").dataset.chapter === "Contact",
  );
  await page.waitForTimeout(900);
  assert(
    (await page.locator("[data-book]").getAttribute("data-chapter")) ===
      "Contact",
    "latest chapter wins",
  );
  result.rapidChapterSelection = true;
  await page.locator("[data-portrait-open]").click();
  await page.waitForFunction(
    () =>
      document.querySelector("[data-portrait]").dataset.faceState === "ready",
  );
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    assert(
      await page
        .locator("dialog")
        .evaluate((el) => el.contains(document.activeElement)),
      "focus stays in dialog",
    );
  }
  result.focusContained = true;
  await page.locator("[data-face]").focus();
  await page
    .locator("[data-face]")
    .evaluate((el) =>
      el.getContext("webgl2").getExtension("WEBGL_lose_context").loseContext(),
    );
  await page.waitForFunction(
    () =>
      document.querySelector("[data-portrait]").dataset.faceRenderer ===
      "canvas",
  );
  assert(
    await page
      .locator("[data-face]")
      .evaluate((el) => el === document.activeElement),
    "focus survives fallback",
  );
  await page.keyboard.press("ArrowRight");
  await page.waitForFunction(
    () =>
      Number(document.querySelector("[data-portrait]").dataset.facePull) > 0.05,
  );
  result.faceContextLossFallback = true;
  await page.keyboard.press("Escape");
  await page.goto("http://127.0.0.1:4321/writing/");
  for (const width of [320, 390, 768, 1024]) {
    await page.setViewportSize({ width, height: 850 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "overflow at " + width,
    );
  }
  result.widths = [320, 390, 768, 1024];
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.mouse.move(80, 500);
  await page.mouse.move(600, 400, { steps: 30 });
  await page.screenshot({ path: "output/playwright/oil-trail-final.png" });
  return result;
};
