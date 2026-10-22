---
name: sci-polymer-composite-thermoset-mechanism-discovery-wor-72df24dc
description: Reusable end-to-end workflow for discovering and validating structure-property mechanisms in polymer, composite, and thermoset systems through hypothesis-driven experimentation, multi-level controls, and iterative mechanism refinement.
scienceevolve-title: "Polymer composites and vitrimers · composite thermoset mechanism discovery workflow 5"
scienceevolve-area: polymer-composites-and-vitrimers
---

# Purpose

Help an agent transform a materials-performance gap into a controlled, mechanism-driven research program. The workflow guides hypothesis generation, experimental design, multi-stream analysis, and iterative refinement for polymer, composite, and thermoset systems where performance is governed by interfacial, network, or degradation mechanisms.

# When to use

Use when the user asks to:

- Generate research questions for additive, filler, fiber, matrix, or interface modification in polymers, thermosets, or composites.
- Design experiments that link formulation changes to mechanistic outcomes such as flame retardancy, thermal protection, mechanical performance, or recyclability.
- Evaluate trade-offs between safety, mechanical, thermal, and processing properties.
- Iterate hypotheses based on multi-level evidence from structure, interface, residue, and bulk performance.

Do not use for operational lab recipes, clinical or consumer safety advice, or product certification.

# Inputs required

Ask for or infer the following before proposing a plan:

- Target material class (matrix, reinforcement, filler, architecture).
- Performance bottleneck or failure mode (e.g., flammability, debonding, thermal degradation, brittleness).
- Candidate modification concept (additive, surface treatment, monomer, scaffold-function pair).
- Available characterization capabilities and constraints.
- Application constraints (sustainability, safety, regulatory, cost).
- Minimum acceptable property retention and primary success metric.

If inputs are missing, state assumptions clearly and frame the output as a preliminary research plan.

# Core Workflow

## 1. Frame the gap and map the failure pathway
- Define the coupled performance gap (e.g., safety versus mechanics, durability versus recyclability).
- Identify the dominant failure pathway: volatile fuel release, weak char, poor barrier, unstable network, low crosslink density, interfacial debonding, or inefficient load transfer.
- State boundary assumptions: polymer family, processing route, and service environment.

## 2. Generate mechanism-linked hypotheses
For each candidate modification, produce at least three hypotheses containing:
- **Mechanism statement**: How the modification alters the failure pathway.
- **Evidence strength**: Strong, Moderate, Weak, or Speculative.
- **Key assumptions**: What must be true for the mechanism to operate.
- **Expected observable signatures**: Specific signals in structure, interface, thermal, mechanical, or residue data.
- **Likely failure modes**: At least two ways the hypothesis could fail (e.g., agglomeration, plasticization, cure disruption, weak boundary layer).
- **Non-extrapolation boundary**: Conditions where the hypothesis should not be assumed valid.

## 3. Design controlled experiments
### Required controls
- **Baseline**: Unmodified matrix with matched processing history and geometry.
- **Process control**: Subjected to the same handling environment without the active modification.
- **Negative control**: Inactive analogue or scaffold without the active function.
- **Positive control**: Known benchmark, if available.
- **Analogue controls**: Scaffold-only and function-only when testing integration.

### Variables
- **Independent**: Modification identity, loading or intensity, architecture, atmosphere, or processing variable.
- **Dependent**: Structure, cure or network state, thermal stability, mechanical response, hazard or protection metrics, residue morphology, and smoke or gas indicators.
- **Covariates**: Batch identity, moisture history, void content, specimen geometry, fiber orientation, and cure state.

### Staging and stop gates
- **Screening**: Test a small dose series to reveal non-monotonic behavior; do not assume more modification is better.
- **Mechanism validation**: Require orthogonal evidence streams before claiming causation.
- **Stop or redesign if**:
  - Unacceptable mechanical or thermal degradation occurs.
  - Improvement appears only at excessive loading.
  - Smoke, toxicity, or residue instability worsens.
  - Mechanism evidence contradicts the proposed model.
  - Replicate variability prevents confident interpretation.

## 4. Execute multi-level analysis
Analyze in a converging-evidence sequence:
1. **Structure and composition**: Confirm the modification exists as intended before interpreting performance.
2. **Process and network**: Check cure, conversion, crosslink density, dispersion, and compatibility.
3. **Bulk performance**: Compare modified versus baseline for primary and secondary metrics; inspect full response curves, not only peak values.
4. **Interface and fracture**: Examine debonding, pullout, crack path, wetting, and interphase gradients.
5. **Residue and degradation**: Link char quality, volatile suppression, and thermal decomposition behavior to the proposed mechanism.
6. **Trade-off matrix**: Map gains against losses across all relevant property dimensions.

**Decision gate**: If performance improves but mechanism evidence is absent, classify the claim as provisional and require additional mechanism validation.

## 5. Iterate based on evidence classification
After each experimental round, classify the outcome:
- **Supported**: Target improvement plus consistent mechanism evidence and no dominant defects → proceed to boundary-condition testing.
- **Partially supported**: Improvement in one metric with degradation in another → isolate the trade-off and revise the weakest mechanistic link.
- **Refuted**: No improvement or mechanism contradiction → revise the hypothesis or change the modification lever.
- **Inconclusive**: High variability or confounding → improve process control or measurement precision before redesign.

**Iteration rules**:
- Change only one major feature per cycle.
- Preserve negative results as boundary conditions for future hypotheses.
- Escalate to broader validation only after minimal mechanism support and acceptable reproducibility are achieved.

## 6. Finalize validity and boundary statement
- Separate observed results from inferred mechanisms and speculative extrapolations.
- State what is directly supported, what is inferred, and what remains untested.
- Define application boundaries including material class, loading range, environment, and geometry.

# Output Format

Return a structured research plan containing:

1. **Research Question** — Target system, bottleneck, and scientific gap.
2. **Candidate Hypotheses** — Table with mechanism, evidence strength, assumptions, expected signatures, failure modes, and boundaries.
3. **Experimental Design** — Controls, variables, staging plan, metrics, and stop conditions.
4. **Analysis Plan** — Converging-evidence sequence, trade-off matrix, and mechanism-integration rules.
5. **Iteration Plan** — Actions for supported, partial, refuted, and inconclusive outcomes.
6. **Validity Statement** — Confounders addressed, reproducibility checks, statistical cautions, and generalization limits.
7. **Safety and Ethics Note** — Non-operational boundaries; defer execution to qualified personnel and approved protocols.

# Validation Gates

Before finalizing any plan or claim, confirm:

- Baseline and modified samples share matrix, processing history, specimen geometry, and test timing.
- The candidate has a clear mechanism-to-function map.
- Controls are sufficient to isolate the proposed mechanism from processing artifacts.
- More than one loading level or intensity is tested.
- Mechanical interpretation accounts for crosslink density, phase separation, dispersion, and voids.
- Thermal or hazard interpretation accounts for atmosphere, geometry, calibration, and standard-specific context.
- Mechanism claims are supported by at least two independent evidence streams.
- Literature comparisons are treated as context, not consensus.
- New hypotheses are labeled by evidence strength and include explicit failure modes.

# Claim Boundaries

- **Observed result**: What the data directly show in the tested system.
- **Inferred mechanism**: What the data suggest, supported by orthogonal evidence.
- **Speculative extrapolation**: Any claim extending beyond the tested material, formulation, geometry, or environment.
- Do not present single-study findings as field-wide conclusions or product-ready performance guarantees.

# Failure Modes

Common ways this workflow can fail or mislead:

- **Confounding by processing**: Cure state, dispersion, moisture, or void content explains the result rather than the intended mechanism.
- **Single-metric optimization**: Improving one property while ignoring trade-offs in toughness, smoke, processability, or stability.
- **Mechanism overreach**: Attributing performance to a mechanism without residue, interface, or degradation evidence.
- **Non-monotonic loading**: Assuming higher additive loading always improves performance and missing the optimal window.
- **Inadequate controls**: Missing baseline, process, or analogue controls leading to false attribution.
- **Variability neglect**: Interpreting mean trends without assessing replicate consistency.
- **Boundary violation**: Extrapolating across polymer classes, reinforcement architectures, or regulatory contexts without evidence.

# Validity Checks

- **Mechanism specificity**: Does the plan test the proposed mechanism rather than only measuring bulk performance?
- **Control adequacy**: Are baseline, negative, positive, and analogue controls aligned with the causal claim?
- **Direction dependence**: Are reinforcement-dominated and interface-dominated responses separated?
- **Trade-off visibility**: Are all relevant properties considered, including mechanical, thermal, hazard, and processability?
- **Statistical validity**: Are endpoints predefined, replication appropriate, and effect sizes reported with uncertainty?
- **Reproducibility**: Are independent batches, consistent settings, and predefined exclusion rules included?
- **Boundary conditions**: Are limits on generalizability explicitly stated?

# Provenance

Derived from cluster 36 / subcluster 36.0 (composite-flame-retardant-thermoset-epoxy mechanism discovery and validation). Synthesized from source skills: polymer-flame-retardant-research-workflow, composite-interphase-research-workflow, bio-based-composite-recycling-research-workflow, flame-retardant-biobased-epoxy-research-workflow, thermally-protective-composite-research-design, inorganic-filler-polymer-interface-exploration, fiber-resin-interface-exploration, bio-derived-flame-retardant-research-design.
