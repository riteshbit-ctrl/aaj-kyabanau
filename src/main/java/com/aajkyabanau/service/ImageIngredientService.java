package com.aajkyabanau.service;

import com.google.cloud.vision.v1.AnnotateImageRequest;
import com.google.cloud.vision.v1.AnnotateImageResponse;
import com.google.cloud.vision.v1.BatchAnnotateImagesResponse;
import com.google.cloud.vision.v1.Feature;
import com.google.cloud.vision.v1.Feature.Type;
import com.google.cloud.vision.v1.Image;
import com.google.cloud.vision.v1.ImageAnnotatorClient;
import com.google.cloud.vision.v1.WebDetection;
import com.google.protobuf.ByteString;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ImageIngredientService {

    public List<String> detectIngredients(byte[] imageBytes) throws Exception {

        List<String> detectedWords = new ArrayList<>();

        ByteString imgBytes = ByteString.copyFrom(imageBytes);

        // create vision request
        Image img = Image.newBuilder().setContent(imgBytes).build();
        Feature feat = Feature.newBuilder().setType(Type.WEB_DETECTION).build();
        AnnotateImageRequest request = AnnotateImageRequest.newBuilder()
                .addFeatures(feat)
                .setImage(img)
                .build();

        try (ImageAnnotatorClient client = ImageAnnotatorClient.create()) {

            BatchAnnotateImagesResponse response = client.batchAnnotateImages(Collections.singletonList(request));
            AnnotateImageResponse res = response.getResponsesList().get(0);

            if (res.hasError()) {
                System.out.println("Vision API Error: " + res.getError().getMessage());
                return detectedWords;
            }

            WebDetection web = res.getWebDetection();

            if (web == null) return detectedWords;

            // 1️⃣ Best guess (example "vegetables plate")
            if (web.getBestGuessLabelsCount() > 0) {
                detectedWords.add(web.getBestGuessLabels(0).getLabel());
            }

            // 2️⃣ Web entity labels (the MOST useful)
            for (WebDetection.WebEntity entity : web.getWebEntitiesList()) {
                if (entity.getDescription() != null && !entity.getDescription().isBlank()) {
                    detectedWords.add(entity.getDescription());
                }
            }

            // 3️⃣ Partial matching images — extract last segment of URL (extra intelligence)
            for (WebDetection.WebImage imgMatch : web.getPartialMatchingImagesList()) {
                if (imgMatch.getUrl() != null) {
                    String[] parts = imgMatch.getUrl().split("/");
                    String last = parts[parts.length - 1];
                    last = last.replaceAll("[^a-zA-Z ]", "");
                    detectedWords.add(last);
                }
            }
        }

        // 🧹 Cleanup & dedupe
        return detectedWords.stream()
                .map(String::toLowerCase)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .distinct()
                .collect(Collectors.toList());
    }
}
