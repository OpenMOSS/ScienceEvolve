---
name: sci-cosmology-galaxy-halo-feedback-environment-mechanis-574d9734
description: Use this skill to design and execute end-to-end research workflows that discover, discriminate, and validate astrophysical mechanisms governing galaxy, halo, and environmental evolution using observables, simulations, and controlled comparisons.
scienceevolve-title: "Galaxy, cosmology, and simulations · galaxy halo feedback environment mechanism discovery workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

## Purpose

Help an agent generate reproducible, end-to-end research plans for discovering and validating physical mechanisms in galaxy and halo systems. The workflow treats mechanism discovery as an observable-driven inference problem: frame a regulation or transition phenomenon, generate competing mechanistic hypotheses, design discriminating experiments or simulation comparisons, analyze results with strong controls, and iterate until claims are bounded by evidence.

## When to use

Use when a user asks to propose, test, or critique mechanisms connecting feedback, accretion, environment, or internal structure to observable galaxy or halo properties. Applicable to simulation-based, observation-based, or hybrid studies. Do not use to assert consensus from single studies, to prescribe specific numerical parameters, or to replace domain-expert review.

## Inputs required

Before producing a plan, ask for or infer:

- Target system class and regime (e.g., galaxy type, halo mass range, redshift, environment).
- Observable or simulated data products available (e.g., kinematic maps, photometry, simulation snapshots, merger trees).
- Candidate mechanisms or observed transitions to explain.
- Known confounders and selection effects.
- Comparison resources (alternative models, independent simulations, observational benchmarks).
- Desired output depth (hypothesis set, validation plan, full study design).

## Core Workflow

1. **Frame the regulation problem.**  
   Define the observed transition, correlation, or qualitative mismatch. State the gap between correlation and causation. Identify the energy reservoir, transport process, or structural driver that could plausibly regulate the phenomenon.  
   *Decision gate:* Is the phenomenon observable or diagnosable with available data? If no, stop and request inputs or redefine scope.

2. **Generate competing mechanistic hypotheses.**  
   Produce at least three hypotheses in mechanism form (not mere correlations). For each, create a hypothesis card: core claim, mechanistic rationale, evidence strength, key assumptions, predicted observables, failure modes, and boundary conditions. Include alternatives such as driver necessity, driver sufficiency, environmental modulation, observational bias, and alternative-driver explanations.  
   *Decision gate:* Do at least two hypotheses make distinguishable predictions in the available diagnostic space? If no, redefine observables or scope and repeat.

3. **Design the validation experiment.**  
   Define the target regime, unit of analysis, independent variables (e.g., feedback strength, environment class, gas phase), and dependent variables (e.g., gas fraction, star formation activity, kinematic state). Establish controls: null/negative control, positive control, proxy cross-check, and model/alternative control. Define minimal viable validation and evaluation metrics (occurrence rates, scaling relations, distributional tests, residual structure, energy budgets, timing sequences). If comparing simulations to observations, plan synthetic observations and a common measurement pipeline.  
   *Decision gate:* Are controls matched on dominant confounders? Is the diagnostic discriminative? If no, redesign sample or variables before proceeding.

4. **Execute analysis with mechanism discrimination.**  
   Separate observed facts from inferred quantities. Build a proxy comparison matrix and flag disagreements. Map state transitions in a shared diagnostic phase space. Compare short- and long-timescale tracers to test time-lag signatures. Compare model predictions directly in the same observable space. Test timing sequences (driver before response) and rates (trigger frequency versus outcome frequency). Decompose the mechanism into input state, process efficiency, and final output. Quantify uncertainty and robustness across proxies, definitions, resolution, and selection cuts.  
   *Decision gate:* Do independent proxies agree? Do positive and negative controls behave as expected? If controls fail, halt and fix the comparison pipeline before interpreting.

5. **Audit uncertainty and boundaries.**  
   Assess selection effects, projection effects, resolution limits, completeness, and mechanical coupling between variables. For simulations, evaluate whether outputs are converged or implementation-dependent. Determine extrapolation boundaries: where tested interpolation ends.  
   *Decision gate:* Is the signal robust to alternative definitions and assumptions? If no, downgrade claim strength or stop.

6. **Update claims and iterate.**  
   Classify evidence as confirm, refine, reject, or defer. If supported, propose a targeted follow-up that changes one assumption. If ambiguous, identify the limiting assumption or data gap. If contradicted, formulate an alternative mechanism and return to Step 2.  
   *Stop conditions:*  
   - The mechanism cannot be isolated from proxy bias or selection effects.  
   - Required diagnostics are unavailable.  
   - Results depend on one unvalidated simulation setting or narrow definition.  
   - Competing models make indistinguishable predictions in the available phase space.  
   - Trigger frequency is insufficient to explain outcome prevalence.

## Output Format

When using this skill, return:

1. **Research question framing** — phenomenon, gap, and domain boundary.  
2. **Hypothesis cards** — mechanism, evidence strength, key assumptions, predicted observables, failure modes, and boundary conditions.  
3. **Experimental design** — sample, variables, controls, metrics, and stop conditions.  
4. **Analysis plan** — diagnostic phase space, proxy triangulation, mechanism decomposition, timing and rate tests, robustness checks.  
5. **Validity and boundary assessment** — confounders, reproducibility requirements, observational or simulation limitations, and extrapolation boundaries.  
6. **Iteration decision** — recommended next step (confirm, refine, reject, defer), evidence needed to strengthen or falsify the mechanism, and what must not be claimed without further validation.

## Validation Gates

- **Proxy triangulation gate:** Independent halo, gas, structural, or kinematic proxies must agree within the intended regime before strengthening a claim.  
- **Causality gate:** The trigger or driver must precede the response; matched controls must weaken or nullify the effect.  
- **Control gate:** Positive and negative controls must behave as expected under the hypothesis.  
- **Discrimination gate:** Competing models must predict different outcomes in the chosen diagnostic space.  
- **Robustness gate:** Conclusions must survive alternative proxy calibrations, selection cuts, binning, and definitions.  
- **Rate plausibility gate:** For population-level claims, trigger frequency must be sufficient to explain outcome prevalence.

## Claim Boundaries

- Label every claim as **Paper-supported**, **Cross-study-supported**, **Simulation-supported**, **Observation-supported**, or **Agent-inferred**.  
- Restrict causal claims to tested regimes; present associations where causation is not isolated.  
- Do not extrapolate beyond tested mass, redshift, environment, gas phase, or resolution ranges without validation.  
- Distinguish converged simulation outputs from implementation-sensitive outputs.  
- Avoid presenting single-study or single-simulation results as field-wide consensus.

## Failure Modes

- **Proxy bias:** A trend appears for only one proxy or tracer.  
- **Feedback-mode misclassification:** The inferred coupling depends on unresolved subgrid physics or misclassified feedback mode.  
- **Selection-driven signal:** The result arises from detection limits, aperture effects, sample cuts, or catalog definitions.  
- **Projection or geometry artifacts:** Three-dimensional mechanisms are incorrectly inferred from projected observables.  
- **Confounding by environment or history:** Shared ancestry, preprocessing, or merger history mimics a causal link.  
- **Resolution or implementation artifact:** Numerical choices alter the apparent mechanism or timing.  
- **Rate mismatch:** The proposed trigger is too rare to explain the observed outcome frequency.  
- **Model degeneracy:** Multiple physical mechanisms produce indistinguishable observables in the tested diagnostic space.

## Validity Checks

- **Confounder control:** Are mass, epoch, environment, baseline state, and prior history controlled or stratified?  
- **Temporal ordering:** Does the trigger or driver precede the outcome, and are delays measured consistently?  
- **Definition sensitivity:** Do conclusions survive reasonable alternative trigger, outcome, and region definitions?  
- **Selection effects:** Could sample construction, completeness limits, or detection thresholds create the apparent signal?  
- **Mechanical coupling:** Are derived quantities treated as independent evidence when they share inputs or definitions?  
- **Statistical validity:** Are uncertainties, sample size, dispersion, and multiple-comparison risks sufficient for the claimed trend?  
- **Reproducibility:** Can another agent reconstruct the proxy choices, diagnostics, controls, and failure criteria?  
- **Boundary check:** Where does the mechanism transition from tested interpolation to extrapolation?  
- **Simulation realism check:** Do feedback mode, gas phase, resolution, and merger treatment plausibly represent the target system?  
- **Observational completeness check:** Are non-detections, background subtraction, aperture effects, and survey selection likely to bias the result?

## Provenance

- Synthesized from cluster 18 / subcluster 18.1 (observable-driven mechanism discovery and validation).  
- Source skill references: `agn-feedback-energy-budget-research`; `galaxy-disc-feedback-research-design`; `galaxy-halo-accretion-workflow`; `agn-feedback-xray-cavity-research-design`; `resolution-convergence-galaxy-simulation-research`; `galaxy-merger-event-workflow`; `astronomy-research-question-evidence-workflow`; `secular-structure-galaxy-research`.
