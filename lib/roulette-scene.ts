import * as T from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { WHEEL, isRed, roulettePose, type RouletteSpin } from "./roulette";

export type WheelView = "table" | "overhead";

export function createRouletteScene(
  host: HTMLElement,
  unavailable: () => void,
) {
  const renderer = new T.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(41, 1, 0.1, 40);
  const pmrem = new T.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.5;
  room.dispose();
  pmrem.dispose();
  scene.add(new T.HemisphereLight(0xffe5c0, 0x16281f, 1.1));
  const key = new T.DirectionalLight(0xffe9cf, 2.2);
  key.position.set(-3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, {
    left: -3,
    right: 3,
    top: 3,
    bottom: -3,
    near: 0.1,
    far: 12,
  });
  key.shadow.bias = -0.001;
  scene.add(key);
  const glow = new T.PointLight(0xdc7898, 12, 9);
  glow.position.set(3, 2, -3);
  scene.add(glow);

  const grain = document.createElement("canvas");
  grain.width = 256;
  grain.height = 256;
  const ink = grain.getContext("2d")!;
  ink.fillStyle = "#6f3824";
  ink.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 100; i++) {
    ink.strokeStyle = i % 2 ? "#4b281550" : "#e1a36138";
    ink.lineWidth = 0.6 + (i % 3);
    ink.beginPath();
    ink.moveTo(0, i * 2.6);
    for (let x = 0; x <= 256; x += 8)
      ink.lineTo(x, i * 2.6 + Math.sin(x * 0.035 + i) * 3);
    ink.stroke();
  }
  const woodMap = new T.CanvasTexture(grain);
  woodMap.colorSpace = T.SRGBColorSpace;
  const wood = new T.MeshPhysicalMaterial({
    map: woodMap,
    color: 0xc89978,
    roughness: 0.45,
    clearcoat: 0.35,
    clearcoatRoughness: 0.3,
  });
  const brass = new T.MeshStandardMaterial({
    color: 0xd3ad68,
    metalness: 0.8,
    roughness: 0.26,
  });
  const dark = new T.MeshStandardMaterial({ color: 0x1d1720, roughness: 0.48 });
  const green = new T.MeshStandardMaterial({
    color: 0x087547,
    roughness: 0.45,
  });
  const red = new T.MeshStandardMaterial({ color: 0xab263c, roughness: 0.44 });
  const black = new T.MeshStandardMaterial({
    color: 0x17151c,
    roughness: 0.48,
  });
  function mesh(
    geometry: T.BufferGeometry,
    material: T.Material,
    parent: T.Object3D = scene,
  ) {
    const object = new T.Mesh(geometry, material);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function ring(
    radius: number,
    tube: number,
    height: number,
    parent: T.Object3D = scene,
  ) {
    const object = mesh(
      new T.TorusGeometry(radius, tube, 10, 128),
      brass,
      parent,
    );
    object.rotation.x = -Math.PI / 2;
    object.position.y = height;
    return object;
  }
  const felt = mesh(
    new T.PlaneGeometry(40, 40),
    new T.MeshStandardMaterial({ color: 0x102c25, roughness: 1 }),
  );
  felt.rotation.x = -Math.PI / 2;
  felt.position.y = -0.23;
  const base = mesh(new T.CylinderGeometry(2.39, 2.34, 0.22, 128), wood);
  base.position.y = -0.06;
  const profile = [
    [1.84, 0.18],
    [1.94, 0.26],
    [2.04, 0.45],
    [2.2, 0.53],
    [2.34, 0.46],
    [2.43, 0.24],
    [2.39, 0.03],
    [1.85, 0.03],
  ].map(([r, y]) => new T.Vector2(r, y));
  const bowl = mesh(new T.LatheGeometry(profile, 128), wood);
  bowl.material.side = T.DoubleSide;
  ring(2.2, 0.035, 0.54);
  ring(2.39, 0.025, 0.04);
  ring(1.91, 0.023, 0.28);
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const stud = mesh(new T.SphereGeometry(0.045, 12, 8), brass);
    stud.position.set(Math.sin(angle) * 1.96, 0.3, Math.cos(angle) * 1.96);
  }
  const rotor = new T.Group();
  scene.add(rotor);
  const bed = mesh(new T.CylinderGeometry(1.86, 1.86, 0.14, 128), dark, rotor);
  bed.position.y = 0.14;
  const slice = (Math.PI * 2) / WHEEL.length;
  WHEEL.forEach((number, index) => {
    const start = index * slice - Math.PI / 2;
    const material = number === 0 ? green : isRed(number) ? red : black;
    const pocket = mesh(
      new T.RingGeometry(1.12, 1.49, 5, 1, start + 0.007, slice - 0.014),
      material,
      rotor,
    );
    pocket.rotation.x = -Math.PI / 2;
    pocket.position.y = 0.225;
    const band = mesh(
      new T.RingGeometry(1.51, 1.86, 5, 1, start + 0.001, slice - 0.002),
      material,
      rotor,
    );
    band.rotation.x = -Math.PI / 2;
    band.position.y = 0.235;
    const angle = index * slice;
    const divider = mesh(new T.BoxGeometry(0.022, 0.095, 0.38), brass, rotor);
    divider.position.set(Math.sin(angle) * 1.3, 0.265, Math.cos(angle) * 1.3);
    divider.rotation.y = angle;
    const labelCanvas = document.createElement("canvas");
    labelCanvas.width = 128;
    labelCanvas.height = 128;
    const text = labelCanvas.getContext("2d")!;
    text.fillStyle = "#fff4dd";
    text.font = "bold 70px Georgia";
    text.textAlign = "center";
    text.textBaseline = "middle";
    text.fillText(String(number), 64, 68);
    const texture = new T.CanvasTexture(labelCanvas);
    texture.colorSpace = T.SRGBColorSpace;
    const label = mesh(
      new T.PlaneGeometry(0.19, 0.21),
      new T.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
      }),
      rotor,
    );
    const center = angle + slice / 2;
    label.rotation.set(-Math.PI / 2, 0, Math.PI + center);
    label.position.set(Math.sin(center) * 1.69, 0.248, Math.cos(center) * 1.69);
    label.castShadow = false;
  });
  ring(1.1, 0.023, 0.25, rotor);
  ring(1.5, 0.023, 0.26, rotor);
  ring(1.86, 0.024, 0.25, rotor);
  const cone = mesh(
    new T.LatheGeometry(
      [
        [0.01, 0.47],
        [0.25, 0.44],
        [0.57, 0.29],
        [0.92, 0.24],
        [1.08, 0.23],
      ].map(([r, y]) => new T.Vector2(r, y)),
      96,
    ),
    wood,
    rotor,
  );
  cone.material.side = T.DoubleSide;
  const spindle = mesh(
    new T.CylinderGeometry(0.095, 0.14, 0.3, 24),
    brass,
    rotor,
  );
  spindle.position.y = 0.59;
  for (let i = 0; i < 2; i++) {
    const arm = mesh(new T.BoxGeometry(0.65, 0.065, 0.065), brass, rotor);
    arm.position.y = 0.75;
    arm.rotation.y = (i * Math.PI) / 2;
  }
  const cap = mesh(new T.SphereGeometry(0.09, 24, 16), brass, rotor);
  cap.position.y = 0.81;
  const ball = mesh(
    new T.SphereGeometry(0.065, 24, 16),
    new T.MeshPhysicalMaterial({
      color: 0xfff7dc,
      roughness: 0.18,
      clearcoat: 1,
    }),
  );
  ball.visible = false;

  let spin: RouletteSpin | null = null;
  let spinning = false;
  let viewpoint: WheelView = "table";
  let frame = 0;
  let disposed = false;
  let inView = true;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  function render() {
    frame = 0;
    if (disposed) return;
    if (spin) {
      const progress =
        spinning && !motion.matches
          ? (Date.now() - spin.startedAt) / (spin.endsAt - spin.startedAt)
          : 1;
      const pose = roulettePose(spin.result, progress);
      rotor.rotation.y = pose.wheel;
      ball.visible = true;
      ball.position.set(
        Math.sin(pose.ball) * pose.radius,
        pose.height,
        Math.cos(pose.ball) * pose.radius,
      );
      if (
        spinning &&
        progress < 1 &&
        inView &&
        !document.hidden &&
        !motion.matches
      )
        frame = requestAnimationFrame(render);
    }
    const widthFactor = Math.min(1, camera.aspect / 1.45);
    if (viewpoint === "overhead")
      camera.position.set(0, 7.6 / widthFactor, 0.01);
    else camera.position.set(0, 3.4 / widthFactor, 4.4 / widthFactor);
    camera.lookAt(0, 0.1, 0);
    renderer.render(scene, camera);
  }
  function requestRender() {
    cancelAnimationFrame(frame);
    render();
  }
  const resize = new ResizeObserver(() => {
    const width = Math.max(host.clientWidth, 1),
      height = Math.max(host.clientHeight, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    requestRender();
  });
  resize.observe(host);
  const observer = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) requestRender();
    else {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  });
  observer.observe(host);
  const visibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else requestRender();
  };
  document.addEventListener("visibilitychange", visibility);
  motion.addEventListener("change", requestRender);
  const lost = (event: Event) => {
    event.preventDefault();
    cancelAnimationFrame(frame);
    unavailable();
  };
  renderer.domElement.addEventListener("webglcontextlost", lost);
  return {
    update(next: RouletteSpin | null, active: boolean, view: WheelView) {
      spin = next;
      spinning = active;
      viewpoint = view;
      requestRender();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", requestRender);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      const geometries = new Set<T.BufferGeometry>(),
        materials = new Set<T.Material>(),
        textures = new Set<T.Texture>();
      scene.traverse((object) => {
        if (object instanceof T.Mesh) {
          geometries.add(object.geometry);
          for (const material of Array.isArray(object.material)
            ? object.material
            : [object.material]) {
            materials.add(material);
            const map = (material as T.MeshStandardMaterial).map;
            if (map) textures.add(map);
          }
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      environment.dispose();
      key.shadow.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
