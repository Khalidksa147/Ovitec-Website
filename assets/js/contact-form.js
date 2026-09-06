(() => {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const brandSelect = document.getElementById("car-brand");
  const modelSelect = document.getElementById("car-model");
  const yearSelect = document.getElementById("car-year");
  const errorEl = document.getElementById("contact-form-error");
  const successEl = document.getElementById("contact-form-success");
  const modal = document.getElementById("inquiry-modal");

  const vehicle = window.OvitecVehicleData;
  if (!vehicle) return;
  const models = vehicle.models;
  const brandNames = vehicle.brandNames;

  const fillSelect = (select, options, placeholder) => {
    select.innerHTML = `<option value="">${placeholder}</option>`;
    options.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  };

  const isArabic = document.documentElement.lang === "ar";
  const labels = isArabic
    ? {
        year: "اختر السنة",
        model: "اختر الطراز",
        missing: "يرجى تعبئة جميع الحقول المطلوبة قبل إرسال الاستفسار.",
        email: "يرجى إدخال بريد إلكتروني صالح.",
        imageType: "يرجى رفع صورة بصيغة JPG أو PNG أو WEBP.",
        imageSize: "حجم الصورة يجب ألا يتجاوز 8 ميغابايت.",
        noFile: "لم يتم اختيار ملف"
      }
    : {
        year: "Select Year",
        model: "Select Model",
        missing: "Please complete all required fields before sending your enquiry.",
        email: "Please enter a valid email address.",
        imageType: "Please upload a JPG, PNG, or WEBP image.",
        imageSize: "The image must be 8 MB or smaller.",
        noFile: "No file selected"
      };

  const imageInput = document.getElementById("part-image");
  const imageName = document.getElementById("part-image-name");
  const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
  const ALLOWED_IMAGE = /^image\/(jpeg|png|webp|gif)$/;

  const syncImageName = () => {
    if (!imageName) return;
    const file = imageInput?.files?.[0];
    imageName.textContent = file ? file.name : labels.noFile;
  };

  imageInput?.addEventListener("change", syncImageName);

  const years = [];
  const thisYear = new Date().getFullYear();
  for (let year = thisYear + 1; year >= 1995; year -= 1) years.push(String(year));
  fillSelect(yearSelect, years, labels.year);

  const updateModels = (keepValue) => {
    const brand = brandSelect.value;
    fillSelect(modelSelect, models[brand] || [], labels.model);
    modelSelect.disabled = !brand;
    if (keepValue && models[brand]?.includes(keepValue)) modelSelect.value = keepValue;
  };

  const applySelection = (brand, model) => {
    const brandKey = (brand || "").toLowerCase();
    if (brandNames[brandKey]) brandSelect.value = brandKey;
    updateModels(model);
  };

  brandSelect.addEventListener("change", () => updateModels());

  const params = new URLSearchParams(window.location.search);
  applySelection(params.get("brand"), params.get("model"));

  const closeModal = () => {
    if (!modal) return;
    if (typeof modal.close === "function" && modal.open) modal.close();
    document.body.classList.remove("modal-open");
  };

  const openModal = (brand, model) => {
    if (!modal) return;
    form.classList.remove("is-sent");
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = "";
    }
    if (successEl) successEl.hidden = true;
    applySelection(brand, model);
    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");
    document.body.classList.add("modal-open");
  };

  document.querySelectorAll("[data-inquiry-open]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      openModal(trigger.dataset.brand, trigger.dataset.model);
    });
  });

  document.querySelectorAll("[data-inquiry-close]").forEach((btn) => {
    btn.addEventListener("click", closeModal);
  });

  modal?.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  modal?.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
    const required = ["enquireAs", "brand", "model", "year", "category", "name", "email", "phone", "contactMethod"];
    const missing = required.some((key) => !String(data[key] || "").trim());
    const image = formData.get("partImage");

    if (missing) {
      errorEl.hidden = false;
      errorEl.textContent = labels.missing;
      return;
    }

    if (!emailOk) {
      errorEl.hidden = false;
      errorEl.textContent = labels.email;
      return;
    }

    if (image instanceof File && image.size > 0) {
      if (!ALLOWED_IMAGE.test(image.type)) {
        errorEl.hidden = false;
        errorEl.textContent = labels.imageType;
        return;
      }
      if (image.size > MAX_IMAGE_BYTES) {
        errorEl.hidden = false;
        errorEl.textContent = labels.imageSize;
        return;
      }
    }

    errorEl.hidden = true;
    form.classList.add("is-sent");
    successEl.hidden = false;
    const brand = brandSelect.value;
    const model = modelSelect.value;
    form.reset();
    syncImageName();
    applySelection(brand, model);
  });
})();
