export type TriangleVertexIds = [string, string, string];

export function triangulateFaceVertexIds(
  vertexIds: string[],
): TriangleVertexIds[] {
  return triangulateFaceItems(vertexIds);
}

export function getTriangulatedInternalEdges(vertexIds: string[]) {
  if (vertexIds.length <= 3) {
    return [];
  }

  return vertexIds.slice(2, -1).map((vertexId) => [vertexIds[0], vertexId]);
}

export function triangulateFaceItems<T>(items: T[]): Array<[T, T, T]> {
  if (items.length < 3) {
    return [];
  }

  const triangles: Array<[T, T, T]> = [];
  for (let index = 1; index < items.length - 1; index += 1) {
    triangles.push([items[0], items[index], items[index + 1]]);
  }

  return triangles;
}
