---
name: sci-quantum-observable-driven-mechanism-discovery-workf-c47da184
description: A reusable end-to-end workflow for turning anomalous or composite observables into ranked mechanism hypotheses, designing minimal discriminating validations, and iterating through constraint-aware model discrimination until robust claims or explicit boundaries are reached.
scienceevolve-title: "Quantum materials and condensed matter · observable driven mechanism discovery workflow 4"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Use this skill to design research questions and validation plans when an observable population, aggregate response, or anomalous deviation demands mechanism-level explanation. The workflow maps tensions between observation and baseline theory into competing hypotheses, constructs minimal discriminating tests with strong controls, compares model predictions against independent constraints, and iterates until hypotheses are promoted, bounded, or rejected.

# When to use

Use this skill when a user asks to:

- Explain an anomalous observation, non-monotonic scaling, unexpected population subset, or composite measurement that mixes multiple physical contributions.
- Generate new research questions where competing mechanisms could produce similar observable trends.
- Design a non-operational theoretical, computational, or observational study to distinguish target and rival explanations.
- Iterate on a model that fits one signal but creates secondary consistency problems elsewhere.
- Triangulate structure, dynamics, transport, or thermodynamic evidence to constrain collective behavior or hidden variables.

Do not use this skill as a laboratory execution protocol, fabrication recipe, clinical guide, or field-wide consensus statement.

# Inputs required

Before starting the workflow, collect or request:

- **Target observable and baseline model:** the quantity to be explained and the standard theoretical or phenomenological prediction.
- **Anomaly or tension:** the specific deviation, aggregate behavior, or population subset that challenges the baseline.
- **Candidate mechanism families:** at least one target and one rival mechanism class (e.g., intrinsic vs. extrinsic, conventional vs. minimal alternative, order-driven vs. disorder-driven).
- **Available controls:** baseline, positive, negative, strong/rival-model, and structural or population counterpart conditions accessible in principle.
- **Independent constraints:** additional observables, epochs, system states, or scaling laws that the mechanism must not violate.
- **Data quality context:** measurement uncertainties, selection effects, inference assumptions, sample completeness, and known nuisance variables.
- **Boundary conditions:** the regime (temperature, density, geometry, evolutionary state, etc.) where the analysis is valid and safety or compliance limits.

# Core Workflow

Follow this ordered route. Treat each numbered step as a gate; document decisions before proceeding.

1. **Isolate the Observable Tension**
   - Define the phenomenon in operational terms, separated from its conventional label.
   - State why a single-mechanism or baseline explanation is insufficient.
   - Identify which baseline assumptions are stressed by the anomaly.

2. **Audit Latent State and Systematics** *(Decision Gate)*
   - Evaluate whether inferred hidden quantities, selection effects, calibration drift, or nuisance parameters could explain the anomaly without new physics.
   - Check for confounding by sample identity, phase purity, background subtraction, or population bias.
   - **Stop condition:** If a simpler latent-state correction or systematic revision resolves the tension, refine the inference pipeline and return to Step 1. Otherwise, proceed to mechanism generation.

3. **Generate Competing Mechanism Families**
   - Propose at least two distinct mechanism classes.
   - Assign each a predicted scaling signature, diagnostic regime, and expected behavior across multiple independent observables.
   - For each hypothesis, label: evidence strength (strong / moderate / weak / speculative), key assumptions, most likely failure mode, and a discriminating observation.

4. **Define Diagnostic Regimes and Discriminating Signatures**
   - Pre-specify the variable ranges, symmetry constraints, or population subsets where each mechanism should dominate.
   - Identify inversion, suppression, threshold, or scaling conditions that separate candidates.
   - Define the analysis window before comparing outcomes.

5. **Design Minimal Viable Validation with Strong Controls**
   - Construct the smallest test that can eliminate at least one mechanism or distinguish the two leading hypotheses.
   - Include: baseline control, positive control, negative control, strong/rival-model control, and structural or population counterpart where relevant.
   - Pre-register decision criteria, evaluation metrics, and stop conditions.
   - **Stop condition:** If no plausible negative or rival comparison exists, redesign before collecting data.

6. **Execute Regime-Aware Data Reconstruction**
   - Place observations on the diagnostic plane with propagated uncertainties.
   - Flag boundary cases separately from clear in-regime cases.
   - Verify system identity, phase purity, or sample quality before interpreting collective behavior.

7. **Compare Models via Constraint Overlay**
   - Evaluate target and rival mechanisms on the same observations.
   - Anchor central parameters using independent constraints whenever possible; document all adjustable parameters.
   - Overlay independent constraints from other observables, epochs, or system states to identify robust overlaps, fragile overlaps, and excluded regions.
   - Penalize unnecessary added mechanisms; prefer explanatory economy.

8. **Assess Secondary Consistency and Residuals**
   - Check whether a surviving mechanism creates new contradictions (e.g., breaks evolutionary consistency, violates symmetry constraints, or requires unsupported tuning).
   - Inspect residuals for systematic deviations that indicate missing mechanisms, incorrect scaling, or artifacts.
   - **Iteration trigger:** If partial agreement appears, identify the fragile assumption and revise before adding complexity.

9. **Grade Evidence and Bound Claims** *(Decision Gate)*
   - Classify each conclusion as directly observed, inferred from multiple consistent probes, model-dependent, or speculative.
   - Bound the claim to the tested regime, sample class, and observable set.
   - **Stop condition:** If the mechanism requires excessive tuning, violates robust independent constraints, or works only in a narrow post-hoc region, demote or reject it.

10. **Iterate, Branch, or Archive**
    - **Promote and refine:** If supported across independent variables and controls, strengthen parameter constraints and broaden the population or counterpart test.
    - **Demote and replace:** If contradicted by controls or independent constraints, return to Step 3 with a revised mechanism family.
    - **Split:** If partially successful, decompose the hypothesis into sub-mechanisms and design orthogonal tests for each component.
    - **Archive:** If underdetermined despite multiple controls, document the ambiguity and define the next discriminating experiment.
    - **Hard stop:** End the cycle if the model survives only through untested tuning, if selection effects dominate, or if ethical or compliance boundaries prevent a valid test.

# Output Format

Return the research-design brief in this structure:

1. **Research Question** — Concise statement of the anomaly and why it matters.
2. **Baseline Model and Failure** — Standard prediction, observed contradiction, and confidence level of the failure.
3. **Mechanism Map** — Candidate mechanisms with predicted scaling signatures and diagnostic regimes.
4. **Ranked Hypotheses** — For each: hypothesis statement, evidence strength, key assumptions, predicted observables, likely failure mode, and discriminating test.
5. **Minimal Viable Validation** — Variables, controls, evaluation metrics, and stop conditions.
6. **Analysis Plan** — Data reconstruction, regime check, model comparison, uncertainty treatment, and visualization strategy.
7. **Constraint Overlay** — Independent constraints, robust vs. fragile overlaps, and assumption-dependent boundaries.
8. **Iteration Plan** — Conditions for promoting, weakening, splitting, or abandoning each hypothesis.
9. **Validity and Scope Statement** — Confounders, reproducibility requirements, boundary conditions, and limits of generalization.

# Validation Gates

Internal checkpoints that must be satisfied before advancing:

- **Latent-state gate (Step 2):** The anomaly persists under plausible alternative inference assumptions or systematic checks.
- **Pre-registration gate (Step 5):** Decision criteria, controls, and stop conditions are defined before result interpretation.
- **Regime gate (Step 6):** The majority of analyzed data fall within the pre-specified valid regime; boundary cases are segregated.
- **Cross-variable gate (Step 7):** Mechanism assignments are consistent across at least two independent observables or system states.
- **Secondary-consistency gate (Step 8):** The leading hypothesis does not create unresolved contradictions in independent constraints or evolutionary/structural consistency.
- **Claim-bounding gate (Step 9):** Conclusions are labeled by evidence grade and restricted to the tested domain.

# Claim Boundaries

- Do not extrapolate conclusions beyond the tested material class, population, temperature/density regime, or observable set.
- Do not present single-study or single-source evidence as field-wide consensus.
- Distinguish directly observed behavior from model-dependent inference and from agent-generated speculation.
- Avoid asserting that a mechanism is proven solely because one fit improves; require consistency across controls.
- Do not provide operational fabrication recipes, instrument settings, hazardous handling instructions, or clinical recommendations.

# Failure Modes

Ways the workflow or its conclusions can fail:

- **Latent-state confounding:** The anomaly is an artifact of misestimated hidden quantities, selection bias, or systematic error.
- **Parameter correlation / degeneracy:** Two or more mechanisms produce indistinguishable curves over the accessible variable range.
- **Underdetermined model:** Multiple competing explanations fit the data equally well without a discriminating control.
- **Narrow-regime artifact:** The diagnostic signature depends on a post-hoc chosen window and vanishes under reasonable regime shifts.
- **Secondary inconsistency:** A mechanism explains the target anomaly but violates independent constraints or evolutionary/structural closure.
- **Overfitting:** Added complexity improves fit without predictive consistency across independent variables.
- **Population or sample bias:** Stable-looking objects are harder to observe, or unstable-looking objects are overrepresented.
- **Measurement coupling:** The apparent signal arises from imaging angle, background, normalization, or instrument artifact rather than the proposed physics.

# Validity Checks

Before finalizing any conclusion, verify:

- **Confounding:** Could nuisance variables, sample heterogeneity, environmental factors, or measurement artifacts explain the trend?
- **Inference dependence:** Does the conclusion survive alternative assumptions about hidden state, calibration, or background?
- **Regime validity:** Is the model applied only where its assumptions are justified?
- **Parameter independence:** Are central parameters constrained outside the fitted dataset?
- **Reproducibility:** Are trends replicated across comparable conditions, independent samples, or repeated sessions?
- **Mechanism specificity:** Does the mechanism predict a distinctive signature rather than a generic trend?
- **Rival fairness:** Are competing explanations tested in their own valid regimes?
- **Statistical validity:** Are uncertainties, model-selection penalties, and sensitivity analyses reported?
- **Boundary sensitivity:** Does the result depend on a narrow boundary crossing, and are uncertainties large enough to erase it?
- **Evidence transparency:** Are successful and failed comparisons both reported?

# Provenance

Derived from cluster 9, subcluster 9.0 ("observable-driven mechanism discovery and validation"). Synthesized from source skills: `neutron-star-instability-exploration`, `magnetic-damping-mechanism-decomposition`, `distorted-kagome-magnet-exploration`, `constrained-model-discrimination-condensed-matter-transport`, `magnetic-dilution-research-explorer`, `interfacial-flow-mechanism-inversion`, `interface-pinning-antifreeze-research`, `21cm-anomaly-constraint-overlay`.
