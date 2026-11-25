
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

      '<div class="monster-card-image-wrap">' +
        '<img class="monster-card-image" ' +
          'src="' + escapeHtml(image) + '" ' +
          'alt="' + escapeHtml(name) + '" ' +
          'loading="lazy" ' +
          'onerror="this.style.display=\'none\'">' +
      '</div>' +

      '<div class="monster-card-content">' +

        '<div class="card-top">' +
          '<div>' +

            (number !== undefined
              ? '<div class="card-number">N.º ' +
                  escapeHtml(safe(number)) +
                '</div>'
              : '') +

            '<div class="card-name">' +
              escapeHtml(name) +
            '</div>' +

          '</div>' +
        '</div>' +

        (effect
          ? '<div class="monster-card-detail">' +
              '<span class="detail-label">Efecto de rango</span>' +
              '<div class="detail-value">' +
                escapeHtml(safe(effect)) +
              '</div>' +
            '</div>'
          : '') +

        (link
          ? '<div class="monster-card-detail">' +
              '<span class="detail-label">Enlace</span>' +
              '<div class="detail-value">' +
                escapeHtml(safe(link)) +
              '</div>' +
            '</div>'
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
