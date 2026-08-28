"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Environment,
  TrackballControls,
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

type MoveMode =
  | "fixed"
  | "view";

type CanvasMode =
  | "orbit"
  | "move";

type AccordionSection =
  | "canvas"
  | "view"
  | "moves";

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
   FACE HELPERS
========================================================= */

function getClosestFace(
  direction: THREE.Vector3
): Face {
  const x = Math.abs(direction.x);
  const y = Math.abs(direction.y);
  const z = Math.abs(direction.z);

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
   ACCORDION HEADER

   IMPORTANT:
   This component MUST stay outside
   DraggableMovePanel.
========================================================= */

function AccordionHeader({
  section,
  title,
  description,
  openSection,
  onToggle,
}: {
  section: AccordionSection;

  title: string;

  description: string;

  openSection:
    | AccordionSection
    | "";

  onToggle: (
    section: AccordionSection
  ) => void;
}) {
  const isOpen =
    openSection === section;

  return (
    <button
      type="button"
      onClick={() =>
        onToggle(section)
      }
      className="
        flex
        w-full
        items-center
        justify-between
        px-3
        py-2.5
        text-left
        transition
        hover:bg-white/[0.035]
        active:bg-white/[0.05]
      "
    >
      <div className="min-w-0">
        <div
          className="
            text-[10px]
            font-semibold
            text-white
          "
        >
          {title}
        </div>

        <div
          className="
            mt-0.5
            truncate
            text-[8px]
            text-white/25
          "
        >
          {description}
        </div>
      </div>

      <div
        className={`
          ml-3
          flex
          h-5
          w-5
          shrink-0
          items-center
          justify-center
          rounded-md
          bg-white/[0.04]
          text-white/40
          transition-transform
          duration-200
          ${
            isOpen
              ? "rotate-180"
              : ""
          }
        `}
      >
        <svg
          viewBox="0 0 20 20"
          className="
            h-3
            w-3
            fill-none
            stroke-current
          "
          strokeWidth="1.8"
        >
          <path d="m5 7 5 5 5-5" />
        </svg>
      </div>
    </button>
  );
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

  const cameraRight =
    useRef(
      new THREE.Vector3()
    );

  const cameraUp =
    useRef(
      new THREE.Vector3()
    );

  const cameraForward =
    useRef(
      new THREE.Vector3()
    );

  useFrame(() => {
    cameraRight.current
      .set(1, 0, 0)
      .applyQuaternion(
        camera.quaternion
      )
      .normalize();

    cameraUp.current
      .set(0, 1, 0)
      .applyQuaternion(
        camera.quaternion
      )
      .normalize();

    camera.getWorldDirection(
      cameraForward.current
    );

    const frontDirection =
      cameraForward.current
        .clone()
        .negate()
        .normalize();

    const right =
      getClosestFace(
        cameraRight.current
      );

    const top =
      getClosestFace(
        cameraUp.current
      );

    const front =
      getClosestFace(
        frontDirection
      );

    const mapping: ViewMapping = {
      R: right,
      L: oppositeFace(right),
      U: top,
      D: oppositeFace(top),
      F: front,
      B: oppositeFace(front),
    };

    const state =
      JSON.stringify(mapping);

    if (
      state !==
      lastState.current
    ) {
      lastState.current =
        state;

      onChange(mapping);
    }
  });

  return null;
}

/* =========================================================
   HOME
========================================================= */

export default function Home() {
  const rubiksRef =
    useRef<RubiksHandle>(
      null
    );

  const [
    mapping,
    setMapping,
  ] =
    useState<ViewMapping>(
      DEFAULT_MAPPING
    );

  /*
   * Fixed:
   * R always means physical R.
   *
   * View:
   * R follows camera-right.
   */

  const [
    moveMode,
    setMoveMode,
  ] =
    useState<MoveMode>(
      "fixed"
    );

  /*
   * Orbit:
   * drag canvas to rotate.
   *
   * Move:
   * drag canvas to reposition
   * camera + orbit target.
   */

  const [
    canvasMode,
    setCanvasMode,
  ] =
    useState<CanvasMode>(
      "orbit"
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
          Rotate, reposition and
          solve the cube your way.
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
          dpr={[
            1,
            2,
          ]}
          gl={{
            antialias: true,
            powerPreference:
              "high-performance",
          }}
        >
          <color
            attach="background"
            args={[
              "#050a12",
            ]}
          />

          {/* =================================================
              LIGHTING
          ================================================= */}

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

          {/* =================================================
              CAMERA / CANVAS CONTROL
          ================================================= */}

          <CanvasControls
            mode={
              canvasMode
            }
          />

          {/* =================================================
              CAMERA FACE DETECTOR
          ================================================= */}

          <CameraFaceDetector
            onChange={
              updateMapping
            }
          />

          {/* =================================================
              CUBE

              Cube itself remains at origin.
          ================================================= */}

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
          CONTROL PANEL
      ================================================= */}

      <DraggableMovePanel
        mapping={
          mapping
        }
        moveMode={
          moveMode
        }
        setMoveMode={
          setMoveMode
        }
        canvasMode={
          canvasMode
        }
        setCanvasMode={
          setCanvasMode
        }
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
          items-start
          gap-2
          sm:bottom-6
          sm:left-6
        "
      >
        <a
          href="https://github.com/monishwarmc?tab=repositories"
          target="_blank"
          rel="noopener noreferrer"
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
          bottom-4
          right-4
          z-10
          max-w-[160px]
          text-right
          text-[9px]
          text-white/25
          sm:hidden
        "
      >
        {canvasMode ===
        "move"
          ? "Drag canvas to move"
          : "Drag canvas to orbit · Pinch to zoom"}
      </div>

      {/* =================================================
          DESKTOP HELP
      ================================================= */}

      <div
        className="
          pointer-events-none
          absolute
          bottom-5
          left-1/2
          z-10
          hidden
          -translate-x-1/2
          text-[10px]
          text-white/20
          sm:block
        "
      >
        {canvasMode ===
        "move"
          ? "Drag canvas to reposition the view"
          : "Drag canvas to orbit · Scroll to zoom"}
      </div>
    </main>
  );
}

/* =========================================================
   CANVAS CONTROLS

   Orbit:
     TrackballControls rotates camera.

   Move:
     Dragging moves BOTH:

       camera.position
       controls.target

     Therefore the cube stays at the
     world origin while the viewing
     position moves.

   IMPORTANT:
   No useThree() inside event handlers.
========================================================= */

function CanvasControls({
  mode,
}: {
  mode: CanvasMode;
}) {
  const controlsRef =
    useRef<
      React.ElementRef<
        typeof TrackballControls
      >
    >(null);

  const dragState =
    useRef({
      dragging: false,
      pointerId: -1,
      lastX: 0,
      lastY: 0,
    });

  const {
    camera,
    gl,
  } = useThree();

  const moveCanvas =
    useCallback(
      (
        deltaX: number,
        deltaY: number
      ) => {
        const controls =
          controlsRef.current;

        if (!controls) {
          return;
        }

        const right =
          new THREE.Vector3(
            1,
            0,
            0
          )
            .applyQuaternion(
              camera.quaternion
            )
            .normalize();

        const up =
          new THREE.Vector3(
            0,
            1,
            0
          )
            .applyQuaternion(
              camera.quaternion
            )
            .normalize();

        const distance =
          camera.position.distanceTo(
            controls.target
          );

        const fov =
          THREE.MathUtils.degToRad(
            45
          );

        const visibleHeight =
          2 *
          Math.tan(
            fov / 2
          ) *
          distance;

        const canvasHeight =
          gl.domElement.clientHeight;

        if (
          canvasHeight <= 0
        ) {
          return;
        }

        const worldPerPixel =
          visibleHeight /
          canvasHeight;

        const movement =
          right
            .clone()
            .multiplyScalar(
              deltaX *
                worldPerPixel
            )
            .add(
              up
                .clone()
                .multiplyScalar(
                  -deltaY *
                    worldPerPixel
                )
            );

        camera.position.add(
          movement
        );

        controls.target.add(
          movement
        );

        controls.update();
      },
      [
        camera,
        gl,
      ]
    );

  const handlePointerDown =
    useCallback(
      (
        event: PointerEvent
      ) => {
        if (
          mode !== "move"
        ) {
          return;
        }

        /*
         * Only start when the actual
         * canvas is touched.
         */

        if (
          event.target !==
          gl.domElement
        ) {
          return;
        }

        dragState.current = {
          dragging: true,

          pointerId:
            event.pointerId,

          lastX:
            event.clientX,

          lastY:
            event.clientY,
        };

        gl.domElement.setPointerCapture(
          event.pointerId
        );

        document.body.style.cursor =
          "grabbing";
      },
      [
        mode,
        gl,
      ]
    );

  const handlePointerMove =
    useCallback(
      (
        event: PointerEvent
      ) => {
        const drag =
          dragState.current;

        if (
          mode !== "move" ||
          !drag.dragging ||
          drag.pointerId !==
            event.pointerId
        ) {
          return;
        }

        const deltaX =
          event.clientX -
          drag.lastX;

        const deltaY =
          event.clientY -
          drag.lastY;

        drag.lastX =
          event.clientX;

        drag.lastY =
          event.clientY;

        moveCanvas(
          deltaX,
          deltaY
        );
      },
      [
        mode,
        moveCanvas,
      ]
    );

  const handlePointerUp =
    useCallback(
      (
        event: PointerEvent
      ) => {
        if (
          dragState.current
            .pointerId !==
          event.pointerId
        ) {
          return;
        }

        dragState.current.dragging =
          false;

        try {
          gl.domElement.releasePointerCapture(
            event.pointerId
          );
        } catch {
          // Already released.
        }

        document.body.style.cursor =
          "";
      },
      [gl]
    );

  useEffect(() => {
    const canvas =
      gl.domElement;

    canvas.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    canvas.addEventListener(
      "pointermove",
      handlePointerMove
    );

    canvas.addEventListener(
      "pointerup",
      handlePointerUp
    );

    canvas.addEventListener(
      "pointercancel",
      handlePointerUp
    );

    return () => {
      canvas.removeEventListener(
        "pointerdown",
        handlePointerDown
      );

      canvas.removeEventListener(
        "pointermove",
        handlePointerMove
      );

      canvas.removeEventListener(
        "pointerup",
        handlePointerUp
      );

      canvas.removeEventListener(
        "pointercancel",
        handlePointerUp
      );

      document.body.style.cursor =
        "";
    };
  }, [
    gl,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  ]);

  return (
    <TrackballControls
      ref={
        controlsRef
      }

      noPan

      noRotate={
        mode === "move"
      }

      noZoom={
        false
      }

      rotateSpeed={
        3
      }

      zoomSpeed={
        1.2
      }

      dynamicDampingFactor={
        0.15
      }

      staticMoving={
        false
      }

      minDistance={
        3
      }

      maxDistance={
        10
      }
    />
  );
}

/* =========================================================
   DRAGGABLE MOVE PANEL
========================================================= */

function DraggableMovePanel({
  mapping,
  moveMode,
  setMoveMode,
  canvasMode,
  setCanvasMode,
  rubiksRef,
}: {
  mapping: ViewMapping;

  moveMode: MoveMode;

  setMoveMode:
    React.Dispatch<
      React.SetStateAction<
        MoveMode
      >
    >;

  canvasMode: CanvasMode;

  setCanvasMode:
    React.Dispatch<
      React.SetStateAction<
        CanvasMode
      >
    >;

  rubiksRef:
    React.RefObject<
      RubiksHandle | null
    >;
}) {
  const panelRef =
    useRef<HTMLDivElement>(
      null
    );

  /* =======================================================
     PANEL DRAG
  ======================================================= */

  const dragState =
    useRef({
      dragging: false,
      pointerId: -1,
      offsetX: 0,
      offsetY: 0,
    });

  /* =======================================================
     PANEL RESIZE
  ======================================================= */

  const resizeState =
    useRef({
      resizing: false,
      pointerId: -1,
      startX: 0,
      startWidth: 0,
    });

  const [
    panelWidth,
    setPanelWidth,
  ] = useState(240);

  const [
    position,
    setPosition,
  ] =
    useState<{
      x: number;
      y: number;
    } | null>(null);

  /* =======================================================
     ACCORDION
  ======================================================= */

  const [
    openSection,
    setOpenSection,
  ] =
    useState<
      AccordionSection | ""
    >("canvas");

  const toggleSection =
    useCallback(
      (
        section: AccordionSection
      ) => {
        setOpenSection(
          current =>
            current === section
              ? ""
              : section
        );
      },
      []
    );

  /* =======================================================
     PANEL DRAG START
  ======================================================= */

  function handlePanelPointerDown(
    event: React.PointerEvent
  ) {
    const target =
      event.target as HTMLElement;

    /*
     * Do not drag when interacting
     * with buttons or resize handle.
     */

    if (
      target.closest(
        "button"
      ) ||
      target.closest(
        "[data-resize-handle]"
      )
    ) {
      return;
    }

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
     PANEL DRAG MOVE
  ======================================================= */

  function handlePanelPointerMove(
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

    const viewportWidth =
      window.innerWidth;

    const viewportHeight =
      window.innerHeight;

    const actualWidth =
      panel.offsetWidth;

    const actualHeight =
      panel.offsetHeight;

    let x =
      event.clientX -
      drag.offsetX;

    let y =
      event.clientY -
      drag.offsetY;

    x = Math.max(
      6,
      Math.min(
        x,
        viewportWidth -
          actualWidth -
          6
      )
    );

    y = Math.max(
      6,
      Math.min(
        y,
        viewportHeight -
          actualHeight -
          6
      )
    );

    setPosition({
      x,
      y,
    });
  }

  /* =======================================================
     PANEL DRAG END
  ======================================================= */

  function handlePanelPointerUp(
    event: React.PointerEvent
  ) {
    if (
      dragState.current
        .pointerId !==
      event.pointerId
    ) {
      return;
    }

    dragState.current.dragging =
      false;

    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId
      );
    }
  }

  /* =======================================================
     RESIZE START
  ======================================================= */

  function handleResizePointerDown(
    event: React.PointerEvent
  ) {
    event.stopPropagation();

    const panel =
      panelRef.current;

    if (!panel) {
      return;
    }

    const rect =
      panel.getBoundingClientRect();

    resizeState.current = {
      resizing: true,

      pointerId:
        event.pointerId,

      startX:
        event.clientX,

      startWidth:
        rect.width,
    };

    event.currentTarget.setPointerCapture(
      event.pointerId
    );
  }

  /* =======================================================
     RESIZE MOVE
  ======================================================= */

  function handleResizePointerMove(
    event: React.PointerEvent
  ) {
    const resize =
      resizeState.current;

    if (
      !resize.resizing ||
      resize.pointerId !==
        event.pointerId
    ) {
      return;
    }

    event.stopPropagation();

    const deltaX =
      event.clientX -
      resize.startX;

    const viewportWidth =
      window.innerWidth;

    /*
     * Mobile:
     * Keep enough width for the
     * control buttons.
     */

    const minWidth =
      Math.min(
        205,
        Math.max(
          180,
          viewportWidth - 24
        )
      );

    const maxWidth =
      Math.min(
        330,
        viewportWidth - 12
      );

    const newWidth =
      Math.max(
        minWidth,
        Math.min(
          maxWidth,
          resize.startWidth +
            deltaX
        )
      );

    setPanelWidth(
      newWidth
    );
  }

  /* =======================================================
     RESIZE END
  ======================================================= */

  function handleResizePointerUp(
    event: React.PointerEvent
  ) {
    if (
      resizeState.current
        .pointerId !==
      event.pointerId
    ) {
      return;
    }

    resizeState.current.resizing =
      false;

    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId
      );
    }
  }

  /* =======================================================
     PANEL
  ======================================================= */

  return (
    <section
      ref={
        panelRef
      }

      style={{
        width:
          `min(${panelWidth}px, calc(100vw - 12px))`,

        ...(position
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
          : {}),
      }}

      className="
        absolute
        bottom-3
        right-3
        z-50

        max-w-[calc(100vw-12px)]

        overflow-hidden

        rounded-xl

        border
        border-white/10

        bg-[#0b111c]/95

        shadow-[0_20px_70px_rgba(0,0,0,.55)]

        backdrop-blur-2xl

        sm:bottom-6
        sm:right-6
      "
    >

      {/* =================================================
          PANEL HEADER
      ================================================= */}

      <div
        onPointerDown={
          handlePanelPointerDown
        }

        onPointerMove={
          handlePanelPointerMove
        }

        onPointerUp={
          handlePanelPointerUp
        }

        onPointerCancel={
          handlePanelPointerUp
        }

        className="
          flex
          cursor-grab
          touch-none
          select-none
          items-center
          justify-between

          border-b
          border-white/8

          px-3
          py-2.5

          active:cursor-grabbing
        "
      >
        <div>
          <div
            className="
              text-[11px]
              font-semibold
              text-white
            "
          >
            Cube Controls
          </div>

          <div
            className="
              mt-0.5
              text-[8px]
              text-white/25
            "
          >
            Drag panel to move
          </div>
        </div>

        {/* Drag dots */}

        <div
          className="
            grid
            grid-cols-2
            gap-[3px]
            opacity-25
          "
        >
          {Array.from({
            length: 6,
          }).map(
            (_, index) => (
              <span
                key={
                  index
                }
                className="
                  h-[3px]
                  w-[3px]
                  rounded-full
                  bg-white
                "
              />
            )
          )}
        </div>
      </div>

      {/* =================================================
          CANVAS CONTROL ACCORDION
      ================================================= */}

      <div
        className="
          border-b
          border-white/8
        "
      >
        <AccordionHeader
          section="canvas"
          title="Cube interaction"
          description={
            canvasMode ===
            "orbit"
              ? "Orbit Cube"
              : "Drag Cube"
          }
          openSection={
            openSection
          }
          onToggle={
            toggleSection
          }
        />

        {openSection ===
          "canvas" && (
          <div
            className="
              px-3
              pb-3
            "
          >
            <div
              className="
                grid
                grid-cols-2
                gap-1

                rounded-lg
                bg-white/[0.035]
                p-1
              "
            >
              {/* ORBIT */}

              <button
                type="button"
                onClick={() =>
                  setCanvasMode(
                    "orbit"
                  )
                }
                className={`
                  rounded-md
                  px-2
                  py-2
                  text-[9px]
                  font-semibold
                  transition

                  ${
                    canvasMode ===
                    "orbit"
                      ? "bg-white/10 text-white"
                      : "text-white/30 hover:bg-white/6 hover:text-white/70"
                  }
                `}
              >
                Orbit Cube
              </button>

              {/* DRAG */}

              <button
                type="button"
                onClick={() =>
                  setCanvasMode(
                    "move"
                  )
                }
                className={`
                  rounded-md
                  px-2
                  py-2
                  text-[9px]
                  font-semibold
                  transition

                  ${
                    canvasMode ===
                    "move"
                      ? "bg-white/10 text-white"
                      : "text-white/30 hover:bg-white/6 hover:text-white/70"
                  }
                `}
              >
                Drag Cube
              </button>
            </div>

            <div
              className="
                mt-2
                px-1
                text-[8px]
                leading-relaxed
                text-white/25
              "
            >
              {canvasMode ===
              "orbit"
                ? "Drag the canvas to orbit around the cube."
                : "Drag the canvas to reposition the cube view without moving the cube itself."}
            </div>
          </div>
        )}
      </div>

      {/* =================================================
          CUBE VIEW ACCORDION
      ================================================= */}

      <div
        className="
          border-b
          border-white/8
        "
      >
        <AccordionHeader
          section="view"
          title="Cube view"
          description={
            moveMode ===
            "fixed"
              ? "Fixed face controls"
              : "Camera-relative controls"
          }
          openSection={
            openSection
          }
          onToggle={
            toggleSection
          }
        />

        {openSection ===
          "view" && (
          <div
            className="
              px-3
              pb-3
            "
          >
            <div
              className="
                grid
                grid-cols-2
                gap-1

                rounded-lg
                bg-white/[0.035]
                p-1
              "
            >
              {/* FIXED */}

              <button
                type="button"
                onClick={() =>
                  setMoveMode(
                    "fixed"
                  )
                }
                className={`
                  rounded-md
                  px-2
                  py-2
                  text-[9px]
                  font-semibold
                  transition

                  ${
                    moveMode ===
                    "fixed"
                      ? "bg-white/10 text-white"
                      : "text-white/30 hover:bg-white/6 hover:text-white/70"
                  }
                `}
              >
                Fixed
              </button>

              {/* CUBE VIEW */}

              <button
                type="button"
                onClick={() =>
                  setMoveMode(
                    "view"
                  )
                }
                className={`
                  rounded-md
                  px-2
                  py-2
                  text-[9px]
                  font-semibold
                  transition

                  ${
                    moveMode ===
                    "view"
                      ? "bg-white/10 text-white"
                      : "text-white/30 hover:bg-white/6 hover:text-white/70"
                  }
                `}
              >
                Cube View
              </button>
            </div>

            <div
              className="
                mt-2
                px-1
                text-[8px]
                leading-relaxed
                text-white/25
              "
            >
              {moveMode ===
              "fixed"
                ? "R, L, U, D, F, B always refer to physical cube faces."
                : "R, L, U, D, F, B follow the current camera view."
              }
            </div>
          </div>
        )}
      </div>

      {/* =================================================
          CUBE MOVES ACCORDION
      ================================================= */}

      <div>
        <AccordionHeader
          section="moves"
          title="Cube moves"
          description="R · L · U · D · F · B"
          openSection={
            openSection
          }
          onToggle={
            toggleSection
          }
        />

        {openSection ===
          "moves" && (
          <div
            className="
              p-2.5
            "
          >
            <div
              className="
                grid
                grid-cols-2
                gap-1.5
              "
            >
              {BUTTONS.map(
                button => {
                  const physicalFace =
                    moveMode ===
                    "view"
                      ? mapping[
                          button
                        ]
                      : button;

                  return (
                    <div
                      key={
                        button
                      }
                      className="
                        flex
                        gap-0.5
                      "
                    >
                      {/* CLOCKWISE */}

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
                          h-8
                          flex-1
                          items-center
                          justify-center

                          rounded-md

                          border
                          border-white/8

                          bg-white/[0.06]

                          text-xs
                          font-bold
                          text-white

                          transition

                          hover:bg-white/[0.12]

                          active:scale-95
                        "
                      >
                        {button}
                      </button>

                      {/* COUNTER CLOCKWISE */}

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
                          h-8
                          flex-1
                          items-center
                          justify-center

                          rounded-md

                          border
                          border-white/6

                          bg-white/[0.025]

                          text-xs
                          font-bold
                          text-white/45

                          transition

                          hover:bg-white/[0.08]

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

            {/* RESET */}

            <button
              type="button"
              onClick={() =>
                rubiksRef.current?.reset()
              }
              className="
                mt-2
                flex
                h-7
                w-full

                items-center
                justify-center

                rounded-md

                border
                border-white/6

                bg-white/[0.02]

                text-[9px]
                font-medium
                text-white/35

                transition

                hover:bg-white/[0.06]
                hover:text-white

                active:scale-[0.98]
              "
            >
              Reset Cube
            </button>
          </div>
        )}
      </div>

      {/* =================================================
          RESIZE HANDLE
      ================================================= */}

      <div
        data-resize-handle
        onPointerDown={
          handleResizePointerDown
        }
        onPointerMove={
          handleResizePointerMove
        }
        onPointerUp={
          handleResizePointerUp
        }
        onPointerCancel={
          handleResizePointerUp
        }
        className="
          absolute
          bottom-0
          right-0
          z-10

          h-7
          w-7

          cursor-nwse-resize

          touch-none
        "
        title="Resize controls"
      >
        <div
          className="
            absolute
            bottom-1.5
            right-1.5

            h-2.5
            w-2.5

            border-b
            border-r

            border-white/30
          "
        />
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
  const {
    size,
  } = useThree();

  const groupRef =
    useRef<THREE.Group>(
      null
    );

  useFrame(() => {
    const group =
      groupRef.current;

    if (!group) {
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
      scale =
        0.55;
    } else if (
      dimension < 480
    ) {
      scale =
        0.65;
    } else if (
      dimension < 640
    ) {
      scale =
        0.75;
    } else if (
      dimension < 900
    ) {
      scale =
        0.9;
    } else {
      scale =
        1;
    }

    group.scale.setScalar(
      scale
    );
  });

  return (
    <group
      ref={
        groupRef
      }
    >
      {children}
    </group>
  );
}