---
name: sci-urban-urban-hazard-resilience-evidence-workflow-8f1817d1
description: A reusable end-to-end workflow for designing, validating, and auditing comparative evidence studies that link urban form, infrastructure morphology, or network structure to hazard resilience outcomes across wind, flood, seismic, or multi-hazard contexts.
scienceevolve-title: "Urban hazard resilience · urban hazard resilience evidence workflow"
scienceevolve-area: urban-hazard-resilience
---

# Purpose

Help an agent turn a new urban resilience or infrastructure performance question into a testable, controlled research plan. The workflow abstracts a common scientific route: frame a morphology–performance or structure–response problem, generate mechanism-based hypotheses, design controlled comparisons with strong validation, execute multi-scale diagnostics, and audit claims through robustness checks and explicit bounding.

# When to use

Use this skill when the user asks to:
- Propose or design research on how built-form, network topology, catchment layout, or structural configuration affects performance under environmental hazards.
- Compare baseline, disrupted, intervention, or alternative scenarios using spatial or temporal metrics.
- Validate a computational or experimental workflow before interpreting design or policy trends.
- Iterate after non-monotonic, mechanism-inconsistent, or validation-failing results.

Applicable domains include urban wind environments, flood–transport interaction, stormwater drainage, seismic structural response, and multi-hazard network resilience. Do not use this skill for operational emergency command, site-specific design certification, regulatory approval, or public-safety directives without qualified expert review.

# Inputs required

Ask for or infer the following before producing a plan:
- **Research target**: system class, spatial boundary, hazard type, and decision context.
- **Morphology or structure variable**: the primary built-form, network, or configuration variable to test.
- **Performance field**: the environmental or operational outcome of interest (e.g., wind field, runoff, connectivity, drift, damage).
- **Baseline**: the conventional or unmodified configuration for comparison.
- **Background conditions**: forcing regimes, exposure layers, demand profiles, and boundary constraints.
- **Available workflow**: modeling, simulation, measurement, or analytical methods and their validation resources.
- **Controls**: candidate negative controls, positive controls, and isolation controls.
- **Success criteria**: what evidence pattern would support or refute the hypothesis.
- **Constraints**: data access, computational budget, ethics, privacy, and safety-review requirements.

If inputs are missing, state assumptions explicitly and label resulting conclusions as agent-inferred.

# Core Workflow

1. **System Framing & Gap Definition**  
   Define the research question as a controlled morphology–performance or structure–response problem. Identify the serviceability gap and explicitly separate system topology/geometry from hazard exposure and from adaptive response.

2. **Mechanism Hypothesis Generation**  
   For each candidate mechanism, state: the causal pathway from structure to performance; the primary and secondary outcome metrics; contrast cases expected to produce different mechanisms; and predicted failure modes (e.g., weak case separation, threshold sensitivity, confounding). Label evidence strength as weak, moderate, or strong. Require at least one negative-control and one positive-control hypothesis.

3. **Controlled Comparison Design**  
   Build a case matrix that includes: a baseline; alternative scenarios expressing the target mechanism; negative controls where the mechanism should be absent; positive controls where it should be strongly expressed; and isolation controls that vary one assumption at a time. Define independent, dependent, and diagnostic variables. Predefine all spatial or temporal metrics, thresholds, and evaluation regions before analysis.

4. **Gate 1: Falsifiability & Isolation Check**  
   Confirm that the primary variable can change without confounding non-target geometry, network topology, boundary conditions, or post-processing choices. If the case matrix fails this check, redesign before proceeding.

5. **Workflow Validation**  
   Validate the analytical or experimental workflow against benchmarks, established analogues, or observed behavior. Document similarity limits, convergence, calibration, and boundary-condition sensitivity.

6. **Gate 2: Validation Acceptance**  
   Proceed only if the workflow reproduces benchmark behavior within a pre-specified tolerance. If validation fails, diagnose whether the mismatch stems from representation, resolution, similarity, or boundary errors; fix the workflow and re-validate. Do not interpret design trends against an unvalidated workflow.

7. **Comparative Execution & Diagnostics**  
   Execute baseline and alternative scenarios. Extract global performance metrics, local component or network demands, and spatial or temporal field diagnostics. Explicitly separate direct exposure from indirect redistribution effects.

8. **Gate 3: Mechanism Consistency Check**  
   Compare primary metrics against mechanism diagnostics. If they disagree, investigate secondary mechanisms or confounders before claiming support. Treat non-monotonic trends as evidence of competing mechanisms rather than noise.

9. **Robustness & Sensitivity Audit**  
   Vary boundary conditions, thresholds, demand scenarios, forcing directions, or parameter ranges. Test whether conclusions reverse under plausible uncertainty. Document sensitivity of rankings and spatial patterns to input changes.

10. **Gate 4: Stability Check**  
    If results reverse under reasonable sensitivity tests, downgrade evidence strength or stop. If stable, proceed to claim formulation.

11. **Claim Audit & Bounding**  
    Classify each claim as supported, partially supported, unsupported, or inconclusive. Distinguish workflow-validated findings, model-derived inferences, and speculative extensions. Bound external validity by system archetype, hazard regime, spatial scale, and governance context.

12. **Iteration or Termination**  
    - If hypotheses are supported and robust, narrow the claim and test transferability to more complex contexts.  
    - If partially supported, revise the mechanism hypothesis and return to Step 3 with a targeted discriminating test.  
    - If unsupported or inconclusive after two iteration cycles, stop and report limiting factors.  
    - Stop immediately if the plan would support safety-critical or operational decisions without adequate validation and qualified expert review.

# Output Format

When using this skill, produce:
1. **Research question**: target variable, setting, performance field, and gap.
2. **Hypothesis table**: at least three hypotheses, each with mechanism, evidence strength, key assumptions, failure modes, and minimal viable test.
3. **Experimental design matrix**: case matrix, variables, controls, metrics, and stop conditions.
4. **Validation plan**: benchmark targets, acceptance criteria, and similarity limits.
5. **Analysis plan**: diagnostic checks, spatial/temporal metrics, robustness tests, and interpretation rules.
6. **Iteration log template**: decision rules for supported, partially supported, unsupported, and inconclusive outcomes.
7. **Validity and limits**: confounders, reproducibility requirements, external-validity boundaries, and safety or ethics notes.

# Validation Gates

- **Gate 1 — Falsifiability & Isolation**: The primary variable must be manipulable without confounding non-target features. Non-target geometry, topology, boundary setup, and post-processing must be held constant across cases.
- **Gate 2 — Workflow Validation**: The workflow must reproduce benchmark or observed behavior within tolerance before any trend interpretation. Validation failures must be diagnosed and resolved.
- **Gate 3 — Mechanism Consistency**: Primary outcome metrics and mechanism diagnostics must align. Misalignment triggers a confounder review, not a claim upgrade.
- **Gate 4 — Stability**: Conclusions must survive reasonable sensitivity and scenario variation. Reversals under plausible uncertainty block generalization.

# Claim Boundaries

- Do not claim universal superiority of any single configuration across all hazards, climates, sites, or urban contexts.
- Do not present model-derived or simulation-based findings as sufficient for design certification, permitting, or public-safety decisions.
- Do not generalize from a single idealized case to complex real-world contexts without staged validation.
- Distinguish validated findings, mechanism-plausible inferences, and speculative extensions in every output.
- Avoid attributing causality solely from comparative correlation; claims must be tied to diagnosed mechanisms.

# Failure Modes

- **Confounding dominance**: Non-target geometry, network density, boundary conditions, or demand assumptions drive the observed trend rather than the intended variable.
- **Validation failure**: The workflow cannot reproduce benchmark behavior, yet trends are interpreted anyway.
- **Metric-threshold dominance**: Post-hoc threshold tuning or spatial metric redefinition creates apparent effects.
- **Mechanism misalignment**: Primary metrics improve while local diagnostics contradict the proposed mechanism.
- **Scale mismatch**: System-level conclusions are extrapolated to component-level behavior or vice versa without evidence.
- **Sensitivity reversal**: Rankings or conclusions change under reasonable parameter or scenario variation.
- **Premature termination**: The study stops after one favorable scenario without robustness checks.

# Validity Checks

Before finalizing any plan or claim, verify:
- The question is framed as a morphology–performance or structure–response research question, not an unsupported causal or certification claim.
- The primary variable and moderators are clearly defined; non-target features are controlled.
- Validation, strong controls, negative controls, positive controls, metrics, and stop conditions are explicit.
- Spatial or temporal metrics are predefined and not tuned after viewing results.
- Confounders are named (e.g., surrounding morphology, terrain, demand shifts, data age, boundary effects).
- Reproducibility requirements are stated: geometry definitions, workflow settings, validation data, post-processing rules, and versioned outputs.
- External-validity boundaries are clear, especially for moving from idealized to complex contexts.
- Evidence is labeled by strength and source type (validated, inferred, speculative).
- Safety-critical implications are flagged for qualified expert review.

# Provenance

This workflow was synthesized from cluster `14.0` (urban-flood-wind-resilience-evidence-analysis) of the scientific skills codex. It merges transferable method patterns from the following source skills: `curvilinear-building-wind-exploration`, `atmospheric-boundary-layer-wind-tunnel-research`, `flood-emergency-multimodal-scheduling`, `urban-road-network-resilience-exploration`, `seismic-nonlinear-verification-workflow`, `flood-network-disruption-research`, `spatial-network-hydrology-research`, and `seismic-bracing-research-workflow`. Source-specific systems, parameters, and numerical results have been abstracted; only the shared workflow route is retained.
