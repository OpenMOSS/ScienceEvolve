---
name: sci-fusion-symmetry-guided-confinement-mechanism-discov-f2ea4740
description: Use this skill when designing end-to-end research workflows to discover, discriminate, and validate physical mechanisms in optimized magnetic-confinement configurations through symmetry-aware hypothesis generation, controlled simulation, and iterative claim bounding.
scienceevolve-title: "Magnetic confinement fusion · symmetry guided confinement mechanism discovery workflow"
scienceevolve-area: magnetic-confinement-fusion
---

# Purpose

This skill provides a reusable end-to-end workflow for turning an optimized magnetic-confinement research problem into a structured program of mechanism discovery and validation. It guides an agent to frame gap-driven questions, generate falsifiable hypotheses about symmetry-preservation or feedback-coupling mechanisms, design controlled studies with explicit decision gates, analyze results through intermediate diagnostics, and iterate based on failure signatures—without copying source-specific parameter sets, geometries, or numerical thresholds, and without treating any single study as field-wide consensus.

# When to use

Use this skill when the user asks to:

- Propose new research questions or hypotheses for stellarator, tokamak, or related magnetic-confinement systems.
- Design simulation-based validation studies for equilibrium optimization, fast-ion confinement, wave heating, current drive, or transport mechanisms.
- Compare candidate architectures, representations, or design concepts under common boundaries.
- Discriminate among competing physical mechanisms using controlled baselines and perturbations.
- Plan iterative redesign or refinement loops for configuration optimization or concept screening.
- Generate analysis plans, iteration roadmaps, or claim-boundary statements for multi-objective confinement studies.

Do not use this skill for operational authorization, safety-case approval, deployment design, or executable high-risk procedural instructions.

# Inputs required

Before executing the workflow, obtain or infer:

- **Target system class**: configuration family, symmetry class, and relevant geometric or magnetic constraints.
- **Intended invariant or objective**: the symmetry, performance proxy, or design goal to be preserved or tested.
- **Dominant feedback or perturbation**: the physical effect most likely to break the invariant (e.g., self-consistent currents, pressure variation, boundary changes, collisional effects).
- **Available baselines and references**: existing optimized configurations, simplified models, literature benchmarks, or validated solvers.
- **Candidate diagnostics**: equilibrium, transport, stability, energetic-particle, heating, or engineering metrics available for comparison.
- **Constraints**: computational limits, model-fidelity boundaries, engineering feasibility bounds, and institutional safety-review requirements.
- **Inherited assumptions**: prior results or scaling laws that are being reused but not revalidated in the current study.

If inputs are missing, state assumptions explicitly and mark downstream conclusions as provisional.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

1. **Frame the mechanism question**
   - Define the target invariant in measurable terms.
   - Identify the dominant feedback, perturbation, or coupling that threatens it.
   - Convert the user’s broad goal into a specific, testable mechanism question.
   - *Decision gate*: Is the question scoped to a single causal pathway? If not, decompose or stop.

2. **Generate mechanistic hypotheses**
   - Inherit reusable principles (e.g., symmetry preservation, feedback coupling, transport-proxy evaluation), not source-specific parameter sets or geometries.
   - State each hypothesis conditionally: “If the configuration preserves [invariant], then including [perturbation] should cause bounded changes in [diagnostic A] and [diagnostic B], while [performance proxy] remains favorable relative to [reference].”
   - Assign evidence strength: **strong**, **moderate**, **weak**, or **speculative**.
   - List key assumptions and at least two likely failure modes per hypothesis.
   - *Decision gate*: Are all hypotheses falsifiable with the stated tools and constraints? If not, reformulate.

3. **Design minimum viable validation study**
   - Define cases:
     - **Baseline**: intended configuration without the dominant perturbation.
     - **Perturbed**: same configuration with the dominant feedback or perturbation included.
     - **Reference**: relevant prior or alternative configuration for context only.
     - **Positive control**: a known favorable case that should recover expected behavior.
     - **Negative control**: a symmetry-broken or degraded case that should suppress the target mechanism.
     - **Stress case**: an adverse operating condition that tests robustness.
   - Specify independent, controlled, and dependent variables.
   - Select one primary metric and multiple secondary metrics tied to the mechanism.
   - Set stop conditions: symmetry loss, performance degradation, stability or engineering constraint violation, unsupported assumption sensitivity, missing essential control, or non-convergence.
   - *Decision gate*: Do controls isolate the intended mechanism from confounders? If not, redesign.

4. **Stage the investigation**
   - **Screening stage**: run broad, lower-fidelity scans across plausible contributors to identify dominant mechanisms.
   - **Focus stage**: run higher-fidelity cases only on the dominant mechanism justified by contribution and sensitivity.
   - **Validation stage**: compare reduced-order and higher-fidelity models for representative cases; cross-check with independent solvers, benchmarks, or analytic limits when available.
   - *Decision gate*: Did screening converge and clearly rank contributors? If rankings are unstable under plausible assumption changes, add sensitivity controls before focusing.

5. **Analyze through the mechanism map**
   - Verify accounting and conservation balances before interpreting outcomes.
   - Confirm that baseline and perturbed cases use identical diagnostic definitions and normalization.
   - Compare intermediate variables, not only final aggregate metrics.
   - Separate prompt effects from delayed or secondary effects.
   - Test sensitivity to profile assumptions, boundary conditions, numerical resolution, and model form.
   - Identify untested layers (stability, turbulence, edge physics, engineering implementation) and label each conclusion by evidence strength.
   - *Decision gate*: Do observed differences exceed numerical noise and confounding variation? If not, classify as ambiguous.

6. **Iterate or terminate**
   - **If the hypothesis survives**: strengthen the claim, narrow its scope, and propose robustness tests or downstream coupling checks.
   - **If the hypothesis weakens**: locate the weakest validation layer (physics model, numerical convergence, missing control, engineering feasibility, or extrapolation) and choose the next intervention:
     - Retune the configuration or objective.
     - Add stability, transport, or engineering analysis before claiming viability.
     - Run targeted sensitivity studies.
   - **If the hypothesis fails**: preserve the failure mode as a boundary condition, reframe the research question, or stop.
   - *Decision gate*: Is the evidence sufficient for the intended claim strength (scoping, comparative, or validation-ready)? If not, return to step 2 or 3.

7. **Bound and package claims**
   - Limit conclusions to the tested configuration space and model fidelity.
   - Explicitly state what remains untested and what must not be inferred.
   - Ensure no operational prescriptions, executable high-risk parameters, or unsafe procedural details are included.
   - *Decision gate*: Are claims free of source-specific numerical results and universal consensus language? If not, redact.

# Output Format

When using this skill, return:

1. **Research question** — One concise, mechanism-focused question framed around an invariant, perturbation, and constraint.
2. **Hypothesis portfolio** — Ranked hypotheses with evidence strength, key assumptions, likely failure modes, and minimal tests.
3. **Study design** — Cases, variables, controls, metrics, staged plan, and stop conditions.
4. **Analysis plan** — Ordered checks for conservation, comparability, mechanism isolation, sensitivity, and uncertainty.
5. **Iteration roadmap** — Update rules for hypothesis status under each plausible outcome.
6. **Validity and boundary statement** — Supported scope, untested layers, claim limits, and safety guardrails.

# Validation Gates

Before advancing between workflow stages, confirm:

- The target invariant is physically meaningful and measurable.
- Hypotheses are conditional, falsifiable, and distinguish mechanism from correlation.
- Controls (positive, negative, baseline, reference, stress) are defined and capable of isolating the proposed mechanism.
- All cases share identical boundary conditions, diagnostic definitions, and accounting rules unless the variable under test is intentionally varied.
- Numerical convergence, conservation, and reproducibility criteria are documented.
- Engineering, stability, and safety constraints are visible before extrapolation.
- Source-specific parameters, geometries, and numerical thresholds have not been copied into the reusable design.

# Claim Boundaries

Do not:

- Present a single study, solver result, or paper finding as field-wide consensus.
- Infer operational readiness, buildability, or safety from simulation or scoping studies alone.
- Extrapolate beyond the tested configuration family, symmetry class, or model-fidelity regime.
- Treat a performance proxy as causal proof of the underlying mechanism without intermediate diagnostic support.
- Provide executable operational steps, high-risk parameters, or hazardous procedural instructions.

# Failure Modes

Common ways this workflow fails or degrades:

- **Hypothesis overreach**: The claim is too broad to be falsified by the proposed study.
- **Confounded controls**: Baseline and perturbed cases differ in unintended variables (profiles, normalization, initialization, or boundary treatment).
- **Numerical non-convergence**: Sampling, mesh, or solver settings are insufficient for the claimed metric.
- **Assumption dominance**: Results reverse when a single inherited assumption is varied.
- **Proxy mismatch**: The chosen metric correlates with performance but is not causally linked to the target mechanism.
- **Optimization artifacts**: Apparent improvements stem from representation changes, coordinate artifacts, or constraint violations rather than physical mechanism gains.
- **Boundary overreach**: Conclusions about core physics are extended to edge, wall-load, or engineering domains that were excluded from the model.

# Validity Checks

Before finalizing any output, verify:

- **Invariance**: The target property is defined independently of arbitrary gauge, scaling, or normalization choices.
- **Causality**: The performance proxy is linked to the mechanism through intermediate diagnostics, not only aggregate correlation.
- **Comparability**: All candidates or cases are evaluated under common boundaries and equivalent assumptions.
- **Reference fairness**: The reference case is mission-equivalent and appropriate for the claim being made.
- **Assumption labeling**: Inherited assumptions are marked and not treated as new evidence.
- **Convergence**: Numerical settings, resolution, and diagnostic definitions are documented and checked.
- **Constraint coupling**: Improving one metric does not silently worsen another untested bottleneck.
- **Extrapolation boundary**: Claims are explicitly limited to the tested design space, and untested layers are listed.

# Provenance

Synthesized from cluster 14.0 (symmetry-guided mechanism discovery and validation). Source skills: `qa-stellarator-exploration`, `fusion-power-conversion-research-pattern`, `stellarator-fast-ion-research-workflow`, `high-field-fusion-concept-exploration`, `stellarator-mhd-equilibrium-design-research`, `topology-guided-pde-shape-optimization`, `stellarator-parametric-design-exploration`, `stellarator-ecrh-research-design`.
