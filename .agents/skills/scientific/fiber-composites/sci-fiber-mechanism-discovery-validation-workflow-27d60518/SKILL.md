---
name: sci-fiber-mechanism-discovery-validation-workflow-27d60518
description: A cross-domain workflow for discovering, discriminating, and validating hidden mechanisms using multi-source evidence, controlled comparisons, and iterative hypothesis updating.
scienceevolve-title: "Fiber composites and battery materials · mechanism discovery validation workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

Use this skill to turn an ambiguous observation, performance gap, or system behavior into a structured mechanism-discovery problem. The workflow guides the generation of competing, falsifiable hypotheses; the design of minimal validations using independent evidence sources; and the iterative updating of interpretations while bounding claims within evidence limits.

## When to use

Use this skill when a user asks to:
- Explain an anomaly or unexpected trend in a physical, engineered, computational, or observational system.
- Discriminate between competing hidden processes, states, or pathways.
- Validate whether a proposed mechanism is consistent with multi-source evidence.
- Design experiments or analyses that distinguish causes rather than optimize outcomes alone.
- Connect disparate signals—such as tracers, images, spectra, simulations, transport properties, or relational patterns—into a coherent mechanism model.

## Inputs required

- **Target system and ambiguity:** the specific behavior, discrepancy, or gap to be explained.
- **Evidence inventory:** available independent signals, observables, or data sources that can constrain the mechanism.
- **Prior constraints:** known physical limits, calibration assumptions, selection biases, or environmental boundaries.
- **Candidate mechanisms:** existing hypotheses to evaluate, or a request to generate new ones.
- **Evaluation priorities:** whether the goal is discrimination, validation, robustness testing, or extrapolation.
- **Acceptable uncertainty:** thresholds for evidence strength, statistical confidence, or model agreement required to advance a claim.

## Core Workflow

Follow this ordered route. Treat each numbered step as a gate; do not proceed to the next gate until the current one satisfies its exit condition.

### 1. Anomaly framing and evidence inventory
- State the observed discrepancy and why it matters.
- List all available evidence sources that are independent in measurement principle (e.g., morphology vs. kinematics, steady-state vs. time-resolved, macroscopic vs. microscopic).
- Flag known confounders, calibration artifacts, selection effects, and missing data.
- **Exit gate:** The ambiguity is defined as a specific, answerable question; at least two independent evidence sources are available or obtainable.

### 2. Mechanism hypothesis generation
- Map the system into states, pathways, or variables: capture, transfer, storage, loss, interface, or interaction nodes.
- Generate at least three competing hypotheses:
  - A mechanism-driven hypothesis proposing a specific causal pathway.
  - A calibration, artifact, or hidden-state hypothesis.
  - A null or alternative-process hypothesis.
- For each hypothesis, record:
  - Expected observational signature per evidence source.
  - Key physical or logical assumptions.
  - Likely failure modes.
  - Evidence strength (strong / moderate / weak / speculative).
- **Exit gate:** Every hypothesis is falsifiable by at least one observable; no single hypothesis is treated as default truth.

### 3. Validation design
- Define a minimal viable validation using the smallest set of variables, controls, and measurements that can discriminate the leading hypotheses.
- Specify:
  - **Independent variables:** the factor(s) expected to alter the mechanism.
  - **Dependent variables:** the readouts tied to each hypothesis.
  - **Controls:** baseline, negative, positive, process, and geometry controls matched across conditions.
  - **Metrics:** primary performance or population metrics and secondary mechanism indicators.
  - **Stop conditions:** pre-defined criteria for rejecting, advancing, or redesigning a hypothesis (e.g., failure to outperform baseline, inconsistency across tracers, unsupported assumptions).
- **Decision gate:** If the minimal validation is infeasible, return to Step 2 and reformulate hypotheses or reduce scope.

### 4. Multi-source analysis and uncertainty propagation
- Preprocess all evidence sources consistently; preserve uncertainty flags and quality cuts.
- Apply calibration conversions explicitly; do not embed assumptions in black-box steps.
- Compare independent estimators of the same latent quantity before pooling.
- Propagate uncertainty through every conversion; run sensitivity tests on dominant systematics.
- **Exit gate:** Quantified agreement or disagreement exists between independent evidence channels; outliers are flagged, not suppressed.

### 5. Mechanism discrimination
- Score each hypothesis against the evidence:
  - **Support:** independent indicators align with predicted signatures.
  - **Weaken:** only one indicator aligns, or alignment is marginal.
  - **Falsify:** a predicted signature is contradicted by a decisive control or tracer.
- If multiple hypotheses remain viable, identify the smallest next experiment or observation that would break the degeneracy.
- **Decision gate:** If no hypothesis can be distinguished, pause interpretation and return to Step 3 to add diagnostics or tighten controls.

### 6. Iteration or redesign
- If a hypothesis is falsified, remove it and generate replacements if needed.
- If a hypothesis is partially supported, narrow its scope and update evidence strength.
- If hidden states or calibration artifacts dominate, redesign the validation around the largest uncertainty.
- If results are inconclusive, determine whether the design lacked power before expanding data collection.
- **Iteration rule:** Each cycle must update the hypothesis table with revised assumptions, evidence strength, and the next minimal validation step.
- **Stop condition:** Stop iterating when a hypothesis survives robustness checks, independent tracers converge, and claim boundaries are stable; or when feasibility, safety, or resource limits are reached.

### 7. Claim bounding and output packaging
- State what the evidence directly shows versus what is inferred.
- Label each claim with its applicable boundary: sample, regime, tracer class, resolution, or model assumption.
- Document failure modes, unresolved ambiguities, and conditions under which the conclusion would not hold.
- **Final gate:** No claim exceeds the weakest link in the evidence chain; all extrapolations are explicitly labeled as hypotheses.

## Output Format

When using this skill, return:

1. **Research question:** the anomaly and why it is tractable.
2. **Evidence map:** independent sources, their roles, and known limitations.
3. **Hypothesis table:** ranked hypotheses with evidence strength, key assumptions, expected signatures, and failure modes.
4. **Validation plan:** variables, controls, metrics, and stop conditions.
5. **Analysis plan:** preprocessing, calibration chain, estimator comparison, uncertainty propagation, and sensitivity tests.
6. **Iteration log:** how results update, reject, or reprioritize hypotheses at each cycle.
7. **Claim boundary statement:** scope limits, confounders, reproducibility needs, and residual risks.

## Validation Gates

Before accepting any conclusion, verify:
- **Control validity:** Baseline, negative, and positive controls are present and matched.
- **Tracer independence:** At least two evidence channels with different measurement principles converge on the same latent quantity.
- **Calibration consistency:** Every derived quantity has an explicit conversion assumption and, where possible, an internal check.
- **Statistical validity:** Uncertainty is propagated; outliers are handled by predefined rules; sensitivity tests target dominant systematics.
- **Reproducibility:** Sample criteria, exclusions, assumptions, and quality flags are documented for independent rerun.

## Claim Boundaries

- Treat single-system or single-study results as evidence for that system only, not as field-wide consensus.
- Distinguish direct observation from supported inference, weak inference, and speculation.
- Limit mechanistic claims to the tested regime, sample, tracer set, and model assumptions.
- Label agent-generated extensions to new systems, materials, or domains as hypotheses requiring independent validation.

## Failure Modes

- **Hypothesis failure:** A candidate mechanism is contradicted by a decisive control or independent tracer.
- **Convergence failure:** Independent estimators disagree beyond expected uncertainty, indicating hidden states, calibration errors, or unresolved confounders.
- **Design failure:** The validation lacks discriminative power; competing models predict identical observables.
- **Extrapolation failure:** Claims are generalized beyond the tested boundary without new evidence.
- **Iteration stall:** Results remain inconclusive after multiple cycles due to insufficient data, excessive noise, or fundamental degeneracy.

## Validity Checks

- **Question validity:** Does the research question name a specific process, system, and comparison?
- **Mechanistic validity:** Does each hypothesis have a clear causal or logical link to the evidence?
- **Confounding audit:** Have calibration artifacts, selection bias, instrument limits, and environmental sensitivity been considered?
- **Robustness:** Do conclusions survive under stratification, parameter variation, and missing-data scenarios?
- **External validity:** Are comparisons with benchmarks performed using matched assumptions?
- **Consensus discipline:** Is prior work treated as supporting evidence rather than automatic proof?

## Provenance

- Synthesized from cluster `37.0` (mechanism discovery and validation).
- Source skills referenced for pattern extraction:
  - `debris-disk-gas-cycle-exploration`
  - `multimodal-tit-research-workflow`
  - `embedded-protostar-outflow-exploration`
  - `hybrid-reinforced-geopolymer-durability-explorer`
  - `tracer-abundance-research-workflow`
  - `composite-interlaminar-toughening-research`
  - `dicke-quantum-battery-dark-state-exploration`
  - `heterogeneous-relation-recommendation-exploration`
- No source-specific systems, materials, parameters, or numerical conclusions are embedded in the reusable workflow body.
