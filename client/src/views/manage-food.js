// Manage Food view: Add Ingredient -> Food Inventory, plus
// "Mark as Cooked" and "Clear All" (with confirmation).
// All mutations go through the API; the duplicate-merge rule is
// enforced server-side.

import {
  getPantry,
  addPantryItem,
  deletePantryItem,
  clearPantry
} from '../services/api.js';
import {
  state,
  escapeHtml,
  showFieldError,
  showAppError
} from '../state.js';

const renderPantryList = () => {
  const list = document.getElementById('pantry-list');
  if (state.pantry.length === 0) {
    list.innerHTML = '<p class="view-hint">Your pantry is empty. Add something above.</p>';
    return;
  }

  list.innerHTML = state.pantry.map(item => `
    <div class="ingredient-item">
      <span>${escapeHtml(item.ingredientName)}${item.quantityStatus
        ? ` <span class="quantity">&mdash; ${escapeHtml(item.quantityStatus)}</span>` : ''}</span>
      <button type="button" data-id="${item.pantryItemId}">Remove</button>
    </div>
  `).join('');

  list.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await deletePantryItem(btn.dataset.id);
        state.pantry = state.pantry.filter(i => i.pantryItemId !== btn.dataset.id);
        renderPantryList();
      } catch (err) {
        showAppError(err);
      }
    });
  });
};

// Re-fetch pantry state from the API.
export const refreshPantry = async () => {
  state.pantry = await getPantry(state.profile.profileId);
  renderPantryList();
};

export const setupManageFood = () => {
  const form = document.getElementById('pantry-form');
  const nameInput = document.getElementById('pantry-ingredient-name');
  const quantityInput = document.getElementById('pantry-ingredient-quantity');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) {
      showFieldError('pantry-error', 'Enter an ingredient name first.');
      return;
    }
    showFieldError('pantry-error', '');
    try {
      // Server merges duplicates by name (case-insensitive).
      await addPantryItem(state.profile.profileId, name, quantityInput.value.trim() || null);
      nameInput.value = '';
      quantityInput.value = '';
      await refreshPantry();
    } catch (err) {
      showAppError(err);
    }
  });

  // Spec: warn if quantities are unspecified, but let the action finish.
  document.getElementById('mark-cooked').addEventListener('click', () => {
    const unspecified = state.pantry.filter(item => !item.quantityStatus);
    if (unspecified.length > 0) {
      alert(
        `Heads up: ${unspecified.length} item(s) have no quantity ` +
        `(${unspecified.map(i => i.ingredientName).join(', ')}). ` +
        'Marking as cooked anyway.'
      );
    } else {
      alert('Marked as cooked.');
    }
  });

  document.getElementById('clear-pantry').addEventListener('click', async () => {
    if (state.pantry.length === 0) return;
    if (confirm('Clear your entire pantry? This cannot be undone.')) {
      try {
        await clearPantry(state.profile.profileId);
        state.pantry = [];
        renderPantryList();
      } catch (err) {
        showAppError(err);
      }
    }
  });

  renderPantryList();
};
