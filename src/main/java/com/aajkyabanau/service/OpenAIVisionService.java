package com.aajkyabanau.service;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.File;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;

@Service
public class OpenAIVisionService {

    @Value("${openai.api.key}")
    private String apiKey;


        public List<String> detectIngredients(File imageFile) throws Exception {

            // Read and encode file
            byte[] bytes = java.nio.file.Files.readAllBytes(imageFile.toPath());
            String base64Image = Base64.getEncoder().encodeToString(bytes);

            WebClient client = WebClient.builder()
                    .baseUrl("https://api.openai.com/v1/chat/completions")
                    .defaultHeader("Authorization", "Bearer " + apiKey)
                    .build();

            String requestJson = """
        {
          "model": "gpt-4o-mini",
          "messages": [
            {
              "role": "user",
              "content": [
                {
                  "type": "text",
                  "text": "Identify all vegetables shown in the image and reply as comma separated list, only common vegetable names."
                },
                {
                  "type": "image_url",
                  "image_url": {
                    "url": "data:image/jpeg;base64,%s"
                  }
                }
              ]
            }
          ]
        }
        """.formatted(base64Image);

            String response = client.post()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestJson)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = new ObjectMapper().readTree(response);

            // Extract text response
            String raw = root.path("choices").get(0)
                    .path("message")
                    .path("content")
                    .asText();

            System.out.println("🔎 raw ingredients: " + raw);

            return Arrays.stream(raw.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }
    }

