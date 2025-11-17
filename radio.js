document.addEventListener("DOMContentLoaded", () => {
  // Bouton 📻 dans la barre du player
  const btnRadioFM = document.querySelector('#controlBar #radiofm[title="Radio FMt"]');
  if (!btnRadioFM) return;

  btnRadioFM.addEventListener("click", () => {
    if (!window.radioAlfa || !window.radioAlfa.url) {
      alert("⛔ Radio Alfa n'est pas définie dans custom-addon.js");
      return;
    }

    const srcInput = document.getElementById("srcInput");
    const btnLoad  = document.getElementById("btnLoad");
    const currentTitle = document.getElementById("currentTitle");

    if (!srcInput || !btnLoad) return;

    // On injecte l’URL de Radio Alfa
    srcInput.value = window.radioAlfa.url;

    // On met le titre dans la barre centrale
    if (currentTitle && window.radioAlfa.name) {
      currentTitle.textContent = window.radioAlfa.name;
    }

    // On lance la lecture
    btnLoad.click();

    // On ouvre l’overlay/menu si tu t’en sers comme “overlay”
    const examplesDetails = document.getElementById("examplesDetails");
    if (examplesDetails && !examplesDetails.open) {
      examplesDetails.open = true;
    }
  });
});
