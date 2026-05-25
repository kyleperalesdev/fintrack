const BASE = '/api/entries';
const IMPORT_BASE = '/api/import';
const CATEGORIES_BASE = '/api/categories';

export const getEntries = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE}${qs ? '?' + qs : ''}`).then(r => r.json());
};

export const getSummary = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE}/summary${qs ? '?' + qs : ''}`).then(r => r.json());
};

export const createEntry = (data) =>
  fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json());

export const updateEntry = (id, data) =>
  fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json());

export const deleteEntry = (id) =>
  fetch(`${BASE}/${id}`, { method: 'DELETE' }).then(r => r.json());

export const parseImportFile = (file) => {
  const form = new FormData();
  form.append('file', file);
  return fetch(`${IMPORT_BASE}/parse`, { method: 'POST', body: form }).then(r => r.json());
};

export const checkDuplicates = (transactions, mappings) =>
  fetch(`${IMPORT_BASE}/check-duplicates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactions, mappings }),
  }).then(r => r.json());

export const confirmImport = (transactions, mappings) =>
  fetch(`${IMPORT_BASE}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactions, mappings }),
  }).then(r => r.json());

export const getCategories = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${CATEGORIES_BASE}${qs ? '?' + qs : ''}`).then(r => r.json());
};

export const createCategory = (data) =>
  fetch(CATEGORIES_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json());

export const updateCategory = (id, data) =>
  fetch(`${CATEGORIES_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json());

export const deleteCategory = (id) =>
  fetch(`${CATEGORIES_BASE}/${id}`, { method: 'DELETE' }).then(r => r.json());
