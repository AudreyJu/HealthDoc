/* HealthDoc — utilities shared by both pages. No external dependencies. */
(() => {
  'use strict';

  const KEY = 'healthDocHistory';
  const fieldNames = {
    Diabetes: 'Type 2 diabetes',
    Hypertension: 'Hypertension',
    Cardiovascular: 'Cardiovascular disease',
    Lactose: 'Lactose intolerance / digestive sensitivity'
  };
  const environmentNames = { Urban: 'Urban', Suburban: 'Suburban', Rural: 'Rural' };
  const nutritionNames = {
    Processed: 'Mostly processed / sugary foods',
    Standard: 'Mixed diet',
    Mediterranean: 'Mediterranean / whole foods',
    PlantBased: 'Plant-based / high fiber'
  };
  const smokingNames = { No: 'No', Occasionally: 'Occasionally', Regularly: 'Regularly' };
  const activityNames = { Low: 'Less than 1 hour / week', Moderate: '1–3 hours / week', High: 'More than 3 hours / week' };

  function localToday() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function validISODate(value) {
    if (typeof value !== 'string') return '';
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return '';
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const d = new Date(year, month - 1, day);
    if (d.getFullYear() !== year || d.getMonth() + 1 !== month || d.getDate() !== day) return '';
    return value;
  }

  function toISODate(value) {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (validISODate(trimmed)) return trimmed;
    // Historical versions used toLocaleDateString(), which varied by browser locale.
    const match = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/.exec(trimmed);
    if (!match) return '';
    let a = Number(match[1]);
    let b = Number(match[2]);
    const year = Number(match[3]);
    // Prefer day/month/year (French locale); recognize unambiguous US month/day/year.
    const month = a <= 12 && b > 12 ? a : b;
    const day = a <= 12 && b > 12 ? b : a;
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return validISODate(iso);
  }

  function displayDate(iso) {
    const normalized = toISODate(iso);
    if (!normalized) return 'Unknown date';
    const [year, month, day] = normalized.split('-').map(Number);
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      .format(new Date(year, month - 1, day));
  }

  function scoreLevel(score) {
    if (score <= 3) return { name: 'Lower attention', css: 'level-low', short: 'Lower' };
    if (score <= 7) return { name: 'Moderate attention', css: 'level-medium', short: 'Moderate' };
    return { name: 'Higher attention', css: 'level-high', short: 'Higher' };
  }

  function normalize(raw, index) {
    if (!raw || typeof raw !== 'object') return null;
    const score = Number(raw.score);
    if (!Number.isFinite(score)) return null;
    const date = toISODate(raw.dateISO || raw.date || '');
    const genetics = Array.isArray(raw.genetics)
      ? [...new Set(raw.genetics.filter(g => Object.hasOwn(fieldNames, g)))]
      : null; // Older records only contained geneticsCount: don't invent missing details.
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : `legacy-${index}`,
      date,
      createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
      score: Math.max(0, Math.min(11, score)),
      age: Number.isFinite(Number(raw.age)) && Number(raw.age) > 0 ? Number(raw.age) : null,
      genetics,
      geneticsCount: genetics ? genetics.length : (Number.isInteger(raw.geneticsCount) ? raw.geneticsCount : null),
      environment: Object.hasOwn(environmentNames, raw.environment) ? raw.environment : '',
      nutrition: Object.hasOwn(nutritionNames, raw.nutrition) ? raw.nutrition : '',
      smoking: Object.hasOwn(smokingNames, raw.smoking) ? raw.smoking : '',
      activity: Object.hasOwn(activityNames, raw.activity) ? raw.activity : ''
    };
  }

  function readHistory() {
    try {
      const value = localStorage.getItem(KEY);
      if (!value) return { records: [], error: null };
      const raw = JSON.parse(value);
      if (!Array.isArray(raw)) throw new Error('Invalid history format');
      return { records: raw.map(normalize).filter(Boolean), error: null };
    } catch (error) {
      return { records: [], error: 'Your saved history could not be read. It has not been overwritten.' };
    }
  }

  function saveHistory(records) {
    try {
      localStorage.setItem(KEY, JSON.stringify(records));
      return true;
    } catch (error) {
      return false;
    }
  }

  function sortHistory(records) {
    return [...records].sort((a, b) => {
      const byDate = (a.date || '0000').localeCompare(b.date || '0000');
      if (byDate) return byDate;
      return (a.createdAt || '').localeCompare(b.createdAt || '');
    });
  }

  function createId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return `hd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  window.HealthDocData = {
    KEY, fieldNames, environmentNames, nutritionNames, smokingNames, activityNames,
    localToday, toISODate, displayDate, scoreLevel, readHistory, saveHistory, sortHistory, createId
  };
})();
