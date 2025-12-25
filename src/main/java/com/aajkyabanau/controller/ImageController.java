package com.aajkyabanau.controller;

import com.aajkyabanau.service.ImageIngredientService;
import com.aajkyabanau.service.OpenAIVisionService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ImageController {

    private final ImageIngredientService imageService;
    private final OpenAIVisionService imageServiceOpenAI;

    public ImageController(ImageIngredientService imageService, OpenAIVisionService imageServiceOpenAI) {
        this.imageService = imageService;
        this.imageServiceOpenAI = imageServiceOpenAI;
    }

    @PostMapping("/detect")
    public List<String> detectIngredients(@RequestParam("file") MultipartFile file) throws Exception {
        byte[] bytes = file.getBytes();
        return imageService.detectIngredients(bytes);
    }

    @PostMapping("/detectOpenAI")
    public List<String> detectIngredientsOpenAI(@RequestParam("file") MultipartFile file) throws Exception {
        Path temp = Files.createTempFile("ingredient", ".jpg");
        byte[] bytes = file.getBytes();
        file.transferTo(temp.toFile());
        List<String> result = imageServiceOpenAI.detectIngredients(temp.toFile()) ;
        Files.delete(temp);

        return result;

    }


}
