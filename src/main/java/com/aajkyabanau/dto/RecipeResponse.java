package com.aajkyabanau.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class RecipeResponse {


    private List<Dish> dishes;

    public List<Dish> getDishes() {
        return dishes;
    }

    private int servings;

    public void setDishes(List<Dish> dishes) {
        this.dishes = dishes;
    }

    public int getServings() {
        return servings;
    }

    public void setServings(int servings) {
        this.servings = servings;
    }

    public List<Ingredient> getIngredients() {
        return ingredients;
    }

    public void setIngredients(List<Ingredient> ingredients) {
        this.ingredients = ingredients;
    }

    public String getKidsTip() {
        return kidsTip;
    }

    public void setKidsTip(String kidsTip) {
        this.kidsTip = kidsTip;
    }

    private List<Ingredient> ingredients;
    private String kidsTip;

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Dish {

        private String name;
        private String why;
        private int servings;
        private int prepTimeMinutes;
        private int cookTimeMinutes;
        private int totalTimeMinutes;

        private List<Ingredient> ingredients;
        private List<Step> steps;

        private String kidsTip;

        // ===== getters =====

        public String getName() { return name; }
        public String getWhy() { return why; }
        public int getServings() { return servings; }
        public int getPrepTimeMinutes() { return prepTimeMinutes; }
        public int getCookTimeMinutes() { return cookTimeMinutes; }
        public int getTotalTimeMinutes() { return totalTimeMinutes; }
        public List<Ingredient> getIngredients() { return ingredients; }
        public List<Step> getSteps() { return steps; }
        public String getKidsTip() { return kidsTip; }

        // ===== setters =====

        public void setName(String name) { this.name = name; }
        public void setWhy(String why) { this.why = why; }
        public void setServings(int servings) { this.servings = servings; }
        public void setPrepTimeMinutes(int prepTimeMinutes) { this.prepTimeMinutes = prepTimeMinutes; }
        public void setCookTimeMinutes(int cookTimeMinutes) { this.cookTimeMinutes = cookTimeMinutes; }
        public void setTotalTimeMinutes(int totalTimeMinutes) { this.totalTimeMinutes = totalTimeMinutes; }
        public void setIngredients(List<Ingredient> ingredients) { this.ingredients = ingredients; }
        public void setSteps(List<Step> steps) { this.steps = steps; }
        public void setKidsTip(String kidsTip) { this.kidsTip = kidsTip; }
    }


    public static class Ingredient {
        private String name;
        private String quantity;
        private String unit;

        public String getName() { return name; }
        public String getQuantity() { return quantity; }
        public String getUnit() { return unit; }

        public void setName(String name) { this.name = name; }
        public void setQuantity(String quantity) { this.quantity = quantity; }
        public void setUnit(String unit) { this.unit = unit; }
    }

    public static class Step {
        private String text;
        private int timeMinutes;

        public String getText() { return text; }
        public int getTimeMinutes() { return timeMinutes; }

        public void setText(String text) { this.text = text; }
        public void setTimeMinutes(int timeMinutes) { this.timeMinutes = timeMinutes; }
    }

}

