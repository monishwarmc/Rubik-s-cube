"use client";

import {
  useCallback,
  useRef,
  useState,
} from "react";

import {
  Environment,
  OrbitControls,
} from "@react-three/drei";

import {
  Canvas,
  useFrame,
  useThree,
} from "@react-three/fiber";

import * as THREE from "three";

import Rubiks, {
  Face,
  RubiksHandle,
} from "./components/Rubiks";


/* =========================================================
   TYPES
========================================================= */

interface ViewMapping {
  R: Face;
  L: Face;
  U: Face;
  D: Face;
  F: Face;
  B: Face;
}


/* =========================================================
   DEFAULT VIEW
========================================================= */

const DEFAULT_MAPPING: ViewMapping = {
  R: "R",
  L: "L",
  U: "U",
  D: "D",
  F: "F",
  B: "B",
};


/* =========================================================
   FACE HELPERS
========================================================= */

function getClosestFace(
  direction: THREE.Vector3
): Face {
  const x =
    Math.abs(direction.x);

  const y =
    Math.abs(direction.y);

  const z =
    Math.abs(direction.z);

  if (
    x >= y &&
    x >= z
  ) {
    return direction.x >= 0
      ? "R"
      : "L";
  }

  if (
    y >= x &&
    y >= z
  ) {
    return direction.y >= 0
      ? "U"
      : "D";
  }

  return direction.z >= 0
    ? "F"
    : "B";
}


function oppositeFace(
  face: Face
): Face {
  switch (face) {
    case "R":
      return "L";

    case "L":
      return "R";

    case "U":
      return "D";

    case "D":
      return "U";

    case "F":
      return "B";

    case "B":
      return "F";
  }
}


/* =========================================================
   CAMERA FACE DETECTOR
========================================================= */

function CameraFaceDetector({
  onChange,
}: {
  onChange: (
    mapping: ViewMapping
  ) => void;
}) {
  const { camera } =
    useThree();

  const lastState =
    useRef("");

  useFrame(() => {
    const cameraRight =
      new THREE.Vector3(
        1,
        0,
        0
      )
        .applyQuaternion(
          camera.quaternion
        )
        .normalize();

    const cameraUp =
      new THREE.Vector3(
        0,
        1,
        0
      )
        .applyQuaternion(
          camera.quaternion
        )
        .normalize();

    const cameraForward =
      new THREE.Vector3();

    camera.getWorldDirection(
      cameraForward
    );

    const right =
      getClosestFace(
        cameraRight
      );

    const top =
      getClosestFace(
        cameraUp
      );

    const front =
      getClosestFace(
        cameraForward.clone().negate()
      );

    const mapping: ViewMapping = {
      R: right,
      L: oppositeFace(
        right
      ),

      U: top,
      D: oppositeFace(
        top
      ),

      F: front,
      B: oppositeFace(
        front
      ),
    };

    const state =
      JSON.stringify(
        mapping
      );

    if (
      state !==
      lastState.current
    ) {
      lastState.current =
        state;

      onChange(
        mapping
      );
    }
  });

  return null;
}


/* =========================================================
   MOVE BUTTONS
========================================================= */

const BUTTONS: Face[] = [
  "R",
  "L",
  "U",
  "D",
  "F",
  "B",
];


/* =========================================================
   HOME
========================================================= */

export default function Home() {
  const rubiksRef =
    useRef<RubiksHandle>(null);

  const [
    mapping,
    setMapping,
  ] =
    useState<ViewMapping>(
      DEFAULT_MAPPING
    );

  const updateMapping =
    useCallback(
      (
        newMapping: ViewMapping
      ) => {
        setMapping(
          newMapping
        );
      },
      []
    );

  return (
    <main
      className="
        relative
        h-dvh
        w-full
        overflow-hidden
        bg-[#050a12]
        text-white
      "
    >

      {/* =================================================
          BACKGROUND
      ================================================= */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          bg-[radial-gradient(circle_at_50%_45%,rgba(40,100,180,0.18),transparent_42%)]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-[0.035]
          [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)]
          [background-size:40px_40px]
        "
      />


      {/* =================================================
          HEADER
      ================================================= */}

      <header
        className="
          pointer-events-none
          absolute
          left-5
          top-5
          z-20

          sm:left-7
          sm:top-7
        "
      >
        <div
          className="
            mb-1
            flex
            items-center
            gap-2
          "
        >
          <div
            className="
              h-1.5
              w-1.5
              rounded-full
              bg-emerald-400
              shadow-[0_0_12px_rgba(52,211,153,.8)]
            "
          />

          <span
            className="
              text-[9px]
              font-medium
              uppercase
              tracking-[0.35em]
              text-white/40

              sm:text-[10px]
            "
          >
            Interactive 3D
          </span>
        </div>

        <h1
          className="
            text-xl
            font-semibold
            tracking-tight

            sm:text-3xl
          "
        >
          Rubik&apos;s Cube
        </h1>

        <p
          className="
            mt-1
            max-w-xs
            text-[10px]
            text-white/30

            sm:text-xs
          "
        >
          Rotate the cube and solve it
          your way.
        </p>
      </header>


      {/* =================================================
          CANVAS
      ================================================= */}

      <div
        className="
          absolute
          inset-0
        "
      >
        <Canvas
          camera={{
            position: [
              4,
              4,
              5,
            ],
            fov: 45,
          }}
          dpr={[1, 2]}
        >

          <color
            attach="background"
            args={[
              "#050a12",
            ]}
          />

          <ambientLight
            intensity={0.5}
          />

          <directionalLight
            position={[
              5,
              8,
              5,
            ]}
            intensity={2}
          />

          <directionalLight
            position={[
              -4,
              2,
              -4,
            ]}
            intensity={0.5}
          />

          <Environment
            preset="city"
          />

          <OrbitControls
            enableDamping
            dampingFactor={0.08}
            minDistance={3.5}
            maxDistance={10}
            rotateSpeed={0.7}
            zoomSpeed={0.8}
            enablePan={false}
          />

          <CameraFaceDetector
            onChange={
              updateMapping
            }
          />

          <ResponsiveCube>
            <Rubiks
              ref={
                rubiksRef
              }
            />
          </ResponsiveCube>

        </Canvas>
      </div>


      {/* =================================================
          MOVE PANEL
      ================================================= */}

      <DraggableMovePanel
        mapping={mapping}
        rubiksRef={
          rubiksRef
        }
      />


      {/* =================================================
          CONTACT
      ================================================= */}

      <div
        className="
          absolute
          bottom-4
          left-4
          z-20
          flex
          flex-col
          items-center
          gap-2

          sm:bottom-6
          sm:left-6
        "
      >

        {/* GitHub */}

        <a
          href="https://github.com/monishwarmc?tab=repositories"
          target="_blank"
          rel="noopener noreferrer"
          className="
            flex
            gap-2
            rounded-lg
            border
            border-white/8
            bg-white/4
            px-3
            py-2
            text-[10px]
            font-medium
            text-white/50
            backdrop-blur-md
            transition

            hover:border-white/15
            hover:bg-white/8
            hover:text-white

            active:scale-95
            mr-16
          "
        >
          <svg
            viewBox="0 0 24 24"
            className="
              h-3.5
              w-3.5
              fill-current
            "
            aria-hidden="true"
          >
            <path
              d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.85 10.91.57.1.78-.25.78-.55v-2.13c-3.19.69-3.86-1.35-3.86-1.35-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.67 1.25 3.32.96.1-.74.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.06 0 0 .96-.31 3.14 1.18a10.9 10.9 0 0 1 5.72 0c2.18-1.49 3.14-1.18 3.14-1.18.62 1.59.23 2.77.11 3.06.73.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.25 5.67.41.36.77 1.07.77 2.16v3.2c0 .31.21.66.79.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
            />
          </svg>

          GitHub
        </a>


        {/* Email */}

        <a
          href="mailto:monishwar369@gmail.com"
          className="
            flex
            items-center
            gap-2
            rounded-lg
            border
            border-white/8
            bg-white/4
            px-3
            py-2
            text-[10px]
            font-medium
            text-white/50
            backdrop-blur-md
            transition

            hover:border-white/15
            hover:bg-white/8
            hover:text-white

            active:scale-95
          "
        >
          <svg
            viewBox="0 0 24 24"
            className="
              h-3.5
              w-3.5
              fill-none
              stroke-current
            "
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path
              d="M3 5.5h18v13H3z"
            />

            <path
              d="m3 6 9 7 9-7"
            />
          </svg>

          monishwar369@gmail.com
        </a>

      </div>


      {/* =================================================
          MOBILE HELP
      ================================================= */}

      <div
        className="
          pointer-events-none
          absolute
          bottom-16
          left-4
          z-10
          text-[9px]
          text-white/25

          sm:hidden
        "
      >
        Drag cube to orbit ·
        Pinch to zoom
      </div>

    </main>
  );
}


/* =========================================================
   DRAGGABLE MOVE PANEL
========================================================= */

function DraggableMovePanel({
  mapping,
  rubiksRef,
}: {
  mapping: ViewMapping;
  rubiksRef: React.RefObject<
    RubiksHandle | null
  >;
}) {
  const panelRef =
    useRef<HTMLDivElement>(null);

  const dragState =
    useRef({
      dragging: false,
      pointerId: -1,
      offsetX: 0,
      offsetY: 0,
    });

  const [
    position,
    setPosition,
  ] =
    useState<{
      x: number;
      y: number;
    } | null>(null);


  /* =======================================================
     START DRAG
  ======================================================= */

  function handlePointerDown(
    event: React.PointerEvent
  ) {
    const panel =
      panelRef.current;

    if (!panel) {
      return;
    }

    const rect =
      panel.getBoundingClientRect();

    dragState.current = {
      dragging: true,

      pointerId:
        event.pointerId,

      offsetX:
        event.clientX -
        rect.left,

      offsetY:
        event.clientY -
        rect.top,
    };

    event.currentTarget.setPointerCapture(
      event.pointerId
    );
  }


  /* =======================================================
     DRAG
  ======================================================= */

  function handlePointerMove(
    event: React.PointerEvent
  ) {
    const drag =
      dragState.current;

    if (
      !drag.dragging ||
      drag.pointerId !==
        event.pointerId
    ) {
      return;
    }

    const panel =
      panelRef.current;

    if (!panel) {
      return;
    }

    const width =
      window.innerWidth;

    const height =
      window.innerHeight;

    const panelWidth =
      panel.offsetWidth;

    const panelHeight =
      panel.offsetHeight;

    let x =
      event.clientX -
      drag.offsetX;

    let y =
      event.clientY -
      drag.offsetY;

    x = Math.max(
      8,
      Math.min(
        x,
        width -
          panelWidth -
          8
      )
    );

    y = Math.max(
      8,
      Math.min(
        y,
        height -
          panelHeight -
          8
      )
    );

    setPosition({
      x,
      y,
    });
  }


  /* =======================================================
     STOP DRAG
  ======================================================= */

  function handlePointerUp(
    event: React.PointerEvent
  ) {
    if (
      dragState.current
        .pointerId ===
      event.pointerId
    ) {
      dragState.current.dragging =
        false;

      event.currentTarget.releasePointerCapture(
        event.pointerId
      );
    }
  }


  return (
    <section
      ref={panelRef}
      style={
        position
          ? {
              left:
                position.x,
              top:
                position.y,
              right:
                "auto",
              bottom:
                "auto",
            }
          : undefined
      }
      className="
        absolute
        bottom-4
        right-4
        z-30

        w-[min(290px,calc(100%-2rem))]

        overflow-hidden
        rounded-2xl
        border
        border-white/10
        bg-[#0b111c]/80

        shadow-[0_20px_70px_rgba(0,0,0,.45)]

        backdrop-blur-2xl

        sm:bottom-7
        sm:right-7
        sm:w-60
      "
    >

      {/* =================================================
          DRAG HANDLE
      ================================================= */}

      <div
        onPointerDown={
          handlePointerDown
        }
        onPointerMove={
          handlePointerMove
        }
        onPointerUp={
          handlePointerUp
        }
        onPointerCancel={
          handlePointerUp
        }
        className="
          flex
          cursor-grab
          touch-none
          items-center
          justify-between
          border-b
          border-white/8
          px-4
          py-3

          active:cursor-grabbing
        "
      >

        <div>
          <div
            className="
              text-xs
              font-semibold
              text-white
            "
          >
            Move Cube
          </div>

          <div
            className="
              mt-0.5
              text-[9px]
              text-white/30
            "
          >
            Drag panel to move
          </div>
        </div>


        {/* Drag icon */}

        <div
          className="
            grid
            grid-cols-2
            gap-[3px]
            opacity-30
          "
        >
          {Array.from({
            length: 6,
          }).map(
            (_, index) => (
              <span
                key={index}
                className="
                  h-1
                  w-1
                  rounded-full
                  bg-white
                "
              />
            )
          )}
        </div>

      </div>


      {/* =================================================
          MOVE BUTTONS
      ================================================= */}

      <div
        className="
          p-3
        "
      >

        <div
          className="
            grid
            grid-cols-2
            gap-2
          "
        >
          {BUTTONS.map(
            (button) => {
              const physicalFace =
                mapping[
                  button
                ];

              return (
                <div
                  key={button}
                  className="
                    flex
                    gap-1
                  "
                >

                  {/* Clockwise */}

                  <button
                    type="button"
                    onClick={() =>
                      rubiksRef.current?.move(
                        physicalFace,
                        false
                      )
                    }
                    className="
                      flex
                      h-10
                      flex-1
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-white/10
                      bg-white/8
                      text-sm
                      font-bold
                      text-white
                      transition

                      hover:bg-white/16
                      active:scale-95
                    "
                  >
                    {button}
                  </button>


                  {/* Counter clockwise */}

                  <button
                    type="button"
                    onClick={() =>
                      rubiksRef.current?.move(
                        physicalFace,
                        true
                      )
                    }
                    className="
                      flex
                      h-10
                      flex-1
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-white/10
                      bg-white/4
                      text-sm
                      font-bold
                      text-white/60
                      transition

                      hover:bg-white/12
                      active:scale-95
                    "
                  >
                    {button}&apos;
                  </button>

                </div>
              );
            }
          )}
        </div>


        {/* =================================================
            RESET
        ================================================= */}

        <button
          type="button"
          onClick={() =>
            rubiksRef.current?.reset()
          }
          className="
            mt-2
            flex
            h-9
            w-full
            items-center
            justify-center
            rounded-lg
            border
            border-white/8
            bg-white/3
            text-[10px]
            font-medium
            text-white/50
            transition

            hover:bg-white/8
            hover:text-white

            active:scale-[0.98]
          "
        >
          Reset Cube
        </button>

      </div>

    </section>
  );
}


/* =========================================================
   RESPONSIVE CUBE
========================================================= */

function ResponsiveCube({
  children,
}: {
  children: React.ReactNode;
}) {
  const { size } =
    useThree();

  const groupRef =
    useRef<THREE.Group>(null);

  useFrame(() => {
    if (
      !groupRef.current
    ) {
      return;
    }

    const dimension =
      Math.min(
        size.width,
        size.height
      );

    let scale =
      1;

    if (
      dimension < 360
    ) {
      scale = 0.55;
    } else if (
      dimension < 480
    ) {
      scale = 0.65;
    } else if (
      dimension < 640
    ) {
      scale = 0.75;
    } else if (
      dimension < 900
    ) {
      scale = 0.9;
    } else {
      scale = 1;
    }

    groupRef.current.scale.setScalar(
      scale
    );
  });

  return (
    <group
      ref={groupRef}
    >
      {children}
    </group>
  );
}