const body = document.body;
const root = document.documentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

function wrapTextNode(textNode) {
  const text = textNode.nodeValue;
  if (!text || !text.trim()) return null;

  const wrapper = document.createElement("span");
  wrapper.className = "tw-text";
  wrapper.setAttribute("aria-label", text.trim());

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
      characterSpan.style.setProperty("--char-delay", `${characterIndex * 13}ms`);
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

function prepareTypewriterText() {
  const fragments = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent || parent.closest("script, style, canvas, .tw-text")) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    const fragment = wrapTextNode(node);
    if (fragment) fragments.push(fragment);
  });

  return fragments;
}

const typewriterFragments = prepareTypewriterText();

function activateText(fragment, delay = 0) {
  if (fragment.dataset.typed === "true") return;
  fragment.dataset.typed = "true";
  fragment.style.setProperty("--fragment-delay", `${delay}ms`);
  fragment.classList.add("tw-active");

  const length = Number(fragment.dataset.characters || 0);
  window.setTimeout(() => {
    fragment.classList.add("tw-complete");
  }, delay + length * 13 + 120);
}

if (reducedMotion) {
  typewriterFragments.forEach((fragment) => fragment.classList.add("tw-active", "tw-complete"));
} else {
  const textObserver = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      visibleEntries.forEach((entry, index) => {
        activateText(entry.target, Math.min(index * 38, 220));
        textObserver.unobserve(entry.target);
      });
    },
    { threshold: .08, rootMargin: "0px 0px -18px" }
  );

  typewriterFragments.forEach((fragment) => textObserver.observe(fragment));

  window.setTimeout(() => {
    typewriterFragments.forEach((fragment, index) => {
      if (fragment.dataset.typed === "true") return;
      const rect = fragment.getBoundingClientRect();
      if (rect.bottom >= 0 && rect.top <= window.innerHeight) {
        activateText(fragment, Math.min(index * 18, 260));
      }
    });
  }, 80);
}

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

updateScrollProgress();
window.addEventListener("scroll", updateScrollProgress, { passive: true });

const fluidCanvas = document.querySelector("#fluid-canvas");
const fluidContext = fluidCanvas.getContext("2d");
const pointer = {
  x: window.innerWidth * .68,
  y: window.innerHeight * .28,
  active: false
};

let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;
let nodeSpacing = window.innerWidth < 700 ? 30 : 37;

function resizeFluidCanvas() {
  const density = Math.min(window.devicePixelRatio || 1, 2);
  const rect = fluidCanvas.getBoundingClientRect();
  canvasWidth = rect.width;
  canvasHeight = rect.height;
  nodeSpacing = window.innerWidth < 700 ? 30 : 37;
  fluidCanvas.width = Math.floor(canvasWidth * density);
  fluidCanvas.height = Math.floor(canvasHeight * density);
  fluidContext.setTransform(density, 0, 0, density, 0, 0);
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
  fluidContext.clearRect(0, 0, canvasWidth, canvasHeight);

  const overscan = nodeSpacing * 4;
  const columns = Math.ceil((canvasWidth + overscan * 2) / nodeSpacing);
  const rows = Math.ceil((canvasHeight + overscan * 2) / nodeSpacing);
  const nodes = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, column) => calculateNode(column, row, time))
  );

  const fieldGlow = fluidContext.createRadialGradient(
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

  nodes.flat().forEach((node) => {
    fluidContext.beginPath();
    fluidContext.fillStyle = `rgba(183, 233, 234, ${node.intensity})`;
    fluidContext.arc(node.x, node.y, .55 + node.crest * 1.35, 0, Math.PI * 2);
    fluidContext.fill();
  });

  if (!reducedMotion) requestAnimationFrame(drawFluidField);
}

resizeFluidCanvas();
drawFluidField(reducedMotion ? 1200 : 0);

window.addEventListener("resize", resizeFluidCanvas);

if (!reducedMotion) {
  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
    root.style.setProperty("--mouse-x", `${event.clientX}px`);
    root.style.setProperty("--mouse-y", `${event.clientY}px`);
  }, { passive: true });
}

document.querySelectorAll(".case-study, .bento-card").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    if (!window.matchMedia("(pointer: fine)").matches || reducedMotion) return;
    const rect = card.getBoundingClientRect();
    const localX = (event.clientX - rect.left) / rect.width;
    const localY = (event.clientY - rect.top) / rect.height;
    const rotateX = (localY - .5) * -2.1;
    const rotateY = (localX - .5) * 2.1;
    card.style.setProperty("--glass-x", `${localX * 100}%`);
    card.style.setProperty("--glass-y", `${localY * 100}%`);
    card.style.setProperty("--glass-shift-x", `${(localX - .5) * 5}px`);
    card.style.setProperty("--glass-shift-y", `${(localY - .5) * 5}px`);
    card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
    card.style.setProperty("--glass-x", "50%");
    card.style.setProperty("--glass-y", "35%");
    card.style.setProperty("--glass-shift-x", "0px");
    card.style.setProperty("--glass-shift-y", "0px");
  });
});
