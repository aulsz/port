const body = document.body;
const root = document.documentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const skipIntro = new URLSearchParams(window.location.search).has("skipIntro");
const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

async function typeBootText(element, text, speed = 35) {
  element.textContent = "";
  for (const character of text) {
    element.textContent += character;
    await sleep(character === " " ? speed * 0.35 : speed + Math.random() * 20);
  }
}

function updateDallasTime() {
  const now = new Date();
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(now);
  document.querySelector("#local-time").textContent = `LOCAL TIME / ${time} CT`;
}

updateDallasTime();

function wrapTextNode(textNode) {
  const text = textNode.nodeValue;
  if (!text || !text.trim()) return null;

  const wrapper = document.createElement("span");
  wrapper.className = "tw-text";
  wrapper.setAttribute("aria-label", text.trim());
  wrapper.setAttribute("role", "text");

  let characterIndex = 0;
  text.split(/(\s+)/).forEach((token) => {
    if (!token) return;
    if (/^\s+$/.test(token)) {
      wrapper.append(document.createTextNode(token));
      return;
    }

    const word = document.createElement("span");
    word.className = "tw-word";

    [...token].forEach((character) => {
      const characterSpan = document.createElement("span");
      characterSpan.className = "tw-char";
      characterSpan.setAttribute("aria-hidden", "true");
      characterSpan.style.setProperty("--char-index", characterIndex);
      characterSpan.style.setProperty("--char-delay", `${characterIndex * 18}ms`);
      characterSpan.textContent = character;
      word.append(characterSpan);
      characterIndex += 1;
    });

    wrapper.append(word);
  });

  wrapper.dataset.characters = characterIndex;
  textNode.replaceWith(wrapper);
  return wrapper;
}

function prepareTypewriters() {
  const roots = document.querySelectorAll("header, main");
  const fragments = [];

  roots.forEach((contentRoot) => {
    const walker = document.createTreeWalker(contentRoot, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest("script, style, canvas, .entry-sequence, .tw-text")) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach((node) => {
      const fragment = wrapTextNode(node);
      if (fragment) fragments.push(fragment);
    });
  });

  return fragments;
}

const typewriterFragments = prepareTypewriters();
let typewriterObserver;

function completeFragment(fragment, delay = 0) {
  if (fragment.dataset.typed === "true") return;
  fragment.dataset.typed = "true";
  const characters = Number(fragment.dataset.characters || 0);
  fragment.style.setProperty("--fragment-delay", `${delay}ms`);
  fragment.classList.add("tw-active");
  window.setTimeout(
    () => fragment.classList.add("tw-complete"),
    delay + characters * 18 + 180
  );
}

function startTypewriterObserver() {
  if (reducedMotion) {
    typewriterFragments.forEach((fragment) => fragment.classList.add("tw-active", "tw-complete"));
    return;
  }

  typewriterObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top);

      visible.forEach((entry, index) => {
        completeFragment(entry.target, Math.min(index * 55, 330));
        typewriterObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -22px" }
  );

  typewriterFragments.forEach((fragment) => typewriterObserver.observe(fragment));

  window.setTimeout(() => {
    const visible = typewriterFragments.filter((fragment) => {
      if (fragment.dataset.typed === "true") return false;
      const rect = fragment.getBoundingClientRect();
      return rect.bottom >= 0 &&
        rect.top <= window.innerHeight &&
        rect.right >= 0 &&
        rect.left <= window.innerWidth;
    });

    visible.forEach((fragment, index) => completeFragment(fragment, Math.min(index * 55, 330)));
  }, 60);
}

async function runEntrySequence() {
  if (reducedMotion || skipIntro) {
    if (skipIntro) body.classList.add("skip-intro");
    body.classList.add("entered", "typed");
    startTypewriterObserver();
    return;
  }

  await sleep(180);
  await typeBootText(document.querySelector("#boot-text"), "INITIALIZING SIGNAL FIELD");
  await sleep(700);
  body.classList.add("entered", "typed");
  await sleep(420);
  startTypewriterObserver();
}

runEntrySequence();
window.setTimeout(() => {
  if (!body.classList.contains("entered")) {
    body.classList.add("entered", "typed");
    startTypewriterObserver();
  }
}, 3600);

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

if (!reducedMotion) {
  window.addEventListener(
    "pointermove",
    (event) => {
      root.style.setProperty("--mouse-x", `${event.clientX}px`);
      root.style.setProperty("--mouse-y", `${event.clientY}px`);
      fluidPointer.x = event.clientX;
      fluidPointer.y = event.clientY;
      fluidPointer.active = true;
    },
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

const fluidCanvas = document.querySelector("#fluid-field");
const fluidContext = fluidCanvas.getContext("2d");
const fluidPointer = {
  x: window.innerWidth * 0.68,
  y: window.innerHeight * 0.3,
  active: false
};
let fluidWidth = window.innerWidth;
let fluidHeight = window.innerHeight;
let fluidSpacing = window.innerWidth < 700 ? 31 : 38;

function resizeFluid() {
  const density = Math.min(window.devicePixelRatio || 1, 2);
  const rect = fluidCanvas.getBoundingClientRect();
  fluidWidth = rect.width;
  fluidHeight = rect.height;
  fluidSpacing = window.innerWidth < 700 ? 31 : 38;
  fluidCanvas.width = Math.floor(fluidWidth * density);
  fluidCanvas.height = Math.floor(fluidHeight * density);
  fluidContext.setTransform(density, 0, 0, density, 0, 0);
}

function fluidPoint(column, row, time) {
  const overscan = fluidSpacing * 4;
  const baseX = column * fluidSpacing - overscan;
  const baseY = row * fluidSpacing - overscan;
  const flow = time * 0.00034;
  const phase = baseX * 0.0092 + baseY * 0.0126 - flow;
  const secondary = baseX * -0.0038 + baseY * 0.0064 + time * 0.00018;
  const wave = Math.sin(phase) * 19 + Math.sin(phase * 0.53 + secondary) * 11;
  const diagonalDrift = (time * 0.004) % fluidSpacing;

  let x = baseX + wave * 0.72 + diagonalDrift;
  let y = baseY - wave * 0.72 - diagonalDrift * 0.55;

  const pointerDistance = Math.hypot(x - fluidPointer.x, y - fluidPointer.y);
  if (fluidPointer.active && pointerDistance < 230) {
    const influence = (1 - pointerDistance / 230) * 9;
    const pointerAngle = Math.atan2(y - fluidPointer.y, x - fluidPointer.x);
    x += Math.cos(pointerAngle) * influence;
    y += Math.sin(pointerAngle) * influence;
  }

  const crest = Math.pow((Math.sin(phase) + 1) * 0.5, 3);
  const ribbon = Math.pow((Math.sin(phase * 0.47 + 1.2) + 1) * 0.5, 5);
  const alpha = 0.035 + crest * 0.22 + ribbon * 0.1;
  return { x, y, alpha, crest };
}

function drawFluid(time = 0) {
  fluidContext.clearRect(0, 0, fluidWidth, fluidHeight);
  const overscan = fluidSpacing * 4;
  const columns = Math.ceil((fluidWidth + overscan * 2) / fluidSpacing);
  const rows = Math.ceil((fluidHeight + overscan * 2) / fluidSpacing);
  const points = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, column) => fluidPoint(column, row, time))
  );

  const glow = fluidContext.createRadialGradient(
    fluidWidth * 0.63,
    fluidHeight * 0.38,
    0,
    fluidWidth * 0.63,
    fluidHeight * 0.38,
    fluidWidth * 0.65
  );
  glow.addColorStop(0, "rgba(34, 67, 75, .11)");
  glow.addColorStop(0.55, "rgba(7, 20, 24, .035)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  fluidContext.fillStyle = glow;
  fluidContext.fillRect(0, 0, fluidWidth, fluidHeight);

  fluidContext.lineWidth = 0.55;
  for (let row = 0; row < rows; row += 1) {
    fluidContext.beginPath();
    points[row].forEach((point, column) => {
      if (column === 0) fluidContext.moveTo(point.x, point.y);
      else fluidContext.lineTo(point.x, point.y);
    });
    const rowAlpha = 0.025 + Math.sin(row * 0.44 + time * 0.00016) * 0.01;
    fluidContext.strokeStyle = `rgba(126, 183, 193, ${Math.max(0.012, rowAlpha)})`;
    fluidContext.stroke();
  }

  for (let column = 0; column < columns; column += 1) {
    fluidContext.beginPath();
    points.forEach((row, rowIndex) => {
      const point = row[column];
      if (rowIndex === 0) fluidContext.moveTo(point.x, point.y);
      else fluidContext.lineTo(point.x, point.y);
    });
    fluidContext.strokeStyle = "rgba(108, 165, 177, .018)";
    fluidContext.stroke();
  }

  points.flat().forEach((point) => {
    const radius = 0.5 + point.crest * 1.25;
    fluidContext.beginPath();
    fluidContext.fillStyle = `rgba(174, 225, 232, ${point.alpha})`;
    fluidContext.arc(point.x, point.y, radius, 0, Math.PI * 2);
    fluidContext.fill();
  });

  if (!reducedMotion) requestAnimationFrame(drawFluid);
}

resizeFluid();
drawFluid(reducedMotion ? 1200 : 0);
window.addEventListener("resize", resizeFluid);
