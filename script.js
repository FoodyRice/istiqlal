// ====== CONFIG ======
const CSV_FILE = "Istiqlal Prayer Time Draft.csv";

// Convert 12hr time string to minutes
function timeToMinutes(t) {
  if (!t) return null;
  const [time, modifier] = t.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (modifier === "PM" && h !== 12) h += 12;
  if (modifier === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

// Format time like 6:05 PM
function formatTime(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  });
}

// ===== Read CSV =====
async function loadCSV() {
  const res = await fetch(CSV_FILE);
  const text = await res.text();
  const rows = text.trim().split("\n").map(r => r.split(","));
  const headers = rows[0];

  return rows.slice(1).map(r => {
    let obj = {};
    headers.forEach((h, i) => obj[h.trim()] = r[i].trim());
    return obj;
  });
}

// ===== Find today's row =====
function findTodayRow(data) {
  const today = new Date().toISOString().split("T")[0];
  return data.find(r => r.Date === today);
}

// ===== Apply times to UI =====
function updateUI(row) {
  document.getElementById("fajr-iqama").textContent = row["Fajr Iqama"];
  document.getElementById("fajr-athan").textContent = "Athan at " + row["Fajr"];

  document.getElementById("dhuhr-iqama").textContent = row["Dhuhr Iqama"];
  document.getElementById("dhuhr-athan").textContent = "Athan at " + row["Dhuhr"];

  document.getElementById("asr-iqama").textContent = row["Asr Iqama"];
  document.getElementById("asr-athan").textContent = "Athan at " + row["Asr"];

  document.getElementById("maghrib-iqama").textContent = row["Maghrib Iqama"];
  document.getElementById("maghrib-athan").textContent = "Athan at " + row["Maghrib"];

  document.getElementById("isha-iqama").textContent = row["Isha Iqama"];
  document.getElementById("isha-athan").textContent = "Athan at " + row["Isha"];

  document.getElementById("sunrise-time").textContent = row["Sunrise"];
  document.getElementById("jummah-time").textContent = row["Jummah"];
}

// ===== Determine current & next prayer =====
function getPrayerOrder(row) {
  return [
    ["Fajr", row["Fajr"], row["Fajr Iqama"]],
    ["Dhuhr", row["Dhuhr"], row["Dhuhr Iqama"]],
    ["Asr", row["Asr"], row["Asr Iqama"]],
    ["Maghrib", row["Maghrib"], row["Maghrib Iqama"]],
    ["Isha", row["Isha"], row["Isha Iqama"]],
  ];
}

function highlightCurrentPrayer(prayers) {
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();

  let active = null;

  prayers.forEach(([name, athan, iqama]) => {
    const ath = timeToMinutes(athan);
    const iq = timeToMinutes(iqama);
    const card = document.getElementById(`${name.toLowerCase()}-card`);
    card.classList.remove("active");

    // highlight between Athan → Iqama
    if (ath && iq && nowMin >= ath && nowMin < iq) {
      card.classList.add("active");
      active = name;
    }
  });

  return active;
}

function computeNextPrayer(prayers) {
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();

  for (let [name, athan] of prayers) {
    const ath = timeToMinutes(athan);
    if (ath > nowMin) return name;
  }
  return "Fajr (Tomorrow)";
}

// ===== Hijri Date (changes at Maghrib) =====
function updateHijriDate(row) {
  const Maghrib = timeToMinutes(row["Maghrib"]);
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();

  let date = new Date();

  // After Maghrib → Islamic next day
  if (nowMin >= Maghrib) {
    date.setDate(date.getDate() + 1);
  }

  const hijri = date.toLocaleDateString("en-US-u-ca-islamic", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  document.getElementById("hijri-date").textContent = hijri;
}

// ===== CLOCK =====
function startClock() {
  setInterval(() => {
    document.getElementById("clock").textContent = formatTime(new Date());
  }, 1000);
}

// ===== MAIN =====
async function main() {
  const data = await loadCSV();
  const row = findTodayRow(data);

  if (!row) {
    document.getElementById("next-prayer").textContent = "No data for today.";
    return;
  }

  updateUI(row);

  const prayers = getPrayerOrder(row);
  const active = highlightCurrentPrayer(prayers);

  const next = computeNextPrayer(prayers);
  document.getElementById("next-prayer").textContent = `Next Prayer: ${next}`;

  updateHijriDate(row);

  
}

startClock();
main();
setInterval(main, 60000); // refresh every minute


document.getElementById("gregorian-date").textContent =
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

