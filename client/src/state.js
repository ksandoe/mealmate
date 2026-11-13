// Shared application state and small helpers for MealMate views.

export const state = {
  currentView: 'find-meals',
  profile: null,                       // loaded from the API at startup
  searchIngredients: [],
  filters: {
    maxBudget: '',
    maxCookTime: '',
    dietary: [],
    equipment: ['microwave', 'air-fryer', 'stove']
  },
  pantry: [],
  shoppingList: [],
  deals: [],
  lastResults: [],
  selectedRecipeId: null
};

// Escape user-supplied text before injecting it into innerHTML.
export const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

// Case-insensitive name comparison used across views.
export const normalizeName = (name) => String(name).trim().toLowerCase();

// Find the best deal for an item name, if one exists.
export const findDeal = (itemName) =>
  state.deals.find(deal => normalizeName(deal.itemName) === normalizeName(itemName));

// Show a validation message under a form field.
export const showFieldError = (elementId, message) => {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.hidden = !message;
};

// App-level error banner for API failures.
export const showAppError = (err) => {
  console.error(err);
  const el = document.getElementById('app-error');
  if (!el) return;
  el.textContent = `Something went wrong: ${err.message}. Is the API running on port 3001?`;
  el.hidden = false;
  setTimeout(() => { el.hidden = true; }, 6000);
};

// Views can register a refresh callback run each time they are shown.
const viewRefreshers = new Map();
export const registerViewRefresh = (viewName, fn) => viewRefreshers.set(viewName, fn);

// Switch the active view (and matching nav button) by section id.
export const showView = (viewName) => {
  state.currentView = viewName;
  document.querySelectorAll('.view').forEach(view => {
    view.classList.toggle('active', view.id === viewName);
  });
  document.querySelectorAll('nav button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });
  const refresh = viewRefreshers.get(viewName);
  if (refresh) refresh();
};
