import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useModelingStore } from "../store/modelingStore";
import type { Vector3Tuple } from "../types/scene";

const axisLabels = ["X", "Y", "Z"] as const;

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}

function toDegrees(radians: number) {
  return (radians * 180) / Math.PI;
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function getCenterPosition(positions: Vector3Tuple[]): Vector3Tuple {
  if (positions.length === 0) {
    return [0, 0, 0];
  }

  return positions.reduce<Vector3Tuple>(
    (center, position) => [
      center[0] + position[0] / positions.length,
      center[1] + position[1] / positions.length,
      center[2] + position[2] / positions.length,
    ],
    [0, 0, 0],
  );
}

function AxisNumberInput({
  label,
  onCommit,
  value,
}: {
  label: string;
  onCommit: (value: number) => void;
  value: number;
}) {
  const [draft, setDraft] = useState(formatNumber(value));

  useEffect(() => {
    setDraft(formatNumber(value));
  }, [value]);

  const commitDraft = () => {
    const parsedValue = Number(draft);
    if (!Number.isFinite(parsedValue)) {
      setDraft(formatNumber(value));
      return;
    }

    onCommit(parsedValue);
  };

  return (
    <label className="grid min-w-0 gap-1 text-[0.56rem] font-bold uppercase tracking-[0.16em] text-slate-400">
      {label}
      <input
        className="h-8 min-w-0 border border-white/10 bg-slate-950/72 px-2 text-[0.72rem] font-semibold tracking-normal text-slate-100 outline-none transition focus:border-sky-300/55"
        inputMode="decimal"
        onBlur={commitDraft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
        type="text"
        value={draft}
      />
    </label>
  );
}

function Vector3Editor({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: Vector3Tuple) => void;
  value: Vector3Tuple;
}) {
  return (
    <section className="grid gap-2">
      <h3 className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-slate-300">
        {label}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {axisLabels.map((axisLabel, axisIndex) => (
          <AxisNumberInput
            key={axisLabel}
            label={axisLabel}
            onCommit={(nextValue) => {
              const nextVector = [...value] as Vector3Tuple;
              nextVector[axisIndex] = nextValue;
              onChange(nextVector);
            }}
            value={value[axisIndex]}
          />
        ))}
      </div>
    </section>
  );
}

function RotationEditor({
  onChange,
  value,
}: {
  onChange: (value: Vector3Tuple) => void;
  value: Vector3Tuple;
}) {
  const degreeValue = useMemo(
    () => value.map(toDegrees) as Vector3Tuple,
    [value],
  );

  return (
    <Vector3Editor
      label="Root Rotation"
      onChange={(nextDegrees) =>
        onChange(nextDegrees.map(toRadians) as Vector3Tuple)
      }
      value={degreeValue}
    />
  );
}

export function ModelingInspectorWindow() {
  const [open, setOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth >= 768,
  );
  const currentModelId = useModelingStore((state) => state.currentModelId);
  const modelsById = useModelingStore((state) => state.modelsById);
  const selectedEdgeIds = useModelingStore((state) => state.selectedEdgeIds);
  const selectedFaceIds = useModelingStore((state) => state.selectedFaceIds);
  const selectedRoot = useModelingStore((state) => state.selectedRoot);
  const selectedVertexIds = useModelingStore(
    (state) => state.selectedVertexIds,
  );
  const renameCurrentModel = useModelingStore(
    (state) => state.renameCurrentModel,
  );
  const updateCurrentModelRootPosition = useModelingStore(
    (state) => state.updateCurrentModelRootPosition,
  );
  const updateCurrentModelRootRotation = useModelingStore(
    (state) => state.updateCurrentModelRootRotation,
  );
  const updateSelectedVerticesCenter = useModelingStore(
    (state) => state.updateSelectedVerticesCenter,
  );
  const updateVertexPosition = useModelingStore(
    (state) => state.updateVertexPosition,
  );
  const activeModel = modelsById[currentModelId];
  const [nameDraft, setNameDraft] = useState(activeModel?.name ?? "");

  useEffect(() => {
    setNameDraft(activeModel?.name ?? "");
  }, [activeModel?.name]);

  if (!activeModel) {
    return null;
  }

  const selectedVertices = selectedVertexIds
    .map((vertexId) => activeModel.verticesById[vertexId])
    .filter((vertex) => vertex !== undefined);
  const selectedVerticesCenter = getCenterPosition(
    selectedVertices.map((vertex) => vertex.position),
  );

  return (
    <aside
      className={`absolute right-3 top-32 z-20 max-h-[calc(100%-8.75rem)] border border-white/12 bg-slate-950/84 text-slate-100 shadow-[0_14px_28px_rgba(3,10,20,0.26)] backdrop-blur transition md:right-4 md:top-28 ${
        open ? "w-72" : "w-11"
      }`}
    >
      <button
        aria-expanded={open}
        aria-label={
          open ? "Collapse object inspector" : "Expand object inspector"
        }
        className="flex h-11 w-full items-center justify-center border-b border-white/8 text-slate-200 transition hover:bg-white/[0.05]"
        onClick={() => setOpen(!open)}
        title={open ? "Collapse object inspector" : "Expand object inspector"}
        type="button"
      >
        {open ? (
          <ChevronRight
            aria-hidden="true"
            className="h-4 w-4"
            strokeWidth={2}
          />
        ) : (
          <ChevronLeft aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
        )}
      </button>
      {open ? (
        <div className="grid max-h-[calc(100vh-8.5rem)] gap-4 overflow-y-auto px-3 py-3">
          <label className="grid gap-1.5">
            <span className="text-[0.58rem] font-bold uppercase tracking-[0.2em] text-slate-400">
              Object Name
            </span>
            <input
              className="h-9 border border-white/10 bg-slate-950/72 px-2 text-[0.78rem] font-semibold text-slate-50 outline-none transition focus:border-sky-300/55"
              onBlur={() => {
                const nextName = nameDraft.trim();
                if (nextName.length === 0) {
                  setNameDraft(activeModel.name);
                  return;
                }

                renameCurrentModel(nextName);
                setNameDraft(nextName);
              }}
              onChange={(event) => setNameDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
              value={nameDraft}
            />
          </label>
          <div className="grid grid-cols-3 gap-2 border-y border-white/8 py-2 text-center">
            <div>
              <p className="text-[0.56rem] uppercase tracking-[0.16em] text-slate-500">
                Vertices
              </p>
              <p className="text-sm font-semibold">
                {activeModel.vertexOrder.length}
              </p>
            </div>
            <div>
              <p className="text-[0.56rem] uppercase tracking-[0.16em] text-slate-500">
                Edges
              </p>
              <p className="text-sm font-semibold">
                {activeModel.edgeOrder.length}
              </p>
            </div>
            <div>
              <p className="text-[0.56rem] uppercase tracking-[0.16em] text-slate-500">
                Faces
              </p>
              <p className="text-sm font-semibold">
                {activeModel.faceOrder.length}
              </p>
            </div>
          </div>
          {selectedRoot ? (
            <div className="grid gap-4">
              <p className="text-[0.66rem] font-semibold text-red-200">
                Root selected
              </p>
              <Vector3Editor
                label="Root Position"
                onChange={updateCurrentModelRootPosition}
                value={activeModel.rootPosition}
              />
              <RotationEditor
                onChange={updateCurrentModelRootRotation}
                value={activeModel.rootRotation}
              />
            </div>
          ) : selectedVertices.length > 0 ? (
            <div className="grid gap-3">
              <p className="text-[0.66rem] font-semibold text-sky-100">
                {selectedVertices.length} vertex selected
              </p>
              {selectedVertices.length === 1 ? (
                <Vector3Editor
                  label={selectedVertices[0].id}
                  onChange={(position) =>
                    updateVertexPosition(selectedVertices[0].id, position)
                  }
                  value={selectedVertices[0].position}
                />
              ) : (
                <Vector3Editor
                  label="Selection Center"
                  onChange={updateSelectedVerticesCenter}
                  value={selectedVerticesCenter}
                />
              )}
            </div>
          ) : selectedEdgeIds.length > 0 || selectedFaceIds.length > 0 ? (
            <div className="grid gap-2">
              {selectedEdgeIds.length > 0 ? (
                <p className="text-[0.66rem] font-semibold text-orange-100">
                  {selectedEdgeIds.length} edge selected
                </p>
              ) : null}
              {selectedFaceIds.length > 0 ? (
                <p className="text-[0.66rem] font-semibold text-orange-100">
                  {selectedFaceIds.length} face selected
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-[0.68rem] leading-5 text-slate-400">
              Select the red root dot, a vertex, an edge, or a face.
            </p>
          )}
        </div>
      ) : null}
    </aside>
  );
}
