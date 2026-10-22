---
name: sci-immune-comparative-recognition-target-discovery-wor-ecf7285f
description: Discover candidate targets or markers from disease-associated recognition signals by filtering for specificity before inferring mechanism.
scienceevolve-title: "Antibody and immune recognition · comparative recognition target discovery workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Use this skill to transform an unexplained or disease-associated recognition signal into a bounded target-discovery research program. The workflow teaches a reusable method: start from a reproducible recognition event, decompose specificity against disease and essential normal states, identify candidate molecular entities, validate with orthogonal evidence, and infer mechanism only after candidate identity and selectivity are supported. It applies to autoantigens, tumor-associated antigens, cell-surface markers, secreted biomarkers, and other recognition-driven target classes.

# When to use

Use this skill when:
- A reagent, phenotype, secretion pattern, or immune signal distinguishes disease-associated from normal contexts but the underlying target or marker is unknown.
- Designing nonclinical research to evaluate whether a candidate target is disease-biased, accessible, and biologically interpretable.
- Comparing recognition-based discovery strategies across disease models or modalities.
- Planning iterative qualification of a target from initial observation to mechanistic hypothesis.

Do not use this skill for clinical decision-making, patient-specific recommendations, operational laboratory protocols, or treating single-study results as field consensus.

# Inputs required

Before generating a plan, identify or assume:
- **Recognition signal:** antibody, ligand, aptamer, secretion profile, staining pattern, or functional phenotype.
- **Disease context:** disease state, subtype, or altered biological condition.
- **Essential normal counterparts:** cell types, tissues, or states whose preservation matters for the claim.
- **Available evidence:** prior literature, omics data, preliminary binding or localization observations.
- **Intended application:** detection, imaging, depletion, delivery, or mechanism discovery.
- **Constraints:** model systems, ethics/biosafety boundaries, and sample availability.

State any missing inputs as key uncertainties.

# Core Workflow

Execute the following ordered route. Do not advance to a later stage until the preceding decision gate is satisfied.

## Stage 1: Frame the recognition event and knowledge gap
- Define the reproducible observation and the biological context in which it occurs.
- State the disease-associated state and the essential normal states that must be distinguished.
- Identify the gap: is the molecular basis unknown, is selectivity unproven, or is functional relevance unclear?

## Stage 2: Filter for disease-state specificity
- Compare the recognition signal in disease-associated material against matched normal controls, unrelated disease controls, and negative/background contexts.
- Test across relevant cell states, tissues, developmental stages, or sample batches.
- **Decision gate:** If the signal is not reproducibly enriched in disease versus essential normal contexts, stop or redesign the recognition strategy. Do not proceed to candidate identity.

## Stage 3: Generate candidate target hypotheses
- Convert the recognition event into competing molecular hypotheses (e.g., specific molecular entity, conformational epitope, multivalent display, or presentation-dependent feature).
- Rank candidates by enrichment over controls, biological plausibility, structural accessibility, and compatibility with the intended modality.
- For each candidate, state evidence strength, key assumptions, likely failure modes, and the minimal test needed to advance or reject it.

## Stage 4: Validate candidate identity and association
- Enrich or identify candidates using a recognition-preserving strategy with matched specificity controls.
- Validate with at least one independent assay class that measures a different property from the discovery assay.
- Test whether candidate presence predicts the original recognition signal in relevant cells, compartments, or states.
- **Decision gate:** If candidates are not reproducibly enriched, molecular evidence is ambiguous, or validation fails in independent systems, return to Stage 3 or stop.

## Stage 5: Assess functional relevance and mechanism
- Only after identity and association are supported, design perturbation or comparison strategies that test whether the candidate contributes to the phenotype or disease process.
- Separate causal contribution from co-occurrence, and target-specific effects from nonspecific system disruption.
- **Decision gate:** If functional tests cannot distinguish specific effects from background, treat the candidate as a marker or associated feature rather than a mechanistic driver.

## Stage 6: Iterate and qualify
- Update the target status: rejected, ambiguous, plausible, strong candidate, or modality-specific lead.
- Identify the weakest evidence link and choose the smallest discriminating test that can change confidence.
- **Stop conditions:**
  - Lack of reproducible disease bias.
  - Specificity controls fail.
  - Candidate identity remains ambiguous after orthogonal testing.
  - Functional effects scale with off-target exposure or nonspecific toxicity.
  - Safety, regulatory, or ethical constraints are not satisfied.

# Output Format

When using this skill, produce:

1. **Research question:** one-sentence decision question and the trade-off or gap being addressed.
2. **Specificity assessment:** disease versus normal comparison, controls used, and gate outcome.
3. **Candidate hypotheses:** ranked list with evidence strength, assumptions, failure modes, and minimal tests.
4. **Validation plan:** discovery, identification, and orthogonal validation modules with variables, controls, metrics, and stop conditions.
5. **Mechanism inference plan:** functional relevance tests, causal logic, and decision criteria.
6. **Iteration map:** current qualification status, weakest link, next minimal test, and continue/redesign/stop rules.
7. **Evidence boundary statement:** what is supported, inferred, or speculative.

# Validation Gates

At each stage, confirm:
- **Specificity gate:** Signal distinguishes disease from essential normal and unrelated contexts.
- **Identity gate:** Candidate is reproducibly enriched and independently validated.
- **Association gate:** Candidate presence correlates with the recognition signal in relevant biological contexts.
- **Function gate:** Target engagement or perturbation produces a specific, interpretable effect.
- **Safety/ethics gate:** Appropriate oversight, biosafety, privacy, and institutional approvals are in place for the proposed work.

# Claim Boundaries

This workflow establishes:
- Whether a recognition signal is disease-biased and reproducible.
- Whether a candidate molecular entity is plausibly associated with the signal.
- Whether functional relevance is supported by controlled evidence.

This workflow does **not** establish:
- Clinical efficacy, safety, or diagnostic validity.
- Universal absence or presence across all cell states or disease subtypes.
- Field-wide consensus from a single study.
- Equivalence between model systems and human disease.

# Failure Modes

- **Nonspecific recognition:** Signal persists in negative controls or is driven by assay format, reagent aggregation, or background interference.
- **Shared-feature recognition:** Candidate binds a common motif present in disease and normal states.
- **Presentation artifact:** Recognition depends on artificial immobilization, multivalency, or tissue processing rather than native biology.
- **Identity ambiguity:** Molecular evidence is dominated by contaminants, isoforms, or annotation errors.
- **Association without causation:** Candidate co-occurs with the phenotype but does not drive it.
- **Model-specificity:** Results are limited to one cell line, batch, or species and fail to generalize.
- **Therapeutic-index failure:** Desired and undesired effects scale together, undermining the selectivity rationale.

# Validity Checks

Before finalizing a plan, check:
- **Confounding:** Could sample handling, batch effects, cell-state heterogeneity, or detection reagents explain the signal?
- **Directness:** Is the candidate the direct target, a binding partner, or a correlated marker?
- **Reproducibility:** Are results consistent across technical and biological replicates, independent preparations, or model systems?
- **Statistical validity:** Are endpoints prespecified, effect sizes reported, and multiple-comparison risks addressed?
- **Boundary conditions:** Are claims limited to the tested contexts, assay platforms, and recognition modalities?
- **Evidence separation:** Are paper-validated observations, literature support, and agent-generated inferences clearly labeled?

# Provenance

- Cluster: 58
- Subcluster: 58.0.split0
- Source skills: e94eabbb8eaa033f, 1a3c09183580d608, 55c9eeaffc40f7f9, 374aa25713f9e52d, 3715e9121788498c, 9aaa50d5cffd211b, 71668011a010527a, 50537f569623406d
