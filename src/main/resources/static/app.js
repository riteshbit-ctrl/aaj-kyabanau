/* =========================
   GLOBAL STATE & MESSAGES
========================= */

const messages = [
  "👩‍🍳 Recipes soch rahe hain…",
  "🥔 Sabziyon ka plan ban raha hai…",
  "🔥 Tadka lag raha hai…",
  "🍲 Almost ready…"
];

let messageInterval = null;
let messageIndex = 0;

let currentDishes = [];
let cookingDish = null;
let stepIndex = 0;
let todaysPlan = null;


/* =========================
   VOICE INPUT
========================= */

function startVoice() {
  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-IN";

  recognition.onresult = (event) => {
    document.getElementById("ingredients").value =
      event.results[0][0].transcript;
  };

  recognition.start();
}


/* =========================
   SUGGEST RECIPES
========================= */

function suggest() {
  const resultEl = document.getElementById("result");
  const loadingEl = document.getElementById("loading");
  const loadingTextEl = document.getElementById("loadingText");
  const skeletonsEl = document.getElementById("skeletons");
  const button = document.getElementById("suggestBtn");

  resultEl.innerHTML = "";
  resultEl.style.display = "block";
  document.getElementById("cookMode").style.display = "none";

  loadingEl.style.display = "block";
  skeletonsEl.style.display = "block";
  button.disabled = true;
  button.innerText = "Soch rahe hain... 🍳";

  messageIndex = 0;
  loadingTextEl.innerText = messages[messageIndex];
  messageInterval = setInterval(() => {
    messageIndex = (messageIndex + 1) % messages.length;
    loadingTextEl.innerText = messages[messageIndex];
  }, 2000);

  const body = {
    ingredients: document.getElementById("ingredients").value,
    timeMinutes: parseInt(document.getElementById("time").value),
    servings: parseInt(document.getElementById("servings").value),
    diabetic: document.getElementById("diabetic").checked,
    weightLoss: document.getElementById("weightLoss").checked,
    kidsFriendly: document.getElementById("kidsFriendly").checked
  };

  fetch("/api/suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
    .then(res => res.json())
    .then(data => {
      stopLoading();
      render(data);
    })
    .catch(() => {
      stopLoading();
      resultEl.innerText = "❌ Kuch galat ho gaya. Please try again.";
    });
}


/* =========================
   STOP LOADING
========================= */

function stopLoading() {
  document.getElementById("loading").style.display = "none";
  document.getElementById("skeletons").style.display = "none";

  const button = document.getElementById("suggestBtn");
  button.disabled = false;
  button.innerText = "Suggest Karo";

  if (messageInterval) {
    clearInterval(messageInterval);
    messageInterval = null;
  }
}


/* =========================
   RENDER RECIPES
========================= */

function render(data) {
  const resultEl = document.getElementById("result");
  resultEl.innerHTML = "";

  if (!data || !data.dishes || data.dishes.length === 0) {
    resultEl.innerText = "Kuch suggest nahi ho paya 😕";
    return;
  }

  currentDishes = data.dishes;

  data.dishes.forEach((d, index) => {
    const card = document.createElement("div");
    card.className = "card";

    let html = `
      <div class="title">🍽️ ${index + 1}. ${d.name}</div>
      <div>👨‍👩‍👧‍👦 Serves: ${d.servings}</div>
      <div>⏱️ Prep: ${d.prepTimeMinutes} | Cook: ${d.cookTimeMinutes} | Total: ${d.totalTimeMinutes} min</div>
      <div class="section">${d.why}</div>
    `;

    if (d.ingredients?.length) {
      html += `<div class="section"><b>🧺 Ingredients:</b><ul>`;
      d.ingredients.forEach(i => {
        html += `<li>${i.quantity} ${i.unit} ${i.name}</li>`;
      });
      html += `</ul></div>`;
    }

  /* ---- Steps Preview ---- */
  if (d.steps && d.steps.length > 0) {
    html += `<div class="section"><b>👩‍🍳 Steps:</b><ol>`;
    d.steps.forEach((s, i) => {
      html += `<li>${s.text} (${s.timeMinutes} min)</li>`;
    });
    html += `</ol></div>`;
  }

  /* ---- Buttons at the END ---- */
  html += `
    <div style="display:flex; gap:8px; margin-top:14px;">
      <button class="secondary" onclick="setTodayPlan(${index})">🍽️ Cook Today</button>
      <button class="primary" onclick="startCooking(${index})">👩‍🍳 Start Cooking</button>
    </div>
  `;


    card.innerHTML = html;
    resultEl.appendChild(card);
  });
}


/* =========================
   TODAY’S PLAN
========================= */

function setTodayPlan(index) {
  todaysPlan = currentDishes[index];
  localStorage.setItem("todaysPlan", JSON.stringify(todaysPlan));
  showTodayPlan();
}

function showTodayPlan() {
  if (!todaysPlan) return;

  document.getElementById("todayPlanName").innerText = todaysPlan.name;
  document.getElementById("todayPlanBanner").style.display = "block";
}

function startCookingFromPlan() {
  const index = currentDishes.findIndex(d => d.name === todaysPlan.name);
  if (index >= 0) startCooking(index);
}


/* =========================
   COOKING MODE
========================= */

function startCooking(index) {
  cookingDish = currentDishes[index];
  stepIndex = 0;

  document.getElementById("result").style.display = "none";
  document.getElementById("cookMode").style.display = "block";
  document.getElementById("cookTitle").innerText = cookingDish.name;

  showStep();
}

function showStep() {
  const step = cookingDish.steps[stepIndex];

  document.getElementById("stepCounter").innerText =
    `Step ${stepIndex + 1} of ${cookingDish.steps.length}`;

  document.getElementById("stepText").innerText = step.text;
  document.getElementById("stepTime").innerText = `⏱️ ${step.timeMinutes} min`;
}

function nextStep() {
  if (stepIndex < cookingDish.steps.length - 1) {
    stepIndex++;
    showStep();
  }
}

function prevStep() {
  if (stepIndex > 0) {
    stepIndex--;
    showStep();
  }
}


/* =========================
   RESTORE PLAN ON LOAD
========================= */

document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("todaysPlan");
  if (saved) {
    todaysPlan = JSON.parse(saved);
    showTodayPlan();
  }
});
