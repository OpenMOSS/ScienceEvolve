---
name: sci-fiber-fiber-composite-natural-polymer-mechanism-dis-7c80bcbd
description: A reusable end-to-end workflow for generating mechanism-based hypotheses, designing controlled validation studies, and iterating on structure-property-function claims in fiber-reinforced composites, natural polymers, textiles, adhesives, and hybrid material systems.
scienceevolve-title: "Fiber composites and battery materials · fiber composite natural polymer mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Use this skill to transform a materials research question into a reusable, mechanism-driven exploration workflow. It guides an agent to identify gaps, generate ranked hypotheses, design minimal validation studies with strong controls, analyze structure-property-function evidence, and iterate until claims are bounded by evidence. The workflow is abstracted from fiber-reinforced composites, natural polymers, textiles, adhesives, and hybrid soft/hard material systems.

# When to use

Use this skill when the user asks to:

- Propose new research questions in fiber-reinforced composites, natural or synthetic polymers, textiles, filtration media, adhesives, hydrogels, or hybrid nanoparticle/composite systems.
- Convert a paper-derived observation into a transferable hypothesis-generation and validation plan.
- Design comparative experiments that isolate mechanism variables rather than optimizing a single formulation.
- Evaluate trade-offs among mechanical, thermal, degradation, interfacial, or functional performance metrics.
- Build iteration rules, failure criteria, and claim boundaries for structure-property studies.

Do not use this skill for clinical decision-making, patient-specific treatment advice, operational laboratory recipes, or hazardous procedural execution.

# Inputs required

Before using the workflow, collect or request:

1. **Target system family** — e.g., fiber-reinforced composite, polymer blend, hydrogel, textile, adhesive, or hybrid material.
2. **Functional gap or bottleneck** — the practical limitation or missing evidence (e.g., weak wet adhesion, low impact tolerance, poor recyclability-performance balance).
3. **Candidate mechanism axes** — proposed structural or chemical levers (e.g., architecture, crosslinking, interface engineering, additive incorporation).
4. **Evidence context** — prior literature, preliminary data, or source paper observations, with clear separation of what is directly supported versus inferred.
5. **Constraints** — safety, ethical, environmental, feasibility, and non-operational boundaries.

# Core Workflow

This is an ordered end-to-end route. Advance through each stage only after passing its decision gate.

1. **Frame the gap as a mechanism-linked decision problem**
   - Express the gap as a relationship among material feature, structural mediator, and functional outcome.
   - Identify the weakest link in the proposed causal chain.
   - **Decision gate:** Stop if the gap cannot be stated as a falsifiable mechanism question.

2. **Separate evidence layers**
   - Label paper-supported facts, agent-generated inferences, and field assumptions.
   - **Decision gate:** Stop if paper-supported facts and inferences are indistinguishable.

3. **Generate ranked hypotheses**
   - For each candidate mechanism, produce a hypothesis card: statement, mechanistic model, key assumptions, predicted structural and functional changes, evidence strength (high/medium/low/speculative), likely failure modes, and boundary conditions.
   - Rank by mechanistic clarity, testability, and evidence strength.
   - **Decision gate:** Reject hypotheses that lack a measurable intermediate or a plausible failure mode.

4. **Design a minimal validation matrix**
   - Select one primary structural lever per cycle.
   - Define study arms: baseline, candidate, benchmark, positive control, negative control, and process/vehicle control.
   - Map variables: independent (structural lever), dependent (functional outcomes), mediators (structural/chemical intermediates), and confounders (processing, geometry, environment).
   - Choose endpoints: primary function, trade-off metric, structural mediator, and stability/durability indicator.
   - Predefine decision criteria and stop conditions.
   - **Decision gate:** Stop if controls cannot isolate the lever or if safety constraints are unmet.

5. **Confirm structure before interpreting function**
   - Verify architecture, composition, morphology, or chemical identity before testing performance.
   - **Decision gate:** If structural confirmation fails, classify results as unassigned and pause mechanism claims.

6. **Execute comparative evaluation**
   - Test candidates against controls under matched conditions.
   - Measure primary and trade-off endpoints together.
   - Record variability, batch identity, and boundary conditions.
   - **Decision gate:** If controls fail or behave unexpectedly, stop interpretation and audit the assay.

7. **Analyze with mechanism-first logic**
   - Classify results: mechanism-supporting, trade-off-revealing, artifact-suspected, or boundary-condition-revealing.
   - Link structural changes to functional outcomes via the proposed mediator.
   - Separate interface effects from bulk effects.
   - **Decision gate:** Do not advance claims if the result is better explained by confounders (e.g., molecular weight, void content, processing history, measurement artifacts).

8. **Iterate or redesign**
   - **If supported:** Narrow the variable set and test boundary conditions.
   - **If partially supported:** Identify the weak link (material variable, mediator, endpoint, or context) and add discriminating controls or orthogonal readouts.
   - **If negative:** Check detection capability; if valid, abandon or revise the mechanism and convert the result into a boundary condition.
   - **If controls fail:** Repair controls before changing hypotheses.
   - **If confounding is plausible:** Add matched controls or orthogonal measurements; prefer redesign over post-hoc explanation.
   - **Decision gate:** Stop if the candidate improves one endpoint while causing unacceptable loss in another, or if required safety/reproducibility constraints are violated.

9. **Bound claims and define transfer limits**
   - State explicitly what is supported, what is inferred, and what remains uncertain.
   - Define boundary conditions under which the pattern may no longer hold (material class, loading mode, environment, thickness, architecture).
   - **Decision gate:** Do not generalize beyond the tested system without independent replication or orthogonal validation.

# Output Format

When using this skill, produce:

1. **Task framing** — domain, gap, and evidence-layer labels.
2. **Gap map** — known evidence, missing evidence, and significance.
3. **Ranked hypotheses** — hypothesis cards with mechanism, evidence strength, assumptions, failure modes, and minimal validation.
4. **Validation matrix** — study arms, controls, variables, endpoints, decision criteria, and stop conditions.
5. **Analysis plan** — interpretation tiers, control-based attribution, trade-off analysis, and uncertainty reporting.
6. **Iteration plan** — update rules for supported, partial, negative, failed-control, and confounded outcomes.
7. **Claim boundary statement** — provenance of each claim, boundary conditions, and residual risks.

# Validation Gates

- **Gap validity:** The gap is based on missing evidence, not a single-paper assumption.
- **Mechanism validity:** A plausible causal chain with a measurable intermediate exists.
- **Control validity:** Baseline, benchmark, positive, negative, and process/vehicle controls are included where relevant.
- **Endpoint validity:** Endpoints measure the proposed mechanism and outcome, not only convenient proxies.
- **Structural confirmation:** Architecture or composition is verified before performance attribution.
- **Statistical validity:** Experimental units, replication, uncertainty, and effect sizes are explicit.
- **Reproducibility:** Another group could repeat the design logic without hidden assumptions.

# Claim Boundaries

- Distinguish paper-supported facts from agent-generated inferences and field assumptions.
- Limit conclusions to the tested material family, architecture, loading mode, and environmental conditions.
- Do not present single-study results as field consensus, clinical efficacy, or regulatory-ready conclusions.
- Treat sustainability, biodegradability, recyclability, and safety claims as requiring dedicated lifecycle or validation evidence.

# Failure Modes

- **Hypothesis failure:** The predicted mechanism is absent despite valid controls.
- **Trade-off failure:** Improvement in the primary endpoint degrades a critical secondary endpoint.
- **Control failure:** Negative controls mimic the candidate, or positive controls fail.
- **Confounding dominance:** Molecular weight, void content, processing history, or batch effects explain the observed change.
- **Structural unconfirmed:** Performance changes cannot be linked to the intended architecture or composition.
- **Boundary violation:** The effect disappears under realistic hydration, loading, or environmental conditions.
- **Safety/ethical barrier:** The planned validation requires operational hazardous detail or unreviewed clinical translation.

# Validity Checks

Before finalizing any output, verify:

- Are paper-supported facts and agent-generated inferences clearly separated?
- Is the research question narrow enough to be falsifiable with the proposed controls?
- Are chemical/structural identity and architecture measured before performance interpretation?
- Are baseline, negative, positive, benchmark, and process controls included?
- Are primary and trade-off metrics both specified?
- Are failure criteria and stop conditions defined before the experiment?
- Are claims limited to non-clinical research planning unless appropriate evidence is provided?
- Does the plan avoid operational lab recipes, hazardous protocols, and unsafe procedural details?

# Provenance

- Synthesized from cluster 49.0 (fiber-composite-natural-polymer-mechanism-discovery-workflow).
- Source skill references: tissue-engineering-research-pattern; functional-filtration-media-research; co2-biodegradable-multiblock-polymer-research-design; multifunctional-hybrid-nanoparticle-research; nanoscale-hydrogen-storage-research; catechol-chitosan-hydrogel-research-pattern; tissue-adhesive-hydrogel-exploration; recyclable-composite-impact-research-skill.
- This skill abstracts shared workflow structure without preserving paper-specific systems, parameters, or conclusions.
