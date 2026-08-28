import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import {
  useFrame,
} from "@react-three/fiber";

import * as THREE from "three";

import Cube from "./Cube";


/* =========================================================
   TYPES
========================================================= */

type Position = [
  number,
  number,
  number
];

export type Face =
  | "R"
  | "L"
  | "U"
  | "D"
  | "F"
  | "B";


interface Cubie {
  id: number;
  position: Position;
}


export interface RubiksHandle {
  move: (
    face: Face,
    reverse?: boolean
  ) => void;

  reset: () => void;
}


interface MoveData {
  axis:
    | "x"
    | "y"
    | "z";

  layer: number;

  angle: number;
}


interface AnimationState {
  active: boolean;

  progress: number;

  selectedIds: number[];

  axis:
    | "x"
    | "y"
    | "z";

  angle: number;
}


/* =========================================================
   CREATE SOLVED CUBE
========================================================= */

function createCubies(): Cubie[] {
  const result: Cubie[] = [];

  for (
    let x = -1;
    x <= 1;
    x++
  ) {
    for (
      let y = -1;
      y <= 1;
      y++
    ) {
      for (
        let z = -1;
        z <= 1;
        z++
      ) {

        result.push({
          id: result.length,

          position: [
            x,
            y,
            z,
          ],
        });

      }
    }
  }

  return result;
}


/* =========================================================
   ROTATE GRID POSITION
========================================================= */

function rotatePosition(
  position: Position,

  axis:
    | "x"
    | "y"
    | "z",

  direction: number
): Position {

  let [
    x,
    y,
    z,
  ] = position;


  /* =======================================================
     X
  ======================================================= */

  if (
    axis === "x"
  ) {

    const oldY = y;
    const oldZ = z;


    if (
      direction > 0
    ) {

      y = -oldZ;
      z = oldY;

    } else {

      y = oldZ;
      z = -oldY;

    }

  }


  /* =======================================================
     Y
  ======================================================= */

  if (
    axis === "y"
  ) {

    const oldX = x;
    const oldZ = z;


    if (
      direction > 0
    ) {

      x = oldZ;
      z = -oldX;

    } else {

      x = -oldZ;
      z = oldX;

    }

  }


  /* =======================================================
     Z
  ======================================================= */

  if (
    axis === "z"
  ) {

    const oldX = x;
    const oldY = y;


    if (
      direction > 0
    ) {

      x = -oldY;
      y = oldX;

    } else {

      x = oldY;
      y = -oldX;

    }

  }


  return [
    x,
    y,
    z,
  ];
}


/* =========================================================
   RUBIKS
========================================================= */

const Rubiks = forwardRef<
  RubiksHandle
>((_, ref) => {

  const [
    cubies,
    setCubies,
  ] = useState<Cubie[]>(
    createCubies
  );


  /* =======================================================
     CUBE REFERENCES
  ======================================================= */

  const cubeRefs =
    useRef<
      Map<
        number,
        THREE.Group
      >
    >(
      new Map()
    );


  /* =======================================================
     PIVOT
  ======================================================= */

  const pivotRef =
    useRef<THREE.Group>(
      null
    );


  /* =======================================================
     ANIMATION
  ======================================================= */

  const animation =
    useRef<AnimationState>({
      active: false,

      progress: 0,

      selectedIds: [],

      axis: "x",

      angle:
        Math.PI / 2,
    });


  /* =======================================================
     GET MOVE DATA
  ======================================================= */

  function getMoveData(
    face: Face,

    reverse: boolean
  ): MoveData {

    let axis:
      | "x"
      | "y"
      | "z";

    let layer: number;

    let angle: number;


    switch (face) {

      case "R":

        axis = "x";
        layer = 1;

        angle =
          Math.PI / 2;

        break;


      case "L":

        axis = "x";
        layer = -1;

        angle =
          -Math.PI / 2;

        break;


      case "U":

        axis = "y";
        layer = 1;

        angle =
          Math.PI / 2;

        break;


      case "D":

        axis = "y";
        layer = -1;

        angle =
          -Math.PI / 2;

        break;


      case "F":

        axis = "z";
        layer = 1;

        angle =
          -Math.PI / 2;

        break;


      case "B":

        axis = "z";
        layer = -1;

        angle =
          Math.PI / 2;

        break;

    }


    if (
      reverse
    ) {
      angle *= -1;
    }


    return {
      axis,
      layer,
      angle,
    };
  }


  /* =======================================================
     START MOVE
  ======================================================= */

  function move(
    face: Face,

    reverse = false
  ) {

    /*
     * Do not interrupt an
     * existing animation.
     */

    if (
      animation.current.active
    ) {
      return;
    }


    const pivot =
      pivotRef.current;

    if (!pivot) {
      return;
    }


    const data =
      getMoveData(
        face,
        reverse
      );


    /* =====================================================
       FIND LAYER
    ===================================================== */

    const selectedIds: number[] =
      [];


    for (
      const cubie of cubies
    ) {

      const [
        x,
        y,
        z,
      ] = cubie.position;


      const coordinate =
        data.axis === "x"
          ? x
          : data.axis === "y"
            ? y
            : z;


      if (
        coordinate ===
        data.layer
      ) {

        selectedIds.push(
          cubie.id
        );

      }
    }


    /* =====================================================
       ATTACH TO PIVOT
    ===================================================== */

    for (
      const id of selectedIds
    ) {

      const cube =
        cubeRefs.current.get(
          id
        );


      if (!cube) {
        continue;
      }


      pivot.attach(
        cube
      );

    }


    pivot.rotation.set(
      0,
      0,
      0
    );


    /* =====================================================
       START ANIMATION
    ===================================================== */

    animation.current = {
      active: true,

      progress: 0,

      selectedIds,

      axis:
        data.axis,

      angle:
        data.angle,
    };

  }


  /* =======================================================
     FINISH MOVE
  ======================================================= */

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
    } =
      animation.current;


    const direction =
      angle > 0
        ? 1
        : -1;


    /* =====================================================
       CALCULATE NEW POSITIONS
    ===================================================== */

    const nextPositions =
      new Map<
        number,
        Position
      >();


    for (
      const cubie of cubies
    ) {

      if (
        !selectedIds.includes(
          cubie.id
        )
      ) {
        continue;
      }


      nextPositions.set(
        cubie.id,

        rotatePosition(
          cubie.position,

          axis,

          direction
        )
      );

    }


    /* =====================================================
       REMOVE FROM PIVOT
    ===================================================== */

    for (
      const id of selectedIds
    ) {

      const cube =
        cubeRefs.current.get(
          id
        );


      if (!cube) {
        continue;
      }


      /*
       * Return directly to the
       * Rubik's parent.
       */

      pivot.parent?.attach(
        cube
      );

    }


    /* =====================================================
       RESET PIVOT
    ===================================================== */

    pivot.rotation.set(
      0,
      0,
      0
    );


    /* =====================================================
       SET EXACT POSITIONS
    ===================================================== */

    for (
      const [
        id,
        position,
      ] of nextPositions
    ) {

      const cube =
        cubeRefs.current.get(
          id
        );


      if (!cube) {
        continue;
      }


      cube.position.set(
        position[0],
        position[1],
        position[2]
      );


      /*
       * The cube's orientation has
       * already been transformed by
       * the pivot.
       *
       * Snap each Euler component to
       * a 90 degree increment to
       * remove floating point drift.
       */

      const euler =
        new THREE.Euler()
          .setFromQuaternion(
            cube.quaternion,
            "XYZ"
          );


      cube.rotation.set(
        Math.round(
          euler.x /
            (Math.PI / 2)
        ) *
          (Math.PI / 2),

        Math.round(
          euler.y /
            (Math.PI / 2)
        ) *
          (Math.PI / 2),

        Math.round(
          euler.z /
            (Math.PI / 2)
        ) *
          (Math.PI / 2)
      );

    }


    /* =====================================================
       UPDATE LOGICAL STATE
    ===================================================== */

    setCubies(
      current =>
        current.map(
          cubie => {

            const next =
              nextPositions.get(
                cubie.id
              );


            if (!next) {
              return cubie;
            }


            return {
              ...cubie,

              position: [
                next[0],
                next[1],
                next[2],
              ],
            };

          }
        )
    );


    /* =====================================================
       STOP ANIMATION
    ===================================================== */

    animation.current = {
      active: false,

      progress: 0,

      selectedIds: [],

      axis: "x",

      angle:
        Math.PI / 2,
    };

  }


  /* =======================================================
     RESET
  ======================================================= */

  function reset() {

    if (
      animation.current.active
    ) {
      return;
    }


    const pivot =
      pivotRef.current;

    if (!pivot) {
      return;
    }


    /*
     * Remove all cubies from the
     * pivot if necessary.
     */

    for (
      const cube of
      cubeRefs.current.values()
    ) {

      pivot.parent?.attach(
        cube
      );

    }


    /*
     * Restore the actual solved
     * coordinates.
     */

    const solved =
      createCubies();


    for (
      const cubie of solved
    ) {

      const cube =
        cubeRefs.current.get(
          cubie.id
        );


      if (!cube) {
        continue;
      }


      cube.position.set(
        cubie.position[0],
        cubie.position[1],
        cubie.position[2]
      );


      cube.rotation.set(
        0,
        0,
        0
      );

    }


    /*
     * Restore React state.
     */

    setCubies(
      solved
    );


    /*
     * Reset pivot.
     */

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

      angle:
        Math.PI / 2,
    };

  }


  /* =======================================================
     PUBLIC HANDLE
  ======================================================= */

  useImperativeHandle(
    ref,
    () => ({
      move,
      reset,
    })
  );


  /* =======================================================
     ANIMATION LOOP
  ======================================================= */

  useFrame(
    (_, delta) => {

      const anim =
        animation.current;


      if (
        !anim.active
      ) {
        return;
      }


      const pivot =
        pivotRef.current;


      if (!pivot) {
        return;
      }


      /*
       * 4.5 gives a slightly faster,
       * more responsive quarter-turn.
       */

      anim.progress +=
        delta * 4.5;


      const t =
        Math.min(
          anim.progress,
          1
        );


      /*
       * Smooth ease-out.
       */

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


      if (
        t >= 1
      ) {

        /*
         * Finish synchronously at
         * exactly 90 degrees.
         */

        pivot.rotation[
          anim.axis
        ] =
          anim.angle;


        finishMove();

      }

    }
  );


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <group>

      {cubies.map(
        cubie => (

          <Cube
            key={
              cubie.id
            }

            ref={
              node => {

                if (node) {

                  cubeRefs.current.set(
                    cubie.id,
                    node
                  );

                } else {

                  cubeRefs.current.delete(
                    cubie.id
                  );

                }

              }
            }

            position={
              cubie.position
            }
          />

        )
      )}


      {/* Invisible animation pivot */}

      <group
        ref={
          pivotRef
        }
      />

    </group>
  );
});


Rubiks.displayName =
  "Rubiks";


export default Rubiks;