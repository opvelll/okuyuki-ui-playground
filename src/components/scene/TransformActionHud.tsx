import { Html } from "@react-three/drei";
import { Move3d, Rotate3d } from "lucide-react";
import type { SceneObject, Vector3Tuple } from "../../types/scene";

const hudButtonClasses =
  "inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/18 bg-slate-950/74 text-slate-100 shadow-[0_10px_26px_rgba(3,10,20,0.28)] transition hover:bg-sky-300/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200";

const getHudPosition = (sceneObject: SceneObject): Vector3Tuple => [
  sceneObject.position[0],
  sceneObject.position[1] + sceneObject.scale[1] * 0.72 + 0.55,
  sceneObject.position[2],
];

export function TransformActionHud({
  onMoveClick,
  onRotateClick,
  selectedObject,
  visible,
}: {
  onMoveClick: () => void;
  onRotateClick: () => void;
  selectedObject: SceneObject | null;
  visible: boolean;
}) {
  if (!visible || !selectedObject) {
    return null;
  }

  return (
    <Html
      center
      distanceFactor={9}
      occlude={false}
      position={getHudPosition(selectedObject)}
      zIndexRange={[60, 40]}
    >
      <div
        aria-label="Selected object transform actions"
        className="flex items-center gap-3"
        onPointerDown={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        role="toolbar"
      >
        <button
          aria-label="Move selected object"
          className={hudButtonClasses}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onMoveClick();
          }}
          title="Move"
          type="button"
        >
          <Move3d aria-hidden={true} className="h-5 w-5" />
        </button>
        <button
          aria-label="Rotate selected object"
          className={hudButtonClasses}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onRotateClick();
          }}
          title="Rotate"
          type="button"
        >
          <Rotate3d aria-hidden={true} className="h-5 w-5" />
        </button>
      </div>
    </Html>
  );
}
