/* AI, Explained Softly — small interactions.
   Everything here is optional: the page reads fine without JavaScript. */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;

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
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      if (entry.target.matches(".chart")) countUp(entry.target);
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.18 }
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
