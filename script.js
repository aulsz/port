const body = document.body;
const root = document.documentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const skipIntro = new URLSearchParams(window.location.search).has("skipIntro");

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

async function typeText(element, text, speed = 42) {
  element.textContent = "";
  for (const character of text) {
    element.textContent += character;
    await sleep(character === " " ? speed * 0.35 : speed + Math.random() * 22);
  }
}

async function runEntrySequence() {
  if (reducedMotion || skipIntro) {
    if (skipIntro) body.classList.add("skip-intro");
    document.querySelectorAll("[data-type]").forEach((element) => {
      element.textContent = element.dataset.type;
    });
    body.classList.add("entered", "typing", "typed");
    return;
  }

  const bootText = document.querySelector("#boot-text");
  const typeElements = [...document.querySelectorAll("[data-type]")];
  typeElements.forEach((element) => {
    element.dataset.fullText = element.dataset.type;
    element.textContent = "";
  });

  await sleep(180);
  await typeText(bootText, "INITIALIZING SIGNAL FIELD", 35);
  await sleep(720);
  body.classList.add("entered");
  await sleep(430);
  body.classList.add("typing");

  for (const element of typeElements) {
    await typeText(element, element.dataset.fullText, element.classList.contains("eyebrow") ? 22 : 48);
    await sleep(element.classList.contains("eyebrow") ? 150 : 230);
  }

  body.classList.add("typed");
}

runEntrySequence();
window.setTimeout(() => body.classList.add("entered", "typing"), 3200);
window.setTimeout(() => {
  document.querySelectorAll("[data-type]").forEach((element) => {
    if (!element.textContent.trim()) element.textContent = element.dataset.type;
  });
  body.classList.add("typed");
}, 7600);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.08, rootMargin: "0px 0px -20px" }
);

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 75}ms`;
  revealObserver.observe(element);
});

function updateDallasTime() {
  const now = new Date();
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(now);
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      hour: "numeric",
      hourCycle: "h23"
    }).format(now)
  );

  document.querySelector("#local-time").textContent = `LOCAL TIME / ${time} CT`;
  const light = hour >= 6 && hour < 18 ? 0.78 : hour < 21 ? 0.7 : 0.62;
  root.style.setProperty("--time-light", light);
}

updateDallasTime();
window.setInterval(updateDallasTime, 60000);

let pointerX = window.innerWidth * 0.76;
let pointerY = window.innerHeight * 0.34;
let lastPointerMove = 0;

if (!reducedMotion) {
  window.addEventListener(
    "pointermove",
    (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      lastPointerMove = performance.now();

      root.style.setProperty("--mouse-x", `${event.clientX}px`);
      root.style.setProperty("--mouse-y", `${event.clientY}px`);
      root.style.setProperty("--world-x", `${(event.clientX / window.innerWidth - 0.5) * -8}px`);
      root.style.setProperty("--world-y", `${(event.clientY / window.innerHeight - 0.5) * -5}px`);

      const vector = document.querySelector("#pointer-vector");
      if (vector) {
        vector.textContent = `X ${String(Math.round(event.clientX)).padStart(3, "0")} / Y ${String(Math.round(event.clientY)).padStart(3, "0")}`;
      }
    },
    { passive: true }
  );

  window.addEventListener(
    "scroll",
    () => root.style.setProperty("--world-y", `${Math.min(window.scrollY * 0.014, 24)}px`),
    { passive: true }
  );
}

const menuButton = document.querySelector(".menu-button");
const navMenu = document.querySelector(".nav nav");

menuButton.addEventListener("click", () => {
  const expanded = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!expanded));
  navMenu.classList.toggle("open", !expanded);
});

navMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuButton.setAttribute("aria-expanded", "false");
    navMenu.classList.remove("open");
  });
});

// Ambient stars
const skyCanvas = document.querySelector("#sky");
const skyContext = skyCanvas.getContext("2d");
let stars = [];

function resizeSky() {
  const density = Math.min(window.devicePixelRatio || 1, 2);
  skyCanvas.width = Math.floor(window.innerWidth * density);
  skyCanvas.height = Math.floor(window.innerHeight * density);
  skyCanvas.style.width = `${window.innerWidth}px`;
  skyCanvas.style.height = `${window.innerHeight}px`;
  skyContext.setTransform(density, 0, 0, density, 0, 0);
  stars = Array.from({ length: Math.floor(window.innerWidth / 19) }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight * 0.64,
    r: Math.random() * 0.75 + 0.15,
    a: Math.random() * 0.42 + 0.08,
    phase: Math.random() * Math.PI * 2
  }));
}

function drawSky(time = 0) {
  skyContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
  stars.forEach((star) => {
    const alpha = star.a * (0.7 + Math.sin(time * 0.00035 + star.phase) * 0.3);
    skyContext.beginPath();
    skyContext.fillStyle = `rgba(195, 235, 241, ${alpha})`;
    skyContext.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    skyContext.fill();
  });
  if (!reducedMotion) requestAnimationFrame(drawSky);
}

resizeSky();
drawSky();

// Original responsive field organism: the Signal Mote.
const hero = document.querySelector(".hero");
const moteCanvas = document.querySelector("#signal-mote");
const moteContext = moteCanvas.getContext("2d");
const mote = {
  x: window.innerWidth * 0.78,
  y: window.innerHeight * 0.33,
  vx: 0,
  vy: 0,
  rotation: 0,
  energy: 0,
  trail: []
};

function resizeMote() {
  const rect = hero.getBoundingClientRect();
  const density = Math.min(window.devicePixelRatio || 1, 2);
  moteCanvas.width = Math.floor(rect.width * density);
  moteCanvas.height = Math.floor(rect.height * density);
  moteCanvas.style.width = `${rect.width}px`;
  moteCanvas.style.height = `${rect.height}px`;
  moteContext.setTransform(density, 0, 0, density, 0, 0);
}

function drawPoint(x, y, radius, alpha = 1) {
  moteContext.beginPath();
  moteContext.fillStyle = `rgba(186, 244, 247, ${alpha})`;
  moteContext.arc(x, y, radius, 0, Math.PI * 2);
  moteContext.fill();
}

function drawSignalMote(time = 0) {
  const width = moteCanvas.clientWidth;
  const height = moteCanvas.clientHeight;
  moteContext.clearRect(0, 0, width, height);

  const activePointer = performance.now() - lastPointerMove < 2600 && window.matchMedia("(pointer: fine)").matches;
  let targetX = activePointer ? pointerX : width * 0.75 + Math.cos(time * 0.00025) * width * 0.08;
  let targetY = activePointer ? pointerY : height * 0.34 + Math.sin(time * 0.00034) * height * 0.1;

  // Keep the organism from obscuring the main title block.
  const titleRect = document.querySelector(".hero-copy").getBoundingClientRect();
  if (
    targetX > titleRect.left - 70 &&
    targetX < titleRect.right + 70 &&
    targetY > titleRect.top - 70 &&
    targetY < titleRect.bottom + 70
  ) {
    targetX = Math.min(width - 90, titleRect.right + 120);
    targetY = Math.max(100, targetY - 90);
  }

  mote.vx += (targetX - mote.x) * 0.006;
  mote.vy += (targetY - mote.y) * 0.006;
  mote.vx *= 0.91;
  mote.vy *= 0.91;
  mote.x += mote.vx;
  mote.y += mote.vy;
  mote.rotation += 0.004 + Math.hypot(mote.vx, mote.vy) * 0.00025;
  mote.energy += ((activePointer ? 1 : 0.28) - mote.energy) * 0.035;

  mote.trail.unshift({ x: mote.x, y: mote.y });
  mote.trail = mote.trail.slice(0, 18);
  mote.trail.forEach((point, index) => {
    if (index % 2 === 0) drawPoint(point.x, point.y, Math.max(0.4, 2.2 - index * 0.1), (1 - index / 18) * 0.18);
  });

  moteContext.save();
  moteContext.translate(mote.x, mote.y);
  moteContext.rotate(mote.rotation);

  const scale = Math.min(width, height) / 900;
  const radius = Math.max(58, Math.min(112, 82 * scale + 46));
  const breathe = 1 + Math.sin(time * 0.002) * 0.055;
  moteContext.scale(breathe, breathe);
  moteContext.shadowColor = "rgba(116, 235, 244, .75)";
  moteContext.shadowBlur = 12 + mote.energy * 10;

  // Three offset point-cloud shells form a mechanical seed, not an animal.
  for (let shell = 0; shell < 3; shell += 1) {
    const shellRadius = radius * (0.42 + shell * 0.27);
    const count = 18 + shell * 12;
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2 + shell * 0.62;
      const warp = 1 + Math.sin(angle * 3 + time * 0.0015 + shell) * 0.14;
      const x = Math.cos(angle) * shellRadius * warp;
      const y = Math.sin(angle) * shellRadius * (0.55 + shell * 0.08);
      drawPoint(x, y, shell === 2 ? 1.35 : 1.65, 0.38 + shell * 0.2);
    }
  }

  // Six articulated sensor limbs unfold with cursor energy.
  for (let limb = 0; limb < 6; limb += 1) {
    const baseAngle = (limb / 6) * Math.PI * 2 + Math.sin(time * 0.0009 + limb) * 0.14;
    const extension = radius * (1.12 + mote.energy * 0.38);
    let previousX = Math.cos(baseAngle) * radius * 0.46;
    let previousY = Math.sin(baseAngle) * radius * 0.28;

    for (let joint = 1; joint <= 3; joint += 1) {
      const jointAngle = baseAngle + Math.sin(time * 0.0013 + limb * 1.7 + joint) * (0.2 + joint * 0.035);
      const jointX = Math.cos(jointAngle) * extension * (joint / 3);
      const jointY = Math.sin(jointAngle) * extension * (joint / 3) * 0.7;

      moteContext.beginPath();
      moteContext.strokeStyle = `rgba(143, 233, 237, ${0.16 + mote.energy * 0.12})`;
      moteContext.lineWidth = 0.7;
      moteContext.moveTo(previousX, previousY);
      moteContext.lineTo(jointX, jointY);
      moteContext.stroke();
      drawPoint(jointX, jointY, joint === 3 ? 2.2 : 1.45, 0.55 + joint * 0.12);
      previousX = jointX;
      previousY = jointY;
    }
  }

  moteContext.rotate(-mote.rotation * 1.8);
  moteContext.strokeStyle = "rgba(201, 250, 252, .6)";
  moteContext.lineWidth = 0.8;
  moteContext.strokeRect(-8, -8, 16, 16);
  drawPoint(0, 0, 3.2, 1);
  moteContext.restore();

  if (!reducedMotion) requestAnimationFrame(drawSignalMote);
}

resizeMote();
drawSignalMote();

window.addEventListener("resize", () => {
  resizeSky();
  resizeMote();
});
