---
name: sci-fiber-composite-polymer-mechanism-discovery-workflo-0c2bd9fb
description: A reusable end-to-end workflow for generating falsifiable mechanistic hypotheses, designing minimal multiscale validation studies, and iterating model-simulation-experiment loops in composite, polymer, and fiber material systems without prescribing operational protocols.
scienceevolve-title: "Fiber composites and battery materials · composite polymer mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Generate transferable research plans that connect microstructural or molecular mechanisms to macroscopic observables in heterogeneous material systems. The workflow helps an agent propose falsifiable hypotheses, design minimal validation studies with strong controls, compare model or surrogate variants, and bound claims—without reproducing paper-specific conclusions or prescribing operational protocols.

# When to use

Use this skill when the user asks for research design, hypothesis generation, or validation planning for composite, polymer, fiber-reinforced, or soft-matter systems where mechanism identification requires linking scales via modeling, simulation, or machine learning. It applies to problems involving multiscale bridging, reduced-order or surrogate modeling, coarse-grained representations, and model discrimination.

Do not use this skill to produce operational manufacturing recipes, safety-critical certification, directly executable simulation inputs, or hazardous procedural details.

# Inputs required

Before proposing a detailed study, ask for or infer the following:

- Target material system, architecture class, and length scales of interest.
- Observable macroscopic response(s) and hidden micro-scale variables or mechanisms of interest.
- Available evidence: experiments, simulations, imaging, literature data, or benchmark models.
- Candidate model, surrogate, or multiscale framework.
- Known constraints on cost, safety, data access, reproducibility, and interpretability.
- Intended generalization boundary and validation budget.

If any input is missing, state assumptions explicitly and mark conclusions as provisional.

# Core Workflow

1. **Frame the predictive gap**
   - Isolate one controllable event or property mismatch linking structure or process to material response.
   - Identify whether the limitation arises from missing physics, unresolved scale separation, unrepresented heterogeneity, or untested boundary conditions.
   - *Stop gate*: If the gap cannot be expressed as a falsifiable prediction about a specific mechanism, reformulate before proceeding.

2. **Generate competing mechanism-linked hypotheses**
   - Produce at least two candidate hypotheses that propose distinct physical pathways.
   - For each hypothesis record: claim, mechanism, required model representation, key assumptions, evidence strength (validated / partially supported / inferred / speculative), likely failure modes, and extrapolation boundary.
   - *Decision gate*: Prioritize hypotheses that are falsifiable with a minimal validation ladder; discard those that merely transplant a single study’s settings.

3. **Design minimal viable validation**
   - Define scientific variables (material, geometry, interface, environment), model variables (discretization, constitutive law, mapping, coordinate choice), and validation variables (global response, local indicator, convergence, cost).
   - Specify: baseline case, positive control (mechanism should be strong), negative control (mechanism should be weak or absent), strong contrast (one scientific variable changed), sensitivity cases (one scientific, one numerical), and held-out case for generalization.
   - *Stop gate*: If controls are missing or the primary measurable response is undefined, pause until inputs are complete.

4. **Build the multiscale model or surrogate bridge**
   - Select the simplest representation that can capture the hypothesized mechanism (e.g., representative volume element, coarse-grained model, reduced-order surrogate).
   - Calibrate using orthogonal evidence; keep calibration observables separate from validation observables.
   - Verify numerical stability: convergence checks, size and boundary-condition sensitivity, mesh or mapping robustness, and realization-to-realization variability.
   - *Decision gate*: If the baseline model fails verification or only reproduces calibration data, revise the representation before interpreting trends.

5. **Execute staged model comparison**
   - Stage 1: Screen broad behavior against a simple physics-informed baseline or local theory.
   - Stage 2: Advance only candidates that pass Stage 1 to discriminating tests on independent observables, regime changes, or alternative coordinates.
   - Compare complex and baseline models using the same uncertainty framework; evaluate by observable class (thermodynamic, structural, global response, local mechanism indicator).
   - *Stop gate*: If the complex model does not outperform the simpler baseline on independent observables, reject or narrow the added mechanism.

6. **Analyze with mechanism discrimination**
   - Follow this order: (a) validation integrity (match primary measurable response), (b) trend consistency across scientific variables, (c) mechanism discrimination (distinguish competing pathways), (d) numerical robustness (sensitivity to model settings), (e) boundary check (geometry, loading, scale limits).
   - Label every claim as validated, partially supported, inferred, or speculative.
   - *Decision gate*: Do not interpret local fields or mechanism details if primary validation fails or the model is unstable under reasonable numerical changes.

7. **Iterate or redesign**
   - If primary validation fails → revise geometry, boundary, constitutive, or measurement assumptions before interpreting mechanisms.
   - If global response matches but local mechanisms are implausible → revise the damage, interface, or internal-state representation.
   - If results change mainly with numerical settings → prioritize convergence, stabilization, and artifact checks.
   - If one variable changes mechanism → test whether the transition is monotonic, thresholded, or interaction-driven.
   - If a contrast case behaves like the control → revise the mechanism rather than assuming irrelevance.
   - If data are insufficient → defer strong claims and propose the smallest additional measurement or simulation to reduce uncertainty.
   - *Stop condition*: Halt when uncertainty dominates the claimed effect, when controls contradict the mechanism, or when safety or compliance requirements are unmet.

8. **Bound claims and define transfer limits**
   - State the domain of validity: material family, architecture, loading regime, deformation range, and scale.
   - Separate paper-derived method logic, user-provided facts, new hypotheses, and speculative extensions.
   - Document which conclusions are reproducible across independent realizations, datasets, or model formulations.

# Output Format

When using this skill, produce:

1. **Research question framing**: problem, event, target system, and intended boundary.
2. **Evidence map**: established evidence, plausible mechanism, and speculative inference, clearly separated.
3. **Candidate hypotheses table**: claim, mechanism, model requirement, evidence strength, key assumptions, failure modes, and extrapolation boundary.
4. **Minimal validation design**: baseline, positive control, negative control, strong contrast, sensitivity cases, held-out case, and stop conditions.
5. **Metrics and analysis plan**: primary response, local indicators, robustness checks, decision rules, and evidence-labeling scheme.
6. **Iteration plan**: how results update or reject each hypothesis, with explicit decision gates.
7. **Validity and safety notes**: confounders, reproducibility requirements, non-transferable assumptions, and non-operational safety boundaries.

# Validation Gates

- **Input completeness**: All required inputs are provided or explicitly assumed and marked provisional.
- **Hypothesis falsifiability**: Every hypothesis has a defined observation that would weaken or reject it.
- **Control adequacy**: Baseline, positive, negative, and contrast controls are specified before execution.
- **Model verification**: Convergence, stability, and boundary-condition checks are satisfied for the chosen representation.
- **Independent validation**: Primary observables are matched against data not used for calibration or training.
- **Mechanism discrimination**: The model distinguishes competing pathways beyond global-response agreement.
- **Numerical robustness**: Conclusions survive reasonable changes in discretization, mapping, stabilization, or boundary treatment.

# Claim Boundaries

- **Validated**: Supported by independent tests, multiple benchmarks, and sensitivity checks.
- **Partially supported**: Consistent with one controlled study or model family, with documented assumptions.
- **Inferred**: Follows from theory or analogy but lacks direct validation for the target system.
- **Speculative**: Depends on unverified material, boundary, or scale assumptions; requires further testing.
- Do not treat single-study trends as field-wide consensus. Distinguish paper-derived logic from agent-generated inferences.

# Failure Modes

- **Confounding**: Geometry, boundary conditions, processing history, or loading protocol co-vary with the target mechanism.
- **Overfitting / data leakage**: Derived variables, duplicate samples, or calibration data contaminate validation; complex models outperform baselines only on training-like data.
- **Boundary artifacts**: Apparent scale effects or local mechanisms arise from boundary conditions, contact treatment, or finite-size effects rather than physics.
- **Missing physics**: The model omits a mechanism (interface, damage, nonlinearity, rate dependence) that dominates the real response.
- **Numerical instability**: Discretization, mapping, solver tolerance, or coarse-graining artifacts drive observed trends.
- **Ill-posed problem**: Inconsistent kinematics, equilibrium, or constitutive boundary conditions invalidate the model.
- **Insufficient validation data**: Held-out cases, replicate variability, or uncertainty estimates are inadequate to support the claimed trend.

# Validity Checks

Before finalizing any research plan or claim, verify:

- **Confounding factors**: Scientific variables are separated from numerical settings and processing variability.
- **Reproducibility**: Inputs, outputs, model definitions, data splits, random seeds, and post-processing steps are documented.
- **Statistical or uncertainty validity**: Variability, scatter, confidence intervals, and held-out performance are considered before claiming trends.
- **Boundary conditions**: The plan states where the method should not be extrapolated.
- **Numerical artifacts**: Erosion, self-healing, clumping, mesh bias, unstable contact, artificial smoothing, or mapping artifacts are explicitly checked.
- **Evidence separation**: Paper-derived patterns, user facts, new hypotheses, and speculative extensions are labeled.
- **Consensus discipline**: The source skills are treated as evidence for a reusable method, not as proof of universal domain truth.

# Provenance

Synthesized from cluster **41.0** (machine-learning-assisted mechanism discovery and validation). Representative source skills: `brittle-composite-machining-research-pattern`, `composite-microstructure-property-ml-workflow`, `thermoresponsive-polymer-cg-modeling`, `scale-effect-structural-model-exploration`, `frp-confined-concrete-cyclic-modeling-research`, `fiber-rubber-mesoscale-modeling-workflow`, `composite-compressive-failure-exploration`, `soft-matter-coarse-grained-research-design`.
