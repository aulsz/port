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
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      hour: "numeric",
      hourCycle: "h23"
    }).format(now)
  );

  document.querySelector("#local-time").textContent = `LOCAL TIME / ${time} CT`;
  root.style.setProperty("--time-light", hour >= 6 && hour < 18 ? 0.78 : hour < 21 ? 0.7 : 0.62);
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
      root.style.setProperty("--world-x", `${(event.clientX / window.innerWidth - 0.5) * -8}px`);
      root.style.setProperty("--world-y", `${(event.clientY / window.innerHeight - 0.5) * -5}px`);
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
window.addEventListener("resize", resizeSky);
