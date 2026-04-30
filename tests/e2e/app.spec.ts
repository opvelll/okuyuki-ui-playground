import { type Page, expect, test } from "@playwright/test";

const MODELING_CAMERA_CENTER_DEPTH_8_VERTEX = [3.743596, 3.35512, 3.998838];

async function expandSettings(page: Page) {
  await page.getByRole("button", { name: /Open settings/i }).click();
}

async function expandGeneralColors(page: Page) {
  await page.getByRole("button", { name: /Expand color settings/i }).click();
}

function parseHudValue(hudText: string, label: string) {
  return hudText.match(new RegExp(`${label}\\n([^\\n]+)`))?.[1]?.trim() ?? "";
}

async function getModelingHud(page: Page) {
  return page.locator("aside").last().innerText();
}

async function seedSingleModelingVertex(page: Page) {
  await page.addInitScript(
    ({ vertexPosition }) => {
      localStorage.clear();
      localStorage.setItem(
        "naname-ui-settings",
        JSON.stringify({
          state: {
            currentScreen: "modeling",
            modelingTool: "move",
          },
          version: 4,
        }),
      );
      localStorage.setItem(
        "naname-ui-modeling-store",
        JSON.stringify({
          state: {
            autoNameIndex: 1,
            currentModelId: "model-1",
            modelsById: {
              "model-1": {
                edgeOrder: [],
                edgesById: {},
                faceOrder: [],
                facesById: {},
                id: "model-1",
                name: "Model 001",
                rootPosition: [0, 0, 0],
                rootRotation: [0, 0, 0],
                vertexOrder: ["vertex-1"],
                verticesById: {
                  "vertex-1": {
                    id: "vertex-1",
                    position: vertexPosition,
                  },
                },
              },
            },
            selectedEdgeIds: [],
            selectedFaceIds: [],
            selectedRoot: false,
            selectedVertexIds: [],
          },
          version: 1,
        }),
      );
    },
    { vertexPosition: MODELING_CAMERA_CENTER_DEPTH_8_VERTEX },
  );
}

async function seedMoveSelectionFixture(
  page: Page,
  selectedVertexIds: string[],
) {
  await page.addInitScript(
    ({ selectedVertexIds, vertexPosition }) => {
      localStorage.clear();
      localStorage.setItem(
        "naname-ui-settings",
        JSON.stringify({
          state: {
            currentScreen: "modeling",
            modelingTool: "move",
          },
          version: 4,
        }),
      );
      localStorage.setItem(
        "naname-ui-modeling-store",
        JSON.stringify({
          state: {
            autoNameIndex: 1,
            currentModelId: "model-1",
            modelsById: {
              "model-1": {
                edgeOrder: [],
                edgesById: {},
                faceOrder: [],
                facesById: {},
                id: "model-1",
                name: "Model 001",
                rootPosition: [0, 0, 0],
                rootRotation: [0, 0, 0],
                vertexOrder: ["vertex-1", "vertex-2"],
                verticesById: {
                  "vertex-1": {
                    id: "vertex-1",
                    position: vertexPosition,
                  },
                  "vertex-2": {
                    id: "vertex-2",
                    position: [40, 40, 40],
                  },
                },
              },
            },
            selectedEdgeIds: [],
            selectedFaceIds: [],
            selectedRoot: false,
            selectedVertexIds,
          },
          version: 1,
        }),
      );
    },
    {
      selectedVertexIds,
      vertexPosition: MODELING_CAMERA_CENTER_DEPTH_8_VERTEX,
    },
  );
}

async function movePointerToCenterVertex(page: Page) {
  const canvas = page.locator("canvas").first();
  await expect(canvas).toBeVisible();
  await page.waitForFunction(() => {
    const canvasElement = document.querySelector("canvas");
    const rect = canvasElement?.getBoundingClientRect();
    return rect && rect.width > 100 && rect.height > 100;
  });

  const canvasBox = await canvas.boundingBox();
  expect(canvasBox).not.toBeNull();
  const startX = Math.round((canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2);
  const startY = Math.round((canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2);

  await page.mouse.move(startX, startY);
  await expect
    .poll(async () => parseHudValue(await getModelingHud(page), "snap"))
    .toBe("vertex");

  return { startX, startY };
}

async function getPersistedSelectedVertexIds(page: Page) {
  return page.evaluate(() => {
    const persistedState = localStorage.getItem("naname-ui-modeling-store");
    return persistedState
      ? (JSON.parse(persistedState).state.selectedVertexIds as string[])
      : [];
  });
}

test("shows the 3d prototype screen", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /Okuyuki-UI-Playground/,
    }),
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: /Open settings/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Switch to Prototype screen/i }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: /Switch to Modeling screen/i }),
  ).toBeVisible();
  await expect(page.getByLabel("Scene loading")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Switch to Move UI tool/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Switch to Rotate UI tool/i }),
  ).toBeVisible();
  await expect(
    page.getByText(
      /Physics enabled: select an object to start screen-depth-drag editing/i,
    ),
  ).toBeVisible();
  await expect(page.getByText("fps", { exact: true })).toBeVisible();

  await expandSettings(page);

  await expect(
    page.getByRole("button", { name: /Close settings/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: /Settings window/i }),
  ).toBeVisible();
  await expect(page.getByLabel("Physics")).toBeVisible();
  await expect(page.getByLabel("Show FPS / FPS表示")).toBeVisible();
  await expect(page.getByRole("button", { name: /全体/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /物理演算/i })).toBeVisible();
  await expect(page.getByTitle(/modeling pointer/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Move UI/i })).toHaveCount(2);
  await expect(page.getByRole("button", { name: /Rotate UI/i })).toHaveCount(2);

  await expandGeneralColors(page);

  await expect(page.getByLabel("Scene Background")).toBeVisible();
  await expect(page.getByLabel("Fog Color")).toBeVisible();
  await expect(page.getByLabel(/Selection Outline \/ 選択枠線/i)).toBeVisible();
  await expect(
    page.getByLabel(/Selection Outline Thickness \/ 選択枠線の太さ/i),
  ).toBeVisible();
  await expect(page.getByLabel("Floor Color")).toBeVisible();
  await expect(page.getByLabel("Grid Major")).toBeVisible();
  await expect(page.getByLabel("Grid Minor")).toBeVisible();
});

test("collapses the settings window", async ({ page }) => {
  await page.goto("/");

  await expandSettings(page);
  await page.getByRole("button", { name: /Close settings/i }).click();

  await expect(
    page.getByRole("button", { name: /Open settings/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Switch to Move UI tool/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /全体/i })).toHaveCount(0);
});

test("switches to physics settings", async ({ page }) => {
  await page.goto("/");

  await expandSettings(page);
  await page.getByRole("button", { name: /物理演算/i }).click();

  await expect(page.getByLabel("Rigid Body Mode")).toBeVisible();
  await expect(page.getByLabel("Object Friction")).toBeVisible();
  await expect(page.getByLabel("Gravity Y")).toBeVisible();
});

test("switches tool mode and opens rotate settings", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /Switch to Rotate UI tool/i }).click();

  await expect(page.getByText(/Rotate mode:/i)).toBeVisible();

  await expandSettings(page);
  await page
    .getByRole("button", { name: /Rotate UI/i })
    .nth(1)
    .click();

  await expect(page.getByLabel("Gizmo Sphere Color")).toBeVisible();
  await expect(page.getByLabel("Gizmo Ring Color")).toBeVisible();
  await expect(page.getByLabel("UI Strength")).toBeVisible();
  await expect(page.getByLabel("Arcball Sensitivity")).toBeVisible();
  await expect(page.getByLabel("UI Radius Px")).toBeVisible();
  await expect(page.getByLabel("Wheel Rotate Step")).toBeVisible();
  await expect(page.getByLabel("Angle Snap Step")).toBeVisible();
  await expect(page.getByLabel("Drag Release Behavior")).toBeVisible();
  await expect(page.getByLabel("Twist Axis")).toBeVisible();
});

test("switches to the modeling screen", async ({ page }) => {
  await page.goto("/");

  await page
    .getByRole("button", { name: /Switch to Modeling screen/i })
    .click();

  await expect(page.getByText("2D Selection", { exact: true })).toBeVisible();
  await expect(
    page.getByText(
      /Lasso tool: drag a screen-space loop to select enabled vertices, edges, or face center dots/i,
    ),
  ).toBeVisible();
  await expect(page.getByLabel(/^Vertex$/i)).toBeChecked();
  await expect(page.getByLabel(/^Edge$/i)).not.toBeChecked();
  await expect(page.getByLabel(/^Face$/i)).not.toBeChecked();
  await expect(
    page.getByRole("button", { name: /Switch to Modeling screen/i }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: /Switch to Prototype screen/i }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.getByRole("button", { name: /Switch to 2D Selection tool/i }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: /Switch to Lasso tool/i }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: /Switch to Line tool/i }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.getByRole("button", { name: /Switch to Camera Move tool/i }),
  ).toHaveAttribute("aria-pressed", "false");
});

test("moves modeling vertex depth with the wheel while dragging", async ({
  page,
}) => {
  await seedSingleModelingVertex(page);
  await page.goto("/");

  await expect(page.getByText(/Move tool:/i)).toBeVisible();
  const canvas = page.locator("canvas").first();
  await expect(canvas).toBeVisible();
  await page.waitForFunction(() => {
    const canvasElement = document.querySelector("canvas");
    const rect = canvasElement?.getBoundingClientRect();
    return rect && rect.width > 100 && rect.height > 100;
  });

  const canvasBox = await canvas.boundingBox();
  expect(canvasBox).not.toBeNull();
  const startX = Math.round((canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2);
  const startY = Math.round((canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2);

  await page.mouse.move(startX, startY);
  await expect
    .poll(async () => parseHudValue(await getModelingHud(page), "snap"))
    .toBe("vertex");

  await page.mouse.down();
  await page.mouse.move(startX + 18, startY + 8, { steps: 8 });
  const draggedDepth = Number(
    parseHudValue(await getModelingHud(page), "depth"),
  );

  await page.mouse.wheel(0, -120);
  await expect
    .poll(async () =>
      Number(parseHudValue(await getModelingHud(page), "depth")),
    )
    .toBeGreaterThan(draggedDepth);
  await expect
    .poll(async () => parseHudValue(await getModelingHud(page), "snap"))
    .not.toBe("vertex");

  await page.mouse.up();
});

test("replaces modeling move vertex selection on a plain click", async ({
  page,
}) => {
  await seedMoveSelectionFixture(page, ["vertex-2"]);
  await page.goto("/");

  await movePointerToCenterVertex(page);
  await page.mouse.down();
  await page.mouse.up();

  await expect
    .poll(async () => getPersistedSelectedVertexIds(page))
    .toEqual(["vertex-1"]);
});

test("adds to modeling move vertex selection on a shift click", async ({
  page,
}) => {
  await seedMoveSelectionFixture(page, ["vertex-2"]);
  await page.goto("/");

  await movePointerToCenterVertex(page);
  await page.keyboard.down("Shift");
  await page.mouse.down();
  await page.mouse.up();
  await page.keyboard.up("Shift");

  await expect
    .poll(async () => getPersistedSelectedVertexIds(page))
    .toEqual(["vertex-2", "vertex-1"]);
});
