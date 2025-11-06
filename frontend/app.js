const RECIPES = [
  {
    id: "r1",
    title: "Garlic Chicken with Spinach",
    image: "https://picsum.photos/seed/garlic-chicken/800/500",
    prepTime: 15,
    cookTime: 20,
    servings: 2,
    rating: 4.6,
    diet: "nonveg",
    ingredients: [
      { name: "chicken", quantity: 300, unit: "g" },
      { name: "spinach", quantity: 150, unit: "g" },
      { name: "garlic", quantity: 2, unit: "tbsp" },
      { name: "onion", quantity: 1, unit: "pcs" },
      { name: "olive oil", quantity: 1, unit: "tbsp" },
      { name: "salt", quantity: 0.5, unit: "tsp" },
    ],
    recipeSteps: [
      { stepNumber: 1, text: "Slice onion and mince garlic.", estimatedTimeSec: 120 },
      { stepNumber: 2, text: "Sauté onion and garlic in olive oil.", estimatedTimeSec: 240 },
      { stepNumber: 3, text: "Add chicken and cook until browned.", estimatedTimeSec: 420 },
      { stepNumber: 4, text: "Add spinach and salt, cook until wilted.", estimatedTimeSec: 180 },
    ],
    nutrition: { calories: 520, protein: 45, carbs: 12, fats: 30 },
  },
  {
    id: "r2",
    title: "Tomato Basil Pasta",
    image: "https://picsum.photos/seed/tomato-pasta/800/500",
    prepTime: 10,
    cookTime: 15,
    servings: 2,
    rating: 4.4,
    diet: "veg",
    ingredients: [
      { name: "pasta", quantity: 160, unit: "g" },
      { name: "tomato", quantity: 250, unit: "g" },
      { name: "garlic", quantity: 1, unit: "tbsp" },
      { name: "olive oil", quantity: 1, unit: "tbsp" },
      { name: "basil", quantity: 5, unit: "g" },
      { name: "salt", quantity: 0.5, unit: "tsp" },
    ],
    recipeSteps: [
      { stepNumber: 1, text: "Boil pasta until al dente.", estimatedTimeSec: 540 },
      { stepNumber: 2, text: "Sauté garlic in olive oil.", estimatedTimeSec: 180 },
      { stepNumber: 3, text: "Add chopped tomatoes and cook down.", estimatedTimeSec: 300 },
      { stepNumber: 4, text: "Combine pasta with sauce and basil.", estimatedTimeSec: 120 },
    ],
    nutrition: { calories: 610, protein: 20, carbs: 98, fats: 16 },
  },
  {
    id: "r3",
    title: "Tofu Stir-Fry",
    image: "https://picsum.photos/seed/tofu-stirfry/800/500",
    prepTime: 12,
    cookTime: 12,
    servings: 2,
    rating: 4.5,
    diet: "veg",
    ingredients: [
      { name: "tofu", quantity: 250, unit: "g" },
      { name: "onion", quantity: 1, unit: "pcs" },
      { name: "garlic", quantity: 1, unit: "tbsp" },
      { name: "ginger", quantity: 1, unit: "tbsp" },
      { name: "cumin", quantity: 0.5, unit: "tsp" },
      { name: "soy sauce", quantity: 1, unit: "tbsp" },
    ],
    recipeSteps: [
      { stepNumber: 1, text: "Cube tofu and slice onion.", estimatedTimeSec: 180 },
      { stepNumber: 2, text: "Stir-fry onion, garlic, and ginger.", estimatedTimeSec: 300 },
      { stepNumber: 3, text: "Add tofu, cumin, and soy sauce; cook through.", estimatedTimeSec: 300 },
    ],
    nutrition: { calories: 420, protein: 28, carbs: 20, fats: 24 },
  },
];

/* ---------------------- DOM Refs ---------------------- */
const navLinks = document.querySelectorAll(".nav-link");
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
const mainEl = document.getElementById("main");
const liveRegion = document.getElementById("liveRegion");
const errorRegion = document.getElementById("errorRegion");

// Home
const ingredientForm = document.getElementById("ingredientForm");
const ingredientInput = document.getElementById("ingredientInput");
const pantryChips = document.getElementById("pantryChips");
const suggestionsGrid = document.getElementById("suggestionsGrid");
const suggestionsLoading = document.getElementById("suggestionsLoading");
const suggestionsEmpty = document.getElementById("suggestionsEmpty");
const dietFilter = document.getElementById("dietFilter");
const maxPrepFilter = document.getElementById("maxPrepFilter");
const maxPrepLabel = document.getElementById("maxPrepLabel");
const sortBy = document.getElementById("sortBy");
const applyFiltersBtn = document.getElementById("applyFilters");

// Recipe
const viewHome = document.getElementById("view-home");
const viewRecipe = document.getElementById("view-recipe");
const backToHome = document.getElementById("backToHome");
const recipeImage = document.getElementById("recipeImage");
const recipeHeading = document.getElementById("recipeHeading");
const recipeRating = document.getElementById("recipeRating");
const recipeTimes = document.getElementById("recipeTimes");
const servingsInput = document.getElementById("servingsInput");
const servingsMinus = document.getElementById("servingsMinus");
const servingsPlus = document.getElementById("servingsPlus");
const saveFavoriteBtn = document.getElementById("saveFavorite");
const addToMealPlanBtn = document.getElementById("addToMealPlan");
const ingredientList = document.getElementById("ingredientList");
const exportShoppingBtn = document.getElementById("exportShopping");
const stepIndicator = document.getElementById("stepIndicator");
const prevStepBtn = document.getElementById("prevStep");
const nextStepBtn = document.getElementById("nextStep");
const currentStepText = document.getElementById("currentStepText");
const stepEta = document.getElementById("stepEta");
const startTimerBtn = document.getElementById("startTimer");
const countdownEl = document.getElementById("countdown");
const nCalories = document.getElementById("nCalories");
const nProtein = document.getElementById("nProtein");
const nCarbs = document.getElementById("nCarbs");
const nFats = document.getElementById("nFats");

// Favorites
const viewFavorites = document.getElementById("view-favorites");
const favoritesGrid = document.getElementById("favoritesGrid");
const favoritesEmpty = document.getElementById("favoritesEmpty");

// Meal plan
const viewMealplan = document.getElementById("view-mealplan");
const mealPlanList = document.getElementById("mealPlanList");
const mealPlanEmpty = document.getElementById("mealPlanEmpty");
const shoppingListEl = document.getElementById("shoppingList");
const shoppingListEmpty = document.getElementById("shoppingListEmpty");
const copyShoppingBtn = document.getElementById("copyShopping");
const exportShoppingJSONBtn = document.getElementById("exportShoppingJSON");
const clearShoppingBtn = document.getElementById("clearShopping");

/* ---------------------- State & Storage ---------------------- */
const STORAGE_KEYS = {
  pantry: "smp_pantry",
  favorites: "smp_favorites",
  mealplan: "smp_mealplan",
  shopping: "smp_shopping",
};

const state = {
  view: "home",
  pantry: loadJSON(STORAGE_KEYS.pantry, []),
  favorites: loadJSON(STORAGE_KEYS.favorites, []), // array of recipe ids
  mealPlan: loadJSON(STORAGE_KEYS.mealplan, []), // array of recipe ids
  shopping: loadJSON(STORAGE_KEYS.shopping, []), // array of {name, quantity, unit}
  suggestions: [],
  currentRecipe: null,
  currentServings: null,
  currentStepIndex: 0,
  timer: null,
  timerEnd: null,
  filters: { diet: "all", maxPrep: 60, sortBy: "match" },
};

function saveJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function loadJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}

/* ---------------------- Utilities ---------------------- */
function announce(msg) { liveRegion.textContent = msg; }
function alertError(msg) { errorRegion.textContent = msg; }

function totalTime(r) { return r.prepTime + r.cookTime; }
function byId(id) { return RECIPES.find(r => r.id === id); }

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function formatQty(q) {
  const rounded = Math.round(q * 100) / 100;
  return (Math.abs(rounded - Math.round(rounded)) < 0.01) ? Math.round(rounded).toString() : rounded.toString();
}

/* ---------------------- Navigation ---------------------- */
function setView(view) {
  state.view = view;
  // Update ARIA current
  document.querySelectorAll(".nav-link").forEach(a => a.setAttribute("aria-current", a.dataset.nav === view ? "page" : "false"));
  // Toggle sections
  [viewHome, viewRecipe, viewFavorites, viewMealplan].forEach(s => s.classList.add("hidden"));
  if (view === "home") viewHome.classList.remove("hidden");
  if (view === "recipe") viewRecipe.classList.remove("hidden");
  if (view === "favorites") viewFavorites.classList.remove("hidden");
  if (view === "mealplan") viewMealplan.classList.remove("hidden");
  // Focus main
  mainEl.focus();
  // Close mobile nav
  mainNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");

  if (view === "favorites") renderFavorites();
  if (view === "mealplan") { renderMealPlan(); renderShoppingList(); }
}

/* ---------------------- Pantry ---------------------- */
function setPantryFromInput(value) {
  const items = value.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  const unique = Array.from(new Set([...state.pantry, ...items]));
  state.pantry = unique;
  saveJSON(STORAGE_KEYS.pantry, state.pantry);
  renderPantry();
}

function addPantryItem(item) {
  const val = item.trim().toLowerCase();
  if (!val) return;
  if (!state.pantry.includes(val)) {
    state.pantry.push(val);
    saveJSON(STORAGE_KEYS.pantry, state.pantry);
    renderPantry();
    announce(`Added ${val} to pantry`);
  }
}

function removePantryItem(item) {
  state.pantry = state.pantry.filter(i => i !== item);
  saveJSON(STORAGE_KEYS.pantry, state.pantry);
  renderPantry();
  announce(`Removed ${item} from pantry`);
}

function renderPantry() {
  pantryChips.innerHTML = "";
  if (state.pantry.length === 0) return;
  state.pantry.forEach(item => {
    const btn = document.createElement("button");
    btn.className = "chip chip-rem";
    btn.type = "button";
    btn.setAttribute("aria-label", `Remove ${item} from pantry`);
    btn.innerHTML = `${item}<span class="x">×</span>`;
    btn.addEventListener("click", () => removePantryItem(item));
    pantryChips.appendChild(btn);
  });
}

/* ---------------------- Suggestions ---------------------- */
function matchScore(recipe) {
  const pantrySet = new Set(state.pantry);
  const names = recipe.ingredients.map(i => i.name.toLowerCase());
  const matchCount = names.filter(n => pantrySet.has(n)).length;
  return matchCount;
}

function applyFilters(recipes) {
  let list = recipes.slice();
  if (state.filters.diet !== "all") list = list.filter(r => r.diet === state.filters.diet);
  list = list.filter(r => r.prepTime <= state.filters.maxPrep);
  if (state.filters.sortBy === "match") list.sort((a,b) => matchScore(b) - matchScore(a));
  if (state.filters.sortBy === "rating") list.sort((a,b) => b.rating - a.rating);
  if (state.filters.sortBy === "time") list.sort((a,b) => totalTime(a) - totalTime(b));
  return list;
}

function renderSuggestions() {
  suggestionsGrid.innerHTML = "";
  const list = applyFilters(RECIPES).filter(r => matchScore(r) > 0 || state.pantry.length === 0);
  state.suggestions = list;

  suggestionsEmpty.classList.toggle("hidden", list.length !== 0);
  list.forEach(r => {
    const card = document.createElement("article");
    card.className = "recipe-card";
    card.innerHTML = `
      <img src="${r.image}" alt="${r.title}" />
      <div class="content">
        <h3>${r.title}</h3>
        <div class="meta">
          <span>Prep ${r.prepTime}m</span>
          <span>Cook ${r.cookTime}m</span>
          <span>⭐ ${r.rating}</span>
        </div>
        <div class="meta">
          Uses: ${r.ingredients.slice(0, 4).map(i => i.name).join(", ")}${r.ingredients.length > 4 ? "…" : ""}
        </div>
        <div class="actions">
          <button class="btn btn-primary" data-action="view" data-id="${r.id}">View</button>
          <button class="btn btn-secondary" data-action="save" data-id="${r.id}">${state.favorites.includes(r.id) ? "Saved" : "Save"}</button>
          <button class="btn" data-action="plan" data-id="${r.id}">Add to Meal Plan</button>
        </div>
      </div>
    `;
    suggestionsGrid.appendChild(card);
  });
}

/* ---------------------- Recipe Detail ---------------------- */
let macroChart = null;

function openRecipe(recipeId) {
  const recipe = byId(recipeId);
  if (!recipe) return;
  state.currentRecipe = recipe;
  state.currentServings = recipe.servings;
  state.currentStepIndex = 0;
  clearTimer();

  // Header
  recipeImage.src = recipe.image;
  recipeImage.alt = recipe.title;
  recipeHeading.textContent = recipe.title;
  recipeRating.textContent = `⭐ ${recipe.rating}`;
  recipeTimes.textContent = `Prep ${recipe.prepTime}m • Cook ${recipe.cookTime}m`;
  servingsInput.value = recipe.servings;
  saveFavoriteBtn.setAttribute("aria-pressed", String(state.favorites.includes(recipe.id)));
  saveFavoriteBtn.textContent = state.favorites.includes(recipe.id) ? "Saved" : "Save";

  // Ingredients & nutrition
  renderIngredients();
  renderNutrition();

  // Steps
  renderStepIndicator();
  renderCurrentStep();

  setView("recipe");
}

function renderIngredients() {
  const r = state.currentRecipe;
  const factor = Number(state.currentServings) / r.servings;
  ingredientList.innerHTML = "";
  r.ingredients.forEach(ing => {
    const li = document.createElement("li");
    li.textContent = `${formatQty(ing.quantity * factor)} ${ing.unit} ${ing.name}`;
    ingredientList.appendChild(li);
  });
}

function renderNutrition() {
  const r = state.currentRecipe;
  const factor = Number(state.currentServings) / r.servings;
  const n = {
    calories: Math.round(r.nutrition.calories * factor),
    protein: Math.round(r.nutrition.protein * factor),
    carbs: Math.round(r.nutrition.carbs * factor),
    fats: Math.round(r.nutrition.fats * factor),
  };
  nCalories.textContent = n.calories.toString();
  nProtein.textContent = n.protein.toString();
  nCarbs.textContent = n.carbs.toString();
  nFats.textContent = n.fats.toString();

  const ctx = document.getElementById("macroChart");
  const data = [n.protein, n.carbs, n.fats];
  const colors = ["#22c55e", "#f97316", "#a78bfa"];
  if (macroChart) { macroChart.destroy(); }
  macroChart = new Chart(ctx, {
    type: "pie",
    data: { labels: ["Protein", "Carbs", "Fats"], datasets: [{ data, backgroundColor: colors }] },
    options: { plugins: { legend: { labels: { color: "#cbd5e1" } } } }
  });
}

function renderStepIndicator() {
  stepIndicator.innerHTML = "";
  const steps = state.currentRecipe.recipeSteps;
  steps.forEach((s, idx) => {
    const dot = document.createElement("span");
    dot.className = "dot" + (idx === state.currentStepIndex ? " active" : "");
    dot.setAttribute("aria-label", `Step ${idx + 1}`);
    stepIndicator.appendChild(dot);
  });
}

function renderCurrentStep() {
  const steps = state.currentRecipe.recipeSteps;
  const step = steps[state.currentStepIndex];
  currentStepText.textContent = step.text;
  stepEta.textContent = step.estimatedTimeSec ? `ETA: ${Math.ceil(step.estimatedTimeSec / 60)} min` : "";
  countdownEl.textContent = "";
}

function changeServings(delta) {
  const val = clamp(Number(servingsInput.value) + delta, 1, 24);
  servingsInput.value = val;
  state.currentServings = val;
  renderIngredients();
  renderNutrition();
  announce(`Servings set to ${val}`);
}

/* ---------------------- Timers ---------------------- */
function clearTimer() {
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
  state.timerEnd = null;
  countdownEl.textContent = "";
}

function startStepTimer() {
  clearTimer();
  const step = state.currentRecipe.recipeSteps[state.currentStepIndex];
  const secs = step.estimatedTimeSec || 0;
  if (!secs) { announce("No time set for this step"); return; }
  const end = Date.now() + secs * 1000;
  state.timerEnd = end;

  state.timer = setInterval(() => {
    const remaining = Math.max(0, end - Date.now());
    const s = Math.ceil(remaining / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    countdownEl.textContent = `${mm}:${ss}`;
    if (remaining <= 0) {
      clearTimer();
      countdownEl.textContent = "Done!";
      announce("Timer finished");
    }
  }, 250);
}

/* ---------------------- Favorites ---------------------- */
function toggleFavorite(recipeId) {
  const idx = state.favorites.indexOf(recipeId);
  if (idx >= 0) state.favorites.splice(idx, 1); else state.favorites.push(recipeId);
  saveJSON(STORAGE_KEYS.favorites, state.favorites);
  announce(idx >= 0 ? "Removed from favorites" : "Added to favorites");
}

function renderFavorites() {
  favoritesGrid.innerHTML = "";
  const list = state.favorites.map(byId).filter(Boolean);
  favoritesEmpty.classList.toggle("hidden", list.length !== 0);
  list.forEach(r => {
    const card = document.createElement("article");
    card.className = "recipe-card";
    card.innerHTML = `
      <img src="${r.image}" alt="${r.title}" />
      <div class="content">
        <h3>${r.title}</h3>
        <div class="meta"><span>⭐ ${r.rating}</span> <span>${r.prepTime + r.cookTime}m</span></div>
        <div class="actions">
          <button class="btn btn-primary" data-action="view" data-id="${r.id}">View</button>
          <button class="btn btn-ghost" data-action="remove-fav" data-id="${r.id}">Remove</button>
        </div>
      </div>
    `;
    favoritesGrid.appendChild(card);
  });
}

/* ---------------------- Meal Plan & Shopping List ---------------------- */
function addToMealPlan(recipeId) {
  state.mealPlan.push(recipeId);
  saveJSON(STORAGE_KEYS.mealplan, state.mealPlan);
  announce("Added to meal plan");
  renderMealPlan();
}

function removeFromMealPlan(index) {
  state.mealPlan.splice(index, 1);
  saveJSON(STORAGE_KEYS.mealplan, state.mealPlan);
  renderMealPlan();
}

function renderMealPlan() {
  mealPlanList.innerHTML = "";
  const items = state.mealPlan.map(byId).filter(Boolean);
  mealPlanEmpty.classList.toggle("hidden", items.length !== 0);
  items.forEach((r, idx) => {
    const row = document.createElement("div");
    row.className = "card";
    row.innerHTML = `
      <div style="display:flex; gap:12px; align-items:center; justify-content:space-between;">
        <div style="display:flex; gap:12px; align-items:center;">
          <img src="${r.image}" alt="${r.title}" style="width:72px;height:48px;object-fit:cover;border-radius:8px;border:1px solid var(--outline);" />
          <div>
            <div style="font-weight:600;">${r.title}</div>
            <div class="meta">~${r.prepTime + r.cookTime}m • ⭐ ${r.rating}</div>
          </div>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn" data-action="view" data-id="${r.id}">View</button>
          <button class="btn btn-ghost" data-action="remove-plan" data-index="${idx}">Remove</button>
        </div>
      </div>
    `;
    mealPlanList.appendChild(row);
  });
}

/* Aggregate ingredients by name+unit and sum quantities */
function aggregateIngredients(recipesWithServings) {
  const map = new Map(); // key: name|unit -> {name, quantity, unit}
  recipesWithServings.forEach(({ recipe, servings }) => {
    const factor = servings / recipe.servings;
    recipe.ingredients.forEach(i => {
      const key = `${i.name}|${i.unit}`;
      const entry = map.get(key) || { name: i.name, quantity: 0, unit: i.unit };
      entry.quantity += i.quantity * factor;
      map.set(key, entry);
    });
  });
  return Array.from(map.values());
}

function exportCurrentRecipeToShopping() {
  if (!state.currentRecipe) return;
  const list = aggregateIngredients([{ recipe: state.currentRecipe, servings: state.currentServings }]);
  state.shopping = mergeShopping(state.shopping, list);
  saveJSON(STORAGE_KEYS.shopping, state.shopping);
  announce("Ingredients added to shopping list");
  renderShoppingList();
}

function mergeShopping(existing, toAdd) {
  const map = new Map();
  existing.forEach(i => map.set(`${i.name}|${i.unit}`, { ...i }));
  toAdd.forEach(i => {
    const key = `${i.name}|${i.unit}`;
    const e = map.get(key);
    if (e) e.quantity += i.quantity;
    else map.set(key, { ...i });
  });
  return Array.from(map.values());
}

function renderShoppingList() {
  shoppingListEl.innerHTML = "";
  shoppingListEmpty.classList.toggle("hidden", state.shopping.length !== 0);
  state.shopping.forEach((i, idx) => {
    const li = document.createElement("li");
    li.textContent = `${formatQty(i.quantity)} ${i.unit} ${i.name}`;
    shoppingListEl.appendChild(li);
  });
}

async function copyShoppingToClipboard() {
  const text = state.shopping.map(i => `${formatQty(i.quantity)} ${i.unit} ${i.name}`).join("\n");
  try {
    await navigator.clipboard.writeText(text);
    announce("Shopping list copied to clipboard");
  } catch {
    alertError("Copy failed");
  }
}

function exportShoppingJSON() {
  const blob = new Blob([JSON.stringify(state.shopping, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "shopping-list.json"; a.click();
  URL.revokeObjectURL(url);
}

function clearShopping() {
  state.shopping = [];
  saveJSON(STORAGE_KEYS.shopping, state.shopping);
  renderShoppingList();
}

/* ---------------------- Events ---------------------- */
// Nav
navLinks.forEach(a => a.addEventListener("click", (e) => {
  e.preventDefault();
  const view = a.dataset.nav;
  setView(view);
}));

menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

// Pantry quick-add chips
document.querySelectorAll(".chip-add").forEach(btn => {
  btn.addEventListener("click", () => {
    addPantryItem(btn.dataset.ingredient || "");
  });
});

// Ingredient form
ingredientForm.addEventListener("submit", (e) => {
  e.preventDefault();
  setPantryFromInput(ingredientInput.value);
  // Loading simulation
  suggestionsLoading.classList.remove("hidden");
  suggestionsGrid.innerHTML = "";
  suggestionsEmpty.classList.add("hidden");
  setTimeout(() => {
    suggestionsLoading.classList.add("hidden");
    renderSuggestions();
  }, 300);
});

ingredientInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    // Allow form submit to handle
  }
});

// Filters
maxPrepFilter.addEventListener("input", () => {
  maxPrepLabel.textContent = maxPrepFilter.value;
});
applyFiltersBtn.addEventListener("click", () => {
  state.filters.diet = dietFilter.value;
  state.filters.maxPrep = Number(maxPrepFilter.value);
  state.filters.sortBy = sortBy.value;
  renderSuggestions();
  announce("Filters applied");
});

// Suggestions actions
suggestionsGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  if (action === "view") openRecipe(id);
  if (action === "save") {
    toggleFavorite(id);
    renderSuggestions();
  }
  if (action === "plan") addToMealPlan(id);
});

// Back from recipe
backToHome.addEventListener("click", () => setView("home"));

// Servings controls
servingsMinus.addEventListener("click", () => changeServings(-1));
servingsPlus.addEventListener("click", () => changeServings(1));
servingsInput.addEventListener("change", () => {
  const v = clamp(Number(servingsInput.value || 1), 1, 24);
  servingsInput.value = v;
  state.currentServings = v;
  renderIngredients();
  renderNutrition();
});

// Favorite / Meal plan from recipe
saveFavoriteBtn.addEventListener("click", () => {
  if (!state.currentRecipe) return;
  toggleFavorite(state.currentRecipe.id);
  const saved = state.favorites.includes(state.currentRecipe.id);
  saveFavoriteBtn.setAttribute("aria-pressed", String(saved));
  saveFavoriteBtn.textContent = saved ? "Saved" : "Save";
});
addToMealPlanBtn.addEventListener("click", () => {
  if (!state.currentRecipe) return;
  addToMealPlan(state.currentRecipe.id);
});

// Export shopping from recipe
exportShoppingBtn.addEventListener("click", exportCurrentRecipeToShopping);

// Steps
prevStepBtn.addEventListener("click", () => {
  state.currentStepIndex = clamp(state.currentStepIndex - 1, 0, state.currentRecipe.recipeSteps.length - 1);
  clearTimer();
  renderStepIndicator(); renderCurrentStep();
});
nextStepBtn.addEventListener("click", () => {
  state.currentStepIndex = clamp(state.currentStepIndex + 1, 0, state.currentRecipe.recipeSteps.length - 1);
  clearTimer();
  renderStepIndicator(); renderCurrentStep();
});
startTimerBtn.addEventListener("click", startStepTimer);

// Favorites actions
favoritesGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  if (btn.dataset.action === "view") openRecipe(btn.dataset.id);
  if (btn.dataset.action === "remove-fav") {
    toggleFavorite(btn.dataset.id);
    renderFavorites();
  }
});

// Meal plan actions
mealPlanList.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  if (btn.dataset.action === "view") openRecipe(btn.dataset.id);
  if (btn.dataset.action === "remove-plan") removeFromMealPlan(Number(btn.dataset.index));
});

// Shopping actions
copyShoppingBtn.addEventListener("click", copyShoppingToClipboard);
exportShoppingJSONBtn.addEventListener("click", exportShoppingJSON);
clearShoppingBtn.addEventListener("click", clearShopping);

/* ---------------------- Init ---------------------- */
function init() {
  // Restore filters UI
  dietFilter.value = state.filters.diet;
  maxPrepFilter.value = state.filters.maxPrep;
  maxPrepLabel.textContent = String(state.filters.maxPrep);
  sortBy.value = state.filters.sortBy;

  renderPantry();
  renderSuggestions();
  renderFavorites();
  renderMealPlan();
  renderShoppingList();

  // Home is default
  setView("home");
}

document.addEventListener("DOMContentLoaded", init);

