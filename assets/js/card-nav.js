(() => {
  if (document.body.dataset.nav !== "react") return;
  if (typeof gsap === "undefined") return;

  const ease = "power3.out";
  const navEl = document.querySelector(".card-nav");
  const navContainer = document.querySelector(".card-nav-container");
  const hamburger = document.querySelector(".hamburger-menu");
  const contentEl = document.querySelector(".card-nav-content");
  const cards = Array.from(document.querySelectorAll(".nav-card"));
  const topbar = document.querySelector(".topbar");

  if (!navEl || !navContainer || !hamburger || !contentEl) return;

  const updateNavTop = () => {
    const offset = topbar ? Math.max(0, Math.round(topbar.getBoundingClientRect().bottom)) : 0;
    navContainer.style.setProperty("--card-nav-top", `${offset}px`);
  };

  updateNavTop();
  window.addEventListener("scroll", updateNavTop, { passive: true });

  let isExpanded = false;
  let tl = null;

  const calculateHeight = () => {
    const topBar = 60;
    const padding = 20;
    const cardHeights = [];

    const wasVisible = contentEl.style.visibility;
    const wasPointerEvents = contentEl.style.pointerEvents;
    const wasPosition = contentEl.style.position;
    const wasHeight = contentEl.style.height;

    contentEl.style.visibility = "visible";
    contentEl.style.pointerEvents = "auto";
    contentEl.style.position = "static";
    contentEl.style.height = "auto";

    cards.forEach((card) => {
      const previousHeight = card.style.height;
      card.style.height = "auto";
      cardHeights.push(card.scrollHeight);
      card.style.height = previousHeight;
    });

    contentEl.offsetHeight;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const contentHeight = isMobile
      ? contentEl.scrollHeight
      : Math.max(...cardHeights, 0);

    contentEl.style.visibility = wasVisible;
    contentEl.style.pointerEvents = wasPointerEvents;
    contentEl.style.position = wasPosition;
    contentEl.style.height = wasHeight;

    return topBar + contentHeight + padding;
  };

  const createTimeline = () => {
    gsap.set(navEl, { height: 60, overflow: "hidden" });
    gsap.set(cards, { y: 50, opacity: 0 });

    const timeline = gsap.timeline({ paused: true });
    timeline.to(navEl, {
      height: calculateHeight,
      duration: 0.4,
      ease
    });
    timeline.to(cards, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 }, "-=0.1");
    return timeline;
  };

  const rebuildTimeline = (playOpen) => {
    tl?.kill();
    tl = createTimeline();
    if (playOpen) tl.progress(1);
  };

  tl = createTimeline();

  const toggleMenu = () => {
    if (!tl) return;

    if (!isExpanded) {
      hamburger.classList.add("open");
      navEl.classList.add("open");
      hamburger.setAttribute("aria-expanded", "true");
      hamburger.setAttribute("aria-label", "Close menu");
      contentEl.setAttribute("aria-hidden", "false");
      isExpanded = true;
      tl.play(0);
    } else {
      hamburger.classList.remove("open");
      hamburger.setAttribute("aria-expanded", "false");
      hamburger.setAttribute("aria-label", "Open menu");
      tl.eventCallback("onReverseComplete", () => {
        navEl.classList.remove("open");
        contentEl.setAttribute("aria-hidden", "true");
        isExpanded = false;
      });
      tl.reverse();
    }
  };

  hamburger.addEventListener("click", toggleMenu);
  hamburger.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleMenu();
    }
  });

  contentEl.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (isExpanded) toggleMenu();
    });
  });

  window.addEventListener("resize", () => {
    updateNavTop();
    if (!tl) return;
    if (isExpanded) {
      gsap.set(navEl, { height: calculateHeight() });
      rebuildTimeline(true);
    } else {
      rebuildTimeline(false);
    }
  });
})();
