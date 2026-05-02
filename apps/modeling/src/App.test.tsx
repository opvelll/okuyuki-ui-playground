import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useModelingStore } from "./store/modelingStore";
import {
  DEFAULT_MODELING_CAMERA,
  DEFAULT_PROTOTYPE_CAMERA,
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

vi.mock("@react-three/drei", () => ({
  Grid: () => null,
  Line: () => null,
  OrbitControls: () => null,
}));

async function loadApp() {
  const module = await import("./App");
  return module.default;
}

describe("Modeling App", () => {
  beforeEach(() => {
    vi.resetModules();
    useUiStore.persist.clearStorage();
    useUiStore.setState({
      ...createDefaultPersistedUiState(),
      currentScreen: "modeling",
      axisMagnetTarget: null,
      interactionState: "idle",
      modelingCamera: DEFAULT_MODELING_CAMERA,
      modelingCameraDragging: false,
      modelingCameraOverride: false,
      modelingLinePreview: {
        active: false,
        currentPosition: [0, 0, 0],
        currentSnapped: false,
        planeNormal: [0, 0, 1],
        polygonPoints: [],
        startSnapped: false,
        startPosition: [0, 0, 0],
        tool: "line",
        wireframeEdges: [],
      },
      modelingPointer: {
        depth: 8,
        hovered: false,
        plane: "none",
        position: [0, 0, 0],
        snappedAxes: [false, false, false],
        snappedAxisTargets: [null, null, null],
        snappedEdgeTarget: null,
        snappedFaceTarget: null,
        snappedVertexTarget: null,
      },
      prototypeCamera: DEFAULT_PROTOTYPE_CAMERA,
      selectedObjectId: null,
    });
    useModelingStore.getState().resetModeling();
  });

  it("renders the modeling shell and controls", async () => {
    const App = await loadApp();

    render(<App />);
    await screen.findByLabelText(/three-scene/i);

    expect(
      screen.getByRole("heading", { name: /Okuyuki Modeling/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Open settings/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Switch to Prototype screen/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Switch to Lasso tool/i }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByText(/Lasso tool: drag a screen-space loop/i),
    ).toBeInTheDocument();
  });

  it("shows modeling settings only", async () => {
    const user = userEvent.setup();
    const App = await loadApp();

    render(<App />);
    await screen.findByLabelText(/three-scene/i);
    await user.click(screen.getByRole("button", { name: /Open settings/i }));

    expect(screen.getByTitle(/modeling pointer/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /物理演算/i })).toBeNull();
  });
});
