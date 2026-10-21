---
name: sci-immune-immune-correlate-discovery-workflow-303eb67d
description: A reusable end-to-end workflow for generating, validating, and iterating hypotheses about immune correlates of protection, remission, or aberrant phenotypes in clinical and cohort contexts.
scienceevolve-title: "Antibody and immune recognition · immune correlate discovery workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Use this skill to move from an observed clinical or cohort signal to a ranked set of testable immune-correlate hypotheses and non-operational validation plans. It structures the process of identifying candidate immune features, distinguishing association from independence and mechanism, designing phased validation, and iterating based on evidence without treating single-study findings as consensus or clinical guidance.

# When to use

Use this skill when a user asks to:

- Propose immune correlates of protection, remission, or aberrant phenotypes from clinical, cohort, or observational data.
- Design non-operational validation plans for candidate immune markers, receptor features, antibody patterns, repertoire states, or glycoform signatures.
- Evaluate whether an immune feature adds information beyond established markers or explains a disease-relevant tissue or cellular phenotype.
- Iterate hypotheses after discovery, validation, or mechanistic experiments.

Do not use this skill for patient-specific clinical advice, treatment recommendations, operational laboratory protocols, or direct experimental execution.

# Inputs required

Before using the skill, collect or request:

- Target disease, phenotype, or clinical endpoint and the biological system under study.
- Established markers, subgroups, or pathways already used for stratification.
- Candidate immune feature and its biological rationale for connection to the known system.
- Available data types: clinical metadata, immune repertoire, sequence, structural, transcriptomic, cellular phenotype, serology, or follow-up endpoints.
- Cohort provenance: recruitment setting, disease stage, treatment context, sample timing, and major missingness patterns.
- Comparison groups: healthy, disease, related-disease, familial, or longitudinal contexts.
- Constraints on data sharing, privacy, biospecimen use, ethics review, and biosafety.
- The user's intended output: research questions, study design, analysis plan, or critique of an existing proposal.

# Core Workflow

1. **Frame the correlate question**
   - Pair the clinical endpoint or cohort phenotype with a candidate immune feature space (e.g., antibody specificity, repertoire diversity, cellular marker, glycoform state).
   - Define the exact claim scope: association, independence from established markers, mechanism, or boundary condition.
   - *Decision Gate 1 — Scope Gate:* If the request is for clinical advice, operational protocols, or lacks a cohort or clinical context, stop and redirect.

2. **Generate ranked hypotheses**
   - Produce hypothesis cards for: feature association, independence from established markers, mechanism, and boundary or context dependence.
   - Assign evidence strength: exploratory, replicated, adjusted, mechanistically plausible, or decision-grade.
   - Record key assumptions, predicted observations, and failure modes for each hypothesis.
   - *Decision Gate 2 — Viability Gate:* If no falsifiable hypothesis can be formed with explicit failure modes, stop.

3. **Design minimal viable validation**
   - **Discovery phase:** Detect enrichment or generate subgroup hypotheses in a well-characterized cohort with clear selection criteria.
   - **Validation phase:** Replicate in independent cohorts with harmonized endpoint definitions; pre-specify confirmatory versus exploratory intent.
   - **Mechanism phase:** Plan orthogonal readouts to test molecular or cellular plausibility without claiming causality from association alone.
   - Define variables, layered controls (negative, positive, disease, background, technical), evaluation metrics, and pre-defined stop conditions.
   - *Decision Gate 3 — Feasibility Gate:* If no independent cohort or appropriate control is available, downgrade claims to exploratory and flag limitations.

4. **Analyze with separated claims**
   - **Data preparation:** Harmonize metadata, endpoint definitions, feature-calling rules, and missingness tracking; check group balance on known risk factors.
   - **Association analysis:** Compare endpoints by feature status using appropriate longitudinal or survival methods; report effect sizes and uncertainty, not only significance labels.
   - **Independence analysis:** Adjust for established markers and known confounders; test whether the candidate adds information and whether interactions exist with disease stage or treatment context.
   - **Mechanism analysis:** Link the feature to molecular or cellular states; distinguish downstream correlates from candidate mediators; compare alternative mechanisms when possible.
   - *Decision Gate 4 — Control Gate:* If controls fail, negative controls show signal, or detection is unreliable, stop biological interpretation until technical validity is restored.

5. **Iterate and update claims**
   - **Upgrade:** If the association replicates and remains after adjustment, advance the claim to independently associated and refine the mechanism question.
   - **Reframe:** If the association replicates but is not independent, reclassify the feature as correlated with known markers; search for subgroup-specific effects or interactions.
   - **Boundary:** If the association is inconsistent across cohorts, generate context-dependent boundary hypotheses rather than discarding the candidate prematurely.
   - **Downgrade:** If mechanism readouts contradict the proposed model, preserve the association claim only if validation is strong; mark the mechanistic explanation as unsupported and search for alternative explanations.
   - *Decision Gate 5 — Claim Bounding Gate:* Ensure final claims match the highest evidence level achieved and do not exceed it.

6. **Synthesize and terminate**
   - Compile the evidence map, hypothesis table, validation plan, analysis summary, iteration log, and boundary or ethics notes.
   - Document residual uncertainty, extrapolation limits, and next-step recommendations.
   - *Stop condition:* The workflow terminates when outputs are bounded, provenance is recorded, and no further falsifiable test is defined without new data.

# Output Format

When using this skill, produce:

1. **Research question framing**
   - Disease context, immune feature space, gap, and claim scope.

2. **Evidence map**
   - Established markers or subgroups.
   - Candidate under-characterized immune feature.
   - Available data types and cohort constraints.
   - Source-derived inspiration versus new inference.

3. **Hypothesis table**
   - Hypothesis, mechanism, evidence strength, key assumptions, predicted observations, failure modes, and minimum validation needed.

4. **Validation plan**
   - Discovery, validation, and mechanism phases.
   - Variables, controls, and evaluation metrics.
   - Stop conditions.

5. **Analysis plan**
   - Data preparation, association, independence, mechanism, visualization, and sensitivity analyses.

6. **Iteration rules**
   - Conditions to upgrade, downgrade, redirect, or stop each hypothesis.

7. **Boundary and ethics notes**
   - Confounders, reproducibility requirements, population limits, and non-clinical use warning.

# Validation Gates

- **Scope Gate:** Confirm the question involves an immune correlate in a clinical or cohort context, not a standalone laboratory protocol or clinical advice request.
- **Hypothesis Viability Gate:** At least one falsifiable hypothesis must be formed with explicit failure modes and evidence strength labels.
- **Design Feasibility Gate:** An independent cohort or appropriate control must be available for validation; if not, claims are limited to exploratory.
- **Control Integrity Gate:** Negative and positive controls must behave as expected before any biological interpretation proceeds.
- **Claim Bounding Gate:** Final claims must match the highest evidence strength achieved (exploratory, replicated, adjusted, mechanistic, or decision-grade) and must not exceed it.

# Claim Boundaries

- Association does not prove causation or clinical utility.
- Independence from established markers must be demonstrated by adjustment, not assumed from co-occurrence.
- Mechanistic plausibility requires orthogonal readouts and does not establish necessity or sufficiency.
- Replication across independent cohorts is required before treating a correlate as robust.
- Prospective evidence is required before decision-grade claims.
- Computational or in-silico predictions are hypotheses, not confirmed correlates.
- Findings from one cohort or model system should not be generalized without boundary testing.

# Failure Modes

- Feature detection is unreliable or irreproducible across batches or platforms.
- Association disappears after adjustment for known confounders or established markers.
- Signal is equally strong in disease controls, background controls, or related-disease cohorts, indicating non-specific immune activation.
- Independent validation reverses or nullifies the discovery association.
- Endpoint definitions are inconsistent across cohorts, preventing pooled inference.
- Missingness or selection bias prevents fair comparison.
- Mechanism readouts contradict the proposed model or support an alternative module.
- Controls fail, indicating technical artifact or non-specific binding.
- Temporal ordering contradicts the proposed causal sequence.

# Validity Checks

- **Confounding:** Compare feature groups on established risk factors, treatment, batch, demographic variables, and sample timing.
- **Specificity:** Test against related-disease, healthy, and non-target tissue or compartment controls.
- **Statistical validity:** Predefine the primary endpoint; adjust for multiple testing in discovery; report effect sizes and uncertainty; handle non-independence from familial, longitudinal, or clustered samples.
- **Reproducibility:** Separate discovery and validation analyses; document feature-calling rules and quality filters; confirm a subset with orthogonal methods; preserve cohort provenance and endpoint definitions.
- **Boundary conditions:** Test behavior across disease stage, treatment context, population, and technical platform; state where the feature should not be extrapolated.
- **Overclaiming:** Distinguish predictions from confirmed biological claims; separate source-supported findings from agent-inferred hypotheses; avoid presenting retrospective associations as clinically actionable.

# Provenance

- Synthesized from cluster 57 / subcluster 57.0.split0.
- Source skill references: bcr-light-chain-research-pattern (5d8d0c0f2afea82a), homologous-heatshock-epitope-exploration (b514e5e08cea9870), allergen-epitope-research-workflow (b89c4ec372a9d3cb), aberrant-cell-antigen-autoimmunity-discovery (acd1881cb86d2208), autoimmune-idiotype-research-workflow (45eacab0f039da78), igg-glycan-proxy-enrichment-research (924dd9081710abcb), developmental-immune-repertoire-exploration (9c3f990b8e058ccb), autoantibody-transition-research (31ee8d9000321e3e).
- No specific paper conclusions, numerical results, or operational protocols are reproduced.
