import { Grid, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import {
  BufferGeometry,
  CircleGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  MOUSE,
  PointsMaterial,
  Raycaster,
  Vector2,
  Vector3,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useModelingStore } from "../store/modelingStore";
import { getEffectiveModelingTool, useUiStore } from "../store/uiStore";

const CURSOR_DEPTH_STEP = 0.45;
const CAMERA_DOLLY_STEP = 0.55;
const CAMERA_DOLLY_MIN_DISTANCE = 2.4;
const POINTER_AXIS_LENGTH = 1.25;
const POINTER_AXIS_DASH_EXTENT = 120;
const POINTER_AXIS_DASH_SIZE = 0.18;
const POINTER_AXIS_GAP_SIZE = 0.08;
const MODEL_VERTEX_PIXEL_SIZE = 4;

function createLineSegments(points: number[], material: LineBasicMaterial) {
  const geometry = new BufferGeometry();
  if (points.length > 0) {
    geometry.setAttribute("position", new Float32BufferAttribute(points, 3));
  }

  return new LineSegments(geometry, material);
}

function createDashedLineSegments(
  points: number[],
  material: LineDashedMaterial,
) {
  const line = createLineSegments(points, material);
  line.computeLineDistances();
  return line;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;
  return (
    target.isContentEditable ||
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT"
  );
}

function ModelingPointer() {
  const hovered = useUiStore((state) => state.modelingPointer.hovered);
  const modelingCameraDragging = useUiStore(
    (state) => state.modelingCameraDragging,
  );
  const modelingCameraOverride = useUiStore(
    (state) => state.modelingCameraOverride,
  );
  const modelingPointerVisibleInCameraTool = useUiStore(
    (state) => state.modelingPointerVisibleInCameraTool,
  );
  const modelingTool = useUiStore((state) => state.modelingTool);
  const plane = useUiStore((state) => state.modelingPointer.plane);
  const position = useUiStore((state) => state.modelingPointer.position);
  const panelRadius = useUiStore((state) => state.modelingPointerPanelRadius);
  const verticalAxisFloorY = useUiStore(
    (state) => state.modelingPointerVerticalAxisFloorY,
  );
  const effectiveTool = getEffectiveModelingTool({
    modelingCameraDragging,
    modelingCameraOverride,
    modelingTool,
  });
  const xAxisLine = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(
        [-POINTER_AXIS_LENGTH, 0, 0, POINTER_AXIS_LENGTH, 0, 0],
        3,
      ),
    );
    const material = new LineBasicMaterial({ color: "#f87171" });
    return new LineSegments(geometry, material);
  }, []);
  const yAxisLine = useMemo(() => {
    const clipLocalY = verticalAxisFloorY - position[1];
    const visibleStart = Math.max(-POINTER_AXIS_LENGTH, clipLocalY);
    const points =
      visibleStart < POINTER_AXIS_LENGTH
        ? [0, visibleStart, 0, 0, POINTER_AXIS_LENGTH, 0]
        : [];
    const material = new LineBasicMaterial({ color: "#84cc16" });
    return createLineSegments(points, material);
  }, [position, verticalAxisFloorY]);
  const zAxisLine = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(
        [0, 0, -POINTER_AXIS_LENGTH, 0, 0, POINTER_AXIS_LENGTH],
        3,
      ),
    );
    const material = new LineBasicMaterial({ color: "#60a5fa" });
    return new LineSegments(geometry, material);
  }, []);
  const xAxisDashLine = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(
        [
          -POINTER_AXIS_DASH_EXTENT,
          0,
          0,
          -POINTER_AXIS_LENGTH,
          0,
          0,
          POINTER_AXIS_LENGTH,
          0,
          0,
          POINTER_AXIS_DASH_EXTENT,
          0,
          0,
        ],
        3,
      ),
    );
    const material = new LineDashedMaterial({
      color: "#fca5a5",
      dashSize: POINTER_AXIS_DASH_SIZE,
      gapSize: POINTER_AXIS_GAP_SIZE,
      opacity: 0.7,
      transparent: true,
    });
    const line = new LineSegments(geometry, material);
    line.computeLineDistances();
    return line;
  }, []);
  const yAxisDashLine = useMemo(() => {
    const clipLocalY = verticalAxisFloorY - position[1];
    const points: number[] = [];
    const lowerDashStart = Math.max(-POINTER_AXIS_DASH_EXTENT, clipLocalY);
    if (lowerDashStart < -POINTER_AXIS_LENGTH) {
      points.push(0, lowerDashStart, 0, 0, -POINTER_AXIS_LENGTH, 0);
    }

    const upperDashStart = Math.max(POINTER_AXIS_LENGTH, clipLocalY);
    if (upperDashStart < POINTER_AXIS_DASH_EXTENT) {
      points.push(0, upperDashStart, 0, 0, POINTER_AXIS_DASH_EXTENT, 0);
    }

    const material = new LineDashedMaterial({
      color: "#bef264",
      dashSize: POINTER_AXIS_DASH_SIZE,
      gapSize: POINTER_AXIS_GAP_SIZE,
      opacity: 0.7,
      transparent: true,
    });
    return createDashedLineSegments(points, material);
  }, [position, verticalAxisFloorY]);
  const zAxisDashLine = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(
        [
          0,
          0,
          -POINTER_AXIS_DASH_EXTENT,
          0,
          0,
          -POINTER_AXIS_LENGTH,
          0,
          0,
          POINTER_AXIS_LENGTH,
          0,
          0,
          POINTER_AXIS_DASH_EXTENT,
        ],
        3,
      ),
    );
    const material = new LineDashedMaterial({
      color: "#93c5fd",
      dashSize: POINTER_AXIS_DASH_SIZE,
      gapSize: POINTER_AXIS_GAP_SIZE,
      opacity: 0.7,
      transparent: true,
    });
    const line = new LineSegments(geometry, material);
    line.computeLineDistances();
    return line;
  }, []);
  const panelGeometry = useMemo(
    () => new CircleGeometry(panelRadius, 48),
    [panelRadius],
  );

  useEffect(() => {
    return () => {
      xAxisLine.geometry.dispose();
      xAxisLine.material.dispose();
      yAxisLine.geometry.dispose();
      yAxisLine.material.dispose();
      zAxisLine.geometry.dispose();
      zAxisLine.material.dispose();
      xAxisDashLine.geometry.dispose();
      xAxisDashLine.material.dispose();
      yAxisDashLine.geometry.dispose();
      yAxisDashLine.material.dispose();
      zAxisDashLine.geometry.dispose();
      zAxisDashLine.material.dispose();
      panelGeometry.dispose();
    };
  }, [
    panelGeometry,
    xAxisDashLine,
    xAxisLine,
    yAxisDashLine,
    yAxisLine,
    zAxisDashLine,
    zAxisLine,
  ]);

  if (
    !hovered ||
    (effectiveTool === "camera" && !modelingPointerVisibleInCameraTool)
  ) {
    return null;
  }

  return (
    <group position={position}>
      <primitive object={xAxisDashLine} renderOrder={8} />
      <primitive object={yAxisDashLine} renderOrder={8} />
      <primitive object={zAxisDashLine} renderOrder={8} />
      <primitive object={xAxisLine} renderOrder={10} />
      <primitive object={yAxisLine} renderOrder={10} />
      <primitive object={zAxisLine} renderOrder={10} />
      {plane === "horizontal" ? (
        <mesh
          geometry={panelGeometry}
          position={[0, 0.001, 0]}
          renderOrder={9}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <meshBasicMaterial
            color="#7dd3fc"
            depthTest={false}
            opacity={0.3}
            side={DoubleSide}
            transparent
          />
        </mesh>
      ) : null}
      {plane === "vertical" ? (
        <mesh geometry={panelGeometry} renderOrder={9}>
          <meshBasicMaterial
            color="#fbbf24"
            depthTest={false}
            opacity={0.28}
            side={DoubleSide}
            transparent
          />
        </mesh>
      ) : null}
    </group>
  );
}

function getVertexSelectionDistance(
  cameraPosition: Vector3,
  pointerPosition: [number, number, number],
) {
  const pointerVector = new Vector3(...pointerPosition);
  return Math.max(
    0.28,
    Math.min(cameraPosition.distanceTo(pointerVector) * 0.04, 0.8),
  );
}

function ModelingMesh() {
  const currentModelId = useModelingStore((state) => state.currentModelId);
  const modelsById = useModelingStore((state) => state.modelsById);
  const selectedVertexIds = useModelingStore(
    (state) => state.selectedVertexIds,
  );
  const activeModel = modelsById[currentModelId];
  const selectedVertexSet = useMemo(
    () => new Set(selectedVertexIds),
    [selectedVertexIds],
  );
  const edgeGeometry = useMemo(() => {
    const geometry = new BufferGeometry();
    if (!activeModel || activeModel.edgeOrder.length === 0) {
      return geometry;
    }

    const positions = activeModel.edgeOrder.flatMap((edgeId) => {
      const edge = activeModel.edgesById[edgeId];
      return edge.vertexIds.flatMap(
        (vertexId) => activeModel.verticesById[vertexId].position,
      );
    });

    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return geometry;
  }, [activeModel]);
  const faceGeometry = useMemo(() => {
    const geometry = new BufferGeometry();
    if (!activeModel || activeModel.faceOrder.length === 0) {
      return geometry;
    }

    const positions = activeModel.faceOrder.flatMap((faceId) => {
      const face = activeModel.facesById[faceId];
      return face.vertexIds.flatMap(
        (vertexId) => activeModel.verticesById[vertexId].position,
      );
    });

    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    return geometry;
  }, [activeModel]);
  const vertexGeometry = useMemo(() => {
    const geometry = new BufferGeometry();
    if (!activeModel) {
      return geometry;
    }

    const positions = activeModel.vertexOrder.flatMap((vertexId) => {
      if (selectedVertexSet.has(vertexId)) {
        return [];
      }

      return activeModel.verticesById[vertexId].position;
    });

    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return geometry;
  }, [activeModel, selectedVertexSet]);
  const selectedVertexGeometry = useMemo(() => {
    const geometry = new BufferGeometry();
    if (!activeModel) {
      return geometry;
    }

    const positions = activeModel.vertexOrder.flatMap((vertexId) =>
      selectedVertexSet.has(vertexId)
        ? activeModel.verticesById[vertexId].position
        : [],
    );

    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return geometry;
  }, [activeModel, selectedVertexSet]);
  const vertexMaterial = useMemo(
    () =>
      new PointsMaterial({
        color: "#000000",
        size: MODEL_VERTEX_PIXEL_SIZE,
        sizeAttenuation: false,
      }),
    [],
  );
  const selectedVertexMaterial = useMemo(
    () =>
      new PointsMaterial({
        color: "#ffffff",
        size: MODEL_VERTEX_PIXEL_SIZE,
        sizeAttenuation: false,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      edgeGeometry.dispose();
      faceGeometry.dispose();
      vertexGeometry.dispose();
      selectedVertexGeometry.dispose();
      vertexMaterial.dispose();
      selectedVertexMaterial.dispose();
    };
  }, [
    edgeGeometry,
    faceGeometry,
    selectedVertexGeometry,
    selectedVertexMaterial,
    vertexGeometry,
    vertexMaterial,
  ]);

  if (!activeModel) {
    return null;
  }

  return (
    <group>
      {activeModel.faceOrder.length > 0 ? (
        <mesh geometry={faceGeometry} renderOrder={3}>
          <meshStandardMaterial
            color="#2563eb"
            opacity={0.42}
            side={DoubleSide}
            transparent
          />
        </mesh>
      ) : null}
      {activeModel.edgeOrder.length > 0 ? (
        <lineSegments geometry={edgeGeometry} renderOrder={4}>
          <lineBasicMaterial color="#bfdbfe" />
        </lineSegments>
      ) : null}
      <points
        geometry={vertexGeometry}
        material={vertexMaterial}
        renderOrder={6}
      />
      <points
        geometry={selectedVertexGeometry}
        material={selectedVertexMaterial}
        renderOrder={7}
      />
    </group>
  );
}

function ModelingInputController({
  controlsRef,
}: {
  controlsRef: RefObject<OrbitControlsImpl | null>;
}) {
  const { camera, gl } = useThree();
  const addVertex = useModelingStore((state) => state.addVertex);
  const clearVertexSelection = useModelingStore(
    (state) => state.clearVertexSelection,
  );
  const selectNearestVertex = useModelingStore(
    (state) => state.selectNearestVertex,
  );
  const setModelingPointerDepth = useUiStore(
    (state) => state.setModelingPointerDepth,
  );
  const setModelingPointerHovered = useUiStore(
    (state) => state.setModelingPointerHovered,
  );
  const setModelingCameraDragging = useUiStore(
    (state) => state.setModelingCameraDragging,
  );
  const setModelingPointerPlane = useUiStore(
    (state) => state.setModelingPointerPlane,
  );
  const setModelingPointerPosition = useUiStore(
    (state) => state.setModelingPointerPosition,
  );

  useEffect(() => {
    const element = gl.domElement;
    const raycaster = new Raycaster();
    const ndc = new Vector2(0, 0);
    let hasPointer = false;
    let cameraDragButton: number | null = null;
    let clickCandidate: {
      button: number;
      moved: boolean;
      x: number;
      y: number;
    } | null = null;

    const updatePointerPosition = (
      depth = useUiStore.getState().modelingPointer.depth,
    ) => {
      if (!hasPointer) {
        return;
      }

      raycaster.setFromCamera(ndc, camera);
      const nextPosition = raycaster.ray.origin
        .clone()
        .add(raycaster.ray.direction.clone().multiplyScalar(depth));

      setModelingPointerPosition([
        nextPosition.x,
        nextPosition.y,
        nextPosition.z,
      ]);
    };

    const updatePointerFromEvent = (event: PointerEvent | WheelEvent) => {
      const rect = element.getBoundingClientRect();

      ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      hasPointer = true;
      setModelingPointerHovered(true);
      updatePointerPosition();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (
        clickCandidate &&
        Math.hypot(
          event.clientX - clickCandidate.x,
          event.clientY - clickCandidate.y,
        ) > 5
      ) {
        clickCandidate = {
          ...clickCandidate,
          moved: true,
        };
      }

      updatePointerFromEvent(event);
    };

    const handlePointerLeave = () => {
      hasPointer = false;
      clickCandidate = null;
      setModelingPointerHovered(false);
    };

    const handlePointerDown = (event: PointerEvent) => {
      const effectiveTool = getEffectiveModelingTool(useUiStore.getState());

      if (event.button === 0 && effectiveTool !== "camera") {
        clickCandidate = {
          button: event.button,
          moved: false,
          x: event.clientX,
          y: event.clientY,
        };
      }

      if (
        effectiveTool === "camera" &&
        (event.button === 0 || event.button === 2)
      ) {
        cameraDragButton = event.button;
        setModelingCameraDragging(true);
      }

      updatePointerFromEvent(event);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (cameraDragButton === event.button) {
        cameraDragButton = null;
        setModelingCameraDragging(false);
      }

      if (
        clickCandidate &&
        clickCandidate.button === event.button &&
        !clickCandidate.moved &&
        event.button === 0
      ) {
        const { modelingPointer, modelingTool } = useUiStore.getState();

        if (modelingTool === "vertex") {
          addVertex([...modelingPointer.position]);
        } else if (modelingTool === "select") {
          selectNearestVertex(
            modelingPointer.position,
            event.shiftKey,
            getVertexSelectionDistance(
              camera.position,
              modelingPointer.position,
            ),
          );
        }
      }

      clickCandidate = null;
    };

    const handleWheel = (event: WheelEvent) => {
      updatePointerFromEvent(event);
      event.preventDefault();

      if (getEffectiveModelingTool(useUiStore.getState()) === "camera") {
        const forward = new Vector3();
        camera.getWorldDirection(forward);
        const nextStep =
          event.deltaY < 0 ? CAMERA_DOLLY_STEP : -CAMERA_DOLLY_STEP;
        const controls = controlsRef.current;
        const target = controls?.target.clone() ?? new Vector3();
        const cameraOffset = forward.clone().multiplyScalar(nextStep);
        const nextCameraPosition = camera.position.clone().add(cameraOffset);

        if (
          nextCameraPosition.distanceTo(target) <= CAMERA_DOLLY_MIN_DISTANCE
        ) {
          return;
        }

        camera.position.copy(nextCameraPosition);
        controls?.target.add(cameraOffset);
        controls?.update();
        updatePointerPosition();
        return;
      }

      const direction = event.deltaY < 0 ? 1 : -1;
      const nextDepth =
        useUiStore.getState().modelingPointer.depth +
        direction * CURSOR_DEPTH_STEP;
      setModelingPointerDepth(nextDepth);
      updatePointerPosition(nextDepth);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      if (event.key === "1") {
        setModelingPointerPlane("none");
      } else if (event.key === "2") {
        setModelingPointerPlane("horizontal");
      } else if (event.key === "3") {
        setModelingPointerPlane("vertical");
      } else if (event.key === "Escape") {
        clearVertexSelection();
      }
    };

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    element.addEventListener("pointermove", handlePointerMove);
    element.addEventListener("pointerleave", handlePointerLeave);
    element.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    element.addEventListener("wheel", handleWheel, { passive: false });
    element.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      element.removeEventListener("pointermove", handlePointerMove);
      element.removeEventListener("pointerleave", handlePointerLeave);
      element.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      element.removeEventListener("wheel", handleWheel);
      element.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
      setModelingCameraDragging(false);
      setModelingPointerHovered(false);
      clearVertexSelection();
    };
  }, [
    addVertex,
    camera,
    clearVertexSelection,
    controlsRef,
    gl,
    selectNearestVertex,
    setModelingCameraDragging,
    setModelingPointerDepth,
    setModelingPointerHovered,
    setModelingPointerPlane,
    setModelingPointerPosition,
  ]);

  return null;
}

function ModelingCameraController({
  controlsRef,
}: {
  controlsRef: RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  const setModelingCamera = useUiStore((state) => state.setModelingCamera);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) {
      return;
    }

    const { modelingCamera } = useUiStore.getState();

    camera.position.set(...modelingCamera.position);
    controls.target.set(...modelingCamera.target);
    controls.update();

    const syncCamera = () => {
      setModelingCamera({
        position: [camera.position.x, camera.position.y, camera.position.z],
        target: [controls.target.x, controls.target.y, controls.target.z],
      });
    };

    syncCamera();
    controls.addEventListener("change", syncCamera);

    return () => {
      syncCamera();
      controls.removeEventListener("change", syncCamera);
    };
  }, [camera, controlsRef, setModelingCamera]);

  return null;
}

export function ModelingScene() {
  const modelingCameraDragging = useUiStore(
    (state) => state.modelingCameraDragging,
  );
  const modelingCameraOverride = useUiStore(
    (state) => state.modelingCameraOverride,
  );
  const modelingTool = useUiStore((state) => state.modelingTool);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const effectiveTool = getEffectiveModelingTool({
    modelingCameraDragging,
    modelingCameraOverride,
    modelingTool,
  });
  const sceneShellBackground = useMemo(() => {
    const base = new Color("#b5bec8");
    const upper = base.clone().lerp(new Color("#c7d0da"), 0.18);
    const lower = base.clone().lerp(new Color("#596473"), 0.74);

    return `radial-gradient(circle at top, rgba(${Math.round(
      upper.r * 255,
    )}, ${Math.round(upper.g * 255)}, ${Math.round(
      upper.b * 255,
    )}, 0.22), transparent 42%), linear-gradient(180deg, #9ba7b3 0%, #7f8c99 42%, #${lower.getHexString()} 100%)`;
  }, []);

  return (
    <div
      className="h-full min-h-0 w-full overflow-hidden border border-white/12 shadow-[0_18px_40px_rgba(3,10,20,0.22)]"
      style={{ background: sceneShellBackground }}
    >
      <Canvas
        camera={{ fov: 42, position: [8.8, 6.4, 9.4] }}
        dpr={[1, 1.8]}
        shadows
      >
        <color attach="background" args={["#74808d"]} />
        <ambientLight intensity={0.96} />
        <hemisphereLight
          args={["#e8edf3", "#47515f", 1.14]}
          position={[0, 12, 0]}
        />
        <directionalLight
          castShadow
          color="#eef3f8"
          intensity={1.8}
          position={[10, 14, 6]}
          shadow-mapSize-height={2048}
          shadow-mapSize-width={2048}
        />
        <Grid
          args={[200, 200]}
          cellColor="#d7dee7"
          cellSize={1}
          cellThickness={0.85}
          fadeDistance={160}
          fadeStrength={1.4}
          followCamera
          infiniteGrid
          position={[0, 0, 0]}
          sectionColor="#ffffff"
          sectionSize={5}
          sectionThickness={1.35}
        />
        <ModelingMesh />
        <ModelingPointer />
        <ModelingInputController controlsRef={controlsRef} />
        <ModelingCameraController controlsRef={controlsRef} />
        <OrbitControls
          enableDamping={false}
          enabled={effectiveTool === "camera"}
          enablePan={effectiveTool === "camera"}
          enableRotate={effectiveTool === "camera"}
          enableZoom={false}
          mouseButtons={{
            LEFT: MOUSE.ROTATE,
            MIDDLE: MOUSE.PAN,
            RIGHT: MOUSE.PAN,
          }}
          ref={controlsRef}
          target={[0, 1.1, 0]}
        />
      </Canvas>
    </div>
  );
}
