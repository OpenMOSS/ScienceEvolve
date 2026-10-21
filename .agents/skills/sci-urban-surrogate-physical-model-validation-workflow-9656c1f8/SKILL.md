---
name: sci-urban-surrogate-physical-model-validation-workflow-9656c1f8
description: End-to-end research workflow for designing, validating, and iterating machine-learning surrogate models against high-fidelity physical system simulations or experiments.
scienceevolve-title: "Urban hazard resilience · surrogate physical model validation workflow"
scienceevolve-area: urban-hazard-resilience
---

# Purpose

Help an agent generate reusable research plans for validating data-driven surrogate models of physical systems. The workflow abstracts a shared pattern across structural, geophysical, urban, and environmental domains: define a representativeness gap where high-fidelity evaluation is too expensive, formulate mechanism-centered hypotheses, design controlled validation studies, and iterate until claims are bounded by evidence.

# When to use

Trigger this skill when the user needs to design a study where repeated physics-based simulation, hybrid experimentation, or high-fidelity measurement is too costly for exhaustive exploration, and a surrogate model is proposed to approximate system behavior. Applicable across domains such as structural dynamics, seismic resilience, geophysical fields, urban building clusters, wind energy, and infrastructure safety.

Do not use this skill for real-time operational control, safety certification, field deployment decisions, or executable testing instructions. It is for research design and non-operational validation planning only.

# Inputs required

Before producing a plan, ask for or clearly state assumptions for:

- **Target physical system and phenomenon:** the process, component, or field to be approximated.
- **High-fidelity evaluation method:** the trusted simulation, experiment, or benchmark used as the final arbiter.
- **Candidate surrogate model families:** data-driven or reduced-order representations under consideration.
- **Available data sources:** historical observations, simulation labels, or hybrid datasets and their sampling constraints.
- **Domain mechanisms:** expected local/global coupling, path dependence, multi-scale interactions, or component correlations.
- **Validation resources:** reference cases, independent datasets, strong baselines, or benchmark studies.
- **Claim boundary:** intended domain of applicability, such as component classes, loading regimes, geometries, or environmental conditions.
- **Constraints:** computational budget, latency requirements, data access limits, and reproducibility needs.

If critical inputs are missing, state assumptions explicitly and mark downstream claims as speculative.

# Core Workflow

## Stage 1 — Frame the research gap and hypothesis
1. Define the bottleneck: identify why exhaustive high-fidelity evaluation is impractical for the research question.
2. Link the target phenomenon to observable, falsifiable response quantities (e.g., peak response, damage sequence, field distribution, tail severity).
3. Formulate mechanism-centered hypotheses about what the surrogate must preserve: local fidelity, global consistency, path dependence, component interaction, or multi-scale coupling.
4. **Decision gate:** If the phenomenon cannot be linked to observable quantities or falsifiable hypotheses, stop and reformulate the research question.

## Stage 2 — Design the validation architecture
1. Define surrogate inputs/outputs and the explicit domain boundary.
2. Select strong baselines: simple physics-based models, numerical-only representations, static surrogates, or independence assumptions.
3. Plan controls:
   - **Positive control:** a case with known or trusted behavior that should be recovered.
   - **Negative control:** an omitted mechanism, shuffled labels, or uninformative features to check for spurious performance.
   - **Ablation control:** removal of one component or pathway to isolate contribution.
   - **Fair baseline:** matched preprocessing, comparable capacity, and equivalent input information.
4. **Decision gate:** If no independent reference or baseline exists, mark all claims as speculative and restrict scope to exploratory screening.

## Stage 3 — Generate and audit data
1. Deliberately sample the input domain, including interior, edge, boundary-adjacent, and high-consequence regions.
2. Label only with the trusted high-fidelity workflow; record version, assumptions, and preprocessing.
3. Audit for leakage, duplicates, inconsistent units, class imbalance, and distribution gaps.
4. **Stop condition:** If labeled samples fail to cover the intended domain or show systematic gaps, pause and redesign sampling before training.

## Stage 4 — Train and diagnose the surrogate
1. Fit candidate surrogate models on training data; tune using validation data only.
2. Evaluate on held-out test data with multiple metrics: global error, boundary-region error, tail behavior, and phase/timing agreement where dynamic.
3. Inspect residuals for systematic bias tied to physical variables or regions.
4. **Decision gate:** If surrogate error is unacceptable near decision thresholds, constraints, or feasibility boundaries, reject the model or restrict the claimed domain.

## Stage 5 — Validate mechanism and system-level behavior
1. Compare surrogate against baselines at multiple levels:
   - **Component level:** local fidelity to physical response quantities.
   - **Generalization level:** performance under out-of-distribution histories, geometries, or conditions.
   - **System level:** coupled behavior when surrogates are integrated into larger models.
2. Run ablations to test whether each hypothesized mechanism contributes meaningfully.
3. Check physical plausibility: feature importance and sensitivity patterns should align with domain mechanics.
4. **Stop condition:** If the surrogate matches aggregate metrics but fails mechanism diagnostics or predicts the wrong sequence of physical events, treat it as only partially validated.

## Stage 6 — Propagate uncertainty and audit robustness
1. Quantify prediction uncertainty using intervals, Bayesian posteriors, or resampling-based estimates.
2. Test sensitivity to initialization, sample selection, model family, and boundary conditions.
3. Evaluate tail-risk behavior separately from average performance; check for underestimation bias in high-consequence regions.
4. **Decision gate:** If uncertainty is uncalibrated on held-out data, or if conclusions depend strongly on initialization without physical explanation, stop and redesign the uncertainty model or sampling plan.

## Stage 7 — Confirm candidates and bound claims
1. Re-evaluate selected candidates or conclusions with the original high-fidelity method where feasible.
2. Separate findings into:
   - **Paper-verified / method-supported:** the workflow pattern is established.
   - **Transfer-inferred:** plausible in the new domain but not yet independently tested.
   - **Speculative:** outside the validated domain or requiring new data.
3. Document the validated domain, excluded conditions, and extrapolation boundaries.
4. **Stop condition:** If high-fidelity confirmation violates expected behavior, or if the surrogate extrapolates beyond the training domain, narrow or reject the claim.

## Stage 8 — Iterate or redesign
1. If validation fails at any gate, return to the appropriate stage:
   - Sampling gaps → Stage 3
   - Surform misspecification or bias → Stage 4
   - Mechanism mismatch → Stage 5
   - Uncertainty miscalibration → Stage 6
   - Scope overreach → Stage 1
2. Log each iteration with the evidence trigger, change made, and new validation requirement.
3. **Iteration stop:** Conclude when the surrogate is sufficiently validated for the bounded claim, or when further iteration is infeasible and the scope is explicitly restricted.

# Output Format

When using this skill, produce:

1. **Research question and gap statement** — concise problem, bottleneck, and intended decision.
2. **Evidence map** — table labeling claims as paper-verified, mechanism-supported, agent-inferred, or unvalidated.
3. **Hypothesis table** — for each hypothesis: mechanism, evidence strength, key assumptions, likely failure modes, and minimum viable test.
4. **Experimental design** — variables, controls, baselines, sampling plan, metrics, and stop conditions.
5. **Analysis plan** — data audit, surrogate diagnostics, baseline comparison, uncertainty quantification, mechanism checks, and sensitivity analysis.
6. **Iteration log** — decisions made, evidence triggers, redesigns, and current claim boundaries.
7. **Validity and claim boundary statement** — confounders, reproducibility requirements, extrapolation limits, and safety-critical caveats.

# Validation Gates

- **Coverage gate:** Training and validation data must span the claimed domain, including boundary-adjacent and high-consequence regions.
- **Leakage gate:** No overlap of scenarios, geometries, identities, or temporal sequences across train/test splits.
- **Baseline gate:** Comparison against at least one strong baseline matched for input information and model capacity.
- **Mechanism gate:** Surrogate predictions must align with physically plausible causal pathways, not only aggregate metrics.
- **Confirmation gate:** Final candidates or conclusions must be checked against high-fidelity reference evaluation where possible.
- **Calibration gate:** Uncertainty estimates must match observed frequencies on held-out data; tail regions require separate inspection.

# Claim Boundaries

- Distinguish paper-supported method evidence from agent-inferred extensions for new systems, components, or environments.
- Do not generalize from one configuration, loading regime, or spatial domain to the entire field without independent validation.
- Mark predictions outside the sampled or tested domain as speculative.
- Separate surrogate-only findings from high-fidelity-confirmed findings.
- Avoid presenting research prototypes as certified operational forecasts, design approvals, or safety-critical decisions.

# Failure Modes

- Surrogate fails generalization before system-level coupling.
- Adaptive or online updating components destabilize predictions.
- Agreement appears only for a single metric, scenario, or response quantity.
- Reference model or baseline is too weak to support the intended claim.
- Training and validation cases are accidentally too similar, inflating apparent performance.
- Omitted physics or hidden interface errors compensate for surrogate bias.
- High-consequence tail events are systematically underpredicted.
- Numerical instability, mesh sensitivity, or solver artifacts dominate results.

# Validity Checks

- **Confounding:** Are response differences caused by design variables, boundary conditions, preprocessing, or numerical settings rather than the surrogate mechanism?
- **Representativeness:** Does the data cover the target domain and decision-relevant regions?
- **Reproducibility:** Are data splits, random seeds, model versions, preprocessing steps, and metric definitions documented?
- **Statistical validity:** Are metrics aggregated over enough independent cases, seeds, or resamples?
- **Numerical validity:** Are solver, synchronization, normalization, and integration choices stable and reported?
- **External validity:** Is the model used only within its validated domain?
- **Tail validity:** Are rare and high-consequence scenarios evaluated separately from average performance?
- **Mechanism validity:** Do learned representations, sensitivities, and feature-importance patterns align with expected physical behavior?

# Provenance

- Synthesized from cluster 8.1 (machine-learning-assisted model validation and comparison).
- Source skills: adaptive-surrogate-hybrid-structural-exploration (10.1002/cepa.2590), surrogate-assisted-structural-dynamics-design (10.14775/ksmpe.2025.24.4.062), neural-operator-geophysical-field-exploration (2605.25679), rc-seismic-finite-element-research-workflow (10.1002/eqe.2932), seismic-building-cluster-research-exploration (10.3390/buildings15091481), physics-informed-consequence-surrogate-research (10.1155/stc/5568505), complex-terrain-wind-farm-research (10.3390/en16165941), seismic-fragility-correlation-aware-surrogate (10.1007/s10518-020-00836-w).
- Preserves the shared workflow route: hypothesis generation → controlled data generation → surrogate training → multi-level validation → uncertainty audit → iterative redesign.
