// =========================
// CONFIG
// =========================
const CSV_FILE = "prayer_times.csv"; // rename recommended


// Convert "6:14" → minutes
function timeToMinutes(t) {
  if (!t || !t.includes(":")) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}


// Format HH:MM:SS
function formatTime(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}


// =========================
// LOAD CSV
// =========================
async function loadCSV() {
  const res = await fetch(CSV_FILE);
  const text = await res.text();
  const rows = text.trim().split("\n").map(r => r.split(","));

  const dataRows = rows.slice(2); // remove Excel headers

  return dataRows.map(cols => ({
    Date: cols[0],
    Day: cols[1],
    FajrA: cols[2],
    FajrI: cols[3],
    Sunrise: cols[4],
    DhuhrA: cols[5],
    DhuhrI: cols[6],
    Jummah: cols[7],
    AsrA: cols[8],
    AsrI: cols[9],
    MaghribA: cols[10],
    MaghribI: cols[11],
    IshaA: cols[12],
    IshaI: cols[13]
  }));
}


// =========================
// FIND TODAY ROW
// =========================
function findTodayRow(data) {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const today = `${day}-${month}-${year}`;
  return data.find(r => r.Date === today);
}


// =========================
// GET NEXT FRIDAY (JUMMAH)
// =========================
function getFridayRow(data) {
  return data.find(r => r.Day === "Friday");
}


// =========================
// UPDATE UI
// =========================
function updateUI(today, friday) {
  document.getElementById("fajr-iqama").textContent = today.FajrI;
  document.getElementById("fajr-athan").textContent = "Athan at " + today.FajrA;

  document.getElementById("dhuhr-iqama").textContent = today.DhuhrI;
  document.getElementById("dhuhr-athan").textContent = "Athan at " + today.DhuhrA;

  document.getElementById("asr-iqama").textContent = today.AsrI;
  document.getElementById("asr-athan").textContent = "Athan at " + today.AsrA;

  document.getElementById("maghrib-iqama").textContent = today.MaghribI;
  document.getElementById("maghrib-athan").textContent = "Athan at " + today.MaghribA;

  document.getElementById("isha-iqama").textContent = today.IshaI;
  document.getElementById("isha-athan").textContent = "Athan at " + today.IshaA;

  document.getElementById("sunrise-time").textContent = today.Sunrise;

  // Jummah always uses Friday's time
  document.getElementById("jummah-time").textContent = friday.Jummah;
}


// =========================
// NEW HIGHLIGHT LOGIC
// =========================
function highlightPrayers(today, friday) {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  // Remove all highlights
  document.querySelectorAll(".card").forEach(c => c.classList.remove("active"));


  const todayName = now.toLocaleDateString("en-US", { weekday: "long" });

  let windows = [

    // Fajr → Sunrise
    ["fajr-card", timeToMinutes(today.FajrA), timeToMinutes(today.Sunrise)],

    // Dhuhr → Asr
    ["dhuhr-card", timeToMinutes(today.DhuhrA), timeToMinutes(today.AsrA)],

    // Asr → Maghrib
    ["asr-card", timeToMinutes(today.AsrA), timeToMinutes(today.MaghribA)],

    // Maghrib → Isha
    ["maghrib-card", timeToMinutes(today.MaghribA), timeToMinutes(today.IshaA)],

    // Isha → Fajr (next day) — we skip highlighting here
  ];


  // Friday Jummah highlight rule
  if (todayName === "Friday") {
    windows.push([
      "jummah-card",
      timeToMinutes(friday.Jummah),
      timeToMinutes(today.AsrA),
    ]);
  }


  // Apply highlight
  for (let [id, start, end] of windows) {
    if (start && end && nowMin >= start && nowMin < end) {
      document.getElementById(id).classList.add("active");
    }
  }
}


// =========================
// NEXT PRAYER COUNTDOWN
// =========================
function updateCountdown(today, friday) {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const todayName = now.toLocaleDateString("en-US", { weekday: "long" });

  let list = [
    ["Fajr", timeToMinutes(today.FajrA)],
    ["Dhuhr", timeToMinutes(today.DhuhrA)],
    ["Asr", timeToMinutes(today.AsrA)],
    ["Maghrib", timeToMinutes(today.MaghribA)],
    ["Isha", timeToMinutes(today.IshaA)]
  ];

  // Add Jummah if Friday
  if (todayName === "Friday") {
    list.push(["Jummah", timeToMinutes(friday.Jummah)]);
  }

  for (let [name, ath] of list) {
    if (ath > nowMin) {
      const diff = ath - nowMin;
      const h = Math.floor(diff / 60);
      const m = diff % 60;

      document.getElementById("next-prayer").textContent =
        `Next: ${name} in ${h}h ${m}m`;
      return;
    }
  }

  document.getElementById("next-prayer").textContent = "Next: Fajr (Tomorrow)";
}


// =========================
// HIJRI DATE (after Maghrib)
// =========================
function updateHijri(today) {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const mag = timeToMinutes(today.MaghribA);
  if (nowMin >= mag) now.setDate(now.getDate() + 1);

  document.getElementById("hijri-date").textContent =
    now.toLocaleDateString("en-US-u-ca-islamic", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
}


// =========================
// MAIN LOOP
// =========================
async function main() {
  const data = await loadCSV();
  const today = findTodayRow(data);
  const friday = getFridayRow(data);

  updateUI(today, friday);
  highlightPrayers(today, friday);
  updateCountdown(today, friday);
  updateHijri(today);
}


main();
setInterval(main, 60 * 1000); // update every minute


// CLOCK
setInterval(() => {
  document.getElementById("clock").textContent = formatTime(new Date());
}, 1000);


// GREGORIAN DATE
document.getElementById("gregorian-date").textContent =
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
