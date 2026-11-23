
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

  function getEquipmentBonusOptions(rows) {
    const options = [];

    if (rows.some(record =>
      safe(getField(record, ['efecto_2_piezas'])) !== '—'
    )) {
      options.push('Efecto de 2 piezas');
    }

    if (rows.some(record =>
      safe(getField(record, ['efecto_4_piezas'])) !== '—'
    )) {
      options.push('Efecto de 4 piezas');
    }

    return options;
  }

  function getFilterOptions(rows, definition) {
    const active = getActive();

    if (active === 'equipamientos') {
      if (definition.field === 'bonus_piezas') {
        return getEquipmentBonusOptions(rows);
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

      // Tres o más opciones: selección múltiple.
      // Una o dos opciones: lista desplegable simple.
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

        // Filtros de bonus de Equipamientos.
        if (
          active === 'equipamientos' &&
          definition.field === 'bonus_piezas'
        ) {
          const effects = [
            safe(getField(record, ['efecto_2_piezas'])),
            safe(getField(record, ['efecto_4_piezas']))
          ];

          const available = [];

          if (effects[0] !== '—') {
            available.push('Efecto de 2 piezas');
          }

          if (effects[1] !== '—') {
            available.push('Efecto de 4 piezas');
          }

          if (Array.isArray(selectedValue)) {
            return selectedValue.some(value =>
              available.includes(value)
            );
          }

          return available.includes(selectedValue);
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
