const sampleHistory = [
  { title: "The Crown", type: "Serial", platform: "Netflix", genre: "Dramat", watchedAt: "2026-05-16T20:14:00", minutes: 52 },
  { title: "The Crown", type: "Serial", platform: "Netflix", genre: "Dramat", watchedAt: "2026-05-15T23:38:00", minutes: 52 },
  { title: "Fallout", type: "Serial", platform: "Prime Video", genre: "Sci-fi", watchedAt: "2026-05-14T21:03:00", minutes: 61 },
  { title: "Diuna: Część druga", type: "Film", platform: "Max", genre: "Sci-fi", watchedAt: "2026-05-12T19:30:00", minutes: 166 },
  { title: "Diuna: Część druga", type: "Film", platform: "Max", genre: "Sci-fi", watchedAt: "2026-04-12T22:55:00", minutes: 166 },
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
  dateFrom: "",
  dateTo: "",
  historySort: "date-desc",
  visibleHistory: 50,
  usingImportedData: false,
};

const netflixDateLocale = "pl-PL";
const historyPageSize = 50;

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

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(netflixDateLocale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDateBounds = (data = watchHistory) => {
  const dates = data
    .map((item) => parseDate(item.watchedAt))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a - b);

  if (!dates.length) {
    return { min: "", max: "" };
  }

  return {
    min: toDateKey(dates[0]),
    max: toDateKey(dates[dates.length - 1]),
  };
};

const addDays = (dateKey, amount) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
};

const daysBetween = (from, to) => Math.floor((new Date(to) - new Date(from)) / (24 * 60 * 60 * 1000));

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

const parseSeriesInfo = (title) => {
  const cleanTitle = String(title ?? "").trim();
  const seasonMatch = cleanTitle.match(/^(.*?):\s*(season|sezon|series|część)\s*(\d+)/i);
  const episodeMatch = cleanTitle.match(/(?:episode|odcinek)\s*(\d+)/i);

  if (seasonMatch) {
    return {
      series: seasonMatch[1].trim(),
      season: Number(seasonMatch[3]),
      episode: episodeMatch ? Number(episodeMatch[1]) : null,
      isSeries: true,
    };
  }

  const colonParts = cleanTitle.split(":").map((part) => part.trim()).filter(Boolean);
  if (colonParts.length >= 3) {
    return {
      series: colonParts[0],
      season: null,
      episode: null,
      isSeries: true,
    };
  }

  return {
    series: cleanTitle,
    season: null,
    episode: null,
    isSeries: inferNetflixType(cleanTitle) === "Serial",
  };
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
      const seriesInfo = parseSeriesInfo(cleanTitle);
      return {
        title: cleanTitle,
        type: inferNetflixType(cleanTitle),
        platform: "Netflix",
        genre: shouldEstimate ? "Import Netflix, czas szacowany" : "Import Netflix, czas nieznany",
        watchedAt: parsedDate.toISOString(),
        minutes: estimateNetflixMinutes(cleanTitle, shouldEstimate),
        estimated: shouldEstimate,
        source: "netflix-csv",
        series: seriesInfo.series,
        season: seriesInfo.season,
        episode: seriesInfo.episode,
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
  const bounds = getDateBounds();
  let from = state.dateFrom;
  let to = state.dateTo;

  if (state.range !== "all" && state.range !== "custom" && bounds.max) {
    to = bounds.max;
    from = addDays(bounds.max, Number(state.range) * -1 + 1);
  }

  return watchHistory.filter((item) => {
    const key = toDateKey(parseDate(item.watchedAt));
    return (!from || key >= from) && (!to || key <= to);
  });
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
    .sort((a, b) => {
      if (state.historySort === "date-asc") {
        return parseDate(a.watchedAt) - parseDate(b.watchedAt);
      }

      if (state.historySort === "title-asc") {
        return a.title.localeCompare(b.title, netflixDateLocale);
      }

      if (state.historySort === "minutes-desc") {
        return b.minutes - a.minutes || parseDate(b.watchedAt) - parseDate(a.watchedAt);
      }

      return parseDate(b.watchedAt) - parseDate(a.watchedAt);
    });
};

const getDayGroups = (data = filteredByRange()) => {
  const groups = new Map();

  data.forEach((item) => {
    const key = toDateKey(parseDate(item.watchedAt));
    const current = groups.get(key) || {
      dateKey: key,
      minutes: 0,
      count: 0,
      titles: new Set(),
      items: [],
    };
    current.minutes += item.minutes;
    current.count += 1;
    current.titles.add(item.title);
    current.items.push(item);
    groups.set(key, current);
  });

  return [...groups.values()].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
};

const getSeriesGroups = (data = filteredByRange()) => {
  const groups = new Map();

  data.forEach((item) => {
    const info = parseSeriesInfo(item.series || item.title);
    const series = item.series || info.series;
    const current = groups.get(series) || {
      series,
      minutes: 0,
      count: 0,
      firstDate: toDateKey(parseDate(item.watchedAt)),
      lastDate: toDateKey(parseDate(item.watchedAt)),
      days: new Set(),
      episodes: new Set(),
      items: [],
      isSeries: info.isSeries || item.type === "Serial",
    };
    const key = toDateKey(parseDate(item.watchedAt));
    const season = item.season ?? info.season ?? "?";
    const episode = item.episode ?? info.episode ?? item.title;
    current.minutes += item.minutes;
    current.count += 1;
    current.firstDate = current.firstDate < key ? current.firstDate : key;
    current.lastDate = current.lastDate > key ? current.lastDate : key;
    current.days.add(key);
    current.episodes.add(`${season}:${episode}`);
    current.items.push(item);
    groups.set(series, current);
  });

  return [...groups.values()];
};

const getTopDays = () =>
  getDayGroups()
    .sort((a, b) => b.minutes - a.minutes || b.count - a.count)
    .slice(0, 7);

const getBingeSeries = () =>
  getSeriesGroups()
    .filter((group) => group.isSeries && (group.count >= 3 || group.days.size >= 2))
    .map((group) => {
      const sortedDays = [...group.days].sort();
      let longestRun = 1;
      let currentRun = 1;

      for (let index = 1; index < sortedDays.length; index += 1) {
        if (sortedDays[index] === addDays(sortedDays[index - 1], 1)) {
          currentRun += 1;
          longestRun = Math.max(longestRun, currentRun);
        } else {
          currentRun = 1;
        }
      }

      const bestSingleDay = Math.max(
        ...getDayGroups(group.items).map((day) => day.count),
        0
      );

      return {
        ...group,
        longestRun,
        bestSingleDay,
      };
    })
    .filter((group) => group.longestRun >= 2 || group.bestSingleDay >= 3)
    .sort((a, b) => b.longestRun - a.longestRun || b.bestSingleDay - a.bestSingleDay || b.count - a.count)
    .slice(0, 7);

const getAbandonedSeries = () => {
  const bounds = getDateBounds(filteredByRange());
  const latest = bounds.max;

  if (!latest) {
    return [];
  }

  return getSeriesGroups()
    .filter((group) => group.isSeries && group.count >= 1 && group.count <= 8)
    .map((group) => {
      const daysSinceLast = Math.floor((new Date(latest) - new Date(group.lastDate)) / (24 * 60 * 60 * 1000));
      return {
        ...group,
        daysSinceLast,
      };
    })
    .filter((group) => group.daysSinceLast >= 30)
    .sort((a, b) => b.daysSinceLast - a.daysSinceLast || b.count - a.count)
    .slice(0, 7);
};

const getTopSeries = () =>
  getSeriesGroups()
    .sort((a, b) => b.count - a.count || b.minutes - a.minutes)
    .slice(0, 7);

const getRepeatTitles = () => {
  const groups = new Map();

  filteredByRange().forEach((item) => {
    const current = groups.get(item.title) || {
      title: item.title,
      platform: item.platform,
      minutes: 0,
      dates: [],
      items: [],
    };
    current.minutes += item.minutes;
    current.dates.push(toDateKey(parseDate(item.watchedAt)));
    current.items.push(item);
    groups.set(item.title, current);
  });

  return [...groups.values()]
    .map((group) => {
      const dates = [...new Set(group.dates)].sort();
      const gaps = dates.slice(1).map((date, index) => daysBetween(dates[index], date));
      return {
        ...group,
        dates,
        gaps,
        longestGap: gaps.length ? Math.max(...gaps) : 0,
        shortestGap: gaps.length ? Math.min(...gaps) : 0,
      };
    })
    .filter((group) => group.items.length > 1 || group.dates.length > 1)
    .sort((a, b) => b.items.length - a.items.length || b.longestGap - a.longestGap)
    .slice(0, 7);
};

const hasReliableTimes = (data = filteredByRange()) => data.some((item) => item.source !== "netflix-csv");

const getLateNightItems = () =>
  filteredByRange().filter((item) => {
    if (item.source === "netflix-csv") {
      return false;
    }

    const hour = parseDate(item.watchedAt).getHours();
    return hour >= 23 || hour <= 4;
  });

const getThresholdMoments = () => {
  const moments = [];
  const topDays = getTopDays();
  const longestDay = topDays[0];
  const lateItems = getLateNightItems();
  const biggestLate = lateItems.sort((a, b) => parseDate(b.watchedAt) - parseDate(a.watchedAt))[0];
  const allDayCandidates = topDays.filter((day) => day.minutes >= 360 || day.count >= 6);

  if (longestDay) {
    const topTitle = getSeriesGroups(longestDay.items)[0];
    moments.push({
      title: "Najcięższy dzień",
      value: formatDateKey(longestDay.dateKey),
      detail: `${formatHours(longestDay.minutes)}, ${longestDay.count} wpisów${topTitle ? `, głównie ${topTitle.series}` : ""}`,
    });
  }

  if (allDayCandidates.length) {
    const day = allDayCandidates[0];
    moments.push({
      title: "Dzień przesiedziany",
      value: formatDateKey(day.dateKey),
      detail: `${formatHours(day.minutes)} i ${day.titles.size} różnych tytułów w jednym dniu`,
    });
  }

  if (biggestLate) {
    moments.push({
      title: "Zawalona noc",
      value: biggestLate.title,
      detail: `${formatDateKey(toDateKey(parseDate(biggestLate.watchedAt)))} po ${parseDate(biggestLate.watchedAt).toLocaleTimeString(netflixDateLocale, { hour: "2-digit", minute: "2-digit" })}`,
    });
  } else if (!hasReliableTimes()) {
    moments.push({
      title: "Noc ukryta przez Netflixa",
      value: "brak godzin",
      detail: "CSV Netflixa nie podaje godzin, więc nocne seanse wykryjemy dopiero z dokładniejszego źródła.",
    });
  }

  const repeats = getRepeatTitles();
  if (repeats[0]) {
    moments.push({
      title: "Najmocniejszy powrót",
      value: repeats[0].title,
      detail: `${repeats[0].items.length} razy, największy odstęp ${repeats[0].longestGap} dni`,
    });
  }

  return moments.slice(0, 7);
};

const getBehaviorStats = () => {
  const data = filteredByRange();
  const dayGroups = getDayGroups(data);
  const bounds = getDateBounds(data);
  const activeDays = dayGroups.length;
  const totalDays = bounds.min && bounds.max ? daysBetween(bounds.min, bounds.max) + 1 : 0;
  const totalMinutes = data.reduce((sum, item) => sum + item.minutes, 0);
  const repeatItems = getRepeatTitles().reduce((sum, group) => sum + group.items.length, 0);
  const weekendMinutes = data.reduce((sum, item) => {
    const day = parseDate(item.watchedAt).getDay();
    return day === 0 || day === 6 ? sum + item.minutes : sum;
  }, 0);
  const sortedDays = dayGroups.map((day) => day.dateKey).sort();
  const inactiveGaps = sortedDays.slice(1).map((date, index) => Math.max(daysBetween(sortedDays[index], date) - 1, 0));
  const maxInactiveGap = inactiveGaps.length ? Math.max(...inactiveGaps) : 0;
  const lateMinutes = getLateNightItems().reduce((sum, item) => sum + item.minutes, 0);
  const topSeries = getTopSeries()[0];

  return {
    bounds,
    totalDays,
    activeDays,
    totalMinutes,
    avgActiveDay: activeDays ? Math.round(totalMinutes / activeDays) : 0,
    avgWeek: totalDays ? Math.round(totalMinutes / Math.max(totalDays / 7, 1)) : 0,
    activeShare: totalDays ? Math.round((activeDays / totalDays) * 100) : 0,
    weekendShare: totalMinutes ? Math.round((weekendMinutes / totalMinutes) * 100) : 0,
    repeatShare: data.length ? Math.round((repeatItems / data.length) * 100) : 0,
    lateShare: totalMinutes ? Math.round((lateMinutes / totalMinutes) * 100) : 0,
    maxInactiveGap,
    topSeries,
  };
};

const getStoryStats = () => {
  const data = filteredByRange();
  const stats = getBehaviorStats();
  const topSeries = getTopSeries()[0];
  const topDay = getTopDays()[0];
  const repeat = getRepeatTitles()[0];
  const platform = Object.entries(
    data.reduce((acc, item) => {
      acc[item.platform] = (acc[item.platform] || 0) + item.minutes;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1])[0]?.[0] || "Streaming";
  const platformCount = new Set(data.map((item) => item.platform)).size;

  return {
    ...stats,
    platform,
    platformCount,
    topSeries,
    topDay,
    repeat,
  };
};

const getCalendarDays = () => {
  const groups = getDayGroups();
  const bounds = getDateBounds(filteredByRange());

  if (!bounds.min || !bounds.max) {
    return [];
  }

  const days = [];
  const start = daysBetween(bounds.min, bounds.max) > 369 ? addDays(bounds.max, -369) : bounds.min;
  let current = start;

  while (current <= bounds.max) {
    const group = groups.find((entry) => entry.dateKey === current);
    days.push(group || { dateKey: current, minutes: 0, count: 0, titles: new Set(), items: [] });
    current = addDays(current, 1);
  }

  return days;
};

const updateDateInputs = () => {
  const bounds = getDateBounds();
  const fromInput = document.querySelector("#dateFrom");
  const toInput = document.querySelector("#dateTo");
  [fromInput, toInput].forEach((input) => {
    input.min = bounds.min;
    input.max = bounds.max;
  });
  fromInput.value = state.dateFrom;
  toInput.value = state.dateTo;
  document.querySelector("#rangeFilter").value = state.range;
  document.querySelector("#activeRangeLabel").textContent =
    state.dateFrom || state.dateTo
      ? `${state.dateFrom || bounds.min || "-"} - ${state.dateTo || bounds.max || "-"}`
      : state.range === "all"
        ? "Cała historia"
        : `Ostatnie ${state.range} dni`;
};

const renderMetrics = () => {
  const data = filteredByRange();
  const totalMinutes = data.reduce((sum, item) => sum + item.minutes, 0);
  const uniqueTitles = new Set(data.map((item) => item.title)).size;
  const dates = data.map((item) => parseDate(item.watchedAt)).sort((a, b) => a - b);
  const longestDay = getTopDays()[0];

  const hasEstimatedTime = data.some((item) => item.estimated);
  document.querySelector("#totalHours").textContent = `${formatHours(totalMinutes)}${hasEstimatedTime ? "*" : ""}`;
  document.querySelector("#sessionCount").textContent = data.length.toString();
  document.querySelector("#peakTime").textContent = longestDay ? formatCompactTime(longestDay.minutes) : "-";
  document.querySelector("#peakTimeNote").textContent = longestDay
    ? `${formatDateKey(longestDay.dateKey)}, ${longestDay.count} wpisów`
    : "brak danych";
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

const renderCalendar = () => {
  const days = getCalendarDays();
  const max = Math.max(...days.map((day) => day.minutes), 1);
  const grid = document.querySelector("#calendarGrid");

  if (!days.length) {
    grid.innerHTML = `<div class="empty-state">Brak danych w wybranym zakresie.</div>`;
    return;
  }

  grid.innerHTML = days
    .map((day) => {
      const heat = Math.round((day.minutes / max) * 82);
      const date = new Date(day.dateKey);
      return `
        <button class="calendar-day" type="button" data-date="${day.dateKey}" style="--heat: ${heat}%">
          <strong>${date.getDate()}</strong>
          <span>${day.minutes ? formatCompactTime(day.minutes) : ""}</span>
        </button>
      `;
    })
    .join("");
};

const renderInsightList = (selector, rows, emptyMessage, renderRow) => {
  const container = document.querySelector(selector);
  container.innerHTML = rows.length
    ? rows.map(renderRow).join("")
    : `<div class="empty-state">${emptyMessage}</div>`;
};

const renderInsights = () => {
  renderInsightList(
    "#topDaysList",
    getTopDays(),
    "Brak dni do pokazania w wybranym zakresie.",
    (day) => `
      <article class="insight-item">
        <div>
          <strong>${escapeHtml(formatDateKey(day.dateKey))}</strong>
          <span>${day.count} wpisów, ${day.titles.size} unikalnych tytułów</span>
        </div>
        <b>${formatHours(day.minutes)}</b>
      </article>
    `
  );

  renderInsightList(
    "#bingeList",
    getBingeSeries(),
    "Nie wykryto jeszcze wyraźnych ciągów oglądania.",
    (group) => `
      <article class="insight-item">
        <div>
          <strong>${escapeHtml(group.series)}</strong>
          <span>${group.count} wpisów, najlepszy dzień: ${group.bestSingleDay}, ciąg: ${group.longestRun} dni</span>
        </div>
        <b>${formatHours(group.minutes)}</b>
      </article>
    `
  );

  renderInsightList(
    "#abandonedList",
    getAbandonedSeries(),
    "Brak mocnych sygnałów porzuconych seriali w tym zakresie.",
    (group) => `
      <article class="insight-item">
        <div>
          <strong>${escapeHtml(group.series)}</strong>
          <span>${group.count} wpisów, ostatnio ${group.daysSinceLast} dni temu</span>
        </div>
        <b>${escapeHtml(formatDateKey(group.lastDate))}</b>
      </article>
    `
  );

  renderInsightList(
    "#seriesList",
    getTopSeries(),
    "Brak tytułów do pokazania.",
    (group) => `
      <article class="insight-item">
        <div>
          <strong>${escapeHtml(group.series)}</strong>
          <span>${group.count} wpisów, ${group.days.size} dni aktywności</span>
        </div>
        <b>${formatHours(group.minutes)}</b>
      </article>
    `
  );
};

const renderSignals = () => {
  renderInsightList(
    "#rewatchList",
    getRepeatTitles(),
    "Nie wykryto jeszcze tytułów obejrzanych więcej niż raz.",
    (group) => {
      const dates = group.dates.map(formatDateKey).join(" → ");
      const gaps = group.gaps.length ? `Odstępy: ${group.gaps.join(", ")} dni` : "Powtórka tego samego dnia";
      return `
        <article class="insight-item">
          <div>
            <strong>${escapeHtml(group.title)}</strong>
            <span>${escapeHtml(dates)}. ${escapeHtml(gaps)}</span>
          </div>
          <b>${group.items.length}x</b>
        </article>
      `;
    }
  );

  renderInsightList(
    "#thresholdList",
    getThresholdMoments(),
    "Brak silnych momentów granicznych w wybranym zakresie.",
    (moment) => `
      <article class="insight-item">
        <div>
          <strong>${escapeHtml(moment.title)}</strong>
          <span>${escapeHtml(moment.detail)}</span>
        </div>
        <b>${escapeHtml(moment.value)}</b>
      </article>
    `
  );

  const stats = getBehaviorStats();
  const signals = [
    { label: "Dni aktywne", value: `${stats.activeShare}%`, width: stats.activeShare, detail: `${stats.activeDays} z ${stats.totalDays || 0} dni` },
    { label: "Weekendowy ciężar", value: `${stats.weekendShare}%`, width: stats.weekendShare, detail: "udział czasu z sobót i niedziel" },
    { label: "Powroty do tytułów", value: `${stats.repeatShare}%`, width: stats.repeatShare, detail: "wpisów należących do powtórek" },
    { label: "Nocny ślad", value: hasReliableTimes() ? `${stats.lateShare}%` : "ukryty", width: hasReliableTimes() ? stats.lateShare : 0, detail: hasReliableTimes() ? "po 23:00 albo przed 5:00" : "Netflix CSV nie zawiera godzin" },
    { label: "Najdłuższa przerwa", value: `${stats.maxInactiveGap} dni`, width: Math.min(stats.maxInactiveGap * 3, 100), detail: "bez żadnego wpisu w historii" },
  ];

  document.querySelector("#behaviorList").innerHTML = signals
    .map((signal) => `
      <div class="signal-item">
        <div>
          <strong>${escapeHtml(signal.label)}</strong>
          <span>${escapeHtml(signal.detail)}</span>
        </div>
        <b>${escapeHtml(signal.value)}</b>
        <div class="signal-track"><span style="width: ${Math.max(signal.width, 4)}%"></span></div>
      </div>
    `)
    .join("");

  const ideas = [
    ["Mapa nastroju", "porównanie gatunków z porą dnia i długością sesji"],
    ["Detektor cliffhangerów", "seriale, po których następny odcinek odpalano tego samego dnia"],
    ["Sezonowe obsesje", "miesiące, w których jeden tytuł zdominował całą historię"],
    ["Koszt subskrypcji za godzinę", "po dodaniu ceny platformy pokażemy realny koszt oglądania"],
    ["Indeks lojalności", "ile procent czasu zabrała jedna platforma albo jedna seria"],
    ["Powrót nostalgii", "tytuły wracające po najdłuższych przerwach"],
  ];

  document.querySelector("#ideaList").innerHTML = ideas
    .map(([title, detail]) => `
      <article class="idea-item">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(detail)}</span>
      </article>
    `)
    .join("");
};

const renderStory = () => {
  const story = getStoryStats();
  const hasEstimate = filteredByRange().some((item) => item.estimated);
  const since = story.bounds.min ? formatDateKey(story.bounds.min) : "-";
  const elapsed = story.totalDays ? `${story.totalDays} dni historii, ${story.activeDays} dni aktywnych` : "0 dni historii";
  const watched = `${formatHours(story.totalMinutes)}${hasEstimate ? "*" : ""}`;

  document.querySelector("#storyPlatform").textContent = story.platformCount === 1 ? story.platform : `Top: ${story.platform}`;
  document.querySelector("#storySince").textContent = story.platformCount === 1
    ? `Jesteś użytkownikiem ${story.platform} od ${since}`
    : `Twoja historia oglądania zaczyna się ${since}`;
  document.querySelector("#storyWatched").textContent = watched;
  document.querySelector("#storyElapsed").textContent = elapsed;
  document.querySelector("#storyHookTitle").textContent = story.topSeries?.series || "-";
  document.querySelector("#storyHookDetail").textContent = story.topSeries
    ? `${story.topSeries.count} wpisów, ${formatHours(story.topSeries.minutes)}`
    : "-";
  document.querySelector("#storyBingeDay").textContent = story.topDay ? formatDateKey(story.topDay.dateKey) : "-";
  document.querySelector("#storyBingeDetail").textContent = story.topDay
    ? `${formatHours(story.topDay.minutes)}, ${story.topDay.count} wpisów`
    : "-";
  document.querySelector("#storyRepeat").textContent = story.repeat?.title || "brak powtórek";
  document.querySelector("#storyRepeatDetail").textContent = story.repeat
    ? `${story.repeat.items.length} razy, największy odstęp ${story.repeat.longestGap} dni`
    : "Jeszcze nie widać tytułu, do którego wracałeś.";

  const persona = story.repeatShare >= 20
    ? "Profil: kolekcjoner powrotów. Masz swoje tytuły-komfort i wracasz do nich zaskakująco regularnie."
    : story.weekendShare >= 55
      ? "Profil: weekendowy maratończyk. Twoje oglądanie kumuluje się wtedy, gdy tydzień wreszcie puszcza."
      : story.activeShare >= 45
        ? "Profil: rytualny widz. Streaming nie jest epizodem, tylko stałym elementem tygodnia."
        : "Profil: selektywny widz. Włączasz rzadziej, ale zostawiasz po sobie wyraźne piki aktywności.";
  document.querySelector("#storyPersona").textContent = persona;

  const bars = [
    ["Aktywne dni", story.activeShare],
    ["Weekend", story.weekendShare],
    ["Powtórki", story.repeatShare],
  ];
  document.querySelector("#storyMiniBars").innerHTML = bars
    .map(([label, value]) => `
      <div class="story-bar">
        <span>${escapeHtml(label)}</span>
        <div><b style="width: ${Math.max(value, 4)}%"></b></div>
        <strong>${value}%</strong>
      </div>
    `)
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
  const visibleResults = results.slice(0, state.visibleHistory);
  const loadMoreButton = document.querySelector("#loadMoreHistory");

  document.querySelector("#historyCount").textContent = `${results.length} wpisów`;
  loadMoreButton.hidden = results.length <= state.visibleHistory;

  if (!results.length) {
    list.innerHTML = `<div class="empty-state">Nie znaleziono pasujących wpisów w historii oglądania.</div>`;
    return;
  }

  list.innerHTML = visibleResults
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
  updateDateInputs();
  renderMetrics();
  renderPlatformBars();
  renderCalendar();
  renderInsights();
  renderSignals();
  renderStory();
  renderFilters();
  renderHistory();
  renderCoverage();
  updateImportControls();
};

document.querySelector("#historySearch").addEventListener("input", (event) => {
  state.query = event.target.value;
  state.visibleHistory = historyPageSize;
  renderHistory();
});

document.querySelector("#rangeFilter").addEventListener("change", (event) => {
  state.range = event.target.value;
  if (state.range !== "custom") {
    state.dateFrom = "";
    state.dateTo = "";
  }
  state.visibleHistory = historyPageSize;
  renderAll();
});

document.querySelector("#dateFrom").addEventListener("change", (event) => {
  state.dateFrom = event.target.value;
  state.range = "custom";
  state.visibleHistory = historyPageSize;
  renderAll();
});

document.querySelector("#dateTo").addEventListener("change", (event) => {
  state.dateTo = event.target.value;
  state.range = "custom";
  state.visibleHistory = historyPageSize;
  renderAll();
});

document.querySelector("#clearDateFilters").addEventListener("click", () => {
  state.dateFrom = "";
  state.dateTo = "";
  state.range = "all";
  state.visibleHistory = historyPageSize;
  renderAll();
});

document.querySelector("#historySort").addEventListener("change", (event) => {
  state.historySort = event.target.value;
  state.visibleHistory = historyPageSize;
  renderHistory();
});

document.querySelector("#loadMoreHistory").addEventListener("click", () => {
  state.visibleHistory += historyPageSize;
  renderHistory();
});

document.querySelector("#calendarGrid").addEventListener("click", (event) => {
  const button = event.target.closest("[data-date]");
  if (!button) {
    return;
  }

  state.dateFrom = button.dataset.date;
  state.dateTo = button.dataset.date;
  state.range = "custom";
  state.visibleHistory = historyPageSize;
  renderAll();
  document.querySelector("#historia").scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelector(".filter-row").addEventListener("click", (event) => {
  const button = event.target.closest("[data-platform]");
  if (!button) {
    return;
  }

  state.platform = button.dataset.platform;
  state.visibleHistory = historyPageSize;
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
    state.dateFrom = "";
    state.dateTo = "";
    state.query = "";
    state.historySort = "date-desc";
    state.visibleHistory = historyPageSize;
    document.querySelector("#historySearch").value = "";
    document.querySelector("#historySort").value = state.historySort;

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
  state.dateFrom = "";
  state.dateTo = "";
  state.query = "";
  state.historySort = "date-desc";
  state.visibleHistory = historyPageSize;
  document.querySelector("#historySearch").value = "";
  document.querySelector("#rangeFilter").value = "all";
  document.querySelector("#historySort").value = state.historySort;
  setImportStatus("Dane z importu zostały wyczyszczone z pamięci karty. Wróciły dane przykładowe.");
  renderAll();
});

globalThis.StreamWrapped = Object.freeze({
  importNetflixCsvText,
});

renderAll();
