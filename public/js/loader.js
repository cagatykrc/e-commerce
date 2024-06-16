document.addEventListener("DOMContentLoaded", function () {
    setTimeout(() => {
        hideLoader();
    }, 100);
});

// Yükleme ekranını gizleme fonksiyonu
function hideLoader() {
    const loaderContainer = document.getElementById("loader-container");

    // Yavaşça kaybolması için opacity değerini azaltarak animasyon uygula
    let opacity = 1;
    const interval = setInterval(() => {
        if (opacity > 0) {
            loaderContainer.style.opacity = opacity;
            opacity -= 0.1; // İsterseniz bu değeri ayarlayabilirsiniz
        } else {
            clearInterval(interval);
            loaderContainer.style.display = "none";
        }
    }, 100);
}