const body = document.body;
const root = document.documentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)");

function updateDallasTime() {
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date());

  const target = document.querySelector("#local-time");
  if (target) target.textContent = `${time} CT`;
}

updateDallasTime();
window.setInterval(updateDallasTime, 60000);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: .09, rootMargin: "0px 0px -24px" }
);

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
  revealObserver.observe(element);
});

window.setTimeout(() => {
  document.querySelectorAll(".reveal:not(.in)").forEach((element) => {
    const rect = element.getBoundingClientRect();
    if (rect.bottom >= 0 && rect.top <= window.innerHeight) {
      element.classList.add("in");
      revealObserver.unobserve(element);
    }
  });
}, 90);

const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector(".mobile-nav");

menuToggle.addEventListener("click", () => {
  const expanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!expanded));
  mobileNav.classList.toggle("open", !expanded);
  body.classList.toggle("menu-open", !expanded);
});

mobileNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle.setAttribute("aria-expanded", "false");
    mobileNav.classList.remove("open");
    body.classList.remove("menu-open");
  });
});

const contactModal = document.querySelector("#contact-modal");
const contactOpen = document.querySelector(".contact-open");
const contactCloseControls = document.querySelectorAll("[data-contact-close]");
let contactReturnFocus = null;

function openContactModal() {
  if (!contactModal) return;
  contactReturnFocus = document.activeElement;
  contactModal.removeAttribute("inert");
  contactModal.setAttribute("aria-hidden", "false");
  body.classList.add("modal-open");

  const firstField = contactModal.querySelector("input[name='name']");
  window.setTimeout(() => firstField?.focus(), 60);
}

function closeContactModal() {
  if (!contactModal) return;
  contactModal.setAttribute("aria-hidden", "true");
  contactModal.setAttribute("inert", "");
  body.classList.remove("modal-open");

  if (contactReturnFocus && typeof contactReturnFocus.focus === "function") {
    contactReturnFocus.focus();
  }
}

contactOpen?.addEventListener("click", openContactModal);
contactCloseControls.forEach((control) => {
  control.addEventListener("click", closeContactModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && contactModal?.getAttribute("aria-hidden") === "false") {
    closeContactModal();
  }
});

const sections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...document.querySelectorAll(".desktop-nav a")];

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  { rootMargin: "-35% 0px -55% 0px" }
);

sections.forEach((section) => sectionObserver.observe(section));

function updateScrollProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  root.style.setProperty("--scroll-progress", `${progress}%`);
}

let scrollFrame = 0;

function requestScrollProgress() {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = 0;
    updateScrollProgress();
  });
}

updateScrollProgress();
window.addEventListener("scroll", requestScrollProgress, { passive: true });

const fluidCanvas = document.querySelector("#fluid-canvas");
const fluidContext = fluidCanvas.getContext("2d");
const pointer = {
  x: window.innerWidth * .68,
  y: window.innerHeight * .28,
  active: false
};

let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;
let nodeSpacing = window.innerWidth < 700 ? 42 : 52;
let fieldGlow = null;
let fluidFrame = 0;
let lastFluidDraw = 0;
let resizeFrame = 0;
const fluidFrameInterval = 1000 / 30;

function resizeFluidCanvas() {
  const density = Math.min(window.devicePixelRatio || 1, 1.35);
  const rect = fluidCanvas.getBoundingClientRect();
  canvasWidth = rect.width;
  canvasHeight = rect.height;
  nodeSpacing = window.innerWidth < 700 ? 42 : 52;
  fluidCanvas.width = Math.floor(canvasWidth * density);
  fluidCanvas.height = Math.floor(canvasHeight * density);
  fluidContext.setTransform(density, 0, 0, density, 0, 0);

  fieldGlow = fluidContext.createRadialGradient(
    canvasWidth * .7,
    canvasHeight * .38,
    0,
    canvasWidth * .7,
    canvasHeight * .38,
    canvasWidth * .7
  );
  fieldGlow.addColorStop(0, "rgba(58, 97, 103, .17)");
  fieldGlow.addColorStop(.5, "rgba(13, 28, 31, .055)");
  fieldGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
}

function calculateNode(column, row, time) {
  const overscan = nodeSpacing * 4;
  const baseX = column * nodeSpacing - overscan;
  const baseY = row * nodeSpacing - overscan;
  const diagonal = baseX * .009 + baseY * .013;
  const flow = time * .00042;
  const primaryWave = Math.sin(diagonal - flow) * 22;
  const secondaryWave = Math.sin(diagonal * .53 + time * .00019 + row * .08) * 12;
  const sweep = (time * .0036) % nodeSpacing;

  let x = baseX + (primaryWave + secondaryWave) * .68 + sweep;
  let y = baseY - (primaryWave + secondaryWave) * .68 - sweep * .55;

  if (pointer.active) {
    const distance = Math.hypot(x - pointer.x, y - pointer.y);
    if (distance < 230) {
      const force = (1 - distance / 230) * 8;
      const angle = Math.atan2(y - pointer.y, x - pointer.x);
      x += Math.cos(angle) * force;
      y += Math.sin(angle) * force;
    }
  }

  const crest = Math.pow((Math.sin(diagonal - flow) + 1) / 2, 3);
  const ribbon = Math.pow((Math.sin(diagonal * .46 + 1.1) + 1) / 2, 5);
  return {
    x,
    y,
    intensity: .04 + crest * .31 + ribbon * .12,
    crest
  };
}

function drawFluidField(time = 0) {
  if (!reducedMotion && time - lastFluidDraw < fluidFrameInterval) {
    fluidFrame = requestAnimationFrame(drawFluidField);
    return;
  }

  lastFluidDraw = time;
  fluidContext.clearRect(0, 0, canvasWidth, canvasHeight);

  const overscan = nodeSpacing * 4;
  const columns = Math.ceil((canvasWidth + overscan * 2) / nodeSpacing);
  const rows = Math.ceil((canvasHeight + overscan * 2) / nodeSpacing);
  const nodes = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, column) => calculateNode(column, row, time))
  );

  fluidContext.fillStyle = fieldGlow;
  fluidContext.fillRect(0, 0, canvasWidth, canvasHeight);

  fluidContext.lineWidth = .55;

  nodes.forEach((row, rowIndex) => {
    fluidContext.beginPath();
    row.forEach((node, columnIndex) => {
      if (columnIndex === 0) fluidContext.moveTo(node.x, node.y);
      else fluidContext.lineTo(node.x, node.y);
    });
    const alpha = .025 + Math.sin(rowIndex * .4 + time * .0002) * .012;
    fluidContext.strokeStyle = `rgba(147, 210, 213, ${Math.max(.012, alpha)})`;
    fluidContext.stroke();
  });

  for (let column = 0; column < columns; column += 1) {
    fluidContext.beginPath();
    nodes.forEach((row, rowIndex) => {
      const node = row[column];
      if (rowIndex === 0) fluidContext.moveTo(node.x, node.y);
      else fluidContext.lineTo(node.x, node.y);
    });
    fluidContext.strokeStyle = "rgba(115, 171, 175, .018)";
    fluidContext.stroke();
  }

  nodes.forEach((row) => {
    row.forEach((node) => {
      fluidContext.beginPath();
      fluidContext.fillStyle = `rgba(183, 233, 234, ${node.intensity})`;
      fluidContext.arc(node.x, node.y, .55 + node.crest * 1.35, 0, Math.PI * 2);
      fluidContext.fill();
    });
  });

  if (!reducedMotion) fluidFrame = requestAnimationFrame(drawFluidField);
}

resizeFluidCanvas();
drawFluidField(reducedMotion ? 1200 : 0);

window.addEventListener("resize", () => {
  if (resizeFrame) return;
  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = 0;
    resizeFluidCanvas();
    updateScrollProgress();
  });
});

document.addEventListener("visibilitychange", () => {
  if (reducedMotion) return;
  if (document.hidden) {
    cancelAnimationFrame(fluidFrame);
    fluidFrame = 0;
  } else if (!fluidFrame) {
    lastFluidDraw = 0;
    fluidFrame = requestAnimationFrame(drawFluidField);
  }
});

if (!reducedMotion) {
  let pointerFrame = 0;
  let pointerEvent = null;
  window.addEventListener("pointermove", (event) => {
    pointerEvent = event;
    if (pointerFrame) return;
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      if (!pointerEvent) return;
      pointer.x = pointerEvent.clientX;
      pointer.y = pointerEvent.clientY;
      pointer.active = true;
      root.style.setProperty("--mouse-x", `${pointerEvent.clientX}px`);
      root.style.setProperty("--mouse-y", `${pointerEvent.clientY}px`);
    });
  }, { passive: true });
}

document.querySelectorAll(".case-study, .bento-card").forEach((card) => {
  let cardFrame = 0;
  let cardPointer = null;

  card.addEventListener("pointermove", (event) => {
    if (!finePointer.matches || reducedMotion) return;
    cardPointer = event;
    if (cardFrame) return;

    cardFrame = requestAnimationFrame(() => {
      cardFrame = 0;
      if (!cardPointer) return;
      const rect = card.getBoundingClientRect();
      const localX = (cardPointer.clientX - rect.left) / rect.width;
      const localY = (cardPointer.clientY - rect.top) / rect.height;
      const rotateX = (localY - .5) * -1.35;
      const rotateY = (localX - .5) * 1.35;
      card.style.setProperty("--glass-x", `${localX * 100}%`);
      card.style.setProperty("--glass-y", `${localY * 100}%`);
      card.style.setProperty("--glass-shift-x", `${(localX - .5) * 3}px`);
      card.style.setProperty("--glass-shift-y", `${(localY - .5) * 3}px`);
      card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
  });

  card.addEventListener("pointerleave", () => {
    cardPointer = null;
    card.style.transform = "";
    card.style.setProperty("--glass-x", "50%");
    card.style.setProperty("--glass-y", "35%");
    card.style.setProperty("--glass-shift-x", "0px");
    card.style.setProperty("--glass-shift-y", "0px");
  });
});

// ── particle heart ───────────────────────────────────────────────────────────
(function initHeartParticles() {
  if (reducedMotion) return;
  if (typeof THREE === "undefined" || typeof gsap === "undefined") return;

  const heartCanvas = document.getElementById("heart-canvas");
  const svgPath = document.getElementById("heart-svg-path");
  if (!heartCanvas || !svgPath) return;

  // ── renderer ───────────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({
    canvas: heartCanvas,
    alpha: true,
    antialias: false,
    premultipliedAlpha: false
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.z = 380;

  // ── sample heart SVG path ──────────────────────────────────────────────────
  // Heart path: x 45→555 (cx ≈ 300), y 72→470 (cy ≈ 271)
  const HEART_CX = 300;
  const HEART_CY = 271;
  const HEART_SCALE = 0.30;   // maps SVG units → Three.js world units
  const PARTICLE_COUNT = 620;

  const totalLen = svgPath.getTotalLength();
  const step = totalLen / PARTICLE_COUNT;

  const targets = [];
  for (let k = 0; k < PARTICLE_COUNT; k++) {
    const pt = svgPath.getPointAtLength(k * step);
    targets.push({
      x: (pt.x - HEART_CX) * HEART_SCALE,
      y: -(pt.y - HEART_CY) * HEART_SCALE,  // flip Y: SVG ↓ → Three.js ↑
      z: (Math.random() - 0.5) * 8
    });
  }

  // ── geometry ───────────────────────────────────────────────────────────────
  const posArray = new Float32Array(PARTICLE_COUNT * 3);
  for (let k = 0; k < PARTICLE_COUNT; k++) {
    posArray[k * 3]     = (Math.random() - 0.5) * 280;
    posArray[k * 3 + 1] = (Math.random() - 0.5) * 180;
    posArray[k * 3 + 2] = (Math.random() - 0.5) * 140;
  }

  const geometry = new THREE.BufferGeometry();
  const posAttr  = new THREE.BufferAttribute(posArray, 3);
  geometry.setAttribute("position", posAttr);

  // Proxy objects: GSAP tweens these plain objects; the render loop writes
  // their values back to the typed array each frame.
  const proxies = Array.from({ length: PARTICLE_COUNT }, (_, k) => ({
    x: posArray[k * 3],
    y: posArray[k * 3 + 1],
    z: posArray[k * 3 + 2]
  }));

  // ── material ───────────────────────────────────────────────────────────────
  const material = new THREE.PointsMaterial({
    color: 0xff5fa0,
    size: 2.0,
    transparent: true,
    opacity: 0.90,
    sizeAttenuation: true,
    depthWrite: false
  });

  scene.add(new THREE.Points(geometry, material));

  // ── render loop ────────────────────────────────────────────────────────────
  let heartFrame = 0;

  function renderHeart() {
    heartFrame = requestAnimationFrame(renderHeart);
    for (let k = 0; k < PARTICLE_COUNT; k++) {
      posArray[k * 3]     = proxies[k].x;
      posArray[k * 3 + 1] = proxies[k].y;
      posArray[k * 3 + 2] = proxies[k].z;
    }
    posAttr.needsUpdate = true;
    renderer.render(scene, camera);
  }

  // ── resize ─────────────────────────────────────────────────────────────────
  function resizeHeart() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resizeHeart();
  renderHeart();

  // ── GSAP: scatter ↔ converge loop ─────────────────────────────────────────
  function converge() {
    const tl = gsap.timeline({ onComplete: () => gsap.delayedCall(3.2, scatter) });
    proxies.forEach(function(proxy, i) {
      tl.to(proxy, {
        x:        targets[i].x,
        y:        targets[i].y,
        z:        targets[i].z,
        duration: gsap.utils.random(1.6, 3.8),
        ease:     "power2.inOut"
      }, gsap.utils.random(0, 1.4));
    });
  }

  function scatter() {
    const tl = gsap.timeline({ onComplete: converge });
    proxies.forEach(function(proxy) {
      tl.to(proxy, {
        x:        (Math.random() - 0.5) * 320,
        y:        (Math.random() - 0.5) * 220,
        z:        (Math.random() - 0.5) * 160,
        duration: gsap.utils.random(0.9, 2.2),
        ease:     "power2.in"
      }, gsap.utils.random(0, 0.8));
    });
  }

  gsap.delayedCall(0.8, converge);

  // ── visibility + resize ────────────────────────────────────────────────────
  document.addEventListener("visibilitychange", function() {
    if (document.hidden) {
      cancelAnimationFrame(heartFrame);
      heartFrame = 0;
    } else if (!heartFrame) {
      renderHeart();
    }
  });

  window.addEventListener("resize", resizeHeart, { passive: true });
}());
