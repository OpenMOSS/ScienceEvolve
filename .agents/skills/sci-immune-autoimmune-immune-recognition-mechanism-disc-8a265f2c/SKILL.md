---
name: sci-immune-autoimmune-immune-recognition-mechanism-disc-8a265f2c
description: A reusable end-to-end workflow for generating hypotheses, designing staged validation studies, and adjudicating evidence to discover and bound autoimmune immune recognition mechanisms.
scienceevolve-title: "Antibody and immune recognition · autoimmune immune recognition mechanism discovery workflow"
scienceevolve-area: antibody-and-immune-recognition
---

## Purpose

Guide agents to discover and validate autoimmune immune recognition mechanisms—spanning antigen-specific responses, peptide-cytokine recognition, idiotype network cascades, and cell-type signatures—through staged hypothesis generation, controlled study design, layered evidence adjudication, and iterative refinement. This skill produces non-operational research plans and does not provide clinical advice, treatment recommendations, or executable wet-lab protocols.

## When to use

Use this skill when the user asks to:
- Generate research questions about how immune components recognize self-antigens, propagate through antibody networks, or manifest as cell-type-specific signatures in autoimmune disease.
- Design studies that compare patient and control responses, stratify by disease stage or host genotype, or test candidate molecular features for mechanistic relevance.
- Discriminate association from functional relevance, causal plausibility, or causal necessity in immune recognition.
- Plan minimal viable validation before expanding to larger cohorts or orthogonal assays.

Do not use this skill for clinical diagnosis, patient management, treatment selection, operational laboratory execution, or protocol-level experimental instructions.

## Inputs required

Ask for or identify:

- **Disease context:** target autoimmune phenotype, diagnostic criteria, clinically meaningful strata, and tissue compartments of interest.
- **Candidate mechanism:** the self-antigen, peptide motif, cytokine, idiotype network node, receptor-ligand pair, or cell-type signature under study.
- **Prior evidence:** existing associations, genetic or environmental modifiers, and whether findings are human observational, animal-model, or in vitro.
- **Sample or model sources:** available biospecimens, model systems, and ethical or biosafety constraints.
- **Comparator groups:** healthy controls, disease controls, unrelated antigen/antibody/cell-signature controls, and stage-matched strata.
- **Readouts:** cytokine or activation markers, responder frequency, gene-expression signatures, serological spreading, functional immune signatures, or tissue-level endpoints.
- **Confounders and covariates:** age, sex, ancestry, disease activity, treatment exposure, batch effects, sample handling, and tissue-processing variables.
- **Study goal:** hypothesis generation, mechanism discrimination, biomarker evaluation, or feasibility assessment.

If key inputs are missing, state the gap and propose a minimal exploratory design that can clarify it.

## Core Workflow

Follow this ordered end-to-end route. At each gate, decide whether to proceed, iterate, or stop.

### 1. Frame the mechanistic gap
Define the autoimmune disease context, the candidate immune recognition component, the functional event to explain (e.g., specific activation, network propagation, signature induction), and why the mechanism remains unresolved. State the prior evidence level and the specific comparison problem (patient vs. control, stage vs. stage, or candidate vs. irrelevant comparator).

### 2. Generate contrastive hypotheses
Produce structured hypothesis cards for each candidate mechanism. Each card must include:
- **Hypothesis:** a testable claim about the candidate's role in immune recognition or disease progression.
- **Evidence strength:** speculative, weak, moderate, or strong.
- **Key assumptions:** biology, measurement, cohort, and endpoint assumptions that must hold.
- **Predicted observations:** expected readouts if the hypothesis is true.
- **Main alternative explanation:** the most plausible competing mechanism.
- **Failure modes:** nonspecific activation, batch effects, confounding, assay cross-reactivity, low responder frequency, or stage misclassification.
- **Boundary conditions:** contexts where the hypothesis should not be generalized.

Prioritize hypotheses that:
- Distinguish specific recognition from generalized immune hyperreactivity.
- Predict a directional change across disease stage or clinical state.
- Identify the causal cell type, receptor, or network role.
- Are testable with minimal validation before cohort expansion.

### 3. Prespecify evidence layers and controls
Define a layered evidence model appropriate to the mechanism class:
- **Layer 1 (Association/Localization):** candidate presence or correlation in the relevant tissue or compartment.
- **Layer 2 (Specific Recognition):** selective immune-cell, antibody, or receptor binding to the candidate versus irrelevant controls.
- **Layer 3 (Functional Response):** candidate-specific change in immune-cell state, cytokine output, or signaling readout.
- **Layer 4 (Network/Disease Concordance):** temporal alignment with disease stage, propagation to downstream specificities, or correlation with organ-level pathology.

For each layer, select comparators: affected vs. unaffected tissue, patient vs. healthy control, disease control, irrelevant antigen/antibody/cell signature, and stage-matched strata. Define positive, negative, and process controls before data collection.

### 4. Design staged validation
Start with a **minimal viable validation**—the smallest design that can test Layer 1 and Layer 2 with clean controls. Define:
- Independent variables: candidate exposure, disease stage, host genotype or background.
- Dependent variables: responder frequency, response magnitude, signature score, or network spreading index.
- Stratification variables: disease activity, treatment exposure, tissue source, batch.
- Stop conditions: controls fail to separate, apparent responses are driven by a single batch, responder frequency is too low for meaningful comparison, or stage definitions are unreliable.

Only expand to **strong validation** (orthogonal assays, independent cohorts, prospective specification, causal perturbation) after minimal gates are passed.

### 5. Prespecify analysis plan and decision criteria
Before reviewing evidence, define:
- Responder thresholds and primary statistical contrasts.
- Covariates and confounder adjustment strategy.
- Multiplicity handling for multiple candidates, readouts, or subgroups.
- Visualization strategy that displays uncertainty for small subgroups.
- Decision criteria for pass, fail, or ambiguous at each subsequent gate.

### 6. Collect and document evidence
Record sample source, stage definitions, assay metadata, batch information, and exclusions. Separate raw observations from derived metrics. Label each finding as directly supported by prior data, inferred for the new setting, or agent-generated speculation.

### 7. Gate 1 — Assay validity and specificity
**Criteria:**
- Positive and negative controls separate cleanly.
- Candidate signal exceeds irrelevant comparators and background.
- Readouts are reproducible across batches or independent preparations.

**Outcomes:**
- **Pass:** Proceed to Gate 2.
- **Fail:** Stop mechanistic interpretation and redesign the assay or controls.
- **Ambiguous:** Iterate with orthogonal detection, refined responder definitions, or additional specificity checks.

### 8. Gate 2 — Role and mechanism assignment
Determine whether the candidate acts in the hypothesized role (e.g., effector-cell factor, target-cell factor, network upstream node, antigen-presenting module). Use role-separated perturbation logic: test the candidate in one role while holding interacting partners constant, then reverse.

**Outcomes:**
- **Pass:** Candidate role is supported over the main alternative; proceed to Gate 3.
- **Fail:** Result supports an alternative pathway or indirect involvement; update the hypothesis card and iterate with controls targeting the alternative.
- **Ambiguous:** Multiple roles are affected; decompose into direct, permissive, and secondary effects before proceeding.

### 9. Gate 3 — Temporal and disease concordance
Compare readouts across disease stages (pre-pathology, onset, established, late/recovery). Require that upstream immune changes precede downstream markers or pathology when causal ordering is claimed. Distinguish target-tissue events from systemic activation.

**Outcomes:**
- **Pass:** Stage concordance supports the hypothesized mechanism timing; proceed to Gate 4.
- **Fail:** Recognition appears only after established lesions; reframe the candidate as a damage-associated or bystander marker. Stop causal claims.
- **Ambiguous:** Local and systemic signals disagree; investigate trafficking, antigen release, or assay bias before iterating.

### 10. Gate 4 — Causal plausibility and replication
Assess whether the accumulated evidence supports association, functional relevance, causal plausibility, or causal necessity. Require independent replication, held-out validation, or prespecified prospective analysis before upgrading to strong or causal claims.

**Outcomes:**
- **Pass:** Evidence supports the claimed level of mechanism; bound the claim and document required assumptions.
- **Fail:** Evidence supports only association or is confounded; downgrade the claim and specify what perturbation or replication evidence would be needed.
- **Ambiguous:** Mixed readouts or underpowered subgroups; iterate with larger cohorts or orthogonal endpoints.

### 11. Iterate, redesign, or stop
Based on gate outcomes:
- **Advance:** If all gates pass, move to orthogonal confirmation, independent cohorts, or prospective validation.
- **Refine:** If ambiguous, add covariates, refine stage definitions, decompose effects, or test boundary conditions (host background, tissue context).
- **Deprioritize:** If specificity or role assignment fails, reject the candidate mechanism and test the next contrastive hypothesis.
- **Stop:** If controls are inadequate, responses are nonspecific, or clinical extrapolation is unadjusted and underpowered, halt mechanistic claims and repair the design.

### 12. Grade evidence and bound claims
Assign each conclusion an evidence grade (exploratory, moderate, strong) and state scope limits: model system, tissue compartment, disease stage, readout regime, and population ancestry. Explicitly separate immune recognition evidence from claims of disease causation, pathogenicity, or clinical utility.

## Output Format

When using this skill, produce:

1. **Research question:** one concise autoimmune immune-recognition mechanism question.
2. **Evidence map:** what is directly supported, what is inferred, and what remains speculative.
3. **Hypothesis cards:** each with evidence strength, key assumptions, predicted observations, failure modes, and boundary conditions.
4. **Staged validation design:** minimal viable design (layers, groups, controls, readouts, stratification) and strong validation plan (orthogonal assays, replication, prospective criteria).
5. **Analysis plan:** responder definition, primary comparisons, confounder checks, multiplicity handling, visualization strategy, and prespecified gate criteria.
6. **Iteration plan:** how each gate outcome (pass, fail, ambiguous) updates the hypothesis and triggers follow-up, redesign, or stopping.
7. **Validity and ethics statement:** confounders, reproducibility requirements, population boundaries, and safety/privacy constraints.
8. **Claim boundary summary:** explicit scope limits, evidence grades, and separation from clinical recommendations.

## Validation Gates

The four decision gates in the Core Workflow are summarized here with their pass criteria:

| Gate | Purpose | Pass Criteria | Fail Criteria | Iterate Criteria |
|------|---------|---------------|---------------|------------------|
| **Gate 1** | Assay validity and specificity | Controls separate; candidate exceeds irrelevant comparators; reproducible across batches | Controls overlap; candidate signal indistinguishable from background | Weak or batch-dependent signal; add orthogonal detection or refine thresholds |
| **Gate 2** | Role and mechanism assignment | Perturbation supports hypothesized role over main alternative | Result supports alternative pathway or indirect role only | Multiple roles affected; decompose direct vs. permissive vs. secondary effects |
| **Gate 3** | Temporal and disease concordance | Upstream immune changes precede downstream markers; stage-concordant | Recognition follows established pathology; local/systemic discordance unexplained | Discordant local/systemic signals; investigate trafficking or assay bias |
| **Gate 4** | Causal plausibility and replication | Independent replication or held-out validation supports claimed evidence level | Confounded association or underpowered subgroups prevent causal inference | Mixed readouts; require larger cohorts or prospective specification |

## Claim Boundaries

- **Association is not causation.** Immune recognition of a candidate self-antigen supports recognition, not necessarily disease causation, pathogenicity, or treatment direction.
- **Model boundaries.** Findings from one model system, tissue, or species should not be treated as human disease consensus without independent human-relevant validation.
- **Compartment boundaries.** Peripheral blood or systemic readouts cannot by themselves prove tissue-specific pathogenicity; tissue or mechanistic evidence is required.
- **Population boundaries.** Genotype, ancestry, or cohort-specific associations should not be generalized to all patients or populations.
- **Stage boundaries.** A mechanism active at one disease stage may be irrelevant at another; do not extrapolate across pre-pathology, onset, established disease, and recovery without evidence.
- **Clinical non-advice.** This skill does not provide diagnosis, prognosis, treatment recommendations, or patient-specific risk assessment.

## Failure Modes

- **Nonspecific activation:** Generalized immune hyperreactivity or mitogenic effects are mistaken for candidate-specific recognition.
- **Confounding:** Disease activity, treatment exposure, age, sex, ancestry, batch effects, or sample handling create spurious associations.
- **Assay artifacts:** Cross-reactivity, reporter fusion disruption, aggregation, matrix retention, or batch-specific drift produce false specificity.
- **Low power or rare responders:** Small subgroups or low responder frequency lead to unstable effect estimates and overinterpretation.
- **Stage misclassification:** Unreliable disease-stage definitions or treatment-confounded strata obscure temporal ordering.
- **Circular reasoning:** Using the same data to define a signature and test its association, or post-hoc responder definitions.
- **Overgeneralization:** Extending findings from one candidate, tissue, or cohort to an entire disease class or population.

## Validity Checks

Before presenting conclusions, verify:

- **Confounding control:** Age, sex, ancestry, disease activity, treatment, comorbid inflammation, batch, and sample handling are recorded and adjusted where possible.
- **Control adequacy:** Negative, positive, irrelevant-antigen/antibody, disease-control, and stage-matched controls are included and interpreted.
- **Statistical validity:** Tests are appropriate for the data type (responder counts, continuous magnitudes, repeated measures); multiplicity is handled; effect sizes and uncertainty are reported; non-significant results are not treated as equivalence.
- **Reproducibility:** Key findings are replicated across independent batches, cohorts, or held-out datasets; analysis decisions are prespecified.
- **Boundary conditions:** Claims are limited to the tested model, tissue, stage, readout regime, and population.
- **Evidence labeling:** Every claim distinguishes directly supported observations from inferred or speculative extensions.
- **Operational safety:** No clinical advice, dosing, culture conditions, procedural steps, or executable wet-lab instructions are included in outputs.

## Provenance

- Merged from cluster `4`, subcluster `4.1.split0`.
- Synthesized from representative source skills:
  - `autoimmune-peptide-cytokine-research-design` (`b3b11947bbf1ec95`)
  - `autoimmune-antigen-response-exploration` (`f386d5e678f627bb`)
  - `biomarker-driven-autoimmune-pulmonary-exploration` (`10b5e745c504682d`)
  - `idiotype-network-autoimmunity-research-workflow` (`8fcd673d85632d68`)
  - `immune-recognition-mechanism-explorer` (`dffb8ee56dbda8ad`)
  - `idiotype-vaccine-research-workflow` (`7618fe69933a0b75`)
  - `fluorescent-affinity-screening-skill` (`f0e6d5cf5878facd`)
  - `food-allergen-igereactivity-exploration` (`eda350c4dd274d88`)
