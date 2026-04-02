import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import App from "./App";

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
  it("renders the compact heading and physics switch", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: /Okuyuki-UI-Playground/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/Physics/i)).toBeInTheDocument();
  });
});
