---
name: sci-urban-seismic-wind-urban-flood-mechanism-discovery-a79ff039
description: A reusable end-to-end workflow for generating mechanism-grounded research questions, designing staged validation studies, and iterating hypotheses across coupled physical systems in seismic, wind, urban, and flood domains.
scienceevolve-title: "Urban hazard resilience · seismic wind urban flood mechanism discovery workflow"
scienceevolve-area: urban-hazard-resilience
---

## Purpose

Help an agent convert an observed performance gap or coupling uncertainty into a credible, mechanism-based research plan. It emphasizes subsystem isolation, fidelity-ladder validation, diagnostic analysis, and evidence-bounded iteration for coupled physical systems.

## When to use

Use this skill when:

- Proposing new research questions about coupled, multi-physics, or multi-scale system behavior.
- Comparing simplified baseline assumptions against context-aware or mechanism-aware models.
- Designing staged validation (simulation, controlled experiment, or field observation) to test whether an omitted mechanism matters.
- Generalizing findings across configurations, domains, or environmental conditions.
- Diagnosing why a system responds differently than predicted by baseline models.

Do not use this skill to claim universal performance rankings without cross-system validation, or to issue operational, safety-critical, or code-compliant engineering decisions.

## Inputs required

Before generating a research plan, identify or ask for:

- Target system family and dominant dynamic or physical regimes.
- Performance gap or decision bottleneck motivating the study.
- Candidate mechanisms and coupling pathways suspected to matter.
- Available evidence sources (simulation, experiment, field data, literature benchmarks).
- Baseline assumptions or simplified models to challenge.
- Constraints: fidelity budget, validation availability, safety boundaries, and reproducibility requirements.

## Core Workflow

Follow this ordered route. Treat each decision gate as a hard checkpoint; do not skip ahead.

1. **Frame the gap and map the mechanism chain**
   - Define the performance bottleneck or prediction failure.
   - Draw the causal chain from external drivers through subsystems to the target response.
   - Identify where baseline assumptions may omit a coupling pathway.
   - *Decision gate:* If the gap cannot be expressed as a missing or misrepresented mechanism, stop and reformulate the question.

2. **Decompose subsystems and build a fidelity ladder**
   - Separate physics domains, scales, or components.
   - Mark each mechanism as represented, partially represented, or omitted in candidate models.
   - Order models by fidelity and cost: screening, mechanism-isolation, fully coupled.
   - *Decision gate:* If a lower-fidelity model already explains the behavior, prefer it and bound the claim to that regime.

3. **Generate ranked, falsifiable hypotheses**
   - State the mechanism hypothesis, model-fidelity hypothesis, and robustness or generalization hypothesis.
   - Assign evidence strength (strong, moderate, weak, speculative) and list key assumptions and failure modes.
   - *Decision gate:* If a hypothesis cannot be falsified with available resources, narrow the scope or replace it.

4. **Design staged validation with controls**
   - Define independent variables, dependent variables, and confounders.
   - Select controls: baseline default, negative control (mechanism weak), positive control (mechanism strong), ablation control, and independent validation data.
   - Specify minimum viable validation: one component check per active domain, one coupling-isolation case, one contrast case, and one diagnostic trace.
   - *Decision gate:* If the plan lacks independent validation or matched controls, redesign before execution.

5. **Execute component checks before coupled interpretation**
   - Validate each subsystem independently.
   - Check numerical stability, convergence, and physical plausibility.
   - *Stop condition:* If component validation fails, revise the subsystem model before proceeding to coupled analysis.

6. **Run paired comparisons and inspect mechanism diagnostics**
   - Compare baseline and mechanism-aware models on identical scenarios.
   - Examine intermediate diagnostics (residuals, force paths, phase behavior, field deviations, embedding separation) before relying on scalar metrics.
   - *Decision gate:* If diagnostics do not show the predicted mechanism signature, treat the effect as unvalidated and return to Step 3.

7. **Test robustness and domain shift**
   - Vary excitation families, environmental conditions, geometry, or material assumptions.
   - Evaluate sensitivity and uncertainty.
   - *Decision gate:* If the effect disappears under plausible variations, bound the claim to the validated regime only.

8. **Bound claims and plan iteration**
   - Label each conclusion as validated, supported, plausible, or speculative.
   - Document boundary conditions, untested regimes, and extrapolation risks.
   - *Stop conditions:*
     - The mechanism is indistinguishable from numerical artifacts.
     - Results reverse under plausible fidelity or assumption changes.
     - Uncertainty dominates the effect size.
     - Further study would require unsafe or unreviewed operational procedures.
   - If none apply, return to Step 3 with updated hypotheses for the next cycle.

## Output Format

When using this skill, return:

1. **Research question** — concise statement of the bottleneck, system boundary, and decision to be made.
2. **Mechanism map** — list of represented, partially represented, and omitted mechanisms.
3. **Hypotheses** — at least three ranked hypotheses, each with evidence strength, key assumptions, and failure modes.
4. **Validation design** — independent variables, dependent variables, controls, minimum viable validation, and stop conditions.
5. **Analysis plan** — diagnostic checks, comparison logic, sensitivity tests, and uncertainty treatment.
6. **Iteration rules** — how results strengthen, weaken, redirect, or bound each hypothesis.
7. **Validity and boundary statement** — confounders, reproducibility checks, extrapolation limits, and safety-relevant caveats.

## Validation Gates

- **Component credibility:** Each subsystem must be credible in the relevant regime before coupled interpretation.
- **Control adequacy:** Matched baselines must separate the proposed mechanism from incidental parameter changes.
- **Validation independence:** Reference or validation data must be excluded from model fitting, training, or tuning.
- **Observability:** Latent parameters must be identifiable from available observations and geometry.
- **Diagnostic trace:** The mechanism must leave a signature in intermediate variables, not only in aggregate scalar metrics.

## Claim Boundaries

- Distinguish validated findings from inferred hypotheses and speculative extrapolation.
- Limit claims to tested system families, environmental regimes, and model assumptions.
- Do not present single-study or simulation-only results as field-wide consensus.
- Separate mechanism-driven effects from artifacts of discretization, boundary conditions, threshold choice, or metric selection.
- Avoid claiming universal superiority of one model or design without cross-system, cross-excitation evidence.

## Failure Modes

- Confounding by geometry, mass, boundary conditions, or nuisance variation.
- Compensating errors where global agreement hides local disagreement.
- Data leakage across splits, batches, systems, or simulation runs.
- Unidentifiable parameters or non-unique model fits.
- Overfitting to a narrow scenario set or intensity measure.
- Simulation-to-reality gap when empirical validation is absent.
- Threshold or metric choice driving conclusions more than physical system capacity.

## Validity Checks

- **Confounding:** Are nuisance variables controlled or reported?
- **Reproducibility:** Are splits, seeds, preprocessing, model versions, and assumptions documented?
- **Boundary conditions:** Where should the hypothesis weaken, reverse, or fail?
- **Statistical and numerical validity:** Are convergence, uncertainty, sample size, and resampling addressed?
- **Mechanism validity:** Do diagnostics align with the proposed causal pathway?
- **Physical plausibility:** Are force paths, energy balance, and state variables directionally reasonable?
- **Evidence labeling:** Are source-supported findings distinguished from agent-inferred hypotheses?

## Provenance

- Synthesized from cluster 12.1 (seismic-wind-urban-flood-mechanism-discovery-workflow), representing 96 source skills.
- Derived from source skills: nonlinear-coupled-absorber-research, guided-wave-shm-generalization-research, fowt-cfd-coupled-system-research, seismic-isolation-bidirectional-response-exploration, mechanism-preserving-fragility-research, lidar-wind-field-reconstruction-research, urban-microclimate-energy-model-research-workflow, vibration-metric-anomaly-research.
- Provenance is preserved as cluster and source-skill references only; no paper conclusions or operational protocols are included.
