// Filters view: Budget, Cooking Time, Dietary/Allergy, Cooking Equipment.
// Selections are saved to the profile via the API so searches respect them.

import { saveProfileSettings } from '../services/api.js';
import { state, showAppError } from '../state.js';

export const setupFilters = () => {
  const form = document.getElementById('filters-form');
  const saved = document.getElementById('filters-saved');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    state.filters.maxBudget = document.getElementById('budget-filter').value;
    state.filters.maxCookTime = document.getElementById('time-filter').value;
    state.filters.dietary = [...form.querySelectorAll('input[name="dietary"]:checked')]
      .map(cb => cb.value);
    state.filters.equipment = [...form.querySelectorAll('input[name="equipment"]:checked')]
      .map(cb => cb.value);

    // Persist dietary + equipment choices on the profile (spec: "save to my profile").
    const settings = {
      savedDietaryRestrictions: state.filters.dietary.join(','),
      equipmentPreferences: state.filters.equipment.join(',')
    };
    state.profile = { ...state.profile, ...settings };

    try {
      await saveProfileSettings(state.profile.profileId, settings);
      saved.hidden = false;
      setTimeout(() => { saved.hidden = true; }, 2500);
    } catch (err) {
      showAppError(err);
    }
  });
};
