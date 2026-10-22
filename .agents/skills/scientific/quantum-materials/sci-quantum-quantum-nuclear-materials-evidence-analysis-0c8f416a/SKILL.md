---
name: sci-quantum-quantum-nuclear-materials-evidence-analysis-0c8f416a
description: End-to-end evidence analysis and claim audit workflow for quantum, nuclear, and materials research, emphasizing multi-probe cross-validation, mechanism exclusion, and iterative hypothesis bounding.
scienceevolve-title: "Quantum materials and condensed matter · quantum nuclear materials evidence analysis workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Transform single-study scientific methods into reusable, domain-transferable research workflows. This skill guides the agent to propose new questions, generate falsifiable hypotheses, design minimal validation with explicit controls, and iteratively audit claims across quantum, nuclear, and materials domains. It enforces a strict separation between verified findings and new inferences, and prevents the mechanical extrapolation of any single paper’s conclusions.

## When to use

- The user wants to abstract a published case or known paradigm into a transferable research framework rather than receive a literature summary.
- The research problem involves anomalies, hidden order, effective degrees of freedom, cross-scale coupling, or multi-probe responses.
- The task requires designing new hypotheses, control experiments, computational benchmarks, or analysis plans with explicit stop conditions.
- Evidence must be graded and claims bounded before extrapolation to new systems, energy scales, or material families.

## Inputs required

- **Target system**: Abstract description of the physical system, relevant symmetries, and known constraints.
- **Available probes/data**: Types of observables, simulations, or theoretical tools available, plus their resolution and limitation boundaries.
- **Candidate mechanisms**: Competing physical pictures, including null or artifact hypotheses.
- **Prior evidence and provenance**: What is directly verified, what is inferred by analogy, and what remains unknown.
- **Resource and safety boundaries**: Non-operational constraints on feasible measurements, computations, and compliance scope.

## Core Workflow

### 1. Problem Definition and Gap Audit
- Identify the anomaly, gap, or hidden variable that existing default assumptions may obscure.
- List the field’s standard simplifications (e.g., low-dimensional projection, averaging, single-probe focus) that could mask the target mechanism.
- **Decision gate**: If the problem cannot be framed as a falsifiable question within the stated resource boundaries, stop and reformulate.

### 2. Hypothesis Generation and Evidence Grading
- Generate a family of competing hypotheses, including:
  - Target mechanism hypothesis.
  - Partial or conditional mechanism hypotheses.
  - Null/background/artifact hypotheses.
- For each hypothesis, assign an evidence strength (high / medium / low) and document:
  - Key assumptions required for the hypothesis to hold.
  - Explicit failure modes: specific data patterns that would invalidate the hypothesis.
- **Decision gate**: If the top hypotheses lack mutually exclusive predictions, refine the candidate set until they are distinguishable.

### 3. Minimal Viable Validation Design
- Select a primary readout and a low-dimensional control-parameter scan that covers normal, anomalous, and boundary regimes.
- Define controls:
  - **Strong control**: same system under conditions that isolate or suppress the candidate mechanism.
  - **Negative control**: systems or configurations expected to lack the target signal.
  - **Positive control**: known cases or synthetic benchmarks that verify the analysis pipeline can recover the expected signature.
  - **Robustness control**: perturbation of non-critical parameters or approximations to check for overfitting.
- Pre-register success criteria and stop conditions before data collection or analysis.
- **Decision gate**: If the validation plan cannot discriminate the leading two hypotheses, redesign before proceeding.

### 4. Multi-Probe Execution and Cross-Validation
- Obtain or analyze data from at least two conceptually independent probes, channels, or theoretical constraints.
- Align theoretical predictions with experimental observables in the same coordinate space (e.g., momentum, energy, temperature, field).
- Perform mechanism ablation: remove the candidate mechanism from the model and quantify the degradation in explanatory power.
- **Decision gate**: If independent probes give contradictory trends at comparable confidence, pause mechanistic claims and diagnose probe-specific artifacts or model misalignment.

### 5. Uncertainty Quantification and Robustness Check
- Propagate statistical, systematic, and model uncertainties into all reported trends.
- Perform sensitivity analysis on background models, resolution, normalization, grid density, and alternative theoretical approximations.
- Compare the candidate model against the best alternative model using consistent data and complexity-aware metrics.
- **Decision gate**: If the conclusion collapses under reasonable parameter perturbation or if an alternative model explains the data equally well with fewer assumptions, downgrade the evidence strength.

### 6. Claim Bounding and Iteration
- Classify each conclusion into one of four tiers:
  - **Observed**: directly supported by data.
  - **Model-compatible**: reproduced by a theoretical framework.
  - **Mechanism-inferred**: supported by multi-probe consistency and ablation tests.
  - **Extrapolation**: analogical transfer to new systems or scales.
- Update the hypothesis table based on the new evidence.
- **Stop / pivot conditions**:
  - The hypothesis reaches high evidence and generates a clear, testable new prediction.
  - The hypothesis drops to low evidence with no viable correction path.
  - Results are driven by free parameters, selection effects, or untested extrapolations.
  - Safety, compliance, or resource boundaries prevent further meaningful testing.
- If stopping, document the failure path and residual uncertainty for future work.

## Output Format

Produce a structured research audit report containing:

1. **Research Question Definition**
   - Target system and scope.
   - Anomaly or gap to be explained.
   - Known evidence and critical unknowns.

2. **Candidate Hypothesis Table**
   - Hypothesis name and mechanism summary.
   - Evidence strength (high / medium / low).
   - Key assumptions.
   - Explicit failure modes.

3. **Minimal Viable Validation Plan**
   - Primary readout and control variables.
   - Strong, negative, positive, and robustness controls.
   - Evaluation metrics.
   - Pre-registered stop conditions.

4. **Multi-Probe Analysis Plan**
   - Data quality and preprocessing audit rules.
   - Theoretical-experimental alignment method.
   - Mechanism ablation protocol.
   - Uncertainty propagation and sensitivity analysis.

5. **Iteration Decision Tree**
   - If results support the hypothesis: next validation step.
   - If results partially support: missing evidence to acquire.
   - If results do not support: alternative hypotheses or termination rationale.

6. **Claim Boundary Statement**
   - Verified vs. inferred vs. extrapolated claims.
   - Applicable domain, scale, and symmetry conditions.
   - Residual risks and untested boundaries.

## Validation Gates

Before advancing from one stage to the next, confirm:
- **Falsifiability**: Every active hypothesis has at least one defined observable pattern that would invalidate it.
- **Control discrimination**: The control suite is capable of rejecting at least one major alternative explanation.
- **Cross-probe consistency**: Independent probes do not contradict at the same confidence level; any divergence is flagged and diagnosed.
- **Robustness**: The conclusion survives reasonable perturbation of non-critical parameters, background models, and alternative theoretical treatments.
- **Reproducibility**: The data pipeline, model configuration, and analysis scripts are documented with sufficient detail for independent replication.

## Claim Boundaries

- Distinguish strictly between **direct observation**, **model reproduction**, **mechanism inference**, and **analogical extrapolation**.
- State the domain, energy/length/temperature scale, symmetry regime, and sample conditions under which each claim holds.
- Do not present single-study, single-system, or single-model results as field consensus.
- Flag any claim that relies on untested extrapolation of systematics, intensity functions, or effective parameters.
- When migrating a method from one system to another, treat the transfer as a new hypothesis requiring independent validation.

## Failure Modes

- **Hypothesis degeneration**: Multiple mechanisms produce observationally indistinguishable predictions within current resolution.
- **Control failure**: The negative control exhibits the target signal, or the positive control fails to recover the expected signature.
- **Probe conflict**: Independent measurements or theoretical constraints yield contradictory trends that cannot be reconciled by known artifacts.
- **Overfitting**: The model explains only a narrow data window, requires excessive parameter tuning, or fails on held-out conditions.
- **Artifact mimicry**: Background, resolution limits, normalization choices, selection effects, or finite-size artifacts replicate the purported physical signal.
- **Extrapolation overreach**: A pattern validated in one regime is applied beyond its tested boundary without independent verification.
- **Premature convergence**: Stopping iteration because of resource limits rather than because the evidence has reached a decisive threshold.

## Validity Checks

- **Confounding factors**: Evaluate sample heterogeneity, instrument response, background structure, selection functions, truncation artifacts, and finite-size effects.
- **Reproducibility**: Require cross-sample, cross-condition, cross-model, and cross-probe replication; report rates of agreement and disagreement.
- **Boundary conditions**: Explicitly state the regime of applicability for symmetry assumptions, model approximations, and probe resolutions.
- **Statistical and numerical validity**: Report uncertainty propagation, convergence tests, multiple-comparison corrections, and parameter sensitivity.
- **Mechanism uniqueness**: Use ablation and alternative-model comparison to confirm that the favored mechanism is not one of several equally valid explanations.
- **Provenance audit**: Continuously separate verified findings, migration inferences from analogous systems, and heuristic assumptions.

## Provenance

- Derived from cluster **147.0** (quantum-nuclear-materials-energy-evidence-analysis-workflow).
- Synthesized from representative source skills:
  - `wigner-quantum-dot-anyon-exploration`
  - `hidden-order-gauge-fluctuation-research`
  - `dynamic-lensing-research-workflow`
  - `nuclear-photon-strength-exploration`
  - `magnetic-cluster-ins-workflow`
  - `nuclear-structure-mirror-energy-workflow`
  - `ferroelectric-ultrafast-exploration`
  - `condensed-matter-hidden-dimension-susceptibility`
- This skill preserves only the shared end-to-end workflow structure and decision logic. No specific paper conclusions, material parameters, numerical results, or operational protocols from the source skills are included.
