---
name: sci-fusion-stellarator-plasma-mechanism-discovery-workf-85ded828
description: A reusable workflow to generate, test, and bound mechanism hypotheses in stellarator and magnetic-confinement plasma research using coupled-channel diagnostics, controlled comparisons, and iterative validation.
scienceevolve-title: "Magnetic confinement fusion · stellarator plasma mechanism discovery workflow"
scienceevolve-area: magnetic-confinement-fusion
---

## Purpose

Help an agent turn a plasma confinement or transport bottleneck into a structured, testable research plan. The workflow teaches a reusable method: reframe the bottleneck as a coupled multi-channel mechanism problem, derive discriminating diagnostics, design controlled comparisons with explicit decision gates, and iterate until claims are bounded by evidence.

## When to use

Use when the user asks to propose new research questions, hypotheses, simulation studies, or optimization targets in stellarator, heliotron, torsatron, heliac, or related magnetic-confinement systems. It is appropriate for transport, confinement, stability, impurity exhaust, profile control, current-drive, and configuration-optimization problems where a standard proxy may hide coupled side effects.

## Inputs required

Ask for or infer the following before producing a plan:

- Target system class and magnetic-topology family.
- Primary performance objective and neglected side-channel concern.
- Candidate mechanism variables and available modeling or diagnostic tools.
- Baseline and candidate configurations or regimes to compare.
- Profile, source, and boundary assumptions that may affect the side channel.
- Primary and secondary evaluation metrics, including mechanism diagnostics and final outcome metrics.
- Hard constraints, model validity ranges, and non-operational safety boundaries.

## Core Workflow

1. **Reframe the bottleneck as a coupled-channel problem**
   - Identify the standard optimization proxy and the side channel it may worsen.
   - Define primary objectives, secondary objectives, and hard constraints.
   - **Decision Gate 1 — Scope Check:** Stop if the question cannot be framed as a falsifiable mechanism claim, or if answering it requires operational execution beyond research planning.

2. **Map mechanism layers and generate hypotheses**
   - Decompose the system into mechanism layers (geometry, transport, stability, boundary).
   - Produce at least three hypotheses. For each, state: concise causal claim, rationale, evidence strength (Strong / Moderate / Weak / Speculative), key assumptions, possible failure modes, minimal discriminating test, and boundary conditions.
   - Include hypothesis families such as coupling-ratio, route-specific, hidden-field or feedback, trade-off, and robustness hypotheses.
   - **Decision Gate 2 — Feasibility Check:** Stop if no hypothesis can be falsified with available diagnostics or simulations, or if minimal tests require unsafe or unauthorized operational procedures.

3. **Design controlled comparisons**
   - Define independent, mediating, dependent, and confounding variables.
   - Build a candidate matrix: baseline, descriptor-only, actuator-compensated, off-nominal, negative control, positive control, and boundary or ablation control.
   - Predefine mechanism metrics (intermediate drive variables) and outcome metrics (integrated, source-normalized performance indicators).
   - Specify minimal viable validation (smallest discriminating comparison) and strong validation (multi-case, multi-diagnostic, cross-assumption).
   - **Decision Gate 3 — Control Adequacy:** Stop if controls are absent, confounds are unaddressed, or diagnostic uncertainty is comparable to the expected effect.

4. **Execute simulations or conceptual experiments**
   - Run comparisons under documented assumptions and convergence criteria.
   - Record metadata, fixed parameters, and model validity ranges.
   - Maintain non-operational scope; do not produce executable device settings.

5. **Analyze mechanism before outcome**
   - Normalize by system class, regime, and diagnostic convention before comparing.
   - Evaluate mechanism metrics first; interpret outcome metrics only if mechanism metrics move as predicted.
   - Decompose contributions (for example, diffusive, convective, force-driven) and inspect residuals by subgroup or regime.
   - Check co-occurrence of predicted signatures across core, edge, and boundary observables.
   - **Decision Gate 4 — Mechanism-Outcome Consistency:** If mechanism metrics move but outcomes do not improve, investigate masking effects (source profiles, auxiliary transport, hidden feedbacks) before iterating. If outcomes improve but mechanism metrics do not move, search for alternative coupling variables and downgrade the original hypothesis.

6. **Test robustness and bound the claim**
   - Vary secondary assumptions: equilibria, source profiles, auxiliary transport, impurity species class, or operating state.
   - Reject routes that improve the side channel by degrading primary objectives.
   - Assess sensitivity to model assumptions and boundary conditions.
   - **Decision Gate 5 — Generalizability Check:** If results reverse under off-nominal conditions or depend on a single case or diagnostic, treat findings as candidate-specific. Expand the comparison set or stop.

7. **Iterate and decide**
   - Update evidence strength for each hypothesis based on results.
   - Decide: pursue (escalate to higher-fidelity validation), revise (reframe coupling variable or target), defer (await better controls or diagnostics), or reject (mechanism unsupported).
   - Record the decision rationale, failed predictions, and next minimum validation.
   - **Stop Condition:** Terminate iteration if new candidates repeat the same trade-off without changing the decision, if hard constraints are violated, if model-validity checks fail, or if safety or compliance limits are approached.

8. **Package claims with boundaries**
   - Separate verified, inferred, and speculative conclusions.
   - State the boundary conditions (regime, geometry, collisionality) under which claims apply.
   - Document negative results and failure modes explicitly.

## Output Format

Return the following structure:

1. **Research question** — Target system class, bottleneck, standard proxy, neglected side channel, and candidate control variable.
2. **Candidate hypotheses** — At least three hypotheses with evidence strength, key assumptions, failure modes, and minimal tests.
3. **Coupling mechanism** — Proposed diagnostic, expected direction of change, and causal chain linking proxy to side channel.
4. **Study design** — Variables, candidate matrix, controls, mechanism metrics, outcome metrics, minimal viable validation, strong validation, and stop conditions.
5. **Analysis plan** — Normalization rules, decomposition of contributions, residual diagnostics, robustness checks, and uncertainty handling.
6. **Iteration plan** — Rules for strengthening, weakening, simplifying, or reframing hypotheses based on outcome scenarios.
7. **Validity and safety notes** — Confounding checks, reproducibility requirements, boundary conditions, and non-operational safety limits.

## Validation Gates

- **Gate 1 — Scope Check:** The problem must be expressible as a falsifiable mechanism claim within a research-planning or simulation scope.
- **Gate 2 — Feasibility Check:** Every hypothesis must have a minimal test that is achievable without unsafe or unauthorized operational procedures.
- **Gate 3 — Control Adequacy:** The design must include baseline, negative, and mechanism controls; confounds must be addressable; diagnostic resolution must exceed expected effect size.
- **Gate 4 — Mechanism-Outcome Consistency:** Mechanism metrics and outcome metrics must either co-vary as predicted or trigger an explicit alternative-explanation search.
- **Gate 5 — Generalizability Check:** Conclusions must survive an off-nominal or multi-case probe before being treated as general.

## Claim Boundaries

- Distinguish paper-supported observations, user-supplied evidence, model-based inferences, and new agent-generated hypotheses.
- Label claims as **Verified** (directly supported by provided data or authorized evidence), **Inferred** (mechanistically plausible but not independently tested), or **Speculative** (dependent on multiple unverified assumptions).
- Do not treat single-device, single-campaign, or simulation-only results as field-wide consensus.
- State the data envelope for every claim and separate interpolation from extrapolation.

## Failure Modes

- Mechanism is masked by confounding variables (heating scenario, fueling path, wall condition, impurity source, diagnostic drift).
- Improvement in one channel comes from degrading another channel rather than from the intended mechanism.
- Favorable intermediate diagnostic movement does not translate to final outcome improvement.
- Results are highly sensitive to a single untested assumption (profile shape, boundary condition, auxiliary transport model).
- A hidden feedback loop or new resonance appears when the primary degradation mode is suppressed.
- Diagnostic uncertainty or numerical noise is comparable to the expected effect.

## Validity Checks

- **Confounding:** Verify that heating, fueling, magnetic configuration, wall condition, diagnostic calibration, and preprocessing are matched across candidates, or explicitly model drift.
- **Mechanism separation:** Report transport or drive contributions separately rather than as a single aggregated coefficient.
- **Outcome relevance:** Require source-normalized, integrated, or residence-corrected metrics; avoid relying solely on local profile values.
- **Reproducibility:** Document model choices, input assumptions, metric definitions, comparison structure, and event-window criteria.
- **Statistical validity:** Report variability, uncertainty intervals, and sensitivity to stationarity or ensemble selection; avoid overclaiming small differences.
- **Boundary conditions:** State the collisionality, geometry, impurity charge, transport-regime, and model-assumption boundaries under which conclusions apply.
- **Control adequacy:** Confirm that baseline, negative, positive, and mechanism controls are present or explicitly justified if absent.

## Provenance

- Synthesized from cluster 13.1 (observable-driven mechanism discovery and validation).
- Source skills: stellarator-impurity-transport-optimization; stellarator-configuration-transport-stability-exploration; stellarator-configuration-research-workflow; stellarator-regime-exploration; magnetic-fusion-isothermal-exploration; magnetic-confinement-transition-exploration; stellarator-confinement-scaling-research; plasma-density-profile-magnetic-island-exploration.
