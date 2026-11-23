
import {
  escapeHtml,
  safe,
  imagePath,
  normalize,
  getField
} from './database.js';

// --------------------------------------------------
// CONFIGURACIÓN
// --------------------------------------------------

export const equipmentPieces = [
  'casco',
  'pechera',
  'guantes',
  'calzado'
];

export const equipmentTypes = [
  'Apoyo',
  'Neutralización',
  'Contención',
  'Refriega'
];

export const equipmentElements = [
  'Fuego',
  'Hielo',
  'Tierra',
  'Rayo',
  'Viento'
];

// --------------------------------------------------
// EFECTOS
// --------------------------------------------------

export function getEquipmentEffects(record) {
  return {
    efecto2: safe(
      getField(record, ['efecto_2_piezas'])
    ),
    efecto4: safe(
      getField(record, ['efecto_4_piezas'])
    )
  };
}

function getEffectTexts(record) {
  const effects = getEquipmentEffects(record);

  return [
    effects.efecto2,
    effects.efecto4
  ].filter(value => value !== '—');
}

// --------------------------------------------------
// DETECCIÓN AUTOMÁTICA DE ETIQUETAS
// --------------------------------------------------

export function getEquipmentEffectTags(record, field) {
  const effects = getEffectTexts(record);
  const text = normalize(effects.join(' '));

  if (field === 'tipo_efecto') {
    return equipmentTypes.filter(type =>
      text.includes(normalize(type))
    );
  }

  if (field === 'elemento') {
    return equipmentElements.filter(element =>
      text.includes(normalize(element))
    );
  }

  return [];
}

// --------------------------------------------------
// PIEZAS E IMÁGENES
// --------------------------------------------------

function getEquipmentPieces(record) {
  const pieces = Array.isArray(record?.piezas)
    ? record.piezas
    : [];

  return equipmentPieces
    .map(pieceName => {
      const piece = pieces.find(item =>
        normalize(getField(item, ['pieza'])) ===
        normalize(pieceName)
      );

      return piece
        ? {
            name: pieceName,
            effect: getField(piece, ['efecto_pieza']),
            location: getField(piece, ['donde_conseguir'])
          }
        : null;
    })
    .filter(Boolean);
}

function renderPiece(piece, equipmentName) {
  const image = imagePath(
    'equipamientos',
    equipmentName + '_' + piece.name
  );

  return (
    '<div class="equipment-piece">' +
      '<div class="equipment-piece-image-wrap">' +
        '<img class="equipment-piece-image" ' +
          'src="' + escapeHtml(image) + '" ' +
          'alt="' + escapeHtml(piece.name) + ' de ' +
            escapeHtml(equipmentName) + '" ' +
          'loading="lazy" ' +
          'onerror="this.style.display=\'none\';' +
            'this.nextElementSibling.style.display=\'flex\'">' +
        '<span class="equipment-piece-placeholder">' +
          'Sin imagen' +
        '</span>' +
      '</div>' +
      '<span class="equipment-piece-name">' +
        escapeHtml(piece.name) +
      '</span>' +
      (
        piece.effect
          ? '<span class="equipment-piece-detail">' +
              escapeHtml(piece.effect) +
            '</span>'
          : ''
      ) +
      (
        piece.location
          ? '<span class="equipment-piece-detail">' +
              escapeHtml(piece.location) +
            '</span>'
          : ''
      ) +
    '</div>'
  );
}

// --------------------------------------------------
// BONUS DEL EQUIPAMIENTO
// --------------------------------------------------

function renderEquipmentEffects(record) {
  const effects = getEquipmentEffects(record);

  let html = '';

  if (effects.efecto2 !== '—') {
    html +=
      '<div class="equipment-effect">' +
        '<span class="equipment-effect-title">' +
          'EFECTO DE 2 PIEZAS' +
        '</span>' +
        '<p>' +
          escapeHtml(effects.efecto2) +
        '</p>' +
      '</div>';
  }

  if (effects.efecto4 !== '—') {
    html +=
      '<div class="equipment-effect">' +
        '<span class="equipment-effect-title">' +
          'EFECTO DE 4 PIEZAS' +
        '</span>' +
        '<p>' +
          escapeHtml(effects.efecto4) +
        '</p>' +
      '</div>';
  }

  return html;
}

// --------------------------------------------------
// TARJETA DE EQUIPAMIENTO
// --------------------------------------------------

function renderEquipmentCard(record) {
  const name = getField(record, ['nombre', 'name']) || '';
  const pieces = getEquipmentPieces(record);

  const pieceCount = pieces.length;

  return (
    '<article class="equipment-card">' +

      '<div class="equipment-card-header">' +
        '<h3 class="equipment-name">' +
          escapeHtml(name) +
        '</h3>' +
        '<span class="equipment-piece-count">' +
          pieceCount + ' PIEZAS' +
        '</span>' +
      '</div>' +

      '<div class="equipment-pieces-grid">' +
        pieces.map(piece =>
          renderPiece(piece, name)
        ).join('') +
      '</div>' +

      '<div class="equipment-effects">' +
        renderEquipmentEffects(record) +
      '</div>' +

    '</article>'
  );
}

// --------------------------------------------------
// RENDERIZADO GENERAL
// --------------------------------------------------

export function renderEquipmentCards(rows) {
  if (!rows.length) {
    return (
      '<div class="empty">' +
        'No se encontraron equipamientos.' +
      '</div>'
    );
  }

  return (
    '<div class="equipment-grid">' +
      rows.map(renderEquipmentCard).join('') +
    '</div>'
  );
}
