const sampleHistory = [
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

let watchHistory = [...sampleHistory];
let importedNetflixHistory = [];

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
  usingImportedData: false,
};

const netflixDateLocale = "pl-PL";

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

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

const setImportStatus = (message, tone = "success") => {
  const status = document.querySelector("#netflixImportStatus");
  status.textContent = message;
  status.classList.toggle("warning", tone === "warning");
  status.classList.toggle("error", tone === "error");
};

const splitCsvLine = (line) => {
  const cells = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += char;
    }
  }

  cells.push(cell.trim());
  return cells;
};

const parseCsv = (csvText) => {
  const rows = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map(splitCsvLine);

  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0].map((header) => header.toLowerCase().trim());
  return rows.slice(1).map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]))
  );
};

const parseNetflixDate = (value) => {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return null;
  }

  const isoMatch = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]), 20, 0, 0);
  }

  const localizedMatch = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (localizedMatch) {
    const first = Number(localizedMatch[1]);
    const second = Number(localizedMatch[2]);
    const yearValue = Number(localizedMatch[3]);
    const year = yearValue < 100 ? 2000 + yearValue : yearValue;
    const day = first > 12 ? first : second > 12 ? second : first;
    const month = first > 12 ? second : second > 12 ? first : second;

    return new Date(year, month - 1, day, 20, 0, 0);
  }

  const fallback = new Date(raw);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const inferNetflixType = (title) => {
  const normalized = title.toLowerCase();
  const serialSignals = [": season ", ": sezon ", ": limited series", ": miniserial", " odcinek ", " episode "];
  return serialSignals.some((signal) => normalized.includes(signal)) ? "Serial" : "Film / odcinek";
};

const estimateNetflixMinutes = (title, shouldEstimate) => {
  if (!shouldEstimate) {
    return 0;
  }

  return inferNetflixType(title) === "Serial" ? 45 : 100;
};

const normalizeNetflixRows = (rows, shouldEstimate) =>
  rows
    .map((row) => {
      const title = row.title || row.tytuł || row.tytul || row.titel || row.titre || row.título || Object.values(row)[0];
      const watchedDate =
        row.date || row.data || row.datum || row.fecha || row["watch date"] || row["view date"] || Object.values(row)[1];
      const parsedDate = parseNetflixDate(watchedDate);

      if (!title || !parsedDate) {
        return null;
      }

      const cleanTitle = String(title).trim();
      return {
        title: cleanTitle,
        type: inferNetflixType(cleanTitle),
        platform: "Netflix",
        genre: shouldEstimate ? "Import Netflix, czas szacowany" : "Import Netflix, czas nieznany",
        watchedAt: parsedDate.toISOString(),
        minutes: estimateNetflixMinutes(cleanTitle, shouldEstimate),
        estimated: shouldEstimate,
        source: "netflix-csv",
      };
    })
    .filter(Boolean);

const importNetflixCsvText = (csvText, shouldEstimate) => normalizeNetflixRows(parseCsv(csvText), shouldEstimate);

const updateImportControls = () => {
  document.querySelector("#downloadLocalSnapshot").disabled = importedNetflixHistory.length === 0;
  document.querySelector("#clearImportedData").disabled = !state.usingImportedData;
  document.querySelector("#dataModePill").lastChild.textContent = state.usingImportedData
    ? " Dane z pliku lokalnego"
    : " Dane przykładowe";
};

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

  const hasEstimatedTime = data.some((item) => item.estimated);
  document.querySelector("#totalHours").textContent = `${formatHours(totalMinutes)}${hasEstimatedTime ? "*" : ""}`;
  document.querySelector("#sessionCount").textContent = data.length.toString();
  document.querySelector("#peakTime").textContent = peakTime;
  document.querySelector("#uniqueTitles").textContent = uniqueTitles.toString();
  document.querySelector("#watchSpan").textContent = dates.length
    ? `${dates[0].toLocaleDateString(netflixDateLocale)} - ${dates[dates.length - 1].toLocaleDateString(netflixDateLocale)}`
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
          <div class="bar-label">${escapeHtml(platform)}</div>
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
          <strong>${escapeHtml(name)}</strong>
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
      return `<button class="filter-chip${active}" data-platform="${escapeHtml(platform)}" type="button">${escapeHtml(label)}</button>`;
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
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.type)} • ${escapeHtml(item.genre)}</span>
          </div>
          <div class="platform-badge" style="--badge-bg: ${platformColors[item.platform] || "#667085"}">${escapeHtml(item.platform)}</div>
          <div class="history-meta">${date.toLocaleDateString(netflixDateLocale)} ${date.toLocaleTimeString(netflixDateLocale, { hour: "2-digit", minute: "2-digit" })}</div>
          <div class="history-meta">${formatHours(item.minutes)}${item.estimated ? "*" : ""}</div>
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
            <strong>${escapeHtml(platform.name)}</strong>
            <span>${escapeHtml(platform.method)}</span>
          </div>
          <span class="coverage-status ${statusClass}">${escapeHtml(platform.status)}</span>
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
  updateImportControls();
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

document.querySelector("#netflixCsvInput").addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) {
    return;
  }

  try {
    const csvText = await file.text();
    const shouldEstimate = document.querySelector("#estimateNetflixTime").checked;
    const normalized = importNetflixCsvText(csvText, shouldEstimate);

    if (!normalized.length) {
      setImportStatus("Nie udało się znaleźć kolumn tytułu i daty w tym pliku CSV.", "error");
      return;
    }

    importedNetflixHistory = normalized;
    watchHistory = importedNetflixHistory;
    state.usingImportedData = true;
    state.platform = "all";
    state.range = "all";
    state.query = "";
    document.querySelector("#historySearch").value = "";

    const estimatedNote = shouldEstimate
      ? " Czas jest szacowany, bo Netflix nie podaje pełnej długości sesji w tym eksporcie."
      : " Czas oglądania pozostawiono jako 0, bo szacowanie jest wyłączone.";
    setImportStatus(
      `Zaimportowano ${normalized.length} wpisów z Netflixa. Dane są tylko w pamięci tej karty.${estimatedNote}`,
      shouldEstimate ? "warning" : "success"
    );
    renderAll();
  } catch (error) {
    setImportStatus(`Import nie powiódł się: ${error.message}`, "error");
  } finally {
    event.target.value = "";
  }
});

document.querySelector("#downloadLocalSnapshot").addEventListener("click", () => {
  if (!importedNetflixHistory.length) {
    return;
  }

  const snapshot = {
    source: "StreamWrapped",
    generatedAt: new Date().toISOString(),
    storage: "local-download-only",
    items: importedNetflixHistory,
  };
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `streamwrapped-netflix-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
});

document.querySelector("#clearImportedData").addEventListener("click", () => {
  importedNetflixHistory = [];
  watchHistory = [...sampleHistory];
  state.usingImportedData = false;
  state.platform = "all";
  state.range = "all";
  state.query = "";
  document.querySelector("#historySearch").value = "";
  document.querySelector("#rangeFilter").value = "all";
  setImportStatus("Dane z importu zostały wyczyszczone z pamięci karty. Wróciły dane przykładowe.");
  renderAll();
});

renderAll();

window.StreamWrapped = Object.freeze({
  importNetflixCsvText,
});
