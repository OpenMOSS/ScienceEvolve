---
name: sci-urban-coupled-system-risk-evidence-workflow-3c549051
description: A reusable end-to-end workflow for designing research questions, generating mechanism-driven hypotheses, and validating claims in coupled hazard-risk systems through layered evidence, controlled scenarios, and iterative claim auditing.
scienceevolve-title: "Urban hazard resilience · coupled system risk evidence workflow"
scienceevolve-area: urban-hazard-resilience
---

## Purpose

Help an agent design end-to-end research plans for coupled hazard-risk systems by framing mechanism-oriented questions, decomposing system interactions, generating falsifiable hypotheses, and validating claims through layered evidence and iterative auditing—without treating any single study as domain consensus.

## When to use

Use this skill when exploring new research questions in coupled natural hazard, urban infrastructure, or structural risk domains (e.g., seismic, flood, wind, or multi-physics interactions). It is appropriate for designing scenario-based studies, comparing configuration versus resource effects, evaluating coupled model behavior, and auditing claim strength.

Do not use this skill as a substitute for operational safety certification, emergency response directives, construction approval, or licensed engineering design.

## Inputs required

Before proposing a study, collect or infer:

- Target system class, research goal, and decision context.
- Available geometry, material, environmental, or exposure data and known gaps.
- Candidate subsystems, interfaces, and couplings that may control the response.
- Independent validation evidence or acceptable benchmarks.
- Constraints: ethical boundaries, safety limits, data sensitivity, and computational resources.
- Required outputs: hypothesis set, scenario matrix, validation plan, or claim audit.

If critical inputs are missing, state assumptions explicitly and mark conclusions as conditional.

## Core Workflow

1. **Frame the coupled risk question and evidence gap**
   - Define a narrow, mechanism-oriented research question.
   - Identify why existing single-domain or simplified models are insufficient.
   - **Gate:** If the question can be answered without coupling or scenario variation, stop and redirect to a simpler workflow.

2. **Decompose the system and map critical interfaces**
   - Separate subsystems (e.g., hazard generation, exposure, vulnerability, capacity; or demand, capacity, interaction).
   - Identify interfaces where mass, state, or constraints exchange.
   - Map directional properties, asymmetries, or configuration effects that may dominate over material or forcing changes.
   - **Gate:** If interfaces cannot be defined operationally, narrow the scope to a single subsystem.

3. **Generate mechanism-driven, falsifiable hypotheses**
   - Form conditional claims: *If [system-state change], then [metric] changes disproportionately in [location/component] because [mechanism].*
   - Tag each hypothesis with evidence strength (strong, moderate, weak, speculative), key assumptions, predicted observables, and falsification conditions.
   - Include at least one alternative explanation that does not rely on the proposed coupling or configuration effect.
   - **Gate:** If no hypothesis is falsifiable with available data, stop and collect more evidence.

4. **Design a controlled scenario matrix**
   - Define baseline, stress, contrast, positive control, and negative control scenarios.
   - Vary one configuration or directional variable and one resource or forcing variable while holding baseline assumptions constant.
   - Predefine stop conditions: benchmark failure, sensitivity instability, missing validation data, or assumption dominance.

5. **Execute layered validation**
   - **Layer 1 — Component validation:** Verify each subsystem reproduces its intended behavior independently.
   - **Layer 2 — Interface validation:** Test exchange plausibility, conservation, and synchronization between subsystems.
   - **Layer 3 — Integrated validation:** Evaluate the full coupled system under realistic conditions against independent evidence.
   - **Gate after each layer:** Pass → proceed; Fail → revise subsystem formulation, exchange logic, or boundary conditions before advancing.

6. **Analyze through mechanism-metric cross-checks**
   - Confirm numerical or model credibility (convergence, stability, conservation).
   - Inspect mechanisms (flow patterns, load paths, failure modes, coupling feedback).
   - Extract quantitative metrics aligned with hypotheses.
   - Cross-check that metrics are explained by inspected mechanisms, not only by numerical artifacts.
   - Compare with theoretical comparators and benchmarks as reference baselines, not automatic truth.

7. **Iterate based on validation outcomes**
   - **Confirm:** Predicted mechanism and metrics align with validated results → strengthen hypothesis.
   - **Revise:** Metrics appear but mechanism differs → update causal model and assumptions.
   - **Reject:** Expected phenomenon is absent under conditions where the benchmark supports detection → reject or narrow hypothesis.
   - **Suspend:** Validation, convergence, or sensitivity checks fail → suspend claims until resolved.
   - **Gate:** If sensitivity reverses the main conclusion or uncertainty dominates expected effects, stop broad claims and narrow scope.

8. **Audit claims and bound uncertainty**
   - Classify findings as validated, plausible, or speculative.
   - Bound claims by tested system class, scenario range, and model assumptions.
   - Document confounders, reproducibility requirements, and residual risks.

## Output Format

When using this skill, produce:

1. **Research question framing** — target system, mechanism, and decision context.
2. **Evidence gap** — why coupled or scenario-based analysis is needed.
3. **System decomposition and interface map** — subsystems, exchange points, and directional properties.
4. **Hypotheses table** — for each: claim, evidence strength, key assumptions, predicted observable, failure mode, and minimal test.
5. **Scenario matrix and experimental design** — baseline, variants, controls, metrics, and stop conditions.
6. **Layered validation log** — component, interface, and integrated results with pass/fail gates.
7. **Analysis summary** — mechanism inspection, metric extraction, cross-checks, and uncertainty.
8. **Iteration record** — confirmed, revised, rejected, or suspended hypotheses.
9. **Claim boundary statement** — validity checks, confounders, reproducibility needs, and ethics notes.

## Validation Gates

- **Benchmark gate:** A simpler benchmark containing the core phenomenon must be satisfied before interpreting the target system.
- **Sensitivity gate:** Key metrics must be stable to reasonable perturbations in mesh, boundary, parameter, or model form.
- **Conservation gate:** Coupled systems must pass mass, energy, or state consistency checks; treat balance errors as primary failure signals.
- **Mechanism gate:** Quantitative metrics must be explainable by the inspected physical or structural mechanism.
- **Extrapolation gate:** Correction factors, rankings, or rules must not be generalized beyond the tested geometry, conditions, or system class.

## Claim Boundaries

- Do not generalize from one archetype, site, or analysis method to all systems in the domain.
- Do not treat simulation or scenario outputs as operational safety certification, emergency directives, or construction authorization.
- Distinguish validated findings from plausible but unvalidated inferences and from agent-inferred extensions.
- Mark any scaling law, correction factor, or ranking as context-specific until independently revalidated.
- Keep outputs at the research-design and evidence-evaluation level.

## Failure Modes

- **Confounding by simplification:** Geometry simplification, boundary interference, or unmodeled interaction obscures the true mechanism.
- **Coupling feedback failure:** Component validation passes but integrated behavior fails due to undocumented exchange or synchronization effects.
- **Sensitivity collapse:** Results depend critically on undocumented assumptions, input windows, or boundary conditions.
- **Ranking reversal:** Adverse scenarios or omitted directional effects overturn primary conclusions.
- **Over-reduction:** Excessive simplification of input or subsystem complexity hides dynamics essential to the target response.
- **Implementation gap:** Technically sound interventions underperform due to governance, maintenance, equity, or capacity constraints.

## Validity Checks

- **Confounding control:** Verify that demand assumptions, material degradation, connectivity, or positional effects are not confounded with the variable of interest.
- **Reproducibility:** Document assumptions, scenario matrix, metrics, extraction methods, and pass/fail criteria.
- **Data quality:** Assess spatial alignment, temporal coverage, units, missing data, and provenance.
- **Model credibility:** Verify calibration against independent observations, historical benchmarks, or accepted reference cases.
- **Statistical and numerical validity:** Avoid false precision; report uncertainty intervals, sensitivity ranges, and convergence behavior.
- **Boundary conditions:** State explicit limits of extrapolation and transferability.

## Provenance

- Synthesized from cluster 1.0 (candidate: seismic-flood-urban-coupled-evidence-analysis-workflow; archetype: symmetry-guided evidence analysis and claim audit).
- Source skills: historic-bluff-body-wind-research, rc-seismic-configuration-exploration, coupled-flood-risk-exploration, urban-flood-coupled-modeling-exploration, seismic-input-window-exploration, seismic-vulnerability-exploration-workflow, bgi-urban-flood-research-exploration, urban-flood-resilience-research.
