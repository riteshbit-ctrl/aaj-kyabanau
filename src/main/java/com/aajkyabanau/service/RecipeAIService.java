package com.aajkyabanau.service;

import com.aajkyabanau.dto.RecipeResponse;
import com.aajkyabanau.dto.UserRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.beans.factory.annotation.Value;

import java.util.List;
import java.util.Map;

@Service
public class RecipeAIService {

    @Value("${openai.api.key}")
    private String apiKey;

    private final WebClient webClient = WebClient.create("https://api.openai.com/v1");

    public RecipeResponse getSuggestions(UserRequest req) {

        String prompt = buildPrompt(req);
        System.out.println("Cuisine from UI = " + req.getCuisine());
        System.out.println("Prompt from buildPrompt = " + prompt);
        Map<String, Object> requestBody = Map.of(
                "model", "gpt-4.1-mini",
                "messages", List.of(
                        Map.of("role", "system", "content", SYSTEM_PROMPT),
                        Map.of("role", "user", "content", prompt)
                ),
                "temperature", 0.4
        );

        String response = webClient.post()
                .uri("/chat/completions")
                .header("Authorization", "Bearer " + apiKey)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        RecipeResponse res = parseResponse(response);

        // 3️⃣ SAFETY OVERRIDE: enforce servings from user input
        if (res != null && res.getDishes() != null) {
            for (RecipeResponse.Dish d : res.getDishes()) {
                d.setServings(req.getServings());
            }
        }

        // 4️⃣ Return final response
        return res;

    }

    private String buildPrompt(UserRequest req) {

        String cuisineLine = (req.getCuisine() != null && !req.getCuisine().isBlank())
                ? "Preferred cuisine: " + req.getCuisine()
                : "Preferred cuisine: Any Indian cuisine";

        return String.format("""
Ingredients available: %s
%s
Available time: %d minutes
Number of people: %d
Diabetic: %s
Weight loss: %s
Kids friendly: %s

IMPORTANT:
- Cuisine is a preference, not mandatory
- Ingredients must still be respected
- Follow all system rules
- Return ONLY JSON
""",
                req.getIngredients(),
                cuisineLine,
                req.getTimeMinutes(),
                req.getServings(),
                req.isDiabetic(),
                req.isWeightLoss(),
                req.isKidsFriendly()
        );
    }


    private RecipeResponse parseResponse(String rawResponse) {
        try {
            ObjectMapper mapper = new ObjectMapper();

            JsonNode root = mapper.readTree(rawResponse);
            String content = root
                    .path("choices")
                    .get(0)
                    .path("message")
                    .path("content")
                    .asText();

            // 🔥 ADD THIS LOG
            System.out.println("=== AI RAW CONTENT ===");
            System.out.println(content);
            System.out.println("======================");

            return mapper.readValue(content, RecipeResponse.class);

        } catch (Exception e) {
            e.printStackTrace();
            return null;   // <-- important for now
        }
    }

    private static final String SYSTEM_PROMPT = """
You are an Indian home cooking assistant.

User provides:
- Ingredients (MUST be used)
- Cuisine preference (optional)
- Available total time in minutes
- Number of people (servings)
- Flags: diabetic (true/false), weightLoss (true/false), kidsFriendly (true/false)

Example Hinglish style:
"Ab kadhai garam karo aur thoda sa tel daalo. Jab tel garam ho jaaye, jeera daal ke ache se bhun lo."

🔥 LANGUAGE RULE (STRICT):
- Use Hinglish ONLY (Hindi words in English script)
- Do NOT use pure English sentences
- Every step and explanation must include Hindi words like:
  "thoda", "ache se", "dhyan se", "ab", "phir", "jab tak", "halka"
- If output sounds fully English, it is WRONG

🔥 INGREDIENT USAGE RULES (VERY IMPORTANT):
- Use at least ONE provided ingredient per dish
- Prefer using more if practical
- Allow different dishes to use different subsets
- Always return exactly 3 dishes
- Each dish MUST use at least ONE provided ingredient
- Prefer dishes that use MORE of the provided ingredients
- Do NOT suggest dishes using NONE of the provided ingredients

🔥 SERVINGS RULE (CRITICAL):
- All recipes MUST be for EXACTLY the number of people specified
- Do NOT change or assume serving size
- Ingredient quantities MUST scale exactly to servings
- If user selects 2 servings, servings field MUST be 2

🔥 COUNT RULE (MANDATORY):
- Always return EXACTLY 3 recipes
- If fewer unique dishes are possible,
  create simple variations using the same ingredients
- Never return fewer than 3 recipes

🔥 KIDS FRIENDLY RULE (if kidsFriendly=true):
- Reduce spice levels
- Avoid bitter or very spicy ingredients
- Mention 1 short kidsTip to make dish appealing for kids

🔥 HEALTH RULES:
- If diabetic=true, avoid sugar and refined flour
- If weightLoss=true, use low oil and mention portion control
- If both true, satisfy both together
- Nutrition must reflect these health rules

🔥 TIME CONSISTENCY RULE (STRICT):
- Each step MUST include timeMinutes
- SUM of all step timeMinutes MUST be LESS THAN OR EQUAL TO totalTimeMinutes
- totalTimeMinutes MUST equal prepTimeMinutes + cookTimeMinutes
- Do NOT exceed available total time provided by user
- If needed, shorten steps realistically

🔥 NUTRITION RULE (NEW – VERY IMPORTANT):
- For EACH dish, calculate approximate nutrition PER SERVING
- Nutrition must be based on:
  - ingredients
  - quantities
  - cooking method
  - serving count
- Calories must be realistic (not extreme)
- Nutrition must align with health flags:
  - weightLoss → lower calories, lower carbs, controlled fat
  - diabetic → low sugar, low GI, controlled carbs
- Keep nutrition simple and easy to understand

Nutrition JSON format (MANDATORY):
{
  "calories": number,
  "carbs": "g",
  "protein": "g",
  "fat": "g",
  "dietTag": "Low Carb | High Protein | Diabetic Friendly | Balanced"
}

GENERAL RULES:
- Use Hinglish
- Assume Indian home kitchen
- Min 8 and max 15 steps per dish
- Return EXACT JSON only (no explanation outside JSON)

OUTPUT FORMAT (STRICT):

{
  "dishes": [
    {
      "name": "",
      "why": "",
      "servings": 0,
      "prepTimeMinutes": 0,
      "cookTimeMinutes": 0,
      "totalTimeMinutes": 0,
      "nutrition": {
        "calories": 0,
        "carbs": "",
        "protein": "",
        "fat": "",
        "dietTag": ""
      },
      "ingredients": [
        {
          "name": "",
          "quantity": "",
          "unit": ""
        }
      ],
      "steps": [
        {
          "text": "",
          "timeMinutes": 0
        }
      ],
      "kidsTip": ""
    }
  ]
}
""";
}

