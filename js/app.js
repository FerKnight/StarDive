
import {
  categories,
  searchableCategories
} from './config.js';

import {
  database,
  loadDatabase,
  recordsFor,
  safe,
  escapeHtml,
  normalize,
  getField,
  getDisplayRows,
  sortAlphabetically
} from './database.js';

import {
  createFilterManager
} from './filters.js';

import {
  renderCharacterCards
} from './characters.js';

import {
  renderArtifactCards
} from './artifacts.js';

import {
  renderMonsterCards
} from './monsterlings.js';

import {
  renderTable
} from './tables.js';

import {
  initPWA
} from './pwa.js';

// --------------------------------------------------
// CATEGORÍA ACTIVA DE LA SESIÓN
// --------------------------------------------------

const ACTIVE_CATEGORY_KEY = 'star-dive-active-category';

function getInitialActiveCategory() {
  try {
    const savedCategory = sessionStorage.getItem(
      ACTIVE_CATEGORY_KEY
    );

    const exists = categories.some(
      category => category.key === savedCategory
    );

    return exists ? savedCategory : 'personajes';

  } catch (error) {
    return 'personajes';
  }
}

function saveActiveCategory() {
  try {
    sessionStorage.setItem(
      ACTIVE_CATEGORY_KEY,
      active
    );
  } catch (error) {}
}

let active = getInitialActiveCategory();

const filterState = {};

const $ = id => document.getElementById(id);

// --------------------------------------------------
// PESTAÑAS
// --------------------------------------------------

function renderTabs() {
  const tabs = $('tabs');

  if (!tabs) return;

  tabs.innerHTML = categories.map(category =>
    '<button class="tab" type="button" data-key="' +
      escapeHtml(category.key) +
      '" aria-pressed="' +
      (active === category.key) +
      '">' +
      escapeHtml(category.label) +
    '</button>'
  ).join('');

  tabs.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
      active = button.dataset.key;

      saveActiveCategory();

      renderTabs();
      filterManager.render();
      renderContent();
    });
  });
}

// --------------------------------------------------
// FILTROS
// --------------------------------------------------

const filterManager = createFilterManager({
  getActive: () => active,
  filterState,
  onContentChange: renderContent
});

// --------------------------------------------------
// TARJETAS Y TABLAS
// --------------------------------------------------

function renderCards(rows, category) {
  if (category === 'personajes') {
    return renderCharacterCards(rows);
  }

  if (category === 'monsterlings') {
    return renderMonsterCards(rows);
  }

  return '<div class="empty">No hay tarjetas disponibles.</div>';
}

// --------------------------------------------------
// BÚSQUEDA GLOBAL
// --------------------------------------------------

function matchesQuery(record, query) {
  const content = normalize(JSON.stringify(record ?? ''));
  return content.includes(query);
}

function globalResults(query) {
  const groups = searchableCategories.map(category => {
    const dataKey = category.dataKey || category.key;

    const matched = recordsFor(dataKey).filter(record =>
      matchesQuery(record, query)
    );

    return {
      ...category,
      rows: category.key === 'monsterlings'
        ? matched
        : sortAlphabetically(matched)
    };
  });

  const characterGroup = groups.find(
    group => group.key === 'personajes'
  );

  const artifactGroup = groups.find(
    group => group.key === 'artefactos'
  );

  const matchedCharacters = characterGroup.rows;
  const artifactRows = artifactGroup.rows;

  // Si aparece un personaje, también se busca su artefacto vinculado.
  for (const character of matchedCharacters) {
    const characterName = normalize(
      getField(character, ['nombre', 'name'])
    );

    const linked = getField(character, [
      'artefacto',
      'artefacto_propio',
      'arma'
    ]);

    const linkedName = normalize(
      typeof linked === 'object'
        ? getField(linked, ['nombre', 'name'])
        : linked
    );

    for (const artifact of recordsFor('artefactos')) {
      const artifactName = normalize(
        getField(artifact, ['nombre', 'name'])
      );

      const owner = normalize(
        getField(artifact, [
          'personaje_propio',
          'personaje',
          'personaje_nombre'
        ])
      );

      const related =
        (linkedName && artifactName === linkedName) ||
        (characterName && owner === characterName);

      if (related && !artifactRows.includes(artifact)) {
        artifactRows.push(artifact);
      }
    }
  }

  // Si aparece un artefacto, también se incorpora su personaje asociado.
  for (const artifact of artifactRows.slice()) {
    const owner = normalize(
      getField(artifact, [
        'personaje_propio',
        'personaje',
        'personaje_nombre'
      ])
    );

    if (owner) {
      const character = recordsFor('personajes').find(record =>
        normalize(
          getField(record, ['nombre', 'name'])
        ) === owner
      );

      if (
        character &&
        !matchedCharacters.includes(character)
      ) {
        matchedCharacters.push(character);
      }
    }
  }

  for (const group of groups) {
    if (group.key !== 'monsterlings') {
      group.rows = sortAlphabetically(group.rows);
    }
  }

  return groups.filter(group => group.rows.length);
}

// --------------------------------------------------
// RESULTADOS DE BÚSQUEDA
// --------------------------------------------------

function renderGroup(group) {
  if (group.key === 'artefactos') {
    return (
      '<section class="result-group">' +
        '<h2 class="group-title">' +
          escapeHtml(group.label) +
        '</h2>' +
        renderArtifactCards(group.rows) +
      '</section>'
    );
  }

  const cards =
    group.key === 'personajes' ||
    group.key === 'monsterlings';

  return (
    '<section class="result-group">' +
      '<h2 class="group-title">' +
        escapeHtml(group.label) +
      '</h2>' +
      (
        cards
          ? renderCards(group.rows, group.key)
          : renderTable(group.rows, group.key)
      ) +
    '</section>'
  );
}

// --------------------------------------------------
// CONTENIDO PRINCIPAL
// --------------------------------------------------

function renderContent() {
  const search = $('search');
  const content = $('content');

  if (!search || !content) return;

  const query = normalize(search.value);

  // La búsqueda global no se limita por la categoría ni por sus filtros.
  if (query) {
    const groups = globalResults(query);

    content.innerHTML = groups.length
      ? groups.map(renderGroup).join('')
      : '<div class="empty">No se encontraron coincidencias en la base de datos.</div>';

    return;
  }

  const category = categories.find(item =>
    item.key === active
  );

  const dataKey = category?.dataKey || active;

  let rows = getDisplayRows(dataKey);

  rows = filterManager.apply(rows);

  if (active === 'artefactos') {
    content.innerHTML = renderArtifactCards(rows);
    return;
  }

  const renderCategory =
    active === 'personajes' ||
    active === 'monsterlings';

  content.innerHTML = renderCategory
    ? renderCards(rows, active)
    : renderTable(rows, active);
}

// --------------------------------------------------
// EVENTOS
// --------------------------------------------------

function initEvents() {
  const search = $('search');
  const content = $('content');

  if (search) {
    search.addEventListener('input', renderContent);
  }

  // Expansión de fichas de artefactos.
  if (content) {
    content.addEventListener('click', event => {
      const button = event.target.closest(
        '.artifact-card-button'
      );

      if (!button) return;

      const card = button.closest('.artifact-card');

      if (!card) return;

      const expanded = card.classList.toggle('expanded');

      button.setAttribute(
        'aria-expanded',
        String(expanded)
      );

      const icon = button.querySelector(
        '.artifact-expand-icon'
      );

      if (icon) {
        icon.textContent = expanded
          ? 'OCULTAR EFECTO ▲'
          : 'VER EFECTO ▼';
      }
    });
  }

  filterManager.init();
}

// --------------------------------------------------
// ESTADO DE LA BASE DE DATOS
// --------------------------------------------------

function renderDatabaseStatus() {
  const status = $('status');

  if (!status) return;

  const provisional =
    database.estado === 'provisional' ||
    database.provisional === true;

  if (provisional) {
    status.style.display = 'inline-flex';

    status.innerHTML =
      '<span class="dot"></span>' +
      '<span>Estructura inicial · esperando los datos reales de Google Sheets</span>';
  } else {
    status.style.display = 'none';
  }
}

// --------------------------------------------------
// INICIALIZACIÓN
// --------------------------------------------------

async function initApp() {
  initPWA();
  initEvents();

  try {
    await loadDatabase();

    renderTabs();
    filterManager.render();
    renderContent();
    renderDatabaseStatus();

  } catch (error) {
    const status = $('status');
    const content = $('content');

    if (status) {
      status.style.display = 'inline-flex';

      status.innerHTML =
        '<span class="dot"></span>' +
        '<span class="error">No se pudo cargar el JSON: ' +
        escapeHtml(error.message) +
        '</span>';
    }

    if (content) {
      content.innerHTML =
        '<div class="empty error">' +
          'Revisa que exista data/mongil_database.json y que contenga JSON válido.' +
        '</div>';
    }
  }
}

initApp();
