
import {
  safe,
  escapeHtml,
  normalize,
  getField,
  imagePath
} from './database.js';

// --------------------------------------------------
// DATOS DEL MONSTERLING
// --------------------------------------------------

function getMonsterName(record) {
  return getField(record, [
    'nombre',
    'name'
  ]) ?? 'Sin nombre';
}

function getMonsterNumber(record) {
  return getField(record, [
    'numero',
    'id'
  ]);
}

function getMonsterType(record) {
  return normalize(
    getField(record, ['tipo', 'type'])
  );
}

function getMonsterEffect(record) {
  return getField(record, [
    'efecto de rango',
    'efecto_de_rango',
    'efecto'
  ]);
}

function getMonsterLink(record) {
  return getField(record, [
    'enlace',
    'link'
  ]);
}

// --------------------------------------------------
// TARJETA
// --------------------------------------------------

export function renderMonsterCard(record) {
  const name = getMonsterName(record);
  const number = getMonsterNumber(record);
  const effect = getMonsterEffect(record);
  const link = getMonsterLink(record);

  const image = imagePath('monsterlings', name);

  return (
    '<article class="entity-card monster-card">' +

      '<div class="monster-card-heading">' +
        '<div class="card-name">' +
          escapeHtml(name) +
        '</div>' +
      '</div>' +

      '<div class="monster-card-image-wrap">' +

        '<img class="monster-card-image" ' +
          'src="' + escapeHtml(image) + '" ' +
          'alt="' + escapeHtml(name) + '" ' +
          'loading="lazy" ' +
          'onerror="this.style.display=\'none\'">' +

        (number !== undefined && number !== ''
          ? '<div class="monster-card-number">' +
              escapeHtml(safe(number)) +
            '</div>'
          : '') +

      '</div>' +

      '<div class="monster-card-content">' +

        (effect
          ? '<div class="monster-card-detail">' +
              '<span class="detail-label">Efecto de rango</span>' +
              '<div class="detail-value">' +
                escapeHtml(safe(effect)) +
              '</div>' +
            '</div>'
          : '') +

        (link
          ? '<details class="monster-card-link">' +
              '<summary class="monster-card-link-toggle">' +
                '<span>Enlace</span>' +
                '<span class="monster-card-link-arrow" aria-hidden="true"></span>' +
              '</summary>' +
              '<div class="monster-card-link-content">' +
                escapeHtml(safe(link)) +
              '</div>' +
            '</details>'
          : '') +

      '</div>' +

    '</article>'
  );
}

// --------------------------------------------------
// SECCIONES
// --------------------------------------------------

function renderMonsterSection(title, rows, sectionClass) {
  if (!rows.length) return '';

  return (
    '<section class="monster-section ' + sectionClass + '">' +

      '<h2 class="monster-section-title">' +
        escapeHtml(title) +
      '</h2>' +

      '<div class="cards-grid">' +
        rows.map(record => renderMonsterCard(record)).join('') +
      '</div>' +

    '</section>'
  );
}

// --------------------------------------------------
// RENDERIZADO GENERAL
// --------------------------------------------------

export function renderMonsterCards(rows) {
  if (!rows.length) {
    return (
      '<div class="empty">' +
        'Todavía no hay registros publicados en esta categoría.' +
      '</div>'
    );
  }

  const legendary = rows.filter(record =>
    getMonsterType(record) === 'legendario'
  );

  const normal = rows.filter(record =>
    getMonsterType(record) !== 'legendario'
  );

  return (
    '<div class="monster-sections">' +

      renderMonsterSection(
        'Legendarios',
        legendary,
        'monster-section-legendary'
      ) +

      renderMonsterSection(
        'Normales',
        normal,
        'monster-section-normal'
      ) +

    '</div>'
  );
}
