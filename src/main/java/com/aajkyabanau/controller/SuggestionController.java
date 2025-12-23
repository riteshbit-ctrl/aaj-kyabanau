package com.aajkyabanau.controller;

import com.aajkyabanau.dto.RecipeResponse;
import com.aajkyabanau.dto.UserRequest;
import com.aajkyabanau.service.RecipeAIService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController   // 🔥 MUST BE THIS
@RequestMapping("/api")
public class SuggestionController {

    private final RecipeAIService recipeAIService;

    public SuggestionController(RecipeAIService recipeAIService) {
        this.recipeAIService = recipeAIService;
    }

    @PostMapping(
            value = "/suggest",
            consumes = "application/json",
            produces = "application/json"
    )
    public ResponseEntity<RecipeResponse> suggest(
            @RequestBody UserRequest request) {

        RecipeResponse response = recipeAIService.getSuggestions(request);

        System.out.println("Controller returning dishes count: " +
                (response != null && response.getDishes() != null
                        ? response.getDishes().size()
                        : "NULL"));

        return ResponseEntity.ok(response);
    }
}
