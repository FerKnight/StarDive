
import {
  safe,
  escapeHtml,
  normalize,
  getField,
  imagePath
} from './database.js';

// --------------------------------------------------
// ARTEFACTOS DEL PASE
// --------------------------------------------------

const PREMIUM_ARTIFACTS = [
  'halo celestial de vida',
  'lucha frenetica',
  'oscuridad opresiva',
  'temblores tronidos'
];

function getArtifactName(record) {
  return normalize(
    getField(record, ['nombre', 'name']) ?? ''
  );
}

export function isPremiumArtifact(record) {
  return PREMIUM_ARTIFACTS.includes(
    getArtifactName(record)
  );
}

// --------------------------------------------------
// SEPARACIÓN DE ARTEFACTOS
// --------------------------------------------------

export function splitArtifactGroups(rows) {
  const premium = [];
  const general = [];

  for (const record of rows) {
    if (isPremiumArtifact(record)) {
      premium.push(record);
    } else {
      general.push(record);
    }
  }

  // Orden fijo de los cuatro artefactos del pase.
  premium.sort((a, b) => {
    return PREMIUM_ARTIFACTS.indexOf(getArtifactName(a)) -
      PREMIUM_ARTIFACTS.indexOf(getArtifactName(b));
  });

  // Orden alfabético para los demás artefactos.
  general.sort((a, b) => {
    const nameA = getField(a, ['nombre', 'name']) ?? '';
    const nameB = getField(b, ['nombre', 'name']) ?? '';

    return String(nameA).localeCompare(
      String(nameB),
      'es',
      {
        sensitivity: 'base',
        numeric: true
      }
    );
  });

  return { premium, general };
}

export function prioritizePremiumArtifacts(rows) {
  const groups = splitArtifactGroups(rows);

  return [...groups.premium, ...groups.general];
}

// --------------------------------------------------
// EFECTOS DE ARTEFACTOS
// --------------------------------------------------

function getArtifactEffect(record) {
  return String(getField(record, [
    'efecto de habilidad',
    'efecto_habilidad',
    'efecto_de_habilidad',
    'descripcion_habilidad',
    'descripción_habilidad',
    'habilidad',
    'descripcion_efecto',
    'descripción_efecto',
    'skill_effect',
    'effect_description'
  ]) || '');
}

// Conserva los separadores para detectar correctamente palabras completas.
function normalizeEffectText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function containsEffectTerm(text, term) {
  const normalizedText = normalizeEffectText(text);
  const normalizedTerm = normalizeEffectText(term);

  if (!normalizedTerm) return false;

  const escaped = normalizedTerm.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );

  const expression = new RegExp(
    '(^|\\s)' + escaped + '(\\s|$)',
    'i'
  );

  return expression.test(normalizedText);
}

export function getArtifactEffectTags(record, field) {
  const effect = getArtifactEffect(record);
  const tags = [];

  if (field === 'elemento') {
    const elements = [
      ['Fuego', ['fuego']],
      ['Hielo', ['hielo']],
      ['Viento', ['viento']],
      ['Tierra', ['tierra']],
      ['Rayo', ['rayo', 'electrico', 'electricidad']]
    ];

    for (const [label, terms] of elements) {
      if (terms.some(term => containsEffectTerm(effect, term))) {
        tags.push(label);
      }
    }
  }

  if (field === 'efectos') {
    const types = [
      ['Apoyo', ['apoyo']],
      ['Contención', ['contencion']],
      ['Neutralización', ['neutralizacion']],
      ['Refriega', ['refriega']]
    ];

    for (const [label, terms] of types) {
      if (terms.some(term => containsEffectTerm(effect, term))) {
        tags.push(label);
      }
    }
  }

  return tags;
}

// --------------------------------------------------
// RAREZA
// --------------------------------------------------

function rarityClass(record) {
  const grade = String(
    getField(record, ['grado', 'rareza', 'rarity']) ?? ''
  ).trim();

  return grade === '5'
    ? 'rarity-5'
    : grade === '4'
      ? 'rarity-4'
      : '';
}

// --------------------------------------------------
// TARJETAS
// --------------------------------------------------

export function renderArtifactCard(record, index) {
  const name = getField(record, ['nombre', 'name']) ?? 'Sin nombre';

  const role = getField(record, ['rol', 'role']);

  const substat = getField(record, [
    'subestadistica',
    'sub estadistica',
    'sub_estadistica',
    'subestadística',
    'sub_stat',
    'substat'
  ]);

  const effect = getArtifactEffect(record);
  const image = imagePath('artefactos', name);
  const id = 'artifact-' + index;

  return (
    '<article class="artifact-card ' + rarityClass(record) + '" data-artifact-card>' +
      '<button class="artifact-card-button" type="button" ' +
        'aria-expanded="false" aria-controls="' + id + '">' +
        '<div class="artifact-image-wrap">' +
          '<img class="artifact-image" ' +
            'src="' + escapeHtml(image) + '" ' +
            'alt="' + escapeHtml(name) + '" ' +
            'loading="lazy" ' +
            'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
          '<div class="artifact-image-placeholder">Sin imagen</div>' +
        '</div>' +
        '<div class="artifact-info">' +
          '<div class="artifact-name">' + escapeHtml(name) + '</div>' +
          (role !== undefined && role !== null && role !== ''
            ? '<div class="artifact-meta">' +
                escapeHtml(safe(role)) +
              '</div>'
            : '') +
          (substat !== undefined && substat !== null && substat !== ''
            ? '<div class="artifact-meta">' +
                escapeHtml(safe(substat)) +
              '</div>'
            : '') +
          '<span class="artifact-expand-icon">VER EFECTO ▼</span>' +
        '</div>' +
      '</button>' +
      '<div class="artifact-effect" id="' + id + '">' +
        '<span class="artifact-effect-title">Efecto de habilidad</span>' +
        escapeHtml(effect || 'Sin descripción disponible.') +
      '</div>' +
    '</article>'
  );
}

// --------------------------------------------------
// SECCIONES DEL LISTADO
// --------------------------------------------------

function renderArtifactSection(title, rows, startIndex = 0) {
  if (!rows.length) return '';

  return (
    '<section class="artifact-section">' +

      '<h2 class="artifact-section-title">' +
        escapeHtml(title) +
      '</h2>' +

      '<div class="artifact-grid">' +
        rows.map((record, index) =>
          renderArtifactCard(record, startIndex + index)
        ).join('') +
      '</div>' +

    '</section>'
  );
}

// --------------------------------------------------
// RENDERIZADO GENERAL
// --------------------------------------------------

export function renderArtifactCards(rows) {
  if (!rows.length) {
    return '<div class="empty">Todavía no hay registros publicados en esta categoría.</div>';
  }

  const groups = splitArtifactGroups(rows);

  return (
    '<div class="artifact-sections">' +

      renderArtifactSection(
        'Artefactos del pase',
        groups.premium
      ) +

      renderArtifactSection(
        'Artafctos',
        groups.general,
        groups.premium.length
      ) +

    '</div>'
  );
}
