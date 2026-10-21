---
name: sci-fiber-composite-fiber-mechanism-discovery-workflow-d2deb4f8
description: A reusable end-to-end workflow for generating mechanism-centered research plans in fiber-reinforced, composite, or architected material systems, from hypothesis generation through controlled validation to iterative mechanism discrimination and claim bounding.
scienceevolve-title: "Fiber composites and battery materials · composite fiber mechanism discovery workflow 4"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

This skill guides agents to transform a functional gap or performance trade-off in fibrous, composite, scaffold, or architected material systems into a structured, mechanism-centered research plan. It encodes an observable-driven discovery loop: frame the gap, generate discriminating hypotheses, design minimal validation with strong controls, collect orthogonal structure–property–function evidence, compare competing mechanisms, and iterate until claims are bounded by reproducible data. The workflow is a research-planning method, not an operational fabrication or clinical protocol.

# When to use

Use this skill when the user asks to:

- Propose new research questions linking morphology, architecture, or microstructure to mechanical, thermal, electrical, transport, or barrier performance in fiber-based or composite material systems.
- Design experiments that test structure–property–function or process–structure–performance causal chains.
- Evaluate trade-offs such as functionality versus durability, conductivity versus resilience, porosity versus mechanical integrity, or selectivity versus permeability.
- Build iterative validation logic with predefined controls, stopping conditions, and claim boundaries.
- Translate observations from one material system into testable hypotheses for another without treating a single study as field consensus.

Do not use this skill for:

- Direct operational recipes, step-by-step fabrication protocols, or hazardous laboratory execution instructions.
- Clinical recommendations, medical device validation, or environmental release decisions.
- General literature review outside the mechanism-discovery archetype.

# Inputs required

Before generating a plan, collect or infer:

1. **Target material system**: matrix, reinforcement, filler, or architecture family; intended form (fiber, mat, filament, lattice, membrane, construct); and known processing sensitivities.
2. **Functional gap or trade-off**: the specific performance limitation, unexplained behavior, or multi-objective tension motivating the study.
3. **Candidate mechanisms**: plausible physical pathways connecting structure to observable (e.g., interfacial load transfer, percolation, tortuous transport, contact modulation, swelling/network formation).
4. **Observable and regime boundary**: the primary measurable signal and the conditions under which competing mechanisms predict different behaviors.
5. **Available characterization**: structural, chemical, mechanical, thermal, electrical, or transport measurement capabilities; resolution and synchronization constraints.
6. **Comparator systems**: unmodified baseline, component-alone control, inert analogue, and relevant benchmark or literature reference when available.
7. **Success criteria and stop conditions**: minimum acceptable performance change, maximum tolerable trade-off, and predefined reasons to halt or pivot.
8. **Constraints and boundaries**: safety, ethics, regulatory, environmental, reproducibility, and scalability considerations.

# Core Workflow

## 1. Frame the functional gap and mechanism boundary
- Define the performance limitation as a falsifiable tension (e.g., improved function versus degraded durability).
- Identify the physical regimes where competing mechanisms should dominate and the length, energy, or time scale that separates them.
- **Decision gate**: Stop if the gap cannot be expressed as a falsifiable claim or if no observable can discriminate between mechanisms.

## 2. Generate mechanism-centered hypotheses
- Produce at least three hypotheses using a consistent template:
  - **Claim**: concise causal statement linking a design variable to an outcome.
  - **Mechanism**: the microstructural or physical pathway.
  - **Evidence strength**: strong, moderate, weak, or speculative.
  - **Key assumption**: what must be true for the mechanism to operate.
  - **Predicted observation**: expected structural, property, and functional signatures.
  - **Likely failure mode**: how the hypothesis could fail without invalidating the broader direction.
- Explicitly separate verified prior evidence, transferable inference, and speculative extension.
- **Decision gate**: Stop if hypotheses are not mutually discriminable with the available measurements.

## 3. Design minimal viable validation
- **Independent variables**: select one dominant structural, compositional, or process variable per cycle; add a second factor only to test a proposed interaction.
- **Dependent variables**: primary functional observable and secondary diagnostics (stability, durability, reproducibility).
- **Covariates**: geometry, contact configuration, environment, and history.
- **Controls**:
  - Negative / baseline: unmodified system.
  - Material / process control: component alone or process without the functional modification.
  - Ablation / leaching control: test whether detached species or artifacts explain the signal.
  - Benchmark control: relevant literature or commercial comparator when available.
- **Success criteria**: predefined improvement in the target metric without unacceptable loss in secondary metrics.
- **Stop conditions**: irreproducible fabrication, failed controls, artifact-dominated signal, or safety/ethics boundary breach.
- **Decision gate**: Stop if controls are insufficient to isolate the proposed mechanism.

## 4. Execute structure–property–function characterization
- Characterize baseline structure before functional testing.
- Measure properties and function under matched conditions; normalize by mass, area, thickness, loading, or exposure where appropriate.
- Require at least two independent lines of evidence before claiming a structure–function causal link.
- Screen for confounders: contact resistance, heating, drift, thickness variation, porosity differences, hydration state, environmental changes, and measurement geometry.
- **Decision gate**: Stop if artifacts explain the signal, if reproducibility is poor, or if structure and function data are not synchronized.

## 5. Discriminate mechanisms through model comparison
- Compare at least one mechanism-consistent model against an artifact or alternative model.
- Evaluate fit quality, parameter physical interpretability, and residual patterns.
- Look for regime-transition signatures (scaling changes, plateau, hysteresis, noise shifts) and require independent structural or diagnostic support before claiming a transition.
- Rank mechanisms by evidence; explicitly exclude unsupported mechanisms.
- **Decision gate**: Stop if model ambiguity persists after adding controls or if the structural variable lacks sufficient resolution to support the claim.

## 6. Iterate and redesign
- Update each hypothesis as supported, weakened, or rejected based on controlled evidence.
- Identify the weakest link in the evidence chain (e.g., conversion quality, dispersion, interface, architecture fidelity, contact artifact).
- Choose the next action:
  - **Advance** if reproducible improvement and acceptable trade-offs are demonstrated.
  - **Refine** if the mechanism is plausible but under-optimized.
  - **Pivot** if the wrong variable or control condition was chosen.
  - **Abandon** if the mechanism is unsupported after minimal validation.
- Narrow the design space before expanding it; convert unexpected interactions into new hypotheses.
- **Decision gate**: Stop if the next cycle cannot reduce uncertainty or if continued testing only optimizes paper-specific parameters rather than testing a generalizable mechanism.

## 7. Bound claims and document failure modes
- State exactly what the evidence supports and where the claim stops (material family, architecture, environment, loading mode, timescale).
- Document negative evidence and null results as boundary markers, not wasted outcomes.
- Flag residual risks: untested scalability, untested long-term durability, untested biological or environmental safety, and unverified transfer to other systems.
- **Final gate**: Review against the Validity Checks checklist before finalizing outputs.

# Output Format

When using this skill, return:

1. **Research question** — One concise, falsifiable question tied to a structural variable, observable, and mechanism.
2. **Gap and rationale** — What is unknown, why it matters, and what is known versus inferred.
3. **Hypotheses** — At least three hypotheses with mechanism, evidence strength, key assumptions, predicted observations, and likely failure modes.
4. **Experimental design** — Minimal viable validation plan with variables, controls, evaluation metrics, success criteria, and stop conditions.
5. **Analysis plan** — Structure–property–function linkage, competing model comparison, confounder checks, trade-off visualization, and uncertainty reporting.
6. **Iteration rules** — How to update hypotheses and decide to advance, refine, pivot, or abandon based on possible outcomes.
7. **Validity and safety review** — Confounder checks, reproducibility requirements, statistical validity, boundary conditions, and non-operational safety/ethics constraints.
8. **Claim boundary statement** — Explicit limits on generalization, transferability, and prohibited conclusions (e.g., no clinical or deployment-ready claims).

# Validation Gates

- **Falsifiability gate**: The research question and each hypothesis must be capable of being weakened or rejected by observable data.
- **Control adequacy gate**: Every mechanism claim requires a baseline, a material/process control, and an ablation or artifact control where feasible.
- **Orthogonal evidence gate**: Structure–function causality requires at least two independent measurement classes converging on the same interpretation.
- **Reproducibility gate**: Independent sample preparation, repeated measurements, and documented variability are required before advancing a hypothesis.
- **Statistical validity gate**: Predefined endpoints, normalization rules, outlier handling, and uncertainty estimates must be in place before data collection.
- **Boundary gate**: Claims must be scoped to the tested material family, architecture, environment, and measurement regime; extrapolation requires explicit justification.

# Claim Boundaries

- Do not generalize a mechanism from a single substrate, single filler, single assay, or single architecture to the entire field.
- Do not present research-planning outputs as clinical recommendations, product specifications, or deployment-ready engineering designs.
- Do not infer long-term durability, environmental safety, or biological compatibility from short-term or single-condition tests.
- Separate observed results from interpretation, and label all new hypotheses with evidence strength and failure modes.
- Treat single-paper or single-system observations as hypothesis-generating evidence, not domain consensus.

# Failure Modes

- **Artifact-dominated signal**: The apparent effect is explained by contact geometry, heating, drift, thickness variation, or measurement configuration rather than the proposed mechanism.
- **Leaching or detachment**: Observed function arises from soluble or particulate species rather than the intact composite architecture.
- **Morphology collapse**: Structural changes during processing or testing invalidate the intended mechanism pathway.
- **Poor reproducibility**: Trends disappear across batches, samples, or independent preparations.
- **Confounded variables**: Multiple design factors change simultaneously, preventing mechanism isolation.
- **Model ambiguity**: Competing models fit the data equally well, or fitted parameters lack physical interpretability.
- **Untested boundary conditions**: Performance is assumed to transfer to untested environments, scales, or loading modes.

# Validity Checks

- **Confounding**: Could geometry, contact, environment, processing history, or measurement artifacts explain the signal?
- **Reproducibility**: Are results stable across independent samples, cycles, and reasonable preparation variations?
- **Statistical validity**: Are differences larger than noise and replicate variability? Are outliers investigated rather than averaged away?
- **Mechanism validity**: Is there structural or diagnostic evidence for the proposed mechanism? Are alternative explanations ruled out or retained?
- **Boundary conditions**: Does the conclusion depend on a narrow geometry, material purity, or environmental condition?
- **Evidence separation**: Are prior verified results, new inferences, and speculative extensions clearly labeled?
- **Safety and ethics**: Are material handling, environmental, biological, and regulatory constraints reviewed at the planning stage? Are operational hazards excluded from outputs?

# Provenance

Derived from cluster 5.1 (observable-driven mechanism discovery and validation) and synthesized from the following representative source skills:
- biofiber-templated-nanostructure-discovery
- anisotropic-cartilage-construct-exploration
- porous-fiber-thermal-exploration
- waste-derived-inorganic-filler-composite-design
- soft-conductive-architected-materials-research
- nanoscale-transport-research-planning
- centrifugal-nanofiber-filtration-exploration
- nanofibrous-membrane-research-design
