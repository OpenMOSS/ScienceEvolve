---
name: sci-fiber-observable-driven-mechanism-discovery-workflo-ad5cbabd
description: A reusable end-to-end workflow for transforming performance bottlenecks into mechanism-driven research plans with orthogonal controls, linked evidence analysis, and bounded claims across materials and chemical systems.
scienceevolve-title: "Fiber composites and battery materials · observable driven mechanism discovery workflow 25"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Guide an agent to convert a performance bottleneck, selectivity gap, or coupled failure into a rigorous, mechanism-driven research plan. The workflow generates ranked hypotheses, designs minimal validation experiments with orthogonal controls, analyzes linked evidence, and iterates until claims are bounded by the data. It is not a laboratory protocol generator and does not treat single-paper observations as field consensus.

# When to use

Use this skill when the user asks to:
- Propose new research questions for systems limited by transport, interfacial, chemical, structural, or kinetic coupling.
- Design non-operational validation plans with controls, diagnostic metrics, and stop conditions.
- Interpret experimental data as evidence for or against a mechanistic hypothesis.
- Compare candidate strategies while separating demonstrated evidence from speculative extensions.

Applicable domains include electrochemical energy storage, catalysis, materials interfaces, and synthetic method development. Do not use for executable synthesis or cell-assembly instructions, safety review substitution, or manufacturing scale-up.

# Inputs required

Before starting, obtain or infer:

- **Target system**: active materials, reactive intermediates, charge carriers, and operating environment class.
- **Bottleneck**: the performance contradiction, failure mode, or selectivity gap limiting relevance.
- **Candidate mechanisms**: transport, interfacial, chemical conversion, structural, or morphological processes suspected to dominate.
- **Baselines**: conventional or passive reference systems for comparison.
- **Diagnostics available**: electrochemical, spectroscopic, imaging, or physicochemical readouts that can probe intermediates or local environments.
- **Constraints**: non-operational scope, safety boundaries, resource limits, and claim-depth targets (mechanism proof vs. concept screening).

# Core Workflow

An ordered, end-to-end route with decision gates and iteration/stop conditions.

## 1. Decompose the bottleneck

State the target gap in neutral terms. Identify whether the limitation arises from a single process or from coupled contributions (e.g., transport–interface–structure interactions).

**Decision gate**: If the bottleneck cannot be decomposed into separable candidate mechanisms, refine the problem scope or request additional diagnostic information.

## 2. Map candidate mechanisms

For each candidate, build a causal chain from a material or molecular descriptor to a local process to a system-level observable.

Explicitly separate:
- Observed phenomena (what is known),
- Inferred links (what is hypothesized),
- Untested regions (what remains speculative).

**Stop condition**: If no discriminating observable exists for a candidate mechanism, discard or deprioritize it.

## 3. Generate ranked hypotheses

For each candidate mechanism, produce at least one hypothesis containing:
- **Claim**: what should change and why.
- **Evidence strength**: high, medium, low, or speculative.
- **Key assumption**: what must be true for the claim to hold.
- **Discriminating prediction**: an observable that should appear only if this mechanism operates.
- **Likely failure mode**: how the hypothesis could fail despite a reasonable design.

**Decision gate**: If hypotheses are not mutually exclusive or lack a falsifying prediction, reformulate before proceeding.

## 4. Design minimal validation

Define the smallest experiment that can isolate one mechanism:
- **Baseline control**: standard system without the proposed feature.
- **Negative/ablation controls**: variants that remove one proposed function while keeping other factors comparable.
- **Positive control**: a known reference that validates the measurement sensitivity.
- **Variables**: change one dominant descriptor at a time (composition, architecture, environment, etc.).
- **Metrics**: primary (target performance), secondary (efficiency, retention), and diagnostic (intermediate signal, impedance, morphology, selectivity).

**Stop condition**: If controls cannot separate the intended mechanism from mass, geometry, conductivity, or preparation artifacts, redesign the comparison set.

## 5. Collect and normalize evidence

Gather data under matched preparation and measurement conditions. Normalize by relevant basis (active material, area, geometric context). Record variability and replicate consistency.

**Decision gate**: If comparability is violated (e.g., unmatched loading, unreported history), flag the evidence as low-confidence and pause interpretation.

## 6. Discriminate mechanisms

Link each observation to a mechanism class:
- Product or performance changes alone are weak mechanistic evidence.
- Diagnostic changes (intermediate retention, impedance, selectivity, morphology) must align with the predicted causal chain.
- Treat unchanged intermediate signals or unchanged diagnostic readouts as evidence *against* the proposed mechanism.

Classify each hypothesis as **supported**, **partially supported**, **contradicted**, or **ambiguous**.

**Iteration gate**: If evidence is ambiguous, add the smallest discriminating diagnostic rather than expanding scope.

## 7. Evaluate trade-offs and boundaries

Record benefits and penalties together. If improving one metric degrades another required property (e.g., rate versus utilization, capture versus transport), reframe the design rather than promote a single headline result.

Define claim boundaries: chemistry class, operating window, scale, and architecture context where the conclusion is expected to apply.

**Stop condition**: If a variant improves one headline metric while severely degrading safety, reproducibility, or another required metric, stop the branch and redesign.

## 8. Iterate or pivot

Update the research plan based on the classification:
- **Supported**: expand along one chemically meaningful axis or increase stress (e.g., loading, rate, complexity).
- **Partially supported**: isolate the working sub-mechanism and redesign the remainder.
- **Contradicted**: replace the mechanism model or choose a different design lever.
- **Confounded**: decompose coupled changes into single-variable comparisons.
- **Controls fail**: fix measurement design before interpreting mechanism.

**Stop condition**: Pause or terminate when safety boundaries are exceeded, reproducibility is unmet, or the hypothesis cannot be discriminated with available diagnostics.

## 9. Bound and package claims

Before output, label every conclusion:
- **Verified**: directly supported by the current evidence and appropriate controls.
- **Inferred**: plausible extension supported by analogy or literature, but not directly tested.
- **Speculative**: agent-generated hypothesis requiring future validation.

State extrapolation limits and explicitly avoid presenting single-study findings as domain consensus.

# Output Format

Produce the following in order:
1. **Research framing**: target system, bottleneck, and boundary conditions.
2. **Mechanism map**: candidate causal chains with observed, inferred, and untested links.
3. **Hypotheses table**: claim, evidence strength, key assumption, discriminating prediction, likely failure mode, and minimal test.
4. **Validation plan**: variables, control matrix, diagnostic metrics, and stop conditions.
5. **Analysis plan**: normalization rules, evidence-linking logic, trade-off evaluation, and uncertainty handling.
6. **Iteration plan**: decision rules for continue, pivot, or stop after each possible outcome.
7. **Bounded claim statement**: evidence-level labels, extrapolation limits, and safety constraints.

# Validation Gates

Before presenting a plan or conclusion, confirm:
- **Control adequacy**: baseline, negative/ablation, and positive controls are included and matched.
- **Confounder control**: loading, mass, geometry, environment history, and preparation differences are considered.
- **Metric validity**: diagnostics are tied to the proposed mechanism, not only to headline performance.
- **Reproducibility**: replicates, variance, and raw-data expectations are defined.
- **Mechanistic specificity**: the experiment can distinguish between competing candidate mechanisms.
- **Boundary clarity**: temperature, composition, scale, and operating regime are stated as context, not universal truth.

# Claim Boundaries

- Distinguish observations (what was measured), inferences (what mechanism is suggested), and extrapolations (what might apply elsewhere).
- Limit claims to the tested system context; do not generalize across untested chemistries, scales, or operating modes.
- Mark agent-inferred extensions as provisional, even when they build on published literature.
- Never treat a single source’s results as field-wide consensus.

# Failure Modes

- **Mechanism misattribution**: improvement is real but caused by an uncontrolled variable rather than the proposed mechanism.
- **Hidden confounder**: a preparation artifact, impurity, or measurement bias mimics the predicted signal.
- **Single-point artifact**: a single successful run or extreme condition drives an unsupported generality claim.
- **Overlooked trade-off**: optimizing one metric masks degradation in another critical property.
- **Undiscriminated hypothesis**: controls are too weak to separate competing explanations.
- **Extrapolation beyond evidence**: conclusions are applied to untested substrate classes, cell formats, or operating windows.

# Validity Checks

Before finalizing output, verify:
- Observations are separated from inferences and speculations.
- Causal consistency is checked: the design feature exists, the diagnostic changes, and the performance changes follow the expected order.
- Negative evidence is used: unchanged signals count against the hypothesis.
- Post-test interpretations account for handling or disassembly artifacts.
- Alternative explanations (background, decomposition, analytical ambiguity) are acknowledged.
- Safety and ethics constraints are respected; no operational hazardous details are included.

# Provenance

Synthesized from Cluster 4 / Subcluster 4.0 ("observable-driven mechanism discovery and validation"). Source skills: `li-s-electrode-research-workflow`, `nhc-alkane-ch-functionalization-exploration`, `carbon-free-li-s-host-exploration`, `soft-multicontinuum-battery-design`, `polymer-electrolyte-li-span-research-design`, `lithium-sulfur-multifunctional-binder-research`, `lean-electrolyte-battery-interface-exploration`, `csp3-si-cross-coupling-method-design`.
