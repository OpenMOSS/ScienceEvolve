---
name: sci-fiber-observable-driven-mechanism-discovery-workflo-a8aa4fa1
description: A reusable end-to-end workflow for framing coupled performance bottlenecks, generating mechanism-linked hypotheses, designing minimal validation studies with strong controls, and iterating on evidence across structure, interface, and system-level observables.
scienceevolve-title: "Fiber composites and battery materials · observable driven mechanism discovery workflow 21"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

Use this skill to guide an agent through a systematic, non-operational research workflow for discovering and validating mechanisms behind performance limitations in materials, devices, or engineered systems. It converts paper-derived methodological patterns into a transferable route that separates evidence from inference, demands orthogonal observables, and enforces explicit claim boundaries.

## When to use

Use this skill when the user asks to:

- Propose new research questions for a system with interacting chemical, mechanical, transport, or interfacial limitations.
- Design minimal validation plans that connect structure or microstructure to performance through mechanism-linked evidence.
- Compare candidate strategies (materials, architectures, additives, or interfaces) under matched conceptual controls.
- Iterate on hypotheses based on multi-scale experimental or computational evidence.

Do not use this skill for operational lab recipes, hazardous execution protocols, safety-critical certification, or treating single-paper results as field consensus.

## Inputs required

Ask for or identify:

- Target system class and dominant suspected failure pathway or bottleneck.
- Candidate design lever or mechanism to be tested.
- Baseline comparator and available benchmark references.
- Observable constraints: available characterization or simulation capabilities.
- Intended claim scope and boundary conditions.
- Safety and compliance context for non-operational planning.

## Core Workflow

Follow this ordered end-to-end route, enforcing decision gates and iteration or stop conditions at each stage.

1. **Frame the coupled bottleneck**
   - Define the problem as interacting limitations rather than a single metric deficit.
   - Identify the target degradation pathway or trade-off to be addressed.
   - **Gate:** If the bottleneck cannot be expressed as a measurable threshold-crossing or observable failure mode, pause and refine the problem statement before proceeding.

2. **Map mechanisms and generate competing hypotheses**
   - Propose at least one mechanism hypothesis, one confounder or null hypothesis, and one overload or trade-off hypothesis.
   - For each hypothesis, specify: evidence strength (`strong` / `moderate` / `weak` / `speculative`), key assumptions, predicted observable signatures, likely failure modes, and transfer boundaries.
   - **Gate:** If hypotheses lack a falsifiable observable or a clear control contrast, return to step 1.

3. **Design minimal validation with a control hierarchy**
   - Define system boundaries (chemistry, format, operating regime) at a conceptual level.
   - Specify independent variables (design lever), dependent variables (mechanism-linked observables and performance proxies), and controlled variables.
   - Establish controls: baseline, negative control (mechanism absent), positive control (mechanism expected), and strong control (isolates the variable of interest).
   - Define evaluation tiers: mechanism tier → interface or microstructure tier → transport tier → system-performance tier.
   - **Stop condition:** If the proposed design cannot be tested against at least one negative and one strong control, redesign before proceeding.

4. **Collect orthogonal evidence across scales**
   - Gather observables that span the mechanism chain (structure → microstructure → interface → performance).
   - Avoid relying on a single endpoint; pair performance metrics with mechanism-linked diagnostics.
   - **Gate:** If a key tier cannot be measured, flag the assumption and limit claims accordingly.

5. **Analyze trajectories and attribute causally**
   - Normalize data to baseline; inspect trends across repeated conditions rather than single points.
   - Quantify mechanism separation by comparing target-exposed improvement or degradation against confounder-only or control arms.
   - Correlate metrics causally: structure, interface evidence, and performance outputs must co-vary in the predicted direction.
   - **Decision gate:**
     - If target and confounder signals are comparable → high confounding; return to step 3 to redesign controls or reduce intensity.
     - If performance improves but mechanism evidence is absent → stop or revise; do not claim mechanism.
     - If mechanism evidence exists but performance is unchanged → check for hidden transport limits, measurement mismatch, or secondary failures; proceed to step 6.

6. **Iterate, extrapolate, or stop with boundaries**
   - **Strengthen:** If mechanism and performance align, test a stronger control, a second variant, or a more demanding condition.
   - **Refine:** If results are ambiguous, add secondary indicators, tighten system boundaries, or narrow the hypothesis.
   - **Pivot:** If structure or interface evidence contradicts the mechanism, or if the candidate improves one metric while severely worsening another, change the primary mechanism hypothesis.
   - **Stop:** Stop when additional iterations are unlikely to change the conclusion, when required controls fail, or when claims would require extrapolation beyond justified mechanism stability.
   - Label all predictions beyond observed evidence as lower-confidence and conditional.

## Output Format

When using this skill, return:

1. `Research question`: Focused bottleneck and target mechanism.
2. `Mechanism map`: Target pathway, confounding pathways, and expected interactions.
3. `Hypothesis portfolio`: Each with evidence strength, assumptions, predicted observables, failure modes, and boundaries.
4. `Validation concept`: System boundary, variables, control hierarchy, evaluation tiers, metrics, and stop conditions.
5. `Analysis plan`: Normalization, trajectory inspection, mechanism-separation logic, causal correlation, and uncertainty handling.
6. `Iteration plan`: Rules for strengthening, refining, pivoting, or stopping based on result patterns.
7. `Validity and boundary statement`: Scope limits, confounders, reproducibility needs, and non-operational safety constraints.

## Validation Gates

- **Specification gate:** The research question must define a measurable bottleneck and a falsifiable mechanism.
- **Control gate:** Every claim must be supported by comparison against baseline, negative, and strong controls; absence of controls downgrades evidence to speculative.
- **Mechanism-isolation gate:** Performance improvement alone is insufficient; mechanism-linked observables must co-vary with performance in the predicted direction.
- **Confounder gate:** Differences in loading, porosity, dispersion, processing history, or measurement protocol must be disclosed or controlled.
- **Reproducibility gate:** Claims require traceable specimen definitions, comparison logic, and variability reporting; single-sample results cannot support strong claims.

## Claim Boundaries

- Claims apply only to the tested system boundary (material class, chemistry, format, and operating regime).
- Mechanism hypotheses validated in one system must be labeled as analogies when transferred to new chemistries, architectures, or scales.
- Lifetime or threshold-crossing predictions beyond observed data are conditional and lower-confidence.
- Do not treat screening-level evidence as certification or field-wide consensus.

## Failure Modes

- **Confounding dominance:** The target mechanism is masked by an uncontrolled variable.
- **Mechanism shift:** A design change or accelerated condition alters the degradation pathway rather than its rate.
- **Single-metric illusion:** Performance improves via an unmeasured artifact rather than the intended mechanism.
- **Overgeneralization:** Extending a validated mechanism beyond its demonstrated boundary without additional controls.
- **Irreproducibility:** Variability across batches, preparations, or measurements exceeds the effect size.

## Validity Checks

Before presenting results, verify:

- **Evidence separation:** Distinguish paper-supported method logic, directly observed data, and agent-inferred extensions.
- **Mechanism specificity:** The proposed mechanism is tested beyond overall performance improvement.
- **Control adequacy:** Positive, negative, and strong controls isolate the variable of interest.
- **Statistical validity:** Variability, replicates, uncertainty ranges, and outlier handling are reported where feasible.
- **Causal chain completeness:** Each link from structure to microstructure to interface to performance has evidence or a labeled assumption.
- **Boundary clarity:** Conditions where the hypothesis should not be extrapolated are stated explicitly.
- **Safety boundary:** The plan avoids executable high-risk procedures and defers hands-on work to qualified personnel under approved protocols.

## Provenance

- Derived from cluster 10 (subcluster 10.0), archetype **observable-driven mechanism discovery and validation**.
- Synthesized from source skills: `li-s-binder-research-design`, `lis-battery-interface-research-design`, `polymer-fiber-lifetime-research-design`, `natural-fiber-composite-exploration`, `solid-polymer-electrolyte-design-workflow`, `computational-catalyst-discovery-workflow`, `model-checking-guided-program-synthesis`, and `solid-state-battery-workflow`.
- Paper-specific systems, materials, parameters, and numerical conclusions have been removed; only the shared methodological route is retained.
