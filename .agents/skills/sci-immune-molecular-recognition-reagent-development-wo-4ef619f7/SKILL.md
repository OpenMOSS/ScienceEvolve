---
name: sci-immune-molecular-recognition-reagent-development-wo-4ef619f7
description: End-to-end workflow for designing, validating, and iterating selective molecular recognition reagents against target molecules or states while excluding near-neighbor cross-reactivity.
scienceevolve-title: "Antibody and immune recognition · molecular recognition reagent development workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Enable an agent to translate a molecular recognition problem into a structured, evidence-tiered research program. This skill covers the full route from target definition and candidate generation through binding, specificity, functional compatibility, determinant mapping, and contextual validation. It is designed for reusable deployment across antibody, peptide, mimotope, receptor probe, engineered binder, and small-molecule probe discovery contexts. It does not encode source-specific systems, parameters, or paper conclusions.

# When to use

- The user needs to develop or evaluate a selective recognition reagent for a target molecule, complex, cell state, or chemical feature that must be distinguished from near-neighbor objects.
- The intended use requires proof of binding, specificity, functional compatibility, or mechanistic determinants—not simply a literature summary.
- The user has a target and near-neighbor landscape but lacks a structured hypothesis-generation, control-design, and iteration strategy.
- The research question involves detection, localization, enrichment, perturbation, activity monitoring, or mechanistic validation.
- The user needs to separate binding evidence from specificity, functional, determinant, and context evidence.

Do not use this skill for:
- Clinical diagnosis, treatment recommendations, or patient-management decisions.
- Direct execution of wet-lab protocols, hazardous procedures, or fabrication parameters.
- Problems where the target and near-neighbor landscape are completely undefined and cannot be bounded.

# Inputs required

Before activating the workflow, collect or request:

- **Target definition**: molecule, complex, state, or feature to be recognized.
- **Near-neighbor landscape**: family members, isoforms, subtypes, modified forms, or conformational states that must be excluded or distinguished.
- **Intended functional role**: detection, localization, enrichment, perturbation, activity monitoring, or mechanism validation.
- **Known or hypothesized differential features**: sequence, structure, post-translational modification, conformation, expression condition, interaction partner, or functional state.
- **Sample and data constraints**: purified material, cellular material, tissue, structural models, omics data, or literature evidence.
- **Downstream application context**: immunoassay, imaging, affinity enrichment, functional blockade, signaling readout, or mechanistic modeling.
- **Safety, ethics, and compliance boundaries**: human/animal materials, pathogens, toxins, genetic manipulation, or dual-use risks. If high-risk materials are involved, restrict output to non-operational research design only.

# Core Workflow

## Phase 1: Define the recognition problem and landscape
1. State the target and its functional role in the research question.
2. Map the near-neighbor hierarchy: closest relatives, boundary cases (most likely false positives), and irrelevant negatives.
3. Define the intended use mode and the minimum acceptable selectivity.
4. **Decision Gate 1**: If the target cannot be distinguished from near-neighbors by any known feature, stop and redefine the problem or request more structural/functional data.

## Phase 2: Generate candidate reagent hypotheses
1. Propose a diverse set of candidate reagent classes (e.g., antibody, aptamer, engineered protein, peptide, mimotope, small-molecule probe, computational hit).
2. For each candidate, formulate a testable claim in the form:  
   *Target feature — Reagent mechanism — Expected evidence — Failure mode*.
3. Assign an initial evidence strength (speculative, supported, specificity-supported, functionally characterized, determinant-supported, context-validated).
4. **Decision Gate 2**: If all candidates derive from a single source or lack explicit failure modes, expand the candidate pool before proceeding.

## Phase 3: Design tiered validation
Structure validation in five ordered tiers. Do not skip tiers.

- **Tier 1 – Binding**: Does the candidate recognize the target in a controlled presentation?
- **Tier 2 – Specificity**: Does the candidate avoid recognition of near-neighbors and irrelevant objects?
- **Tier 3 – Functional compatibility**: Does the candidate suit the intended use (e.g., non-perturbing detection, or controllable perturbation if required)?
- **Tier 4 – Determinant mapping**: Which target feature (epitope, sequence, structure, modification, conformation, or state) explains recognition?
- **Tier 5 – Context validation**: Does the reagent perform reproducibly in the intended sample type and experimental condition?

**Decision Gate 3**: For each tier, define pass/fail thresholds, positive/negative/boundary controls, and stop conditions before data collection begins.

## Phase 4: Execute minimal viable validation
1. **Target positive**: Demonstrate signal above background on the target.
2. **Strong negative**: Use irrelevant objects or blank matrix to estimate non-specific background.
3. **Near-neighbor/boundary negative**: Test the closest relatives and hardest-to-exclude objects.
4. **Functional control**: Compare with and without the reagent, or compare tagged vs. untagged, to assess perturbation.
5. **Reproducibility check**: Require independent preparation or orthogonal readout for any claim.
6. **Stop conditions** (terminate if any are met):
   - Candidate cannot distinguish target from near-neighbors.
   - Signal depends on artifactual states (e.g., denaturation, fixation, carrier-specific presentation).
   - Candidate perturbs the target process in an uncontrolled way.
   - Results are inconsistent across repeats or orthogonal readouts.
   - Required conclusions exceed the validation tier reached.

## Phase 5: Analyze and separate evidence types
1. Isolate five evidence channels:
   - **Binding**: target recognition above background.
   - **Specificity**: lack of recognition of near-neighbors and irrelevant objects.
   - **Functional**: impact on the target process matches the intended use.
   - **Determinant**: perturbation, competition, or mutational evidence supports a feature-based explanation.
   - **Context**: performance in the intended sample type and condition.
2. Score each channel independently. Do not conflate binding success with specificity, or specificity with functional suitability.
3. **Decision Gate 4**: If evidence types are conflated in the analysis, stop claim advancement and re-separate the channels.

## Phase 6: Iterate or advance
- **If target recognition fails**: Re-evaluate target presentation, candidate source diversity, or whether the target feature is stable and accessible.
- **If cross-reactivity appears**: Expand the near-neighbor panel, redefine differential features, or disqualify the candidate for high-specificity uses.
- **If unexpected perturbation occurs**: Determine whether the perturbation is acceptable for the use mode; if not, deprioritize the candidate.
- **If determinant mapping is ambiguous**: Apply orthogonal perturbations (competition, mutation, fragment mapping, alternative display) and limit claims to "candidate region supports" rather than "unique determinant."
- **If all tiers pass**: Advance the reagent to new mechanistic questions (localization, dynamics, interaction networks) or broader context testing, but treat each new context as an independent validation problem.
- **Decision Gate 5**: Only advance claims to the level supported by the highest fully passed tier. Do not extrapolate determinant or context conclusions from binding-only data.

## Phase 7: Set scope and boundary limits
1. Explicitly state the validated context: target objects, near-neighbors tested, sample types, conditions, and use modes.
2. Flag contexts requiring re-validation: cross-species, cross-tissue, cross-conformation, cross-disease state, or changed use mode (e.g., detection → perturbation).
3. Archive the provenance of source assumptions and the tiered evidence map for downstream reuse.

# Output Format

Each invocation should produce:

1. **Research question**  
   - Target object or state.  
   - Near-neighbor objects to be excluded.  
   - Intended downstream use.

2. **Gap and rationale**  
   - Current knowledge or tool gap.  
   - Why a selective recognition reagent advances the problem.  
   - Boundary between verified facts and inferences.

3. **Candidate hypotheses**  
   - At least three structured claims (target feature — reagent — expected evidence — failure mode).  
   - Evidence strength, key assumptions, minimal validation, and failure mode per hypothesis.

4. **Experimental design**  
   - Target, strong negative, near-neighbor, boundary, and functional controls.  
   - Independent variables, dependent variables, readouts, and confounders.  
   - Tiered validation plan and stop conditions.

5. **Analysis plan**  
   - How binding, specificity, functional, determinant, and context evidence will be separated.  
   - Rules for scoring positive, negative, ambiguous, and failed results.  
   - Pre-registered thresholds and normalization strategy.

6. **Iteration plan**  
   - Branching logic for target-recognition failure, cross-reactivity, perturbation, ambiguous determinants, and success.  
   - Next-step priorities and stop conditions.

7. **Validity and safety statement**  
   - Confounders, reproducibility requirements, statistical interpretation limits.  
   - Extrapolation boundaries and safety/ethics/compliance restrictions.

# Validation Gates

| Gate | Criterion | Stop/Iterate Trigger |
|------|-----------|----------------------|
| Problem definition | Target and near-neighbor landscape are bounded | Stop if no discriminable feature exists |
| Candidate diversity | Multiple reagent classes or sources represented | Iterate if single-source pool |
| Tier 1 – Binding | Target signal exceeds background + strong negative | Stop if signal is indistinguishable from background |
| Tier 2 – Specificity | Near-neighbor and boundary signals are below threshold | Stop if cross-reactivity is unresolvable |
| Tier 3 – Functional | Perturbation profile matches intended use mode | Stop if uncontrolled perturbation occurs |
| Tier 4 – Determinant | Orthogonal evidence supports a feature-based explanation | Iterate if only correlative evidence exists |
| Tier 5 – Context | Reproducible performance in target sample/condition | Stop if batch or platform dependency blocks reproducibility |
| Claim separation | Binding, specificity, functional, determinant, and context scores are not conflated | Re-analyze if channels are mixed |

# Claim Boundaries

- **Binding claim**: "Candidate X produces a detectable signal with target Y under condition Z." Requires Tier 1 only.
- **Specificity claim**: "Candidate X distinguishes target Y from near-neighbor set N under condition Z." Requires Tier 1 + Tier 2.
- **Functional-compatibility claim**: "Candidate X is suitable for use mode U with target Y." Requires Tier 1–3.
- **Determinant claim**: "Recognition is supported by feature F." Requires Tier 1–4; avoid "unique determinant" language unless multiple orthogonal perturbations converge.
- **Context-validated claim**: "Candidate X performs reproducibly in sample type S and condition C." Requires all five tiers.
- Do not extrapolate across species, tissue types, conformational states, disease states, or use modes without independent validation.

# Failure Modes

- **Cross-reactivity**: Candidate recognizes near-neighbors or unrelated objects due to shared epitopes, conformational mimicry, or non-specific adsorption.
- **Conformational dependence**: Recognition requires a non-physiological or artifactual target state (e.g., denaturation, fixation, carrier context).
- **Sample-preparation artifact**: Signal arises from purification tags, fixation, overexpression, or matrix effects rather than the target feature.
- **Uncontrolled perturbation**: The reagent alters target function, localization, or stability in a way that invalidates the intended use.
- **Platform dependency**: Results are valid only on a single detection platform, readout, or batch and fail orthogonal confirmation.
- **Determinant ambiguity**: Multiple features co-vary with recognition; perturbation of one affects folding, stability, or expression, preventing clean attribution.
- **Context collapse**: Performance in purified systems does not translate to complex samples due to masking, degradation, or competing interactions.

# Validity Checks

- **Confounding**: Are near-neighbors included in the control set? Could tags, carriers, fixation, or matrix generate false positives? Does the target remain in a biologically relevant state?
- **Reproducibility**: Are independent candidates, independent preparations, or orthogonal readouts used? Are thresholds and stop conditions pre-defined?
- **Statistical interpretation**: Are variability and uncertainty reported? Is exploratory screening separated from confirmatory validation? Are multiple comparisons addressed?
- **Extrapolation**: Are claims restricted to tested near-neighbors, sample types, and conditions? Is cross-species, cross-tissue, or cross-disease application flagged for re-validation? Is a change in use mode (detection → perturbation) flagged for re-assessment of functional compatibility?

# Provenance

Synthesized from cluster 15, subcluster 15.1.split0. Derived from source skills: pad-isoform-selective-probe-discovery, protease-driven-antibody-fragmentation-discovery, peptide-mimotope-antibody-recognition-workflow, tagged-protein-research-workflow, antibody-guided-mimotope-discovery-workflow, jawless-vertebrate-vlr-reagent-discovery, epitope-mapping-by-orthogonal-display-scanning, developmental-perturbation-immune-exploration. Source-specific systems, materials, parameters, and paper conclusions have been removed; only the reusable workflow structure is retained.
