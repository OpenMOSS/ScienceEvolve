---
name: sci-cosmology-rare-phenomenon-hypothesis-validation-wor-38a3e9cf
description: End-to-end workflow for generating falsifiable hypotheses about rare or hard-to-detect phenomena, designing multi-control validation plans, and iterating under strict claim-bounding and blind-analysis discipline.
scienceevolve-title: "Galaxy, cosmology, and simulations · rare phenomenon hypothesis validation workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

## Purpose

Guide agents through a reusable, end-to-end scientific workflow for studying rare, faint, or ambiguous phenomena where signal-to-background is low and mechanism inference is easily confounded. The workflow migrates across domains by focusing on mechanism-based hypothesis generation, hierarchical multi-control validation, frozen analysis discipline, and iterative claim bounding—not on specific objects, materials, or numerical results.

## When to use

Use this skill when:

- The research target is a rare event, low-signal signature, faint population, or complex relational mechanism.
- Competing explanations include direct causation, common drivers, environmental or relational effects, feedback suppression, or selection biases.
- The task requires designing falsifiable hypotheses, minimum viable validation, negative/positive/strong controls, and stop conditions rather than summarizing existing conclusions.
- Backgrounds, confounders, or model systematics are significant enough that blind or frozen analysis plans are necessary.

Do not use this skill for:

- Operational lab recipes, fabrication parameters, hazardous protocols, or executable equipment instructions.
- Literature summaries, term definitions, or direct extrapolation of single-paper conclusions as domain consensus.
- Tasks that require inventing data, ignoring model limits, or masking uncertainty.

## Inputs required

Before starting, gather or request:

- **Research gap**: The anomaly, tension, or unexplained pattern that baseline models cannot cover.
- **Candidate mechanisms**: Formation paths, interaction chains, or relational processes that could produce the target phenomenon.
- **Available data/constraints**: Observational, experimental, simulation, or archival sources; their selection functions; calibration status; and uncertainty budgets.
- **Baseline models**: Standard backgrounds, null models, or established theoretical frameworks for comparison.
- **Uncertainty sources**: Selection effects, foreground contamination, instrument or model systematics, projection effects, and parameter degeneracies.
- **Target output**: Discovery, exclusion, sensitivity improvement, mechanism discrimination, or instrument validation.

If inputs are incomplete, output a "missing information and impact" statement, then proceed with conditional hypotheses and a minimal verification plan.

## Core Workflow

Execute the following steps in order. At each decision gate, pause and resolve the condition before proceeding.

### Step 1: Gap Definition & Mechanism Mapping
- Identify the specific gap between observation and baseline explanation.
- Draw a mechanism chain: inputs → key intermediates → competing paths → sinks → observable outputs.
- Flag where the chain crosses scales and where backgrounds could mimic the signal.

### Step 2: Hypothesis Generation & Evidence Staging
- Generate falsifiable hypotheses of the form: *If mechanism X dominates, then observable Y should respond in direction Z under condition W.*
- Label each hypothesis with evidence strength:
  - **Strong**: Direct support from independent data or closely analogous systems.
  - **Moderate**: Mechanism is plausible but requires new validation.
  - **Weak**: Based on analogy, indirect inference, or limited extrapolation.
  - **Speculative**: Exploratory; minimal direct evidence.
- List key assumptions, competing explanations, and explicit failure modes.

**Decision Gate 1 — Distinguishability:**  
If hypotheses are not distinguishable from the baseline or from each other with available data, return to Step 1 and refine the mechanism map or redefine observables.

### Step 3: Validation Design & Analysis Freezing
- Design a **minimum viable validation** (MVV) targeting the weakest link in the mechanism chain.
- Define controls before inspecting decisive data:
  - **Negative control**: Signal should be absent or strongly suppressed.
  - **Positive control**: Known signal or benchmark case to verify recovery.
  - **Strong control**: Matched sample or alternative model that isolates the target mechanism from confounders.
  - **Alternative mechanism control**: Competing explanation that predicts the same or different output.
- Freeze signal regions, selection rules, background models, and statistical thresholds. Do not adjust these after previewing decisive data.

**Stop Condition A:**  
If independent controls cannot be constructed, or if the target signal is degenerate with an unconstrained background, halt and reformulate the hypothesis or data requirements.

### Step 4: Background & Systematic Decomposition
- Catalog all physical, instrumental, environmental, and selection-related backgrounds.
- Verify that calibration data cover the signal region, time or state space, and relevant parameter ranges.
- Quantify how selection functions, projection effects, or model approximations could bias the apparent signal.

**Decision Gate 2 — Background Independence:**  
If dominant backgrounds cannot be constrained by independent data or control regions, pause to acquire calibration, reduce scope, or downgrade to an exploratory hypothesis.

### Step 5: Hierarchical Execution & Model Comparison
- Execute analysis across mechanism → process → system levels (or equivalent domain hierarchy).
- Compare baseline, candidate, and alternative models using pre-defined metrics.
- Report effect sizes, confidence intervals, and model sensitivity; do not rely solely on significance thresholds.

### Step 6: Robustness & Sensitivity Audit
- Vary background models, parameterizations, thresholds, and prior assumptions.
- Test whether the conclusion reverses or degrades under plausible alternatives.
- Check for post-hoc selection bias: confirm that the frozen plan was not violated.

**Decision Gate 3 — Robustness:**  
If the conclusion depends on a single untested assumption, a narrow parameter range, or an unreproducible subset, downgrade the claim strength and return to Step 3 to broaden controls.

### Step 7: Iteration / Redesign Decision
- Update each hypothesis state: **supported**, **partially supported**, **unsupported**, or **rejected**.
- If unsupported:
  - Diagnose whether the failure lies in data quality, variable definition, control design, or the mechanism itself.
  - Return to Step 1 or 2 with revised boundary conditions or alternative mechanisms.
- If partially supported:
  - Identify the specific sub-mechanism or scale that needs tighter constraint.
  - Design the next MVV before expanding scope.
- If supported:
  - Propose a bridge test for extrapolation to new regimes, objects, or environments.

**Stop Condition B:**  
If maintaining the hypothesis requires ad-hoc parameters, violates strong independent constraints, or if negative controls fail, reject the hypothesis and archive the failure mode as a boundary condition.

### Step 8: Claim Bounding & Provenance Packaging
- Separate three evidence tiers:
  1. **Verified patterns**: Established in the current analysis or closely matched precedent.
  2. **Agent inferences**: New claims generated by the agent, tagged with evidence strength and required verification.
  3. **Non-reusable conditions**: Specific implementations, sample selections, or instrument settings that do not generalize.
- State extrapolation boundaries explicitly: applicable regimes, scales, environments, and data types.

## Output Format

Produce a structured report containing:

1. **Research Question** — Target phenomenon, candidate mechanisms, and falsifiable predictions.
2. **Hypothesis Table** — For each hypothesis: statement, evidence strength, key assumptions, predicted observables, and failure modes.
3. **Validation Design** — MVV description, control definitions, frozen analysis plan, metrics, and stop conditions.
4. **Analysis Plan** — Data preparation, hierarchical checks, model comparison scheme, uncertainty propagation, and visualization strategy.
5. **Iteration Log** — Hypothesis states after current round, diagnosed failure sources, and next-round MVV.
6. **Validity Checklist** — Confounders, reproducibility steps, statistical safeguards, and scale-matching checks.
7. **Evidence Boundary Statement** — Clear demarcation of verified patterns, agent inferences, and non-reusable conditions.

## Validation Gates

- **Gate 1 (Distinguishability):** Hypotheses must be distinguishable from baseline and from each other using pre-defined observables.
- **Gate 2 (Background Independence):** Dominant backgrounds and systematics must be independently constrained before strong claims.
- **Gate 3 (Robustness):** Conclusions must survive plausible alternative models, parameter variations, and sensitivity tests.

## Claim Boundaries

- **Excluded / Rejected:** The hypothesis is inconsistent with data under the stated assumptions.
- **Weakly supported / Consistent:** The data do not contradict the hypothesis, but independent verification is still required.
- **Supported:** Multiple lines of evidence, including strong controls, converge on the hypothesis; yet it remains model- and regime-dependent.
- **Inferred / Speculative:** Agent-generated claim with no direct validation; must not be presented as established fact.
- Never elevate single-source or single-model results to domain consensus.

## Failure Modes

- **Post-hoc tuning:** Adjusting selection rules, signal regions, or background models after inspecting decisive data.
- **Background mimicry:** Confusing an unconstrained background or systematic effect for the target signal.
- **Mechanism conflation:** Interpreting correlation or co-occurrence as direct causation without ruling out common drivers or selection effects.
- **Overfitting:** Conclusions that rely on a single model, narrow parameter range, or small non-reproducible subset.
- **Scale mismatch:** Applying constraints derived at one scale directly to another without bridge validation.
- **Premature extrapolation:** Extending conclusions to regimes, environments, or populations not covered by controls.

## Validity Checks

- **Confounders:** Identify selection effects, projection effects, environmental covariates, instrument state, and model approximations that could mimic or mask the signal.
- **Reproducibility:** Record data versions, selection rules, variable definitions, model configurations, random seeds, and analysis scripts.
- **Statistical validity:** Pre-define test statistics, propagate uncertainties, control for multiple comparisons, and report effect sizes with intervals.
- **Scale consistency:** Ensure mechanism-level, process-level, and system-level indicators are matched in time, space, or logical scope.
- **Counterfactual check:** For each supported hypothesis, specify what pattern would be expected if the mechanism were absent, and confirm the data can discriminate.
- **Extrapolation boundary:** Explicitly state the regimes, scales, and data types to which conclusions apply; do not generalize beyond validated bounds.

## Provenance

This workflow was synthesized from cluster **29.0** (rare-phenomenon and relational-environmental hypothesis skills). Source skill references include:
- `galaxy-feedback-bar-research-workflow`
- `mond-cluster-udg-dynamics-exploration`
- `pbh-dark-matter-research-design`
- `dark-matter-rare-event-research-workflow`
- `boreal-aerosol-hom-research-workflow`
- `laser-melting-defect-research-design`
- `institutional-emotion-workflow`
- `astronomy-paper-methodology-workflow`

These references inform the workflow structure; no specific paper conclusions, numerical results, or operational protocols are carried forward.
