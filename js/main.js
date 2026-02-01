import { fetchVehicles } from "./db.js";
import { renderVehicles, bindUIEvents, setVehiclesCache } from "./logic.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const vehicles = await fetchVehicles();

    // ✅ ini yang bikin dropdown "Kendaraan/Layanan" terisi
    setVehiclesCache(vehicles);

    renderVehicles(vehicles);

    // (opsional) siapkan tombol retry kalau kamu pakai banner error
    bindUIEvents({
      onRetry: async () => location.reload()
    });
  } catch (err) {
    console.error(err);
    alert("Gagal memuat data kendaraan. Cek URL Apps Script & izin akses Web App.");
  }
});
