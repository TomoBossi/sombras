let currentEntry;
let currentImageIndex = 0;
let currentOverlay = false;
const maxRetries = 5;

// Google Drive rejects bursts of thumbnail requests; retry with exponential backoff + jitter.
// A retry is dropped if the img's src was changed in the meantime (e.g. overlay closed or next image).
function setSrcWithRetry(img, url) {
  let attempts = 0;
  img.onerror = () => {
    if (attempts >= maxRetries || !img.getAttribute("src").startsWith(url)) return;
    attempts++;
    const delay = 1000 * 2 ** (attempts - 1) + Math.random() * 1000;
    setTimeout(() => {
      if (img.getAttribute("src").startsWith(url)) img.src = `${url}&retry=${attempts}`;
    }, delay);
  };
  img.src = url;
}

function setBackgroundWithRetry(element, url) {
  const img = new Image();
  img.onload = () => element.style.backgroundImage = `url("${img.src}")`;
  setSrcWithRetry(img, url);
}

const map = L.map("map", {
  center: [-34.57644572703189, -58.47911533206378],
  zoom: 15,
  attributionControl: false
});

L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
  maxNativeZoom: 16,
  maxZoom: 19,
  tileSize: 256,
  attribution: "Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors"
}).addTo(map);

fetch("data.json")
  .then(response => response.json())
  .then(data => {
    data.forEach(entry => {
      const firstImage = entry.images[0];

      const divIconMarkerContent = document.createElement("div");
      divIconMarkerContent.className = "marker-content";
      setBackgroundWithRetry(divIconMarkerContent, firstImage.url.split('&sz=')[0] + '&sz=w100');
      divIconMarkerContent.style.backgroundPosition = `center ${firstImage.thumbnailOffset}px`;

      const divIcon = L.divIcon({
        className: "custom-div-marker",
        html: divIconMarkerContent,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker([entry.latitude, entry.longitude], { icon: divIcon }).addTo(map);

      marker.on("click", () => {
        showEntry(entry);
      });
    });
  });

function showEntry(entry) {
  currentEntry = entry;
  currentImageIndex = 0;
  currentOverlay = true;
  showImage(currentEntry, currentImageIndex);

  const info = document.getElementById("info");
  info.innerHTML = `<strong>Lat:</strong> ${entry.latitude.toFixed(6)}<br><strong>Lon:</strong> ${entry.longitude.toFixed(6)}<br><br>${entry.description}<br><br><hr><br>`;

  const overlay = document.getElementById("overlay");
  overlay.style.display = "flex";
}

function showImage(entry, index) {
  const image = entry.images[index];

  const date = new Date(image.epoch * 1000)
  let dateStr;
  if (image.src === "Google Street View") {
    dateStr = date.toLocaleString("es-AR", {
      hour12: false,
      year: "numeric",
      month: "2-digit"
    });
  } else {
    dateStr = date.toLocaleString("es-AR", {
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).split(", ").join(" - ");
  }

  document.getElementById("imageIndexInfo").innerHTML = `Imagen ${index + 1}/${entry.images.length}`;
  setSrcWithRetry(document.getElementById("imageImg"), image.url);
  const src = image.srcUrl ? `<a href="${image.srcUrl}" target="_blank">${image.src}</a>` : image.src;
  document.getElementById("imageText").innerHTML = `<strong>Fecha:</strong> ${dateStr}<br><strong>Fuente:</strong> ${src}`;
}

function closeOverlay() {
  document.getElementById("overlay").style.display = "none";
  document.getElementById("imageImg").src = "";
  currentOverlay = false;
}
document.getElementById("closeButton").setAttribute("onclick", "closeOverlay()");

function nextImage(step=1) {
  previousImageIndex = currentImageIndex;
  currentImageIndex = Math.min(Math.max(0, currentImageIndex + step), currentEntry.images.length - 1);
  if (previousImageIndex != currentImageIndex) {
    document.getElementById("imageImg").src = "";
    showImage(currentEntry, currentImageIndex);
  }
}
document.getElementById("previousImageButton").setAttribute("onclick", "nextImage(-1)");
document.getElementById("nextImageButton").setAttribute("onclick", "nextImage()");
document.getElementById("imageImg").setAttribute("onclick", "nextImage()");

document.addEventListener("keydown", (e) => {
  switch (e.code) {
    case "Escape":
      closeOverlay();
      break;
    case "ArrowLeft":
      nextImage(-1);
      break;
    case "ArrowRight":
      nextImage();
      break;
  }
});
