// js/logic.js
import { ADMIN_WA, SLIDES } from "./config.js";

const $ = (id) => document.getElementById(id);

let VEHICLES_CACHE = [];

export function setVehiclesCache(list) {
  VEHICLES_CACHE = Array.isArray(list) ? list : [];
  window.__cache = VEHICLES_CACHE;
}

function rupiah(n) {
  return Number(n || 0).toLocaleString("id-ID");
}

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function driveThumbFromId(fileId, w = 1600) {
  const id = String(fileId || "").trim();
  if (!id) return "";
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w${w}`;
}

function driveViewFromId(fileId) {
  const id = String(fileId || "").trim();
  if (!id) return "";
  return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`;
}

/**
 * DARK THEME:
 * - ganti background dari slate-200/100 -> slate-900/950
 * - ganti text dari slate-700/600 -> slate-200/300
 */
function fallbackSvg(text = "Foto tidak tersedia") {
  const t = encodeURIComponent(text);
  return `data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22500%22><rect width=%22100%25%22 height=%22100%25%22 fill=%22%230f172a%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23e2e8f0%22 font-family=%22Arial%22 font-size=%2224%22>${t}</text></svg>`;
}

function openWA(message) {
  const url = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

function getTopikValue() {
  const sel = $("topikSelect");
  const inp = $("topik");
  if (sel && !sel.classList.contains("hidden")) return sel.value || "(belum dipilih)";
  return inp?.value || "(belum diisi)";
}

function buildMessage() {
  const topik = getTopikValue();
  const durasi = $("durasi")?.value || "-";
  const unit = $("unit")?.value || "-";
  const tglAmbil = $("tglAmbil")?.value || "-";
  const jamAmbil = $("jamAmbil")?.value || "-";
  const tglKembali = $("tglKembali")?.value || "-";
  const jamKembali = $("jamKembali")?.value || "-";
  const nama = $("nama")?.value || "-";
  const wa = $("wa")?.value || "-";
  const catatan = $("catatan")?.value || "-";

  return (
`*Halo Admin JajunTransport, saya mau booking*

• Kendaraan/Layanan: ${topik}
• Durasi: ${durasi}
• Jumlah unit: ${unit}

Pengambilan:
• Tanggal: ${tglAmbil}
• Jam: ${jamAmbil}

Pengembalian:
• Tanggal: ${tglKembali}
• Jam: ${jamKembali}

Data pemesan:
• Nama: ${nama}
• WA: ${wa}

Catatan:
${catatan}

Mohon info ketersediaan & total biaya. Terima kasih 🙏`
  );
}

/* ---------- Dropdown Kendaraan Tersedia ---------- */
function fillDropdownAvailable() {
  const sel = $("topikSelect");
  if (!sel) return;

  const availableVehicles = VEHICLES_CACHE.filter(v => {
    const av = (typeof v.available === "boolean")
      ? v.available
      : String(v.available).toLowerCase() === "true";
    return av;
  });

  sel.innerHTML =
    `<option value="">Pilih kendaraan yang tersedia…</option>` +
    availableVehicles.map(v => {
      const harga = Number(v.harga || 0);
      const typeLabel = String(v.kategori || "motor").toLowerCase() === "mobil" ? "Mobil" : "Motor";
      const label = `${typeLabel} • ${v.nama} — Rp ${rupiah(harga)}/hari`;
      return `<option value="${esc(`Sewa ${typeLabel} ${v.nama}`)}" data-price="${harga}">${esc(label)}</option>`;
    }).join("");
}

/* ---------- Booking Modal Mode ---------- */
function setBookingMode(mode, preset = {}) {
  const sel = $("topikSelect");
  const inp = $("topik");
  const hint = $("topikHint");

  if (hint) hint.classList.add("hidden");

  if (mode === "general") {
    fillDropdownAvailable();
    sel?.classList.remove("hidden");
    inp?.classList.add("hidden");

    if (hint) {
      hint.textContent = "Dropdown hanya menampilkan kendaraan yang statusnya Tersedia.";
      hint.classList.remove("hidden");
    }

    if (sel) sel.value = "";
    if ($("harga")) $("harga").value = "";
  } else {
    sel?.classList.add("hidden");
    inp?.classList.remove("hidden");

    if (hint) {
      hint.textContent = "Kendaraan dipilih dari card, tidak bisa diubah di form.";
      hint.classList.remove("hidden");
    }

    if (preset.topik) inp.value = preset.topik;
    if (preset.price != null && $("harga")) $("harga").value = `Rp ${rupiah(preset.price)}`;
  }
}

function openModal(mode = "general", preset = {}) {
  $("modal")?.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  setBookingMode(mode, preset);

  if (preset.pickDate) $("tglAmbil").value = preset.pickDate;
  if (preset.pickTime) $("jamAmbil").value = preset.pickTime;
  if (preset.returnDate) $("tglKembali").value = preset.returnDate;
  if (preset.returnTime) $("jamKembali").value = preset.returnTime;
}

function closeModal() {
  $("modal")?.classList.add("hidden");
  document.body.style.overflow = "";
}

function showToast(text) {
  $("toastText").textContent = text;
  $("toast").classList.remove("hidden");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => $("toast").classList.add("hidden"), 4500);
}

/* ---------- Detail Modal (FULL) ---------- */
let lastDetailPreset = null;

function openDetailByVehicle(v, preset) {
  lastDetailPreset = preset || null;

  if (!v) {
    // fallback kalau data tidak ketemu
    $("detailTitle").textContent = "Detail Kendaraan";
    $("detailSub").textContent = "";
    $("detailNama").textContent = "-";
    $("detailKategori").textContent = "-";
    $("detailHarga").textContent = "-";
    $("detailAvail").textContent = "-";
    $("detailDeskripsi").textContent = "-";
    $("detailText").textContent = "-";

    const imgEl = $("detailImg");
    if (imgEl) imgEl.src = fallbackSvg("Data tidak ditemukan");

    const openOriginal = $("detailOpenOriginal");
    if (openOriginal) {
      openOriginal.href = "#";
      openOriginal.classList.add("pointer-events-none", "opacity-50");
    }

    $("detailModal")?.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    return;
  }

  // title/sub
  $("detailTitle").textContent = v?.nama ? `Detail • ${v.nama}` : "Detail Kendaraan";
  $("detailSub").textContent = (String(v?.kategori || "").toLowerCase() === "mobil")
    ? "Kategori: Mobil"
    : "Kategori: Motor";

  // info
  const kategori = String(v?.kategori || "motor").toLowerCase();
  const typeLabel = kategori === "mobil" ? "Mobil" : "Motor";

  const harga = Number(v?.harga || 0);
  const available = (typeof v?.available === "boolean")
    ? v.available
    : String(v?.available).toLowerCase() === "true";

  $("detailNama").textContent = v?.nama || "-";
  $("detailKategori").textContent = typeLabel;
  $("detailHarga").textContent = `Rp ${rupiah(harga)} / hari`;
  $("detailAvail").textContent = available ? "Tersedia" : "Habis";
  $("detailDeskripsi").textContent = v?.deskripsi || "-";
  $("detailText").textContent = v?.detail || "-";

  // image (contain + open original)
  const fid = v?.drive_file_id || "";
  const thumb = driveThumbFromId(fid, 2000);
  const viewUrl = driveViewFromId(fid);

  const imgEl = $("detailImg");
  const openOriginal = $("detailOpenOriginal");

  if (openOriginal) {
    openOriginal.href = viewUrl || "#";
    openOriginal.classList.toggle("pointer-events-none", !viewUrl);
    openOriginal.classList.toggle("opacity-50", !viewUrl);
  }

  if (imgEl) {
    imgEl.onerror = null;
    imgEl.src = thumb || fallbackSvg("Foto tidak tersedia");
    imgEl.onerror = () => {
      imgEl.onerror = null;
      imgEl.src = fallbackSvg("Foto gagal dimuat");
    };
  }

  $("detailModal")?.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeDetail() {
  $("detailModal")?.classList.add("hidden");
  document.body.style.overflow = "";
}

/* ---------- Render Vehicles ---------- */
export function renderVehicles(vehicles) {
  window.__vehicles = vehicles;
  console.log("renderVehicles sample:", vehicles?.[0]);

  const grid = $("vehicleGrid");
  if (!grid) return;

  grid.innerHTML = "";

  (vehicles || []).forEach((v, idx) => {
    const kategori = String(v.kategori || "motor").toLowerCase();
    const typeLabel = kategori === "mobil" ? "Mobil" : "Motor";

    const harga = Number(v.harga || 0);
    const available = (typeof v.available === "boolean")
      ? v.available
      : String(v.available).toLowerCase() === "true";

    const nama = v.nama || "-";
    const fid = v.drive_file_id || "";
    const img = driveThumbFromId(fid, 1600);
    const deskripsi = v.deskripsi || "";
    const detail = v.detail || "-";

    const card = document.createElement("div");
    // DARK: bg/border jadi gelap
    card.className = "vehicleCard rounded-3xl bg-slate-900/60 border border-slate-800 shadow-lg overflow-hidden flex flex-col";
    card.setAttribute("data-category", kategori);
    card.setAttribute("data-available", available ? "true" : "false");
    card.setAttribute("data-price", String(harga));
    card.setAttribute("data-idx", String(idx)); // ✅ penting untuk detail

    card.innerHTML = `
      <div class="w-full h-52 sm:h-56 bg-slate-950 overflow-hidden">
        <img class="vehicleImg w-full h-full object-cover" alt="${esc(nama)}" loading="lazy" referrerpolicy="no-referrer" />
      </div>

      <div class="p-5 flex-1 flex flex-col">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="font-semibold text-lg leading-snug text-slate-100">${esc(nama)}</div>
            <div class="mt-1 text-sm text-slate-300">Rp <span class="priceText">${rupiah(harga)}</span> / hari</div>
          </div>
          <div class="flex flex-col items-end gap-2">
            <span class="typeBadge text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">${typeLabel}</span>
            <span class="availBadge text-xs px-2 py-1 rounded-full ${available ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" : "bg-rose-500/10 text-rose-300 border border-rose-500/20"}">
              ${available ? "Tersedia" : "Habis"}
            </span>
          </div>
        </div>

        <p class="mt-2 text-sm text-slate-300 line-clamp-2">${esc(deskripsi)}</p>

        <div class="mt-4 flex gap-2">
          <button class="btnPesan flex-1 px-4 py-2 rounded-xl ${available ? "bg-emerald-400 text-slate-950 hover:bg-emerald-300" : "bg-slate-700 text-slate-200 cursor-not-allowed"} text-sm"
            ${available ? "" : "disabled"}
            data-item="${esc(`Sewa ${typeLabel} ${nama}`)}"
            data-price="${harga}">
            ${available ? "Pesan" : "Habis"}
          </button>

          <!-- ✅ Detail pakai idx (bukan data-detail) -->
          <button class="btnDetail px-4 py-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-100 text-sm"
            data-idx="${idx}">
            Detail
          </button>
        </div>
      </div>
    `;

    const imgEl = card.querySelector(".vehicleImg");
    if (imgEl) {
      imgEl.src = img ? img : fallbackSvg("Foto tidak tersedia");
      imgEl.onerror = () => {
        imgEl.onerror = null;
        imgEl.src = fallbackSvg("Foto gagal dimuat");
      };
    }

    grid.appendChild(card);
  });
}

/* ---------- Filter ---------- */
function bindFilter() {
  const filterBtns = Array.from(document.querySelectorAll(".filterBtn"));

  function setActiveFilterBtn(active) {
    filterBtns.forEach(b => {
      const isActive = b.getAttribute("data-filter") === active;
      b.className = isActive
        ? "filterBtn px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 hover:bg-emerald-300 text-sm"
        : "filterBtn px-4 py-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-100 text-sm";
    });
  }

  function applyFilter(filter) {
    const currentCards = Array.from(document.querySelectorAll(".vehicleCard"));
    currentCards.forEach(card => {
      const cat = card.getAttribute("data-category");
      const show = (filter === "all") || (cat === filter);
      card.classList.toggle("hidden", !show);
    });
    setActiveFilterBtn(filter);
  }

  filterBtns.forEach(btn => btn.addEventListener("click", () => {
    applyFilter(btn.getAttribute("data-filter"));
  }));

  applyFilter("all");
}

/* ---------- Slider ---------- */
function initSlider() {
  const slideImg = $("slideImg");
  const slideLabel = $("slideLabel");
  const nextBtn = $("nextSlide");
  const prevBtn = $("prevSlide");
  const dotsWrap = $("slideDots");

  if (!slideImg || !slideLabel || !nextBtn || !prevBtn || !dotsWrap) return;
  if (!Array.isArray(SLIDES) || SLIDES.length === 0) return;

  // DARK: fallback SVG untuk slider juga gelap
  function localFallbackSvg(text = "Foto gagal dimuat") {
    const t = encodeURIComponent(text);
    return `data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22500%22><rect width=%22100%25%22 height=%22100%25%22 fill=%22%230f172a%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23e2e8f0%22 font-family=%22Arial%22 font-size=%2224%22>${t}</text></svg>`;
  }

  function extractDriveId(url) {
    const s = String(url || "").trim();
    if (!s) return "";
    const m1 = s.match(/[?&]id=([^&]+)/);
    if (m1?.[1]) return m1[1];
    const m2 = s.match(/\/file\/d\/([^/]+)/);
    if (m2?.[1]) return m2[1];
    const m3 = s.match(/\/d\/([^/?]+)/);
    if (m3?.[1]) return m3[1];
    return "";
  }

  function normalizeImgSrc(src) {
    const id = extractDriveId(src);
    if (id) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1600`;
    return src;
  }

  let slideIndex = 0;
  let autoTimer = null;

  function renderDots() {
    dotsWrap.innerHTML = "";
    SLIDES.forEach((_, idx) => {
      const d = document.createElement("button");
      d.type = "button";
      d.className =
        "dot h-2.5 w-2.5 rounded-full ring-1 ring-white/10 transition " +
        (idx === slideIndex ? "bg-emerald-300" : "bg-white/35 hover:bg-white/55");
      d.dataset.index = String(idx);
      d.addEventListener("click", () => {
        renderSlide(idx);
        restartAuto();
      });
      dotsWrap.appendChild(d);
    });
  }

  function renderSlide(i) {
    slideIndex = (i + SLIDES.length) % SLIDES.length;
    const s = SLIDES[slideIndex];

    slideLabel.textContent = s.label || "";

    const finalSrc = normalizeImgSrc(s.src);
    slideImg.onerror = null;
    slideImg.src = finalSrc;

    slideImg.onerror = () => {
      slideImg.onerror = null;
      slideImg.src = localFallbackSvg("Foto gagal dimuat / tidak public");
    };

    renderDots();
  }

  function next() { renderSlide(slideIndex + 1); }
  function prev() { renderSlide(slideIndex - 1); }

  function startAuto() { autoTimer = setInterval(next, 3500); }
  function restartAuto() {
    if (autoTimer) clearInterval(autoTimer);
    startAuto();
  }

  nextBtn.addEventListener("click", () => { next(); restartAuto(); });
  prevBtn.addEventListener("click", () => { prev(); restartAuto(); });

  renderSlide(0);
  startAuto();
}

/* ---------- Bind all UI events ---------- */
export function bindUIEvents({ onRetry } = {}) {
  $("btnRetry")?.addEventListener("click", () => onRetry?.());
  $("btnCloseError")?.addEventListener("click", () => $("errorBanner")?.classList.add("hidden"));

  $("btnMobile")?.addEventListener("click", () => $("mobileMenu")?.classList.toggle("hidden"));

  ["btnOpenBooking","btnOpenBooking2","btnOpenBooking3","btnOpenBooking4","btnOpenBookingHero"]
    .map(id => $(id)).filter(Boolean)
    .forEach(btn => btn.addEventListener("click", () => openModal("general")));

  $("btnScrollKendaraan")?.addEventListener("click", () => {
    document.querySelector("#kendaraan")?.scrollIntoView({ behavior: "smooth" });
  });

  ["btnChatAdmin","btnChatAdmin2","fabWA"].map(id => $(id)).filter(Boolean).forEach(btn => {
    btn.addEventListener("click", () => openWA("Halo Admin JajunTransport, saya mau tanya harga & ketersediaan unit."));
  });

  document.addEventListener("click", (e) => {
    const pesanBtn = e.target.closest?.(".btnPesan");
    if (pesanBtn) {
      if (pesanBtn.disabled) return;
      const item = pesanBtn.getAttribute("data-item") || "Pemesanan";
      const price = pesanBtn.getAttribute("data-price") || "";
      openModal("card", { topik: item, price });
      return;
    }

    const detailBtn = e.target.closest?.(".btnDetail");
    if (detailBtn) {
      const idx = Number(detailBtn.getAttribute("data-idx"));
      const v = VEHICLES_CACHE[idx];

      const card = detailBtn.closest(".vehicleCard");
      const itemBtn = card ? card.querySelector(".btnPesan:not([disabled])") : null;

      const preset = itemBtn ? {
        topik: itemBtn.getAttribute("data-item") || "Pemesanan",
        price: itemBtn.getAttribute("data-price") || ""
      } : null;

      openDetailByVehicle(v, preset);
      return;
    }
  });

  $("topikSelect")?.addEventListener("change", (e) => {
    const opt = e.target.selectedOptions?.[0];
    const price = opt?.getAttribute("data-price");
    if ($("harga")) $("harga").value = price ? `Rp ${rupiah(price)}` : "";
  });

  bindFilter();

  $("btnCloseDetail")?.addEventListener("click", closeDetail);
  $("btnCloseDetail2")?.addEventListener("click", closeDetail);
  $("detailModal")?.addEventListener("click", (e) => {
    if (e.target === $("detailModal") || e.target.classList.contains("bg-black/50")) closeDetail();
  });
  $("btnPesanFromDetail")?.addEventListener("click", () => {
    closeDetail();
    if (lastDetailPreset?.topik) openModal("card", lastDetailPreset);
    else openModal("general");
  });

  $("btnClose")?.addEventListener("click", closeModal);
  $("modal")?.addEventListener("click", (e) => {
    if (e.target === $("modal") || e.target.classList.contains("bg-black/50")) closeModal();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeModal(); closeDetail(); }
  });

  $("btnPreview")?.addEventListener("click", () => showToast(buildMessage()));
  $("bookingForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = buildMessage();
    closeModal();
    openWA(msg);
  });

  $("year").textContent = new Date().getFullYear();

  initSlider();
}
