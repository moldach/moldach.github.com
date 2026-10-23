async (page) => {
  const result = {};
  const check = (ok, message) => {
    if (!ok) throw Error(message);
  };
  await page.goto("http://127.0.0.1:4321/");
  await page.waitForFunction(
    () => document.querySelector("[data-book]").dataset.webgl === "ready",
  );
  result.default3D = true;
  const pause = page.locator("[data-pause-book]");
  if ((await pause.getAttribute("aria-pressed")) === "false")
    await pause.click();
  for (const chapter of [
    "Services",
    "Work",
    "Writing",
    "About",
    "Contact",
    "Start",
  ]) {
    await page.getByRole("tab", { name: chapter, exact: true }).click();
    await page.waitForFunction(
      (label) =>
        document.querySelector("[data-book]").dataset.chapter === label,
      chapter,
    );
    check(
      (await page.locator("[data-book]").getAttribute("data-chapter")) ===
        chapter,
      "chapter " + chapter,
    );
    await page
      .locator("[data-book]")
      .screenshot({
        path: `output/playwright/book-${chapter.toLowerCase()}.png`,
      });
  }
  await page.goto("http://127.0.0.1:4321/writing/");
  result.cards = await page.locator("[data-visual-card]").count();
  check(result.cards === 7, "all seven cards");
  result.destinations = await page
    .locator("[data-visual-card]")
    .evaluateAll((cards) =>
      cards.map((c) => ({
        id: c.dataset.articleId,
        href: c.getAttribute("href"),
      })),
    );
  await page.locator("[data-visual-card]").first().scrollIntoViewIfNeeded();
  await page.mouse.move(200, 200);
  await page.mouse.move(400, 350, { steps: 20 });
  await page.screenshot({ path: "output/playwright/archive-hover.png" });
  await page.locator("[data-portrait-open]").click();
  await page.waitForFunction(
    () => document.querySelector("[data-portrait]").dataset.faceRenderer,
  );
  result.faceRenderer = await page
    .locator("[data-portrait]")
    .getAttribute("data-face-renderer");
  const face = page.locator("[data-face]");
  const rect = await face.boundingBox();
  const before = await face.screenshot();
  await page.mouse.move(rect.x + rect.width * 0.5, rect.y + rect.height * 0.48);
  await page.mouse.down();
  await page.mouse.move(
    rect.x + rect.width * 0.7,
    rect.y + rect.height * 0.35,
    { steps: 12 },
  );
  await page.waitForTimeout(100);
  result.dragPull = Number(
    await page.locator("[data-portrait]").getAttribute("data-face-pull"),
  );
  check(result.dragPull > 0.2, "face drag deforms");
  const during = await face.screenshot();
  check(!before.equals(during), "actual face pixels change");
  await page.screenshot({ path: "output/playwright/portrait-drag.png" });
  await page.mouse.up();
  await page.waitForFunction(
    () =>
      Number(document.querySelector("[data-portrait]").dataset.facePull) <
      0.002,
  );
  result.springReturn = true;
  await page.locator("[data-face-region]").selectOption("left");
  await face.focus();
  await page.keyboard.press("ArrowRight");
  check(
    Number(
      await page.locator("[data-portrait]").getAttribute("data-face-pull"),
    ) > 0.05,
    "keyboard deformation",
  );
  result.keyboard = true;
  await page.locator("[data-face-reset]").click();
  await page.waitForFunction(
    () =>
      document.querySelector("[data-portrait]").dataset.facePull === "0.000",
  );
  result.reset = true;
  await page.keyboard.press("Escape");
  check(!(await page.locator("dialog").isVisible()), "escape closes");
  check(
    await page
      .locator("[data-portrait-open]")
      .evaluate((el) => el === document.activeElement),
    "focus restored",
  );
  result.escapeFocus = true;
  await page.locator("[data-portrait-open]").click();
  await page.getByRole("button", { name: "Close portrait" }).click();
  result.reopenClose = true;
  console.log(JSON.stringify(result, null, 2));
  return result;
};
