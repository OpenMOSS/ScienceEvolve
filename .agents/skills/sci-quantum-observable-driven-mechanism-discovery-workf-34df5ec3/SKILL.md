---
name: sci-quantum-observable-driven-mechanism-discovery-workf-34df5ec3
description: A reusable end-to-end workflow for proposing, validating, and iterating mechanistic hypotheses in complex physical systems using orthogonal readouts, controlled perturbations, and regime-aware analysis.
scienceevolve-title: "Quantum materials and condensed matter · observable driven mechanism discovery workflow 10"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Guide agents through an observable-driven process to discover and validate mechanisms in systems where competing explanations exist. The workflow abstracts a reusable pattern of hypothesis portfolio generation, minimal validation design, multi-readout cross-checking, and iterative mechanism discrimination across domains such as interfaces, phases, magnetic, granular, and correlated matter.

# When to use

Use this skill when:
- The user needs to design research to distinguish competing mechanisms behind an observed phenomenon.
- The phenomenon is stochastic, history-dependent, or governed by coupled degrees of freedom.
- Multiple readouts (global/local, structure/function, time/space-resolved) are required to validate a mechanism.
- The goal is to map regime boundaries or emergent phases under a continuous tuning parameter.
- Prior evidence is suggestive but mechanism remains underconstrained.

Do not use this skill for operational laboratory protocols, clinical decision-making, device fabrication recipes, or as a substitute for field-wide consensus.

# Inputs required

Before generating a plan, request or identify:
- Target phenomenon, observable response, or regime boundary to be explained.
- Candidate system class and relevant constraints (at a non-operational level).
- Available orthogonal readouts and perturbation axes.
- Prior evidence base, literature benchmarks, and known artifacts or confounders.
- The user's decision goal (e.g., mechanism discrimination, regime mapping, reliability improvement).
- Safety, ethics, and institutional compliance boundaries.

# Core Workflow

Follow this ordered route. At each gate, decide whether to proceed, redesign, or stop.

1. **Frame the mechanism gap**
   - Define the observable transition or response and the unresolved causal chain.
   - Specify the order parameter or metric that tracks the phenomenon.
   - **Decision gate:** Stop if the observable is ill-defined, lacks a reproducible baseline, or if safety boundaries are undefined.

2. **Generate a hypothesis portfolio**
   - Formulate at least three competing hypotheses (e.g., direct coupling, indirect mediation, nonmonotonic crossover, artifact).
   - For each hypothesis, state: mechanism role, predicted signatures across readouts, evidence strength, key assumptions, and likely failure modes.
   - Rank by falsifiability and whether predicted signatures are orthogonal across readouts.

3. **Design minimal viable validation**
   - Select a baseline condition and at least one perturbed condition expected to alter the mechanism.
   - Define a coupling proxy or tuning axis that is abstracted from specific apparatus.
   - Span below-threshold, near-threshold, and above-threshold regions when mapping regimes.
   - **Decision gate:** Stop if the perturbation cannot be independently characterized or if the coupling proxy is not specific.

4. **Build the control architecture**
   - **Negative control:** condition where the proposed mechanism should be suppressed.
   - **Positive control:** known reference response, if available.
   - **Orthogonal control:** alternative perturbation or readout testing the same mechanism via a different pathway.
   - **Artifact control:** checks for drift, heating, geometry effects, substrate effects, or readout crosstalk.
   - **Decision gate:** Stop if negative controls reproduce the target response or if the control set is insufficient to reject the main alternatives.

5. **Execute multi-readout observation**
   - Acquire the primary readout (global, transport, or functional).
   - Acquire an orthogonal readout (local, imaging, structural, or spectroscopic).
   - Record stochastic variability, history dependence, and spatial heterogeneity.
   - **Decision gate:** If readouts contradict without an explainable calibration or sensitivity reason, pause and audit before interpreting.

6. **Analyze with mechanism-aware decomposition**
   - Preprocess transparently; document normalization, calibration, and exclusion rules.
   - Compare nominal versus effective variables when hidden structure (e.g., packing, contact network, disorder) is suspected.
   - Decompose trajectories or responses into components (fast/slow, impulsive/delayed, structure/function).
   - Map the response against the tuning parameter to identify monotonic, threshold-like, or nonmonotonic regimes.
   - **Decision gate:** If the target response is indistinguishable from controls after correction, stop and redesign.

7. **Update hypotheses and evidence strength**
   - Strengthen hypotheses supported by multiple independent readouts and strong controls.
   - Weaken hypotheses contradicted by timing, sign, symmetry, or control behavior.
   - If orthogonal readouts disagree, treat the discrepancy as evidence for heterogeneity, metastability, or artifacts rather than noise.
   - **Iteration gate:** If all hypotheses remain low evidence after controls, return to Step 2 with revised assumptions.

8. **Iterate or terminate**
   - **If strongly supported:** Define boundary conditions and propose a generalization test in a second system or regime.
   - **If partially supported:** Design the next minimal discriminating experiment targeting the remaining ambiguity.
   - **If contradicted:** Pivot to alternative mechanism classes or audit confounders.
   - **Stop conditions:** Controls match the test condition; artifacts dominate; irreversible drift or uncontrolled heating dominates; the apparent effect disappears across repeated trials; the analysis depends on averaging away stochastic features that are central to the claim.

# Output Format

Return the following:

1. **Research question and scope** — target system class, phenomenon, and decision goal.
2. **Hypothesis portfolio** — ranked table with mechanism role, predicted signatures, evidence strength, key assumptions, and likely failure modes.
3. **Validation plan** — variables, control architecture, readouts, evaluation metrics, and stop conditions.
4. **Analysis plan** — preprocessing rules, decomposition approach, regime mapping, uncertainty propagation, and model comparison.
5. **Iteration decision rules** — triggers for strengthening, weakening, or pivoting hypotheses, plus the next minimal test.
6. **Validity and safety summary** — main confounders, reproducibility requirements, boundary conditions, and non-operational safety constraints.

# Validation Gates

Before finalizing any claim, verify:
- **Confounding audit:** Could heating, drift, geometry, substrate, disorder, contact effects, or calibration limits explain the response?
- **Reproducibility:** Are key observations repeated across trials, independent samples, or independent sessions?
- **Readout validity:** Do global and local/orthogonal observables agree in onset, trend, and magnitude?
- **Statistical validity:** Are uncertainty intervals, effect sizes, repeated-measure structure, and multiple-comparison handling reported?
- **Criterion robustness:** Do conclusions survive reasonable changes in threshold, onset definition, or analysis criteria?
- **Model risk:** Avoid overfitting a two-process model when additional mechanisms may explain the same observations.

# Claim Boundaries

- Clearly separate demonstrated evidence from new-system inferences or speculative extrapolations.
- Limit claims to the characterized descriptor space, material class, geometry, and perturbation regime.
- Do not present single-study or single-system evidence as field-wide consensus.
- Separate direct observation from inferred mechanism; label agent-generated hypotheses as provisional.
- Require independent validation before generalizing to applications or technology readiness.

# Failure Modes

- Controls reproduce the target response, indicating a false positive.
- Orthogonal readouts contradict without an explainable calibration or sensitivity reason.
- Apparent effect disappears upon replication, heating correction, or artifact removal.
- Model fit is unstable, overparameterized, or inconsistent across readouts.
- Sample-to-sample or geometry-dependent variability dominates without systematic explanation.
- Regime boundary depends strongly on subjective analysis criteria.
- Structure and function are decoupled (e.g., one improves without the other).

# Validity Checks

- Is the coupling proxy or tuning axis specific to the intended mechanism and validated independently?
- Are transition criteria, exclusion rules, and analysis choices predefined rather than fitted post hoc?
- Have competing orders, filamentary behavior, percolation, and measurement bias been explicitly considered?
- Is the mechanism claim framed as constraining candidate explanations rather than proving a single microscopic model?
- Are safety, ethics, and institutional review constraints respected?
- Is the output strictly non-operational, with no executable hazardous parameters, fabrication recipes, or procedural protocols?

# Provenance

- Synthesized from cluster 163.0 (observable-driven mechanism discovery and validation).
- Derived from source skills: optical-spintronics-research-exploration, condensed-matter-phase-mapping, interfacial-assembly-research-skill, ultrafast-magnetism-exploration, pna-biosensor-research-workflow, pressure-tuned-nickelate-superconductivity-exploration, layered-material-coupling-transport-exploration, granular-effective-variable-exploration.
