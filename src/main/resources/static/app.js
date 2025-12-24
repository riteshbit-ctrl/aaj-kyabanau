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
let timerInterval = null;
let remainingSeconds = 0;
let voiceEnabled = false;
let savedRecipes = [];


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
    cuisine: document.getElementById("cuisine").value || "",
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
    `;

    /* 🔥 NUTRITION ROW (HORIZONTAL, CLEAR, BOLD) */
    if (d.nutrition) {
      html += `
        <div style="
          margin-top:6px;
          padding:6px 8px;
          background:#fff3e0;
          border-radius:6px;
          font-weight:bold;
          display:flex;
          flex-wrap:wrap;
          gap:12px;
          font-size:14px;
        ">
          <span>🔥 ${d.nutrition.calories} kcal</span>
          <span>🥔 Carbs: ${d.nutrition.carbs}</span>
          <span>🍗 Protein: ${d.nutrition.protein}</span>
          <span>🧈 Fat: ${d.nutrition.fat}</span>
          <span style="color:#d84315;">${d.nutrition.dietTag}</span>
        </div>
      `;
    }

    /* WHY */
    html += `<div class="section">${d.why}</div>`;

    /* INGREDIENTS */
    if (d.ingredients?.length) {
      html += `<div class="section"><b>🧺 Ingredients:</b><ul>`;
      d.ingredients.forEach(i => {
        html += `<li>${i.quantity} ${i.unit} ${i.name}</li>`;
      });
      html += `</ul></div>`;
    }

    /* STEPS */
    if (d.steps?.length) {
      html += `<div class="section"><b>👩‍🍳 Steps:</b><ol>`;
      d.steps.forEach(s => {
        html += `<li>${s.text} (${s.timeMinutes} min)</li>`;
      });
      html += `</ol></div>`;
    }

    /* BUTTONS */
    html += `
      <div style="display:flex; gap:8px; margin-top:14px;">
        <button class="primary" onclick="startCooking(${index})">👩‍🍳 Start Cooking</button>
        <button onclick="saveRecipe(${index})">❤️ Save</button>
      </div>
    `;

    card.innerHTML = html;
    resultEl.appendChild(card);
  });
}


/* =========================
   SAVE RECIPE
========================= */

function saveRecipe(index) {
  const recipe = currentDishes[index];

  if (savedRecipes.find(r => r.name === recipe.name)) {
    alert("Already saved 😊");
    return;
  }

  savedRecipes.push(recipe);
  localStorage.setItem("savedRecipes", JSON.stringify(savedRecipes));
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

  renderCookStep();
}

function renderCookStep() {
  if (!cookingDish || !cookingDish.steps) return;

  const step = cookingDish.steps[stepIndex];

  document.getElementById("stepText").innerText =
    `Step ${stepIndex + 1}: ${step.text}`;

  if (step.timeMinutes) {
    remainingSeconds = step.timeMinutes * 60;
    updateTimerUI();
    document.getElementById("timerControls").style.display = "block";
  } else {
    document.getElementById("timerControls").style.display = "none";
  }

  stopTimer();
  speakStep(step.text);
}

function nextStep() {
  stopTimer();

  if (stepIndex < cookingDish.steps.length - 1) {
    stepIndex++;
    renderCookStep();
  } else {
    alert("🎉 Recipe complete!");
  }
}

function prevStep() {
  stopTimer();

  if (stepIndex > 0) {
    stepIndex--;
    renderCookStep();
  }
}

function exitCooking() {
  stopTimer();
  window.speechSynthesis.cancel();

  cookingDish = null;
  stepIndex = 0;

  document.getElementById("cookMode").style.display = "none";
  document.getElementById("result").style.display = "block";
}


/* =========================
   TIMER
========================= */

function startTimer() {
  if (timerInterval || remainingSeconds <= 0) return;

  timerInterval = setInterval(() => {
    remainingSeconds--;
    updateTimerUI();

    if (remainingSeconds <= 0) {
      stopTimer();
      alert("⏰ Step complete!");
    }
  }, 1000);
}

function pauseTimer() {
  stopTimer();
}

function resetTimer() {
  stopTimer();
  remainingSeconds = cookingDish.steps[stepIndex].timeMinutes * 60;
  updateTimerUI();
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerUI() {
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;

  document.getElementById("timerText").innerText =
    `⏳ Remaining: ${mins}:${secs.toString().padStart(2, "0")}`;
}


/* =========================
   VOICE OUTPUT
========================= */

document.addEventListener("change", (e) => {
  if (e.target && e.target.id === "voiceToggle") {
    voiceEnabled = e.target.checked;
  }
});

function speakStep(text) {
  if (!voiceEnabled) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-IN";
  utterance.rate = 0.95;

  window.speechSynthesis.speak(utterance);
}
