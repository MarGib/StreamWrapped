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
let lastNetflixCsvText = "";

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
  netflixDateFormat: "unknown",
  usingImportedData: false,
  calendarYear: null,
  calendarMonth: null,
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

const formatLocalISO = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatPolishDateStr = (date, includeTime = false) => {
  if (!date || Number.isNaN(date.getTime())) return "";
  const day = date.getDate();
  const months = [
    "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
    "lipca", "sierpnia", "września", "października", "listopada", "grudnia"
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  const dateStr = `${day} ${month} ${year}`;
  if (!includeTime) {
    return dateStr;
  }
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${dateStr}, ${hours}:${minutes}`;
};

const formatDateKey = (dateKey) => {
  if (!dateKey) return "";
  const parts = dateKey.split("-");
  if (parts.length !== 3) return dateKey;
  const [year, month, day] = parts.map(Number);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return dateKey;
  const date = new Date(year, month - 1, day);
  return formatPolishDateStr(date, false);
};

const formatWatchedDate = (item) => {
  const date = parseDate(item.watchedAt);
  return formatPolishDateStr(date, item.hasTime !== false);
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

const getNetflixRowDateValue = (row) =>
  row.date || row.data || row.datum || row.fecha || row["watch date"] || row["view date"] || Object.values(row)[1] || "";

const inferNetflixDateFormat = (rows) => {
  let hasDayFirst = false;
  let hasMonthFirst = false;

  rows.forEach((row) => {
    const raw = String(getNetflixRowDateValue(row)).trim();
    const match = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);

    if (!match) {
      return;
    }

    const first = Number(match[1]);
    const second = Number(match[2]);

    if (first > 12 && second <= 12) {
      hasDayFirst = true;
    } else if (second > 12 && first <= 12) {
      hasMonthFirst = true;
    }
  });

  if (hasDayFirst && !hasMonthFirst) {
    return "dmy";
  }
  if (hasMonthFirst && !hasDayFirst) {
    return "mdy";
  }

  return "dmy";
};

const parseNetflixDate = (value, format = "mdy") => {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return null;
  }

  const isoMatch = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    return {
      date: new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]), 12, 0, 0),
      hasTime: false,
    };
  }

  const localizedMatch = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (localizedMatch) {
    const first = Number(localizedMatch[1]);
    const second = Number(localizedMatch[2]);
    const yearValue = Number(localizedMatch[3]);
    const year = yearValue < 100 ? 2000 + yearValue : yearValue;
    let day = second;
    let month = first;

    if (format === "dmy") {
      day = first;
      month = second;
    } else if (format === "auto") {
      day = first > 12 ? first : second;
      month = first > 12 ? second : first;
    }

    return {
      date: new Date(year, month - 1, day, 12, 0, 0),
      hasTime: false,
    };
  }

  const fallback = new Date(raw);
  if (Number.isNaN(fallback.getTime())) {
    return null;
  }

  return {
    date: fallback,
    hasTime: /\d{1,2}:\d{2}/.test(raw),
  };
};

const inferNetflixType = (title) => {
  const normalized = title.toLowerCase();
  const serialSignals = [": season ", ": sezon ", ": limited series", ": miniserial", " odcinek ", " episode "];
  return serialSignals.some((signal) => normalized.includes(signal)) ? "Serial" : "Film / odcinek";
};

const parseSeriesInfo = (title) => {
  let cleanTitle = String(title ?? "").trim();
  if (cleanTitle.startsWith(":")) {
    cleanTitle = "Nieznany serial" + cleanTitle;
  }
  const seasonMatch = cleanTitle.match(/^(.*?):\s*(season|sezon|series|część|czesc)\s*(\d+)/i);
  const episodeMatch = cleanTitle.match(/(?:episode|odcinek)\s*(\d+)/i);

  if (seasonMatch) {
    let series = seasonMatch[1].trim();
    if (!series) {
      series = "Nieznany serial";
    }
    return {
      series,
      season: Number(seasonMatch[3]),
      episode: episodeMatch ? Number(episodeMatch[1]) : null,
      isSeries: true,
    };
  }

  const colonParts = cleanTitle.split(":").map((part) => part.trim()).filter(Boolean);
  
  if (colonParts.length === 2) {
    const secondPartLower = colonParts[1].toLowerCase();
    const isEpisode = /(?:episode|odcinek|part|część|czesc)/i.test(secondPartLower);
    if (isEpisode) {
      return {
        series: colonParts[0],
        season: null,
        episode: episodeMatch ? Number(episodeMatch[1]) : null,
        isSeries: true,
      };
    }
  }

  if (colonParts.length >= 3) {
    return {
      series: colonParts[0],
      season: null,
      episode: episodeMatch ? Number(episodeMatch[1]) : null,
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

const resolveOrphanedTitlesInRows = (rows) => {
  const getRawTitle = (row) => {
    if (!row) return "";
    return String(row.title || row.tytuł || row.tytul || row.titel || row.titre || row.título || Object.values(row)[0] || "").trim();
  };

  const getSeriesPrefix = (title) => {
    const clean = title.trim();
    if (!clean) return null;
    
    // An orphaned title starts with colon, or is just "odcinek X" / "episode X" / empty
    const isOrphan = clean.startsWith(":") || 
                     /^(odcinek|episode|sezon|season)\b/i.test(clean) || 
                     /^\d+$/.test(clean);
                     
    if (isOrphan) {
      return null;
    }
    
    const parts = clean.split(":");
    if (parts.length > 1) {
      const seasonIndex = parts.findIndex(p => 
        /(season|sezon|series|część|czesc|cz\.)\s*\d+/i.test(p)
      );
      if (seasonIndex !== -1) {
        return parts.slice(0, seasonIndex + 1).join(":").trim();
      }
      return parts[0].trim();
    }
    
    return null;
  };

  const rawTitles = rows.map(getRawTitle);
  const resolved = [...rawTitles];

  let i = 0;
  while (i < rawTitles.length) {
    const title = rawTitles[i];
    const isOrphan = title.startsWith(":") || 
                     /^(odcinek|episode)\b/i.test(title) || 
                     title === "";

    if (!isOrphan) {
      i += 1;
      continue;
    }

    // Start of an orphaned block
    const blockStart = i;
    while (i < rawTitles.length) {
      const nextTitle = rawTitles[i];
      const nextOrphan = nextTitle.startsWith(":") || 
                         /^(odcinek|episode)\b/i.test(nextTitle) || 
                         nextTitle === "";
      if (!nextOrphan) {
        break;
      }
      i += 1;
    }
    const blockEnd = i - 1;

    // Find the nearest series prefix above and below
    let upPrefix = null;
    let upDist = Infinity;
    for (let j = blockStart - 1; j >= 0; j--) {
      const prefix = getSeriesPrefix(rawTitles[j]);
      if (prefix) {
        upPrefix = prefix;
        upDist = blockStart - j - 1;
        break;
      }
    }

    let downPrefix = null;
    let downDist = Infinity;
    for (let j = blockEnd + 1; j < rawTitles.length; j++) {
      const prefix = getSeriesPrefix(rawTitles[j]);
      if (prefix) {
        downPrefix = prefix;
        downDist = j - blockEnd - 1;
        break;
      }
    }

    // Determine the winning prefix
    let winner = null;
    if (upDist < downDist) {
      winner = upPrefix;
    } else if (downDist < upDist) {
      winner = downPrefix;
    } else {
      winner = upPrefix || downPrefix;
    }

    // Apply the winning prefix to all items in the block
    if (winner) {
      for (let k = blockStart; k <= blockEnd; k++) {
        const raw = rawTitles[k];
        let suffix = raw.startsWith(":") ? raw.substring(1).trim() : raw;
        resolved[k] = suffix ? `${winner}: ${suffix}` : winner;
      }
    } else {
      for (let k = blockStart; k <= blockEnd; k++) {
        const raw = rawTitles[k];
        resolved[k] = raw || "Nieznany serial";
      }
    }
  }

  return resolved;
};

const normalizeNetflixRows = (rows, shouldEstimate, dateFormat = "mdy") => {
  const resolvedTitles = resolveOrphanedTitlesInRows(rows);
  return rows
    .map((row, index) => {
      const title = resolvedTitles[index];
      const watchedDate = getNetflixRowDateValue(row);
      const parsedDateResult = parseNetflixDate(watchedDate, dateFormat);

      if (!title || !parsedDateResult) {
        return null;
      }

      const seriesInfo = parseSeriesInfo(title);
      return {
        title: title,
        type: inferNetflixType(title),
        platform: "Netflix",
        genre: shouldEstimate ? "Import Netflix, czas szacowany" : "Import Netflix, czas nieznany",
        watchedAt: formatLocalISO(parsedDateResult.date),
        hasTime: parsedDateResult.hasTime,
        minutes: estimateNetflixMinutes(title, shouldEstimate),
        estimated: shouldEstimate,
        source: "netflix-csv",
        series: seriesInfo.series,
        season: seriesInfo.season,
        episode: seriesInfo.episode,
      };
    })
    .filter(Boolean);
};

const importNetflixCsvData = (csvText, shouldEstimate) => {
  const rows = parseCsv(csvText);
  const dateFormat = inferNetflixDateFormat(rows);
  return {
    dateFormat,
    items: normalizeNetflixRows(rows, shouldEstimate, dateFormat),
  };
};

const importNetflixCsvText = (csvText, shouldEstimate) => importNetflixCsvData(csvText, shouldEstimate).items;

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

const hasReliableTimes = (data = filteredByRange()) => data.some((item) => item.hasTime !== false);

const getLateNightItems = () =>
  filteredByRange().filter((item) => {
    if (item.hasTime === false) {
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

const getIntriguingInsights = () => {
  const data = filteredByRange();
  if (!data.length) return [];

  const insights = [];

  // 1. Ulubiony dzień tygodnia
  const daysOfWeek = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
  const dayMinutes = Array(7).fill(0);
  data.forEach((item) => {
    const day = parseDate(item.watchedAt).getDay();
    dayMinutes[day] += item.minutes;
  });
  const maxDayIndex = dayMinutes.indexOf(Math.max(...dayMinutes));
  const totalMin = dayMinutes.reduce((a, b) => a + b, 0);
  const favDayPct = totalMin ? Math.round((dayMinutes[maxDayIndex] / totalMin) * 100) : 0;
  if (totalMin > 0) {
    insights.push({
      badge: "📅 ULUBIONY DZIEŃ",
      title: daysOfWeek[maxDayIndex],
      detail: `To wtedy spędzasz najwięcej czasu przed ekranem (${favDayPct}% całego czasu).`,
    });
  }

  // 2. Ulubiona pora roku
  const seasons = {
    "Zima ❄️": [11, 0, 1], // Grudzień, Styczeń, Luty
    "Wiosna 🌸": [2, 3, 4], // Marzec, Kwiecień, Maj
    "Lato ☀️": [5, 6, 7], // Czerwiec, Lipiec, Sierpień
    "Jesień 🍂": [8, 9, 10], // Wrzesień, Październik, Listopad
  };
  const seasonMinutes = { "Zima ❄️": 0, "Wiosna 🌸": 0, "Lato ☀️": 0, "Jesień 🍂": 0 };
  data.forEach((item) => {
    const month = parseDate(item.watchedAt).getMonth();
    for (const [seasonName, months] of Object.entries(seasons)) {
      if (months.includes(month)) {
        seasonMinutes[seasonName] += item.minutes;
        break;
      }
    }
  });
  let favSeason = "";
  let maxSeasonMin = 0;
  for (const [name, min] of Object.entries(seasonMinutes)) {
    if (min > maxSeasonMin) {
      maxSeasonMin = min;
      favSeason = name;
    }
  }
  if (maxSeasonMin > 0) {
    const seasonPct = totalMin ? Math.round((maxSeasonMin / totalMin) * 100) : 0;
    insights.push({
      badge: "🍂 PORA ROKU",
      title: favSeason,
      detail: `Pora roku, w której najchętniej oglądasz filmy i seriale (${seasonPct}% czasu).`,
    });
  }

  // 3. Rekordowy miesiąc w całej historii (globalnie)
  const monthGroups = new Map();
  watchHistory.forEach((item) => {
    const date = parseDate(item.watchedAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthGroups.set(key, (monthGroups.get(key) || 0) + item.minutes);
  });
  let recordMonthKey = "";
  let maxMonthMin = 0;
  for (const [key, min] of monthGroups.entries()) {
    if (min > maxMonthMin) {
      maxMonthMin = min;
      recordMonthKey = key;
    }
  }
  if (maxMonthMin > 0) {
    const [year, month] = recordMonthKey.split("-");
    const monthName = ["Styczniu", "Lutym", "Marcu", "Kwietniu", "Maju", "Czerwcu", "Lipcu", "Sierpniu", "Wrześniu", "Październiku", "Listopadzie", "Grudniu"][Number(month) - 1];
    insights.push({
      badge: "🏆 REKORD HISTORII",
      title: `${monthName} ${year} r.`,
      detail: `Wtedy ekran świecił się najdłużej w całej historii: aż ${formatHours(maxMonthMin)}!`,
    });
  }

  // 4. Profil widza (odznaka)
  const stats = getBehaviorStats();
  let personaTitle = "Zrównoważony Widz ☕";
  let personaDetail = "Lubisz dobre kino i seriale w rozsądnych ilościach.";
  if (stats.activeShare > 40) {
    personaTitle = "Codzienny Maratończyk 🏃‍♂️";
    personaDetail = "Streaming to Twoja codzienna rutyna. Oglądasz niemal każdego dnia!";
  } else if (hasReliableTimes() && stats.lateShare > 30) {
    personaTitle = "Nocny Marek 🦉";
    personaDetail = "Najlepsze seanse to te po ciemku. Zarywasz noce dla dobrych historii.";
  } else if (stats.weekendShare > 45) {
    personaTitle = "Weekendowy Wojownik 🍿";
    personaDetail = "W tygodniu pracujesz, ale w weekendy nadrabiasz zaległości z nawiązką.";
  } else if (stats.repeatShare > 25) {
    personaTitle = "Wierny Nostalgik 🔄";
    personaDetail = "Często wracasz do ulubionych tytułów. Nowości mogą poczekać.";
  }
  insights.push({
    badge: "🎭 PROFIL WIDZA",
    title: personaTitle,
    detail: personaDetail,
  });

  return insights;
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
    ? `${formatPolishDateStr(dates[0], false)} - ${formatPolishDateStr(dates[dates.length - 1], false)}`
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
  if (state.calendarYear === null || state.calendarMonth === null) {
    if (watchHistory.length > 0) {
      let latestDate = null;
      watchHistory.forEach(item => {
        const date = parseDate(item.watchedAt);
        if (!latestDate || date > latestDate) {
          latestDate = date;
        }
      });
      if (latestDate) {
        state.calendarYear = latestDate.getFullYear();
        state.calendarMonth = latestDate.getMonth();
      }
    }
    if (state.calendarYear === null || state.calendarMonth === null) {
      const today = new Date();
      state.calendarYear = today.getFullYear();
      state.calendarMonth = today.getMonth();
    }
  }

  const Y = state.calendarYear;
  const M = state.calendarMonth;

  const filteredData = watchHistory
    .filter((item) => state.platform === "all" || item.platform === state.platform)
    .filter((item) => {
      if (!state.query) return true;
      const query = state.query.trim().toLowerCase();
      return [item.title, item.platform, item.genre, item.type]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

  const daysMap = new Map();
  filteredData.forEach((item) => {
    const key = toDateKey(parseDate(item.watchedAt));
    daysMap.set(key, (daysMap.get(key) || 0) + item.minutes);
  });

  const maxDailyMinutes = Math.max(...Array.from(daysMap.values()), 1);

  const firstDay = new Date(Y, M, 1);
  const dayOfWeek = firstDay.getDay(); 
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; 
  const numDays = new Date(Y, M + 1, 0).getDate();

  const monthName = [
    "Styczień", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
    "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
  ][M];
  document.querySelector("#calendarCurrentMonth").textContent = `${monthName} ${Y}`;

  let gridHtml = "";

  for (let i = 0; i < offset; i++) {
    gridHtml += `<div class="calendar-day empty"></div>`;
  }

  let totalMonthMinutes = 0;

  for (let d = 1; d <= numDays; d++) {
    const dateKey = `${Y}-${String(M + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const minutes = daysMap.get(dateKey) || 0;
    totalMonthMinutes += minutes;

    const heat = Math.round((minutes / maxDailyMinutes) * 82);
    const isActive = (state.dateFrom === dateKey && state.dateTo === dateKey);
    const activeClass = isActive ? " active" : "";

    gridHtml += `
      <button class="calendar-day${activeClass}" type="button" data-date="${dateKey}" style="--heat: ${heat}%">
        <strong>${d}</strong>
        <span>${minutes ? formatCompactTime(minutes) : ""}</span>
      </button>
    `;
  }

  const grid = document.querySelector("#calendarGrid");
  grid.innerHTML = gridHtml;

  document.querySelector("#calendarMonthHours").textContent = formatHours(totalMonthMinutes);
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
          <span>${group.count} wpisów, ${group.days.size} dni aktywności, ${escapeHtml(formatDateKey(group.firstDate))} - ${escapeHtml(formatDateKey(group.lastDate))}</span>
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

  const insights = getIntriguingInsights();
  document.querySelector("#ideaList").innerHTML = insights.length
    ? insights
        .map((item) => `
          <article class="idea-item">
            <span class="eyebrow" style="color: var(--teal); font-size: 11px; font-weight: 700; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">${escapeHtml(item.badge)}</span>
            <strong style="display: block; font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 4px;">${escapeHtml(item.title)}</strong>
            <span style="display: block; font-size: 13px; color: var(--muted); line-height: 1.4;">${escapeHtml(item.detail)}</span>
          </article>
        `)
        .join("")
    : `<div class="empty-state">Brak ciekawostek dla wybranego zakresu.</div>`;
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
          <div class="history-meta">${formatWatchedDate(item)}</div>
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

  const clickedDate = button.dataset.date;
  if (state.dateFrom === clickedDate && state.dateTo === clickedDate) {
    state.dateFrom = "";
    state.dateTo = "";
    state.range = "all";
  } else {
    state.dateFrom = clickedDate;
    state.dateTo = clickedDate;
    state.range = "custom";
  }
  state.visibleHistory = historyPageSize;
  renderAll();
  
  if (state.range === "custom") {
    document.querySelector("#historia").scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

document.querySelector("#calendarPrevMonth").addEventListener("click", () => {
  if (state.calendarYear === null || state.calendarMonth === null) return;
  state.calendarMonth -= 1;
  if (state.calendarMonth < 0) {
    state.calendarMonth = 11;
    state.calendarYear -= 1;
  }
  renderCalendar();
});

document.querySelector("#calendarNextMonth").addEventListener("click", () => {
  if (state.calendarYear === null || state.calendarMonth === null) return;
  state.calendarMonth += 1;
  if (state.calendarMonth > 11) {
    state.calendarMonth = 0;
    state.calendarYear += 1;
  }
  renderCalendar();
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

const applyNetflixImport = (csvText, options = {}) => {
  const shouldEstimate = document.querySelector("#estimateNetflixTime").checked;
  const imported = importNetflixCsvData(csvText, shouldEstimate);
  const normalized = imported.items;

  if (!normalized.length) {
    setImportStatus("Nie udało się znaleźć kolumn tytułu i daty w tym pliku CSV.", "error");
    return false;
  }

  state.netflixDateFormat = imported.dateFormat;
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
  state.calendarYear = null;
  state.calendarMonth = null;
  document.querySelector("#historySearch").value = "";
  document.querySelector("#historySort").value = state.historySort;

  const estimatedNote = shouldEstimate
    ? " Czas jest szacowany, bo Netflix nie podaje pełnej długości sesji w tym eksporcie."
    : " Czas oglądania pozostawiono jako 0, bo szacowanie jest wyłączone.";
  const action = options.reparsed ? "Przeparsowano" : "Zaimportowano";
  setImportStatus(
    `${action} ${normalized.length} wpisów z Netflixa. Dane są tylko w pamięci tej karty.${estimatedNote}`,
    shouldEstimate ? "warning" : "success"
  );
  renderAll();
  return true;
};

document.querySelector("#netflixCsvInput").addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) {
    return;
  }

  try {
    const csvText = await file.text();
    lastNetflixCsvText = csvText;
    applyNetflixImport(lastNetflixCsvText);
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
  lastNetflixCsvText = "";
  watchHistory = [...sampleHistory];
  state.usingImportedData = false;
  state.platform = "all";
  state.range = "all";
  state.dateFrom = "";
  state.dateTo = "";
  state.query = "";
  state.netflixDateFormat = "unknown";
  state.historySort = "date-desc";
  state.visibleHistory = historyPageSize;
  state.calendarYear = null;
  state.calendarMonth = null;
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
