// js/db.js
import { SHEET_API_URL } from "./config.js";

export async function fetchVehicles() {
  const res = await fetch(SHEET_API_URL, { cache: "no-store" });
  const json = await res.json();

  if (!json.ok) {
    throw new Error(json.error || "Gagal mengambil data kendaraan dari Sheets");
  }
  return Array.isArray(json.data) ? json.data : [];
}
