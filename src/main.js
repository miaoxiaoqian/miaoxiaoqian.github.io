import * as THREE from "three";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const graphTooltip = document.querySelector("#graph-tooltip");
const packetCounter = document.querySelector("#packet-count");
const diagnosticButton = document.querySelector("#diagnostic-button");

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

let previousFrame = performance.now();
let packetValue = 0x04f2;
function animate(time) {
  const delta = Math.min((time - previousFrame) / 1000, 0.05);
  previousFrame = time;
  if (!prefersReducedMotion && !document.hidden) {
    spatialCore?.update(time, delta);
    knowledgeMap?.update(time, delta);
  } else {
    spatialCore?.update(0, 0);
    knowledgeMap?.update(0, 0);
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
    document.querySelector("#research-map")?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
  }, prefersReducedMotion ? 0 : 850);
});

document.querySelectorAll("[data-node-id]").forEach((button) => {
  button.addEventListener("click", () => updateResearchDrawer(button.dataset.nodeId));
});
updateResearchDrawer("embodied");

const coordinateStart = performance.now();
function updateCoordinates(time) {
  const seconds = (time - coordinateStart) * 0.001;
  const x = 0.842 + Math.sin(seconds * 0.7) * 0.018;
  const y = -0.114 + Math.cos(seconds * 0.56) * 0.012;
  const z = 1.208 + Math.sin(seconds * 0.42) * 0.024;
  document.querySelector("#coord-x").textContent = `${x >= 0 ? "+" : "−"}${Math.abs(x).toFixed(3)}`;
  document.querySelector("#coord-y").textContent = `${y >= 0 ? "+" : "−"}${Math.abs(y).toFixed(3)}`;
  document.querySelector("#coord-z").textContent = `${z >= 0 ? "+" : "−"}${Math.abs(z).toFixed(3)}`;
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
["research-map", "about", "featured-work", "toolbox", "connect"].forEach((id) => {
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
