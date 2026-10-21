---
name: sci-fusion-magnetic-confinement-mechanism-discovery-wor-76850a2f
description: Observable-driven end-to-end workflow for generating, discriminating, and validating physical mechanisms in magnetic-confinement plasma research across transport, stability, equilibrium, and confinement transitions.
scienceevolve-title: "Magnetic confinement fusion · magnetic confinement mechanism discovery workflow 4"
scienceevolve-area: magnetic-confinement-fusion
---

## Purpose

Turn an unexplained observation or performance gap in magnetic-confinement plasma into a disciplined mechanism-discovery program. The workflow generates competing hypotheses, designs minimum viable validation studies, and iterates through staged evidence until a claim is supported, bounded, or rejected.

## When to use

Use this skill when:
- Proposing research questions about transport, barriers, stability, equilibrium, turbulence, relaxation, or confinement transitions.
- Designing non-operational simulation or experimental plans to discriminate among candidate mechanisms.
- Validating whether a proposed mechanism explains observed profile, fluctuation, or topological signatures.
- Iterating between hypothesis generation, multi-channel analysis, and robustness testing.

Do not use this skill to authorize device operation, prescribe executable settings, or bypass safety review.

## Inputs required

Before starting, obtain or state assumptions for:
- Target system class, magnetic topology, and operating regime.
- Observed anomaly or event definition, including available diagnostic or simulation signatures.
- Baseline state for comparison and candidate rival mechanisms.
- Available diagnostics or synthetic observables, with uncertainty estimates.
- Modeling resources and their fidelity limits.
- Facility authorization, safety, and compliance boundaries.

If an input is missing, mark dependent conclusions as inferred and identify the measurement needed to reduce uncertainty.

## Core Workflow

1. **Frame the observable anomaly.**  
   Define the event class, performance gap, or transition. Identify the baseline state and the earliest reliable change.

2. **Generate competing hypotheses.**  
   Formulate at least three mechanism hypotheses (e.g., gradient-driven, hidden coupling or geometry effect, nonlinear feedback, diagnostic artifact). For each, state evidence strength, key assumptions, predicted discriminating observable, and likely failure mode.  
   - *Decision Gate — Falsifiability:* If no hypothesis predicts an observable difference with available diagnostics, stop and identify required measurements.

3. **Design minimum viable validation.**  
   Define independent variables (drive, profile, geometry), dependent variables (transport proxy, mode structure, topological response), and a control set (baseline, negative, positive, sensitivity). Specify primary metrics and stop conditions.  
   - *Decision Gate — Feasibility:* If the expected effect size is smaller than combined diagnostic and model uncertainty, stop or redesign the study scope.

4. **Stage 1: Qualitative sequence and localization.**  
   Establish temporal ordering and spatial co-location between the proposed cause and the plasma response using minimally processed observables.  
   - *Decision Gate — Causal Ordering:* If the mechanism does not precede or co-locate with the response, demote or reject the hypothesis.

5. **Stage 2: Multi-channel structure extraction.**  
   Extract coherent structures, mode families, or topological features using at least two independent methods (for example, event-conditioned averaging and correlation analysis, or simulation and diagnostic reconstruction).  
   - *Decision Gate — Cross-Method Agreement:* If independent methods disagree, reconcile diagnostics or post-processing before inferring mechanism support.

6. **Stage 3: Balance and coupling closure.**  
   Close balances (particle, energy, momentum) or test global-local coupling. Require consistency between macro-scale structure and micro-scale transport or stability response.  
   - *Decision Gate — Consistency:* If balance closure fails or macro-micro coupling is inconsistent, label the hypothesis as conditional and do not advance to strong claims.

7. **Stage 4: Mechanism discrimination.**  
   Compare the candidate against rival mechanisms using matched controls. Require prediction of observables not used to tune the hypothesis.  
   - *Decision Gate — Rival Exclusion:* If negative controls replicate the test signature or a rival explains the data equally well, reject or downgrade the candidate.

8. **Stage 5: Robustness and boundary probing.**  
   Vary nuisance variables (profile shape, boundary conditions, resolution, geometry). Test whether the claim survives reasonable sensitivity scans.  
   - *Decision Gate — Robustness:* If the effect disappears under sensitivity checks, narrow the claim boundary to the tested regime.

9. **Iterate or terminate.**  
   - *If supported across gates:* advance to broader validation or finalize the bounded claim.  
   - *If qualified:* state boundary conditions and propose the next discriminating test.  
   - *If rejected:* return to Step 2 with revised assumptions or alternative reference channels.  
   - *Hard stop conditions:* safety or authorization limits reached; diagnostics cannot distinguish trigger from recovery; arbitrary tuning without independent support; claim remains underdetermined after all controls.

## Output Format

For each use of this skill, produce:

1. **Research question and baseline definition** — concise statement of the gap and the observable transition.
2. **Hypothesis table** — columns: mechanism, evidence strength, key assumptions, discriminating observable, likely failure mode.
3. **Study design** — variables, control table (baseline, negative, positive, sensitivity), minimal viable validation, evaluation metrics, and stop conditions.
4. **Staged analysis plan** — normalization, event selection, structure extraction, balance closure, rival comparison, and uncertainty handling.
5. **Iteration plan** — rules for promoting, demoting, splitting, merging, or rejecting hypotheses based on gate outcomes.
6. **Validity and safety notes** — confounders, boundary conditions, reproducibility requirements, and confirmation that the plan remains non-operational.

## Validation Gates

- **Falsifiability Gate:** Every hypothesis must predict a discriminating observable; otherwise the study cannot proceed.
- **Feasibility Gate:** The expected signal must exceed combined diagnostic and model uncertainty.
- **Causal Ordering Gate:** The proposed mechanism must precede or co-locate with the plasma response.
- **Cross-Method Agreement Gate:** Independent extraction methods must agree before inferring structure.
- **Balance/Coupling Consistency Gate:** Macro-scale signatures must be consistent with micro-scale transport, stability, or closure constraints.
- **Rival Exclusion Gate:** Negative controls must remain distinct and rival mechanisms must not explain the data equally well.
- **Robustness Gate:** The claim must survive reasonable variation of nuisance variables and assumptions.

## Claim Boundaries

- Distinguish observed association, supported mechanism, causal support, and speculative extension.
- Limit claims to the tested device class, regime, diagnostic coverage, and model assumptions.
- Do not extrapolate to reactor performance or present single-study results as field-wide consensus without independent validation.
- Separate claims about trigger initiation from sustainment and from overall performance improvement.
- Separate linear onset evidence from nonlinear event interpretation.

## Failure Modes

- Confounding by uncontrolled profile, boundary, or diagnostic evolution.
- Reference-channel bias or analysis-method broadening.
- Insufficient event count or nonstationary background.
- Compensating errors in balance or transport closure.
- Effect size below the uncertainty threshold.
- Indistinguishability from rival mechanisms.
- Numerical convergence failures or model-ordering violations.

## Validity Checks

- **Confounding:** Check whether density, heating, impurities, equilibrium drift, boundary conditions, or diagnostic degradation co-vary with the proposed mechanism.
- **Timing:** Ensure the proposed cause precedes the effect beyond synchronization uncertainty.
- **Spatial specificity:** Confirm localization to the proposed coupling region rather than a global response.
- **Controls:** Verify negative controls remain negative and positive controls behave as expected.
- **Reproducibility:** Require recurrence across events, cases, or equivalent sensitivity studies.
- **Model consistency:** Ensure simulations and reduced models remain within their ordering assumptions.
- **Statistical and numerical stability:** Report uncertainty intervals, convergence, and avoid single-event overfitting.
- **Boundary limits:** State the regime, geometry, and profile class where the claim is valid.

## Provenance

Synthesized from cluster 12.2 (observable-driven mechanism discovery and validation). Source skills: pressure-driven-mhd-relaxation-research, magnetic-fusion-sdc-core-barrier-workflow, tokamak-disruption-exploration-workflow, sol-turbulence-conditional-averaging, kinetic-stability-research-workflow, plasma-shear-transport-exploration, stellarator-mhd-island-equilibrium-workflow, stellarator-magnetic-optimization-workflow.
