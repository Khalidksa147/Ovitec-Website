(() => {
  const vehicle = window.OvitecVehicleData;
  if (!vehicle) return;

  const grid = document.getElementById("products-grid");
  const empty = document.getElementById("products-empty");
  const status = document.getElementById("products-status");
  const categorySelect = document.getElementById("filter-category");
  const brandSelect = document.getElementById("filter-brand");
  const modelSelect = document.getElementById("filter-model");
  const clearBtn = document.getElementById("filter-clear");
  if (!grid || !categorySelect || !brandSelect || !modelSelect) return;

  const isArabic = document.documentElement.lang === "ar";
  const contactBase = isArabic ? "/ar/contact" : "/contact";
  const labels = isArabic
    ? {
        allCategories: "كل الفئات",
        allBrands: "كل العلامات",
        allModels: "كل الطرازات",
        loading: "جاري تحميل المنتجات…",
        error: "تعذر تحميل المنتجات. حاول مرة أخرى.",
        empty: "لا توجد منتجات مطابقة للفلاتر المحددة.",
        enquire: "استفسر",
        sar: "ر.س"
      }
    : {
        allCategories: "All categories",
        allBrands: "All brands",
        allModels: "All models",
        loading: "Loading products…",
        error: "Could not load products. Please try again.",
        empty: "No products match the selected filters.",
        enquire: "Enquire",
        sar: "SAR"
      };

  const fillSelect = (select, options, placeholder, selected) => {
    select.innerHTML = "";
    const first = document.createElement("option");
    first.value = "";
    first.textContent = placeholder;
    select.appendChild(first);
    options.forEach(([value, text]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text;
      select.appendChild(option);
    });
    if (selected) select.value = selected;
  };

  const syncModels = (keepValue) => {
    const brand = brandSelect.value;
    const models = vehicle.getModels(brand).map((m) => [m, m]);
    fillSelect(modelSelect, models, labels.allModels, keepValue && models.some(([v]) => v === keepValue) ? keepValue : "");
    modelSelect.disabled = !brand;
  };

  const categoryOptions = isArabic
    ? [
        ["aftermarket", "قطع ما بعد البيع"],
        ["tuning", "قطع تعديلية"]
      ]
    : Object.entries(vehicle.categories);

  const getCategoryLabel = (category) => {
    if (isArabic) {
      return category === "tuning" ? "قطع تعديلية" : category === "aftermarket" ? "قطع ما بعد البيع" : category;
    }
    return vehicle.getCategoryLabel(category);
  };

  const params = new URLSearchParams(window.location.search);
  fillSelect(
    categorySelect,
    categoryOptions,
    labels.allCategories,
    params.get("category") || ""
  );
  fillSelect(
    brandSelect,
    vehicle.brandKeys.map((key) => [key, vehicle.getBrandName(key)]),
    labels.allBrands,
    params.get("brand") || ""
  );
  syncModels(params.get("model") || "");

  const formatPrice = (price) => {
    const value = Number(price);
    if (!Number.isFinite(value)) return "";
    return `${labels.sar} ${value.toLocaleString(isArabic ? "ar-SA" : "en-US", { maximumFractionDigits: 0 })}`;
  };

  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const localized = (product, enKey, arKey) => {
    const en = String(product[enKey] || "").trim();
    const ar = String(product[arKey] || "").trim();
    if (isArabic) return ar || en;
    return en || ar;
  };

  const setStatus = (text, isError = false) => {
    if (!status) return;
    status.hidden = !text;
    status.textContent = text || "";
    status.classList.toggle("is-error", Boolean(isError));
  };

  const render = (products) => {
    grid.innerHTML = "";
    if (!products.length) {
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    products.forEach((product) => {
      const brandName = vehicle.getBrandName(product.brand);
      const catLabel = getCategoryLabel(product.category);
      const title = localized(product, "title", "titleAr");
      const description = localized(product, "description", "descriptionAr");
      const enquireUrl = `${contactBase}?brand=${encodeURIComponent(product.brand || "")}&model=${encodeURIComponent(product.model || "")}`;
      const card = document.createElement("article");
      card.className = "product-card";
      card.innerHTML = `
        <div class="product-card__media">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(title)}" loading="lazy" decoding="async">
        </div>
        <div class="product-card__body">
          <p class="product-card__meta">${escapeHtml(catLabel)} · ${escapeHtml(brandName)} ${escapeHtml(product.model || "")}</p>
          <h3>${escapeHtml(title)}</h3>
          <p class="product-card__desc">${escapeHtml(description)}</p>
          <div class="product-card__footer">
            <strong class="product-card__price">${escapeHtml(formatPrice(product.price))}</strong>
            <a class="btn btn--red" href="${enquireUrl}"><span>${labels.enquire}</span></a>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  };

  const currentFilters = () => ({
    category: categorySelect.value,
    brand: brandSelect.value,
    model: modelSelect.value
  });

  const updateUrl = (filters) => {
    const next = new URL(window.location.href);
    ["category", "brand", "model"].forEach((key) => {
      if (filters[key]) next.searchParams.set(key, filters[key]);
      else next.searchParams.delete(key);
    });
    window.history.replaceState({}, "", next.pathname + next.search);
  };

  const loadProducts = async () => {
    const filters = currentFilters();
    updateUrl(filters);
    setStatus(labels.loading);
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    const qs = query.toString();

    try {
      let products = [];
      try {
        const res = await fetch(`/backend/products.php${qs ? `?${qs}` : ""}`, { credentials: "same-origin" });
        if (!res.ok) throw new Error("api");
        const data = await res.json();
        products = Array.isArray(data.products) ? data.products : [];
      } catch {
        const res = await fetch("/data/products.example.json", { cache: "no-store" });
        if (!res.ok) throw new Error("fallback");
        const all = await res.json();
        products = (Array.isArray(all) ? all : []).filter((product) => {
          if (filters.category && product.category !== filters.category) return false;
          if (filters.brand && product.brand !== filters.brand) return false;
          if (filters.model && product.model !== filters.model) return false;
          return true;
        });
      }
      setStatus("");
      render(products);
      if (!products.length && empty) {
        empty.textContent = labels.empty;
        empty.hidden = false;
      }
    } catch {
      setStatus(labels.error, true);
      render([]);
    }
  };

  brandSelect.addEventListener("change", () => {
    syncModels();
    loadProducts();
  });
  categorySelect.addEventListener("change", loadProducts);
  modelSelect.addEventListener("change", loadProducts);
  clearBtn?.addEventListener("click", () => {
    categorySelect.value = "";
    brandSelect.value = "";
    syncModels();
    loadProducts();
  });

  loadProducts();
})();
