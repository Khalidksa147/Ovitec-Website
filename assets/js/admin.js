(() => {
  const vehicle = window.OvitecVehicleData;
  if (!vehicle) return;

  const loginSection = document.getElementById("admin-login");
  const appSection = document.getElementById("admin-app");
  const loginForm = document.getElementById("login-form");
  const loginPassword = document.getElementById("login-password");
  const loginError = document.getElementById("login-error");
  const logoutBtn = document.getElementById("logout-btn");
  const productForm = document.getElementById("product-form");
  const formTitle = document.getElementById("form-title");
  const formError = document.getElementById("form-error");
  const productId = document.getElementById("product-id");
  const productCategory = document.getElementById("product-category");
  const productTitle = document.getElementById("product-title");
  const productDescription = document.getElementById("product-description");
  const productPrice = document.getElementById("product-price");
  const productBrand = document.getElementById("product-brand");
  const productModel = document.getElementById("product-model");
  const productImage = document.getElementById("product-image");
  const productImageFile = document.getElementById("product-image-file");
  const productPreview = document.getElementById("product-preview");
  const resetFormBtn = document.getElementById("reset-form-btn");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");
  const tbody = document.getElementById("products-tbody");
  const productCount = document.getElementById("product-count");
  const adminEmpty = document.getElementById("admin-empty");

  let products = [];

  const api = async (url, options = {}) => {
    const res = await fetch(url, {
      credentials: "include",
      headers: {
        ...(options.body && !(options.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...(options.headers || {})
      },
      ...options
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || "Request failed");
      err.status = res.status;
      throw err;
    }
    return data;
  };

  const fillSelect = (select, options, placeholder, selected) => {
    select.innerHTML = "";
    if (placeholder) {
      const first = document.createElement("option");
      first.value = "";
      first.textContent = placeholder;
      select.appendChild(first);
    }
    options.forEach(([value, text]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text;
      select.appendChild(option);
    });
    if (selected) select.value = selected;
  };

  const syncModels = (keepValue) => {
    const brand = productBrand.value;
    const models = vehicle.getModels(brand).map((m) => [m, m]);
    fillSelect(productModel, models, "Select model", keepValue && models.some(([v]) => v === keepValue) ? keepValue : "");
    productModel.disabled = !brand;
  };

  const setAuthed = (authed) => {
    loginSection.classList.toggle("admin-hidden", authed);
    appSection.classList.toggle("admin-hidden", !authed);
  };

  const showFormError = (message) => {
    formError.hidden = !message;
    formError.textContent = message || "";
  };

  const updatePreview = () => {
    const src = productImage.value.trim();
    if (!src) {
      productPreview.classList.remove("is-visible");
      productPreview.removeAttribute("src");
      return;
    }
    productPreview.src = src;
    productPreview.classList.add("is-visible");
  };

  const resetForm = () => {
    productForm.reset();
    productId.value = "";
    formTitle.textContent = "Add product";
    cancelEditBtn.classList.add("admin-hidden");
    showFormError("");
    syncModels();
    updatePreview();
  };

  const fillBrandSelect = () => {
    fillSelect(
      productBrand,
      vehicle.brandKeys.map((key) => [key, vehicle.getBrandName(key)]),
      "Select brand"
    );
    syncModels();
  };

  const renderTable = () => {
    tbody.innerHTML = "";
    productCount.textContent = `${products.length} item${products.length === 1 ? "" : "s"}`;
    adminEmpty.hidden = products.length > 0;
    products.forEach((product) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><img src="${product.image}" alt=""></td>
        <td><strong>${product.title || ""}</strong></td>
        <td>${vehicle.getCategoryLabel(product.category)}</td>
        <td>${vehicle.getBrandName(product.brand)} ${product.model || ""}</td>
        <td>SAR ${Number(product.price || 0).toLocaleString("en-US")}</td>
        <td>
          <div class="admin-table__actions">
            <button class="btn btn--ghost" type="button" data-edit="${product.id}"><span>Edit</span></button>
            <button class="btn btn--ghost" type="button" data-delete="${product.id}"><span>Delete</span></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  };

  const loadProducts = async () => {
    const data = await api("/api/products.php");
    products = Array.isArray(data.products) ? data.products : [];
    renderTable();
  };

  const startEdit = (id) => {
    const product = products.find((item) => item.id === id);
    if (!product) return;
    productId.value = product.id;
    productCategory.value = product.category;
    productTitle.value = product.title || "";
    productDescription.value = product.description || "";
    productPrice.value = product.price ?? "";
    productBrand.value = product.brand || "";
    syncModels(product.model || "");
    productImage.value = product.image || "";
    updatePreview();
    formTitle.textContent = "Edit product";
    cancelEditBtn.classList.remove("admin-hidden");
    productForm.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginError.hidden = true;
    try {
      await api("/api/auth.php?action=login", {
        method: "POST",
        body: JSON.stringify({ password: loginPassword.value })
      });
      loginPassword.value = "";
      setAuthed(true);
      fillBrandSelect();
      await loadProducts();
    } catch (err) {
      loginError.hidden = false;
      loginError.textContent = err.message || "Invalid password";
    }
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      await api("/api/auth.php?action=logout", { method: "POST", body: "{}" });
    } catch {
      /* ignore */
    }
    setAuthed(false);
  });

  productBrand.addEventListener("change", () => syncModels());
  productImage.addEventListener("input", updatePreview);

  productImageFile.addEventListener("change", async () => {
    const file = productImageFile.files?.[0];
    if (!file) return;
    showFormError("");
    const body = new FormData();
    body.append("image", file);
    try {
      const data = await api("/api/upload.php", { method: "POST", body });
      productImage.value = data.url || "";
      updatePreview();
    } catch (err) {
      showFormError(err.message || "Upload failed");
    } finally {
      productImageFile.value = "";
    }
  });

  resetFormBtn.addEventListener("click", resetForm);
  cancelEditBtn.addEventListener("click", resetForm);

  productForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showFormError("");
    const payload = {
      id: productId.value || undefined,
      category: productCategory.value,
      title: productTitle.value.trim(),
      description: productDescription.value.trim(),
      price: Number(productPrice.value),
      brand: productBrand.value,
      model: productModel.value,
      image: productImage.value.trim()
    };
    try {
      if (payload.id) {
        await api("/api/products.php", { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await api("/api/products.php", { method: "POST", body: JSON.stringify(payload) });
      }
      resetForm();
      await loadProducts();
    } catch (err) {
      showFormError(err.message || "Could not save product");
    }
  });

  tbody.addEventListener("click", async (event) => {
    const editId = event.target.closest("[data-edit]")?.getAttribute("data-edit");
    const deleteId = event.target.closest("[data-delete]")?.getAttribute("data-delete");
    if (editId) {
      startEdit(editId);
      return;
    }
    if (!deleteId) return;
    if (!window.confirm("Delete this product?")) return;
    try {
      await api("/api/products.php", {
        method: "DELETE",
        body: JSON.stringify({ id: deleteId })
      });
      if (productId.value === deleteId) resetForm();
      await loadProducts();
    } catch (err) {
      showFormError(err.message || "Could not delete product");
    }
  });

  (async () => {
    fillBrandSelect();
    try {
      const me = await api("/api/auth.php?action=me");
      if (me.authenticated) {
        setAuthed(true);
        await loadProducts();
      } else {
        setAuthed(false);
      }
    } catch {
      setAuthed(false);
      loginError.hidden = false;
      loginError.textContent = "PHP API unavailable. Run php -S localhost:8080 from the project root, or open /admin on Hostinger.";
    }
  })();
})();
