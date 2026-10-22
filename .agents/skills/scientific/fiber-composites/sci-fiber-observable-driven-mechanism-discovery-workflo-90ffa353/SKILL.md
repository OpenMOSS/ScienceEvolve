---
name: sci-fiber-observable-driven-mechanism-discovery-workflo-90ffa353
description: Guide agents through an observable-driven, end-to-end mechanism discovery and validation workflow for multifunctional material systems, coupling hypothesis generation, control-rich experimentation, converging evidence analysis, and bounded claim reporting.
scienceevolve-title: "Fiber composites and battery materials · observable driven mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Guide agents to perform observable-driven mechanism discovery and validation for multifunctional material systems. The workflow translates system-level limitations into coupled constraint maps, generates falsifiable hypotheses at bottleneck interfaces, designs minimal experiments with strong controls, and iterates based on converging evidence rather than single-metric optimization.

# When to use

Use this skill when the user asks to:

- Propose new research questions for composite, fiber-reinforced, interfacial, or solid-state material systems where transport, reaction, mechanical, or stability constraints couple.
- Generate mechanism-based hypotheses from a failure mode, performance gap, or review context.
- Design non-operational validation plans with explicit controls, diagnostics, metrics, and stop conditions.
- Diagnose whether an observed improvement arises from the proposed mechanism or from confounding artifacts.
- Iterate on a material architecture when trade-offs appear between performance, stability, and processability.

Do not use for executable laboratory recipes, hazardous procedural instructions, or non-scientific optimization tasks.

# Inputs required

Ask the user or infer from context:

- **Target system class and intended function** (e.g., energy storage, separation, shielding, catalysis).
- **Suspected bottleneck or failure mode** (e.g., interfacial degradation, intermediate migration, transport limitation, mechanical failure).
- **Available evidence**: literature, prior data, computational predictions, or mechanistic assumptions.
- **Practical constraints**: safety limits, scalability needs, environmental boundaries, and characterization access.
- **Task type**: exploratory hypothesis generation, concrete experiment design, evidence evaluation, or iteration planning.

If inputs are missing, state assumptions explicitly and mark conclusions as conditional.

# Core Workflow

## Step 1 — System decomposition and bottleneck identification

1. Decompose the system into interacting constraints: transport, reaction/interconversion, interface/contact, mechanical/structural, and practical/process.
2. Identify the bottleneck coupling where improving one constraint worsens another.
3. **Decision gate**: If no coupling is identified, stop and reformulate the research question.

## Step 2 — Mechanism-to-observable mapping

1. For each candidate mechanism, define the observable signature that would indicate the mechanism is active.
2. Pair every performance metric with a diagnostic that distinguishes mechanism from artifact (e.g., loading effects, contact differences, dilution).
3. **Decision gate**: If a mechanism cannot be linked to a discriminating observable, flag it as non-falsifiable and deprioritize.

## Step 3 — Hypothesis generation

1. Formulate conditional, falsifiable claims: "If [mechanism] dominates, then [design change] should improve [observable] because [reason]."
2. Annotate each hypothesis with: evidence strength, key assumptions, predicted observations, trade-off metrics, possible failure modes, and boundary conditions.
3. Generate at least one alternative hypothesis that attributes the effect to an artifact or confounder.
4. **Decision gate**: If hypotheses lack a clear falsification condition, return to Step 2.

## Step 4 — Experimental design (minimal viable validation)

1. Select one independent variable that directly tests the hypothesis.
2. Define dependent variables:
   - Primary metric decisive for the hypothesis.
   - Secondary metrics that explain why the primary metric changed.
   - Mechanism-specific diagnostic that tests the proposed pathway.
   - Failure/trade-off metric that detects unacceptable penalties.
3. Establish comparators:
   - Baseline (current or unmodified system).
   - Negative control (expected to lack the proposed mechanism).
   - Positive control (known related effect, if available).
   - Component-isolation control (tests individual constituents).
   - Boundary control (tests where the mechanism should weaken or fail).
4. Control confounders: match processing history, geometry, contact conditions, and inactive-material fraction where possible; record variables that cannot be matched.
5. Define stop conditions before evaluation:
   - Stop or redesign if the mechanism-specific diagnostic does not change as predicted.
   - Stop or redesign if a trade-off metric worsens beyond a predefined boundary.
   - Stop or redesign if missing controls make interpretation ambiguous.
6. **Decision gate**: If controls cannot isolate the proposed mechanism, redesign before proceeding.

## Step 5 — Execution and data-quality check

1. Confirm sample identity, preparation context, and measurement conditions.
2. Flag missing controls before interpreting performance.
3. Inspect replicate consistency and outliers.
4. **Decision gate**: If data quality is insufficient or the baseline is unstable, halt and request replication or expert review.

## Step 6 — Evidence-chain analysis

1. Map observations to mechanisms; identify alternative mechanisms that could produce the same observation.
2. Use diagnostics to distinguish among alternatives.
3. Quantify trade-offs: report gains and losses together.
4. Determine whether improvement arises from intrinsic mechanism change or from changed geometry, loading, contact, or inactive fraction.
5. Classify the outcome:
   - **Supported**: primary metric and mechanism-specific diagnostic both improve.
   - **Partially supported**: primary metric improves but mechanism evidence is incomplete.
   - **Ambiguous**: controls or diagnostics are insufficient.
   - **Refuted**: predicted diagnostic does not change while the failure mode persists.
   - **Boundary-limited**: result is valid only under narrow conditions.
6. **Decision gate**: If the outcome is Ambiguous, return to Step 4 to add controls. If Refuted, return to Step 3 to revisit the bottleneck.

## Step 7 — Iteration or redesign

1. If **supported**: strengthen validation under stronger controls or practical boundary conditions.
2. If **partially supported**: add diagnostics or isolate components.
3. If **boundary-limited**: convert the claim into a boundary-condition hypothesis and test broader conditions.
4. If one metric improves and another worsens: reformulate the problem around the coupling and test an interface, architecture, or boundary modification.
5. If all variants fail similarly: question the assumed bottleneck rather than adding design complexity.
6. **Decision gate**: If safety-relevant instability appears, stop and escalate to qualified review.

## Step 8 — Claim bounding and reporting

1. Limit conclusions to tested conditions.
2. Separate direct observation, control-supported inference, model-supported inference, literature analogy, and speculation.
3. Document failure modes, residual risks, and conditions under which the claim would fail.

# Output Format

When using this skill, produce:

1. **Research question** — One concise question tied to a system-level limitation.
2. **Mechanism map** — Coupled constraints, suspected bottleneck, and competing explanations.
3. **Hypothesis portfolio** — At least three conditional hypotheses, each with evidence strength, key assumptions, predicted observations, failure modes, and boundary conditions.
4. **Minimal viable experiment** — Independent variable, dependent variables, controls, diagnostics, and stop conditions.
5. **Analysis plan** — Data-quality checks, mechanism-mapping logic, trade-off analysis, and outcome classification rules.
6. **Iteration plan** — Decision rules for supported, partial, ambiguous, refuted, and boundary-limited outcomes.
7. **Validity and safety check** — Confounders, reproducibility, boundary conditions, and non-operational safety boundaries.
8. **Evidence separation** — Explicit labels for what is directly supported by provided evidence, what is inferred by analogy, and what remains speculative.

# Validation Gates

Before finalizing any research plan, confirm:

- **Mechanistic clarity**: Each hypothesis specifies a causal mechanism and observable.
- **Control adequacy**: The design can distinguish the proposed mechanism from artifacts.
- **Confounder control**: Geometry, contact quality, processing, loading, and inactive-material fraction are considered.
- **Reproducibility**: Independent replicates and uncertainty reporting are included.
- **Boundary awareness**: Conclusions are limited to tested conditions.
- **Statistical validity**: Claims are proportional to variability, replicate count, and baseline uncertainty.
- **Safety and ethics**: The plan avoids unsafe operational detail and avoids overclaiming deployment readiness.
- **Evidence labeling**: Literature precedent, analogy, direct measurement, and inference are clearly separated.

# Claim Boundaries

- Claims are bounded to the tested material class, processing route, measurement regime, and environmental conditions.
- Do not extrapolate small-scale laboratory observations to commercial deployment without scalability, reproducibility, and safety validation.
- Do not present single-study results as field consensus.
- Distinguish paper-supported patterns from domain-informed inferences and new-system speculations.

# Failure Modes

- The intended architecture cannot be verified structurally.
- Controls cannot isolate the proposed mechanism.
- Performance improves only when mechanism-specific diagnostics are absent.
- Benefits disappear under practical boundary conditions.
- Active sites or interfaces agglomerate, detach, or degrade faster than they function.
- Apparent improvement is caused by precipitation, pH drift, material loss, analytical artifact, or non-specific effects.
- Reproducibility is poor due to uncontrolled batch variability or hidden process variables.

# Validity Checks

- Are stoichiometry, secondary phases, surface exposure, and thermal history controlled or measured?
- Is there a reproducible baseline with documented stability?
- Are positive, negative, and process-only controls included?
- Are independent samples, repeated measurements, and spatial replicates sufficient for the claimed variability?
- Are measurement methods appropriate for the claimed metric?
- Are literature comparisons made only under comparable conditions?
- Are paper-specific values, parameters, and recipes excluded unless explicitly supplied and safety-reviewed?

# Provenance

- Synthesized from cluster 21 / subcluster 21.0 (observable-driven mechanism discovery and validation).
- Source skills: `solid-state-li-s-research-workflow`, `li-s-functional-separator-research-workflow`, `electrocatalytic-wastewater-sulfide-exploration`, `bi2o2se-thermoelectric-research-design`, `core-shell-adsorbent-research-design`, `li-s-cathode-research-workflow`, `coordination-host-electrocatalyst-research-design`, `flexible-emi-shielding-composite-research`.
- Paper-derived patterns are used as methodological templates only; no source-specific materials, parameters, or conclusions are endorsed as universal.
