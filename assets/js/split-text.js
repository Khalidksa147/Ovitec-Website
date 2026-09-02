(() => {
  // Headings are hidden by CSS until they are prepared, so the full text never
  // flashes before its animation runs. Every exit path below has to reveal them.
  const revealAll = () =>
    document.querySelectorAll("h1, h2, h3, h4").forEach((el) => el.classList.add("split-fade"));

  if (typeof gsap === "undefined") {
    revealAll();
    return;
  }

  const hasSplitText = typeof SplitText !== "undefined";
  if (hasSplitText) gsap.registerPlugin(SplitText);

  const isRtl = document.documentElement.dir === "rtl";
  const headings = gsap.utils.toArray("h1, h2, h3, h4").filter(
    (el) => !el.closest(".car-card") && !el.closest(".about-service") && !el.closest(".inquiry-modal") && !el.closest(".contact-form")
  );
  const drops = gsap.utils.toArray(".drop-in, .drop-in-2");
  const fadeCards = gsap.utils.toArray(".car-card, .about-service");

  gsap.set(drops, { opacity: 0, y: -80 });
  if (fadeCards.length) gsap.set(fadeCards, { opacity: 0, y: 48 });

  const prepareFade = (el) => {
    gsap.set(el, { opacity: 0, y: 28 });
    el.classList.add("split-fade");
  };

  const prepareHeading = (el) => {
    if (!el.textContent.trim() || isRtl || !hasSplitText) {
      prepareFade(el);
      return;
    }

    try {
      const split = SplitText.create(el, {
        type: "chars,words",
        tag: "span",
        smartWrap: true,
        charsClass: "split-char",
        wordsClass: "split-word",
        reduceWhiteSpace: false
      });

      const targets = split.chars?.length ? split.chars : split.words;
      if (!targets?.length) {
        prepareFade(el);
        return;
      }

      gsap.set(targets, { opacity: 0, y: 40 });
      el.splitTargets = targets;
      el.classList.add("split-parent");
    } catch (error) {
      console.warn("SplitText failed:", error);
      prepareFade(el);
    }
  };

  const animateHeading = (el) => {
    if (el.splitTargets) {
      gsap.to(el.splitTargets, {
        opacity: 1,
        y: 0,
        duration: 1.25,
        stagger: 0.05,
        ease: "power3.out"
      });
      return;
    }

    gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: "power3.out" });
  };

  const animateDrop = (el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: el.classList.contains("drop-in-2") ? 1.2 : 1,
      delay: el.classList.contains("drop-in-2") ? 0.2 : 0,
      ease: "power2.out"
    });
  };

  const animateCards = (grid) => {
    const cards = gsap.utils.toArray(grid.querySelectorAll(".car-card, .about-service"));
    // Tall brand grids (Ferrari, Aston Martin) need a shorter stagger so the
    // first rows don't sit invisible while later cards queue up.
    const stagger = cards.length > 12 ? 0.06 : 0.18;
    gsap.to(cards, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger,
      ease: "power3.out"
    });
  };

  // The drop-in elements start shifted above their clipping wrapper, so the
  // wrapper is what we watch for visibility.
  const watchList = new Map();
  headings.forEach((el) => watchList.set(el, el));
  drops.forEach((el) => watchList.set(el.closest(".overflow-hidden") || el, el));
  document.querySelectorAll(".collection__grid, .about-services__grid").forEach((grid) => watchList.set(grid, grid));

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const target = watchList.get(entry.target);
        obs.unobserve(entry.target);
        if (!target || target.dataset.animated === "true") return;

        target.dataset.animated = "true";
        if (target.matches(".collection__grid, .about-services__grid")) animateCards(target);
        else if (target.matches("h1, h2, h3, h4")) animateHeading(target);
        else animateDrop(target);
      });
    },
    // threshold 0: any visible slice of a tall models grid is enough. A ratio
    // like 0.15 fails on Ferrari/Aston Martin because the grid is so tall that
    // the first rows never reach 15% of the whole element until you scroll deep.
    { threshold: 0, rootMargin: "0px 0px -8% 0px" }
  );

  const start = () => {
    headings.forEach(prepareHeading);
    revealAll();
    watchList.forEach((_, trigger) => observer.observe(trigger));
  };

  const fonts = document.fonts?.ready ?? Promise.resolve();
  Promise.race([fonts, new Promise((resolve) => setTimeout(resolve, 600))]).then(start);
})();
