
import {
  safe,
  escapeHtml,
  normalize,
  getField,
  imagePath
} from './database.js';

export function rarityClass(record) {
  const grade = String(
    getField(record, ['grado', 'rareza', 'rarity']) ?? ''
  ).trim();

  return grade === '5'
    ? 'rarity-5'
    : grade === '4'
      ? 'rarity-4'
      : '';
}

export function elementClass(record) {
  const element = normalize(
    getField(record, ['elemento', 'element'])
  );

  return ({
    fuego: 'element-fuego',
    hielo: 'element-hielo',
    rayo: 'element-rayo',
    tierra: 'element-tierra',
    viento: 'element-viento'
  })[element] || '';
}

export function renderCharacterCard(record) {
  const name = getField(record, ['nombre', 'name']) ?? 'Sin nombre';
  const element = getField(record, ['elemento', 'element']);
  const type = getField(record, ['tipo', 'type']);
  const rank = getField(record, ['rango', 'rank']);
  const image = imagePath('personajes', name);

  return (
    '<article class="entity-card character-card ' +
      rarityClass(record) + ' ' + elementClass(record) + '">' +
      '<div class="character-content">' +
        '<div class="character-image-wrap">' +
          '<img class="character-image" ' +
            'src="' + escapeHtml(image) + '" ' +
            'alt="' + escapeHtml(name) + '" ' +
            'loading="lazy" ' +
            'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
          '<div class="character-image-placeholder">Sin imagen</div>' +
        '</div>' +
        '<div class="character-details">' +
          (element !== undefined && element !== null && element !== ''
            ? '<span class="element-label">' +
                '<span class="element-dot"></span>' +
                escapeHtml(safe(element)) +
              '</span>'
            : '') +
          '<div class="card-name">' + escapeHtml(name) + '</div>' +
          (type !== undefined && type !== null && type !== ''
            ? '<div class="character-detail">' +
                escapeHtml(safe(type)) +
              '</div>'
            : '') +
          (rank !== undefined && rank !== null && rank !== ''
            ? '<div class="character-detail">' +
                escapeHtml(safe(rank)) +
              '</div>'
            : '') +
        '</div>' +
      '</div>' +
    '</article>'
  );
}

export function renderCharacterCards(rows) {
  if (!rows.length) {
    return '<div class="empty">Todavía no hay registros publicados en esta categoría.</div>';
  }

  return (
    '<div class="cards-grid character-grid">' +
      rows.map(record => renderCharacterCard(record)).join('') +
    '</div>'
  );
}

