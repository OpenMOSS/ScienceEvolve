---
name: sci-fiber-fiber-composite-interface-textile-mechanism-d-fe69cd34
description: A reusable end-to-end workflow for generating hypotheses, designing staged validation studies, and bounding mechanistic claims in fiber, composite, interface, and textile material systems.
scienceevolve-title: "Fiber composites and battery materials · fiber composite interface textile mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

Use this skill to guide mechanism discovery and validation research across fiber-reinforced composites, textile structures, hierarchical interfaces, and hybrid material systems. It provides a structured, evidence-tiered route from gap identification to claim bounding, ensuring that structure–property–performance links are tested rather than assumed.

## When to use

Trigger this skill when the user needs to:
- Propose new research questions around load transfer, interfacial failure, reinforcement architecture, textile damage, or hierarchical performance.
- Design staged validation plans that isolate mechanism from outcome.
- Interpret multi-scale evidence to support or refute causal hypotheses linking material structure to mechanical, biological, or transport behavior.
- Iterate or pivot based on intermediate evidence without overcommitting to a single comprehensive study.

Do not use this skill for clinical recommendations, safety-critical certification, operational manufacturing instructions, or executable hazardous protocols.

## Inputs required

Before executing the workflow, identify or request:
- **Target system family**: matrix, reinforcement, textile architecture, surface class, or hybrid configuration at a conceptual level.
- **Suspected bottleneck**: the performance limit, failure mode, or functional gap (e.g., debonding, pull-out, crack initiation, dimensional instability).
- **Candidate mechanism(s)**: structural, interfacial, chemical, or architectural variables expected to govern the bottleneck.
- **Available evidence tiers**: characterization access, modeling or simulation capability, and prior literature or preliminary data.
- **Constraints**: safety boundaries, regulatory context, reproducibility requirements, and scope limitations.

## Core Workflow

Execute the following stages in order. At each decision gate, choose to proceed, iterate, or stop.

### Stage 1: Gap and mechanism framing
1. Define the performance gap as a mismatch between intended function and observed limit.
2. Map a candidate mechanism chain: material feature → interfacial/structural state → local damage or transport behavior → macroscopic response.
3. Separate verified observations from inferences.
4. **Decision gate**: Is the gap addressable by a testable mechanism? If no, reframe or stop.

### Stage 2: Hypothesis generation
1. Generate at least three hypotheses:
   - **Primary mechanism hypothesis**: the proposed feature controls the bottleneck.
   - **Confounder/null hypothesis**: an alternative factor (e.g., void content, geometry, processing history, mass change) explains the outcome.
   - **Boundary hypothesis**: the effect exists only under specific material, scale, or environmental regimes.
2. For each hypothesis, state the causal chain, evidence strength (high / medium / low), key assumptions, and likely failure modes.
3. **Decision gate**: Are the hypotheses falsifiable with available tools? If no, refine scope or stop.

### Stage 3: Staged validation design
Design a tiered evidence ladder rather than a single endpoint study.

- **Tier 1 — Material/structural identity**: Confirm composition, morphology, and integrity before attributing functional effects. Include baseline and process controls.
- **Tier 2 — Mechanism isolation**: Compare single-factor modifications against baseline, negative, and process controls. Add combined-factor groups only after single-factor effects are resolved.
- **Tier 3 — Functional response**: Measure the primary performance metric relevant to the bottleneck. Predefine stop conditions such as unacceptable off-target response, high variability, or no improvement over controls.
- **Tier 4 — System-level integration**: Escalate to complex models or application-relevant conditions only when lower tiers are internally consistent.

**Decision gate after each tier**: Does the evidence meet predefined success criteria? If no, iterate the design or pivot to an alternative mechanism.

### Stage 4: Execution and data quality
1. Predefine primary and secondary endpoints, replication plan, and exclusion criteria before data collection.
2. Record variability, outliers, and batch effects.
3. **Decision gate**: Do controls behave plausibly and consistently? If no, pause interpretation and redesign.

### Stage 5: Mechanism discrimination and analysis
1. Link macroscopic performance changes to microstructural or failure-mode evidence.
2. Separate confounding factors (e.g., density, thickness, reinforcement fraction, environmental history).
3. Require convergence from at least two independent readouts before accepting a mechanistic claim.
4. Evaluate trade-offs explicitly (e.g., stiffness versus toughness, activity versus compatibility).
5. **Decision gate**: Does evidence converge on a single mechanism? If ambiguous, propose targeted follow-up assays before claiming causality.

### Stage 6: Claim bounding and iteration
1. Classify each hypothesis as supported, partially supported, rejected, or inconclusive.
2. Update evidence labels and boundary conditions.
3. Select the next action:
   - **Continue**: narrow the design space around the confirmed mechanism.
   - **Pivot**: test an alternative mechanism or confounder.
   - **Stop**: terminate if risk/benefit is unacceptable, controls fail, or the mechanism is unsupported.
4. **Decision gate**: Are all claims explicitly bounded by tested conditions? If not, restate boundaries before output.

## Output Format

Return results in the following structure:

1. **Research question and gap statement** — Target bottleneck and intended evidence tier.
2. **Hypotheses table** — Mechanism, evidence strength, key assumptions, and likely failure modes.
3. **Staged validation plan** — Tiered experiments with variables, controls, primary readouts, and stop conditions.
4. **Analysis and mechanism discrimination plan** — Comparisons, convergence criteria, confounder checks, and trade-off mapping.
5. **Iteration decision matrix** — Rules for continue, pivot, or stop based on possible outcomes.
6. **Claim boundary statement** — Scope, material/loading/environmental limits, and translation boundaries.
7. **Validity and safety checklist** — Confounding, reproducibility, statistical, and ethics checks.

## Validation Gates

- Material/structural identity is confirmed before functional effects are attributed to the design.
- Control groups behave plausibly across baseline, negative, process, and single-factor conditions.
- Replication and variability are quantified; single-specimen or single-image claims are rejected.
- Confounders are measured or held constant across comparison groups.
- Mechanistic claims rely on convergent evidence from at least two independent methods.
- Predefined stop conditions are enforced before escalating to higher evidence tiers.

## Claim Boundaries

- Distinguish source-supported methodology from agent-generated inferences for new systems.
- Limit claims to the tested material class, geometry, loading regime, and environmental conditions.
- Do not extrapolate non-clinical or screening results to clinical efficacy, safety-critical performance, or field service life.
- Do not present single-study findings as field-wide consensus.

## Failure Modes

- A confounding variable (e.g., processing history, geometry, mass change) dominates the observed effect.
- Improvement in one metric trades off against another, invalidating unqualified success claims.
- Controls behave unexpectedly, undermining causal comparison.
- Mechanism evidence is contradictory or relies on a single readout.
- Batch-to-batch or measurement variability exceeds the treatment effect size.
- Model predictions diverge from observations due to unverified assumptions.

## Validity Checks

- **Confounding**: Are architecture, fraction, density, moisture, thermal history, and geometry controlled or recorded?
- **Reproducibility**: Are batches, measurement timing, image analysis, and exclusion criteria predefined?
- **Statistical validity**: Are endpoints predefined, comparisons appropriate, and uncertainty reported?
- **Mechanism validity**: Does the observed failure mode match the predicted load-transfer or transport mechanism?
- **External validity**: Is generalization beyond the tested system explicitly labeled as extrapolation?
- **Evidence labeling**: Are source-supported patterns separated from new-system inferences?

## Provenance

- Synthesized from cluster 26.0 (end-to-end mechanism discovery and validation).
- Derived from source skills: bioactive-fiber-wound-research, composite-interface-fatigue-exploration, multifunctional-implant-surface-exploration, bio-sandwich-impact-research-exploration, composite-surface-exploration, continuous-fiber-composite-research-design, natural-fiber-composite-ballistic-research-pattern, fiber-laundry-mechanism-workflow.
