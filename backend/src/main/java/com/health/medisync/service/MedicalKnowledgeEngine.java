package com.health.medisync.service;

import org.springframework.stereotype.Service;
import java.util.*;

/**
 * Enterprise Medical Knowledge Engine (RAG)
 * Retrieves evidence-based guidelines and research for clinical grounding.
 */
@Service
public class MedicalKnowledgeEngine {

    // In production, this would use a VectorDatabase (pgvector / Pinecone)
    public List<Map<String, String>> retrieveGuidelines(String symptoms) {
        List<Map<String, String>> evidence = new ArrayList<>();
        
        // Simulated Vector Search
        if (symptoms.toLowerCase().contains("chest pain")) {
            evidence.add(Map.of(
                "source", "AHA/ACC Chest Pain Guidelines (2021)",
                "summary", "Immediate EKG and troponin testing recommended for suspected ACS.",
                "url", "https://pubmed.ncbi.nlm.nih.gov/34715509/"
            ));
        }
        
        if (symptoms.toLowerCase().contains("headache")) {
            evidence.add(Map.of(
                "source", "International Classification of Headache Disorders (ICHD-3)",
                "summary", "Identify 'SNOOP' red flags for secondary headache screening.",
                "url", "https://ichd-3.org/"
            ));
        }

        return evidence;
    }

    public String buildEvidenceContext(List<Map<String, String>> evidence) {
        if (evidence.isEmpty()) return "";
        
        StringBuilder sb = new StringBuilder("### CLINICAL EVIDENCE & GUIDELINES:\n");
        for (var e : evidence) {
            sb.append("- Source: ").append(e.get("source"))
              .append("\n  Finding: ").append(e.get("summary")).append("\n");
        }
        return sb.toString();
    }
}
