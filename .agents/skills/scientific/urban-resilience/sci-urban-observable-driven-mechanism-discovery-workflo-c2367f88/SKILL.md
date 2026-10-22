---
name: sci-urban-observable-driven-mechanism-discovery-workflo-c2367f88
description: A reusable end-to-end workflow for proposing research questions, discriminating mechanistic hypotheses, and validating causal claims through controlled comparison, multi-layered analysis, and iterative refinement across physical and socio-environmental systems.
scienceevolve-title: "Urban hazard resilience · observable driven mechanism discovery workflow"
scienceevolve-area: urban-hazard-resilience
---

# Purpose

Help an agent convert an observable puzzle or performance gap into a testable mechanistic claim using a reproducible research pattern. The workflow separates mechanism discovery from implementation specifics, emphasizing controlled comparison, component validation, and iterative hypothesis refinement rather than single-study conclusions.

# When to use

Use this skill when the task involves:

- Explaining unresolved variability, emergent behavior, or performance gaps in a target system.
- Generating new research questions and discriminating between competing causal mechanisms.
- Designing comparative studies, simulations, or mixed-methods validations that isolate a proposed mechanism.
- Iterating on a hypothesis after model-data mismatch, unexpected local behavior, or weak discrimination between candidate mechanisms.

Do not use this skill for operational execution, safety-critical directives, or as a substitute for domain-certified engineering or policy decisions.

# Inputs required

Ask for or identify:

1. **Observable puzzle**: the target phenomenon, its variability, and why existing explanations are insufficient.
2. **System boundary**: the spatial, temporal, or structural scope; what is included, excluded, and simplified.
3. **Candidate mechanisms**: plausible causal chains linking drivers, intermediate processes, and observables.
4. **Available evidence**: prior data, benchmarks, literature, or validated sub-models relevant to the target system.
5. **Resources and constraints**: modeling tools, experimental platforms, data access, computational limits, and ethical or safety boundaries.
6. **Baseline and controls**: configurations where the mechanism is absent, known to operate, or expected to behave differently.
7. **Success criteria**: metrics for global behavior, local mechanism signatures, robustness, and practical significance.
8. **Extrapolation limits**: the range of systems, scales, or conditions for which conclusions may be valid.

# Core Workflow

Follow this ordered route. At each decision gate, stop and revise if the condition is not met.

1. **Frame the gap and observable puzzle**
   - State what varies, under what conditions, and what current explanations miss.
   - Define the final observable and the relevant timescale or spatial scale.
   - **Decision gate**: If the puzzle cannot be expressed as a specific observable discrepancy, stop and refine the question before proceeding.

2. **Map the causal chain and generate hypotheses**
   - Decompose the system into drivers, intermediate processes, and observables.
   - For each candidate mechanism, specify:
     - Evidence strength (high / medium / low / insufficient).
     - Key assumptions required for the mechanism to operate.
     - Predicted signature in global and local metrics.
     - Likely failure modes and confounders.
     - Minimal viable test and stop conditions.
   - Prioritize falsifiable hypotheses that isolate one dominant mechanism.
   - **Decision gate**: If no hypothesis can be tested with available resources, stop and scope down the study.

3. **Design the controlled study**
   - Define system boundaries, units of analysis, and intentional simplifications.
   - Specify interventions that activate or modify the suspected mechanism.
   - Establish controls:
     - **Baseline**: the simplest comparable system.
     - **Negative control**: mechanism absent or disabled.
     - **Positive control**: known configuration where the mechanism should operate.
     - **Sensitivity controls**: alternative assumptions, parameters, or boundary conditions.
   - Define independent, dependent, and nuisance variables.
   - Pre-register evaluation metrics (global, local, robustness) and stop conditions.
   - **Decision gate**: If controls cannot isolate the mechanism from confounders, redesign before executing.

4. **Validate components independently**
   - Validate each subsystem against independent data or benchmarks before interpreting coupled or composite results.
   - Document preprocessing, alignment, and known artifacts.
   - **Decision gate**: If baseline or component validation fails, stop and revise assumptions; do not attribute baseline error to the mechanism.

5. **Execute the comparative analysis**
   - Run intervention and control cases under identical conditions.
   - Analyze in layers:
     - **Global response**: compare aggregate behavior across cases.
     - **Local mechanism inspection**: examine stress, strain, flux, damage, error, or redistribution patterns.
     - **Sensitivity and uncertainty**: propagate parameter and assumption uncertainty.
     - **Residual diagnostics**: inspect discrepancies by subgroup, region, or time interval.
   - **Decision gate**: If results depend mainly on unverified assumptions or narrow tuning, stop and flag the claim as inconclusive.

6. **Classify the evidence**
   - **Supported**: independent diagnostics agree and controls rule out trivial explanations.
   - **Partially supported**: improvement appears in some metrics or contexts but not others.
   - **Unsupported**: no improvement over baseline, or negative controls perform similarly.
   - **Inconclusive**: validation gaps, sensitivity, or artifacts prevent interpretation.
   - **Decision gate**: If inconclusive, improve comparability or validation before iterating on the mechanism.

7. **Iterate and refine**
   - **If supported**: narrow the claim; test a harder boundary condition, independent validation unit, or stronger control.
   - **If partially supported**: identify which context or subsystem drives the effect; design an ablation targeting that specific link.
   - **If unsupported**: revise the causal map, check for omitted mechanisms, misaligned boundaries, or incorrect proxy relationships.
   - **If inconclusive**: strengthen controls, collect missing data, or reduce scope.
   - Change one major component at a time (hypothesis, input set, model structure, or boundary condition).
   - **Stop condition**: Abandon or radically reframe the research question if two consecutive iterations fail to produce discriminating evidence.

8. **Bound the claim and document provenance**
   - State what is directly supported, what is inferred, and what remains untested.
   - Define applicability boundaries (system type, scale, parameter range, data quality).
   - Record all assumptions, model versions, preprocessing steps, and source-skill lineage.
   - **Decision gate**: If claims require extrapolation beyond tested boundaries, downgrade them to hypothesis or candidate explanation.

# Output Format

When using this skill, return:

1. **Research question**: concise statement of the observable puzzle and its significance.
2. **Hypothesis table**: columns for hypothesis, evidence strength, key assumptions, predicted signature, likely failure mode, minimal viable test, and boundary.
3. **Study design**: system boundary, interventions, controls, variables, metrics, and stop conditions.
4. **Analysis plan**: component validation checks, layered comparison protocol, sensitivity tests, and residual inspection rules.
5. **Evidence classification**: outcome status (supported / partially supported / unsupported / inconclusive) with justification.
6. **Iteration roadmap**: next test, revised hypothesis, or scope change based on the evidence class.
7. **Validity and boundary statement**: confounders, reproducibility requirements, generalization limits, and safety or ethical constraints.

# Validation Gates

- **Component realism**: Baseline and subsystem outputs match independent observations or accepted benchmarks.
- **Control adequacy**: Negative and positive controls successfully isolate the mechanism from confounders.
- **Mechanism specificity**: The same result cannot be explained by baseline tuning, boundary changes, or a competing driver.
- **Sensitivity stability**: Conclusions survive plausible changes in assumptions, parameters, boundary conditions, and discretization choices.
- **Local-global consistency**: Global improvements are not achieved through unacceptable local degradation or hidden trade-offs.
- **Out-of-sample robustness**: Claims hold on independent validation units, not only on training or fitting intervals.
- **Reproducibility**: Inputs, preprocessing, configurations, and excluded intervals are fully documented.

# Claim Boundaries

- Distinguish paper-verified patterns from new inferences generated for the target system.
- Limit causal claims to the tested system boundary, scale, and parameter range.
- Treat spatial association, correlation, and model agreement as distinct from proven causal mechanism.
- Do not present a single successful model run, composite index, or scenario comparison as field-wide consensus.
- Label model-inferred findings separately from directly validated observations.

# Failure Modes

- **Confounded intervention**: Multiple mechanisms change simultaneously; the true driver is unidentified.
- **Baseline error**: Component or baseline validation fails, yet results are interpreted as mechanism effects.
- **Overfitting to context**: Conclusions rely on narrow tuning, specific geometry, or non-transferable boundary conditions.
- **Proxy misalignment**: Intermediate proxy does not capture the intended process, leading to false causal links.
- **Scale mismatch**: Point, local, and aggregate scales are incompatible, producing artifactual patterns.
- **Data leakage**: Training and test information overlap spatially, temporally, or through derived features.
- **Extrapolation risk**: Claims extend beyond the validated range of drivers, systems, or conditions.
- **Operational misuse**: Research outputs are treated as emergency instructions, design certifications, or safety-critical directives.

# Validity Checks

Before finalizing any output, verify:

- The observable puzzle is stated as a specific gap, not a broad topic.
- Hypotheses are ranked by evidence strength and include explicit failure modes.
- Controls are designed to falsify the hypothesis, not merely confirm it.
- Component validation precedes coupled interpretation.
- Metrics include global, local, and robustness dimensions.
- Sensitivity analysis covers assumptions, parameters, and boundary conditions.
- Spatial or temporal dependence is accounted for in inference.
- Missing data, outliers, and artifacts are documented and do not systematically bias results.
- Reproducibility artifacts (splits, seeds, versions, scripts) are recorded.
- Generalization boundaries are explicitly stated.
- Safety, privacy, and ethical constraints are respected; vulnerable populations and critical infrastructure are treated as protected stakeholders.

# Provenance

This skill was synthesized from cluster 7 (subcluster 7.0) of the scientific skills codex. It merges shared workflow structure from the following source skills: nonstraight-steel-frame-seismic-exploration, seismic-composite-coupling-beam-research-workflow, urban-flood-traffic-exploration, seismic-reservoir-spatiotemporal-research, urban-flood-resilience-workflow, jovian-radiation-belt-research-pattern, urban-flood-resilience-exploration, and compound-flood-research-workflow. Source-specific systems, parameters, numerical results, and paper conclusions have been removed to produce a domain-agnostic mechanism-discovery pattern.
