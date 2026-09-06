(() => {
  const models = {
    bentley: ["Bentayga", "Continental Flying Spur", "Continental GT", "Continental GTC", "Continental Supersports", "Mulsanne", "New Continental Convertible", "New Continental GT", "New Flying Spur"],
    "rolls-royce": ["Phantom", "Ghost", "Cullinan", "Wraith", "Dawn", "Spectre"],
    "aston-martin": ["Cygnet", "DB11", "DB7", "DB9", "DBS Superleggera", "DBS V12", "DBX", "One-77", "Rapide", "Rapide S", "V12 Vantage (2022+)", "V12 Zagato", "V8 Vantage (2019+)", "Vanquish", "Vantage", "Virage"],
    ferrari: ["12Cilindri", "12Cilindri Spider", "288 GTO", "296", "348", "355", "360", "430", "456", "458", "488", "512", "550-575", "599", "612", "812", "California", "California T", "Daytona", "Enzo", "F12", "F40", "F50", "F8", "FF", "GTC4Lusso", "LaFerrari", "Monza", "Portofino", "Portofino M", "Purosangue", "Roma", "SF90"],
    lamborghini: ["Aventador", "Diablo", "Gallardo", "Huracan", "Murcielago", "Revuelto", "Urus"],
    maserati: ["3200", "4200", "Ghibli", "GranCabrio", "GranTurismo", "Grecale", "Levante", "MC20", "Quattroporte"]
  };

  const brandNames = {
    bentley: "Bentley",
    "rolls-royce": "Rolls-Royce",
    "aston-martin": "Aston Martin",
    ferrari: "Ferrari",
    lamborghini: "Lamborghini",
    maserati: "Maserati"
  };

  const categories = {
    aftermarket: "Aftermarket Parts",
    tuning: "Tuning Parts"
  };

  window.OvitecVehicleData = {
    models,
    brandNames,
    categories,
    brandKeys: Object.keys(brandNames),
    getModels(brand) {
      return models[brand] || [];
    },
    getBrandName(brand) {
      return brandNames[brand] || brand || "";
    },
    getCategoryLabel(category) {
      return categories[category] || category || "";
    }
  };
})();
