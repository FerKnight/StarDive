
import {
  safe,
  escapeHtml,
  normalize,
  getField
} from './database.js';

export function renderMonsterCard(record) {
  const name = getField(record, [
    'nombre',
    'name',
    'numero',
    'id'
  ]) ?? 'Sin nombre';

  const number = getField(record, ['numero', 'id']);
  const type = getField(record, ['tipo', 'type']);

  const klass = normalize(type) === 'legendario'
    ? 'monster-legendario'
    : '';

  const known = [
    'nombre',
    'name',
    'numero',
    'id',
    'tipo',
    'type'
  ];

  const details = Object.entries(record || {})
    .filter(([key, value]) =>
      !known.some(item => normalize(item) === normalize(key)) &&
      value !== '' &&
      value !== null &&
      value !== undefined
    )
    .map(([key, value]) =>
      '<div class="detail">' +
        '<span class="detail-label">' +
          escapeHtml(key.replace(/[_-]/g, ' ')) +
        '</span>' +
        '<span class="detail-value">' +
          escapeHtml(safe(value)) +
        '</span>' +
      '</div>'
    )
    .join('');

  return (
    '<article class="entity-card ' + klass + '">' +
      '<div class="card-top">' +
        '<div>' +
          (number !== undefined
            ? '<div class="card-number">N.º ' +
                escapeHtml(safe(number)) +
              '</div>'
            : '') +
          '<div class="card-name">' +
            escapeHtml(safe(name)) +
          '</div>' +
        '</div>' +
        (type !== undefined
          ? '<span class="tag ' +
              (normalize(type) === 'legendario' ? 'gold' : '') +
              '">' +
              escapeHtml(safe(type)) +
            '</span>'
          : '') +
      '</div>' +
      (details
        ? '<div class="card-divider"></div>' +
          '<div class="card-details">' + details + '</div>'
        : '') +
    '</article>'
  );
}

export function renderMonsterCards(rows) {
  if (!rows.length) {
    return '<div class="empty">Todavía no hay registros publicados en esta categoría.</div>';
  }

  return (
    '<div class="cards-grid">' +
      rows.map(record => renderMonsterCard(record)).join('') +
    '</div>'
  );
}
