import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSceneStore } from "./store/sceneStore";
import { useUiStore } from "./store/uiStore";

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
    useUiStore.setState({
      axisMagnetTarget: null,
      interactionState: "idle",
      physicsEnabled: true,
      moveDepthWheelDirection: "normal",
      moveGridSnapStep: 0.5,
      moveOverlayDisplayMode: "mode-1",
      moveOverlayOrientationMode: "camera-facing",
      movePrecisionStep: 0.1,
      moveOverlayRadiusMultiplier: 1.15,
      moveDepthWheelStep: 0.24,
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
    expect(
      screen.getByRole("button", { name: /Collapse settings/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Overlay Radius Multiplier/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Shift Depth Step/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ctrl Grid Snap Step/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Overlay Display/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Depth Wheel Step/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Physics enabled: object dragging is paused/i),
    ).toBeInTheDocument();
    expect(await screen.findByLabelText(/three-scene/i)).toBeInTheDocument();
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
      screen.queryByLabelText(/Depth Wheel Step/i),
    ).not.toBeInTheDocument();
  });
});
