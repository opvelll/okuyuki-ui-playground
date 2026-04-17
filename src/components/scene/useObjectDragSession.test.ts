import { describe, expect, it } from "vitest";
import { resolveOverlayShortcutState } from "./useObjectDragSession";

describe("resolveOverlayShortcutState", () => {
  it("maps single-key shortcuts to their corresponding overlay modes", () => {
    expect(resolveOverlayShortcutState(new Set(["1"]), ["1"])).toEqual({
      displayMode: "mode-1",
      orientationMode: "camera-facing",
    });
    expect(resolveOverlayShortcutState(new Set(["2"]), ["2"])).toEqual({
      displayMode: "mode-2",
      orientationMode: "screen-vertical",
    });
    expect(resolveOverlayShortcutState(new Set(["3"]), ["3"])).toEqual({
      displayMode: "mode-3",
      orientationMode: "screen-horizontal",
    });
  });

  it("supports the 2 + 3 overlay combination and keeps the newest key as orientation", () => {
    expect(
      resolveOverlayShortcutState(new Set(["2", "3"]), ["2", "3"]),
    ).toEqual({
      displayMode: "modes-2-3",
      orientationMode: "screen-horizontal",
    });
    expect(
      resolveOverlayShortcutState(new Set(["2", "3"]), ["3", "2"]),
    ).toEqual({
      displayMode: "modes-2-3",
      orientationMode: "screen-vertical",
    });
  });

  it("supports the 1 + 2 + 3 overlay combination and falls back for unsupported pairs", () => {
    expect(
      resolveOverlayShortcutState(new Set(["1", "2", "3"]), ["1", "2", "3"]),
    ).toEqual({
      displayMode: "modes-1-2-3",
      orientationMode: "screen-horizontal",
    });
    expect(
      resolveOverlayShortcutState(new Set(["1", "2"]), ["1", "2"]),
    ).toEqual({
      displayMode: "mode-2",
      orientationMode: "screen-vertical",
    });
  });

  it("returns null when no overlay shortcut key is pressed", () => {
    expect(resolveOverlayShortcutState(new Set(), [])).toBeNull();
  });
});
