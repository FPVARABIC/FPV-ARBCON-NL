import React, { useEffect, useRef } from 'react';
import {
  meshForAirframe,
  projectAirframeMesh,
  projectMeshPoint,
} from './meshProjection';
import type { OrientationRendererProps } from './OrientationFallback.web';
import { colors } from '../theme';
/** CPU fallback renders the same actual mesh when a browser has no WebGL context. */
export function CanvasMeshRenderer({
  orientation,
  width,
  height,
  stale,
  airframe,
}: OrientationRendererProps): React.JSX.Element | null {
  const canvas = useRef<HTMLCanvasElement>(null),
    mesh = meshForAirframe(airframe);
  useEffect(() => {
    const el = canvas.current;
    if (!el || !mesh) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
    el.width = width * ratio;
    el.height = height * ratio;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.fillStyle = colors.backgroundRaised;
    ctx.fillRect(0, 0, width, height);
    ctx.lineWidth = 0.65;
    ctx.strokeStyle = colors.borderSoft;
    for (let i = -12; i <= 12; i++) {
      for (const along of [true, false]) {
        const a = projectMeshPoint(
            { x: along ? -1.8 : i * 0.15, y: -0.4, z: along ? i * 0.15 : -1.8 },
            width,
            height,
          ),
          b = projectMeshPoint(
            { x: along ? 1.8 : i * 0.15, y: -0.4, z: along ? i * 0.15 : 1.8 },
            width,
            height,
          );
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = stale ? 0.4 : 1;
    for (const face of projectAirframeMesh(mesh, orientation, width, height)) {
      ctx.beginPath();
      ctx.moveTo(face.points[0].x, face.points[0].y);
      ctx.lineTo(face.points[1].x, face.points[1].y);
      ctx.lineTo(face.points[2].x, face.points[2].y);
      ctx.closePath();
      ctx.fillStyle = face.color;
      ctx.fill();
      ctx.strokeStyle = face.color;
      ctx.lineWidth = 0.35;
      ctx.stroke();
    }
  }, [
    orientation,
    width,
    height,
    stale,
    mesh,
  ]);
  return mesh ? (
    <canvas
      ref={canvas}
      width={width}
      height={height}
      style={{ width, height, display: 'block' }}
      aria-hidden="true"
      data-testid="orientation-mesh-canvas"
    />
  ) : null;
}
