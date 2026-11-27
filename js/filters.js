import {
  categories,
  filterDefinitions
} from './config.js';

import {
  recordsFor,
  safe,
  escapeHtml,
  normalize,
  getField
} from './database.js';

import {
  getArtifactEffectTags
} from './artifacts.js';

import {
  getEquipmentEffectTags
} from './equipamientos.js';

// --------------------------------------------------
// DETECCIÓN AUTOMÁTICA DE MONSTERLINGS
// --------------------------------------------------

const monsterlingElements = [
  'Fuego',
  'Hielo',
  'Tierra',
  'Rayo',
  'Viento'
];

const monsterlingRoles = [
  'Apoyo',
  'Asesino',
  'Destructor',
  'Luchador'
];

const monsterlingStatistics = [
  {
    label: 'Índice de crítico',
    terms: ['indice de critico']
  },
  {
    label: 'Daño crítico',
    terms: ['dano critico']
  },
  {
    label: 'RES',
    terms: ['res', 'resistencia']
  },
  {
    label: 'ATQ',
    terms: ['atq', 'ataque']
  },
  {
    label: 'DEF',
    terms: ['def', 'defensa']
  },
  {
    label: 'PS',
    terms: ['ps', 'puntos de salud']
  }
];

function normalizeMonsterlingText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function containsMonsterlingTerm(text, term) {
  const normalizedText = normalizeMonsterlingText(text);
  const normalizedTerm = normalizeMonsterlingText(term);

  if (!normalizedText || !normalizedTerm) return false;

  return (' ' + normalizedText + ' ').includes(
    ' ' + normalizedTerm + ' '
  );
}

function getMonsterlingText(record) {
  const effect = getField(record, [
    'efecto de rango',
    'efecto_de_rango',
    'efecto'
  ]);

  const link = getField(record, [
    'enlace',
    'link'
  ]);

  return [effect, link]
    .filter(value =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ''
    )
    .join(' ');
}

function getMonsterlingEffectTags(record, field) {
  const text = getMonsterlingText(record);

  if (field === 'elemento') {
    return monsterlingElements.filter(element =>
      containsMonsterlingTerm(text, element)
    );
  }

  if (field === 'rol') {
    return monsterlingRoles.filter(role =>
      containsMonsterlingTerm(text, role)
    );
  }

  if (field === 'estadisticas') {
    return monsterlingStatistics
      .filter(statistic =>
        statistic.terms.some(term =>
          containsMonsterlingTerm(text, term)
        )
      )
      .map(statistic => statistic.label);
  }

  return [];
}

function hasMonsterlingLink(record) {
  const link = getField(record, ['enlace', 'link']);

  return (
    link !== undefined &&
    link !== null &&
    String(link).trim() !== ''
  );
}

function getMonsterlingLinkOptions(rows) {
  const options = [];

  if (rows.some(hasMonsterlingLink)) {
    options.push('Con enlace');
  }

  if (rows.some(record => !hasMonsterlingLink(record))) {
    options.push('Sin enlace');
  }

  return options;
}

// --------------------------------------------------
// ADMINISTRADOR DE FILTROS
// --------------------------------------------------

export function createFilterManager({
  getActive,
  filterState,
  onContentChange
}) {
  const $ = id => document.getElementById(id);

  function getFilterValue(record, definition) {
    return getField(
      record,
      definition.aliases || [definition.field]
    );
  }

  function getFilterDefinitions() {
    const active = getActive();

    if (filterDefinitions[active]) {
      return filterDefinitions[active];
    }

    const rows = recordsFor(
      categories.find(category => category.key === active)?.dataKey || active
    );

    if (!rows.length) return [];

    const ignored = [
      'nombre',
      'name',
      'id',
      'numero',
      'number',
      'enlace',
      'link'
    ];

    const fields = [...new Set(
      rows.flatMap(record =>
        record && typeof record === 'object'
          ? Object.keys(record)
          : []
      )
    )].filter(field =>
      !ignored.includes(normalize(field))
    );

    return fields.slice(0, 6).map(field => ({
      field,
      label: field.replace(/[_-]/g, ' '),
      aliases: [field]
    }));
  }

  // --------------------------------------------------
  // OPCIONES DE FILTROS
  // --------------------------------------------------

  function getEquipmentPieceCount(record) {
    return Array.isArray(record?.piezas)
      ? record.piezas.length
      : 0;
  }

  function getEquipmentPieceOptions(rows) {
    const counts = rows.map(getEquipmentPieceCount);
    const options = [];

    if (counts.includes(4)) {
      options.push('4 piezas');
    }

    if (counts.includes(2)) {
      options.push('2 piezas');
    }

    return options;
  }

  function getFilterOptions(rows, definition) {
    const active = getActive();

    // Filtros de Monsterlings.
    if (active === 'monsterlings') {
      if (definition.field === 'enlace') {
        return getMonsterlingLinkOptions(rows);
      }

      if (
        definition.field === 'elemento' ||
        definition.field === 'rol' ||
        definition.field === 'estadisticas'
      ) {
        const values = rows.flatMap(record =>
          getMonsterlingEffectTags(record, definition.field)
        );

        return [...new Set(values)].sort((a, b) =>
          a.localeCompare(b, 'es', {
            sensitivity: 'base'
          })
        );
      }
    }

    // Filtros de Equipamientos.
    if (active === 'equipamientos') {
      if (definition.field === 'piezas') {
        return getEquipmentPieceOptions(rows);
      }

      if (
        definition.field === 'tipo_efecto' ||
        definition.field === 'elemento'
      ) {
        const values = rows.flatMap(record =>
          getEquipmentEffectTags(record, definition.field)
        );

        return [...new Set(values)].sort((a, b) =>
          a.localeCompare(b, 'es', {
            sensitivity: 'base'
          })
        );
      }
    }

    // Filtros de Artefactos.
    if (
      active === 'artefactos' &&
      (
        definition.field === 'elemento' ||
        definition.field === 'efectos'
      )
    ) {
      const values = rows.flatMap(record =>
        getArtifactEffectTags(record, definition.field)
      );

      return [...new Set(values)].sort((a, b) =>
        a.localeCompare(b, 'es', {
          sensitivity: 'base'
        })
      );
    }

    const values = rows
      .map(record => getFilterValue(record, definition))
      .filter(value =>
        value !== undefined &&
        value !== null &&
        value !== ''
      )
      .map(value => safe(value));

    return [...new Set(values)].sort((a, b) =>
      a.localeCompare(b, 'es', {
        sensitivity: 'base',
        numeric: true
      })
    );
  }

  // --------------------------------------------------
  // FILTROS DE SELECCIÓN MÚLTIPLE
  // --------------------------------------------------

  function renderMultiFilter(definition, options, current) {
    const selected = Array.isArray(current) ? current : [];
    const count = selected.length;

    const buttonText = count === 0
      ? 'Todos'
      : count === 1
        ? selected[0]
        : count + ' seleccionados';

    return (
      '<div class="filter-item">' +
        '<label>' + escapeHtml(definition.label) + '</label>' +
        '<div class="multi-filter" data-multi-filter="' +
          escapeHtml(definition.field) + '">' +
          '<button type="button" class="multi-filter-button" aria-expanded="false">' +
            '<span>' + escapeHtml(buttonText) + '</span>' +
            '<span class="arrow">▼</span>' +
          '</button>' +
          '<div class="multi-filter-menu">' +
            options.map(option =>
              '<label class="multi-filter-option">' +
                '<input type="checkbox" data-multi-option="' +
                  escapeHtml(option) + '"' +
                  (selected.includes(option) ? ' checked' : '') +
                '>' +
                '<span>' + escapeHtml(option) + '</span>' +
              '</label>'
            ).join('') +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // --------------------------------------------------
  // RENDERIZAR FILTROS
  // --------------------------------------------------

  function render() {
    const active = getActive();

    const rows = recordsFor(
      categories.find(category => category.key === active)?.dataKey || active
    );

    const definitions = getFilterDefinitions();
    const controls = $('filterControls');

    if (!controls) return;

    if (!filterState[active]) {
      filterState[active] = {};
    }

    if (!rows.length || !definitions.length) {
      controls.innerHTML =
        '<span class="filter-empty">No hay filtros disponibles para esta categoría.</span>';

      if ($('resetFilters')) {
        $('resetFilters').style.display = 'none';
      }

      return;
    }

    if ($('resetFilters')) {
      $('resetFilters').style.display = '';
    }

    controls.innerHTML = definitions.map(definition => {
      const options = getFilterOptions(rows, definition);
      const current = filterState[active][definition.field] || '';

      if (!options.length) return '';

      if (options.length >= 3) {
        return renderMultiFilter(definition, options, current);
      }

      return (
        '<div class="filter-item">' +
          '<label for="filter-' + escapeHtml(definition.field) + '">' +
            escapeHtml(definition.label) +
          '</label>' +
          '<select id="filter-' + escapeHtml(definition.field) +
            '" data-filter-field="' + escapeHtml(definition.field) + '">' +
            '<option value="">Todos</option>' +
            options.map(option =>
              '<option value="' + escapeHtml(option) + '"' +
                (current === option ? ' selected' : '') +
              '>' + escapeHtml(option) + '</option>'
            ).join('') +
          '</select>' +
        '</div>'
      );
    }).join('');

    controls.querySelectorAll('select').forEach(select => {
      select.addEventListener('change', () => {
        filterState[active][select.dataset.filterField] = select.value;
        onContentChange();
      });
    });

    controls.querySelectorAll('.multi-filter').forEach(container => {
      const field = container.dataset.multiFilter;
      const button = container.querySelector('.multi-filter-button');
      const menu = container.querySelector('.multi-filter-menu');

      button.addEventListener('click', () => {
        const isOpen = menu.classList.toggle('open');
        button.setAttribute('aria-expanded', String(isOpen));
      });

      container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
          const selected = [
            ...container.querySelectorAll(
              'input[type="checkbox"]:checked'
            )
          ].map(input => input.dataset.multiOption);

          filterState[active][field] = selected;

          const label = button.querySelector('span');

          label.textContent = selected.length === 0
            ? 'Todos'
            : selected.length === 1
              ? selected[0]
              : selected.length + ' seleccionados';

          onContentChange();
        });
      });
    });
  }

  // --------------------------------------------------
  // APLICAR FILTROS
  // --------------------------------------------------

  function apply(rows) {
    const active = getActive();
    const definitions = getFilterDefinitions();
    const selected = filterState[active] || {};

    return rows.filter(record =>
      definitions.every(definition => {
        const selectedValue = selected[definition.field];

        if (
          selectedValue === undefined ||
          selectedValue === '' ||
          (
            Array.isArray(selectedValue) &&
            selectedValue.length === 0
          )
        ) {
          return true;
        }

        // Filtro de enlace de Monsterlings.
        if (
          active === 'monsterlings' &&
          definition.field === 'enlace'
        ) {
          const linkValue = hasMonsterlingLink(record)
            ? 'Con enlace'
            : 'Sin enlace';

          if (Array.isArray(selectedValue)) {
            return selectedValue.includes(linkValue);
          }

          return linkValue === selectedValue;
        }

        // Filtros automáticos de Elemento, Rol y Estadísticas.
        if (
          active === 'monsterlings' &&
          (
            definition.field === 'elemento' ||
            definition.field === 'rol' ||
            definition.field === 'estadisticas'
          )
        ) {
          const tags = getMonsterlingEffectTags(
            record,
            definition.field
          );

          if (Array.isArray(selectedValue)) {
            return selectedValue.some(value =>
              tags.includes(value)
            );
          }

          return tags.includes(selectedValue);
        }

        // Filtro de cantidad exacta de piezas de Equipamientos.
        if (
          active === 'equipamientos' &&
          definition.field === 'piezas'
        ) {
          const pieceCount = getEquipmentPieceCount(record);

          if (Array.isArray(selectedValue)) {
            return selectedValue.some(value =>
              (value === '4 piezas' && pieceCount === 4) ||
              (value === '2 piezas' && pieceCount === 2)
            );
          }

          if (selectedValue === '4 piezas') {
            return pieceCount === 4;
          }

          if (selectedValue === '2 piezas') {
            return pieceCount === 2;
          }

          return true;
        }

        // Filtros automáticos de tipo y elemento de Equipamientos.
        if (
          active === 'equipamientos' &&
          (
            definition.field === 'tipo_efecto' ||
            definition.field === 'elemento'
          )
        ) {
          const tags = getEquipmentEffectTags(
            record,
            definition.field
          );

          if (Array.isArray(selectedValue)) {
            return selectedValue.some(value =>
              tags.includes(value)
            );
          }

          return tags.includes(selectedValue);
        }

        // Filtros de elemento y efectos de Artefactos.
        if (
          active === 'artefactos' &&
          (
            definition.field === 'elemento' ||
            definition.field === 'efectos'
          )
        ) {
          const tags = getArtifactEffectTags(
            record,
            definition.field
          );

          if (Array.isArray(selectedValue)) {
            return selectedValue.some(value =>
              tags.includes(value)
            );
          }

          return tags.includes(selectedValue);
        }

        const recordValue = safe(
          getFilterValue(record, definition)
        );

        if (Array.isArray(selectedValue)) {
          return selectedValue.includes(recordValue);
        }

        return recordValue === selectedValue;
      })
    );
  }

  // --------------------------------------------------
  // RESTABLECER FILTROS
  // --------------------------------------------------

  function reset() {
    const active = getActive();

    filterState[active] = {};

    render();
    onContentChange();
  }

  // --------------------------------------------------
  // EVENTOS
  // --------------------------------------------------

  function init() {
    document.addEventListener('click', event => {
      document.querySelectorAll('.multi-filter').forEach(container => {
        if (!container.contains(event.target)) {
          const menu = container.querySelector('.multi-filter-menu');
          const button = container.querySelector('.multi-filter-button');

          if (menu) menu.classList.remove('open');

          if (button) {
            button.setAttribute('aria-expanded', 'false');
          }
        }
      });
    });

    const resetButton = $('resetFilters');

    if (resetButton) {
      resetButton.addEventListener('click', reset);
    }
  }

  return {
    render,
    apply,
    reset,
    init,
    getFilterDefinitions
  };
}
