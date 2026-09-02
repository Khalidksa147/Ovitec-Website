(() => {
  const header = document.getElementById("site-header");
  const nav = document.getElementById("site-nav");
  const menuToggle = document.getElementById("menu-toggle");
  const searchToggle = document.getElementById("search-toggle");
  const searchPanel = document.getElementById("search-panel");
  const form = document.getElementById("inquiry-form");
  const formError = document.getElementById("form-error");
  const formSuccess = document.getElementById("form-success");
  const isDefaultNav = document.body.dataset.nav === "default";

  const overlay = document.createElement("div");
  overlay.className = "nav-overlay";
  document.body.appendChild(overlay);

  const closeMenu = () => {
    if (!nav || !menuToggle) return;
    nav.classList.remove("is-open");
    menuToggle.classList.remove("is-open");
    overlay.classList.remove("is-open");
    document.body.classList.remove("body-locked");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");
  };

  window.addEventListener("scroll", () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }, { passive: true });

  if (isDefaultNav && menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const open = !nav.classList.contains("is-open");
      nav.classList.toggle("is-open", open);
      menuToggle.classList.toggle("is-open", open);
      overlay.classList.toggle("is-open", open);
      document.body.classList.toggle("body-locked", open);
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    overlay.addEventListener("click", closeMenu);
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    window.addEventListener("resize", () => {
      if (window.innerWidth > 1100) closeMenu();
    });
  }

  if (isDefaultNav && searchToggle && searchPanel) {
    searchToggle.addEventListener("click", () => {
      const isHidden = searchPanel.hasAttribute("hidden");
      if (isHidden) {
        searchPanel.removeAttribute("hidden");
        searchToggle.setAttribute("aria-expanded", "true");
        document.getElementById("site-search").focus();
      } else {
        searchPanel.setAttribute("hidden", "");
        searchToggle.setAttribute("aria-expanded", "false");
      }
    });

    searchPanel.querySelector("form").addEventListener("submit", (event) => {
      event.preventDefault();
      const value = document.getElementById("site-search").value.trim();
      if (!value) return;
      document.getElementById("collection").scrollIntoView({ behavior: "smooth" });
      searchPanel.setAttribute("hidden", "");
      searchToggle.setAttribute("aria-expanded", "false");
    });
  }

  const langSwitch = document.getElementById("lang-switch");
  const langBtn = document.getElementById("lang-switch-btn");
  const langMenu = document.getElementById("lang-switch-menu");

  if (langSwitch && langBtn && langMenu) {
    const closeLang = () => {
      langSwitch.classList.remove("is-open");
      langBtn.setAttribute("aria-expanded", "false");
      langMenu.hidden = true;
    };

    langBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const open = langMenu.hasAttribute("hidden");
      langSwitch.classList.toggle("is-open", open);
      langBtn.setAttribute("aria-expanded", String(open));
      langMenu.toggleAttribute("hidden", !open);
    });

    const currentLang = document.documentElement.lang === "ar" ? "ar" : "en";

    langMenu.querySelectorAll("[data-lang]").forEach((option) => {
      option.addEventListener("click", (event) => {
        event.stopPropagation();
        const lang = option.dataset.lang;
        const href = option.getAttribute("href");

        if (lang === currentLang) {
          event.preventDefault();
          closeLang();
          return;
        }

        if (href) {
          event.preventDefault();
          const next = new URL(href, location.href);
          next.search = location.search;
          if (!href.includes("#")) next.hash = location.hash;
          location.href = next.pathname + next.search + next.hash;
        }
      });
    });

    document.addEventListener("click", (event) => {
      if (!langSwitch.contains(event.target)) closeLang();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeLang();
    });
  }

  if (form) {
    const isArabic = document.documentElement.lang === "ar";

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);

      if (!data.name || !data.email || !data.mobile || !data.model || !data.message) {
        formError.hidden = false;
        formError.textContent = isArabic
          ? "يرجى تعبئة جميع الحقول قبل إرسال الاستفسار."
          : "Please complete all fields before sending your enquiry.";
        return;
      }

      if (!emailOk) {
        formError.hidden = false;
        formError.textContent = isArabic
          ? "يرجى إدخال بريد إلكتروني صالح."
          : "Please enter a valid email address.";
        return;
      }

      formError.hidden = true;
      form.classList.add("is-sent");
      formSuccess.hidden = false;
      form.reset();
    });
  }
})();
