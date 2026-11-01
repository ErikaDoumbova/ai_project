/* AI, Explained Softly — small interactions.
   Everything here is optional: the page reads fine without JavaScript. */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;

/* ---------- Mobile menu ---------- */
const navToggle = document.querySelector(".nav__toggle");
const navMenu = document.getElementById("nav-menu");

function setMenu(open) {
  navToggle.setAttribute("aria-expanded", String(open));
  navMenu.classList.toggle("is-open", open);
}

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    setMenu(navToggle.getAttribute("aria-expanded") !== "true");
  });
  navMenu.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navMenu.classList.contains("is-open")) {
      setMenu(false);
      navToggle.focus();
    }
  });
}

/* ---------- Scroll progress + back-to-top ---------- */
const progress = document.querySelector(".progress");
const toTop = document.querySelector(".to-top");

function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? window.scrollY / max : 0;
  if (progress) progress.style.setProperty("--progress", ratio.toFixed(4));
  if (toTop) toTop.classList.toggle("is-shown", window.scrollY > window.innerHeight * 0.8);
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- Highlight the section you are reading ---------- */
const navLinks = [...document.querySelectorAll(".nav__menu a")];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        const active = link.getAttribute("href") === `#${entry.target.id}`;
        if (active) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);

sections.forEach((section) => sectionObserver.observe(section));

/* ---------- Reveal on scroll (with a little stagger) ---------- */
document.querySelectorAll(".cards, .cases, .compare").forEach((group) => {
  [...group.children].forEach((child, i) => child.style.setProperty("--delay", `${i * 0.12}s`));
});

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      // Reveal once 18% is on screen, or straight away if it is peeking in from the top
      // (after a reload or a jump to a section, the page can open already scrolled past it).
      const enough = entry.intersectionRatio >= 0.18;
      const fromAbove = entry.isIntersecting && entry.boundingClientRect.top < 0;
      if (!enough && !fromAbove) return;
      entry.target.classList.add("is-visible");
      if (entry.target.matches(".chart")) countUp(entry.target);
      observer.unobserve(entry.target);
    });
  },
  { threshold: [0, 0.18] }
);

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

/* ---------- Chart numbers count up as the bars grow ---------- */
function countUp(chart) {
  chart.querySelectorAll("[data-count]").forEach((el) => {
    const target = Number(el.dataset.count);
    if (reduceMotion) return;
    const start = performance.now();
    const duration = 1400;
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/* ---------- Case-file flip cards ---------- */
document.querySelectorAll(".case").forEach((card) => {
  const front = card.querySelector(".case__front");
  const back = card.querySelector(".case__back");
  const openBtn = front.querySelector(".case__btn");
  const closeBtn = back.querySelector(".case__btn");

  function flip(open) {
    card.classList.toggle("is-flipped", open);
    openBtn.setAttribute("aria-expanded", String(open));
    front.inert = open;
    back.inert = !open;
    // Wait for the turn to start before moving focus, so the card doesn't jump.
    setTimeout(() => (open ? closeBtn : openBtn).focus({ preventScroll: true }), reduceMotion ? 0 : 250);
  }

  back.inert = true;
  openBtn.addEventListener("click", () => flip(true));
  closeBtn.addEventListener("click", () => flip(false));
});

/* ---------- Sparkle trail (mouse only, never with reduced motion) ---------- */
const sparkleShapes = ["✦", "♡", "✧", "·"];
let lastSparkle = 0;

if (finePointer && !reduceMotion) {
  window.addEventListener("pointermove", (event) => {
    const now = performance.now();
    if (now - lastSparkle < 45) return;
    lastSparkle = now;

    const sparkle = document.createElement("span");
    sparkle.className = "sparkle";
    sparkle.setAttribute("aria-hidden", "true");
    sparkle.textContent = sparkleShapes[Math.floor(Math.random() * sparkleShapes.length)];
    sparkle.style.left = `${event.clientX}px`;
    sparkle.style.top = `${event.clientY}px`;
    sparkle.style.setProperty("--drift", `${(Math.random() - 0.5) * 40}px`);
    document.body.appendChild(sparkle);
    sparkle.addEventListener("animationend", () => sparkle.remove());
  });
}

/* ---------- Heart burst on buttons ---------- */
function heartBurst(x, y) {
  for (let i = 0; i < 10; i++) {
    const heart = document.createElement("span");
    const angle = (Math.PI * 2 * i) / 10;
    const distance = 50 + Math.random() * 40;
    heart.className = "burst-heart";
    heart.setAttribute("aria-hidden", "true");
    heart.textContent = "♡";
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    heart.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    heart.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
    document.body.appendChild(heart);
    heart.addEventListener("animationend", () => heart.remove());
  }
}

if (!reduceMotion) {
  document.querySelectorAll(".btn, .case__btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX || rect.left + rect.width / 2;
      const y = event.clientY || rect.top + rect.height / 2;
      heartBurst(x, y);
    });
  });
}
