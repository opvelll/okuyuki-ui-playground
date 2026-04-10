import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSceneStore } from "./store/sceneStore";
import {
  UI_STORE_PERSIST_KEY,
  createDefaultPersistedUiState,
  useUiStore,
} from "./store/uiStore";

vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children: ReactNode }) => (
    <div data-testid="canvas" aria-label="three-scene">
      {children ? null : null}
    </div>
  ),
}));

vi.mock("@react-three/rapier", () => ({
  CuboidCollider: () => null,
  Physics: ({ children }: { children: ReactNode }) => <>{children}</>,
  RigidBody: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@react-three/drei", () => ({
  ContactShadows: () => null,
  OrbitControls: () => null,
}));

async function loadApp() {
  const module = await import("./App");
  return module.default;
}

describe("App", () => {
  beforeEach(() => {
    vi.resetModules();
    useUiStore.persist.clearStorage();
    useUiStore.setState({
      ...createDefaultPersistedUiState(),
      axisMagnetTarget: null,
      interactionState: "idle",
      selectedObjectId: null,
    });
    useSceneStore.getState().resetScene();
  });

  it("renders the app shell and loaded scene controls", async () => {
    const App = await loadApp();

    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: /Okuyuki-UI-Playground/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/Physics/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Show FPS \/ FPS表示/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Scene Background/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Fog Color/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Selection Outline \/ 選択枠線/i),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Selection Outline Thickness \/ 選択枠線の太さ/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Floor Color/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Grid Major/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Grid Minor/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Collapse settings/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /全体/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("button", { name: /物理演算/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Move UI/i })).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: /Switch to Rotate UI tool/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Physics/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Physics enabled: select an object to start screen-depth-drag editing/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("FPS")).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Scene loading|three-scene/i),
    ).toBeInTheDocument();
  });

  it("shows the placeholder while the scene module is still loading", async () => {
    vi.doMock("./components/PrototypeScene", () => new Promise(() => {}));
    const App = await loadApp();

    render(<App />);

    expect(screen.getByLabelText(/Scene loading/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Preparing the 3D prototype scene/i),
    ).toBeInTheDocument();
  });

  it("collapses the settings window while the scene is loading", async () => {
    const user = userEvent.setup();
    vi.doMock("./components/PrototypeScene", () => new Promise(() => {}));
    const App = await loadApp();

    render(<App />);

    await user.click(
      screen.getByRole("button", { name: /Collapse settings/i }),
    );

    expect(
      screen.getByRole("button", { name: /Expand settings/i }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("button", { name: /^全体$/i }),
    ).not.toBeInTheDocument();
  });

  it("persists the selected settings section and open state", async () => {
    const user = userEvent.setup();
    const App = await loadApp();

    render(<App />);

    await user.click(screen.getByRole("button", { name: /物理演算/i }));
    expect(screen.getByLabelText(/Rigid Body Mode/i)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Collapse settings/i }),
    );

    const persistedState = window.localStorage.getItem(UI_STORE_PERSIST_KEY);

    expect(persistedState).not.toBeNull();
    expect(persistedState).toContain('"selectedSettingsMenu":"physics"');
    expect(persistedState).toContain('"settingsOpen":false');
  });

  it("toggles FPS visibility from general settings", async () => {
    const user = userEvent.setup();
    const App = await loadApp();

    render(<App />);

    expect(screen.getByText("FPS")).toBeInTheDocument();

    await user.click(screen.getByLabelText(/Show FPS \/ FPS表示/i));

    expect(screen.queryByText("FPS")).not.toBeInTheDocument();

    const persistedState = window.localStorage.getItem(UI_STORE_PERSIST_KEY);

    expect(persistedState).not.toBeNull();
    expect(persistedState).toContain('"showFps":false');
  });

  it("collapses grouped color settings in general section", async () => {
    const user = userEvent.setup();
    const App = await loadApp();

    render(<App />);

    expect(screen.getByLabelText(/Scene Background/i)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Collapse color settings/i }),
    );

    expect(
      screen.getByRole("button", { name: /Expand color settings/i }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByLabelText(/Scene Background/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Fog Color/i)).not.toBeInTheDocument();
  });

  it("switches the active tool mode from the left toolbar", async () => {
    const user = userEvent.setup();
    const App = await loadApp();

    render(<App />);

    await user.click(
      screen.getByRole("button", { name: /Switch to Rotate UI tool/i }),
    );

    expect(screen.getByText(/Object Rotate/i)).toBeInTheDocument();
    expect(screen.getByText(/Rotate mode:/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Rotate UI/i })).toHaveLength(
      2,
    );
    expect(
      screen.getByRole("button", { name: /Switch to Rotate UI tool/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("switches the interaction mode with m and r hotkeys", async () => {
    const user = userEvent.setup();
    const App = await loadApp();

    render(<App />);

    await user.keyboard("r");

    expect(screen.getByText(/Object Rotate/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Switch to Rotate UI tool/i }),
    ).toHaveAttribute("aria-pressed", "true");

    await user.keyboard("m");

    expect(screen.getByText(/Object Move/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Switch to Move UI tool/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("shows rotate settings when the section is selected", async () => {
    const user = userEvent.setup();
    const App = await loadApp();

    render(<App />);

    await user.click(screen.getAllByRole("button", { name: /Rotate UI/i })[1]);

    expect(screen.getByLabelText(/Gizmo Sphere Color/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Gizmo Ring Color/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Arcball Sensitivity \/ arcball倍率/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/UI Strength/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/UI Radius Px/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Wheel Rotate Step/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Angle Snap Step/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Drag Release Behavior \/ ドラッグ後の選択/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Twist Axis/i)).toBeInTheDocument();
  });

  it("persists the rotate drag release behavior", async () => {
    const user = userEvent.setup();
    const App = await loadApp();

    render(<App />);

    await user.click(screen.getAllByRole("button", { name: /Rotate UI/i })[1]);
    await user.selectOptions(
      screen.getByLabelText(/Drag Release Behavior \/ ドラッグ後の選択/i),
      "clear-selection",
    );

    const persistedState = window.localStorage.getItem(UI_STORE_PERSIST_KEY);

    expect(persistedState).not.toBeNull();
    expect(persistedState).toContain(
      '"rotateDragReleaseBehavior":"clear-selection"',
    );
  });

  it("persists the rotate angle snap step", async () => {
    const user = userEvent.setup();
    const App = await loadApp();

    render(<App />);

    await user.click(screen.getAllByRole("button", { name: /Rotate UI/i })[1]);
    await user.clear(screen.getByLabelText(/Angle Snap Step/i));
    await user.type(screen.getByLabelText(/Angle Snap Step/i), "30");

    const persistedState = window.localStorage.getItem(UI_STORE_PERSIST_KEY);

    expect(persistedState).not.toBeNull();
    expect(persistedState).toContain('"rotateAngleSnapStepDeg":30');
  });

  it("shows the new move workflow toggles in move settings", async () => {
    const user = userEvent.setup();
    const App = await loadApp();

    render(<App />);

    await user.click(screen.getAllByRole("button", { name: /Move UI/i })[1]);

    expect(
      screen.getByLabelText(/Vertical Drop Guide \/ 落下ガイド線/i),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Always Snap \/ 常時スナップ/i),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Interval Snap Pattern \/ 一定間隔パターン/i),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Magnet Axis Space \/ 軸吸着の基準/i),
    ).toBeInTheDocument();
  });

  it("persists move snap settings", async () => {
    const user = userEvent.setup();
    const App = await loadApp();

    render(<App />);

    await user.click(screen.getAllByRole("button", { name: /Move UI/i })[1]);
    await user.selectOptions(
      screen.getByLabelText(/Always Snap \/ 常時スナップ/i),
      "grid",
    );
    await user.selectOptions(
      screen.getByLabelText(/Interval Snap Pattern \/ 一定間隔パターン/i),
      "xz",
    );
    await user.selectOptions(
      screen.getByLabelText(/Magnet Axis Space \/ 軸吸着の基準/i),
      "world",
    );

    const persistedState = window.localStorage.getItem(UI_STORE_PERSIST_KEY);

    expect(persistedState).not.toBeNull();
    expect(persistedState).toContain('"moveAlwaysSnapMode":"grid"');
    expect(persistedState).toContain('"moveGridSnapPattern":"xz"');
    expect(persistedState).toContain('"moveAxisMagnetReferenceFrame":"world"');
  });

  it("lets users choose axis magnet as the always-on snap mode", async () => {
    const user = userEvent.setup();
    const App = await loadApp();

    render(<App />);

    await user.click(screen.getAllByRole("button", { name: /Move UI/i })[1]);
    await user.selectOptions(
      screen.getByLabelText(/Always Snap \/ 常時スナップ/i),
      "axis-magnet",
    );

    expect(screen.getByLabelText(/Always Snap \/ 常時スナップ/i)).toHaveValue(
      "axis-magnet",
    );
  });

  it("shows magnet axis settings in move settings", async () => {
    const user = userEvent.setup();
    const App = await loadApp();

    render(<App />);

    await user.click(screen.getAllByRole("button", { name: /Move UI/i })[1]);

    expect(
      screen.getByLabelText(/Magnet Axis Space \/ 軸吸着の基準/i),
    ).toBeInTheDocument();
  });
});
