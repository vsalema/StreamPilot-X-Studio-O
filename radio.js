document.addEventListener("DOMContentLoaded", () => {

  const btnRadio = document.querySelector('#btnRefreshPlaylist[title="Radio FMt"]');
  if (!btnRadio) return;

  btnRadio.addEventListener("click", () => {
    // Récupérer la customList
    const customList = window.customListData || [];

    // Trouver "Alfa" dans la liste
    const alfa = customList.find(item =>
      item.name && item.name.toLowerCase().includes("alfa")
    );

    if (!alfa) {
      alert("⛔ La chaîne Alfa n'est pas dans la customList.");
      return;
    }

    // Charger Alfa dans le player
    const srcInput = document.getElementById("srcInput");
    const btnLoad = document.getElementById("btnLoad");

    if (!srcInput || !btnLoad) return;

    srcInput.value = alfa.url;   // Injecter l’URL
    btnLoad.click();             // Simuler le clic pour charger

    // Ouvrir l’overlay si nécessaire
    const examplesDetails = document.getElementById("examplesDetails");
    if (examplesDetails && !examplesDetails.open) {
      examplesDetails.open = true;
    }
  });
});
