---
name: sci-urban-wind-seismic-boundary-layer-urban-research-de-3f7d49f5
description: End-to-end research design workflow for boundary-layer, urban, wind, seismic, and structural dynamics studies, covering hypothesis generation, controlled experimentation, multi-method validation, and iterative refinement.
scienceevolve-title: "Urban hazard resilience · wind seismic boundary layer urban research design workflow"
scienceevolve-area: urban-hazard-resilience
---

## Purpose

Help an agent translate complex environmental–structure interaction problems into verifiable, reproducible research programs. The workflow abstracts reusable method patterns—gap identification, mechanism chaining, control-based validation, and evidence grading—without embedding domain-specific conclusions, system parameters, or operational protocols.

## When to use

- When a user needs to formulate research questions or identify knowledge gaps in boundary-layer flows, urban canopy processes, wind engineering, seismic/nonlinear dynamics, ocean–atmosphere coupling, or wake/control systems.
- When designing experiments, simulations, or mixed-method studies that require strong controls, baseline comparisons, and stop conditions.
- When planning cross-method validation (e.g., numerical, experimental, observational, theoretical) and uncertainty quantification.
- When structuring iterative hypothesis refinement with explicit failure modes and convergence criteria.
- When defining evidence strength, extrapolation boundaries, and safety/ethics guardrails for research outputs.

## Inputs required

- **Target system**: Phenomenon, geometry, environment, spatial/temporal scales, and dominant physics.
- **Available resources**: Data sources, modeling tools, experimental platforms, computational budget, and observational products.
- **Research objective**: Specific response variable, mechanism, or performance gap to explain.
- **Prior evidence**: Literature, baseline methods, benchmark cases, and known limitations.
- **Constraints**: Safety boundaries, compliance requirements, data licenses, and acceptable uncertainty levels.

## Core Workflow

An ordered, end-to-end route with decision gates and iteration/stop conditions.

### 1. Define the gap and mechanism chain
- Identify the mismatch between existing methods and the target phenomenon.
- Decompose the problem into an environment → process → response causal chain.
- **Decision gate**: Is the gap falsifiable and bounded? If not, stop and refine the scope.

### 2. Generate hypotheses and grade evidence
- Formulate mechanism-driven, testable hypotheses.
- Grade evidence strength for each hypothesis: **High** (multi-source), **Medium** (single source or theory), **Low** (analogy/inference), **Speculative**.
- List key assumptions, confounders, and failure modes.
- **Decision gate**: Can the hypotheses be tested with available resources? If not, rescope or request additional inputs.

### 3. Design minimum viable validation
- Select the smallest variable set that isolates the core mechanism.
- Define:
  - **Baseline control**: standard geometry, standard method, or no-treatment case.
  - **Strong control**: identical conditions except the target variable.
  - **Positive control**: known scenario expected to produce the target response.
  - **Negative control**: scenario expected to suppress the target response.
- **Decision gate**: Can the controls distinguish mechanism from artifact? If not, redesign the matrix.

### 4. Plan multi-method validation
- Assign different methods to independent mechanism questions (e.g., flow structure, load distribution, dynamic response).
- Specify sensitivity checks for resolution, boundary conditions, and parameter perturbations.
- **Decision gate**: Are cross-method metrics aligned? If not, harmonize variables and normalization before execution.

### 5. Execute with quality monitoring
- Run experiments or simulations under version control; log configurations, seeds, and preprocessing steps.
- Verify positive control and baseline sanity before interpreting new effects.
- **Decision gate**: Do sanity checks pass? If not, halt execution and debug inputs/methods.

### 6. Analyze with mechanism diagnosis
- Compare controls; decompose responses into mean, fluctuating, and extreme components.
- Check consistency across spatial scales, temporal scales, and methods.
- Quantify uncertainty and separate numerical artifacts from physical signals.
- **Decision gate**: Do results support the mechanism chain? If ambiguous, flag for iteration rather than conclusion.

### 7. Iterate or converge
- **Supported**: Tighten claim boundaries; plan external validation or broader parameter sweep.
- **Partially supported**: Condition the hypothesis to successful sub-regimes; identify limiting factors.
- **Unsupported**: Check for confounders; propose alternative mechanisms.
- **Stop conditions**:
  - Signal is indistinguishable from noise or uncertainty.
  - Resource or safety limits reached.
  - Positive control fails repeatedly.
  - Negative control produces equivalent signal.
  - Results are highly sensitive to untested boundary conditions.

### 8. Package outputs and boundaries
- Document the evidence map, claim boundaries, and extrapolation limits.
- Archive reproducibility artifacts (data versions, code state, configuration differences).

## Output Format

Each invocation should produce:

1. **Research question**: One-sentence statement of the gap, mechanism, and boundary.
2. **Evidence map**: Layered summary of verified facts, model-consistent results, theoretical mechanisms, and new inferences.
3. **Hypothesis table**: Each row includes hypothesis statement, evidence strength, key assumptions, failure modes, and minimal validation.
4. **Experimental design**: Baseline, strong, positive, and negative controls; independent/dependent variables; stopping conditions.
5. **Analysis plan**: Data alignment, control comparison, sensitivity analysis, uncertainty quantification, and mechanism diagnosis.
6. **Iteration log**: Decision-gate outcomes, updated evidence strengths, and next-step recommendations.
7. **Boundary statement**: Applicable scales, regimes, and explicit extrapolation limits.
8. **Safety and ethics note**: Non-operational research boundaries, uncertainty disclosure, and requirements for independent professional review where applicable.

## Validation Gates

- **Gap clarity**: The research question must identify a specific mechanism, not just a performance difference.
- **Control sufficiency**: Every hypothesis must have at least one strong control and one negative control.
- **Sanity check**: Positive control and baseline must be verified before new effects are interpreted.
- **Cross-method consistency**: Mechanism direction must be consistent across at least two independent methods or diagnostic variables.
- **Uncertainty bounded**: Confidence intervals, discretization errors, or experimental variance must be reported before ranking alternatives.

## Claim Boundaries

- Claims are restricted to the tested system family, input regime, scale range, and evaluation metric.
- Single-case or single-model results may be used for hypothesis generation only; they cannot be presented as domain consensus.
- Inferences about new systems, environments, or scales must be labeled as unverified extrapolation.
- Research-design outputs must not be presented as engineering approvals, safety certifications, or operational directives.

## Failure Modes

- **Scope creep**: Hypotheses that require unavailable data or impossible controls.
- **Control leakage**: Confounding variables change simultaneously with the target variable.
- **Sanity bypass**: Interpreting results before positive/baseline checks pass.
- **Overfitting to metrics**: Optimizing a single indicator that loses mechanism interpretability.
- **False extrapolation**: Extending conclusions beyond verified spatial, temporal, or physical regimes.
- **Artifact misattribution**: Numerical errors, measurement noise, or preprocessing biases interpreted as physical signals.

## Validity Checks

- **Confounders**: Verify that background forcing, boundary conditions, geometry, material properties, and data quality are controlled or recorded.
- **Reproducibility**: Document versions, configurations, random seeds, preprocessing pipelines, and statistical methods.
- **Statistical validity**: Ensure adequate sample size, spatial/temporal coverage, confidence intervals, and avoidance of multiple-comparison bias.
- **Physical consistency**: Surface responses, fluxes, and intermediate process variables must align in direction and magnitude.
- **Method alignment**: When comparing simulation, experiment, and observation, confirm consistent variable definitions, reference states, and averaging procedures.
- **Scale separation**: Distinguish large-scale background from target-scale perturbations using explicit filtering or decomposition.

## Provenance

- Synthesized from Cluster 16 / Subcluster 16.0.
- Derived from source skills: `10.5194_egusphere-egu21-15472`, `10.1061_9780784412282`, `10.3390_su16062551`, `10.3390_app12031692`, `10.1007_s13369-021-06501-x`, `10.5194_wes-2020-70`, `10.1175_mwr-d-13-00332.1`, `10.37934_arfmts.72.2.7992`.
