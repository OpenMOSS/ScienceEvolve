---
name: sci-urban-coupled-system-mechanism-discovery-workflow-0f6484ef
description: A reusable end-to-end workflow for discovering, discriminating, and validating dominant mechanisms in coupled physical systems using hierarchical modeling, controlled comparison, and multi-source validation.
scienceevolve-title: "Urban hazard resilience · coupled system mechanism discovery workflow"
scienceevolve-area: urban-hazard-resilience
---

## Purpose

Guide agents through an end-to-end scientific workflow to discover and validate dominant mechanisms in coupled physical systems—such as multi-driver environmental hazards, structured flow interactions, or complex structural responses—where simplified or single-process explanations are insufficient. The workflow treats model hierarchies, controlled comparisons, and multi-source validation as reusable research infrastructure rather than domain-specific recipes.

## When to use

Use this skill when the user asks to:

- Propose new research questions about interacting processes in coupled physical systems.
- Design experiments comparing model fidelity, closure assumptions, or driver contributions.
- Validate whether an omitted or simplified interaction changes system-level outcomes.
- Interpret predictive failures as clues to missing mechanisms, scale mismatches, or confounders.
- Build surrogate or composite models with explicit boundary conditions and uncertainty.

Do not use for operational emergency response, structural design approval, site-safety decisions, or regulatory compliance without independent domain review.

## Inputs required

Before producing a study plan, collect or infer:

- **Target system boundary** and dominant process classes (forcing, response, boundary exchange).
- **Target observable** and intended use case (screening, research insight, scenario comparison).
- **Candidate mechanisms** and prior model families under consideration.
- **Available data sources** with coverage, resolution, uncertainty, and known gaps.
- **Reference or benchmark method** for generating labels or trusted comparisons.
- **Evaluation priorities** (mean response, extremes, timing, spatial pattern, robustness).
- **Constraints** on computation, data access, reproducibility, and decision context.

If key inputs are missing, state assumptions and mark hypotheses as weaker until local data are provided.

## Core Workflow

1. **Frame the system and decision gap.** Define the coupled boundary, target observable, and why existing explanations are insufficient. Identify whether the bottleneck is sparse observations, coupled drivers, dynamic state, or boundary uncertainty.
   - *Stop if the problem collapses to a single validated driver with no interaction.*

2. **Map candidate mechanisms and build a model hierarchy.** Decompose the system into fast/slow, local/boundary, and forcing/response processes. Construct a hierarchy: baseline (interaction omitted), idealized interaction, and detailed interaction-aware representation.
   - *Gate: Each level must be mechanistically distinct and independently interpretable.*

3. **Generate falsifiable mechanism hypotheses.** For each candidate mechanism, state the causal chain, predicted observable signature, evidence strength, key assumptions, minimal validation, and failure modes.
   - *Gate: Hypotheses must be distinguishable by at least one observable or control comparison.*

4. **Design controlled experiments.** Specify negative controls (absent mechanism), positive controls (known response), ablation controls (single mechanism removed), baseline controls (simpler model), and resolution controls. Define metrics for mean response, variability, gradients, and extreme behavior.
   - *Stop if controls cannot isolate the target mechanism.*

5. **Execute minimal viable validation.** Run the smallest comparison that can falsify the leading hypothesis. Validate component or subsystem behavior before system-level claims.
   - *Gate: Controls must behave as expected. If not, stop and repair the hierarchy.*

6. **Compare predictions and diagnose disagreements.** Evaluate the hierarchy across regimes and locations. Use spatial, temporal, or indicator-specific disagreements to flag missing variables, scale mismatch, or confounders.
   - *Iteration trigger: If models agree, seek independent validation before generalizing. If they disagree, reformulate the hypothesis around the competing mechanism.*

7. **Validate with independent evidence.** Test against holdout events, locations, or evidence types not used in calibration. Assess physical plausibility, calibration, and robustness under input perturbation.
   - *Gate: The mechanism must improve or hold under independent validation. If not, exclude or redesign.*

8. **Discriminate mechanisms and bound claims.** Rank hypotheses by convergent evidence. Bound claims to validated regimes. Label findings as verified, transferable pattern, or agent inference.
   - *Stop if uncertainty dominates, if conclusions depend on unmeasurable assumptions, or if the claim exceeds validated boundary conditions.*

9. **Iterate or redesign.** Based on the failure class (environment bias, interaction bias, closure bias, data limitation), update one component at a time. Revalidate independently before expanding scope.
   - *Stop conditions: observations too sparse to distinguish skill from chance; calibration improves one metric while degrading another without explanation; outputs violate physical plausibility; results cannot be communicated with uncertainty and limitations.*

## Output Format

When using this skill, produce:

1. **Research question** — concise statement of the target system, observable, and mechanism gap.
2. **Hypotheses table** — mechanism, predicted signature, evidence strength, assumptions, minimal validation, failure modes, and extrapolation boundary.
3. **Experimental design** — model hierarchy, variables, controls, metrics, and stop conditions.
4. **Analysis plan** — data audit, control checks, disagreement mapping, independent validation, and mechanism interpretation.
5. **Iteration plan** — rules for updating hypotheses, adding blocks, or restricting scope based on result patterns.
6. **Validity and ethics report** — confounders, reproducibility requirements, boundary conditions, and safety limits.

## Validation Gates

- **Hierarchy coherence gate:** Model levels differ by a single, interpretable mechanistic choice.
- **Control behavior gate:** Positive, negative, and ablation controls produce expected directional results.
- **Physical plausibility gate:** Predictions and synthetic augmentations respect known conservation, flow, or equilibrium constraints.
- **Robustness gate:** Conclusions hold across multiple demand indicators, perturbations, or subsamples.
- **Independence gate:** Holdout validation uses temporally or spatially independent evidence with no leakage.
- **Claim bounding gate:** Every conclusion specifies the regime, scale, and evidence type that support it.

## Claim Boundaries

- Distinguish **verified findings** (reproduced or directly validated), **transferable patterns** (reusable method logic), and **agent inferences** (new hypotheses awaiting validation).
- Do not generalize across structural families, hazard regimes, basin types, or climate zones without revalidation.
- Do not treat surrogate, composite, or learned models as replacements for reference processes outside the validated feature space.
- Mark extreme-event or tail-behavior claims separately from average-performance claims.

## Failure Modes

- **Leakage:** Training and validation share future information, spatial dependence, or generated realizations.
- **Confounding:** Unobserved variables drive apparent mechanism effects.
- **Metric mismatch:** Average accuracy improves while extreme-event behavior, timing, or spatial placement degrades.
- **Indicator reversal:** One demand indicator supports a hypothesis while another contradicts it without explanation.
- **Overfitting to synthetic data:** Augmented or surrogate samples replace rather than supplement independent validation.
- **Extrapolation without revalidation:** Claims extend to regimes absent from the design space.
- **Unmeasurable assumptions:** Core conclusions depend on inputs or states that cannot be observed or bounded.

## Validity Checks

- **Confounding:** Check whether missing data, reporting bias, or data availability correlates with predicted high-risk zones or preferred mechanisms.
- **Reproducibility:** Document dataset versions, processing assumptions, validation splits, model configurations, and random seeds.
- **Statistical validity:** Avoid leakage across dependent samples; report uncertainty and sensitivity; use appropriate baselines.
- **Boundary conditions:** State where the method may fail (e.g., engineered dominance, rapid regime shift, unavailable validation data).
- **Mechanism validity:** Ensure predicted pathways align with known physics rather than only aggregate scores.
- **Generalization:** Test across independent events, locations, or strata before extending conclusions.
- **Evidence grading:** Label each claim by its evidential source and strength.

## Provenance

Synthesized from cluster 3 / subcluster 3.0. Source skills: urban-pluvial-flood-research-pattern; precast-seismic-performance-research; coupled-urban-hazard-forecasting-design; wind-wake-cfd-research-design; data-driven-compound-flood-research; hydrological-composite-forecasting-research; seismic-fragility-surrogate-research; localized-seismic-screening-research.
