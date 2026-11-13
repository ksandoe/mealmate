// Shopping view: checklist with deal prices, plus "Done Shopping"
// which bulk-copies checked items into the pantry via the API.

import {
  getGroceryList,
  addGroceryItem,
  setGroceryChecked,
  deleteGroceryItem,
  checkout,
  getDeals
} from '../services/api.js';
import {
  state,
  escapeHtml,
  normalizeName,
  showFieldError,
  showAppError,
  findDeal,
  registerViewRefresh
} from '../state.js';
import { refreshPantry } from './manage-food.js';

const renderShoppingList = () => {
  const list = document.getElementById('shopping-list');
  if (state.shoppingList.length === 0) {
    list.innerHTML = '<p class="view-hint">Your shopping list is empty.</p>';
    return;
  }

  list.innerHTML = state.shoppingList.map(item => {
    const deal = findDeal(item.itemName);
    const priceHtml = deal
      ? `<span class="price">$${deal.salePrice.toFixed(2)} <s>$${deal.regularPrice.toFixed(2)}</s>
           <span class="deal-store">${escapeHtml(deal.storeName)}</span></span>`
      : '';
    return `
      <div class="shopping-item ${item.isChecked ? 'purchased' : ''}">
        <input type="checkbox" ${item.isChecked ? 'checked' : ''} data-id="${item.listItemId}"
               aria-label="Mark ${escapeHtml(item.itemName)} as purchased">
        <span>${escapeHtml(item.itemName)}</span>
        ${priceHtml}
        <button type="button" class="remove-item" data-id="${item.listItemId}">Remove</button>
      </div>
    `;
  }).join('');

  list.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', async () => {
      try {
        await setGroceryChecked(checkbox.dataset.id, checkbox.checked);
        const item = state.shoppingList.find(i => i.listItemId === checkbox.dataset.id);
        if (item) item.isChecked = checkbox.checked;
        renderShoppingList();
      } catch (err) {
        showAppError(err);
        checkbox.checked = !checkbox.checked;
      }
    });
  });

  list.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await deleteGroceryItem(btn.dataset.id);
        state.shoppingList = state.shoppingList.filter(i => i.listItemId !== btn.dataset.id);
        renderShoppingList();
      } catch (err) {
        showAppError(err);
      }
    });
  });
};

const renderDeals = () => {
  const dealsList = document.getElementById('deals-list');
  if (state.deals.length === 0) {
    dealsList.innerHTML = '<p class="view-hint">No deals right now.</p>';
    return;
  }
  dealsList.innerHTML = state.deals.map(deal => `
    <div class="deal-item">
      <strong>${escapeHtml(deal.itemName)}</strong> at ${escapeHtml(deal.storeName)}
      <span class="price">$${deal.salePrice.toFixed(2)}</span>
      <s>$${deal.regularPrice.toFixed(2)}</s>
      <span class="deal-expiry">${escapeHtml(deal.expirationDateString)}</span>
    </div>
  `).join('');
};

// Load list + deals from the API (called on setup and each time the
// view is shown, so items added from Recipe Details appear).
const loadShopping = async () => {
  try {
    [state.shoppingList, state.deals] = await Promise.all([
      getGroceryList(state.profile.profileId),
      getDeals()
    ]);
    renderShoppingList();
    renderDeals();
  } catch (err) {
    showAppError(err);
  }
};

export const setupShopping = () => {
  const form = document.getElementById('shopping-form');
  const input = document.getElementById('shopping-item-name');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = input.value.trim();
    if (!name) {
      showFieldError('shopping-error', 'Enter an item name first.');
      return;
    }
    if (state.shoppingList.some(i => normalizeName(i.itemName) === normalizeName(name))) {
      showFieldError('shopping-error', `"${name}" is already on your list.`);
      return;
    }
    showFieldError('shopping-error', '');
    try {
      await addGroceryItem(state.profile.profileId, name);
      input.value = '';
      await loadShopping();
    } catch (err) {
      showAppError(err);
    }
  });

  // Spec rule "Waiting on Checkout": checked items only move to the
  // pantry when the user explicitly clicks Done Shopping.
  document.getElementById('done-shopping').addEventListener('click', async () => {
    if (!state.shoppingList.some(item => item.isChecked)) {
      alert('Check off the items you bought first, then hit Done Shopping.');
      return;
    }
    try {
      const { moved } = await checkout(state.profile.profileId);
      await Promise.all([loadShopping(), refreshPantry()]);
      alert(`Moved ${moved} item(s) into your pantry.`);
    } catch (err) {
      showAppError(err);
    }
  });

  registerViewRefresh('shopping', loadShopping);
  renderShoppingList();
  renderDeals();
};
