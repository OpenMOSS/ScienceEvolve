---
name: sci-fiber-composite-fiber-textile-scaffold-mechanism-di-5fcd71bf
description: A reusable end-to-end workflow for generating mechanism-linked hypotheses, designing controlled validation experiments, and iterating on material-system claims in composites, fibers, textiles, and scaffolds without reproducing paper-specific recipes.
scienceevolve-title: "Fiber composites and battery materials · composite fiber textile scaffold mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

This skill guides an agent through an observable-driven mechanism discovery and validation workflow for material systems. It translates a performance gap or interface bottleneck into falsifiable hypotheses, designs minimal controlled experiments, and enforces evidence-based iteration and claim bounding. The focus is on linking observables to mechanisms rather than optimizing recipes.

# When to use

Use this skill when the user asks to:

- Propose new research questions for composite, fiber, textile, scaffold, or layered material systems.
- Design experiments that balance a target function against mechanical integrity, durability, or environmental stability.
- Generate hypotheses about substrate-modifier interactions, interface reliability, reinforcement architecture, or active-agent delivery.
- Critique a proposed material modification for controls, confounders, and boundary conditions.
- Iterate on a failed or ambiguous result by isolating mechanism legs.

Do not use this skill for operational laboratory protocols, clinical recommendations, field deployment instructions, or executable high-risk procedures.

# Inputs required

Before producing a research proposal, ask for or infer the following:

- **Target system**: substrate, matrix, reinforcement, scaffold, or panel identity and baseline properties.
- **Target function**: the performance deficit or desired property (e.g., barrier, conductivity, toughness, bioactivity, flame resistance).
- **Application context**: intended use environment and relevant constraints.
- **Candidate mechanism or modifier class**: the hypothesized interaction, interface phase, coupling chemistry, or active component.
- **Constraints**: safety, regulatory, durability, comfort, cost, or manufacturing limits.
- **Available evidence**: prior literature, preliminary data, and characterization capabilities.
- **Success criteria**: primary endpoint, baseline-integrity thresholds, and acceptable trade-offs.

# Core Workflow

## 1. Frame the gap and mechanism space

Define the application-relevant performance deficit. Map the causal chain from substrate/feature through interaction/interface to function and trade-offs. Identify the weakest link in the chain as the focal hypothesis.

## 2. Generate ranked, falsifiable hypotheses

For each candidate mechanism, produce:

- **Claim**: the substrate-modifier interaction produces the target function.
- **Evidence strength**: high, medium, low, or speculative.
- **Key assumptions**: what must be true for the mechanism to operate.
- **Predicted observables**: structural, interfacial, or chemical signatures expected if the hypothesis holds.
- **Likely failure modes**: e.g., poor attachment, aggregation, degradation, assay interference, or confounding.

Prioritize hypotheses testable by a minimal validation set.

## 3. Design minimal viable validation (MVV)

Specify:

- **Independent variables**: mechanism-relevant factors such as modifier class, interface condition, or architecture.
- **Dependent variables**: target function and baseline integrity.
- **Controls**: untreated/blank, process-only, mechanistic omission, negative, and positive benchmark.
- **Endpoints**: primary success metric, secondary trade-off metrics, and durability or aging proxies.
- **Stop conditions**: predefined criteria for safety breach, effect-size below variability, or control failure.

## 4. Decision Gate A — Design feasibility

- **Pass**: controls isolate the mechanism and endpoints are measurable within constraints.
- **Redesign**: return to Step 2 if the mechanism cannot be isolated or if safety/ethical boundaries are violated.
- **Stop**: abort if no falsifiable hypothesis can be formed within constraints.

## 5. Execute and observe

Collect functional, structural, interfacial, and durability observables across independent replicates with consistent conditioning and documented batch effects.

## 6. Analyze against controls

- Compare treated vs untreated vs process-only vs omission controls.
- Link performance changes to structural, interfacial, or chemical observables.
- Classify each conclusion as **observed**, **inferred**, or **unsupported**.

## 7. Decision Gate B — Mechanism consistency

- **Pass**: observables align with the hypothesized mechanism and controls rule out confounders.
- **Provisional**: function improves without supporting structural or interfacial evidence; requires stronger validation before claiming mechanism.
- **Fail**: controls contradict the mechanism or show the effect is artifactual; proceed to Step 8.

## 8. Iterate or redesign

Trigger specific redesign paths based on outcome:

- **Weak target function**: reassess compatibility, accessibility, distribution, or assay validity before increasing loading.
- **Baseline integrity loss**: isolate failure mode (structural damage, poor wetting, stiff film, pore blockage) and test milder routes.
- **Performance plateau**: shift from concentration or loading escalation to interface or architecture optimization.
- **Ambiguous evidence**: add omission controls, refine endpoints, increase replication, or standardize conditioning.
- **Stop and exit**: if the candidate fails against benchmarks, side effects dominate, variability exceeds effect size, or safety limits are breached.

## 9. Bound claims and document limits

State the tested context (material class, architecture, assay, environment). Separate verified observations from agent inferences. Define extrapolation limits and required evidence for scaling or deployment claims.

# Output Format

When using this skill, return:

1. **Research question and gap framing**.
2. **Mechanism hypothesis table**: claim, evidence strength, assumptions, failure modes, and boundaries.
3. **Experimental design**: MVV, controls, variables, endpoints, and stop conditions.
4. **Analysis plan**: comparison logic, mechanistic interpretation rules, and durability or aging checks.
5. **Iteration plan**: triggers for redesign and next-test logic.
6. **Validity and safety notes**: confounders, reproducibility, boundary conditions, and non-operational guardrails.
7. **Evidence status**: clearly label verified observations, agent inferences, and open uncertainties.

# Validation Gates

- **Task fit**: The question concerns mechanism discovery or validation, not operational execution.
- **Control adequacy**: Untreated, process, and mechanistic omission controls are included.
- **Endpoint balance**: Target function and baseline integrity are both predefined.
- **Mechanistic linkage**: Each claim connects observables to a proposed mechanism.
- **Reproducibility**: Replicates, batch effects, and variability are addressed.
- **Safety and ethics**: The plan stays at the research-design level and respects hazard boundaries.

# Claim Boundaries

- Limit conclusions to the tested material class, architecture, and assay conditions.
- Do not generalize from a single substrate, matrix, or modifier to field-wide consensus.
- Distinguish laboratory evidence from real-world deployment readiness or regulatory approval.
- Treat positive results as local evidence requiring further validation before application claims.

# Failure Modes

- **Superficial or non-durable modification**: function appears initially but lacks retention or anchoring evidence.
- **Structural degradation**: target function improves while mechanical, comfort, or safety properties fail.
- **Mechanism mismatch**: performance changes are driven by confounders such as mass loading, residue, geometry, or batch variability rather than the proposed interaction.
- **Redesign triggers**: ambiguous controls, high variability, side-effect dominance, or safety concern escalation.

# Validity Checks

- **Confounders**: substrate batch, processing history, geometry, moisture, contamination, and measurement bias.
- **Statistical checks**: predefined endpoints, effect sizes, uncertainty reporting, and independent replication.
- **Mechanism checks**: chemical or structural evidence aligns with functional outcomes; omission controls support necessity.
- **Boundary checks**: claims are scoped to tested conditions; extrapolations are labeled as hypotheses.

# Provenance

- Synthesized from cluster 48, subcluster 48.1: observable-driven mechanism discovery and validation.
- Source skills: chitosan-cotton-textile-research-pattern; sustainable-protective-composite-exploration; cntf-interface-reliability-exploration; textile-fr-grafting-exploration; functional-fiber-bioactive-workflow; long-fiber-thermoplastic-composite-research; natural-fiber-composite-exploration; radical-relay-difunctionalization-workflow.
