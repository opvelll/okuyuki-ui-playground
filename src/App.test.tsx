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
  Environment: () => null,
  Float: ({ children }: { children: ReactNode }) => <>{children}</>,
  OrbitControls: () => null,
}));

describe("App", () => {
  it("renders the starter heading", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: /React \/ Three\.js の制作環境をそのまま触り始められる土台/i,
      }),
    ).toBeInTheDocument();
  });
});
