import { RoundedBox } from "@react-three/drei";
import { forwardRef, useMemo } from "react";
import * as THREE from "three";

const FACE_COLORS = {
  right: "#ff0000",
  left: "#0000ff",
  top: "#ffffff",
  bottom: "#00ff00",
  front: "#00fffb",
  back: "#ffff00",
};

interface CubeProp {
  position: [number, number, number];
}

const Cube = forwardRef<THREE.Group, CubeProp>(
  ({ position }, ref) => {
    const blackMaterial = useMemo(
      () =>
        new THREE.MeshStandardMaterial({
          color: "#050505",
          metalness: 0.1,
          roughness: 0.7,
        }),
      []
    );

    const stickerMaterials = useMemo(
      () => ({
        right: new THREE.MeshStandardMaterial({
          color: FACE_COLORS.right,
          metalness: 0,
          roughness: 0.6,
        }),

        left: new THREE.MeshStandardMaterial({
          color: FACE_COLORS.left,
          metalness: 0,
          roughness: 0.6,
        }),

        top: new THREE.MeshStandardMaterial({
          color: FACE_COLORS.top,
          metalness: 0,
          roughness: 0.6,
        }),

        bottom: new THREE.MeshStandardMaterial({
          color: FACE_COLORS.bottom,
          metalness: 0,
          roughness: 0.6,
        }),

        front: new THREE.MeshStandardMaterial({
          color: FACE_COLORS.front,
          metalness: 0,
          roughness: 0.6,
        }),

        back: new THREE.MeshStandardMaterial({
          color: FACE_COLORS.back,
          metalness: 0,
          roughness: 0.6,
        }),
      }),
      []
    );

    return (
      <group ref={ref} position={position}>
        {/* ================= BLACK CUBIE ================= */}

        <RoundedBox
          radius={0.08}
          smoothness={6}
          args={[0.99, 0.99, 0.99]}
          material={blackMaterial}
        />

        {/* ================= RIGHT ================= */}

        <RoundedBox
          position={[0.501, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          radius={0.045}
          smoothness={6}
          args={[0.78, 0.78, 0.025]}
          material={stickerMaterials.right}
        />

        {/* ================= LEFT ================= */}

        <RoundedBox
          position={[-0.501, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          radius={0.045}
          smoothness={6}
          args={[0.78, 0.78, 0.025]}
          material={stickerMaterials.left}
        />

        {/* ================= TOP ================= */}

        <RoundedBox
          position={[0, 0.501, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          radius={0.045}
          smoothness={6}
          args={[0.78, 0.78, 0.025]}
          material={stickerMaterials.top}
        />

        {/* ================= BOTTOM ================= */}

        <RoundedBox
          position={[0, -0.501, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          radius={0.045}
          smoothness={6}
          args={[0.78, 0.78, 0.025]}
          material={stickerMaterials.bottom}
        />

        {/* ================= FRONT ================= */}

        <RoundedBox
          position={[0, 0, 0.501]}
          radius={0.045}
          smoothness={6}
          args={[0.78, 0.78, 0.025]}
          material={stickerMaterials.front}
        />

        {/* ================= BACK ================= */}

        <RoundedBox
          position={[0, 0, -0.501]}
          radius={0.045}
          smoothness={6}
          args={[0.78, 0.78, 0.025]}
          material={stickerMaterials.back}
        />
      </group>
    );
  }
);

Cube.displayName = "Cube";

export default Cube;