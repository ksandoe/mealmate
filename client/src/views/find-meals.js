// Find Meals view: Enter Ingredients -> Search Recipes -> Recipe Results.
// Search runs against the API, which applies the staple-bypass and
// filter rules server-side.

import { searchRecipes } from '../services/api.js';
import {
  state,
  escapeHtml,
  normalizeName,
  showFieldError,
  showAppError,
  showView
} from '../state.js';

// Client-side copy of the matching rule, used by Recipe Details to
// compute what the pantry is missing for one recipe.
export const matchRecipe = (recipe, availableNames) => {
  const available = new Set(availableNames.map(normalizeName));
  const required = recipe.ingredients.filter(ing => !ing.isStaple);
  const missing = required
    .filter(ing => !available.has(normalizeName(ing.name)))
    .map(ing => ing.name);
  const matchPercent = required.length === 0
    ? 100
    : Math.round(((required.length - missing.length) / required.length) * 100);
  return { recipe, matchPercent, missing };
};

const renderIngredientList = () => {
  const list = document.getElementById('ingredient-list');
  list.innerHTML = state.searchIngredients.map((ing, index) => `
    <div class="ingredient-item">
      <span>${escapeHtml(ing)}</span>
      <button type="button" data-index="${index}">Remove</button>
    </div>
  `).join('');

  list.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      state.searchIngredients.splice(Number(btn.dataset.index), 1);
      renderIngredientList();
    });
  });
};

const renderResults = () => {
  const container = document.getElementById('recipe-results');
  if (state.lastResults.length === 0) {
    container.innerHTML =
      '<p class="view-hint">No recipes matched. Try fewer ingredients or loosen your filters.</p>';
    return;
  }

  container.innerHTML = state.lastResults.map(({ recipe, matchPercent, missing }) => `
    <article class="recipe-card" data-recipe-id="${recipe.recipeId}" tabindex="0">
      <h3>${escapeHtml(recipe.recipeName)}</h3>
      <p class="meta">
        ~$${recipe.estimatedCost.toFixed(2)} &middot;
        ${recipe.cookTimeMinutes} min cook &middot;
        ${escapeHtml(recipe.requiredAppliances.join(', '))}
      </p>
      <span class="match-percentage">${matchPercent}% match</span>
      ${missing.length > 0
        ? `<p class="missing">Missing: ${missing.map(escapeHtml).join(', ')}</p>`
        : '<p class="missing missing--none">You have everything!</p>'}
    </article>
  `).join('');

  const openDetails = (card) => {
    state.selectedRecipeId = card.dataset.recipeId;
    showView('recipe-details');
  };

  container.querySelectorAll('.recipe-card').forEach(card => {
    card.addEventListener('click', () => openDetails(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDetails(card);
      }
    });
  });
};

const runSearch = async (searchBtn) => {
  searchBtn.disabled = true;
  searchBtn.textContent = 'Searching...';
  try {
    // Empty search box = match against the profile's pantry instead.
    state.lastResults = await searchRecipes({
      ingredients: state.searchIngredients,
      profileId: state.profile.profileId,
      filters: state.filters
    });
    renderResults();
  } catch (err) {
    showAppError(err);
  } finally {
    searchBtn.disabled = false;
    searchBtn.textContent = 'Search Recipes';
  }
};

export const setupFindMeals = () => {
  const form = document.getElementById('ingredient-form');
  const input = document.getElementById('ingredient-name');
  const searchBtn = document.getElementById('search-recipes');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = input.value.trim();
    if (!name) {
      showFieldError('ingredient-error', 'Enter an ingredient name first.');
      return;
    }
    if (state.searchIngredients.some(ing => normalizeName(ing) === normalizeName(name))) {
      showFieldError('ingredient-error', `"${name}" is already in your list.`);
      return;
    }
    showFieldError('ingredient-error', '');
    state.searchIngredients.push(name);
    input.value = '';
    renderIngredientList();
  });

  searchBtn.addEventListener('click', () => runSearch(searchBtn));

  renderIngredientList();
};
