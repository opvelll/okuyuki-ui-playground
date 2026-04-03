import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, vi } from "vitest";
import App from "./App";
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

describe("App", () => {
  beforeEach(() => {
    useUiStore.setState({
      interactionState: "idle",
      physicsEnabled: true,
      moveDepthWheelDirection: "normal",
      moveOverlayRadiusMultiplier: 1.15,
      moveDepthWheelStep: 0.24,
      moveMode: "screen-depth-drag",
      selectedObjectId: null,
      settingsOpen: true,
    });
    useSceneStore.getState().resetScene();
  });

  it("renders the compact heading and settings window", () => {
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
    expect(screen.getByLabelText(/Depth Wheel Step/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Physics enabled: object dragging is paused/i),
    ).toBeInTheDocument();
  });

  it("collapses the settings window", async () => {
    const user = userEvent.setup();

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
