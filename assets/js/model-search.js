(() => {
  const search = document.getElementById("model-search");
  const grid = document.getElementById("models-grid");
  const empty = document.getElementById("models-empty");
  const count = document.getElementById("models-count");
  if (!search || !grid) return;

  const cards = Array.from(grid.querySelectorAll(".model-card"));
  const isArabic = document.documentElement.lang === "ar";

  const applyFilter = () => {
    const query = search.value.trim().toLowerCase();
    let visible = 0;

    cards.forEach((card) => {
      const haystack = (card.dataset.search || "").toLowerCase();
      const show = !query || haystack.includes(query);
      card.hidden = !show;
      if (show) visible += 1;
    });

    if (empty) empty.hidden = visible !== 0;
    if (count) {
      if (isArabic) {
        count.textContent = visible === 1 ? "طراز واحد" : `${visible} طرازات`;
      } else {
        count.textContent = visible === 1 ? "1 model" : `${visible} models`;
      }
    }
  };

  search.addEventListener("input", applyFilter);
  applyFilter();
})();
