
export let database = {};

export function setDatabase(data) {
  database = data && typeof data === 'object' ? data : {};
}

export async function loadDatabase() {
  const response = await fetch('./data/mongil_database.json', {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('HTTP ' + response.status);
  }

  const data = await response.json();
  setDatabase(data);

  return database;
}

export function recordsFor(key) {
  return Array.isArray(database[key]) ? database[key] : [];
}

export function safe(value) {
  return value === null || value === undefined || value === ''
    ? '—'
    : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value);
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

export function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, '');
}

export function getField(record, names) {
  if (!record || typeof record !== 'object') return undefined;

  const keys = Object.keys(record);

  for (const name of names) {
    const found = keys.find(
      key => normalize(key) === normalize(name)
    );

    if (found !== undefined && record[found] !== '') {
      return record[found];
    }
  }

  return undefined;
}

export function getRecordName(record) {
  return getField(record, [
    'nombre',
    'name',
    'numero',
    'id'
  ]) ?? '';
}

export function sortAlphabetically(rows) {
  return [...rows].sort((a, b) =>
    String(getRecordName(a)).localeCompare(
      String(getRecordName(b)),
      'es',
      {
        sensitivity: 'base',
        numeric: true
      }
    )
  );
}

export function getDisplayRows(key) {
  const rows = recordsFor(key);

  if (key === 'monsterlings') {
    return [...rows];
  }

  return sortAlphabetically(rows);
}

export function imageFileName(name) {
  return String(name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') + '.png';
}

export function imagePath(category, name) {
  return './img/' + category + '/' + imageFileName(name);
}

