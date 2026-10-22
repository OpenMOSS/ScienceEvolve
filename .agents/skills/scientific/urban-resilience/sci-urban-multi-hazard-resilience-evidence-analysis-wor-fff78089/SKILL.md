---
name: sci-urban-multi-hazard-resilience-evidence-analysis-wor-fff78089
description: Reusable end-to-end workflow for designing research questions, structuring evidence, and auditing claims about engineered-system resilience under natural hazards.
scienceevolve-title: "Urban hazard resilience · multi hazard resilience evidence analysis workflow"
scienceevolve-area: urban-hazard-resilience
---

# Purpose

Guide agents to design reproducible, validation-oriented research plans that connect hazard inputs, system mechanisms, and resilience claims through staged evidence analysis and explicit claim auditing. The workflow transfers a benchmark-based, assumption-stress-testing pattern across natural-hazard domains without embedding paper-specific parameters, numerical results, or domain consensus.

# When to use

Use this skill when:
- Proposing research questions for seismic, wind, flood, or multi-hazard resilience assessment of buildings, infrastructure, or urban systems.
- Designing benchmark experiments to compare assessment frameworks, model assumptions, or intervention alternatives.
- Adapting fragility, consequence, or recovery relationships to a new local context.
- Analyzing infrastructure interdependencies, service continuity, or cascading failure under extreme events.
- Auditing whether a simulation, statistical, or hybrid claim is supported by the evidence structure.

Do not use this skill for operational emergency response, real-time safety certification, field inspection instructions, construction recipes, or direct design approval.

# Inputs required

Before producing a research plan, identify or request:
- **Target system**: structural system, network, district, or asset class and its boundary conditions.
- **Hazard context**: hazard type, intensity measure family, scenario range, and spatial/temporal variability.
- **Decision gap**: the specific claim, comparison, or calibration question the study must answer.
- **Available evidence layers**: exposure, asset inventory, dependencies, historical observations, simulations, or test data.
- **Candidate models or interventions**: baseline assessment, alternative model, retrofit family, or policy option.
- **Validation assets**: independent benchmarks, withheld observations, cross-validation strategy, or expert-elicited bounds.
- **Constraints**: data-access limits, safety and ethics boundaries, computational budget, and review requirements.

# Core Workflow

Execute the following stages in order. Do not skip a validation gate.

**Stage 1 – Frame the decision gap**
- Define one clear research question and the decision it must inform.
- Identify the conventional assumption or evidence gap being challenged.
- State the validity envelope: system class, hazard regime, spatial scale, and temporal horizon.
- *Gate 1*: Stop if the question is not falsifiable or cannot be bounded to a testable mechanism.

**Stage 2 – Map system layers and mechanisms**
- Decompose the system into layers: exposure, assets, dependencies, functional performance, consequences, and recovery.
- Identify candidate mechanisms linking hazard to outcome (e.g., direct damage, dependency failure, service bottleneck).
- Flag interdependencies that may produce indirect or cascading effects.
- *Gate 2*: Redesign if the mechanism cannot be isolated from confounding variables.

**Stage 3 – Generate labeled hypotheses**
- Formulate a testable hypothesis for each candidate mechanism.
- Label each hypothesis with: evidence strength (strong / moderate / weak / speculative), key assumptions, expected discriminating signal, and likely failure modes.
- Prioritize minimal viable hypotheses that change one assumption at a time.
- *Gate 3*: Stop if a hypothesis requires many unverified assumptions before the first validation step.

**Stage 4 – Design minimal viable validation**
- Define a baseline case (conventional approach or as-built condition) and an alternative case that isolates the challenged assumption.
- Specify controls:
  - **Baseline control**: current practice or unmodified system.
  - **Negative control**: a condition where the proposed mechanism should not materially change outcomes.
  - **Positive control**: a condition where the mechanism should produce an expected, detectable signal.
  - **Independent validation control**: external benchmark or withheld data not used for calibration.
- Define independent, mediating, dependent, and moderating variables.
- Define evaluation metrics and pre-registered stopping conditions.
- *Gate 4*: Redesign if baseline and alternative differ in more than the intended mechanism.

**Stage 5 – Assemble evidence layers and calibrate modules**
- Build data and model layers aligned with Stage 2.
- Calibrate component or subsystem behavior against independent evidence; preserve variability.
- Document excluded data, silent assumptions, and default values.
- *Gate 5*: Halt if input generation fails validity checks or calibration data are insufficient for the intended claim.

**Stage 6 – Execute staged validation**
- Validate in sequence: inputs → response → component → system → outcome/recovery.
- At each step, check physical plausibility, monotonicity, probability bounds, numerical stability, and reproducibility.
- Compare baseline and disturbed states; separate direct physical damage from indirect service loss.
- *Gate 6*: Do not proceed to system-level or resilience claims if any module fails its validation check.

**Stage 7 – Analyze with uncertainty propagation**
- Separate aleatory variability from epistemic uncertainty and propagate both to final metrics.
- Identify which uncertainty source dominates the decision.
- Use ablation or component-isolation to attribute changes to the hypothesized mechanism.
- Classify each conclusion as verified, supported, plausible, exploratory, or unsupported.

**Stage 8 – Audit claims and bound conclusions**
- Compare results against all controls; flag assumption-driven artifacts.
- Bound claims by scenario, data resolution, system type, hazard regime, and governance context.
- Explicitly separate source-supported methodology from new-system inference.
- Report cases where an intervention does not improve outcomes or where uncertainty prevents ranking.

**Stage 9 – Iterate or stop**
- Update hypotheses: strengthen if the effect persists across controls; narrow if conditional; discard if explained by artifacts.
- If uncertainty dominates, prioritize data collection or sensitivity analysis over added model complexity.
- *Stop conditions*:
  - Added layers do not change the target decision output.
  - Validation fails at any module.
  - Conclusions depend on unsupported dependence or extrapolation assumptions.
  - Further work would mainly add unsupported detail rather than reduce decision-relevant uncertainty.

# Output Format

Return the research plan in this structure:
1. **Research question** – One bounded question and its validity envelope.
2. **Evidence map** – Available evidence, missing evidence, and confidence levels by layer.
3. **Hypothesis portfolio** – Table with hypothesis, mechanism, evidence strength, key assumptions, expected signal, likely failure mode, and minimal validation.
4. **Experimental design** – Baseline, alternative, controls, variables, metrics, and stopping conditions.
5. **Analysis plan** – Staged validation sequence, uncertainty treatment, mechanism diagnosis, and visualization strategy.
6. **Iteration rules** – How results will update, narrow, replace, or stop each hypothesis.
7. **Validity and boundary statement** – Confounders, reproducibility requirements, extrapolation limits, and expert-review needs.
8. **Confidence labeling** – Clear separation of verified, inferred, and not-yet-tested claims.

# Validation Gates

- **Gate 1 – Falsifiability**: The research question must be answerable by evidence; stop if it is purely speculative or unbounded.
- **Gate 2 – Isolation**: The mechanism under test must be separable from confounders; redesign if multiple variables change simultaneously.
- **Gate 3 – Viability**: Each hypothesis must be testable with feasible data and one-at-a-time assumption changes; stop if prerequisites are unrealistic.
- **Gate 4 – Comparative integrity**: Baseline and alternative must be matched except for the challenged assumption; redesign if comparison is unfair.
- **Gate 5 – Calibration sufficiency**: Module inputs must pass plausibility and independence checks; halt if calibration data are missing or invalid.
- **Gate 6 – Module clearance**: No system-level claim may rest on an unvalidated module; halt and repair the validation ladder before escalation.

# Claim Boundaries

- Do not present single-study or single-benchmark results as domain consensus.
- Do not extrapolate beyond the validated system class, hazard regime, data resolution, or governance context.
- Distinguish source-supported method patterns from agent-inferred extensions to new problems.
- Treat resilience and recovery outputs as conditional on explicit fragility and recovery assumptions, not as deterministic predictions.
- Frame policy or planning implications as conditional insights requiring independent expert review, not as settled facts.

# Failure Modes

- **Confounding**: Intervention effects mixed with changed hazard sets, performance definitions, or modeling assumptions.
- **Assumption-driven artifacts**: Conclusions dominated by normalization choices, default parameters, or unsupported dependence structures.
- **Overfitting / leakage**: Training and validation data overlap in time, space, or structure; prior-state variables contain future information.
- **Uncertainty suppression**: Reporting mean estimates without intervals or treating aleatory variability as resolved knowledge.
- **Module overreach**: Drawing system-level conclusions when component-level validation failed or is missing.
- **Metric cherry-picking**: Selecting the most convenient indicator when structural, contact, and outcome metrics disagree.
- **Extrapolation beyond evidence**: Applying a benchmark workflow to systems, materials, or hazard levels outside the validated envelope.

# Validity Checks

Before finalizing any output, verify:
- Does the design answer one clear research question rather than modeling an entire city or inventory?
- Are benchmark completeness and predictive accuracy distinguished?
- Are local calibration needs separated from transferred-model assumptions?
- Are physical, operational, and governance mechanisms represented without conflating them?
- Are missing data, defaults, and silent assumptions visible?
- Are uncertainty ranges, model fit, and extrapolation boundaries documented?
- Are controls sufficient to detect model artifacts and assumption-driven conclusions?
- Are results bounded by the scenario, data resolution, and target system?
- Are validation observations independent of calibration choices?
- Are safety-critical interpretations flagged for qualified professional review?

# Provenance

This workflow was synthesized from cluster **18.0** (end-to-end evidence analysis and claim audit) of the scientific skills codex. Source skills contributing to the merge include:
- `seismic-resilience-benchmark-research` (10.1007_s11803-020-0597-3)
- `seismic-vtb-coupled-safety-modeling` (10.1002_eqe.4196)
- `seismic-retrofit-performance-research-workflow` (10.55461_yyqh3072)
- `seismic-fragility-resilience-exploration` (10.1002_eqe.4220)
- `rocking-system-fe-research-workflow` (10.1002_eqe.3397)
- `seismic-state-aware-damage-research` (10.3390_app12083845)
- `secure-terrain-wind-forecasting-research` (10.56294_dm20261449)
- `seismic-resilience-retrofit-exploration` (10.1061_asce_st.1943-541x.0001302)

The merged skill preserves methodological patterns (benchmark construction, staged validation, assumption stress-testing, mechanism isolation, uncertainty propagation, and claim bounding) without retaining paper-specific parameters, numerical results, or operational protocols.
