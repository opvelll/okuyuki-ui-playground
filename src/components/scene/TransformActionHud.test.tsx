import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { SceneObject } from "../../types/scene";
import { TransformActionHud } from "./TransformActionHud";

vi.mock("@react-three/drei", () => ({
  Html: ({ children }: { children: ReactNode }) => (
    <div data-testid="html-hud">{children}</div>
  ),
}));

const selectedObject = {
  color: "#f59e0b",
  id: "amber-box",
  kind: "box",
  position: [1, 2, 3],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
} satisfies SceneObject;

describe("TransformActionHud", () => {
  it("renders move and rotate actions for the selected object", () => {
    render(
      <TransformActionHud
        onMoveClick={vi.fn()}
        onRotateClick={vi.fn()}
        selectedObject={selectedObject}
        visible
      />,
    );

    expect(
      screen.getByRole("toolbar", {
        name: /Selected object transform actions/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Move selected object/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Rotate selected object/i }),
    ).toBeInTheDocument();
  });

  it("calls the requested transform action", () => {
    const onMoveClick = vi.fn();
    const onRotateClick = vi.fn();

    render(
      <TransformActionHud
        onMoveClick={onMoveClick}
        onRotateClick={onRotateClick}
        selectedObject={selectedObject}
        visible
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Move selected object/i }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Rotate selected object/i }),
    );

    expect(onMoveClick).toHaveBeenCalledTimes(1);
    expect(onRotateClick).toHaveBeenCalledTimes(1);
  });

  it("stays hidden without a selected object", () => {
    render(
      <TransformActionHud
        onMoveClick={vi.fn()}
        onRotateClick={vi.fn()}
        selectedObject={null}
        visible
      />,
    );

    expect(
      screen.queryByRole("toolbar", {
        name: /Selected object transform actions/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("stays hidden outside selection stage", () => {
    render(
      <TransformActionHud
        onMoveClick={vi.fn()}
        onRotateClick={vi.fn()}
        selectedObject={selectedObject}
        visible={false}
      />,
    );

    expect(
      screen.queryByRole("toolbar", {
        name: /Selected object transform actions/i,
      }),
    ).not.toBeInTheDocument();
  });
});
