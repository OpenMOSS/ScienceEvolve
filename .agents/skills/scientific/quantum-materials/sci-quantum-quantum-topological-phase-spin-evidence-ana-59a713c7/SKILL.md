---
name: sci-quantum-quantum-topological-phase-spin-evidence-ana-59a713c7
description: A reusable end-to-end workflow for observable-driven evidence analysis and claim audit in quantum, topological, and spin-based research, covering hypothesis generation, minimal validation design, layered analysis, and iterative claim bounding.
scienceevolve-title: "Quantum materials and condensed matter · quantum topological phase spin evidence analysis workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

This skill guides agents in planning and auditing research claims in quantum, topological, and spin-related systems where evidence must be traced from observable to conclusion through explicit mechanisms, controls, and uncertainty budgets. It abstracts a reusable pattern of hypothesis generation, minimal validation design, layered analysis, and iterative claim bounding without reproducing paper-specific results or operational protocols.

# When to use

Use this skill when the user asks to:

- propose research questions or hypotheses about quantum phases, topological signatures, spin dynamics, or related correlated phenomena;
- design minimal validation studies to test mechanism claims or existence boundaries;
- audit uncertainty budgets and discriminate competing mechanisms;
- iterate on evidence after partial, contradictory, or null results;
- bound claims between theoretical existence and experimental witnessability.

Do not use this skill as a general physics tutor, laboratory operations manual, or source of field-wide consensus derived from a single study.

# Inputs required

Before generating a plan, ask for or identify:

- **Target system class** and relevant degrees of freedom.
- **Target observable** and subsystem split or bipartition.
- **Claim type**: existence, boundary characterization, mechanism discrimination, or resource improvement.
- **Candidate mechanisms** and known confounders.
- **Environmental noise, systematic shifts, or uncertainty sources**.
- **Available diagnostics, controls, and independent validation channels**.
- **Constraints**: safety, resources, model validity range, and detection limits.

If any input is missing, state the required assumption explicitly and label downstream conclusions as provisional or hypothetical.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

1. **Observable and Claim Definition**
   - Define the target observable, the relevant subsystem split, and the precise scientific claim.
   - Classify the claim type: existence, boundary characterization, mechanism discrimination, or resource improvement.
   - State the minimal observable signature that would support or refute the claim.
   - *Decision gate:* If the claim cannot be linked to a measurable observable or is unfalsifiable under the available constraints, stop and reformulate the research question.

2. **Mechanism Mapping and Hypothesis Generation**
   - Map candidate mechanisms into three classes:
     - *Boundary-setting*: determines whether the target effect can exist.
     - *Tuning*: affects magnitude or robustness once the boundary permits the effect.
     - *Confounding*: threatens interpretation or observability.
   - Generate ranked hypotheses. For each, specify: claim statement, evidence strength (strong / moderate / weak / speculative), key assumptions, predicted observable signature, likely failure modes, and minimal validation.
   - *Decision gate:* If no hypothesis includes a discriminating test against a null or baseline mechanism, return to mechanism mapping.

3. **Minimal Validation Design**
   - Define variables: primary perturbation, secondary robustness checks, and reference/context variables.
   - Specify controls:
     - *Baseline*: unmodified or resource-disabled condition.
     - *Negative*: mechanism disabled or symmetry broken.
     - *Positive*: known response regime.
     - *Orthogonal*: alternative diagnostic of the same quantity.
     - *Model*: repeat analysis with and without suspect noise or systematic channels.
   - Choose metrics:
     - *Primary*: criterion directly testing the claim.
     - *Secondary*: related but distinct measure.
     - *Robustness*: sensitivity to parameter variation and noise uncertainty.
     - *Observability*: impact of detection limits and technical noise.
     - *Specificity*: evidence that the effect arises from the intended mechanism.
   - State stop conditions: baseline explains result; an omitted noise channel changes the qualitative conclusion; claim requires unsupported extrapolation.
   - *Decision gate:* If the design lacks an independent validation channel or a fair comparison under matched conditions, redesign before proceeding.

4. **Layered Evidence Analysis**
   - Analyze in layers: (a) raw signal and preprocessing; (b) physical encoding of target information; (c) statistical inference or postselection; (d) mechanism-level interpretation.
   - Apply an analysis criterion matched to the state class, model, or observable type.
   - Quantify uncertainty from noise spectra, model parameters, finite-size effects, and numerical approximations.
   - Compare intervention-enabled and intervention-disabled cases at matched environmental and detection conditions.
   - *Decision gate:* If the primary metric improves only when a plausible confounder is omitted, downgrade the hypothesis and add the omitted channel.

5. **Uncertainty Audit and Mechanism Discrimination**
   - Build or update an uncertainty budget: list all shift, bias, noise, and characterization terms; mark each as measured, modeled, bounded, or assumed.
   - Use independent diagnostics to cross-check quantities that cannot be measured directly in the primary channel.
   - Discriminate mechanisms by verifying that controls separate the proposed effect from artifacts, drift, calibration bias, and hidden correlations.
   - *Decision gate:* If direct and indirect estimates disagree beyond the uncertainty model, halt interpretation and debug the model, measurement, or inference pipeline.

6. **Claim Bounding and Iteration**
   - Bound the claim:
     - Separate theoretical existence from experimental witnessability.
     - Distinguish model-inferred from observed.
     - Label conclusions as `paper-supported`, `model-inferred`, `hypothetical`, or `not-transferable`.
   - Recompute the dominant uncertainty or evidence bottleneck.
   - Decide:
     - **Continue** — total uncertainty decreased and no unvalidated dominant term remains; proceed to the next bottleneck.
     - **Revise** — diagnostics contradict the mechanism or a new confounder appears; return to Step 2 or 3.
     - **Stop** — remaining uncertainty is acceptable, outside scope, or too costly to reduce safely.
   - *Iteration condition:* Return to Mechanism Mapping with updated evidence, or return to Validation Design to test the next bottleneck.

7. **Final Audit and Documentation**
   - Document the final claim boundary, extrapolation limits, and residual risks.
   - Record which conclusions are transferable to other platforms and which are tied to specific assumptions.
   - Archive the reasoning chain, control results, and failure modes for independent review.

# Output Format

When using this skill, produce:

1. **Research question** — target system, observable, claim type, and key unknowns.
2. **Mechanism map** — candidate mechanisms and how they differ.
3. **Ranked hypotheses** — for each: claim, evidence strength, key assumptions, predicted signature, failure mode, and minimal validation.
4. **Validation plan** — variables, controls, metrics, and stop conditions.
5. **Analysis plan** — layered checks, criterion to apply, uncertainty propagation, and boundary-mapping strategy.
6. **Iteration plan** — how results update hypotheses and when to add omitted channels, reclassify resources, or stop.
7. **Validity and boundary statement** — confounders, reproducibility checks, ethical and safety constraints, and what remains unproven.

# Validation Gates

Before finalizing a research plan or promoting a claim, check:

- **Confounding control:** Could drift, calibration error, environmental variation, or hidden correlations explain the result?
- **Diagnostic independence:** Is the key validation independent of the primary measurement channel?
- **Statistical validity:** Are uncertainty estimates, finite-size effects, and model fits appropriate for the claimed precision?
- **Budget integrity:** Are all major terms included, including those worsened by the intervention?
- **Reproducibility:** Are measurements repeated, interleaved, or cross-checked enough to separate drift from intervention effects?
- **Evidence labeling:** Are paper-supported facts separated from new inferences and speculative extensions?

# Claim Boundaries

- Do not claim that a resource creates an effect if the baseline already explains the result.
- Do not treat a model as predictive if a plausible omitted noise or systematic channel changes the qualitative conclusion.
- Do not extrapolate beyond the validated regime (e.g., linearity, stationarity, or equivalent model assumptions).
- Do not compare interventions unless environmental and detection assumptions are matched.
- Do not interpret improvement in a related metric as proof of the target claim without applying the target criterion.
- Do not present single-study or model-inferred findings as field-wide consensus.

# Failure Modes

- **Unfalsifiable design:** The claim cannot be tested with available observables or controls.
- **Baseline override:** The effect appears in the resource-disabled or null condition.
- **Omitted channel dominance:** A plausible unmodeled noise or systematic term reverses the conclusion.
- **Diagnostic contradiction:** Independent measurements disagree with the primary inference beyond the uncertainty budget.
- **Heterogeneity masking:** Sample, platform, or ensemble variation dominates the mechanism signal.
- **Scope creep:** The hypothesis is extrapolated to untested platforms, regimes, or observables without validation.

# Validity Checks

- **Model validity:** Is the target bipartition or observable physically meaningful and experimentally accessible? Are dynamics and state-class assumptions justified?
- **Numerical validity:** Are noise spectra, parameters, and approximations accompanied by uncertainty estimates and convergence checks?
- **Experimental validity:** Are detection limits, technical noise, and calibration uncertainty included in observability analysis? Are baseline, negative, positive, and model controls present?
- **Boundary and extrapolation:** Which conclusions depend on specific model assumptions? Are claims limited to the validated class rather than presented as universal?

# Provenance

Synthesized from cluster 221, subcluster 221.0. Source skills: `optomechanical-entanglement-boundary-workflow`, `passive-qkd-research-workflow`, `cryogenic-ion-clock-exploration`, `optical-clock-uncertainty-workflow`, `continuous-variable-quantum-erasure-research`, `boson-mediated-entangling-gate-exploration`, `perovskite-nc-spin-dynamics-workflow`, `levitated-optomechanics-feedback-cooling-research`.
