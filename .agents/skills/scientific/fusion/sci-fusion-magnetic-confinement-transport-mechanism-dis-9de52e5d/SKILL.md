---
name: sci-fusion-magnetic-confinement-transport-mechanism-dis-9de52e5d
description: Use this skill when designing end-to-end research workflows to discover, discriminate, and validate candidate transport mechanisms in magnetically confined plasmas using multi-source observables, controlled comparisons, and iterative model-data reconciliation.
scienceevolve-title: "Magnetic confinement fusion · magnetic confinement transport mechanism discovery workflow"
scienceevolve-area: magnetic-confinement-fusion
---

# Purpose

This skill provides a reusable, end-to-end workflow for identifying and validating candidate mechanisms behind anomalous transport, fluctuation-driven fluxes, and confinement phenomena in magnetically confined plasmas. It abstracts a common pattern across device classes: frame a gap using observables, generate ranked mechanism hypotheses, design minimal controlled validations, analyze results through layered model-data comparison, discriminate mechanisms by exclusion, and bound claims through uncertainty auditing and iterative redesign.

# When to use

Use this skill when a user asks to:
- Propose new research questions or hypotheses about plasma transport, turbulence, edge or core confinement, transient events, or cross-scale coupling.
- Design non-operational validation studies that combine diagnostics, equilibrium information, and simulation or synthetic diagnostics.
- Compare candidate mechanisms for microturbulence, MHD activity, boundary-driven transport, or relaxation phenomena.
- Iterate from an initial mismatch toward a bounded, evidence-ranked mechanism map.

Do not use this skill for operational device control, real-time plasma operations, hazardous procedural instructions, or as a substitute for facility-specific safety review and qualified human oversight.

# Inputs required

- **Target system class**: confinement concept, geometry family, and operating regime.
- **Observable gap**: the unexplained transport, fluctuation, profile, or transient behavior that motivates the study.
- **Available diagnostics and data**: profile measurements, fluctuation spectra, imaging, spectroscopy, magnetic signals, or synthetic observables, including spatial/temporal coverage and known limitations.
- **Equilibrium and scenario context**: magnetic geometry, boundary conditions, profile gradients, rotation, composition, and uncertainty ranges.
- **Candidate mechanisms**: instability families, drive channels, saturation candidates, or cross-scale mediators to be tested.
- **Modeling and computational constraints**: applicable model classes, resolution feasibility, convergence requirements, and reproducibility needs.
- **Safety and compliance boundaries**: non-operational scope, institutional review requirements, and prohibited procedural details.

# Core Workflow

Follow the stages in order. At each decision gate, stop or redesign if the condition is not met.

## Stage 1 — Gap Identification and Observable Audit
Frame the research question around a measurable transport or fluctuation gap. Audit whether available diagnostics, equilibrium reconstructions, and metadata describe a consistent scenario. Identify weakly constrained inputs before interpretation.

- **Decision Gate 1 (Input Sufficiency)**: Proceed only if the gap is tied to at least one measurable observable and the inputs correspond to the same scenario within stated uncertainties. Otherwise, stop and request missing context.

## Stage 2 — Hypothesis Generation and Mechanism Ranking
Generate at least two falsifiable mechanism hypotheses that explain the gap. For each, state the predicted signature, key assumptions, evidence strength (e.g., speculative, low, medium, high), and likely failure modes. Rank by discriminating power and feasibility.

- **Decision Gate 2 (Discrimination Power)**: Proceed only if the leading hypotheses predict distinguishable outcomes across multiple independent observables. If all hypotheses predict the same signature, broaden the observable set or refine the question before continuing.

## Stage 3 — Minimal Viable Validation Design
Design the smallest study capable of falsifying the leading hypothesis. Specify:
- **Baseline**: best-estimate scenario with intended physics.
- **Controls**: negative controls (mechanism suppressed or absent), positive controls (known behavior, if available), ablation/stress controls (boundary or model perturbations), and numerical/convergence controls.
- **Variables**: independent drivers and dependent observables tied to predicted signatures.
- **Metrics and stop conditions**: predefined criteria for success, failure, or redesign.

- **Decision Gate 3 (Control Isolation)**: Proceed only if the design can isolate the candidate mechanism from profile co-variation, diagnostic artifacts, and geometry effects. Otherwise, redesign the control matrix.

## Stage 4 — Execution and Layered Analysis
Execute the study (diagnostic analysis, simulation, or conceptual comparison). Analyze in layers:
1. **Input consistency**: verify alignment of profiles, equilibrium, and diagnostics.
2. **Linear/mode screening**: identify dominant mode families, growth, and structure.
3. **Nonlinear/saturation assessment**: confirm quasi-stationary behavior before transport estimation.
4. **Structure/topology inference**: evaluate spatial localization, field-line topology, or cross-scale mediator response using appropriate diagnostics.
5. **Transport or event inference**: estimate fluxes, redistribution, or transient sequencing only under explicit assumptions.
6. **Model-data reconciliation**: compare through synthetic diagnostics; report residuals with uncertainty.

- **Decision Gate 4 (Quality and Coherence)**: Proceed only if data quality supports the claimed signatures, controls behave as expected, and numerical convergence is adequate. If controls fail or convergence is unresolved, stop and redesign.

## Stage 5 — Mechanism Discrimination and Exclusion
Compare observations against predictions for each hypothesis. Exclude mechanisms that fail timing, localization, spectral, or transport consistency. Upgrade or downgrade evidence strength based on multi-observable agreement and control behavior.

- **Decision Gate 5 (Exclusion Clarity)**: If one mechanism survives while alternatives are weakened, proceed to robustness auditing. If multiple mechanisms remain equally plausible, return to Stage 3 to add a sharper contrast or independent observable.

## Stage 6 — Robustness and Uncertainty Audit
Test sensitivity to profile uncertainties, diagnostic calibration, boundary conditions, preprocessing choices, and numerical parameters. Quantify uncertainty bands. Verify that the conclusion is not an artifact of a single analysis choice or dataset.

- **Decision Gate 6 (Robustness)**: Proceed only if the conclusion survives justified perturbations to assumptions and inputs. Otherwise, downgrade the claim to conditional or speculative.

## Stage 7 — Claim Bounding and Iteration Planning
Bound the conclusion by spatial region, temporal scale, regime, device class, and model validity. Document failure modes and residual risks. Plan the next iteration:
- **Sharpen**: test a more discriminating perturbation or add cross-device comparison.
- **Expand**: validate with additional diagnostics or model classes.
- **Abandon**: reject the hypothesis if evidence contradicts it or safety boundaries are reached.

- **Stop Condition**: The workflow terminates when the claim is bounded, documented, and accompanied by a clear iteration or exit plan.

# Output Format

When using this skill, produce:

1. **Research question and gap statement** — concise, observable, and regime-specific.
2. **Ranked hypothesis table** — mechanism, predicted signature, evidence strength, key assumptions, and likely failure modes.
3. **Study design** — baseline, controls, independent/dependent variables, minimal viable validation, metrics, and stop conditions.
4. **Layered analysis plan** — input audit, linear screening, nonlinear/saturation checks, topology/structure diagnostics, transport/event inference, and model-data reconciliation.
5. **Mechanism discrimination summary** — excluded and surviving hypotheses with justification.
6. **Uncertainty and robustness statement** — sensitivity tests, uncertainty bands, and downgrade triggers.
7. **Bounded claim and iteration plan** — explicit boundaries, next decisive test, or exit rationale.
8. **Validity and safety notes** — confounders, reproducibility requirements, non-operational scope, and human-oversight needs.

# Validation Gates

- **Input Sufficiency Gate**: Require a measurable gap and internally consistent scenario inputs.
- **Discrimination Power Gate**: Require distinguishable predictions across multiple observables.
- **Control Isolation Gate**: Require mechanism isolation from profile co-variation, artifacts, and geometry effects.
- **Quality and Coherence Gate**: Require acceptable data quality, control behavior, and numerical convergence.
- **Exclusion Clarity Gate**: Require that surviving mechanisms are separated from alternatives by evidence.
- **Robustness Gate**: Require survival under justified sensitivity perturbations.
- **Safety and Scope Gate**: Confirm the plan remains non-operational and within institutional safety boundaries.

# Claim Boundaries

- Do not extrapolate conclusions beyond the tested spatial region, temporal scale, equilibrium window, or device class.
- Do not present simulation-only or single-system results as universal field consensus.
- Distinguish measured, simulated, inferred, and hypothesized statements explicitly.
- Do not use workflow outputs to authorize device operation, engineering changes, or safety-critical decisions.
- Mark regime-limited conclusions when model assumptions (electrostatic, collisional, boundary, etc.) do not match the target.

# Failure Modes

- **Diagnostic artifact dominance**: a single diagnostic or preprocessing choice creates the apparent signature.
- **Profile co-variation**: changing one driver inadvertently alters gradients, rotation, or boundary conditions.
- **Insufficient control separation**: negative or stress controls produce the same signature as the active case.
- **Numerical non-convergence**: grid, time step, or sampling choices alter mechanism rankings or saturation behavior.
- **Marker or localization ambiguity**: transition layers or active regions are unresolved by available diagnostics.
- **Cross-scale misattribution**: a mediator or large-scale structure is correlated but not causal for micro-scale transport.
- **Transient-steady conflation**: transient event signatures are mistaken for sustainable equilibrium mechanisms.
- **Over-interpretation of scaling collapse**: empirical similarity is treated as validated physical mechanism.

# Validity Checks

- **Confounding**: Check whether geometry, boundary, drive, diagnostic response, or local state vary together with the target mechanism.
- **Diagnostic validity**: Confirm independent calibration, time alignment, spatial resolution, and sensitivity to predicted scales.
- **Reproducibility**: Document inputs, preprocessing, model versions, random seeds, and analysis scripts sufficiently for repetition.
- **Statistical validity**: Report uncertainty from temporal averaging, shot variability, ensemble spread, or bootstrap estimates; avoid overclaiming from single scalar comparisons.
- **Model validity**: Verify that model assumptions match the target regime; test sensitivity to missing physics.
- **Boundary conditions**: State the radial, temporal, and profile range over which claims hold; test justified perturbations.
- **Extrapolation boundary**: Label claims as validated, plausible, or speculative when moving beyond the source regime or device class.
- **Consensus boundary**: Separate paper-supported patterns from agent-inferred hypotheses.

# Provenance

- Derived from cluster `7.2` (observable-driven mechanism discovery and validation).
- Synthesized from source skills: `10.1088_1741-4326_acc344`, `10.1103_physrevlett.82.3621`, `10.1063_1.1335585`, `10.1063_1.860021`, `10.1088_0029-5515_40_11_306`, `10.1088_0029-5515_31_8_004`, `10.1088_1741-4326_ab9be7`, `10.1088_0741-3335_59_1_014027`.
