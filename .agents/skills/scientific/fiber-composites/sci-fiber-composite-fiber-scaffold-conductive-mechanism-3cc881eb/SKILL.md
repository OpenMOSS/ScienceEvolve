---
name: sci-fiber-composite-fiber-scaffold-conductive-mechanism-3cc881eb
description: An end-to-end workflow for discovering and validating structure-function mechanisms in composite, fiber, and scaffold systems where transport, interfacial, or architectural properties are central.
scienceevolve-title: "Fiber composites and battery materials · composite fiber scaffold conductive mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Use this skill to plan and execute reusable, evidence-graded research programs for composite, fiber, scaffold, and interfacial material systems. It guides the transition from an observed performance bottleneck to a validated causal mechanism through controlled hypothesis generation, multiscale experimentation, and structured iteration—without treating any single source study as field consensus.

# When to use

- When exploring new material combinations where architecture, interface, or connectivity is hypothesized to control transport, mechanical, electrochemical, or biological function.
- When a user needs to separate structural effects from functional-material effects in layered, porous, or hybrid systems.
- When designing experiments that must link morphology, interphase chemistry, and system-level performance through orthogonal evidence.
- When iterating on a design based on mechanism discrimination rather than single-metric optimization.

# Inputs required

- Target system class and intended function (e.g., transport, storage, sensing, structural, biological organization).
- Observed bottleneck or empirical mismatch.
- Candidate architectural levers (e.g., interlayers, scaffolds, fillers, templates, pores, gradients).
- Available characterization and measurement capabilities.
- Boundary conditions: material compatibility, environmental limits, safety/compliance scope, and acceptable structural or functional trade-offs.
- Baseline or benchmark systems for comparison.

If inputs are missing, state assumptions explicitly, label them uncertain, and design the plan so the assumption can be tested early.

# Core Workflow

1. **Bottleneck Framing**  
   Define the empirical mismatch as a coupled constraint across structure, interface, and function. Identify whether the gap is transport-limited, connectivity-limited, compatibility-limited, or architecture-limited.  
   *Decision gate:* Stop and collect baseline data if the bottleneck cannot be expressed as a reproducible observation.

2. **Mechanism Mapping**  
   Build a causal chain from an architectural lever (e.g., interlayer, scaffold, filler, pore network) to a mesoscale mechanism (e.g., percolation, interphase bonding, confinement, orientation) to a system-level response.  
   *Decision gate:* If the chain lacks an identifiable interphase or mesoscale link, reformulate the hypothesis before designing experiments.

3. **Hypothesis Generation**  
   Produce ranked, falsifiable hypotheses. For each, state the mechanism claim, evidence strength (strong/moderate/weak/speculative), key assumptions, most discriminating observation, and likely failure modes.  
   *Decision gate:* Reject hypotheses that cannot be falsified by the available measurement and control set.

4. **Study Design with Strong Controls**  
   Define independent variables, baseline, process-only, component-isolation, negative, and positive controls. Predefine primary/secondary metrics, replication, blocking/randomization, and stop conditions.  
   *Decision gate:* If the design cannot separate architecture effects from material effects or processing artifacts, add controls or narrow the factor space before execution.

5. **Execution and Orthogonal Evidence Collection**  
   Gather structural/morphological, mechanistic/interphase, and functional/performance data independently. Document measurement conditions, calibration, and metadata.  
   *Decision gate:* Pause if structural integrity is lost, controls fail, or safety/compliance boundaries are breached.

6. **Mechanism-Discrimination Analysis**  
   Link structure to mechanism before linking mechanism to performance. Use control-normalized comparisons, statistical checks, and uncertainty quantification. Exclude alternative explanations such as generic surface area, uncontrolled dispersion, or measurement artifact.  
   *Decision gate:* If structure and performance improve but mechanism diagnostics are missing, downgrade the claim to correlational and require targeted follow-up before causation is asserted.

7. **Evidence Update and Iteration**  
   - *If supported:* Test robustness under boundary conditions (loading, environment, architecture variants) before generalizing.  
   - *If partially supported:* Isolate the limiting factor (connectivity, compatibility, dispersion, stability) and redesign one variable at a time.  
   - *If rejected:* Record boundary conditions and pivot to the next-ranked hypothesis.  
   *Stop conditions:* Trigger when reproducible gain with acceptable trade-offs is demonstrated; when controls refute the mechanism; when a simpler design matches performance; or when variability prevents interpretation.

# Output Format

When using this skill, produce:

1. **Research question and bottleneck framing** — One concise question tied to a reproducible structural or functional gap.
2. **Evidence-graded hypotheses table** — For each hypothesis: mechanism claim, evidence strength, key assumptions, likely failure modes, and discriminating observations.
3. **Study plan** — Variables, controls, primary and secondary metrics, replication/blocking strategy, and stop conditions.
4. **Analysis plan** — How to link structure → mechanism → performance, including normalization, statistical checks, and uncertainty reporting.
5. **Decision log** — Iteration rules for supported, partial, and rejected outcomes.
6. **Claim boundary statement** — Extrapolation limits, tested boundary conditions, and validity checklist.

# Validation Gates

- Controls must isolate architecture effects from material effects and processing artifacts.
- Structural readouts must precede functional attribution.
- Replicates and randomized or blocked runs must support variability estimates.
- Stop conditions must be triggered before proceeding to optimization without mechanistic understanding.
- Mechanism claims require converging evidence from at least two independent diagnostic categories (e.g., morphology + transport, or interphase chemistry + performance).

# Claim Boundaries

- Distinguish observed results from model predictions and extrapolated recommendations.
- Restrict claims to tested material systems, geometries, and environmental conditions.
- Do not generalize from screening-scale or in vitro results to deployment-ready performance.
- Label source-paper observations separately from analogical inferences and newly generated hypotheses.
- Treat coin-cell, half-cell, or single-specimen results as screening evidence only.

# Failure Modes

- **Confounded variables:** Multiple factors change simultaneously, preventing mechanism attribution.
- **Missing mechanism diagnostics:** Performance improves but structural or interphase evidence is absent.
- **Control ambiguity:** Treated and process-only conditions are indistinguishable.
- **Non-monotonic behavior:** Competing mechanisms produce misleading optima.
- **Extrapolation risk:** Applying results beyond tested boundary conditions.
- **Reproducibility failure:** High batch-to-batch or sample-to-sample variability.
- **Trade-off inversion:** Improvement in one metric causes unacceptable loss in another required property.

# Validity Checks

- Are source-supported facts separated from agent-generated hypotheses?
- Does each hypothesis include evidence strength, key assumptions, and failure modes?
- Are structural and functional readouts paired with appropriate controls?
- Are confounders addressed (dispersion, porosity, wetting, cure history, contact resistance, assay interference, imaging bias)?
- Are statistical validity, replication, and uncertainty explicitly handled?
- Are measurement conditions documented and normalized?
- Are safety and ethics boundaries respected and kept non-operational?
- Does the plan avoid treating one paper result as field-wide consensus?

# Provenance

- Derived from cluster 11.1 (observable-driven mechanism discovery and validation).
- Synthesized from source skills: conductive-interlayer-composite-exploration, electrospun-hybrid-fiber-doe-research, bio-templated-anode-exploration, interface-templated-nanomaterial-research, anisotropic-3d-scaffold-research-agent, doe-parameterized-fabrication-research, nanomodified-composite-interphase-research-design, li-s-cathode-defect-engineering.
- Paper-specific parameters, numerical results, material systems, and operational protocols have been excluded from the reusable workflow body.
