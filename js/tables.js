
import {
  safe,
  escapeHtml
} from './database.js';

export function renderTable(rows, category) {
  if (!rows.length) {
    return '<div class="empty">Todavía no hay registros publicados en esta categoría.</div>';
  }

  const keys = [
    ...new Set(
      rows.flatMap(row =>
        row && typeof row === 'object'
          ? Object.keys(row)
          : ['valor']
      )
    )
  ];

  const head = keys.map(key =>
    '<th>' + escapeHtml(key.replaceAll('_', ' ')) + '</th>'
  ).join('');

  const body = rows.map(row =>
    '<tr>' +
      keys.map(key =>
        '<td>' +
          escapeHtml(
            safe(
              row && typeof row === 'object'
                ? row[key]
                : row
            )
          ) +
        '</td>'
      ).join('') +
    '</tr>'
  ).join('');

  return (
    '<div class="tablewrap">' +
      '<table>' +
        '<thead><tr>' + head + '</tr></thead>' +
        '<tbody>' + body + '</tbody>' +
      '</table>' +
    '</div>'
  );
}
