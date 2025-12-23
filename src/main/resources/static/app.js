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

  // Reset UI
  resultEl.innerHTML = "";
  resultEl.style.display = "block";
  document.getElementById("cookMode").style.display = "none";

  loadingEl.style.display = "block";
  skeletonsEl.style.display = "block";
  button.disabled = true;
  button.innerText = "Soch rahe hain... 🍳";

  // Rotating loading messages
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
  const loadingEl = document.getElementById("loading");
  const skeletonsEl = document.getElementById("skeletons");
  const button = document.getElementById("suggestBtn");

  loadingEl.style.display = "none";
  skeletonsEl.style.display = "none";

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
      <div>⏱️ Prep: ${d.prepTimeMinutes} min | Cook: ${d.cookTimeMinutes} min | Total: ${d.totalTimeMinutes} min</div>
      <div class="section">${d.why}</div>
    `;

    if (d.ingredients && d.ingredients.length > 0) {
      html += `<div class="section"><b>🧺 Ingredients:</b><ul>`;
      d.ingredients.forEach(i => {
        html += `<li>${i.quantity} ${i.unit} ${i.name}</li>`;
      });
      html += `</ul></div>`;
    }

    if (d.steps && d.steps.length > 0) {
      html += `<div class="section"><b>👩‍🍳 Steps:</b><ol>`;
      d.steps.forEach(s => {
        html += `<li>${s.text} (${s.timeMinutes} min)</li>`;
      });
      html += `</ol></div>`;
    }

    if (d.kidsTip) {
      html += `<div class="section"><b>👶 Kids Tip:</b> ${d.kidsTip}</div>`;
    }

    html += `
      <button onclick="startCooking(${index})" style="margin-top:10px;">
        👩‍🍳 Start Cooking
      </button>
    `;

    card.innerHTML = html;
    resultEl.appendChild(card);
  });
}


/* =========================
   STEP-BY-STEP COOKING MODE
========================= */

function startCooking(dishIndex) {
  cookingDish = currentDishes[dishIndex];
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
  document.getElementById("stepTime").innerText =
    `⏱️ ${step.timeMinutes} min`;
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