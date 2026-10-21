---
name: sci-fusion-magnetic-confinement-claim-audit-workflow-c0d3795e
description: Audit scientific claims and design staged validation plans for magnetic confinement fusion research through observable-driven evidence analysis, mechanism discrimination, and robustness checking.
scienceevolve-title: "Magnetic confinement fusion · magnetic confinement claim audit workflow"
scienceevolve-area: magnetic-confinement-fusion
---

## Purpose

This skill guides agents in auditing scientific claims, generating testable hypotheses, and designing staged validation plans for magnetic confinement fusion research—including stellarator, tokamak, and related magnetic-confinement concepts. It emphasizes observable-driven evidence analysis, mechanism discrimination, control-based falsification, and boundary-aware claim bounding rather than reproducing results from any single study.

## When to use

Use this skill when a user asks to:

- Propose or audit research questions in magnetic-confinement fusion, plasma confinement, heating, current drive, or configuration optimization.
- Design non-operational validation plans that distinguish physical mechanisms from artifacts.
- Assess whether an experimental, simulation, or design claim is scientifically grounded, reproducible, and appropriately bounded.
- Compare candidate configurations, actuators, or regimes using evidence hierarchies and robustness checks.
- Translate platform-level or design-level capabilities into hypotheses, controls, metrics, and iteration rules.

Do not use this skill as a substitute for device-specific operational approval, safety review, engineering authorization, or as a source of executable hardware procedures.

## Inputs required

Before generating a plan, request or identify:

- **Target system class** and current capability envelope (e.g., device concept, simulation tool, or design stage).
- **Research claim or question** to be audited, including the proposed mechanism and expected observable.
- **Evidence base**: prior observations, simulations, databases, or literature, separated into verified facts, empirical trends, and speculative extensions.
- **Available diagnostics or proxy observables**, including calibration status and known ambiguities.
- **Models** for comparison (empirical, physics-based, system-level) and their known validity boundaries.
- **Constraints**: safety, compliance, authorization, engineering, and operating boundaries.
- **Desired output level**: exploratory question, minimal validation concept, or full study design outline.

## Core Workflow

Follow this ordered end-to-end route. At each numbered gate, decide whether to proceed, iterate, or stop.

1. **Frame the claim and audit scope**
   - State the scientific claim, target capability, or research question in one sentence.
   - Define the proposed mechanism and its falsifiable observable predictions.
   - **Gate 1 — Falsifiability check:** If the claim cannot be falsified or produces no observable prediction, stop and reformulate.

2. **Inventory evidence and map assumptions**
   - Catalog existing evidence by class: directly validated, adjacent-regime supported, empirically scaled, model-supported, or agent-inferred.
   - List critical assumptions about platform capability, diagnostic reliability, model validity, and boundary conditions.
   - **Gate 2 — Evidence floor:** If no evidence class supports the mechanism, flag the claim as speculative and require a minimal-model justification before proceeding.

3. **Design mechanism-discrimination strategy**
   - Identify independent observables that can distinguish the proposed mechanism from confounders (e.g., wall-state evolution, profile drift, diagnostic artifact, equilibrium shift).
   - Define controls:
     - Baseline control (reference case).
     - Negative control (mechanism suppressed; effect should diminish).
     - Positive control (mechanism present; effect should appear).
     - Orthogonal/ablation control (one variable changed to isolate causality).
   - **Gate 3 — Diagnostic adequacy:** If available diagnostics cannot distinguish the mechanism from competing explanations, stop and redesign the observation strategy.

4. **Build the validation portfolio**
   - Screen validation levels from lowest to highest risk: literature/database comparison, reduced-physics simulation, integrated scenario modeling, staged-platform experiment.
   - Select the lowest-sufficient level that can test the claim.
   - Define primary and secondary variables, evaluation metrics, and predefined stop conditions.
   - **Gate 4 — Feasibility boundary:** If the chosen validation level exceeds platform capability, safety bounds, or authorization limits, downgrade the validation or pause pending appropriate review.

5. **Execute observable-driven analysis**
   - **Data integrity:** Verify calibration, timing, reproducibility, and diagnostic consistency.
   - **Control comparison:** Compare primary conditions against all defined controls.
   - **Mechanism discrimination:** Determine whether the result is better explained by the intended mechanism or by confounders.
   - **Model comparison:** Compare observations with independent model classes; treat disagreement as a signal for targeted validation, not as noise to ignore.
   - **Gate 5 — Mechanism alignment:** If the primary metric improves but the mechanism metric does not, flag confounding and return to step 3.

6. **Robustness and coupling check**
   - Run sensitivity scans over plausible assumptions (profiles, geometry, operating point, implementation error).
   - Assess coupled margins: verify that improving one subsystem does not consume margin in another.
   - **Gate 6 — Fragility check:** If the result depends on a narrow assumption window with no sensitivity margin, bound the claim tightly or stop and redesign.

7. **Classify evidence and bound claims**
   - Assign evidence strength to each conclusion:
     - *Directly observed:* calibrated, reproducible measurements.
     - *Empirically inferred:* trends across controlled comparisons.
     - *Model-supported:* consistent with simulations under stated assumptions.
     - *Speculative extension:* plausible but not independently validated.
   - Define explicit claim boundaries: regime, device class, extrapolation distance, and diagnostic coverage.
   - **Gate 7 — Boundary discipline:** If a claim exceeds the tested scope without independent support, downgrade it to conditional or speculative.

8. **Iterate or retire risk**
   - Update the hypothesis status: strengthened, modified, split, downgraded, or stopped.
   - Decide the next action:
     - *Advance:* promote to stronger validation or broader claim.
     - *Revise:* adjust assumptions, controls, or variables and repeat from step 3 or 4.
     - *Reject:* abandon if a strong control invalidates the mechanism.
     - *Defer:* pause if uncertainty remains and new evidence is required.
   - **Stop condition:** End the workflow when the claim is retired, validated by independent diagnostics and controls, or formally deferred with a clear evidence gap.

## Output Format

Return the following deliverables:

1. **Research question / Claim statement:** The scoped scientific gap or claim under audit.
2. **Evidence map:** Existing evidence classified by strength and source independence.
3. **Hypotheses table:** For each hypothesis—mechanism, predicted observables, evidence strength, key assumptions, likely failure modes, and scope boundary.
4. **Validation plan:** Portfolio level, variables, controls, diagnostics/observables, metrics, and stop conditions.
5. **Analysis plan:** Data integrity checks, control comparison, mechanism discrimination, model comparison, and evidence hierarchy.
6. **Iteration plan:** Update rules after the first validation cycle, including advance/revise/reject/defer criteria.
7. **Validity and safety review:** Confounders, reproducibility checks, boundary conditions, and non-operational safety constraints.
8. **Claim boundary statement:** Explicit limits on generalization, separated from agent-inferred extensions.

## Validation Gates

Summary of stage-specific pass/fail criteria:

- **Falsifiability:** Claim must yield observable predictions.
- **Evidence floor:** At least minimal-model or adjacent-evidence support required.
- **Diagnostic adequacy:** Mechanism must be distinguishable from dominant confounders.
- **Feasibility boundary:** Validation must fit within platform capability and safety/authorization limits.
- **Mechanism alignment:** Primary-effect improvement must co-occur with mechanism-metric movement.
- **Fragility check:** Result must survive plausible sensitivity variations.
- **Boundary discipline:** Claims must not exceed tested scope without independent support.

## Claim Boundaries

- Do not generalize from a single paper, device, or simulation campaign to field-wide consensus.
- Separate verified observations from empirical trends, model-supported projections, and speculative extensions.
- Limit claims to the tested regime, geometry class, diagnostic set, and model validity envelope.
- Treat extrapolation to reactor-relevant or untested parameters as conditional until staged validation is completed.
- Distinguish source-paper-supported facts from agent-generated inferences for new systems.

## Failure Modes

- **Confounding:** Wall state, impurity evolution, heating differences, configuration drift, or diagnostic calibration shifts mimic the proposed mechanism.
- **Diagnostic ambiguity:** Independent diagnostics disagree, or sensitivity is insufficient to resolve the predicted effect.
- **Model mismatch:** Physics-based and empirical models diverge, and the chosen model is treated as ground truth without validation.
- **Narrow operating window:** The effect appears only under a specific, unreproducible parameter combination.
- **Coupled margin erosion:** A subsystem improvement consumes margin elsewhere, invalidating system-level claims.
- **Overfitting:** Optimized designs or analyses depend on hidden assumptions, objective weights, or narrow baselines.
- **Single-study risk:** Conclusions are drawn from one source without cross-study or independent replication support.

## Validity Checks

Before finalizing any output, verify:

- **Confounding control:** Have wall state, profile evolution, diagnostic drift, and alternative mechanisms been ruled out?
- **Reproducibility:** Can the result be repeated under comparable conditions with the same analysis pipeline?
- **Control sufficiency:** Are baseline, negative, positive, and ablation controls defined and executed?
- **Statistical and modeling validity:** Are uncertainty ranges, sample limitations, model assumptions, and convergence criteria explicit?
- **Boundary conditions:** Is the claim limited to the tested platform, or justified for broader relevance with independent evidence?
- **Evidence separation:** Are verified observations, empirical trends, model predictions, and speculative extensions clearly labeled?
- **Extrapolation discipline:** Are regime distance, scale differences, and material/diagnostic gaps explicitly flagged?
- **Safety compatibility:** Does the plan remain at a non-operational research-design level?

## Provenance

- Synthesized from cluster 3, subcluster 3.0 (observable-driven evidence analysis and claim audit).
- Source skills referenced: `helical-plasma-exploration-workflow`, `plasma-microwave-current-drive-research`, `wave-plasma-regime-transition-research`, `pm-stellarator-optimization-workflow`, `rf-negative-ion-exploration`, `integrated-fusion-physics-risk-retirement`, `stellarator-magnetic-configuration-research`, `stellarator-design-research-workflow`.
- Methodological patterns were abstracted from magnetic-confinement fusion research workflows; no device-specific numerical results, operational parameters, or paper conclusions are embedded above.
