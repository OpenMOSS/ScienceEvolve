---
name: sci-fiber-ml-mechanism-discovery-validation-workflow-c140a5c3
description: Use this skill when designing end-to-end research workflows that use machine learning to discover, discriminate, and validate scientific mechanisms from structured evidence, with explicit iteration gates, claim bounding, and non-operational validation planning.
scienceevolve-title: "Fiber composites and battery materials · ml mechanism discovery validation workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

This skill helps an agent propose, validate, and bound mechanistic hypotheses in scientific domains where machine learning augments or replaces traditional explanatory models. It provides a reusable route from evidence curation and baseline comparison through sensitivity-driven hypothesis generation, minimal non-operational validation design, and iterative claim refinement.

## When to use

Use this skill when the user wants to:

- Identify why an existing simple or theory-driven model fails to explain observed behavior.
- Curate compact evidence and compare an interpretable baseline against ML-augmented candidates.
- Generate testable mechanistic hypotheses—such as dominant factors, interactions, or regime boundaries—from model diagnostics.
- Design minimal validation studies with strong controls, explicit success criteria, and stop conditions.
- Iterate between model refinement, hypothesis revision, and claim bounding.

Do not use this skill as a source of operational fabrication instructions, clinical protocols, hazardous procedures, or field-wide consensus claims.

## Inputs required

Before generating a research plan, ask for or identify:

- Target phenomenon and the specific modeling gap or inconsistency to be addressed.
- Evidence table or dataset with input-output records, context variables, metadata, and known uncertainties.
- Current baseline model or best available explanatory framework.
- Candidate ML model family, representation, or augmentation strategy.
- Intended validation modality (simulation, benchmark, experiment, or audit).
- Scope constraints, safety boundaries, and compliance limits relevant to the domain.

## Core Workflow

Follow this ordered end-to-end route. Treat each italicized decision gate as a hard checkpoint; stop or redesign if the gate is not satisfied.

1. **Frame the mechanistic gap**
   - State the target observable and why the current baseline is insufficient.
   - Distinguish the primary scientific mechanism from measurement artifacts or confounders.

2. **Curate and audit evidence**
   - Convert observations into consistent input-output rows with uniform units and definitions.
   - Record context variables that may confound interpretation.
   - Flag missing values, label uncertainty, class imbalance, and potential leakage.
   - Verify split integrity if held-out validation will be used.

   *Decision gate — Data quality:* If the evidence is too sparse, noisy, or leaky to support the intended model complexity, stop and specify remediation steps.

3. **Build competing models**
   - Construct an interpretable baseline that reflects current practice.
   - Add a candidate ML model only if the data structure and validation plan justify added complexity.
   - Keep model complexity proportional to dataset size and evidence quality.

4. **Evaluate before interpreting**
   - Separate development and validation evidence.
   - Compare the candidate against the baseline using held-out or resampled metrics.
   - Diagnose errors by input region, output range, class, or context variable.

   *Decision gate — Baseline comparison:* If the candidate does not outperform the baseline on primary metrics and robustness checks, stop or simplify the candidate before proceeding.

5. **Generate mechanistic hypotheses**
   - Use sensitivity analysis, ablation, or representation inspection to propose plausible mechanisms.
   - Formulate each hypothesis with: claim, evidence strength, key assumptions, possible failure modes, and extrapolation boundary.
   - Prioritize hypotheses that isolate a single influential factor, a suspected interaction, or a regime boundary.

6. **Design minimal validation**
   - Define the testable contrast and the observable outcome that would support or weaken the hypothesis.
   - Specify primary factors, secondary factors, fixed factors, and context variables to record.
   - Include baseline, negative, positive, orthogonal, and reliability controls.
   - Define success criteria and stop conditions.

   *Stop condition:* Do not proceed if controls are missing, measurement resolution is insufficient, or the execution context is unsafe or noncompliant.

7. **Execute validation and analyze**
   - Compare outcomes against controls and expected noise.
   - Assess whether results support, weaken, or falsify each hypothesis.
   - Quantify uncertainty and check for confounding by context variables.

   *Decision gate — Mechanism confirmation:* If validation contradicts the hypothesis, mark previous model outputs as domain-limited, add contradictory evidence to the record, and revise or reject the hypothesis.

8. **Iterate or bound claims**
   - If validation supports the hypothesis: increase confidence only within the tested domain and plan the next focused test.
   - If validation is weak: recheck measurement consistency, consider missing factors, or collect targeted data before reinterpreting.
   - If validation falsifies the hypothesis: revise the mechanism, update the evidence table, and rebuild or retrain if needed.

9. **Finalize claim boundaries and reporting**
   - State what is directly validated, what is a plausible extension, and what remains speculative.
   - Document failure modes, residual risks, and non-operational safety boundaries.

## Output Format

When using this skill, produce:

1. **Research question** — Target phenomenon, primary relationship, identified gap, and why simple baselines may be insufficient.
2. **Hypothesis set** — At least three hypotheses. For each: claim, evidence strength, key assumptions, possible failure modes, minimal validation design, and extrapolation boundary.
3. **Experimental design plan** — Primary and secondary factors, fixed factors, context variables, controls, success criteria, and stop conditions.
4. **Analysis plan** — Data audit, baseline versus candidate comparison, error diagnosis, and sensitivity or ablation analysis.
5. **Iteration plan** — Rules for updating hypotheses under supportive, weak, conflicting, or contradictory evidence.
6. **Validity and safety notes** — Confounders, reproducibility checks, boundary conditions, statistical caveats, and non-operational safety limits.

## Validation Gates

- **Data-quality gate:** Evidence is consistent, labeled, and free of critical leakage or duplication.
- **Baseline-comparison gate:** The candidate exceeds a relevant interpretable baseline on held-out or resampled evidence.
- **Control gate:** Positive, negative, and ablation controls are defined and pass sanity checks.
- **Robustness gate:** Conclusions hold under alternative validation splits, preprocessing choices, or input perturbations.
- **Scope gate:** Claims are explicitly limited to the validated input domain and system class.

## Claim Boundaries

- Distinguish paper-supported methodological patterns from agent-inferred extensions.
- Limit causal claims to what the validation design can support; treat sensitivity results as hypothesis-generating, not causal proof.
- Mark model-selected candidates outside the training domain as speculative.
- Treat single-study or single-domain results as methodological inspiration rather than field consensus.

## Failure Modes

- Apparent mechanism is caused by unrecorded context variables or correlated inputs.
- Model complexity exceeds data support, producing spurious sensitivity trends.
- Validation fails due to label noise, measurement artifacts, or insufficient resolution.
- Extrapolation beyond the validated domain without independent confirmation.
- Efficiency, scalability, or interpretability costs negate the mechanistic benefit.

## Validity Checks

- **Confounding:** Are batch, environment, measurement method, or correlated inputs explaining the apparent effect?
- **Reproducibility:** Do conclusions hold under alternative splits, baselines, preprocessing choices, or random seeds?
- **Statistical validity:** Is the evidence sufficient and balanced for the chosen model and metrics?
- **Label validity:** Are categorical labels defined consistently and checked for subjectivity?
- **Mechanistic plausibility:** Are sensitivity trends stable and consistent with domain knowledge?
- **Extrapolation:** Are out-of-domain predictions or recommendations clearly marked as speculative?

## Provenance

- Derived from cluster 65.0 (machine-learning-assisted mechanism discovery and validation).
- Synthesized from source skills: surrogate-guided-electrospun-material-exploration, hypergraph-neural-research-design, peptide-sequence-identification-workflow, channel-coding-dl-research-pattern, confined-adsorption-interface-modeling, task-conditioned-representation-research, hybrid-dynamics-model-synthesis, sustainable-ai-lifecycle-research.
- Methodological patterns are abstracted from these domains; no specific paper conclusions, numerical results, parameters, or operational protocols are preserved.
