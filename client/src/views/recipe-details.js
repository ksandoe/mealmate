// Recipe Details view: instructions, appliances, missing items,
// and the Macro/Calorie Tracker. Fetches the recipe from the API.

import { getRecipe, addGroceryItem } from '../services/api.js';
import {
  state,
  escapeHtml,
  normalizeName,
  showAppError,
  showView,
  registerViewRefresh
} from '../state.js';
import { matchRecipe } from './find-meals.js';

const pantryNames = () => state.pantry.map(item => item.ingredientName);

const renderDetail = async () => {
  const container = document.getElementById('recipe-detail-content');

  if (!state.selectedRecipeId) {
    container.innerHTML =
      '<p class="view-hint">No recipe selected. Pick one from the Find Meals results.</p>';
    return;
  }

  container.innerHTML = '<p class="view-hint">Loading...</p>';

  let recipe;
  try {
    recipe = await getRecipe(state.selectedRecipeId);
  } catch (err) {
    container.innerHTML = '<p class="view-hint">Could not load this recipe.</p>';
    showAppError(err);
    return;
  }

  const { matchPercent, missing } = matchRecipe(recipe, pantryNames());
  const haveSet = new Set(pantryNames().map(normalizeName));
  const n = recipe.nutrition || { calories: 0, proteinGrams: 0, carbsGrams: 0, fatGrams: 0 };

  container.innerHTML = `
    <header class="detail-header">
      <h3>${escapeHtml(recipe.recipeName)}</h3>
      <p class="meta">
        Prep ${recipe.prepTimeMinutes} min &middot; Cook ${recipe.cookTimeMinutes} min
        &middot; ~$${recipe.estimatedCost.toFixed(2)}
      </p>
      <p class="meta">
        Appliances: ${escapeHtml(recipe.requiredAppliances.join(', '))}
        &middot; Tags: ${recipe.dietaryTags.map(escapeHtml).join(', ') || 'none'}
      </p>
      <span class="match-percentage">${matchPercent}% match with your pantry</span>
    </header>

    <section class="macro-tracker" aria-label="Nutrition per serving">
      <h4>Calories &amp; Macros (per serving)</h4>
      <div class="macro-grid">
        <div class="macro"><span class="macro-value">${n.calories}</span><span class="macro-label">kcal</span></div>
        <div class="macro"><span class="macro-value">${n.proteinGrams}g</span><span class="macro-label">protein</span></div>
        <div class="macro"><span class="macro-value">${n.carbsGrams}g</span><span class="macro-label">carbs</span></div>
        <div class="macro"><span class="macro-value">${n.fatGrams}g</span><span class="macro-label">fat</span></div>
      </div>
    </section>

    <section>
      <h4>Ingredients</h4>
      <ul class="detail-ingredients">
        ${recipe.ingredients.map(ing => {
          const status = ing.isStaple
            ? '<span class="tag tag--staple">staple</span>'
            : haveSet.has(normalizeName(ing.name))
              ? '<span class="tag tag--have">in pantry</span>'
              : '<span class="tag tag--missing">missing</span>';
          return `<li>${escapeHtml(ing.name)} ${status}</li>`;
        }).join('')}
      </ul>
      ${missing.length > 0
        ? `<button id="add-missing" class="btn-secondary">
             Add ${missing.length} missing item${missing.length === 1 ? '' : 's'} to shopping list
           </button>`
        : ''}
    </section>

    <section>
      <h4>Instructions</h4>
      <p class="instructions">${escapeHtml(recipe.stepInstructions).replaceAll('\n', '<br>')}</p>
    </section>
  `;

  const addMissingBtn = document.getElementById('add-missing');
  if (addMissingBtn) {
    addMissingBtn.addEventListener('click', async () => {
      addMissingBtn.disabled = true;
      try {
        // API merges duplicates by name, so just POST each missing item.
        await Promise.all(
          missing.map(name => addGroceryItem(state.profile.profileId, name))
        );
        showView('shopping');
      } catch (err) {
        showAppError(err);
        addMissingBtn.disabled = false;
      }
    });
  }
};

export const setupRecipeDetails = () => {
  document.getElementById('back-to-results').addEventListener('click', () => {
    showView('find-meals');
  });

  // Re-render whenever the details view becomes visible.
  registerViewRefresh('recipe-details', renderDetail);
};
