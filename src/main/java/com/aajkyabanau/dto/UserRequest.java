package com.aajkyabanau.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class UserRequest {

    private String ingredients;
    private int timeMinutes;
    private int servings;

    public boolean isKidsFriendly() {
        return kidsFriendly;
    }

    public void setKidsFriendly(boolean kidsFriendly) {
        this.kidsFriendly = kidsFriendly;
    }

    public int getServings() {
        return servings;
    }

    public void setServings(int servings) {
        this.servings = servings;
    }

    private boolean kidsFriendly;

    public boolean isWeightLoss() {
        return weightLoss;
    }

    public void setWeightLoss(boolean weightLoss) {
        this.weightLoss = weightLoss;
    }

    private boolean diabetic;
    private boolean weightLoss;

    public boolean isDiabetic() {
        return diabetic;
    }

    public void setDiabetic(boolean diabetic) {
        this.diabetic = diabetic;
    }
// getters & setters

    public int getTimeMinutes() {
        return timeMinutes;
    }

    public void setTimeMinutes(int timeMinutes) {
        this.timeMinutes = timeMinutes;
    }

    public String getIngredients() {
        return ingredients;
    }

    public void setIngredients(String ingredients) {
        this.ingredients = ingredients;
    }
}
