import type { Vector3Tuple } from "../../types/scene";

export type PenStrokeParams = {
  mergeDistance: number;
  mergeVertices: boolean;
  resampleSpacing: number;
  simplificationDistance: number;
  smoothingIterations: number;
};

const MIN_POINT_DISTANCE = 0.0001;

function getDistance(a: Vector3Tuple, b: Vector3Tuple) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function lerpPoint(a: Vector3Tuple, b: Vector3Tuple, t: number): Vector3Tuple {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

function getPointToSegmentDistance(
  point: Vector3Tuple,
  start: Vector3Tuple,
  end: Vector3Tuple,
) {
  const segment = [end[0] - start[0], end[1] - start[1], end[2] - start[2]];
  const lengthSquared =
    segment[0] * segment[0] + segment[1] * segment[1] + segment[2] * segment[2];

  if (lengthSquared === 0) {
    return getDistance(point, start);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point[0] - start[0]) * segment[0] +
        (point[1] - start[1]) * segment[1] +
        (point[2] - start[2]) * segment[2]) /
        lengthSquared,
    ),
  );

  return getDistance(point, lerpPoint(start, end, t));
}

function removeNearDuplicatePoints(points: Vector3Tuple[]) {
  return points.reduce<Vector3Tuple[]>((nextPoints, point) => {
    const previousPoint = nextPoints.at(-1);
    if (
      previousPoint &&
      getDistance(previousPoint, point) < MIN_POINT_DISTANCE
    ) {
      return nextPoints;
    }

    nextPoints.push([...point]);
    return nextPoints;
  }, []);
}

function smoothPoints(points: Vector3Tuple[], iterations: number) {
  let nextPoints = removeNearDuplicatePoints(points);
  const safeIterations = Math.max(0, Math.min(Math.round(iterations), 5));

  for (let iteration = 0; iteration < safeIterations; iteration += 1) {
    if (nextPoints.length < 3) {
      break;
    }

    const smoothedPoints: Vector3Tuple[] = [nextPoints[0]];
    for (let index = 0; index < nextPoints.length - 1; index += 1) {
      const currentPoint = nextPoints[index];
      const nextPoint = nextPoints[index + 1];
      smoothedPoints.push(
        lerpPoint(currentPoint, nextPoint, 0.25),
        lerpPoint(currentPoint, nextPoint, 0.75),
      );
    }
    smoothedPoints.push(nextPoints[nextPoints.length - 1]);
    nextPoints = smoothedPoints;
  }

  return nextPoints;
}

function simplifySection(
  points: Vector3Tuple[],
  startIndex: number,
  endIndex: number,
  tolerance: number,
  keep: boolean[],
) {
  if (endIndex <= startIndex + 1) {
    return;
  }

  let farthestIndex = -1;
  let farthestDistance = tolerance;

  for (let index = startIndex + 1; index < endIndex; index += 1) {
    const distance = getPointToSegmentDistance(
      points[index],
      points[startIndex],
      points[endIndex],
    );
    if (distance > farthestDistance) {
      farthestDistance = distance;
      farthestIndex = index;
    }
  }

  if (farthestIndex === -1) {
    return;
  }

  keep[farthestIndex] = true;
  simplifySection(points, startIndex, farthestIndex, tolerance, keep);
  simplifySection(points, farthestIndex, endIndex, tolerance, keep);
}

function simplifyPoints(points: Vector3Tuple[], tolerance: number) {
  if (points.length <= 2 || tolerance <= 0) {
    return points;
  }

  const keep = Array.from({ length: points.length }, () => false);
  keep[0] = true;
  keep[points.length - 1] = true;
  simplifySection(points, 0, points.length - 1, tolerance, keep);
  return points.filter((_, index) => keep[index]);
}

function resamplePoints(points: Vector3Tuple[], spacing: number) {
  if (points.length <= 2 || spacing <= 0) {
    return points;
  }

  const resampledPoints: Vector3Tuple[] = [points[0]];
  let distanceToNextSample = spacing;

  for (let index = 1; index < points.length; index += 1) {
    let segmentStart = points[index - 1];
    const segmentEnd = points[index];
    let segmentLength = getDistance(segmentStart, segmentEnd);

    while (segmentLength >= distanceToNextSample && segmentLength > 0) {
      const samplePoint = lerpPoint(
        segmentStart,
        segmentEnd,
        distanceToNextSample / segmentLength,
      );
      resampledPoints.push(samplePoint);
      segmentStart = samplePoint;
      segmentLength = getDistance(segmentStart, segmentEnd);
      distanceToNextSample = spacing;
    }

    distanceToNextSample -= segmentLength;
  }

  const lastPoint = points[points.length - 1];
  if (getDistance(resampledPoints[resampledPoints.length - 1], lastPoint) > 0) {
    resampledPoints.push(lastPoint);
  }

  return resampledPoints;
}

export function processPenStrokePoints(
  rawPoints: Vector3Tuple[],
  params: PenStrokeParams,
) {
  const sanitizedPoints = removeNearDuplicatePoints(rawPoints);

  if (sanitizedPoints.length < 2) {
    return [];
  }

  return removeNearDuplicatePoints(
    resamplePoints(
      simplifyPoints(
        smoothPoints(sanitizedPoints, params.smoothingIterations),
        Math.max(0, params.simplificationDistance),
      ),
      Math.max(0, params.resampleSpacing),
    ),
  );
}
