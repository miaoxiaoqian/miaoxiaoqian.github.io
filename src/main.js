import * as THREE from "three";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const graphTooltip = document.querySelector("#graph-tooltip");
const packetCounter = document.querySelector("#packet-count");
const diagnosticButton = document.querySelector("#diagnostic-button");

async function hydrateRobotAssets() {
  const loadRobotPose = async (path) => {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Robot asset returned ${response.status}`);
    const binary = atob((await response.text()).trim());
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return URL.createObjectURL(new Blob([bytes], { type: "image/webp" }));
  };

  const [gripUrl, pullUrl] = await Promise.all([
    loadRobotPose("/media/humanoid-robot-grip.webp.b64"),
    loadRobotPose("/media/humanoid-robot-pull.webp.b64"),
  ]);

  document.querySelectorAll('[data-robot-pose="grip"]').forEach((image) => {
    image.src = gripUrl;
  });
  document.querySelectorAll('[data-robot-pose="pull"]').forEach((image) => {
    image.src = pullUrl;
  });
  document.querySelectorAll(".robot-asset").forEach((robot) => {
    robot.style.setProperty("--robot-image", `url("${pullUrl}")`);
  });
}

async function setupEntrySequence() {
  await hydrateRobotAssets();
  const sequence = document.querySelector("#entry-sequence");
  const skipButton = document.querySelector("#entry-skip");
  const introRobot = sequence?.querySelector(".entry-robot-imprint");
  let backgroundRobot = document.querySelector("#robot-watermark");
  if (!sequence) {
    backgroundRobot?.classList.add("is-traced", "is-settled");
    return;
  }

  const forcedPreview = new URLSearchParams(window.location.search).get("intro") === "1";
  let alreadyViewed = false;
  try {
    alreadyViewed = window.sessionStorage.getItem("qian-entry-sequence") === "viewed";
  } catch {
    alreadyViewed = false;
  }

  if (prefersReducedMotion || (alreadyViewed && !forcedPreview)) {
    sequence.remove();
    backgroundRobot?.classList.add("is-traced", "is-settled");
    return;
  }

  document.body.classList.add("is-entry-locked");
  let completed = false;
  let gripTimer;
  let openingTimer;
  let tracingTimer;
  let mappingTimer;
  let completionTimer;

  const completeSequence = () => {
    if (completed) return;
    completed = true;
    window.clearTimeout(gripTimer);
    window.clearTimeout(openingTimer);
    window.clearTimeout(tracingTimer);
    window.clearTimeout(mappingTimer);
    window.clearTimeout(completionTimer);
    sequence.classList.add("is-complete");
    backgroundRobot?.classList.add("is-settled");
    document.body.classList.remove("is-entry-locked");
    try {
      window.sessionStorage.setItem("qian-entry-sequence", "viewed");
    } catch {
      // The animation remains functional when storage is unavailable.
    }
  };

  const traceRobotContour = () => {
    sequence.classList.add("is-tracing");
    introRobot?.classList.add("is-traced");
  };

  const mapRobotDirectlyToBackground = () => {
    if (!introRobot || introRobot.classList.contains("robot-watermark")) return;
    introRobot.classList.add("is-traced");
    backgroundRobot?.remove();
    introRobot.classList.remove("entry-robot-imprint");
    introRobot.classList.add("robot-watermark", "is-mapped");
    introRobot.id = "robot-watermark";
    sequence.insertAdjacentElement("afterend", introRobot);
    backgroundRobot = introRobot;
    window.requestAnimationFrame(() => backgroundRobot?.classList.add("is-settled"));
  };

  const beginOpening = () => {
    sequence.classList.add("is-opening");
    tracingTimer = window.setTimeout(traceRobotContour, 2180);
    mappingTimer = window.setTimeout(mapRobotDirectlyToBackground, 3540);
    completionTimer = window.setTimeout(completeSequence, 3980);
  };

  gripTimer = window.setTimeout(() => sequence.classList.add("is-gripping"), 320);
  openingTimer = window.setTimeout(beginOpening, 760);
  skipButton?.addEventListener("click", () => {
    sequence.classList.add("is-opening");
    traceRobotContour();
    mapRobotDirectlyToBackground();
    window.setTimeout(completeSequence, 320);
  });
}

setupEntrySequence().catch((error) => {
  document.body.classList.remove("is-entry-locked");
  document.querySelector("#entry-sequence")?.remove();
  document.querySelector("#robot-watermark")?.classList.add("is-traced", "is-settled");
  console.warn("Robot entry asset unavailable.", error);
});

const researchNodes = [
  {
    id: "embodied",
    index: "NODE_01",
    title: "Embodied Intelligence",
    group: "CORE RESEARCH DIRECTION",
    status: "CURRENT FOCUS",
    description: "让智能体通过身体与真实环境交互，从多模态感知、空间推理走向连续且可靠的行动。",
    relation: "6 CONNECTED NODES",
    mode: "RESEARCH / BUILD",
    position: [0, 0, 0.8],
    kind: "core",
    links: [{ label: "CODE PROFILE ↗", href: "https://github.com/miaoxiaoqian" }],
  },
  {
    id: "perception",
    index: "NODE_02",
    title: "Perception",
    group: "MULTIMODAL SENSING",
    status: "ACTIVE STUDY",
    description: "研究视觉、语言与本体传感如何形成面向行动的统一环境表征。",
    relation: "4 CONNECTED NODES",
    mode: "LEARN / TEST",
    position: [-3.3, 2.15, -0.2],
    kind: "active",
  },
  {
    id: "policy",
    index: "NODE_03",
    title: "Policy Learning",
    group: "DECISION & LEARNING",
    status: "ACTIVE STUDY",
    description: "关注 VLA、机器人策略学习，以及长时序任务中的规划与决策。",
    relation: "5 CONNECTED NODES",
    mode: "LEARN / BUILD",
    position: [3.2, 2.1, -0.35],
    kind: "active",
  },
  {
    id: "spatial",
    index: "NODE_04",
    title: "Spatial Commonsense",
    group: "SPATIAL REASONING",
    status: "LITERATURE REVIEW",
    description: "探索智能体如何理解空间关系、物体可供性与物理约束，并将常识用于行动规划。",
    relation: "4 CONNECTED NODES",
    mode: "READ / MODEL",
    position: [-3.55, -2.15, 0.1],
    kind: "foundation",
  },
  {
    id: "control",
    index: "NODE_05",
    title: "Control",
    group: "CLOSED-LOOP ACTION",
    status: "FOUNDATION",
    description: "学习闭环控制、状态反馈与轨迹执行，使策略输出能够稳定作用于真实系统。",
    relation: "4 CONNECTED NODES",
    mode: "LEARN / VERIFY",
    position: [3.45, -2.2, -0.1],
    kind: "foundation",
  },
  {
    id: "sim2real",
    index: "NODE_06",
    title: "Sim2Real",
    group: "TRANSFER & ROBUSTNESS",
    status: "EXPLORING",
    description: "关注仿真数据、域随机化与真实机器人部署之间的分布差异和可靠性问题。",
    relation: "3 CONNECTED NODES",
    mode: "EXPLORE / TEST",
    position: [0.2, -3.35, -1.4],
    kind: "active",
  },
  {
    id: "vision",
    index: "NODE_07",
    title: "Computer Vision",
    group: "FOUNDATIONAL CAPABILITY",
    status: "FOUNDATION",
    description: "从视觉表示、检测与场景理解出发，为机器人感知建立稳定的计算基础。",
    relation: "3 CONNECTED NODES",
    mode: "LEARN / IMPLEMENT",
    position: [-4.25, 0.15, -1.65],
    kind: "foundation",
  },
  {
    id: "systems",
    index: "NODE_08",
    title: "Systems & Engineering",
    group: "FOUNDATIONAL CAPABILITY",
    status: "FOUNDATION",
    description: "通过算法、系统和工程实践，把研究想法转化为可运行、可复现、可维护的实验。",
    relation: "3 CONNECTED NODES",
    mode: "BUILD / ITERATE",
    position: [4.25, 0.1, -1.55],
    kind: "foundation",
  },
];

const researchEdges = [
  ["embodied", "perception"],
  ["embodied", "policy"],
  ["embodied", "spatial"],
  ["embodied", "control"],
  ["embodied", "sim2real"],
  ["perception", "vision"],
  ["perception", "spatial"],
  ["policy", "spatial"],
  ["policy", "systems"],
  ["control", "sim2real"],
  ["control", "systems"],
];

const kindColors = {
  core: 0x4f7ff2,
  active: 0x10b981,
  foundation: 0x657080,
};

function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  return renderer;
}

function resizeRenderer(renderer, camera, canvas) {
  const width = Math.max(canvas.clientWidth, 1);
  const height = Math.max(canvas.clientHeight, 1);
  const pixelRatio = renderer.getPixelRatio();
  const needsResize = canvas.width !== Math.floor(width * pixelRatio) || canvas.height !== Math.floor(height * pixelRatio);
  if (!needsResize) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function createParticleField(count, spread, color, opacity) {
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const radius = spread * (0.35 + Math.random() * 0.65);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[index * 3 + 2] = radius * Math.cos(phi);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color,
    size: 0.025,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(geometry, material);
}

function createNodeLabel(node) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 112;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(12, 15, 20, 0.86)";
  context.strokeStyle = node.kind === "core"
    ? "rgba(79, 127, 242, 0.72)"
    : node.kind === "active"
      ? "rgba(16, 185, 129, 0.55)"
      : "rgba(150, 160, 176, 0.28)";
  context.lineWidth = 2;
  context.beginPath();
  context.roundRect(4, 4, 504, 104, 16);
  context.fill();
  context.stroke();
  context.fillStyle = node.kind === "foundation" ? "#a3adba" : "#e4e9f2";
  context.font = "600 27px SFMono-Regular, Consolas, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(node.title.toUpperCase(), 256, 44);
  context.fillStyle = node.kind === "active" ? "#79c9aa" : "#7184ad";
  context.font = "500 17px SFMono-Regular, Consolas, monospace";
  context.fillText(node.status, 256, 76);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    opacity: node.kind === "foundation" ? 0.72 : 0.92,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.25, 0.49, 1);
  sprite.renderOrder = 12;
  return sprite;
}

function buildSpatialCore(canvas) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0d0f12, 0.055);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.25, 11.8);

  const renderer = createRenderer(canvas);
  const group = new THREE.Group();
  scene.add(group);

  scene.add(new THREE.AmbientLight(0x8ba3c7, 0.42));
  const keyLight = new THREE.PointLight(0x4f7ff2, 8, 24, 2);
  keyLight.position.set(3, 4, 7);
  scene.add(keyLight);
  const fillLight = new THREE.PointLight(0x10b981, 2.2, 18, 2);
  fillLight.position.set(-5, -3, 2);
  scene.add(fillLight);

  const nodeGeometry = new THREE.SphereGeometry(0.095, 16, 16);
  const coreGeometry = new THREE.SphereGeometry(0.17, 24, 24);
  const nodeMeshes = [];
  const positions = [];
  const labels = ["RGB-D", "LANGUAGE", "PROPRIOCEPTION", "WORLD MODEL", "VLA POLICY", "CONTROL", "FEEDBACK", "MEMORY"];

  const corePositions = [
    [-2.25, 0.65, 0.1],
    [-0.7, 1.05, 0.4],
    [0.85, 0.35, 0.3],
    [2.3, -0.45, 0.1],
  ];

  corePositions.forEach((position, index) => {
    const material = new THREE.MeshStandardMaterial({
      color: index === 3 ? 0x10b981 : 0x4f7ff2,
      emissive: index === 3 ? 0x063b2a : 0x102a72,
      emissiveIntensity: 0.85,
      roughness: 0.3,
      metalness: 0.32,
    });
    const mesh = new THREE.Mesh(coreGeometry, material);
    mesh.position.set(...position);
    mesh.userData = { label: labels[index + 3], core: true };
    group.add(mesh);
    nodeMeshes.push(mesh);
    positions.push(mesh.position.clone());
  });

  for (let index = 0; index < 34; index += 1) {
    const lane = index % 4;
    const x = -4.7 + (index / 33) * 9.4 + (Math.random() - 0.5) * 0.65;
    const y = Math.sin(index * 0.72) * 1.45 + (lane - 1.5) * 0.36 + (Math.random() - 0.5) * 0.5;
    const z = Math.cos(index * 0.53) * 1.35 + (Math.random() - 0.5) * 0.75;
    const material = new THREE.MeshStandardMaterial({
      color: lane === 3 ? 0x10b981 : 0x7892bf,
      emissive: lane === 3 ? 0x053c29 : 0x162238,
      emissiveIntensity: 0.36,
      roughness: 0.5,
      metalness: 0.2,
      transparent: true,
      opacity: 0.82,
    });
    const mesh = new THREE.Mesh(nodeGeometry, material);
    mesh.position.set(x, y, z);
    mesh.userData = { label: labels[index % labels.length], core: false };
    group.add(mesh);
    nodeMeshes.push(mesh);
    positions.push(mesh.position.clone());
  }

  const edgePairs = [];
  for (let index = 0; index < positions.length - 1; index += 1) {
    edgePairs.push([index, index + 1]);
    if (index + 4 < positions.length && index % 2 === 0) edgePairs.push([index, index + 4]);
  }
  corePositions.forEach((_, coreIndex) => {
    edgePairs.push([coreIndex, 5 + coreIndex * 7]);
    edgePairs.push([coreIndex, 9 + coreIndex * 6]);
  });

  const edgeVertices = [];
  edgePairs.forEach(([start, end]) => {
    if (!positions[start] || !positions[end]) return;
    edgeVertices.push(...positions[start].toArray(), ...positions[end].toArray());
  });
  const edgeGeometry = new THREE.BufferGeometry();
  edgeGeometry.setAttribute("position", new THREE.Float32BufferAttribute(edgeVertices, 3));
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x4066a6, transparent: true, opacity: 0.2 });
  group.add(new THREE.LineSegments(edgeGeometry, edgeMaterial));

  const particleField = createParticleField(280, 8.5, 0x5d78a9, 0.22);
  group.add(particleField);

  const packetGeometry = new THREE.SphereGeometry(0.045, 10, 10);
  const packetMaterial = new THREE.MeshBasicMaterial({ color: 0x7da0ff });
  const packets = Array.from({ length: 12 }, (_, index) => {
    const edge = edgePairs[(index * 5) % edgePairs.length];
    const packet = new THREE.Mesh(packetGeometry, packetMaterial);
    packet.userData = { edge, progress: index / 12, speed: 0.035 + (index % 4) * 0.006 };
    group.add(packet);
    return packet;
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(10, 10);
  const pointerTarget = new THREE.Vector2();
  let hovered = null;
  let boostUntil = 0;
  let visible = true;

  function setPointer(event) {
    const bounds = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    pointerTarget.set(pointer.x, pointer.y);
    graphTooltip.style.left = `${event.clientX}px`;
    graphTooltip.style.top = `${event.clientY}px`;
  }

  canvas.addEventListener("pointermove", setPointer, { passive: true });
  canvas.addEventListener("pointerleave", () => {
    pointer.set(10, 10);
    graphTooltip.classList.remove("is-visible");
    hovered = null;
  });

  function update(time, delta) {
    if (!visible || window.innerWidth <= 640) return;
    resizeRenderer(renderer, camera, canvas);
    const seconds = time * 0.001;
    const boost = time < boostUntil ? 3.2 : 1;

    group.rotation.y += (pointerTarget.x * 0.085 - group.rotation.y) * 0.035;
    group.rotation.x += (-pointerTarget.y * 0.045 - group.rotation.x) * 0.035;
    group.position.y = Math.sin(seconds * 0.28) * 0.08;
    particleField.rotation.y = seconds * 0.012;

    packets.forEach((packet) => {
      packet.userData.progress = (packet.userData.progress + packet.userData.speed * delta * boost) % 1;
      const [startIndex, endIndex] = packet.userData.edge;
      const start = positions[startIndex];
      const end = positions[endIndex];
      if (start && end) packet.position.lerpVectors(start, end, packet.userData.progress);
      packet.scale.setScalar(1 + (boost - 1) * 0.25);
    });

    raycaster.setFromCamera(pointer, camera);
    const intersections = raycaster.intersectObjects(nodeMeshes, false);
    const nextHovered = intersections[0]?.object ?? null;
    if (nextHovered !== hovered) {
      if (hovered) hovered.scale.setScalar(1);
      hovered = nextHovered;
      if (hovered) {
        hovered.scale.setScalar(1.7);
        graphTooltip.textContent = `${hovered.userData.label} / DATA NODE`;
        graphTooltip.classList.add("is-visible");
      } else {
        graphTooltip.classList.remove("is-visible");
      }
    }

    renderer.render(scene, camera);
  }

  function runDiagnostic() {
    boostUntil = performance.now() + 2300;
  }

  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.03 });
  observer.observe(canvas);

  return { update, runDiagnostic };
}

function buildKnowledgeMap(canvas) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0c0f14, 0.075);
  const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 50);
  camera.position.set(0, 0.2, 11.4);
  const renderer = createRenderer(canvas);
  const group = new THREE.Group();
  scene.add(group);

  scene.add(new THREE.AmbientLight(0xa4b4cf, 0.55));
  const blueLight = new THREE.PointLight(0x4f7ff2, 7, 20, 2);
  blueLight.position.set(2, 4, 7);
  scene.add(blueLight);
  const greenLight = new THREE.PointLight(0x10b981, 2.5, 15, 2);
  greenLight.position.set(-4, -2, 4);
  scene.add(greenLight);

  const meshes = [];
  const meshById = new Map();
  researchNodes.forEach((node) => {
    const radius = node.kind === "core" ? 0.34 : node.kind === "active" ? 0.23 : 0.18;
    const geometry = new THREE.IcosahedronGeometry(radius, 2);
    const material = new THREE.MeshStandardMaterial({
      color: kindColors[node.kind],
      emissive: kindColors[node.kind],
      emissiveIntensity: node.kind === "core" ? 0.32 : 0.14,
      metalness: 0.42,
      roughness: 0.3,
      transparent: true,
      opacity: node.kind === "foundation" ? 0.86 : 1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...node.position);
    mesh.userData = { node };
    group.add(mesh);
    meshes.push(mesh);
    meshById.set(node.id, mesh);

    const label = createNodeLabel(node);
    label.position.copy(mesh.position);
    label.position.y -= node.kind === "core" ? 0.74 : 0.58;
    group.add(label);

    if (node.kind === "core") {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.52, 0.012, 8, 80),
        new THREE.MeshBasicMaterial({ color: 0x4f7ff2, transparent: true, opacity: 0.42 }),
      );
      ring.rotation.x = Math.PI * 0.48;
      mesh.add(ring);
    }
  });

  const edgeVertices = [];
  researchEdges.forEach(([startId, endId]) => {
    const start = meshById.get(startId)?.position;
    const end = meshById.get(endId)?.position;
    if (start && end) edgeVertices.push(...start.toArray(), ...end.toArray());
  });
  const edgeGeometry = new THREE.BufferGeometry();
  edgeGeometry.setAttribute("position", new THREE.Float32BufferAttribute(edgeVertices, 3));
  group.add(new THREE.LineSegments(edgeGeometry, new THREE.LineBasicMaterial({ color: 0x526a99, transparent: true, opacity: 0.34 })));
  group.add(createParticleField(150, 6.5, 0x617aa8, 0.17));

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(10, 10);
  const pointerTarget = new THREE.Vector2();
  let hovered = null;
  let selected = meshById.get("embodied");
  let visible = false;

  function updatePointer(event) {
    const bounds = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    pointerTarget.set(pointer.x, pointer.y);
    graphTooltip.style.left = `${event.clientX}px`;
    graphTooltip.style.top = `${event.clientY}px`;
  }

  canvas.addEventListener("pointermove", updatePointer, { passive: true });
  canvas.addEventListener("pointerleave", () => {
    pointer.set(10, 10);
    graphTooltip.classList.remove("is-visible");
    canvas.style.cursor = "default";
  });
  canvas.addEventListener("click", () => {
    if (!hovered) return;
    selected = hovered;
    updateResearchDrawer(hovered.userData.node.id);
  });

  function update(time) {
    if (!visible || window.innerWidth <= 900) return;
    resizeRenderer(renderer, camera, canvas);
    const seconds = time * 0.001;
    group.rotation.y += (pointerTarget.x * 0.075 - group.rotation.y) * 0.035;
    group.rotation.x += (-pointerTarget.y * 0.04 - group.rotation.x) * 0.035;
    group.position.y = Math.sin(seconds * 0.32) * 0.04;

    meshes.forEach((mesh, index) => {
      const targetScale = mesh === selected ? 1.5 : mesh === hovered ? 1.28 : 1;
      const nextScale = THREE.MathUtils.lerp(mesh.scale.x, targetScale, 0.12);
      mesh.scale.setScalar(nextScale);
      mesh.rotation.y += 0.003 + index * 0.00015;
    });

    raycaster.setFromCamera(pointer, camera);
    hovered = raycaster.intersectObjects(meshes, false)[0]?.object ?? null;
    canvas.style.cursor = hovered ? "pointer" : "default";
    if (hovered) {
      graphTooltip.textContent = `${hovered.userData.node.index} / ${hovered.userData.node.title}`;
      graphTooltip.classList.add("is-visible");
    } else {
      graphTooltip.classList.remove("is-visible");
    }
    renderer.render(scene, camera);
  }

  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.03 });
  observer.observe(canvas);
  return { update };
}

function updateResearchDrawer(nodeId) {
  const node = researchNodes.find((item) => item.id === nodeId);
  if (!node) return;
  document.querySelector("#drawer-index").textContent = node.index;
  document.querySelector("#drawer-status").innerHTML = `<i></i> ${node.status}`;
  document.querySelector("#drawer-group").textContent = node.group;
  document.querySelector("#drawer-title").textContent = node.title;
  document.querySelector("#drawer-description").textContent = node.description;
  document.querySelector("#drawer-relation").textContent = node.relation;
  document.querySelector("#drawer-mode").textContent = node.mode;

  const links = document.querySelector("#drawer-links");
  links.replaceChildren();
  (node.links ?? []).forEach((resource) => {
    const anchor = document.createElement("a");
    anchor.href = resource.href;
    anchor.target = "_blank";
    anchor.rel = "noreferrer";
    anchor.textContent = resource.label;
    links.append(anchor);
  });
  const upcoming = document.createElement("span");
  upcoming.textContent = "PUBLICATION INDEX / UPCOMING";
  links.append(upcoming);

  document.querySelectorAll("[data-node-id]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.nodeId === nodeId);
  });
}

function buildRobotArm(canvas) {
  if (!canvas) return null;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40);
  camera.position.set(7.1, 4.8, 8.2);
  camera.lookAt(0, 1.72, 0);
  const renderer = createRenderer(canvas);
  renderer.toneMappingExposure = 1.06;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene.add(new THREE.HemisphereLight(0xdce7ff, 0x030405, 1.55));
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.6);
  keyLight.position.set(4.5, 7, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(768, 768);
  keyLight.shadow.camera.left = -5;
  keyLight.shadow.camera.right = 5;
  keyLight.shadow.camera.top = 6;
  keyLight.shadow.camera.bottom = -2;
  scene.add(keyLight);
  const rimLight = new THREE.PointLight(0xffffff, 6, 12, 2);
  rimLight.position.set(-3, 3.5, -2.5);
  scene.add(rimLight);

  const grid = new THREE.GridHelper(8, 20, 0x294f9e, 0x14213c);
  grid.material.transparent = true;
  grid.material.opacity = 0.42;
  scene.add(grid);
  const shadowFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.34 }),
  );
  shadowFloor.rotation.x = -Math.PI / 2;
  shadowFloor.position.y = -0.012;
  shadowFloor.receiveShadow = true;
  scene.add(shadowFloor);

  function addAxis(start, end, color) {
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    scene.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.78 })));
  }
  addAxis(new THREE.Vector3(0, 0.012, 0), new THREE.Vector3(3.2, 0.012, 0), 0xf1f3f5);
  addAxis(new THREE.Vector3(0, 0.012, 0), new THREE.Vector3(0, 0.012, 3.2), 0x777d85);
  addAxis(new THREE.Vector3(0, 0.012, 0), new THREE.Vector3(0, 3.2, 0), 0xc6cbd1);

  function createArmLabel(text, color = "#c9cdd2") {
    const labelCanvas = document.createElement("canvas");
    labelCanvas.width = 256;
    labelCanvas.height = 64;
    const context = labelCanvas.getContext("2d");
    context.clearRect(0, 0, 256, 64);
    context.fillStyle = "rgba(5, 7, 10, 0.84)";
    context.strokeStyle = "rgba(255, 255, 255, 0.08)";
    context.lineWidth = 2;
    context.beginPath();
    context.roundRect(3, 3, 250, 58, 9);
    context.fill();
    context.stroke();
    context.fillStyle = color;
    context.font = "500 22px monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, 128, 33);
    const texture = new THREE.CanvasTexture(labelCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
    sprite.scale.set(1.15, 0.29, 1);
    return sprite;
  }

  const labelX = createArmLabel("X / FORWARD", "#f2f3f5");
  labelX.position.set(3.45, 0.08, 0);
  scene.add(labelX);
  const labelY = createArmLabel("Y / LATERAL", "#92979e");
  labelY.position.set(0, 0.08, 3.45);
  scene.add(labelY);
  const labelZ = createArmLabel("Z / VERTICAL", "#c5c9ce");
  labelZ.position.set(0, 3.45, 0);
  scene.add(labelZ);

  const linkMaterial = new THREE.MeshStandardMaterial({ color: 0xc8cdd3, metalness: 0.52, roughness: 0.3 });
  const linkInsetMaterial = new THREE.MeshStandardMaterial({ color: 0x12161c, metalness: 0.66, roughness: 0.25 });
  const jointMaterial = new THREE.MeshStandardMaterial({ color: 0x0d1116, metalness: 0.74, roughness: 0.22 });
  const jointCapMaterial = new THREE.MeshStandardMaterial({ color: 0xe4e7eb, metalness: 0.58, roughness: 0.26 });
  const jointRingMaterial = new THREE.MeshBasicMaterial({ color: 0xf1f3f5, transparent: true, opacity: 0.54 });
  const robot = new THREE.Group();
  robot.position.set(-0.4, 0, 0);
  robot.scale.setScalar(0.76);
  scene.add(robot);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.82, 0.28, 40), linkMaterial);
  base.position.y = 0.14;
  robot.add(base);
  const baseInset = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.56, 0.4, 36), linkInsetMaterial);
  baseInset.position.y = 0.44;
  robot.add(baseInset);

  function addJoint(parent, radius = 0.28) {
    const joint = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 18), jointMaterial);
    parent.add(joint);
    const axisCap = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.72, radius * 0.72, 0.075, 24), jointCapMaterial);
    axisCap.rotation.x = Math.PI / 2;
    axisCap.position.z = radius * 0.86;
    parent.add(axisCap);
    const rearCap = axisCap.clone();
    rearCap.position.z *= -1;
    parent.add(rearCap);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.08, 0.018, 8, 42), jointRingMaterial);
    ring.rotation.x = Math.PI / 2;
    parent.add(ring);
    return joint;
  }

  function addLink(parent, length, radius, offset = length / 2) {
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.82, radius, length, 24), linkMaterial);
    shell.position.y = offset;
    parent.add(shell);
    const inset = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.26, radius * 0.3, length * 0.72, 18), linkInsetMaterial);
    inset.position.y = offset;
    parent.add(inset);
    return shell;
  }

  const joint1 = new THREE.Group();
  joint1.position.y = 0.7;
  robot.add(joint1);
  addJoint(joint1, 0.34);

  const shoulderColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.34, 0.72, 24), linkMaterial);
  shoulderColumn.position.y = 0.38;
  joint1.add(shoulderColumn);

  const joint2 = new THREE.Group();
  joint2.position.y = 0.78;
  joint1.add(joint2);
  addJoint(joint2, 0.31);
  addLink(joint2, 1.5, 0.24);

  const joint3 = new THREE.Group();
  joint3.position.y = 1.5;
  joint2.add(joint3);
  addJoint(joint3, 0.28);
  addLink(joint3, 1.22, 0.2);

  const joint4 = new THREE.Group();
  joint4.position.y = 1.22;
  joint3.add(joint4);
  addJoint(joint4, 0.23);
  addLink(joint4, 0.54, 0.15);

  const joint5 = new THREE.Group();
  joint5.position.y = 0.54;
  joint4.add(joint5);
  addJoint(joint5, 0.18);
  addLink(joint5, 0.34, 0.12);

  const joint6 = new THREE.Group();
  joint6.position.y = 0.34;
  joint5.add(joint6);
  addJoint(joint6, 0.14);

  const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.26, 18), linkMaterial);
  wrist.position.y = 0.13;
  joint6.add(wrist);
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.16, 0.3), linkInsetMaterial);
  palm.position.y = 0.34;
  joint6.add(palm);
  const fingerLeft = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.38, 0.11), linkMaterial);
  fingerLeft.position.set(-0.15, 0.58, 0);
  joint6.add(fingerLeft);
  const fingerRight = fingerLeft.clone();
  fingerRight.position.x = 0.15;
  joint6.add(fingerRight);

  const tcp = new THREE.Object3D();
  tcp.position.y = 0.82;
  joint6.add(tcp);
  const tcpMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.085, 20, 16),
    new THREE.MeshStandardMaterial({ color: 0xf4f5f6, emissive: 0x858a90, emissiveIntensity: 1.15, roughness: 0.25 }),
  );
  tcp.add(tcpMarker);
  const tcpLabel = createArmLabel("TCP / LIVE", "#f1f3f5");
  tcpLabel.position.set(0.62, 0.16, 0);
  tcp.add(tcpLabel);

  robot.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
  });

  const trajectoryGeometry = new THREE.BufferGeometry();
  const trajectoryPoints = new Float32Array(90 * 3);
  trajectoryGeometry.setAttribute("position", new THREE.BufferAttribute(trajectoryPoints, 3));
  const trajectory = new THREE.Line(
    trajectoryGeometry,
    new THREE.LineBasicMaterial({ color: 0xe5e7eb, transparent: true, opacity: 0.52 }),
  );
  scene.add(trajectory);
  const history = Array.from({ length: 90 }, () => new THREE.Vector3());
  const tcpPosition = new THREE.Vector3();
  const previousTcp = new THREE.Vector3();
  let sampleFrame = 0;

  const target = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 20, 16),
    new THREE.MeshStandardMaterial({ color: 0x7898ea, emissive: 0x1d4fb8, emissiveIntensity: 1.2, roughness: 0.25 }),
  );
  scene.add(target);
  const targetRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.25, 0.012, 8, 64),
    new THREE.MeshBasicMaterial({ color: 0xf3f4f6, transparent: true, opacity: 0.3 }),
  );
  targetRing.rotation.x = Math.PI / 2;
  target.add(targetRing);

  const pointer = new THREE.Vector2();
  const cameraTarget = new THREE.Vector2();
  canvas.addEventListener("pointermove", (event) => {
    const bounds = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    cameraTarget.copy(pointer);
  }, { passive: true });
  canvas.addEventListener("pointerleave", () => cameraTarget.set(0, 0));

  let visible = false;
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.04 });
  observer.observe(canvas);

  const jointReadouts = [1, 2, 3, 4, 5, 6].map((index) => document.querySelector(`#joint-${index}`));
  const coordX = document.querySelector("#coord-x");
  const coordY = document.querySelector("#coord-y");
  const coordZ = document.querySelector("#coord-z");
  function degrees(value) {
    const numeric = THREE.MathUtils.radToDeg(value);
    return `${numeric >= 0 ? "+" : "−"}${Math.abs(numeric).toFixed(1)}°`;
  }

  function update(time, delta) {
    if (!visible || window.innerWidth <= 540) return;
    resizeRenderer(renderer, camera, canvas);
    const seconds = time * 0.001;
    const q = [
      Math.sin(seconds * 0.28) * 0.56,
      -0.54 + Math.sin(seconds * 0.36) * 0.16,
      1.04 + Math.cos(seconds * 0.31) * 0.22,
      Math.sin(seconds * 0.62) * 0.42,
      0.38 + Math.sin(seconds * 0.48) * 0.24,
      Math.cos(seconds * 0.7) * 0.58,
    ];
    joint1.rotation.y = q[0];
    joint2.rotation.z = q[1];
    joint3.rotation.z = q[2];
    joint4.rotation.y = q[3];
    joint5.rotation.z = q[4];
    joint6.rotation.y = q[5];

    target.position.set(1.8 + Math.sin(seconds * 0.37) * 0.3, 1.75 + Math.cos(seconds * 0.31) * 0.22, 0.5 + Math.sin(seconds * 0.23) * 0.5);
    targetRing.rotation.z = seconds * 0.35;
    tcp.getWorldPosition(tcpPosition);

    if ((sampleFrame += 1) % 3 === 0) {
      history.shift();
      history.push(tcpPosition.clone());
      history.forEach((point, index) => point.toArray(trajectoryPoints, index * 3));
      trajectoryGeometry.attributes.position.needsUpdate = true;
    }

    jointReadouts.forEach((element, index) => { if (element) element.textContent = degrees(q[index]); });
    if (coordX) coordX.textContent = `${tcpPosition.x >= 0 ? "+" : "−"}${Math.abs(tcpPosition.x * 0.42).toFixed(3)} M`;
    if (coordY) coordY.textContent = `${tcpPosition.z >= 0 ? "+" : "−"}${Math.abs(tcpPosition.z * 0.42).toFixed(3)} M`;
    if (coordZ) coordZ.textContent = `${tcpPosition.y >= 0 ? "+" : "−"}${Math.abs(tcpPosition.y * 0.42).toFixed(3)} M`;
    previousTcp.copy(tcpPosition);

    camera.position.x += (7.1 + cameraTarget.x * 0.65 - camera.position.x) * 0.035;
    camera.position.y += (4.8 + cameraTarget.y * 0.32 - camera.position.y) * 0.035;
    camera.lookAt(0, 1.72, 0);
    renderer.render(scene, camera);
  }

  return { update };
}

let spatialCore = null;
let knowledgeMap = null;
try {
  if (window.innerWidth > 640) spatialCore = buildSpatialCore(document.querySelector("#spatial-canvas"));
  if (window.innerWidth > 900) knowledgeMap = buildKnowledgeMap(document.querySelector("#knowledge-canvas"));
} catch (error) {
  console.warn("WebGL visualization unavailable; using responsive 2D fallback.", error);
  document.querySelector("#spatial-canvas").style.display = "none";
  document.querySelector(".mobile-graph-fallback").style.display = "block";
  document.querySelector("#knowledge-canvas").style.display = "none";
  document.querySelector(".mobile-knowledge-list").style.display = "grid";
}

let robotArm = null;
try {
  if (window.innerWidth > 540) robotArm = buildRobotArm(document.querySelector("#robot-arm-canvas"));
} catch (error) {
  console.warn("Robot arm visualization unavailable; using responsive fallback.", error);
  const robotCanvas = document.querySelector("#robot-arm-canvas");
  if (robotCanvas) robotCanvas.style.display = "none";
  document.querySelector(".robot-arm-fallback")?.classList.add("is-visible");
}

let previousFrame = performance.now();
let packetValue = 0x04f2;
function animate(time) {
  const delta = Math.min((time - previousFrame) / 1000, 0.05);
  previousFrame = time;
  if (!prefersReducedMotion && !document.hidden) {
    spatialCore?.update(time, delta);
    knowledgeMap?.update(time, delta);
    robotArm?.update(time, delta);
  } else {
    spatialCore?.update(0, 0);
    knowledgeMap?.update(0, 0);
    robotArm?.update(0, 0);
  }
  if (packetCounter && Math.floor(time / 850) !== Math.floor((time - 16) / 850)) {
    packetValue = (packetValue + 0x11) % 0xffff;
    packetCounter.textContent = `0x${packetValue.toString(16).toUpperCase().padStart(4, "0")}`;
  }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

diagnosticButton?.addEventListener("click", () => {
  diagnosticButton.classList.add("is-running");
  spatialCore?.runDiagnostic();
  window.setTimeout(() => {
    diagnosticButton.classList.remove("is-running");
    document.querySelector("#about")?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
  }, prefersReducedMotion ? 0 : 850);
});

document.querySelectorAll("[data-node-id]").forEach((button) => {
  button.addEventListener("click", () => updateResearchDrawer(button.dataset.nodeId));
});
updateResearchDrawer("embodied");

const coordinateStart = performance.now();
function updateCoordinates(time) {
  if (robotArm) return;
  const seconds = (time - coordinateStart) * 0.001;
  const x = 0.842 + Math.sin(seconds * 0.7) * 0.018;
  const y = -0.114 + Math.cos(seconds * 0.56) * 0.012;
  const z = 1.208 + Math.sin(seconds * 0.42) * 0.024;
  document.querySelector("#coord-x").textContent = `${x >= 0 ? "+" : "−"}${Math.abs(x).toFixed(3)} M`;
  document.querySelector("#coord-y").textContent = `${y >= 0 ? "+" : "−"}${Math.abs(y).toFixed(3)} M`;
  document.querySelector("#coord-z").textContent = `${z >= 0 ? "+" : "−"}${Math.abs(z).toFixed(3)} M`;
  if (!prefersReducedMotion) requestAnimationFrame(updateCoordinates);
}
requestAnimationFrame(updateCoordinates);

const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector("#site-nav");
navToggle?.addEventListener("click", () => {
  const open = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!open));
  siteNav.classList.toggle("is-open", !open);
});
siteNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navToggle?.setAttribute("aria-expanded", "false");
    siteNav.classList.remove("is-open");
  });
});

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const id = entry.target.id;
    siteNav?.querySelectorAll("a").forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
    });
  });
}, { rootMargin: "-30% 0px -55%", threshold: 0.01 });
["about", "sim-demos", "knowledge-base", "connect"].forEach((id) => {
  const section = document.getElementById(id);
  if (section) sectionObserver.observe(section);
});

const contactForm = document.querySelector("#contact-form");
contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(contactForm);
  const identity = String(formData.get("identity") ?? "").trim();
  const channel = String(formData.get("channel") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const status = document.querySelector("#form-status");
  if (!identity || !channel || !message) {
    status.textContent = "SIGNAL INCOMPLETE · 请填写全部字段";
    return;
  }
  const title = encodeURIComponent(`[Research contact] ${identity}`);
  const body = encodeURIComponent(`Sender: ${identity}\nChannel: ${channel}\n\n${message}`);
  const issueUrl = `https://github.com/miaoxiaoqian/miaoxiaoqian.github.io/issues/new?title=${title}&body=${body}`;
  const opened = window.open(issueUrl, "_blank", "noopener,noreferrer");
  status.textContent = opened
    ? "MESSAGE CHANNEL OPENED · 请在 GitHub 中确认提交"
    : "POP-UP BLOCKED · 请允许打开 GitHub 消息窗口";
});

document.querySelector("#current-year").textContent = new Date().getFullYear();

document.querySelectorAll(".cv-entry > button").forEach((button) => {
  button.addEventListener("click", () => {
    const entry = button.closest(".cv-entry");
    const content = entry.querySelector(".cv-entry-content");
    const willOpen = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(willOpen));
    entry.classList.toggle("is-open", willOpen);
    content.hidden = !willOpen;
    button.querySelector("i").textContent = willOpen ? "−" : "+";
  });
});

document.querySelector("#cv-download")?.addEventListener("click", () => window.print());

const simulations = [
  {
    kicker: "ALLBASE / FAILURE ANALYSIS",
    name: "Policy rollout — failure record",
    description: "完整保留失败样本，用于分析抓取、轨迹执行与终止状态之间的误差累积。",
    result: "FAILURE CASE",
    resultClass: "result-failure",
    video: "/media/libero-ep009-failure.mp4.b64",
    poster: "/media/libero-ep009-poster.jpg.b64",
    duration: "83.2 S",
  },
  {
    kicker: "FINAL_SKILL / SUCCESS RECORD",
    name: "Policy rollout — successful execution",
    description: "成功样本展示 Final Skill 策略完成同一 EP009 任务的执行过程，可与失败轨迹直接对照。",
    result: "SUCCESS CASE",
    resultClass: "result-success",
    video: "/media/libero-ep009-success.mp4.b64",
    poster: "/media/libero-ep009-success-poster.jpg.b64",
    duration: "67.5 S",
  },
];

let activeSimulation = 0;
let simulationRequest = 0;
const simulationVideo = document.querySelector("#simulation-video");
const simulationDots = [...document.querySelectorAll("#simulation-dots button")];
const mediaAssetCache = new Map();

async function loadEncodedMedia(path, mimeType) {
  if (mediaAssetCache.has(path)) return mediaAssetCache.get(path);
  const promise = fetch(path)
    .then((response) => {
      if (!response.ok) throw new Error(`Media asset returned ${response.status}`);
      return response.text();
    })
    .then((encoded) => {
      const binary = atob(encoded.trim());
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
      return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
    });
  mediaAssetCache.set(path, promise);
  return promise;
}

async function updateSimulation(nextIndex) {
  if (!simulationVideo) return;
  const request = ++simulationRequest;
  activeSimulation = (nextIndex + simulations.length) % simulations.length;
  const simulation = simulations[activeSimulation];
  const adjacent = simulations[(activeSimulation + 1) % simulations.length];

  simulationVideo.pause();
  document.querySelector("#simulation-kicker").textContent = simulation.kicker;
  document.querySelector("#simulation-name").textContent = simulation.name;
  document.querySelector("#simulation-description").textContent = simulation.description;
  document.querySelector("#simulation-counter").textContent = `${String(activeSimulation + 1).padStart(2, "0")} / ${String(simulations.length).padStart(2, "0")}`;

  const result = document.querySelector("#simulation-result");
  result.className = `simulation-result ${simulation.resultClass}`;
  result.innerHTML = `<i></i> ${simulation.result}`;

  ["left", "right"].forEach((side) => {
    const label = document.querySelector(`#preview-${side}-label`);
    label.textContent = adjacent.kicker.replace(" ANALYSIS", "").replace(" RECORD", "");
  });

  simulationDots.forEach((dot, index) => {
    dot.classList.toggle("is-active", index === activeSimulation);
    if (index === activeSimulation) dot.setAttribute("aria-current", "true");
    else dot.removeAttribute("aria-current");
  });

  try {
    const [videoUrl, posterUrl, adjacentPosterUrl] = await Promise.all([
      loadEncodedMedia(simulation.video, "video/mp4"),
      loadEncodedMedia(simulation.poster, "image/jpeg"),
      loadEncodedMedia(adjacent.poster, "image/jpeg"),
    ]);
    if (request !== simulationRequest) return;
    simulationVideo.src = videoUrl;
    simulationVideo.poster = posterUrl;
    simulationVideo.load();
    ["left", "right"].forEach((side) => {
      document.querySelector(`#preview-${side}-image`).src = adjacentPosterUrl;
    });
    if (!prefersReducedMotion) simulationVideo.play().catch(() => {});
  } catch (error) {
    document.querySelector("#simulation-description").textContent = "视频资产暂时无法载入，请刷新页面后重试。";
    console.warn("Simulation media unavailable.", error);
  }
}

document.querySelectorAll("#simulation-prev, #simulation-arrow-prev").forEach((button) => {
  button.addEventListener("click", () => updateSimulation(activeSimulation - 1));
});
document.querySelectorAll("#simulation-next, #simulation-arrow-next").forEach((button) => {
  button.addEventListener("click", () => updateSimulation(activeSimulation + 1));
});
simulationDots.forEach((dot, index) => dot.addEventListener("click", () => updateSimulation(index)));
updateSimulation(0);

loadEncodedMedia("/media/kobe-sheath-gold.png.b64", "image/png")
  .then((logoUrl) => {
    const logo = document.querySelector("#kobe-sheath-logo");
    if (logo) logo.src = logoUrl;
  })
  .catch((error) => console.warn("Kobe tribute mark unavailable.", error));

let simulationTouchStart = 0;
document.querySelector("#simulation-carousel")?.addEventListener("touchstart", (event) => {
  simulationTouchStart = event.changedTouches[0].clientX;
}, { passive: true });
document.querySelector("#simulation-carousel")?.addEventListener("touchend", (event) => {
  const distance = event.changedTouches[0].clientX - simulationTouchStart;
  if (Math.abs(distance) > 48) updateSimulation(activeSimulation + (distance < 0 ? 1 : -1));
}, { passive: true });

const intelDocs = {
  vla: {
    filename: "vla_core_papers.md",
    path: "literature_radar / VISION_LANGUAGE_ACTION",
    title: "Vision–Language–Action: core reading set",
    intro: "围绕语义先验、跨本体策略与可复现开源模型建立阅读坐标，持续记录可验证的论文链接与个人判断。",
    body: `<div class="paper-cards">
      <a href="https://arxiv.org/abs/2307.15818" target="_blank" rel="noreferrer"><span>FOUNDATION / VLA</span><strong>RT-2</strong><small>Vision-Language-Action Models Transfer Web Knowledge to Robotic Control ↗</small></a>
      <a href="https://arxiv.org/abs/2406.09246" target="_blank" rel="noreferrer"><span>OPEN SOURCE / VLA</span><strong>OpenVLA</strong><small>An Open-Source Vision-Language-Action Model ↗</small></a>
      <a href="https://arxiv.org/abs/2405.12213" target="_blank" rel="noreferrer"><span>GENERALIST POLICY</span><strong>Octo</strong><small>An Open-Source Generalist Robot Policy ↗</small></a>
    </div><div class="takeaway-block"><span>STANDARD TAKEAWAY</span><p>把大规模视觉语言表征转化为动作并不是终点；真正值得持续验证的是跨任务泛化、闭环可靠性与对物理约束的理解。</p></div>`,
  },
  spatial: {
    filename: "spatial_reasoning.md",
    path: "literature_radar / SPATIAL_INTELLIGENCE",
    title: "Spatial reasoning as an action prior",
    intro: "把坐标、拓扑关系、可供性和物理约束组织成面向行动的内部表征。",
    body: `<div class="log-grid"><div><span>QUESTION_01</span><strong>如何从视觉观测中保持稳定对象关系？</strong></div><div><span>QUESTION_02</span><strong>语言常识如何约束可执行动作？</strong></div><div><span>QUESTION_03</span><strong>长时序策略如何维护空间记忆？</strong></div></div><div class="takeaway-block"><span>WORKING HYPOTHESIS</span><p>空间表征应直接服务于决策与控制，并通过执行反馈持续校正，而不是停留在静态场景描述。</p></div>`,
  },
  alignment: {
    filename: "coordinate_alignment.md",
    path: "research_logs / MULTIMODAL_FUSION",
    title: "Fixing coordinate alignment in multimodal fusion",
    intro: "研究日志模板：记录相机坐标、世界坐标、动作空间之间的转换假设与可复现实验。",
    body: `<div class="code-note"><span>01</span><code>observation → camera_frame → world_frame</code><span>02</span><code>world_state → policy_tokens → action_space</code><span>03</span><code>execution_feedback → alignment_update</code></div><div class="takeaway-block"><span>DEBUG PRINCIPLE</span><p>先验证坐标系、时间同步和单位，再讨论模型是否真正理解了空间关系。</p></div>`,
  },
  knowledge: {
    filename: "knowledge_graph.md",
    path: "research_logs / KNOWLEDGE_SYSTEM",
    title: "Managing an embodied AI knowledge graph",
    intro: "将论文、概念、实验、失败记录与代码入口连接起来，构建可追踪的研究记忆。",
    body: `<div class="log-grid"><div><span>NODE TYPE</span><strong>PAPER / CONCEPT / EXPERIMENT</strong></div><div><span>EDGE TYPE</span><strong>SUPPORTS / CONTRADICTS / EXTENDS</strong></div><div><span>OUTPUT</span><strong>QUESTION → TEST → EVIDENCE</strong></div></div><div class="takeaway-block"><span>STANDARD TAKEAWAY</span><p>知识库的价值不是收藏数量，而是能否把一个研究判断追溯到来源、实验与后续问题。</p></div>`,
  },
  projects: {
    filename: "featured_projects.json",
    path: "project_index / GITHUB_PUBLIC_REPOS",
    title: "Public project interface",
    intro: "从 GitHub 公开接口读取最近更新的项目。以后新仓库公开后，这里会自动形成可访问的项目入口。",
    body: `<div id="project-feed" class="project-feed"><p>SYNCING PUBLIC REPOSITORIES…</p></div>`,
  },
};

async function loadProjectFeed() {
  const feed = document.querySelector("#project-feed");
  if (!feed) return;
  try {
    const response = await fetch("https://api.github.com/users/miaoxiaoqian/repos?sort=updated&per_page=6&type=owner", {
      headers: { accept: "application/vnd.github+json" },
    });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    const repositories = (await response.json()).filter((repository) => repository.name !== "miaoxiaoqian.github.io");
    feed.replaceChildren();
    if (!repositories.length) {
      feed.innerHTML = `<p>NO PUBLIC PROJECTS INDEXED YET · <a href="https://github.com/miaoxiaoqian" target="_blank" rel="noreferrer">OPEN GITHUB ↗</a></p>`;
      return;
    }
    repositories.slice(0, 6).forEach((repository) => {
      const anchor = document.createElement("a");
      anchor.href = repository.html_url;
      anchor.target = "_blank";
      anchor.rel = "noreferrer";
      const title = document.createElement("strong");
      title.textContent = repository.name;
      const description = document.createElement("span");
      description.textContent = repository.description || "Public research or engineering repository";
      const meta = document.createElement("small");
      meta.textContent = `${repository.language || "MULTI"} · UPDATED ${String(repository.updated_at).slice(0, 10)} ↗`;
      anchor.append(title, description, meta);
      feed.append(anchor);
    });
  } catch (error) {
    feed.innerHTML = `<p>PROJECT FEED UNAVAILABLE · <a href="https://github.com/miaoxiaoqian" target="_blank" rel="noreferrer">OPEN GITHUB ↗</a></p>`;
    console.warn("GitHub project feed unavailable.", error);
  }
}

document.querySelectorAll("[data-intel-doc]").forEach((button) => {
  button.addEventListener("click", () => {
    const doc = intelDocs[button.dataset.intelDoc];
    if (!doc) return;
    document.querySelectorAll("[data-intel-doc]").forEach((item) => item.classList.toggle("is-active", item === button));
    document.querySelector("#intel-filename").textContent = doc.filename;
    document.querySelector("#intel-document-content").innerHTML = `<p class="document-path">${doc.path}</p><h3>${doc.title}</h3><p class="document-intro">${doc.intro}</p>${doc.body}`;
    if (button.dataset.intelDoc === "projects") loadProjectFeed();
  });
});

async function loadGithubContributions() {
  const heatmap = document.querySelector("#contribution-heatmap");
  const months = document.querySelector("#heatmap-months");
  const status = document.querySelector("#activity-status");
  const fallback = document.querySelector("#activity-fallback");
  if (!heatmap || !months || !status) return;

  try {
    const response = await fetch("https://github-contributions-api.jogruber.de/v4/miaoxiaoqian?y=last", {
      headers: { accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Contribution service returned ${response.status}`);
    const payload = await response.json();
    const contributions = Array.isArray(payload.contributions) ? payload.contributions : [];
    if (!contributions.length) throw new Error("No contribution data returned");

    heatmap.replaceChildren();
    months.replaceChildren();
    contributions.forEach((entry, index) => {
      const cell = document.createElement("button");
      const level = Math.max(0, Math.min(Number(entry.level) || 0, 4));
      const count = Math.max(0, Number(entry.count) || 0);
      cell.type = "button";
      cell.className = `contribution-cell level-${level}`;
      cell.title = `${entry.date} · ${count} contribution${count === 1 ? "" : "s"}`;
      cell.setAttribute("aria-label", cell.title);
      cell.setAttribute("role", "gridcell");
      heatmap.append(cell);

      const date = new Date(`${entry.date}T00:00:00`);
      const day = date.getUTCDate();
      if (date.getUTCDay() === 0 && day <= 7) {
        const label = document.createElement("span");
        label.textContent = date.toLocaleString("en", { month: "short", timeZone: "UTC" }).toUpperCase();
        label.style.gridColumn = String(Math.floor(index / 7) + 1);
        months.append(label);
      }
    });

    const total = typeof payload.total === "number"
      ? payload.total
      : Number(payload.total?.lastYear ?? Object.values(payload.total ?? {})[0] ?? 0);
    const activeEntries = contributions.filter((entry) => Number(entry.count) > 0);
    const lastActive = activeEntries.at(-1)?.date ?? "NO PUBLIC ACTIVITY";
    document.querySelector("#contribution-total").textContent = String(total);
    document.querySelector("#active-days").textContent = String(activeEntries.length);
    document.querySelector("#last-activity").textContent = lastActive;
    heatmap.setAttribute("aria-busy", "false");
    status.innerHTML = "<i></i> LIVE DATA";
    fallback.textContent = "";
  } catch (error) {
    heatmap.setAttribute("aria-busy", "false");
    status.classList.add("is-error");
    status.innerHTML = "<i></i> DATA UNAVAILABLE";
    fallback.textContent = "实时贡献数据暂时不可用；可通过右侧链接直接查看 GitHub 主页。";
    console.warn("GitHub contribution heatmap unavailable.", error);
  }
}

loadGithubContributions();
