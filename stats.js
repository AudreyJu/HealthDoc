/* Insights page — chart, details and precise selection/deletion. */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const data = window.HealthDocData;
  const $ = (id) => document.getElementById(id);
  const historyList = $('historyList');
  const selectedIds = new Set();
  let records = [];

  function el(tag, className = '', content) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content !== undefined) element.textContent = String(content);
    return element;
  }

  function fieldText(record, field) {
    if (field === 'genetics') {
      if (!record.genetics) return record.geneticsCount === null ? 'Not recorded' : `${record.geneticsCount} selected (details not saved)`;
      return record.genetics.length ? record.genetics.map(g => data.fieldNames[g]).join(', ') : 'None selected';
    }
    if (field === 'age') return record.age === null ? 'Not recorded' : `${record.age} years`;
    const names = { environment: data.environmentNames, nutrition: data.nutritionNames, smoking: data.smokingNames, activity: data.activityNames }[field];
    return names[record[field]] || 'Not recorded';
  }

  const detailFields = [
    ['genetics', 'Family history'], ['environment', 'Environment'], ['nutrition', 'Eating habits'],
    ['age', 'Age'], ['smoking', 'Smoking'], ['activity', 'Activity']
  ];

  function createDetails(record, previous) {
    const details = el('details', 'history-details');
    details.append(el('summary', '', 'View details & comparison'));
    const content = el('div', 'details-content');
    const description = el('div', 'history-fields');
    for (const [field, label] of detailFields) {
      const fieldBox = el('div', 'history-field');
      fieldBox.append(el('span', 'history-field-name', label), el('strong', '', fieldText(record, field)));
      description.append(fieldBox);
    }
    content.append(description);
    const comparisonTitle = el('h4', '', previous ? 'Changes since previous assessment' : 'First assessment');
    content.append(comparisonTitle);
    const changes = el('ul', 'change-list');
    if (!previous) {
      changes.append(el('li', 'change-neutral', 'No previous assessment to compare with.'));
    } else {
      const delta = record.score - previous.score;
      if (delta !== 0) {
        changes.append(el('li', delta > 0 ? 'change-up' : 'change-down', `Attention score: ${delta > 0 ? '+' : ''}${delta} points`));
      }
      for (const [field, label] of detailFields) {
        if (field === 'genetics') {
          // Historical records lacked the selected genetics array; don't invent comparisons.
          if (!record.genetics || !previous.genetics) continue;
          const added = record.genetics.filter(g => !previous.genetics.includes(g));
          const removed = previous.genetics.filter(g => !record.genetics.includes(g));
          added.forEach(g => changes.append(el('li', 'change-up', `Family history added: ${data.fieldNames[g]}`)));
          removed.forEach(g => changes.append(el('li', 'change-down', `Family history removed: ${data.fieldNames[g]}`)));
          continue;
        }
        const previousValue = fieldText(previous, field);
        const currentValue = fieldText(record, field);
        if (previousValue !== currentValue) {
          changes.append(el('li', 'change-neutral', `${label}: ${previousValue} → ${currentValue}`));
        }
      }
      if (!changes.children.length) changes.append(el('li', 'change-neutral', 'No recorded differences compared with the previous assessment.'));
    }
    content.append(changes);
    details.append(content);
    return details;
  }

  function renderHistory() {
    historyList.replaceChildren();
    records.forEach((record, index) => {
      const level = data.scoreLevel(record.score);
      const li = el('li', 'history-item');
      const row = el('div', 'history-row');
      const left = el('div', 'history-row-left');
      const checkbox = el('input', 'entry-checkbox');
      checkbox.type = 'checkbox';
      checkbox.checked = selectedIds.has(record.id);
      checkbox.setAttribute('aria-label', `Select assessment on ${data.displayDate(record.date)}, score ${record.score}`);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) selectedIds.add(record.id);
        else selectedIds.delete(record.id);
        updateSelection();
      });
      const heading = el('div', 'history-row-title');
      heading.append(el('strong', '', data.displayDate(record.date)), el('span', '', `Assessment ${index + 1}`));
      left.append(checkbox, heading);
      const right = el('div', 'history-row-right');
      const score = el('div', 'history-score');
      score.append(el('strong', '', record.score), el('span', '', ' / 11'));
      const badge = el('span', `status-pill ${level.css}`, level.name);
      right.append(score, badge);
      row.append(left, right);
      li.append(row, createDetails(record, index > 0 ? records[index - 1] : null));
      historyList.append(li);
    });
    updateSelection();
  }

  function updateSelection() {
    const count = records.filter(r => selectedIds.has(r.id)).length;
    $('selectedCount').textContent = count ? `(${count})` : '';
    $('deleteSelected').disabled = count === 0;
    $('deleteSelected').textContent = count ? `Delete selected (${count})` : 'Delete selected';
    $('selectAll').checked = records.length > 0 && count === records.length;
    $('selectAll').indeterminate = count > 0 && count < records.length;
  }

  function svg(tag, attributes = {}, textValue) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
    if (textValue !== undefined) node.textContent = String(textValue);
    return node;
  }

  function renderChart() {
    const chart = $('scoreChart');
    chart.replaceChildren();
    const width = Math.max(780, chart.parentElement.clientWidth - 2, 110 + (records.length - 1) * 88);
    const height = 310;
    const left = 48, right = 36, top = 18, bottom = 52;
    const plotHeight = height - top - bottom;
    const plotWidth = width - left - right;
    chart.style.width = `${width}px`;
    const picture = svg('svg', { viewBox: `0 0 ${width} ${height}`, width, height, role: 'img', 'aria-label': `Attention scores from ${records.length} check-ins: ${records.map(r => r.score).join(', ')}` });
    const y = value => top + (11 - value) * plotHeight / 11;
    const x = index => records.length === 1
      ? left + (chart.parentElement.clientWidth < 780 ? 118 : plotWidth / 2)
      : left + index * plotWidth / (records.length - 1);

    const bands = [
      [7.5, 11, '#fff2ef'], [3.5, 7.5, '#fff9e9'], [0, 3.5, '#eaf8f4']
    ];
    bands.forEach(([start, end, fill]) => {
      picture.append(svg('rect', { x: left, y: y(end), width: plotWidth, height: y(start) - y(end), fill, rx: 3 }));
    });
    for (let i = 0; i <= 11; i += 2) {
      const yPos = y(i);
      picture.append(svg('line', { x1: left, y1: yPos, x2: width - right, y2: yPos, stroke: '#dfe8ef', 'stroke-width': 1 }));
      picture.append(svg('text', { x: left - 13, y: yPos + 4, 'text-anchor': 'end', class: 'svg-axis-label' }, i));
    }
    const points = records.map((record, index) => [x(index), y(record.score)]);
    if (points.length > 1) {
      const path = points.map(([px, py], index) => `${index ? 'L' : 'M'} ${px} ${py}`).join(' ');
      picture.append(svg('path', { d: path, stroke: '#2c8f98', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    }
    const labelStride = Math.max(1, Math.ceil(records.length / 8));
    records.forEach((record, index) => {
      const [px, py] = points[index];
      const color = record.score <= 3 ? '#19a98e' : record.score <= 7 ? '#f0a535' : '#e66b69';
      picture.append(svg('circle', { cx: px, cy: py, r: 10, fill: '#fff', opacity: 0.9 }));
      const point = svg('circle', { cx: px, cy: py, r: 6, fill: color, stroke: '#fff', 'stroke-width': 2 });
      point.append(svg('title', {}, `${data.displayDate(record.date)}: ${record.score} / 11`));
      picture.append(point);
      if (index % labelStride === 0 || index === records.length - 1) {
        picture.append(svg('text', { x: px, y: height - 22, 'text-anchor': 'middle', class: 'svg-axis-label' }, data.displayDate(record.date)));
      }
    });
    chart.append(picture);
  }

  function render() {
    const state = data.readHistory();
    $('statsError').hidden = true;
    if (state.error) {
      $('statsError').textContent = state.error;
      $('statsError').hidden = false;
    }
    records = data.sortHistory(state.records);
    selectedIds.clear();
    $('emptyState').hidden = records.length !== 0 || Boolean(state.error);
    $('statsDashboard').hidden = records.length === 0;
    if (!records.length) return;

    const sum = records.reduce((acc, record) => acc + record.score, 0);
    const latest = records[records.length - 1];
    const level = data.scoreLevel(latest.score);
    $('totalAssessments').textContent = records.length;
    $('averageScore').textContent = (sum / records.length).toFixed(1);
    $('latestBadge').className = `status-pill ${level.css}`;
    $('latestBadge').textContent = level.name;
    $('latestDate').textContent = data.displayDate(latest.date);
    renderChart();
    renderHistory();
  }

  $('selectAll').addEventListener('change', (event) => {
    selectedIds.clear();
    if (event.target.checked) records.forEach(record => selectedIds.add(record.id));
    historyList.querySelectorAll('.entry-checkbox').forEach(checkbox => { checkbox.checked = event.target.checked; });
    updateSelection();
  });

  $('deleteSelected').addEventListener('click', () => {
    const count = selectedIds.size;
    if (!count) return;
    if (!confirm(`Delete ${count} selected assessment${count > 1 ? 's' : ''}? This cannot be undone.`)) return;
    // Delete by stable record ID, not by sorted visual position.
    const surviving = records.filter(record => !selectedIds.has(record.id));
    if (!data.saveHistory(surviving)) {
      $('statsError').textContent = 'Could not save these changes. Check your browser storage permissions.';
      $('statsError').hidden = false;
      return;
    }
    render();
  });

  $('clearHistory').addEventListener('click', () => {
    if (!confirm('Delete ALL assessments from this browser? This cannot be undone.')) return;
    if (!data.saveHistory([])) {
      $('statsError').textContent = 'Could not clear history. Check your browser storage permissions.';
      $('statsError').hidden = false;
      return;
    }
    render();
  });

  $('exportHistory').addEventListener('click', () => {
    const backup = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(backup);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `healthdoc-history-${data.localToday()}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  render();
});
