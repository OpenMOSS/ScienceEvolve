---
name: sci-quantum-quantum-symmetry-evidence-audit-workflow-01668da6
description: End-to-end evidence analysis and claim audit for quantum, symmetry-driven, and multi-channel systems, emphasizing cross-validation, robustness checks, and bounded inference.
scienceevolve-title: "Quantum materials and condensed matter · quantum symmetry evidence audit workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Help an agent transform anomalous or weak signals in quantum, correlated, or symmetry-constrained systems into a reproducible, auditable research workflow. The skill guides hypothesis generation, minimal viable validation design, multi-source cross-checking, and iterative claim refinement while enforcing strict boundaries between verified facts, model inferences, and unsupported extrapolations.

## When to use

- When the research involves quantum-scale phenomena, symmetry constraints, selection rules, or multi-channel coupling.
- When observable anomalies (spectral, transport, magnetic, structural, or statistical) require mechanistic interpretation beyond single-dataset fitting.
- When multiple theoretical frames (first-principles, effective models, symmetry analysis) and experimental or computational probes must be reconciled.
- When the risk of confounding by background, instrument response, finite-size effects, or model bias is high.
- Not for clinical, biosecurity, or directly executable hazardous operational protocols.

## Inputs required

- Target system class and known quantum numbers, symmetries, or selection rules.
- Available data streams (experimental, simulated, theoretical) with uncertainty estimates and provenance.
- Observable anomalies or gaps to be explained, anchored to reproducible features.
- Candidate mechanisms and their theoretical or symmetry constraints.
- Reference systems for positive, negative, and structural controls.
- Resource, safety, and compliance constraints (stated non-operationally).

## Core Workflow

1. **Anchor the anomaly**  
   Define the research question as a falsifiable proposition tied to a reproducible anomaly or gap.  
   *Decision Gate 1*: Is the anomaly confirmed by independent observations or robust against preprocessing choices? If no, stop and audit data quality.

2. **Generate tiered hypotheses**  
   Produce mechanism hypotheses spanning instrumental artifacts, calibration effects, and intrinsic physics. Rank each by evidence strength (strong / moderate / weak / speculative). State key assumptions, falsifiable predictions, and failure modes.  
   *Decision Gate 2*: Does the hypothesis set cover the full space from artifact to intrinsic physics? If no, expand candidates before proceeding.

3. **Design minimal viable validation**  
   Define the smallest experiment, computation, or cross-check that can discriminate the leading hypotheses. Specify independent variables, response variables, confounders, and a control hierarchy (positive, negative, structural, method). Define evaluation metrics and stop conditions.  
   *Decision Gate 3*: Can the validation yield a discriminatory signal with available resources? If no, downgrade to exploratory and redefine scope.

4. **Execute multi-source analysis**  
   Preprocess all data with audited, uniform pipelines; record every filtering, fitting, and normalization choice. Perform cross-validation across independent probes, methods, or datasets. Compare competing models using residuals, parameter stability, and symmetry/consistency checks.  
   *Decision Gate 4*: Do independent probes converge on the same trend? If conflict arises, investigate confounders before any mechanistic inference.

5. **Robustness and sensitivity audit**  
   Perturb key assumptions (model space, background, calibration, symmetry constraints, sample identity). Check boundary conditions, extrapolation limits, and parameter sensitivity.  
   *Decision Gate 5*: Does the conclusion survive alternative analysis choices and boundary tests? If no, downgrade claim strength.

6. **Grade evidence and bound claims**  
   Classify each claim as Directly Supported, Indirectly Supported, Conflicting, or Unresolved. Explicitly separate verified facts, model-supported inferences, and agent extrapolations.  
   *Decision Gate 6*: Are all claims bounded by stated assumptions and scope limits? If no, revise claims.

7. **Iterate or terminate**  
   - If evidence supports a hypothesis: define the next discriminatory test to tighten boundaries or extend to adjacent systems.  
   - If evidence contradicts: generate alternative hypotheses and return to Stage 2.  
   - If inconclusive: state data/model gaps and stop until new inputs arrive.  
   *Stop conditions*: Anomaly irreproducible; controls fail; model requires excessive free parameters; safety or compliance boundaries reached; external constraints exclude the hypothesis space.

## Output Format

1. **Research Question**: Falsifiable proposition with anomaly anchor and scope boundary.
2. **Gap and Mechanism Map**: Knowns, unknowns, candidate mechanisms, and inapplicability conditions.
3. **Ranked Hypothesis Table**: Hypothesis, evidence strength, key assumptions, failure modes, falsifiable predictions, and minimal validation.
4. **Validation Design**: Variables, control hierarchy, evaluation metrics, and stop conditions.
5. **Analysis Plan**: Preprocessing audit, cross-validation protocol, model comparison, uncertainty propagation, and symmetry checks.
6. **Robustness Report**: Sensitivity analysis, boundary checks, confounder assessment, and alternative model outcomes.
7. **Evidence Map**: Graded claims separating verified facts, inferences, and extrapolations.
8. **Iteration Directive**: Next step, conditions for upgrade/downgrade, and termination criteria.

## Validation Gates

- **Data-quality gate**: Anomaly is reproducible and independent of preprocessing choices.
- **Hypothesis-completeness gate**: Hypothesis space covers artifacts, instrumental effects, and intrinsic physics.
- **Discrimination gate**: The validation design can separate competing hypotheses.
- **Convergence gate**: Independent probes or methods converge before mechanistic inference is allowed.
- **Robustness gate**: Conclusions survive perturbation of assumptions, models, and boundary conditions.
- **Claim-boundedness gate**: Every claim is tied to explicit assumptions and scope limits.

## Claim Boundaries

- Distinguish "verified by independent sources," "supported by model under stated assumptions," and "agent inference requiring new validation."
- Do not present single-system, single-model, or single-probe results as domain consensus.
- Restrict claims to the tested symmetry, energy, coupling regime, material class, or parameter range.
- Flag any conclusion that relies on unverified extrapolation across species, environments, scales, or measurement techniques.

## Failure Modes

- Anomaly driven by calibration error, background mismatch, instrument response, or selection bias.
- Hypothesis space too narrow, omitting plausible artifact or alternative physics explanations.
- Overfitting: more free parameters than constraining data points.
- False convergence: apparent cross-probe agreement due to shared systematic bias.
- Boundary violation: claims extrapolated beyond tested symmetry, coupling regime, or sample class.
- Premature termination: stopping at first supporting evidence without control verification.

## Validity Checks

- **Confounding-factor audit**: List all known sources of spurious signal and verify controls address them.
- **Reproducibility check**: Independent datasets, batches, methods, or analysis pipelines yield consistent trends.
- **Statistical validity**: Uncertainty propagation, model comparison criteria, multiple-comparison correction, and outlier sensitivity.
- **Symmetry and consistency check**: Predicted selection rules, conservation laws, and sign/direction trends hold across observables.
- **Model-dependence check**: Conclusions are not artifacts of a single parameter set, basis, or approximation scheme.
- **Extrapolation check**: Cross-regime claims are downgraded and flagged as new hypotheses.

## Provenance

- Synthesized from cluster 46.0 (end-to-end evidence analysis and claim audit).
- Source skill references: rotronic-coupling-exploration (7f858b263520f969), surface-interface-magnetism-layer-probe-research (9b1b8f46959f9623), kohn-anomaly-epc-research-design (abfd9dcbcb0a5afb), correlated-magnetic-coexistence-workflow (11da83978626d306), nuclear-structure-seniority-exploration (d5f6f2d1be2d7d18), astrochemical-anion-formation-research (bc2a2c32b5fc6461), hep-rare-resonance-search-workflow (2a66920a1949c078), phonon-spin-collective-interference-research (e7afb0083c00cab4).
- No specific paper conclusions, numerical results, or operational protocols are inherited.
