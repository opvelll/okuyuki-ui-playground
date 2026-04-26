import type { ModelingModel, ModelingSnapshot } from "../store/modelingStore";
import type { Vector3Tuple } from "../types/scene";

function sanitizeObjectName(name: string) {
  const normalized = name.trim().replace(/\s+/g, "_");
  return normalized.length > 0 ? normalized : "Model";
}

function formatNumber(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

function rotateX([x, y, z]: Vector3Tuple, angle: number): Vector3Tuple {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [x, y * cos - z * sin, y * sin + z * cos];
}

function rotateY([x, y, z]: Vector3Tuple, angle: number): Vector3Tuple {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [x * cos + z * sin, y, -x * sin + z * cos];
}

function rotateZ([x, y, z]: Vector3Tuple, angle: number): Vector3Tuple {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [x * cos - y * sin, x * sin + y * cos, z];
}

function transformPosition(model: ModelingModel, position: Vector3Tuple) {
  const rotated = rotateZ(
    rotateY(rotateX(position, model.rootRotation[0]), model.rootRotation[1]),
    model.rootRotation[2],
  );

  return [
    rotated[0] + model.rootPosition[0],
    rotated[1] + model.rootPosition[1],
    rotated[2] + model.rootPosition[2],
  ] satisfies Vector3Tuple;
}

export function exportModelingSnapshotToObj(snapshot: ModelingSnapshot) {
  const lines = [
    "# Exported from naname_ui",
    "# Units are scene units. Vertex coordinates include each model root transform.",
  ];
  let vertexOffset = 0;

  for (const model of Object.values(snapshot.modelsById)) {
    lines.push("", `o ${sanitizeObjectName(model.name)}`);

    const vertexIndexById = new Map<string, number>();
    for (const vertexId of model.vertexOrder) {
      const vertex = model.verticesById[vertexId];
      if (!vertex) {
        continue;
      }

      vertexIndexById.set(vertexId, vertexOffset + vertexIndexById.size + 1);
      const position = transformPosition(model, vertex.position);
      lines.push(`v ${position.map(formatNumber).join(" ")}`);
    }

    for (const faceId of model.faceOrder) {
      const face = model.facesById[faceId];
      const indices = face?.vertexIds.map((vertexId) =>
        vertexIndexById.get(vertexId),
      );
      if (indices?.every((index) => index !== undefined)) {
        lines.push(`f ${indices.join(" ")}`);
      }
    }

    for (const edgeId of model.edgeOrder) {
      const edge = model.edgesById[edgeId];
      const indices = edge?.vertexIds.map((vertexId) =>
        vertexIndexById.get(vertexId),
      );
      if (indices?.every((index) => index !== undefined)) {
        lines.push(`l ${indices.join(" ")}`);
      }
    }

    vertexOffset += vertexIndexById.size;
  }

  return `${lines.join("\n")}\n`;
}
