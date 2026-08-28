import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Cube from "./Cube";

type Position = [number, number, number];

export type Face = "R" | "L" | "U" | "D" | "F" | "B";

interface Cubie {
  id: number;
  position: Position;
}

export interface RubiksHandle {
  move: (face: Face, reverse?: boolean) => void;
  reset: () => void;
}

interface MoveData {
  axis: "x" | "y" | "z";
  layer: number;
  angle: number;
}

interface AnimationState {
  active: boolean;
  progress: number;
  selectedIds: number[];
  axis: "x" | "y" | "z";
  angle: number;
}

function createCubies(): Cubie[] {
  const result: Cubie[] = [];

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        result.push({
          id: result.length,
          position: [x, y, z],
        });
      }
    }
  }

  return result;
}

const Rubiks = forwardRef<RubiksHandle>((_, ref) => {
  const [cubies, setCubies] = useState<Cubie[]>(createCubies);

  const cubeRefs = useRef<Map<number, THREE.Group>>(
    new Map()
  );

  const pivotRef = useRef<THREE.Group>(null);

  const animation = useRef<AnimationState>({
    active: false,
    progress: 0,
    selectedIds: [],
    axis: "x",
    angle: Math.PI / 2,
  });

  function getMoveData(
    face: Face,
    reverse: boolean
  ): MoveData {
    let axis: "x" | "y" | "z";
    let layer: number;
    let angle: number;

    switch (face) {
      case "R":
        axis = "x";
        layer = 1;
        angle = Math.PI / 2;
        break;

      case "L":
        axis = "x";
        layer = -1;
        angle = -Math.PI / 2;
        break;

      case "U":
        axis = "y";
        layer = 1;
        angle = Math.PI / 2;
        break;

      case "D":
        axis = "y";
        layer = -1;
        angle = -Math.PI / 2;
        break;

      case "F":
        axis = "z";
        layer = 1;
        angle = -Math.PI / 2;
        break;

      case "B":
        axis = "z";
        layer = -1;
        angle = Math.PI / 2;
        break;
    }

    if (reverse) {
      angle *= -1;
    }

    return {
      axis,
      layer,
      angle,
    };
  }

  function move(
    face: Face,
    reverse = false
  ) {
    if (animation.current.active) {
      return;
    }

    const pivot = pivotRef.current;

    if (!pivot) {
      return;
    }

    const data = getMoveData(
      face,
      reverse
    );

    const selectedIds: number[] = [];

    for (const cubie of cubies) {
      const [x, y, z] =
        cubie.position;

      const coordinate =
        data.axis === "x"
          ? x
          : data.axis === "y"
            ? y
            : z;

      if (coordinate === data.layer) {
        selectedIds.push(
          cubie.id
        );
      }
    }

    for (const id of selectedIds) {
      const cube =
        cubeRefs.current.get(id);

      if (cube) {
        pivot.attach(cube);
      }
    }

    pivot.rotation.set(
      0,
      0,
      0
    );

    animation.current = {
      active: true,
      progress: 0,
      selectedIds,
      axis: data.axis,
      angle: data.angle,
    };
  }

  function finishMove() {
    const pivot =
      pivotRef.current;

    if (!pivot) {
      return;
    }

    const {
      selectedIds,
      axis,
      angle,
    } = animation.current;

    const turns = Math.round(
      angle / (Math.PI / 2)
    );

    setCubies(
      (currentCubies) =>
        currentCubies.map(
          (cubie) => {
            if (
              !selectedIds.includes(
                cubie.id
              )
            ) {
              return cubie;
            }

            let [x, y, z] =
              cubie.position;

            for (
              let i = 0;
              i < Math.abs(turns);
              i++
            ) {
              const direction =
                turns > 0
                  ? 1
                  : -1;

              if (
                axis === "x"
              ) {
                const oldY = y;
                const oldZ = z;

                if (
                  direction === 1
                ) {
                  y = -oldZ;
                  z = oldY;
                } else {
                  y = oldZ;
                  z = -oldY;
                }
              }

              if (
                axis === "y"
              ) {
                const oldX = x;
                const oldZ = z;

                if (
                  direction === 1
                ) {
                  x = oldZ;
                  z = -oldX;
                } else {
                  x = -oldZ;
                  z = oldX;
                }
              }

              if (
                axis === "z"
              ) {
                const oldX = x;
                const oldY = y;

                if (
                  direction === 1
                ) {
                  x = -oldY;
                  y = oldX;
                } else {
                  x = oldY;
                  y = -oldX;
                }
              }
            }

            return {
              ...cubie,
              position: [
                x,
                y,
                z,
              ],
            };
          }
        )
    );

    for (const id of selectedIds) {
      const cube =
        cubeRefs.current.get(id);

      if (!cube) {
        continue;
      }

      const worldPosition =
        new THREE.Vector3();

      const worldQuaternion =
        new THREE.Quaternion();

      cube.getWorldPosition(
        worldPosition
      );

      cube.getWorldQuaternion(
        worldQuaternion
      );

      pivot.parent?.attach(
        cube
      );

      cube.position.set(
        Math.round(
          worldPosition.x
        ),
        Math.round(
          worldPosition.y
        ),
        Math.round(
          worldPosition.z
        )
      );

      cube.quaternion.copy(
        worldQuaternion
      );
    }

    pivot.rotation.set(
      0,
      0,
      0
    );

    animation.current = {
      active: false,
      progress: 0,
      selectedIds: [],
      axis: "x",
      angle: Math.PI / 2,
    };
  }

  function reset() {
    /*
     * Don't reset while a move
     * is being animated.
     */
    if (animation.current.active) {
      return;
    }

    const pivot =
      pivotRef.current;

    if (!pivot) {
      return;
    }

    /*
     * Put every cubie back into
     * the main group.
     */
    for (
      const cube of
      cubeRefs.current.values()
    ) {
      pivot.parent?.attach(
        cube
      );

      cube.rotation.set(
        0,
        0,
        0
      );
    }

    /*
     * Reset logical state.
     */
    setCubies(
      createCubies()
    );

    /*
     * Reset animation state.
     */
    animation.current = {
      active: false,
      progress: 0,
      selectedIds: [],
      axis: "x",
      angle: Math.PI / 2,
    };

    pivot.rotation.set(
      0,
      0,
      0
    );
  }

  useImperativeHandle(
    ref,
    () => ({
      move,
      reset,
    })
  );

  useFrame(
    (_, delta) => {
      const anim =
        animation.current;

      if (!anim.active) {
        return;
      }

      const pivot =
        pivotRef.current;

      if (!pivot) {
        return;
      }

      anim.progress +=
        delta * 4;

      const t =
        Math.min(
          anim.progress,
          1
        );

      const eased =
        1 -
        Math.pow(
          1 - t,
          3
        );

      pivot.rotation[
        anim.axis
      ] =
        anim.angle *
        eased;

      if (t >= 1) {
        finishMove();
      }
    }
  );

  return (
    <group>
      {cubies.map(
        (cubie) => (
          <Cube
            key={cubie.id}
            ref={(ref) => {
              if (ref) {
                cubeRefs.current.set(
                  cubie.id,
                  ref
                );
              } else {
                cubeRefs.current.delete(
                  cubie.id
                );
              }
            }}
            position={
              cubie.position
            }
          />
        )
      )}

      <group
        ref={pivotRef}
      />
    </group>
  );
});

Rubiks.displayName =
  "Rubiks";

export default Rubiks;