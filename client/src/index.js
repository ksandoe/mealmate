// MealMate client entry point - loads the profile + initial state
// from the API, then wires navigation and view setup.

import { showView, showAppError, state } from './state.js';
import { getProfile, getPantry, getGroceryList, getDeals } from './services/api.js';
import { setupFindMeals } from './views/find-meals.js';
import { setupRecipeDetails } from './views/recipe-details.js';
import { setupFilters } from './views/filters.js';
import { setupManageFood } from './views/manage-food.js';
import { setupShopping } from './views/shopping.js';

const setupNavigation = () => {
  document.querySelectorAll('nav button').forEach(button => {
    button.addEventListener('click', () => showView(button.dataset.view));
  });
};

// Pull the default profile and the profile-owned rows from the API.
const loadInitialState = async () => {
  state.profile = await getProfile();
  [state.pantry, state.shoppingList, state.deals] = await Promise.all([
    getPantry(state.profile.profileId),
    getGroceryList(state.profile.profileId),
    getDeals()
  ]);
};

const init = async () => {
  setupNavigation();
  try {
    await loadInitialState();
  } catch (err) {
    showAppError(err);
  }
  setupFindMeals();
  setupRecipeDetails();
  setupFilters();
  setupManageFood();
  setupShopping();
  showView('find-meals');
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
