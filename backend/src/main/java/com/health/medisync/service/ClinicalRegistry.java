package com.health.medisync.service;

import java.util.*;

public class ClinicalRegistry {
    private static final Set<String> NEURO_FOCUS = new HashSet<>(Arrays.asList(
        "septum pellucidum", "acid lipase", "pompe disease", "landau-kleffner", "encephalomyelitis",
        "adrenoleukodystrophy", "corpus callosum", "agnosia", "aicardi", "alexander disease",
        "alpers", "hemiplegia", "alzheimer", "anencephaly", "aneurysm", "angelman", "angiomatosis",
        "anoxia", "aphasia", "apraxia", "arachnoiditis", "arnold-chiari", "arteriovenous malformation",
        "asperger", "ataxia", "autism", "batten disease", "behcet", "bell's palsy", "binswanger",
        "blepharospasm", "brown-sequard", "canavan", "carpal tunnel", "causalgia", "central pain",
        "cerebral palsy", "chiari malformation", "chorea", "chronic pain", "creutzfeldt-jakob",
        "dandy-walker", "dementia", "dermatomyositis", "dysautonomia", "dysgraphia", "dyslexia",
        "dysphagia", "dyspraxia", "dystonia", "encephalitis", "epilepsy", "erb's palsy", "fabry",
        "fahr's syndrome", "friedreich's ataxia", "gaucher", "gerstmann", "guillain-barre",
        "huntington", "hydrocephalus", "narcolepsy", "neurofibromatosis", "parkinson", "stroke",
        "tourette", "tuberous sclerosis", "west syndrome", "zellweger", "spasticity", "tremor",
        "seizure", "neuropathy", "multiple sclerosis", "migraine", "headache", "spinal", "brain",
        "nerve", "palsy", "syndrome", "disorder", "dysfunction", "paralysis"
    ));

    private static final Set<String> ONCO_FOCUS = new HashSet<>(Arrays.asList(
        "leukemia", "sarcoma", "lymphoma", "melanoma", "carcinoma", "adenocarcinoma", "tumor",
        "cancer", "malignancy", "malignant", "neoplasm", "metastasis", "oncology", "chemotherapy",
        "radiation", "biopsy", "staging", "breast", "prostate", "lung", "colon", "rectal", "skin",
        "pancreas", "liver", "kidney", "bladder", "brain", "thyroid", "testicular", "ovarian",
        "cervical", "uterine", "esophageal", "gastric", "stomach", "bone", "blood", "myeloma",
        "glioma", "blastoma", "astrocytoma", "ependymoma", "mesothelioma", "osteosarcoma",
        "rhabdomyosarcoma", "ewing", "wilms", "retinoblastoma", "neuroblastoma", "hodgkin",
        "non-hodgkin", "kaposi", "mycosis fungoides", "sezary", "waldenstrom", "polycythemia",
        "thrombocythemia", "myelofibrosis", "myelodysplastic"
    ));

    private static final Set<String> METABOLIC_FOCUS = new HashSet<>(Arrays.asList(
        "diabetes", "diabetic", "diabetis", "insulin", "glucose", "sugar", "metabolic", "thyroid",
        "adrenal", "pituitary", "hormone", "endocrine", "cushing", "addison", "graves", "hashimoto",
        "hyperthyroid", "hypothyroid", "hyperglycemia", "hypoglycemia", "ketosis", "ketoacidosis",
        "obesity", "cholesterol", "triglyceride", "lipids", "metabolism", "enzyme", "deficiency",
        "phenylketonuria", "galactosemia", "glycogen", "lysosomal", "mitochondrial"
    ));

    public static boolean isNeurological(String q) {
        String lower = q.toLowerCase();
        return NEURO_FOCUS.stream().anyMatch(lower::contains);
    }

    public static boolean isOncological(String q) {
        String lower = q.toLowerCase();
        return ONCO_FOCUS.stream().anyMatch(lower::contains);
    }

    public static boolean isMetabolic(String q) {
        String lower = q.toLowerCase();
        return METABOLIC_FOCUS.stream().anyMatch(lower::contains);
    }
}
