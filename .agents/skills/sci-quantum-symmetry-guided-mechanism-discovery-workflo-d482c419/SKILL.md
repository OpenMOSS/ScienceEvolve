---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-d482c419
description: A reusable end-to-end workflow for generating, discriminating, and validating microscopic mechanisms in symmetry-constrained quantum materials through hypothesis ranking, controlled validation, and iterative model updating.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Guide agents to discover and validate microscopic mechanisms in correlated, topological, and quantum materials where symmetry constraints, competing interactions, and multiple observables must be reconciled. The workflow converts an unresolved anomaly or theoretical gap into ranked hypotheses, designs minimal controlled validations, and iterates until claims are strictly bounded by evidence.

## When to use

Use this skill when:

- A material system exhibits an anomalous transport, spectroscopic, thermodynamic, or fluctuation response that lacks a consensus mechanism.
- Competing explanations involve symmetry-breaking, electronic correlations, topological invariants, or coupling between hidden variables and observables.
- The task requires generating research questions, designing validation plans, or interpreting data across multiple probes.
- The agent must distinguish paper-validated patterns from speculative extensions and bound claims accordingly.

## Inputs required

Before executing the workflow, identify:

- Target system class, relevant symmetries, active degrees of freedom, and known competing phases.
- Baseline model or expectation that the observation contradicts.
- Candidate hidden variables or mechanisms (e.g., configuration reorganization, mode competition, screening changes, band renormalization).
- Available observables and diagnostics with their symmetry selection rules.
- Known confounders and artifact risks.
- Validation constraints including computational cost, experimental feasibility, and safety boundaries.

## Core Workflow

1. **Frame the anomaly.** State the observation that conflicts with the baseline model and identify the missing microscopic link. **Gate:** If the anomaly is not reproducible or is explainable by known artifacts, stop and audit inputs.
2. **Build a minimal symmetry-aware model.** Isolate the essential degrees of freedom and symmetries. Avoid full-material complexity; use the smallest model that can produce the candidate effect. **Gate:** If the model cannot reproduce the effect in principle, reject the mechanism or add a necessary ingredient.
3. **Generate ranked hypotheses.** Produce at least three competing hypotheses (e.g., intrinsic mechanism, artifact or competing order, crossover or boundary effect). For each, specify evidence strength, key assumption, predicted observable signature, likely failure mode, and boundary of inference. **Gate:** If only one hypothesis is conceivable, broaden the search for alternatives before proceeding.
4. **Design minimal viable validation.** Define the smallest test (numerical, theoretical, or non-operational experimental design) that can falsify the leading hypothesis. Specify the perturbation axis, primary readout, and baseline reference. **Gate:** If the test is infeasible or unsafe, redesign at a higher abstraction level.
5. **Assemble the control hierarchy.** Include: a baseline control (unperturbed reference); a negative control (condition suppressing the target mechanism); a positive control (known response confirming sensitivity); an alternative-mechanism control (condition favoring a competing explanation); and a symmetry control (preserving versus breaking the relevant symmetry). **Gate:** If controls cannot separate the target mechanism from confounders, pause and refine diagnostics.
6. **Execute and analyze against pre-registered expectations.** Compare results to predicted signatures before interpreting. Check symmetry consistency of response channels. Separate evidence for microscopic configuration changes from evidence for macroscopic response changes. Compare static and dynamical limits where applicable. **Gate:** If data contradict pre-registered predictions, do not force-fit; proceed to iteration.
7. **Score evidence and discriminate mechanisms.** Evaluate directional match, scaling match, timing or regime match, control behavior, and robustness to analysis choices. **Gate:** If multiple mechanisms remain indistinguishable, add an orthogonal diagnostic or perturbation axis before claiming discrimination.
8. **Iterate or terminate.**
   - **Strengthen:** If results align with predictions and survive controls, bound the claim scope and propose a stronger cross-system test.
   - **Revise:** If results contradict predictions, identify the failing assumption, weaken or reject the hypothesis, and generate a revised mechanism.
   - **Refine:** If results are ambiguous, improve controls or diagnostics; do not broaden claims.
   - **Stop conditions:** A competing phase appears before mechanism isolation; the response lacks microscopic support; the result depends on a non-generic artifact; controls fail; or safety or feasibility limits are reached.
9. **Bound and document claims.** Classify each conclusion as directly validated, indirectly supported, plausible extension, or speculative. State whether the claim is model-specific, family-level, or broader. Identify the next falsification test.

## Output Format

Return:

1. **Research question and gap statement.**
2. **Ranked hypothesis table** — mechanism, evidence strength, key assumption, predicted signature, likely failure mode, and inference boundary.
3. **Validation plan** — minimal viable test, control hierarchy, variables, metrics, and stop conditions.
4. **Analysis plan** — pre-registration rules, symmetry checks, static/dynamical comparison, and uncertainty quantification.
5. **Iteration decision tree** — conditions for strengthening, weakening, rejecting, or redesigning.
6. **Claim boundary statement** — scope, extrapolation limits, and evidence classification.
7. **Validity and safety summary** — confounders, reproducibility needs, and non-operational boundaries.

## Validation Gates

- **Reproducibility gate:** The anomaly must be stable across independent samples, runs, or numerical realizations.
- **Symmetry gate:** Observed response components must be allowed by stated symmetries; suppressed channels must not be artifacts.
- **Control gate:** The target mechanism must survive negative and alternative-mechanism controls.
- **Consistency gate:** Static and dynamical diagnostics must not contradict without a formulated resolution.
- **Robustness gate:** Conclusions must be stable under reasonable changes in model assumptions, boundary conditions, or analysis choices.
- **Feasibility gate:** The validation plan must be achievable within stated computational, experimental, and safety constraints.

## Claim Boundaries

- Distinguish exact-model claims from family-level claims and from broader material-class generalizations.
- Label claims as directly validated by evidence, indirectly supported by model inference, plausible extension, or speculative extrapolation.
- Do not treat a single study or single system as field-wide consensus.
- Identify the specific symmetry regime, temperature range, tuning window, and sample-quality regime where the claim holds.

## Failure Modes

- **Artifact dominance:** Signal is explained by surface effects, disorder, calibration drift, finite-size effects, or numerical approximations.
- **Competing order:** A nearby phase transition or hidden order masks the target mechanism.
- **Over-interpretation:** Inferring a microscopic mechanism from a single observable without configuration-level or cross-probe support.
- **Model overfitting:** Adding ad hoc parameters to preserve a failed hypothesis rather than rejecting it.
- **False extrapolation:** Extending a model-specific result to incompatible symmetries, dimensionalities, or material classes.
- **Conflation of scales:** Confusing static equilibrium signatures with dynamical or transient responses.

## Validity Checks

- **Confounding factors:** Assess disorder, stoichiometry, boundary conditions, finite-size effects, probe perturbation, and environmental drift.
- **Statistical and numerical validity:** Report uncertainties, convergence behavior, sensitivity to truncation or discretization, and fitting residuals.
- **Cross-probe consistency:** Require qualitative convergence between independent observables before updating a mechanism.
- **Thermodynamic and symmetry consistency:** Verify that proposed mechanisms respect equilibrium limits, selection rules, and conservation laws where applicable.
- **Reproducibility:** Document assumptions, controls, analysis sequence, and parameter choices needed to reproduce the conclusion.
- **External validity:** State where the effective theory or model breaks down due to competing phases, high-energy effects, or incompatible lattice connectivity.

## Provenance

- Derived from cluster 12.1 (symmetry-guided mechanism discovery and validation) of the Codex scientific skills corpus.
- Synthesized from representative source skills: arxiv-cmoat__2511.04141 (altermagnetic-correlation-response-planning), 2ba51f9b76bef2b2 (heavy-fermion-local-probe-research), a1e73e5991fa5064 (ultrafast-topological-band-renormalization-workflow), a3efe6d10216eda1 (magnon-wave-oam-research-design), 9f2c6a5f43782f7d (correlated-materials-imt-workflow), 2736efe44ac770fc (nonequilibrium-fluctuation-pdf-research), e0c4799edc6ae41f (heavy-fermion-thermodynamic-exploration), and 710e37cef2ee0c13 (near-field-radiative-heat-transfer-research-planning).
- Preserves no paper-specific conclusions, numerical results, or operational protocols.
