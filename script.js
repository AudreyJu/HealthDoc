/* Assessment page */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const data = window.HealthDocData;
  const form = document.getElementById('healthForm');
  const dateInput = document.getElementById('assessmentDate');
  const message = document.getElementById('formMessage');
  const result = document.getElementById('resultsCard');
  dateInput.value = data.localToday();
  dateInput.max = data.localToday();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    message.hidden = true;
    message.classList.remove('is-success');
    if (!form.reportValidity()) return;

    const genetics = [...form.querySelectorAll('input[name="genetics"]:checked')].map(input => input.value);
    const environment = document.getElementById('environment').value;
    const nutrition = document.getElementById('nutrition').value;
    const age = Number(document.getElementById('age').value);
    const smoking = document.getElementById('smoking').value;
    const activity = document.getElementById('activity').value;
    const date = data.toISODate(dateInput.value);

    if (!Number.isInteger(age) || age < 1 || age > 120 || !date || date > data.localToday()) {
      message.textContent = 'Please check the age and assessment date before continuing.';
      message.hidden = false;
      return;
    }

    let score = genetics.length;
    const tips = [];
    if (genetics.includes('Diabetes')) tips.push('With a family history of diabetes, ask a healthcare professional which checks, if any, are appropriate for you.');
    if (genetics.includes('Hypertension')) tips.push('Consider checking your blood pressure and choosing lower-salt foods more often.');
    if (genetics.includes('Cardiovascular')) tips.push('Support your heart with regular movement, balanced meals and avoiding smoking.');
    if (genetics.includes('Lactose')) tips.push('If certain foods cause discomfort, keep note of your symptoms and discuss them with a professional.');

    if (environment === 'Urban') {
      score += 1;
      tips.push('Where traffic is heavy, choosing a park or a quieter route can make outdoor activity more pleasant.');
    }
    if (environment === 'Rural') tips.push('If practical and safe, make the most of nearby walking or cycling routes.');

    if (nutrition === 'Processed') {
      score += 2;
      tips.push('Try swapping one highly processed snack for fruit, vegetables or another minimally processed option.');
    }
    if (nutrition === 'Mediterranean' || nutrition === 'PlantBased') score -= 1;

    if (age >= 50) {
      score += 1;
      tips.push('Ask a healthcare professional about age-appropriate check-ups and prevention.');
    } else if (age < 18) {
      tips.push('Build balanced routines around food, sleep, play and movement with support from a trusted adult.');
    }

    if (smoking !== 'No') {
      score += 2;
      tips.push('Reducing or stopping tobacco use can benefit your health. Ask for help if you want support.');
    }
    if (activity === 'Low') {
      score += 1;
      tips.push('Try adding short, enjoyable movement breaks to your day. Start at a pace that suits you.');
    }
    if (activity === 'High') score -= 1;

    score = Math.max(0, Math.min(11, score));
    if (!tips.length) tips.push('Keep building habits that work for you: varied meals, movement, rest and regular medical care when appropriate.');
    const level = data.scoreLevel(score);
    const descriptions = {
      'level-low': 'This checklist identified relatively few topics for reflection. Your score does not measure actual health or disease risk.',
      'level-medium': 'A few habits or circumstances may be worth discussing or adjusting. The score is an illustrative checklist result.',
      'level-high': 'Several checklist factors are present. Consider speaking with a healthcare professional for personalized guidance.'
    };

    document.getElementById('scoreValue').textContent = score;
    const badge = document.getElementById('riskBadge');
    badge.textContent = level.name;
    badge.className = `status-pill ${level.css}`;
    document.getElementById('scoreDescription').textContent = descriptions[level.css];
    document.getElementById('scoreFill').style.width = `${(score / 11) * 100}%`;

    const list = document.getElementById('recommendationsList');
    list.replaceChildren();
    tips.forEach((tip, index) => {
      const li = document.createElement('li');
      li.className = 'tip-item';
      const number = document.createElement('span');
      number.className = 'tip-number';
      number.textContent = String(index + 1).padStart(2, '0');
      const text = document.createElement('p');
      text.textContent = tip;
      li.append(number, text);
      list.append(li);
    });
    result.hidden = false;

    const state = data.readHistory();
    if (state.error) {
      message.textContent = `${state.error} Your result is visible, but it was not saved.`;
      message.hidden = false;
    } else {
      const record = {
        id: data.createId(), date, createdAt: new Date().toISOString(), score,
        genetics, geneticsCount: genetics.length, environment, nutrition, age, smoking, activity
      };
      if (!data.saveHistory([...state.records, record])) {
        message.textContent = 'Your result is visible, but it could not be saved in this browser. Check storage permissions or available space.';
        message.hidden = false;
      } else {
        message.textContent = 'Assessment saved to this browser. You can compare it in My insights.';
        message.classList.add('is-success');
        message.hidden = false;
      }
    }
    result.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  });
});

/* Home, assessment, consent and documents: local-only demonstration. */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const $ = id => document.getElementById(id);
  const pageIds = ['homePage', 'testPage', 'consentPage', 'documentsPage'];

  function showPage(pageId) {
    const selected = pageIds.includes(pageId) ? pageId : 'homePage';
    for (const id of pageIds) $(id).hidden = id !== selected;
    document.querySelectorAll('.main-nav [data-page]').forEach(link => {
      const active = link.dataset.page === selected;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  const route = () => showPage(location.hash.slice(1));
  window.addEventListener('hashchange', route);
  document.querySelectorAll('a[data-page]').forEach(link => {
    link.addEventListener('click', () => {
      if (location.hash === `#${link.dataset.page}`) showPage(link.dataset.page);
    });
  });
  route();

  function showMessage(id, text, success = false) {
    const node = $(id);
    node.textContent = text;
    node.classList.toggle('is-success', success);
    node.hidden = false;
  }

  // Consent preferences: a model of user choice, NOT a medical data-sharing system.
  const consentKey = 'healthDocConsent';
  const general = $('consentGeneral');
  const authorizedInputs = [...document.querySelectorAll('input[name="authorized"]')];
  const provider = $('specificDoctor');
  function updateConsentUI() {
    const enabled = general.checked;
    authorizedInputs.forEach(input => { input.disabled = !enabled; });
    provider.disabled = !enabled;
  }
  try {
    const raw = localStorage.getItem(consentKey);
    if (raw) {
      const stored = JSON.parse(raw);
      general.checked = stored.enabled === true;
      authorizedInputs.forEach(input => { input.checked = general.checked && Array.isArray(stored.authorized) && stored.authorized.includes(input.value); });
      provider.value = general.checked && typeof stored.provider === 'string' ? stored.provider : '';
    }
  } catch (_) { showMessage('consentStatus', 'Saved preferences could not be loaded. You can set them again.'); }
  updateConsentUI();
  general.addEventListener('change', () => {
    if (!general.checked) {
      authorizedInputs.forEach(input => { input.checked = false; });
      provider.value = '';
    }
    updateConsentUI();
  });
  $('consentForm').addEventListener('submit', event => {
    event.preventDefault();
    const config = {
      enabled: general.checked,
      authorized: general.checked ? authorizedInputs.filter(i => i.checked).map(i => i.value) : [],
      provider: general.checked ? provider.value.trim() : ''
    };
    try {
      localStorage.setItem(consentKey, JSON.stringify(config));
      showMessage('consentStatus', 'Demo preferences saved on this browser only. No information has been shared with anyone.', true);
    } catch (_) {
      showMessage('consentStatus', 'Could not save preferences. Please check browser storage permissions.');
    }
  });
  $('revokeConsent').addEventListener('click', () => {
    try {
      localStorage.removeItem(consentKey);
      $('consentForm').reset();
      updateConsentUI();
      showMessage('consentStatus', 'Demo preferences cleared from this browser. No data-sharing permissions were ever granted.', true);
    } catch (_) { showMessage('consentStatus', 'Could not clear preferences. Please check browser storage permissions.'); }
  });

  // Documents are stored as actual File / Blob objects in IndexedDB, locally.
  // There is no upload endpoint, account or encrypted storage.
  const DB_NAME = 'healthDocLocalFiles';
  const STORE = 'documents';
  const MAX_FILE_SIZE = 15 * 1024 * 1024;
  const allowedExt = /\.(pdf|png|jpe?g|webp|txt|docx?)$/i;
  let dbPromise = null;
  let documentItems = [];

  function dbOpen() {
    if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB is not supported by this browser.'));
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) {
          request.result.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Could not open local document storage.'));
      request.onblocked = () => reject(new Error('Document storage is blocked. Close other tabs and reload.'));
    }).catch(error => { dbPromise = null; throw error; });
    return dbPromise;
  }
  async function dbRequest(mode, action) {
    const db = await dbOpen();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      let value;
      const request = action(tx.objectStore(STORE));
      request.onsuccess = () => { value = request.result; };
      tx.oncomplete = () => resolve(value);
      tx.onerror = () => reject(tx.error || new Error('Unable to access local storage.'));
      tx.onabort = () => reject(tx.error || new Error('Document operation was cancelled.'));
    });
  }
  const getAll = () => dbRequest('readonly', store => store.getAll());
  const putDocument = doc => dbRequest('readwrite', store => store.put(doc));
  const getDocument = id => dbRequest('readonly', store => store.get(id));
  const removeDocument = id => dbRequest('readwrite', store => store.delete(id));

  function node(tag, className = '', text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = String(text);
    return el;
  }
  function formatSize(size) {
    return size >= 1048576 ? `${(size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.ceil(size / 1024))} KB`;
  }
  function renderDocuments() {
    const query = $('docSearch').value.toLowerCase().trim();
    const filtered = documentItems.filter(doc => `${doc.name} ${doc.label} ${doc.fileName}`.toLowerCase().includes(query));
    const list = $('documentList');
    list.replaceChildren();
    $('documentCount').textContent = documentItems.length;
    if (!filtered.length) {
      list.append(node('p', 'doc-empty', query ? 'No documents match that search.' : 'No documents yet. Add your first file above.'));
      return;
    }
    for (const doc of filtered) {
      const card = node('article', 'doc-row');
      const graphic = node('span', 'doc-icon', '▤');
      graphic.setAttribute('aria-hidden', 'true');
      const body = node('div', 'doc-body');
      const heading = node('strong', 'doc-title', doc.name);
      const details = node('p', 'doc-meta', `${doc.fileName} · ${formatSize(doc.size || 0)} · ${window.HealthDocData.displayDate(doc.date)}`);
      const badge = node('span', `doc-tag tag-${(doc.label || '').toLowerCase().replace(/[^a-z]/g, '')}`, doc.label);
      body.append(heading, details, badge);
      const actions = node('div', 'doc-actions');
      const download = node('button', 'button button-secondary', 'Download');
      download.type = 'button';
      download.setAttribute('aria-label', `Download ${doc.name}`);
      download.addEventListener('click', async () => {
        try {
          const stored = await getDocument(doc.id);
          if (!stored?.file) throw new Error('The file could not be found.');
          const url = URL.createObjectURL(stored.file);
          const a = document.createElement('a');
          a.href = url;
          a.download = stored.fileName || 'document';
          document.body.append(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
        } catch (error) { showMessage('docStatus', `Download failed: ${error.message}`); }
      });
      const del = node('button', 'button button-text-danger', 'Delete');
      del.type = 'button';
      del.setAttribute('aria-label', `Delete ${doc.name}`);
      del.addEventListener('click', async () => {
        if (!confirm(`Permanently remove "${doc.name}" from this browser?`)) return;
        try { await removeDocument(doc.id); await refreshDocuments(); showMessage('docStatus', 'Document deleted locally.', true); }
        catch (error) { showMessage('docStatus', `Delete failed: ${error.message}`); }
      });
      actions.append(download, del);
      card.append(graphic, body, actions);
      list.append(card);
    }
  }
  async function refreshDocuments() {
    const all = await getAll();
    documentItems = all.map(({ id, name, label, date, fileName, size }) => ({ id, name, label, date, fileName, size }))
      .sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));
    renderDocuments();
  }
  $('docSearch').addEventListener('input', renderDocuments);
  $('docFile').addEventListener('change', () => {
    const selected = $('docFile').files[0];
    $('fileBtnText').textContent = selected ? selected.name : 'Choose a PDF, image or text file';
  });
  $('docForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (!$('docForm').reportValidity()) return;
    const file = $('docFile').files[0];
    const name = $('docName').value.trim();
    const label = $('docLabel').value;
    if (!name || !file) return showMessage('docStatus', 'Choose a name and file.');
    if (file.size > MAX_FILE_SIZE) return showMessage('docStatus', 'File too large. Maximum size: 15 MB.');
    if (!allowedExt.test(file.name)) return showMessage('docStatus', 'Choose a PDF, image, Word document or text file.');
    const submit = $('addDocumentBtn');
    submit.disabled = true;
    try {
      await putDocument({
        id: window.HealthDocData.createId(), name, label, date: window.HealthDocData.localToday(),
        fileName: file.name, size: file.size, file
      });
      $('docForm').reset();
      $('fileBtnText').textContent = 'Choose a PDF, image or text file';
      await refreshDocuments();
      showMessage('docStatus', 'Document saved in this browser. It is not uploaded or encrypted by HealthDoc.', true);
    } catch (error) {
      showMessage('docStatus', `Document not saved: ${error.message}. Check private mode and available browser storage.`);
    } finally { submit.disabled = false; }
  });
  refreshDocuments().catch(error => {
    $('documentList').replaceChildren(node('p', 'doc-empty', 'Document storage is unavailable in this browser.'));
    showMessage('docStatus', `Could not load document library: ${error.message}`);
  });
});
