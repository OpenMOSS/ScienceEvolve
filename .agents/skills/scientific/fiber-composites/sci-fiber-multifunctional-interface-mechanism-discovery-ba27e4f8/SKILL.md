---
name: sci-fiber-multifunctional-interface-mechanism-discovery-ba27e4f8
description: A reusable end-to-end workflow for generating, testing, and bounding mechanism claims in multifunctional electrochemical interface and electrode systems where coupled transport, interfacial, and stability failure modes interact.
scienceevolve-title: "Fiber composites and battery materials · multifunctional interface mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Use this skill to drive observable-driven mechanism discovery and validation in multifunctional electrochemical systems. It teaches a reusable method: decompose coupled failure modes into interacting transport, interfacial, and degradation pathways; generate mechanism-linked hypotheses; design conceptual experiments with layered controls and discriminating diagnostics; analyze evidence by triangulation; and bound claims before iterating or stopping.

# When to use

Trigger this skill when the user asks to:

- propose new research questions or hypotheses for coupled-interface or multifunctional material systems (e.g., conversion battery electrodes, separators, electrolyte interfaces);
- design non-operational experimental plans that isolate mechanism from artifact;
- interpret electrochemical, spectroscopic, or transport evidence in terms of competing mechanisms;
- iterate after mixed, negative, or inconclusive results;
- bound mechanism claims and identify extrapolation limits.

Do not use this skill to provide executable laboratory procedures, hazardous handling instructions, material synthesis recipes, or device assembly protocols.

# Inputs required

Ask for or infer the following before generating a plan:

- Target electrochemical system and practical operating regime.
- Dominant suspected failure modes and their suspected coupling.
- Candidate multifunctional intervention or design variable (conceptual level only).
- Available characterization and diagnostic capabilities.
- Constraints: safety, reproducibility, scalability, cost, and environmental considerations.
- Desired output: hypothesis set, study design, analysis plan, iteration strategy, or claim critique.

If critical information is missing, proceed with explicit assumptions and label the plan as assumption-sensitive.

# Core Workflow

Execute the following stages in order. Each stage includes a decision gate; stop or iterate when a gate fails.

## 1. Coupled Failure Decomposition

- Map the device-level symptom to at least two interacting failure pathways (e.g., transport limitation coupled with interfacial instability).
- Define reusable mechanistic descriptors for each pathway (e.g., active-ion transference, interfacial resistance, intermediate retention, mechanical integrity).
- **Decision gate:** If fewer than two interacting failure modes can be explicitly defined, stop and refine the bottleneck map before proceeding.

## 2. Mechanism-Linked Hypothesis Generation

- For each coupled bottleneck, state a causal chain: if [design change] alters [mechanistic descriptor], then [failure mode] decreases and [device metric] improves, provided [trade-off constraint] holds.
- Label each hypothesis with evidence strength (high / medium / low / speculative), key assumptions, likely failure modes, a discriminating observation, and boundary conditions.
- **Decision gate (Candidate gate):** Reject hypotheses that lack a falsifiable mechanism proxy or a feasible discriminating control. Reformulate until both exist.

## 3. Conceptual Experimental Design

- Define independent variables (intervention presence, location, architecture), dependent variables (performance and mechanism proxies), and confounders.
- Specify a layered control set: baseline, negative control, single-function control, inert/placebo control, and a positive control if available.
- Select a balanced metric panel covering material, transport/interface, degradation, and device levels.
- Define success, inconclusive, and stopping thresholds before any conceptual data collection.
- **Decision gate (Control adequacy):** If the control matrix cannot isolate the proposed mechanism from morphology, conductivity, or processing artifacts, redesign before proceeding.

## 4. Minimum Viable Validation

- Execute the smallest test set that can support or falsify the mechanism: confirm structural/chemical intent, measure one transport or kinetic proxy, measure one interfacial or degradation proxy, and compare primary performance against controls under a practical stress condition.
- **Decision gate (Stability/Safety gate):** If the intervention degrades a decisive practical metric or approaches safety/compliance boundaries, stop and pivot.

## 5. Control-First Evidence Layering

- Tabulate results by evidence layer (structure, transport/interface, degradation, device) before making mechanism claims.
- Compare the intervention against all controls first; do not interpret candidate performance in isolation.
- Check mechanism convergence: stronger claims require multiple independent probes to point in the same direction.
- Inspect trade-offs: verify that gains in one metric do not mask losses in utilization, kinetics, or long-term stability.
- **Decision gate (Mechanism exclusion):** If inert or single-function controls match the multifunctional design, exclude the proposed chemical or mechanistic explanation and prioritize physical-effect or artifact models.

## 6. Mechanism Discrimination and Triangulation

- Cross-check electrochemical trends with structural, chemical, and transport evidence.
- Test whether the proposed mechanism explains both observed benefits and observed trade-offs.
- Assess reproducibility across independent preparations or replicates.
- **Decision gate (Robustness check):** If results are inconsistent across batches, regions, or orthogonal probes, treat the mechanism as unverified and add diagnostics rather than generalizing.

## 7. Claim Bounding and Iteration

- Label each conclusion: target-validated, source-analogy-supported, assumption-sensitive, speculative, or not transferable.
- State boundary conditions (tested chemistry, format, loading, and operating context).
- **Decision gate (Iteration gate):**
  - **If supported:** escalate to boundary-condition testing (e.g., higher loading, longer duration, alternative formats).
  - **If partially supported:** identify the weakest mechanism link and add one orthogonal diagnostic.
  - **If contradicted:** revise the coupled failure map or stop.
  - **If ambiguous:** redesign the control matrix before adding new candidates.

# Output Format

Return results in this structure:

```text
1. Research question
   - Target bottleneck:
   - Practical constraint:
   - Coupled failure hypothesis:

2. Mechanism map
   - Transport/pathway layer:
   - Interface/stability layer:
   - Degradation layer:
   - Device-level layer:

3. Candidate hypotheses
   For each:
   - Hypothesis:
   - Mechanism chain:
   - Evidence strength:
   - Key assumptions:
   - Likely failure mode:
   - Discriminating observation:
   - Boundary condition:

4. Experimental design schema
   - Independent variables:
   - Controls (baseline, negative, single-function, inert, positive):
   - Dependent variables / metrics:
   - Confounders:
   - Success/stop conditions:

5. Analysis plan
   - Evidence layering strategy:
   - Control-first interpretation rules:
   - Trade-off checks:
   - Evidence grading:

6. Iteration rules
   - If supported:
   - If partially supported:
   - If contradicted:
   - If ambiguous:

7. Validity and boundary statement
   - Claim boundaries:
   - Extrapolation limits:
   - Safety/compliance boundaries:
```

# Validation Gates

Before executing or finalizing a research plan, confirm:

- **Coupled-failure clarity:** At least two interacting failure modes are explicitly defined.
- **Mechanism specificity:** The hypothesis predicts a chemical, interfacial, or transport effect beyond generic physical changes.
- **Control adequacy:** Controls isolate material, electrolyte, separator, interface, and morphology contributions.
- **Metric balance:** Material, transport/interface, degradation, and device-level metrics are all represented.
- **Reproducibility:** Repeated independent samples or batches are included where feasible.
- **Boundary conditions:** Claims are scoped to the tested chemistry, format, loading, and operating context.
- **Extrapolation hygiene:** Source-paper or analogy observations are separated from new-system inferences.
- **Safety and ethics:** The plan avoids operational instructions for hazardous materials and stays at the research-design level.

# Claim Boundaries

- Distinguish **target-validated** (direct evidence in the user’s system), **analogy-supported** (plausible by similarity to literature), **assumption-sensitive** (depends on unverified conditions), and **speculative** (logical but untested).
- Do not generalize a single candidate result to all material families or device formats.
- Do not treat one source study as field-wide consensus.
- Limit mechanism claims to the diagnostic window and stress conditions actually tested.

# Failure Modes

Stop or redesign when:

- The candidate improves one local metric but worsens full-device utilization or stability.
- The integrated device fails without diagnostic evidence.
- An inert or placebo control performs similarly, weakening the proposed mechanism.
- A single-function control matches the multifunctional design, undermining synergy claims.
- Post-operation evidence contradicts the proposed interphase or transport mechanism.
- Results are irreproducible across independent preparations.
- The plan depends on copied source-system parameters rather than target-domain justification.
- Safety-relevant instability appears.

# Validity Checks

When interpreting results:

- Confirm the intended structural or chemical change occurred before attributing performance differences.
- Normalize metrics consistently across all compared configurations.
- Separate first-cycle or activation behavior from long-term degradation trends.
- Flag outliers before mechanistic interpretation.
- Require at least two independent probes to support any mechanistic claim.
- Report variability, batch effects, and excluded data transparently.
- If different measurement methods disagree, identify their underlying assumptions and add an orthogonal probe.

# Provenance

- Synthesized from cluster **44.1** (observable-driven mechanism discovery and validation), cluster 44.
- Source skills: `li-s-coupled-interface-research-design` (10.1016/j.jechem.2019.10.009), `lis-sulfur-cathode-research-workflow` (10.1021/acsomega.3c00361), `li2s-graphene-battery-cathode-research-pattern` (10.1002/ppsc.201300358), `solid-state-lis-polymer-electrolyte-research-design` (10.1007/s10853-021-05832-2), `multifunctional-network-binder-research` (10.1002/smll.201801536), `dynamic-bond-self-healing-electrode-design` (10.1016/j.ensm.2020.10.025), `interface-coupled-flux-lis-battery-research` (10.1016/j.jcis.2020.01.066), `biomass-carbon-electrode-research` (10.1093/ce/zkag003).
