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

vi.mock("@react-three/drei", () => ({
  ContactShadows: () => null,
  OrbitControls: () => null,
}));

describe("App", () => {
  it("renders the 3d playground heading", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: /3D UI Playground/i,
      }),
    ).toBeInTheDocument();
  });
});
