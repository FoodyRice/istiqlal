// ===== CONFIG =====
const CSV_FILE = "Istiqlal Prayer Time Draft.csv";

// Convert "6:30" → minutes past midnight
function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Display HH:MM:SS
function formatTime(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  });
}

// ===== LOAD CSV =====
async function loadCSV() {
  const res = await fetch(CSV_FILE);
  const text = await res.text();
  const rows = text.trim().split("\n").map(r => r.split(","));

  // Remove top two rows (Excel headers)
  const dataRows = rows.slice(2);

  return dataRows.map(cols => ({
    Date: cols[0],
    Day: cols[1],
    Fajr: cols[2],
    FajrIqama: cols[3],
    Sunrise: cols[4],
    Dhuhr: cols[5],
    DhuhrIqama: cols[6],
    Jummah: cols[7],
    Asr: cols[8],
    AsrIqama: cols[9],
    Maghrib: cols[10],
    MaghribIqama: cols[11],
    Isha: cols[12],
    IshaIqama: cols[13]
  }));
}

// ===== FIND TODAY ROW =====
function findTodayRow(data) {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const today = `${day}-${month}-${year}`;
  return data.find(r => r.Date === today);
}

// ===== FIND NEXT FRIDAY ROW (for Jummah) =====
function getNextFriday(data) {
  return data.find(r => r.Day === "Friday");
}

// ===== UPDATE UI =====
function updateUI(row, friday) {
  document.getElementById("fajr-iqama").textContent = row.FajrIqama;
  document.getElementById("fajr-athan").textContent = "Athan at " + row.Fajr;

  document.getElementById("dhuhr-iqama").textContent = row.DhuhrIqama;
  document.getElementById("dhuhr-athan").textContent = "Athan at " + row.Dhuhr;

  document.getElementById("asr-iqama").textContent = row.AsrIqama;
  document.getElementById("asr-athan").textContent = "Athan at " + row.Asr;

  document.getElementById("maghrib-iqama").textContent = row.MaghribIqama;
  document.getElementById("maghrib-athan").textContent = "Athan at " + row.Maghrib;

  document.getElementById("isha-iqama").textContent = row.IshaIqama;
  document.getElementById("isha-athan").textContent = "Athan at " + row.Isha;

  document.getElementById("sunrise-time").textContent = row.Sunrise;

  // Jummah always shows next Friday's time
  document.getElementById("jummah-time").textContent = friday.Jummah;
}

// ===== PRAYER ORDER =====
function prayerList(row, friday) {
  return [
    ["Fajr", row.Fajr, row.FajrIqama],
    ["Dhuhr", row.Dhuhr, row.DhuhrIqama],
    ["Asr", row.Asr, row.AsrIqama],
    ["Maghrib", row.Maghrib, row.MaghribIqama],
    ["Isha", row.Isha, row.IshaIqama],
    ["Jummah", friday.Jummah, row.Asr] // highlight window ends at Asr athan
  ];
}

// ===== HIGHLIGHT CURRENT PRAYER =====
function highlightCurrentPrayer(row, friday) {
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();

  const prayers = prayerList(row, friday);

  prayers.forEach(([name, athan, iqama]) => {
    const card = document.getElementById(name.toLowerCase() + "-card");
    card.classList.remove("active");
  });

  prayers.forEach(([name, athan, iqama]) => {
    let ath = timeToMinutes(athan);
    let iq = timeToMinutes(iqama);

    const card = document.getElementById(name.toLowerCase() + "-card");
    if (!card) return;

    // Jummah only highlights on Fridays
    const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

    if (name === "Jummah" && todayName !== "Friday") return;

    if (ath && iq && nowMin >= ath && nowMin < iq) {
      card.classList.add("active");
    }
  });
}

// ===== NEXT PRAYER COUNTDOWN =====
function updateNextPrayerCountdown(row, friday) {
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const list = prayerList(row, friday);

  for (let [name, athan] of list) {
    const ath = timeToMinutes(athan);
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

// ===== HIJRI DATE =====
function updateHijri(row) {
  const mag = timeToMinutes(row.Maghrib);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  if (nowMin >= mag) now.setDate(now.getDate() + 1);

  document.getElementById("hijri-date").textContent =
    now.toLocaleDateString("en-US-u-ca-islamic", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
}

// ===== CLOCK =====
setInterval(() => {
  document.getElementById("clock").textContent = formatTime(new Date());
}, 1000);

// ===== MAIN =====
async function main() {
  const data = await loadCSV();
  const today = findTodayRow(data);
  const friday = getNextFriday(data);

  updateUI(today, friday);
  updateHijri(today);
  highlightCurrentPrayer(today, friday);
  updateNextPrayerCountdown(today, friday);
}

main();
setInterval(main, 60000);
document.getElementById("gregorian-date").textContent =
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
