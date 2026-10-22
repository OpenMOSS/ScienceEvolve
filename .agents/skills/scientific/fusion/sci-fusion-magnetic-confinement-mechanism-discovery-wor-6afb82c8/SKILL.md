---
name: sci-fusion-magnetic-confinement-mechanism-discovery-wor-6afb82c8
description: A reusable end-to-end research workflow for generating falsifiable hypotheses, designing controlled validation studies, and iterating from multi-diagnostic evidence to bounded mechanism claims in magnetic-confinement plasma physics.
scienceevolve-title: "Magnetic confinement fusion · magnetic confinement mechanism discovery workflow 5"
scienceevolve-area: magnetic-confinement-fusion
---

# Purpose

Use this skill to drive observable-driven mechanism discovery and validation in magnetic-confinement plasma research. It provides a structured, reusable route from an unexplained phenomenon or profile change to ranked, falsifiable hypotheses, staged validation, multi-diagnostic analysis, and bounded mechanistic claims—without prescribing device-specific operational parameters.

# When to use

Use this skill when the user needs to:
- Frame a research question around an unexplained plasma state transition, profile evolution, transport change, or confinement response.
- Generate competing mechanism hypotheses with explicit evidence strength, assumptions, and failure modes.
- Design a non-operational validation plan with strong controls, independent diagnostics, and predefined stop conditions.
- Analyze multi-channel time-series or profile data to discriminate among candidate mechanisms.
- Iterate from partial or contradictory evidence toward revised hypotheses and boundary maps.

Do not use this skill to provide executable operating instructions, hazardous parameter recipes, or facility-specific run procedures.

# Inputs required

Before using the skill, collect or infer:
- Target device class and magnetic configuration (e.g., stellarator, tokamak, reversed-field pinch) at a conceptual level.
- Observable phenomenon to explain: transition boundary, profile anomaly, transport trend, fluctuation signature, or confinement change.
- Available diagnostic categories (magnetic, radiative, profile, fluctuation, transport proxy, boundary/target) and known coverage gaps.
- Baseline or reference state description and known confounders (wall history, impurity content, heating mix, geometry variation).
- Safety and authorization constraints that bound what may be proposed at the design level.
- Prior models or null hypotheses to compare against.

# Core Workflow

1. **Frame the observable gap**
   - State the unexplained phenomenon and why existing explanations are insufficient.
   - Define the observable boundary: target state, baseline, and overload/non-recovery indicators.
   - **Gate 1 (Candidate gate):** Is the phenomenon defined with measurable observables and a falsifiable gap? If no, refine the question before proceeding.

2. **Generate competing mechanism hypotheses**
   - Map the mechanism chain from driver to intermediate state to global response.
   - For each hypothesis, specify predicted observables, falsifying observations, evidence strength (exploratory / plausible / supported / demonstrated), key assumptions, and failure modes.
   - Include a null or common-drive hypothesis.
   - **Gate 2 (Candidate gate):** Are at least two competing hypotheses generated with distinct predicted signatures? If no, expand the mechanism map.

3. **Design minimal viable validation**
   - Define the smallest safe test: baseline interval, perturbation or contrast case, recovery interval, and predefined stopping conditions.
   - Select variables: driver-like, transition marker, feedback/response, control, and confounder variables.
   - Build strong controls: baseline, negative (absent driver), positive (known response), boundary (near threshold), and diagnostic controls.
   - Define layered metrics: perturbation delivery, intermediate state, transport proxy, global response, recovery, and mechanism consistency.
   - Define stop conditions: loss of control, diagnostic conflict, confounder dominance, non-recovery, or safety boundary breach.
   - **Gate 3 (Stability gate):** Are controls sufficient to separate mechanism from artifact, and are stop conditions explicit? If no, redesign before execution.

4. **Acquire and preprocess data (conceptual)**
   - Verify calibration, synchronization, spatial/temporal coverage, and data quality flags.
   - Document exclusions and missing channels.
   - **Gate 4 (Stability gate):** Is diagnostic quality sufficient to test the mechanism? If no, pause for diagnostic closure.

5. **Analyze with mechanism discrimination**
   - Establish baseline comparison and temporal ordering of events.
   - Classify response regimes (baseline, prompt-only, transient, sustained, overload, ambiguous).
   - Cross-check diagnostics: require independent diagnostic categories to agree before claiming a mechanism.
   - Separate direct evidence from inference; report measured quantities separately from inferred transport or stability changes.
   - Quantify uncertainty and compare with theory/models cautiously (consistency check, not replacement for data).
   - **Gate 5 (Mechanism exclusion):** Can alternative explanations (common drive, diagnostic artifact, confounder) be ruled out? If no, downgrade claim strength.

6. **Bound the claim and assess robustness**
   - Grade evidence: strong (repeated, multi-diagnostic, controlled), moderate (effect present but controls incomplete), weak (single scenario), or contradictory.
   - State claim boundaries: limited to tested configuration, regime, and perturbation class.
   - Map boundaries: use overload or non-recovery to define the edge of the beneficial/regime mechanism.
   - **Gate 6 (Robustness gate):** Does the mechanism explain both successful and failed cases? If no, narrow or split the hypothesis.

7. **Iterate or terminate**
   - Identify the weakest mechanism link (perturbation, profile change, transport response, global response, recovery).
   - Update hypothesis: revise mechanism, add missing variable, or restrict boundary condition.
   - Choose next test: add one control, diagnostic, or perturbation variable at a time.
   - Record iteration: prior hypothesis, new evidence, revised hypothesis, remaining assumptions, new failure mode.
   - **Gate 7 (Iteration gate):** Is there a decisive next test that can upgrade or reject the hypothesis? If no and evidence is weak, stop and report inconclusive.
   - **Termination conditions:** hypothesis is rejected, upgraded to demonstrated, or no feasible test remains within safety/authorization bounds.

# Output Format

When using this skill, produce results in this structure:

```markdown
## Research Question
- Observable gap:
- Why existing explanations fail:

## Hypotheses
| ID | Mechanism | Predicted observables | Evidence strength | Key assumptions | Failure modes |
|---|---|---|---|---|---|
| H1 | ... | ... | ... | ... | ... |

## Validation Plan
- Minimal viable validation:
- Controls (baseline / negative / positive / boundary / diagnostic):
- Variables:
- Metrics:
- Stop conditions:

## Analysis Plan
- Baseline and temporal ordering:
- Regime classification:
- Diagnostic cross-checks:
- Uncertainty quantification:
- Model consistency checks:

## Claim Boundary Statement
- What is directly supported:
- What is inferred:
- What remains untested:
- Extrapolation limits:

## Iteration Record
- Weakest link:
- Revised hypothesis:
- Next decisive test:
- Boundary information:
```

# Validation Gates

1. **Candidate Gate — Observable Falsifiability:** The research question must be framed as a measurable gap with at least one falsifiable prediction before hypothesis generation proceeds.
2. **Candidate Gate — Hypothesis Diversity:** At least two competing hypotheses with distinct predicted signatures must be present before validation design proceeds.
3. **Stability Gate — Control Adequacy:** The design must include baseline, negative, and diagnostic controls sufficient to separate mechanism from artifact; otherwise redesign.
4. **Stability Gate — Diagnostic Closure:** Independent diagnostic categories must cover the proposed mechanism chain; if coverage is missing, pause for diagnostic addition or hypothesis narrowing.
5. **Mechanism Exclusion Gate:** Alternative explanations (common drive, confounder, artifact) must be actively ruled out; if they cannot, the claim is downgraded to correlation or speculative.
6. **Robustness Gate — Cross-Case Consistency:** The mechanism must explain both confirming and non-confirming cases within the tested boundary; otherwise split or narrow the hypothesis.
7. **Iteration Gate — Decisive Next Test:** Every iteration must specify a single decisive experiment or analysis that can upgrade or falsify the hypothesis; if none exists, terminate with an inconclusive boundary.

# Claim Boundaries

- Treat single-device or single-configuration results as evidence for a mechanism in that context, not as domain-wide consensus.
- Distinguish paper-validated reasoning, new-system inference, and speculative analogy in every output.
- Separate direct measurement from inferred transport, instability, or confinement-state changes.
- Do not generalize beyond the tested magnetic topology, heating pathway, density/temperature window, and perturbation class without independent validation.
- Mark overload, non-recovery, or degradation regimes as boundary-defining information, not merely negative outcomes.

# Failure Modes

- **Diagnostic uncertainty:** Calibration drift, limited spatial coverage, timing misalignment, or single-channel ambiguity.
- **History effects:** Prior wall state, accumulated impurities, or conditioning memory confound perturbation response.
- **Confounder dominance:** Uncontrolled density, temperature, heating mix, or geometry variation mimics the target mechanism.
- **Regime mixing:** Averaging transient, sustained, and overload responses obscures mechanism boundaries.
- **Compensatory transport:** A local change is masked by global compensation or alternative loss channels.
- **Model overreach:** Using theoretical models to replace missing diagnostics or claiming mechanism demonstration from qualitative model agreement alone.
- **Safety/authorization breach:** Proposed validation requires operational parameters or procedures outside approved bounds.

# Validity Checks

Before presenting a result or proposal, verify:
- Direct measurements are separated from inferred mechanisms.
- Controls are sufficient to rule out prior-state, wall-history, impurity-accumulation, diagnostic-drift, and common-drive explanations.
- Response regimes are separated rather than averaged together.
- Uncertainty and calibration limits are reported.
- Independent diagnostics are available for the key mechanism link.
- Stopping conditions are defined for non-recovery, accumulation, diagnostic conflict, and confounder dominance.
- Conclusions are bounded by the tested magnetic configuration, machine state, and perturbation class.
- All hypotheses are labeled with evidence strength, key assumptions, and possible failure modes.
- Cross-device or cross-regime comparisons are normalized and metadata-complete; avoid anecdotal generalization.

# Provenance

- Synthesized from cluster 1.1 (observable-driven mechanism discovery and validation).
- Source skill references: `plasma-profile-actuation-research`, `magnetic-edge-feedback-exploration`, `stellarator-long-pulse-research-planning`, `magnetic-confinement-potential-turbulence-exploration`, `stellarator-diamagnetic-proxy-research`, `dual-wavelength-interferometry-research-design`, `tokamak-disruption-exploration`, `getter-pump-reliability-research-design`.
- Paper-derived operational protocols, numerical parameters, and device-specific conclusions have been excluded per the merge definition.
