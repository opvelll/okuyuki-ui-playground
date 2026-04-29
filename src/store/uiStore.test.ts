import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_MODELING_CAMERA,
  DEFAULT_PROTOTYPE_CAMERA,
  createDefaultPersistedUiState,
  useUiStore,
} from "./uiStore";

describe("uiStore", () => {
  beforeEach(() => {
    useUiStore.setState({
      ...createDefaultPersistedUiState(),
      axisMagnetTarget: null,
      interactionState: "idle",
      modelingCamera: DEFAULT_MODELING_CAMERA,
      modelingCameraDragging: false,
      modelingCameraOverride: false,
      modelingLassoSelection: {
        phase: "idle",
        points: [],
      },
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
  });

  it("clears the rotate selection when switching to move mode", () => {
    useUiStore.setState({
      interactionMode: "rotate",
      interactionState: "active",
      selectedObjectId: "amber-box",
    });

    useUiStore.getState().setInteractionMode("move");

    expect(useUiStore.getState().interactionMode).toBe("move");
    expect(useUiStore.getState().selectedObjectId).toBeNull();
    expect(useUiStore.getState().interactionState).toBe("idle");
  });

  it("clears selection when a move drag completes", () => {
    useUiStore.setState({
      axisMagnetTarget: {
        axis: "x",
        direction: "positive",
        objectId: "cobalt-cylinder",
      },
      interactionMode: "move",
      interactionState: "dragging",
      selectedObjectId: "amber-box",
    });

    useUiStore.getState().completeMoveDrag();

    expect(useUiStore.getState().axisMagnetTarget).toBeNull();
    expect(useUiStore.getState().interactionState).toBe("idle");
    expect(useUiStore.getState().selectedObjectId).toBeNull();
  });

  it("keeps the selection when changing into rotate mode", () => {
    useUiStore.setState({
      interactionMode: "move",
      interactionState: "active",
      selectedObjectId: "amber-box",
    });

    useUiStore.getState().setInteractionMode("rotate");

    expect(useUiStore.getState().interactionMode).toBe("rotate");
    expect(useUiStore.getState().selectedObjectId).toBe("amber-box");
    expect(useUiStore.getState().interactionState).toBe("active");
  });

  it("keeps dragging state when setting the current interaction mode again", () => {
    useUiStore.setState({
      axisMagnetTarget: {
        axis: "z",
        direction: "negative",
        objectId: "amber-box",
      },
      interactionMode: "move",
      interactionState: "dragging",
      selectedObjectId: "amber-box",
    });

    useUiStore.getState().setInteractionMode("move");

    expect(useUiStore.getState().interactionMode).toBe("move");
    expect(useUiStore.getState().interactionState).toBe("dragging");
    expect(useUiStore.getState().selectedObjectId).toBe("amber-box");
    expect(useUiStore.getState().axisMagnetTarget).toEqual({
      axis: "z",
      direction: "negative",
      objectId: "amber-box",
    });
  });

  it("clears selection when switching screens", () => {
    useUiStore.setState({
      currentScreen: "prototype",
      interactionState: "active",
      selectedObjectId: "amber-box",
    });

    useUiStore.getState().setCurrentScreen("modeling");

    expect(useUiStore.getState().currentScreen).toBe("modeling");
    expect(useUiStore.getState().selectedObjectId).toBeNull();
    expect(useUiStore.getState().interactionState).toBe("idle");
  });

  it("keeps prototype and modeling camera snapshots separate", () => {
    useUiStore.getState().setPrototypeCamera({
      position: [1, 2, 3],
      target: [4, 5, 6],
    });
    useUiStore.getState().setModelingCamera({
      position: [7, 8, 9],
      target: [10, 11, 12],
    });

    expect(useUiStore.getState().prototypeCamera).toEqual({
      position: [1, 2, 3],
      target: [4, 5, 6],
    });
    expect(useUiStore.getState().modelingCamera).toEqual({
      position: [7, 8, 9],
      target: [10, 11, 12],
    });
  });

  it("does not reset camera snapshots when switching screens", () => {
    useUiStore.getState().setPrototypeCamera({
      position: [1, 2, 3],
      target: [0, 0, 0],
    });
    useUiStore.getState().setModelingCamera({
      position: [7, 8, 9],
      target: [1, 1, 1],
    });

    useUiStore.getState().setCurrentScreen("modeling");

    expect(useUiStore.getState().prototypeCamera).toEqual({
      position: [1, 2, 3],
      target: [0, 0, 0],
    });
    expect(useUiStore.getState().modelingCamera).toEqual({
      position: [7, 8, 9],
      target: [1, 1, 1],
    });
  });

  it("clamps the modeling vertical axis floor height", () => {
    useUiStore.getState().setModelingPointerVerticalAxisFloorY(64);
    expect(useUiStore.getState().modelingPointerVerticalAxisFloorY).toBe(32);

    useUiStore.getState().setModelingPointerVerticalAxisFloorY(-64);
    expect(useUiStore.getState().modelingPointerVerticalAxisFloorY).toBe(-32);
  });

  it("stores the below-floor horizontal axis display mode", () => {
    expect(useUiStore.getState().modelingPointerAxisBelowFloorDisplay).toBe(
      "hidden",
    );

    useUiStore.getState().setModelingPointerAxisBelowFloorDisplay("faded");

    expect(useUiStore.getState().modelingPointerAxisBelowFloorDisplay).toBe(
      "faded",
    );
  });

  it("clamps the modeling line overlay radius multiplier", () => {
    expect(useUiStore.getState().modelingLineOverlayRadiusMultiplier).toBe(1);

    useUiStore.getState().setModelingLineOverlayRadiusMultiplier(0.1);
    expect(useUiStore.getState().modelingLineOverlayRadiusMultiplier).toBe(0.5);

    useUiStore.getState().setModelingLineOverlayRadiusMultiplier(3);
    expect(useUiStore.getState().modelingLineOverlayRadiusMultiplier).toBe(2);

    useUiStore.getState().setModelingLineOverlayRadiusMultiplier(1.15);
    expect(useUiStore.getState().modelingLineOverlayRadiusMultiplier).toBe(
      1.15,
    );
  });

  it("clamps the modeling pointer snap controls", () => {
    useUiStore.getState().setModelingPointerVertexSnapEnabled(false);
    expect(useUiStore.getState().modelingPointerVertexSnapEnabled).toBe(false);

    useUiStore.getState().setModelingPointerVertexSnapDistance(-1);
    expect(useUiStore.getState().modelingPointerVertexSnapDistance).toBe(0);

    useUiStore.getState().setModelingPointerAxisSnapEnabled(false);
    expect(useUiStore.getState().modelingPointerAxisSnapEnabled).toBe(false);

    useUiStore.getState().setModelingPointerAxisSnapDistance(-1);
    expect(useUiStore.getState().modelingPointerAxisSnapDistance).toBe(0);

    useUiStore.getState().setModelingPointerEdgeSnapEnabled(false);
    expect(useUiStore.getState().modelingPointerEdgeSnapEnabled).toBe(false);

    useUiStore.getState().setModelingPointerEdgeSnapDistance(-1);
    expect(useUiStore.getState().modelingPointerEdgeSnapDistance).toBe(0);

    useUiStore.getState().setModelingPointerGridSnapEnabled(true);
    expect(useUiStore.getState().modelingPointerGridSnapEnabled).toBe(true);

    useUiStore.getState().setModelingPointerScreenVertexSnapEnabled(true);
    expect(useUiStore.getState().modelingPointerScreenVertexSnapEnabled).toBe(
      true,
    );

    useUiStore.getState().setModelingPointerScreenEdgeSnapEnabled(true);
    expect(useUiStore.getState().modelingPointerScreenEdgeSnapEnabled).toBe(
      true,
    );

    useUiStore.getState().setModelingPointerScreenFaceSnapEnabled(true);
    expect(useUiStore.getState().modelingPointerScreenFaceSnapEnabled).toBe(
      true,
    );

    useUiStore.getState().setModelingPointerGridSnapStep(0);
    expect(useUiStore.getState().modelingPointerGridSnapStep).toBe(0.01);

    useUiStore.getState().setModelingPointerAxisSnapDistance(10);
    expect(useUiStore.getState().modelingPointerAxisSnapDistance).toBe(4);

    useUiStore.getState().setModelingPointerEdgeSnapDistance(10);
    expect(useUiStore.getState().modelingPointerEdgeSnapDistance).toBe(4);

    useUiStore.getState().setModelingPointerGridSnapStep(10);
    expect(useUiStore.getState().modelingPointerGridSnapStep).toBe(4);

    useUiStore.getState().setModelingPointerVertexSnapDistance(10);
    expect(useUiStore.getState().modelingPointerVertexSnapDistance).toBe(4);
  });

  it("uses and clamps the modeling pointer depth precision scale", () => {
    expect(useUiStore.getState().modelingPointerDepthPrecisionScale).toBe(0.1);

    useUiStore.getState().setModelingPointerDepthPrecisionScale(0);
    expect(useUiStore.getState().modelingPointerDepthPrecisionScale).toBe(0.01);

    useUiStore.getState().setModelingPointerDepthPrecisionScale(2);
    expect(useUiStore.getState().modelingPointerDepthPrecisionScale).toBe(1);
  });

  it("uses only the supported line angle snap steps", () => {
    expect(useUiStore.getState().modelingLineAngleSnapStepDeg).toBe(45);

    useUiStore.getState().setModelingLineAngleSnapStepDeg(15);
    expect(useUiStore.getState().modelingLineAngleSnapStepDeg).toBe(15);

    useUiStore.getState().setModelingLineAngleSnapStepDeg(22.5);
    expect(useUiStore.getState().modelingLineAngleSnapStepDeg).toBe(22.5);

    useUiStore.getState().setModelingLineAngleSnapStepDeg(22);
    expect(useUiStore.getState().modelingLineAngleSnapStepDeg).toBe(45);
  });

  it("stores rectangle mode settings", () => {
    expect(useUiStore.getState().modelingRectangleMode).toBe(
      "upright-up-fixed",
    );
    expect(useUiStore.getState().modelingRectangleFaceMode).toBe("quad");
    expect(useUiStore.getState().modelingBoxFaceMode).toBe("quad");
    expect(useUiStore.getState().modelingFaceDisplayMode).toBe("polygon");
    expect(useUiStore.getState().modelingObjExportFaceMode).toBe("polygon");

    useUiStore.getState().setModelingRectangleMode("flat-xz");
    useUiStore.getState().setModelingRectangleFaceMode("triangles");
    useUiStore.getState().setModelingBoxFaceMode("triangles");
    useUiStore.getState().setModelingFaceDisplayMode("triangulated");
    useUiStore.getState().setModelingObjExportFaceMode("triangulated");

    expect(useUiStore.getState().modelingRectangleMode).toBe("flat-xz");
    expect(useUiStore.getState().modelingRectangleFaceMode).toBe("triangles");
    expect(useUiStore.getState().modelingBoxFaceMode).toBe("triangles");
    expect(useUiStore.getState().modelingFaceDisplayMode).toBe("triangulated");
    expect(useUiStore.getState().modelingObjExportFaceMode).toBe(
      "triangulated",
    );
  });

  it("resets line preview when switching modeling tools", () => {
    useUiStore.getState().setModelingLinePreview({
      currentPosition: [1, 1, 1],
      currentSnapped: true,
      planeNormal: [0, 0, 1],
      polygonPoints: [],
      startSnapped: false,
      startPosition: [0, 0, 0],
      tool: "line",
      wireframeEdges: [],
    });

    useUiStore.getState().setModelingTool("camera");

    expect(useUiStore.getState().modelingLinePreview.active).toBe(false);
  });

  it("resets lasso overlay when switching modeling tools", () => {
    useUiStore.getState().setModelingLassoSelection({
      phase: "settled",
      points: [
        [10, 10],
        [50, 12],
        [24, 48],
      ],
    });

    useUiStore.getState().setModelingTool("vertex");

    expect(useUiStore.getState().modelingLassoSelection).toEqual({
      phase: "idle",
      points: [],
    });
  });
});
