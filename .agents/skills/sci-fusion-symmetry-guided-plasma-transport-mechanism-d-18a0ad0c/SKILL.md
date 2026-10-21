---
name: sci-fusion-symmetry-guided-plasma-transport-mechanism-d-18a0ad0c
description: A reusable end-to-end workflow for discovering and validating symmetry- or topology-guided transport, stability, and confinement mechanisms in magnetic-confinement plasma research through hypothesis generation, controlled comparison, and iterative mechanism discrimination.
scienceevolve-title: "Magnetic confinement fusion · symmetry guided plasma transport mechanism discovery workflow"
scienceevolve-area: magnetic-confinement-fusion
---

# Purpose

Guide agents to formulate, test, and iterate mechanism-driven research questions in magnetic-confinement plasma systems. The workflow emphasizes identifying confinement bottlenecks, generating symmetry- or invariant-based hypotheses, designing controlled validation studies, and bounding claims through multi-objective checks and robustness analysis.

# When to use

Use when the user needs to:

- Propose new research questions linking magnetic geometry, symmetry, or topology to transport, stability, or confinement.
- Design simulation or experimental studies to discriminate competing mechanisms (e.g., neoclassical vs. turbulent, topology-driven vs. flow-driven).
- Validate whether a reduced metric or optimized configuration actually captures the intended physics mechanism.
- Iterate on hypotheses after initial results, including handling trade-offs, residual channels, and model–measurement tension.

Do not use for operational device control, real-time actuation, or prescribing executable hardware settings.

# Inputs required

Before executing the workflow, collect or infer:

- Target confinement concept and regime, stated without assuming direct transfer from prior devices.
- Performance bottleneck or confinement anomaly to explain.
- Candidate design levers: symmetry class, boundary shape, field period, coil topology, rotational transform, profile assumptions, or auxiliary control.
- Available diagnostics, simulation tools, or theoretical models and their validity ranges.
- Baseline configuration or comparison family.
- Constraints: computational budget, diagnostic access, feasibility boundaries, safety review limits, and whether outputs must remain conceptual.

# Core Workflow

1. **Bottleneck & Gap Definition**
   - Define the confinement or performance gap from observables. Identify the mismatch among transport, stability, energetic-particle confinement, rotation, or engineering flexibility.
   - **Gate:** If the bottleneck cannot be expressed in measurable terms or lacks a plausible geometric link, stop and refine the question.

2. **Mechanism Framing & Hypothesis Generation**
   - Reframe strict symmetry or design rules into the physical invariant, action, or topology they protect.
   - Generate at least three hypotheses: target mechanism, alternative mechanism, relaxed-invariant or approximation-robustness, and residual-channel hypotheses.
   - For each, state the causal chain (design change → mechanism → observable), evidence strength, key assumptions, failure modes, and falsification criteria.
   - **Gate:** If hypotheses are not falsifiable or lack discriminating observables, return to Step 1.

3. **Study Design & Control Matrix**
   - Define independent variables (geometry, profile, drive scenario) and dependent variables (transport, stability, confinement metrics).
   - Establish controls: baseline, negative (mechanism suppressed), positive (known signature), strong (matched pair differing mainly in target mechanism), reduced-control (without proposed feature), and approximation controls.
   - Define minimum viable validation: same pipeline for all cases, at least one metric per essential physics domain, and robustness across at least two profile or assumption variants.
   - Define stop conditions before execution: inconsistent diagnostics, unresolved confounding, or safety/feasibility violation.
   - **Gate:** If controls are inseparable or the mechanism proxy cannot be computed independently, stop and redesign.

4. **Execution & Data Integrity**
   - Confirm configuration identity, normalization, coordinate conventions, and diagnostic definitions.
   - Preprocess data with calibration, uncertainty propagation, and geometry mapping onto consistent magnetic coordinates.
   - **Gate:** If data quality, coordinate validity, or calibration traceability fails, halt for remediation.

5. **Mechanism Isolation & Analysis**
   - Compare candidate against baseline and reduced controls to attribute effects to the intended mechanism rather than incidental changes.
   - Perform trade-off analysis and sensitivity analysis (profile, current, collisionality, boundary).
   - Check for residual channels: if the target mechanism is suppressed, verify whether another instability or loss path dominates.
   - Use multiple independent diagnostics per claim; separate raw observables from inferred quantities.
   - **Decision:** If reduced controls perform similarly, simplify or reject the mechanism hypothesis and return to Step 2. If robustness checks reverse the result, prioritize sensitivity analysis before claiming success.

6. **Model–Measurement Benchmarking**
   - Compare experiment or simulation with theory using common state variables and uncertainty envelopes.
   - Benchmark against analytic limits or trusted codes in simplified geometry before interpreting realistic cases.
   - Distinguish agreement due to shared assumptions from independent validation.
   - **Gate:** If theory and observation disagree outside model validity, formulate missing-physics or invalid-assumption hypotheses and return to Step 2 or 3.

7. **Evidence Synthesis & Claim Bounding**
   - Classify each hypothesis as supported, partially supported, rejected, or unresolved.
   - Label every conclusion as paper-supported, newly observed, inferred, or outside validated scope.
   - Bound claims by tested symmetry class, aspect ratio, field period, profile set, and regime.
   - **Gate:** If only one metric improves while others degrade, do not claim overall success; document the trade-off and iterate.

8. **Iteration or Redesign**
   - If supported: propose the next higher-value question (broader family, different symmetry target, profile-dependent stability).
   - If partially supported: revise the hypothesis (add residual-channel metric, refine approximation, narrow regime).
   - If rejected: document the failure mode as a constraint and generate a competing hypothesis.
   - If inconclusive: identify whether the limitation is numerical, diagnostic, statistical, or conceptual, and design the next minimal discriminating test.
   - **Stop condition:** Terminate when the hypothesis is robustly bounded, clearly rejected, or when further validation exceeds safety or feasibility limits.

# Output Format

Return the following structure:

1. **Research Question** — Bottleneck, target mechanism, and intended contribution.
2. **Mechanism Map** — Strict rule, protected invariant, relaxed condition, proxy metric, and downstream outcome.
3. **Ranked Hypotheses** — Table with claim, evidence strength, assumptions, failure modes, falsification criteria, and provenance label (paper-supported / inferred / speculative).
4. **Study Plan** — Independent variables, dependent variables, control matrix, minimum viable validation, and stop conditions.
5. **Analysis Plan** — Diagnostics, sensitivity checks, mechanism-isolation logic, visualization strategy, and decision rules.
6. **Validation Summary** — Confounding checks, model validity, reproducibility requirements, and boundary conditions.
7. **Iteration Path** — Conditions to strengthen, revise, split, suspend, reject, or stop.
8. **Safety & Ethics Notes** — Non-operational boundaries, review requirements, and extrapolation limits.

# Validation Gates

- **Confounding Gate:** Compared configurations use consistent normalization, coordinates, profiles, and diagnostic definitions.
- **Baseline Gate:** Comparison is against a relevant, recent baseline family, not only weak or outdated references.
- **Multi-objective Gate:** Success requires independent improvement or acceptable trade-off across all essential metrics; single-metric claims are blocked.
- **Control Separation Gate:** Positive, negative, and strong controls must isolate the proposed mechanism from incidental geometry changes.
- **Robustness Gate:** Results must survive at least two plausible profile, current, or scenario variations.
- **Model Validity Gate:** Distinguish neoclassical, MHD, orbit, rotation, and turbulence models; prevent one model from compensating for missing physics in another.
- **Reproducibility Gate:** Document input files, code versions, random seeds, mesh and resolution choices, and post-processing scripts.

# Claim Boundaries

- Do not treat one optimized configuration as a field-wide consensus or as transferable to all stellarator or tokamak-like concepts.
- Do not claim causality from correlation alone; require timing, spatial alignment, independent diagnostics, and model consistency.
- Distinguish linear-indicator improvement from nonlinear transport proof.
- Treat bootstrap-current and anomalous-transport predictions as scenario-dependent unless supported by transport-consistent modeling or measurements.
- Extrapolations to new regimes require explicit validity arguments.

# Failure Modes

- **Trade-off Dominance:** Improvement in one metric degrades another essential metric, invalidating overall success.
- **Residual Channel Dominance:** Suppressing the target instability exposes a subdominant mode that sets transport.
- **Control Failure:** Reduced-control variants perform similarly, indicating the proposed mechanism is unnecessary or incorrectly attributed.
- **Robustness Reversal:** Results reverse under minimal profile or scenario changes.
- **Approximation Breakdown:** Exact construct works but practical smooth approximation fails, violating feasibility.
- **Diagnostic Inconsistency:** Independent diagnostics disagree beyond uncertainty, preventing causal inference.
- **Model Misattribution:** Theory agrees with data for the wrong reason (shared assumptions, compensating errors).
- **Numerical Artifact:** Trend is caused by sampling, resolution, boundary handling, or integrator error rather than physics.

# Validity Checks

- **Mechanism Specificity:** Confirm the explanation depends on the intended invariant, topology, or symmetry mechanism rather than generic geometry changes.
- **Coordinate Validity:** Verify chosen magnetic coordinates exist and remain meaningful for the target system.
- **Representation Validity:** Distinguish true geometry from truncation, interpolation, or angle-choice artifacts.
- **Limiting-case Coverage:** Analyze failure-prone endpoint regimes before extrapolating to intermediate cases.
- **Statistical & Numerical Adequacy:** Report uncertainty, convergence, resolution, and repeated or independent cases.
- **External Validity:** State tested symmetry class, aspect-ratio range, field-period family, profile set, current scenario, and engineering constraints.
- **Safety & Compliance:** Ensure proposed work remains within approved non-operational research boundaries.

# Provenance

- Synthesized from cluster 6 / subcluster 6.1: symmetry-guided mechanism discovery and validation.
- Source skills referenced: `magnetic-fusion-configuration-research-exploration`, `rfp-topology-transport-barrier-research`, `stellarator-omnigenity-research-pattern`, `plasma-flow-incompressibility-research-design`, `stellarator-bootstrap-current-exploration`, `stellarator-turbulence-optimization-research-skill`, `plasma-turbulence-structure-transport-research`, `stellarator-transport-monte-carlo-workflow`.
- Methodological patterns derived from reviewed magnetic-confinement plasma literature; no paper-specific parameters, numerical results, or operational protocols are included.
