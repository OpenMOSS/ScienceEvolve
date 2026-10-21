---
name: sci-quantum-quantum-topological-transport-spin-evidence-541ceb32
description: End-to-end evidence analysis and claim audit workflow for quantum, topological, and spin transport research, guiding hypothesis generation, minimal validation design, controlled analysis, and iterative claim bounding.
scienceevolve-title: "Quantum materials and condensed matter · quantum topological transport spin evidence analysis workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Help agents translate open questions in quantum, topological, spin, and strongly correlated systems into auditable research plans. This skill provides a reusable end-to-end route for mechanism mapping, falsifiable hypothesis generation, minimal validation with rigorous controls, structured analysis, and iterative claim bounding. It emphasizes method migration and evidence grading over replication of any single study.

## When to use

- The user needs to propose a new research question or mechanism in quantum, topological, condensed matter, or related wave/transport domains.
- The user has preliminary data, theoretical clues, or experimental anomalies that require structured hypothesis testing.
- The task involves designing validation logic (controls, metrics, stop conditions) rather than executing operational experimental steps.
- The user needs to audit an evidence chain, bound claims, or distinguish a target mechanism from confounding effects.

## Inputs required

1. **Target system and known properties**: Relevant Hamiltonian, symmetry class, material family, device geometry, or effective model.
2. **Existing evidence and its limitations**: Direct observations, indirect inferences, theoretical predictions, and known failures.
3. **Candidate mechanisms and competing explanations**: Target mechanism, conventional alternatives, and potential artifact sources.
4. **Available probes and models**: Spectroscopic, transport, scattering, imaging, numerical, or analytical tools accessible to the user.
5. **Constraints**: Theoretical approximations, resource limits, safety and compliance boundaries, and scope limits (non-operational).

## Core Workflow

1. **Gap and mechanism mapping**
   - Define the scientific gap by stating what existing explanations cover, what they omit, and why the target system may differ.
   - Construct a causal mechanism chain: *control parameter → intermediate physical object → coupling/transition process → observable signature*.
   - Tier existing evidence: (a) directly observed, (b) model-supported inference, (c) analogy-based extrapolation.
   - **Decision gate**: Proceed only if the gap can be framed as a falsifiable mechanism question; otherwise reformulate.

2. **Hypothesis portfolio generation**
   - Generate a primary hypothesis (target mechanism produces distinct or non-additive signatures) and at least two alternatives (conventional explanation, non-target mechanism, artifact).
   - For each hypothesis, specify: predicted observable signatures, dependence on control variables, key assumptions, and explicit failure modes.
   - Grade evidence strength:
     - **High**: independent parameters plus clear control predictions.
     - **Medium**: theoretically consistent but a key coupling or loss channel remains unverified.
     - **Low**: analogy or extrapolation with high parameter sensitivity.
   - **Decision gate**: Reject or refine hypotheses that lack a conceivable negative result. Ensure the portfolio includes one minimal-viable hypothesis, one strong-control hypothesis, and one alternative hypothesis.

3. **Minimal validation design**
   - Design the smallest test capable of distinguishing the primary hypothesis from its nearest alternative.
   - Define controls:
     - **Positive control**: known system or limit that reproduces the expected baseline signature.
     - **Negative control**: system lacking the target mechanism or with the coupling removed, expected to suppress the signature.
     - **Strong control**: directional perturbation (e.g., detuning, symmetry breaking, path reversal) predicted to alter the signature in a specific way if the mechanism holds.
   - Specify independent variables, response variables, covariates, and evaluation metrics (relative change, statistical separation, model residuals, reproducibility).
   - Define **stop conditions**: signature irreproducible, negative control mimics target, model unidentifiable, safety or compliance boundary reached, or resource limit exceeded.
   - **Decision gate**: Validate that controls are technically feasible and logically capable of falsifying the hypothesis before execution.

4. **Execution and structured analysis**
   - Preprocess data with documented calibration, background subtraction, normalization, and noise estimation; retain raw records and exclusion criteria.
   - Decompose the total response into target contribution, background, and artifact terms.
   - Extract features relevant to the mechanism chain (e.g., spectral peaks, transport nonlinearity, phase dependence, spatial patterns).
   - Fit or simulate target and alternative models simultaneously; compare residuals, parameter identifiability, and out-of-sample predictive power.
   - Perform sensitivity and perturbation analysis on coupling strengths, dissipation, geometry, and disorder to separate robust conclusions from parameter coincidences.
   - Visualize regime maps, control-difference plots, and residual structures; every figure must state which hypothesis it supports or excludes.
   - **Decision gate**: Check numerical convergence, repeatability across independent runs or samples, and consistency between local and global indicators. If checks fail, halt and diagnose.

5. **Evidence grading and claim bounding**
   - Classify results into four tiers:
     - **Supports target mechanism**: multiple independent indicators align with predictions and controls behave as expected.
     - **Supports alternative mechanism**: control or strong-control results match an alternative explanation.
     - **Insufficient evidence**: signal near noise, controls ambiguous, or model non-identifiable.
     - **Incompatible with all current hypotheses**: anomalous result requiring reformulation.
   - Bound claims: distinguish "directly observed," "model-inferred," "cross-system analogy," and "speculative." Do not present single-system fits as universal laws.
   - **Decision gate**: If evidence is insufficient or an alternative is supported, do not escalate claims; proceed to iteration.

6. **Iteration or redesign**
   - **If supported**: Strengthen by adding orthogonal probes, expanding the parameter range, or testing generality; upgrade evidence tier only after independent replication.
   - **If partially supported**: Decompose the mechanism chain to identify the failing link; update model approximations or control for unmeasured covariates.
   - **If unsupported or negative**: Preserve the null result as a constraint; reformulate the hypothesis (e.g., change the intermediate object, coupling channel, or symmetry assumption) and redesign controls.
   - **If anomalous**: Screen for artifacts (finite-size effects, numerical instabilities, instrument response, confounding states) before inventing new physics.
   - **Stop condition**: Terminate when two consecutive iterations fail to improve identifiability, when the hypothesis becomes non-falsifiable, or when safety or compliance boundaries are reached.

## Output Format

Each invocation must produce:

1. **Research question**: One sentence defining the new problem and its significance.
2. **Gap and mechanism map**: Domain gap, candidate mechanisms, and tiered evidence.
3. **Hypothesis portfolio**: Table with hypotheses, evidence strength, key assumptions, predicted signatures, and failure modes.
4. **Minimal validation plan**: Smallest test, variables, positive/negative/strong controls, metrics, and stop conditions.
5. **Analysis plan**: Preprocessing, decomposition, feature extraction, model comparison, sensitivity analysis, and visualization strategy.
6. **Iteration plan**: Branches for supported, partial, unsupported, and anomalous outcomes.
7. **Validity and safety notes**: Confounders, reproducibility requirements, extrapolation boundaries, and non-operational safety limits.

## Validation Gates

- **Falsifiability gate**: Every hypothesis must have a defined observable condition under which it is rejected.
- **Control integrity gate**: Positive and negative controls must produce expected outcomes before the target signature is interpreted.
- **Mechanism uniqueness gate**: At least one strong control must distinguish the target mechanism from the leading alternative.
- **Identifiability gate**: Model parameters must be constrained by data; highly correlated or unbounded parameters block claim formation.
- **Reproducibility gate**: Key signatures must appear across independent samples, runs, or numerical initializations.
- **Boundary gate**: Claims must not exceed the domain of tested control variables, sample conditions, or model approximations.

## Claim Boundaries

- **Direct observation**: Only statements backed by primary data within the tested parameter window.
- **Model inference**: Statements conditioned on explicit approximations; must report parameter sensitivity and goodness-of-fit relative to alternatives.
- **Cross-system analogy**: Statements transferred from similar platforms; must be labeled as migration hypotheses requiring re-validation of symmetry, energy scales, and dissipation.
- **Exclusion**: Never state that a mechanism is "proven"; use "consistent with," "favors," or "excludes under tested conditions."

## Failure Modes

- **Hypothesis evasion**: Hypothesis formulated so vaguely that no outcome can falsify it.
- **Control mimicry**: Negative or strong control produces the target signature due to unmeasured confounders.
- **Confounding dominance**: Background, disorder, thermal effects, or instrument response explains the signal with fewer assumptions.
- **Model non-identifiability**: Multiple mechanisms produce statistically equivalent fits; additional constraints or orthogonal data are required.
- **Artifact misattribution**: Numerical instability, finite-size effect, or single-sample fluctuation is interpreted as a physical mechanism.
- **Overfitting**: Excessive model freedom relative to data features; claims collapse under cross-validation.

## Validity Checks

- **Confounders**: Enumerate and, where possible, quantify competing effects (e.g., disorder, thermal gradients, contact resistance, background states, measurement cross-talk).
- **Reproducibility**: Document sample provenance, run identifiers, model versions, parameter scan ranges, convergence criteria, and data processing scripts.
- **Statistical validity**: Report uncertainty propagation, confidence intervals, model selection criteria, and out-of-sample tests; avoid selective reporting.
- **Boundary conditions**: State approximations (e.g., low-density, coherent limit, single-particle picture, idealized boundary) and their expected failure regimes.
- **Extrapolation limits**: Restrict claims to the tested state space; flag any extension to new materials, geometries, or operating regimes as unverified.
- **Falsifiability**: Ensure each claim is paired with a specific negative prediction.

## Provenance

- Synthesized from cluster 11 / subcluster 11.0 ("quantum-topological-transport-spin-evidence-analysis-workflow").
- Source skills: `tmd-microcavity-exciton-polariton-exploration`, `vdW-ferrimagnet-proximity-research`, `nonhermitian-evanescent-wave-exploration`, `mesoscopic-superconducting-quantum-dot-research`, `high-pressure-xrd-phase-exploration`, `non-hermitian-topology-exploration`, `spin-texture-substrate-soc-research-workflow`, `defect-optics-research-workflow`.
- Method patterns extracted for reusable evidence-audit logic; no paper-specific conclusions, parameters, or operational protocols are retained.
