const watchHistory = [
  { title: "The Crown", type: "Serial", platform: "Netflix", genre: "Dramat", watchedAt: "2026-05-16T20:14:00", minutes: 52 },
  { title: "Fallout", type: "Serial", platform: "Prime Video", genre: "Sci-fi", watchedAt: "2026-05-14T21:03:00", minutes: 61 },
  { title: "Diuna: Część druga", type: "Film", platform: "Max", genre: "Sci-fi", watchedAt: "2026-05-12T19:30:00", minutes: 166 },
  { title: "Shogun", type: "Serial", platform: "Disney+", genre: "Historyczny", watchedAt: "2026-05-10T22:10:00", minutes: 58 },
  { title: "Halo", type: "Serial", platform: "SkyShowtime", genre: "Akcja", watchedAt: "2026-05-08T21:44:00", minutes: 49 },
  { title: "Planeta Singli", type: "Film", platform: "Canal+", genre: "Komedia", watchedAt: "2026-04-28T18:18:00", minutes: 136 },
  { title: "Severance", type: "Serial", platform: "Apple TV+", genre: "Thriller", watchedAt: "2026-04-20T20:00:00", minutes: 47 },
  { title: "The Last of Us", type: "Serial", platform: "Max", genre: "Dramat", watchedAt: "2026-04-13T21:20:00", minutes: 55 },
  { title: "Drive to Survive", type: "Dokument", platform: "Netflix", genre: "Sport", watchedAt: "2026-03-29T17:25:00", minutes: 42 },
  { title: "The Boys", type: "Serial", platform: "Prime Video", genre: "Akcja", watchedAt: "2026-03-18T22:35:00", minutes: 64 },
  { title: "Bluey", type: "Serial", platform: "Disney+", genre: "Animacja", watchedAt: "2026-02-22T09:15:00", minutes: 21 },
  { title: "Yellowstone", type: "Serial", platform: "SkyShowtime", genre: "Western", watchedAt: "2026-02-08T20:52:00", minutes: 50 },
  { title: "Ted Lasso", type: "Serial", platform: "Apple TV+", genre: "Komedia", watchedAt: "2026-01-29T19:42:00", minutes: 34 },
  { title: "Top Gear", type: "Program", platform: "Player", genre: "Motoryzacja", watchedAt: "2026-01-12T18:05:00", minutes: 44 },
  { title: "Liga Mistrzów", type: "Sport", platform: "Canal+", genre: "Sport", watchedAt: "2025-12-10T20:55:00", minutes: 112 },
];

const platforms = [
  { name: "Netflix", color: "#e50914", status: "MVP", method: "import eksportu danych konta" },
  { name: "Prime Video", color: "#00a8e1", status: "MVP", method: "import pliku lub rozszerzenie" },
  { name: "Max", color: "#2f4fff", status: "Badanie", method: "eksport danych / rozszerzenie" },
  { name: "Disney+", color: "#113ccf", status: "Badanie", method: "rozszerzenie lub import ręczny" },
  { name: "Canal+", color: "#111827", status: "Później", method: "rozszerzenie / CSV" },
  { name: "SkyShowtime", color: "#7c3aed", status: "Później", method: "rozszerzenie / CSV" },
  { name: "Apple TV+", color: "#3a3a3a", status: "Później", method: "eksport Apple Data & Privacy" },
  { name: "YouTube", color: "#ff0033", status: "Badanie", method: "Google Takeout" },
  { name: "Player", color: "#0e9384", status: "Później", method: "import ręczny" },
];

const dayNames = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"];
const platformColors = Object.fromEntries(platforms.map((platform) => [platform.name, platform.color]));
const state = {
  query: "",
  platform: "all",
  range: "all",
};

const formatHours = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours} h ${mins} min` : `${hours} h`;
};

const formatCompactTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (!hours) {
    return `${mins}m`;
  }

  return mins ? `${hours}h ${mins}m` : `${hours}h`;
};

const parseDate = (value) => new Date(value);

const filteredByRange = () => {
  if (state.range === "all") {
    return watchHistory;
  }

  const days = Number(state.range);
  const latest = Math.max(...watchHistory.map((item) => parseDate(item.watchedAt).getTime()));
  const cutoff = latest - days * 24 * 60 * 60 * 1000;
  return watchHistory.filter((item) => parseDate(item.watchedAt).getTime() >= cutoff);
};

const getHistoryResults = () => {
  const query = state.query.trim().toLowerCase();

  return filteredByRange()
    .filter((item) => state.platform === "all" || item.platform === state.platform)
    .filter((item) => {
      if (!query) {
        return true;
      }

      return [item.title, item.platform, item.genre, item.type]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .sort((a, b) => parseDate(b.watchedAt) - parseDate(a.watchedAt));
};

const renderMetrics = () => {
  const data = filteredByRange();
  const totalMinutes = data.reduce((sum, item) => sum + item.minutes, 0);
  const uniqueTitles = new Set(data.map((item) => item.title)).size;
  const dates = data.map((item) => parseDate(item.watchedAt)).sort((a, b) => a - b);
  const hours = data.reduce((acc, item) => {
    const hour = parseDate(item.watchedAt).getHours();
    const bucket = hour < 12 ? "rano" : hour < 18 ? "po południu" : hour < 22 ? "wieczorem" : "nocą";
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, {});
  const peakTime = Object.entries(hours).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

  document.querySelector("#totalHours").textContent = formatHours(totalMinutes);
  document.querySelector("#sessionCount").textContent = data.length.toString();
  document.querySelector("#peakTime").textContent = peakTime;
  document.querySelector("#uniqueTitles").textContent = uniqueTitles.toString();
  document.querySelector("#watchSpan").textContent = dates.length
    ? `${dates[0].toLocaleDateString("pl-PL")} - ${dates[dates.length - 1].toLocaleDateString("pl-PL")}`
    : "Brak danych";
};

const renderPlatformBars = () => {
  const totals = filteredByRange().reduce((acc, item) => {
    acc[item.platform] = (acc[item.platform] || 0) + item.minutes;
    return acc;
  }, {});
  const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...rows.map(([, minutes]) => minutes), 1);

  document.querySelector("#platformBars").innerHTML = rows
    .map(([platform, minutes]) => {
      const width = Math.max((minutes / max) * 100, 5);
      return `
        <div class="bar-row">
          <div class="bar-label">${platform}</div>
          <div class="bar-track" aria-hidden="true">
            <div class="bar-fill" style="--bar-color: ${platformColors[platform] || "#667085"}; width: ${width}%"></div>
          </div>
          <div class="bar-value">${formatHours(minutes)}</div>
        </div>
      `;
    })
    .join("");
};

const renderHeatmap = () => {
  const totals = filteredByRange().reduce((acc, item) => {
    const day = parseDate(item.watchedAt).getDay();
    acc[day] = (acc[day] || 0) + item.minutes;
    return acc;
  }, {});
  const max = Math.max(...Object.values(totals), 1);

  document.querySelector("#weekHeatmap").innerHTML = dayNames
    .map((name, index) => {
      const minutes = totals[index] || 0;
      const heat = Math.round((minutes / max) * 72);
      return `
        <div class="day-cell" style="--heat-color: #0e9384; --heat: ${heat}%">
          <strong>${name}</strong>
          <span>${minutes ? formatCompactTime(minutes) : "0m"}</span>
        </div>
      `;
    })
    .join("");
};

const renderFilters = () => {
  const filterRow = document.querySelector(".filter-row");
  const available = ["all", ...new Set(watchHistory.map((item) => item.platform))];

  filterRow.innerHTML = available
    .map((platform) => {
      const label = platform === "all" ? "Wszystkie" : platform;
      const active = state.platform === platform ? " active" : "";
      return `<button class="filter-chip${active}" data-platform="${platform}" type="button">${label}</button>`;
    })
    .join("");
};

const renderHistory = () => {
  const results = getHistoryResults();
  const list = document.querySelector("#historyList");

  if (!results.length) {
    list.innerHTML = `<div class="empty-state">Nie znaleziono pasujących wpisów w historii oglądania.</div>`;
    return;
  }

  list.innerHTML = results
    .map((item) => {
      const date = parseDate(item.watchedAt);
      return `
        <article class="history-item">
          <div class="title-stack">
            <strong>${item.title}</strong>
            <span>${item.type} • ${item.genre}</span>
          </div>
          <div class="platform-badge" style="--badge-bg: ${platformColors[item.platform] || "#667085"}">${item.platform}</div>
          <div class="history-meta">${date.toLocaleDateString("pl-PL")} ${date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}</div>
          <div class="history-meta">${formatHours(item.minutes)}</div>
        </article>
      `;
    })
    .join("");
};

const renderCoverage = () => {
  document.querySelector("#platformCoverage").innerHTML = platforms
    .map((platform) => {
      const statusClass = platform.status === "Badanie" ? "research" : platform.status === "Później" ? "later" : "";
      return `
        <div class="coverage-item">
          <div>
            <strong>${platform.name}</strong>
            <span>${platform.method}</span>
          </div>
          <span class="coverage-status ${statusClass}">${platform.status}</span>
        </div>
      `;
    })
    .join("");
};

const renderAll = () => {
  renderMetrics();
  renderPlatformBars();
  renderHeatmap();
  renderFilters();
  renderHistory();
  renderCoverage();
};

document.querySelector("#historySearch").addEventListener("input", (event) => {
  state.query = event.target.value;
  renderHistory();
});

document.querySelector("#rangeFilter").addEventListener("change", (event) => {
  state.range = event.target.value;
  renderAll();
});

document.querySelector(".filter-row").addEventListener("click", (event) => {
  const button = event.target.closest("[data-platform]");
  if (!button) {
    return;
  }

  state.platform = button.dataset.platform;
  renderFilters();
  renderHistory();
});

renderAll();
