import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ACESFilmicToneMapping,
  Box3,
  DirectionalLight,
  GridHelper,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  Sphere,
  Vector3,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OrientationRenderer as ProjectedOrientation } from './OrientationFallback.web';
import type { OrientationRendererProps } from './OrientationFallback.web';
import { rotateBodyPoint } from './droneSceneGeometry';
import { modelAssetFor } from './modelAssets.web';
import { CanvasMeshRenderer } from './CanvasMeshRenderer.web';
import { meshForAirframe } from './meshProjection';
import { colors } from '../theme';
import { orientationRenderObserver } from './orientationRenderObserver';
import { orientationLatencyTracker } from './orientationLatencyDebugLog';
export type { OrientationRendererProps } from './OrientationFallback.web';

type SceneHandle = {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  body: Group;
  controls: OrbitControls;
  render: () => void;
};

/** Real glTF mesh rendering, event-driven by the same genuine pose as the readouts.
 * Camera interaction changes only the view. It never writes attitude or FC state. */
export function OrientationRenderer(
  props: OrientationRendererProps,
): React.JSX.Element {
  const {
    orientation,
    width,
    height,
    stale = false,
    airframe,
    sampleIdentity,
  } = props;
  const asset = modelAssetFor(airframe);
  const mount = useRef<HTMLDivElement>(null);
  const engine = useRef<SceneHandle | undefined>(undefined);
  const latest = useRef(props);
  latest.current = props;
  const [ready, setReady] = useState(false);
  const applyPose = useCallback(() => {
    const h = engine.current;
    if (!h) return;
    const p = latest.current;
    const x = rotateBodyPoint({ x: 1, y: 0, z: 0 }, p.orientation);
    const y = rotateBodyPoint({ x: 0, y: 1, z: 0 }, p.orientation);
    const z = rotateBodyPoint({ x: 0, y: 0, z: 1 }, p.orientation);
    h.body.matrix.set(
      x.x,
      y.x,
      z.x,
      0,
      x.y,
      y.y,
      z.y,
      0,
      x.z,
      y.z,
      z.z,
      0,
      0,
      0,
      0,
      1,
    );
    h.body.matrixWorldNeedsUpdate = true;
    h.body.traverse(node => {
      if (node instanceof Mesh) {
        const materials = Array.isArray(node.material)
          ? node.material
          : [node.material];
        materials.forEach(material => {
          material.transparent = Boolean(p.stale);
          material.opacity = p.stale ? 0.4 : 1;
        });
      }
    });
    h.render();
  }, []);
  useEffect(() => {
    setReady(false);
    if (!asset || !mount.current) return;
    let cancelled = false;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({
        alpha: false,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(latest.current.width, latest.current.height, false);
    renderer.setClearColor(colors.backgroundRaised);
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.style.display = 'block';
    mount.current.appendChild(renderer.domElement);
    const scene = new Scene();
    scene.add(new HemisphereLight(0xffffff, 0x252c3b, 2.5));
    const key = new DirectionalLight(0xffffff, 3);
    key.position.set(-100, 180, 100);
    scene.add(key);
    const rim = new DirectionalLight(0xf4c95e, 1.5);
    rim.position.set(80, 40, -90);
    scene.add(rim);
    const body = new Group();
    body.matrixAutoUpdate = false;
    scene.add(body);
    const camera = new PerspectiveCamera(
      42,
      latest.current.width / latest.current.height,
      0.1,
      10000,
    );
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.enablePan = false;
    controls.autoRotate = false;
    const render = () => {
      if (!cancelled) renderer.render(scene, camera);
    };
    controls.addEventListener('change', render);
    engine.current = { renderer, scene, camera, body, controls, render };
    new GLTFLoader().load(
      asset,
      gltf => {
        if (cancelled) {
          gltf.scene.traverse(n => {
            if (n instanceof Mesh) n.geometry.dispose();
          });
          return;
        }
        const craft = gltf.scene;
        // glTF is Y-up, forward -Z. Convert to our tested +X-forward space.
        craft.rotation.y = -Math.PI / 2;
        craft.updateMatrixWorld(true);
        const box = new Box3().setFromObject(craft),
          center = box.getCenter(new Vector3());
        craft.position.sub(center);
        const radius = box.getBoundingSphere(new Sphere()).radius;
        craft.traverse(n => {
          if (n instanceof Mesh) {
            n.castShadow = false;
            const mats = Array.isArray(n.material) ? n.material : [n.material];
            n.material = mats.map(m => {
              const copy = m.clone() as MeshStandardMaterial;
              if (copy.color) {
                const c = copy.color;
                if (c.g > c.r * 1.35 && c.g > c.b * 1.2) c.set(colors.accent);
                else if (c.r > c.g * 1.7 && c.r > c.b * 1.3) c.set('#e75965');
              }
              return copy;
            });
          }
        });
        body.add(craft);
        const grid = new GridHelper(radius * 3.4, 24, 0x555b72, 0x303448);
        grid.position.y = -radius * 0.4;
        scene.add(grid);
        camera.position.set(-radius * 2.9, radius * 1.05, 0);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
        controls.minDistance = radius * 1.6;
        controls.maxDistance = radius * 6;
        controls.update();
        applyPose();
        setReady(true);
      },
      undefined,
      () => {
        if (!cancelled) setReady(false);
      },
    );
    return () => {
      cancelled = true;
      controls.removeEventListener('change', render);
      controls.dispose();
      scene.traverse(n => {
        if (n instanceof Mesh) {
          n.geometry.dispose();
          const mats = Array.isArray(n.material) ? n.material : [n.material];
          mats.forEach(m => m.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
      if (engine.current?.renderer === renderer) engine.current = undefined;
    };
  }, [asset, applyPose]);
  useEffect(() => {
    const h = engine.current;
    if (!h) return;
    h.renderer.setSize(width, height, false);
    h.camera.aspect = width / height;
    h.camera.updateProjectionMatrix();
    h.render();
  }, [width, height]);
  useEffect(() => {
    applyPose();
  }, [
    orientation.rollDeg,
    orientation.pitchDeg,
    orientation.yawDeg,
    stale,
    applyPose,
  ]);
  orientationRenderObserver.noteRendererPose(orientation);
  if (sampleIdentity) {
    orientationLatencyTracker.noteRendererSample(sampleIdentity);
    orientationLatencyTracker.noteSceneBuilt(sampleIdentity);
  }
  return (
    <View
      style={[styles.root, { width, height }]}
      testID="orientation-renderer"
    >
      {asset ? (
        <div
          ref={mount}
          data-testid="orientation-webgl"
          style={{ position: 'absolute', inset: 0, opacity: ready ? 1 : 0 }}
        />
      ) : null}
      {!ready ? (
        <View pointerEvents="none">
          {meshForAirframe(airframe) ? (
            <CanvasMeshRenderer {...props} />
          ) : (
            <ProjectedOrientation {...props} />
          )}
        </View>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  root: { overflow: 'hidden', position: 'relative' },
});
