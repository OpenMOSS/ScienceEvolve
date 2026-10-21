---
name: sci-aqueous-observable-driven-mechanism-discovery-workf-9a00be0a
description: A reusable end-to-end workflow for proposing, testing, and validating mechanistic hypotheses in electrochemical energy-storage research through coupled failure diagnosis, orthogonal evidence integration, and controlled iteration.
scienceevolve-title: "Aqueous battery interfaces · observable driven mechanism discovery workflow 2"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Use this skill to transform an observed performance bottleneck or failure mode into a structured research program that discovers and validates the underlying mechanism. It guides hypothesis generation, minimum viable experiment design, multi-scale analysis, and iterative refinement while enforcing strict claim boundaries and control-based validation.

# When to use

Use this skill when:
- A user needs to move from an observed symptom (e.g., nonuniform deposition, rapid fade, impedance growth) to a testable mechanistic explanation.
- The task requires designing experiments that isolate mechanisms rather than optimize single performance metrics.
- The context involves coupled transport-chemistry-mechanics problems at interfaces or within active materials.
- The user needs iteration rules, stop conditions, and claim-bounding for an ongoing research program.

# Inputs required

Collect or infer before generating a plan:

1. **Observable bottleneck** — the failure mode and the system-level metric it degrades.
2. **Target architecture** — chemistry, cell format, and operating regime at a descriptive level.
3. **Candidate levers** — proposed interventions hypothesized to alter the mechanism.
4. **Diagnostic families** — available electrochemical, structural, spectroscopic, morphological, or transport measurements.
5. **Baselines and comparators** — unmodified systems, literature benchmarks, and null controls.
6. **Constraints** — safety, resource, reproducibility, and environmental limits.
7. **Evidence boundaries** — what is established, disputed, or single-study in the literature.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

## Step 1: Define the coupled failure problem
- Treat the bottleneck as a transport-chemistry-mechanics coupling, not an isolated symptom.
- Map the pathway from source to sink, marking where side reactions, mechanical failure, or transport limits may intervene.
- **Gate:** If the bottleneck cannot be linked to at least one intermediate mechanism, stop and request more observables.

## Step 2: Generate falsifiable mechanism hypotheses
- For each candidate lever, produce a hypothesis card containing:
  - Claim: how the lever alters the mechanism.
  - Expected signature: the observable shift that would support the claim.
  - Evidence strength: low, moderate, or high based on prior evidence and plausibility.
  - Key assumptions: what must be true for the claim to hold.
  - Most likely failure mode: the main alternative explanation.
  - Discriminating experiment: the smallest test that could falsify the claim.
- **Gate:** If a hypothesis cannot be falsified with available diagnostics, reformulate or deprioritize it.

## Step 3: Design minimum viable validation (MVV)
- Compare the candidate against a baseline and at least one ablation or mechanism-specific control.
- Isolate one design variable at a time; hold loading, geometry, and assembly conditions matched.
- Predefine metrics tied to mechanism signatures, not only endpoint performance.
- Predefine stop conditions:
  - Safety-critical anomalies.
  - Unmatched controls or irreproducible preparation.
  - Mechanistic evidence that contradicts the hypothesis.
  - Apparent gains explained by normalization or background artifacts.
- **Gate:** If controls cannot be matched or replicated, stop and redesign.

## Step 4: Collect orthogonal evidence
- Gather at least three independent evidence families before making mechanism claims (e.g., electrochemical response, structural characterization, chemical-state analysis).
- Record state-resolved data: pristine, early-cycle, mid-cycle, late-cycle, and failed states.
- **Gate:** If evidence families conflict, flag hidden variables or measurement artifacts before proceeding.

## Step 5: Integrate and analyze
- Normalize all metrics consistently; report both raw and normalized interpretations.
- Apply ablation logic: removing a functional component should eliminate its claimed contribution.
- Separate kinetic, thermodynamic, morphological, and interfacial contributions.
- Distinguish material-level evidence from device-level evidence.
- **Gate:** If the improvement disappears after background subtraction or normalization, reject the mechanism claim.

## Step 6: Decision gate — Keep, revise, or reject
- **Keep:** Orthogonal evidence converges; proceed to stronger validation or boundary testing.
- **Revise:** One evidence family supports but another contradicts; identify the limiting factor and return to Step 2 to redesign the lever.
- **Reject:** Controls explain the result, the mechanism is contradicted, or gains are artifactual; archive the failure mode and return to Step 2 with updated constraints.
- **Stop condition:** If two revision cycles fail to resolve contradictions, abandon the hypothesis branch.

## Step 7: Boundary test and claim bounding
- State the chemistry, operating regime, and failure mode where the hypothesis is expected to hold.
- Label conclusions as:
  - *Paper-verified pattern* — directly supported by source literature in its original system.
  - *Agent-inferred extension* — mechanistically plausible transfer to a new system, requiring new controls.
  - *Speculative hypothesis* — plausible but unconstrained by current evidence.
- **Gate:** Do not generalize beyond tested boundaries without labeling as extrapolation.

## Step 8: Iterate or escalate
- If kept, propose the next discriminating experiment to tighten boundary conditions or test transferability.
- If revised, return to Step 3 with the updated hypothesis.
- If rejected, pivot to the next-ranked hypothesis from Step 2.
- **Final stop:** The research question is answered or all viable hypotheses are exhausted.

# Output Format

Return a structured research plan containing:

1. **Research question** — tied to a coupled failure mode.
2. **Mechanism map** — linking design levers to degradation modes and expected signatures.
3. **Hypothesis portfolio** — each with claim, evidence strength, key assumptions, and falsification condition.
4. **Experimental design** — MVV, controls, variables, metrics, and stop conditions.
5. **Analysis plan** — normalization rules, mechanism-separation logic, artifact checks, and evidence-integration rules.
6. **Iteration decision tree** — keep/revise/reject criteria and next steps.
7. **Validity and safety notes** — confounders, boundary conditions, reproducibility checks, and non-operational safety boundaries.

# Validation Gates

- **Mechanistic specificity:** Each proposed mechanism must have a distinct expected signature and a control that can falsify it.
- **Control adequacy:** Baseline, negative, positive, ablation, and artifact controls must be present and matched.
- **Reproducibility:** Independent batches, repeated measurements, and documented variability are required before claims.
- **Normalization validity:** Metrics must be normalized consistently; mass, area, and loading bases must be explicit.
- **Statistical validity:** Success and failure criteria must be predefined; uncertainty must be reported; selective reporting is prohibited.
- **Boundary validity:** Claims must state the regime where they hold; extrapolation requires new validation.

# Claim Boundaries

- **Paper-verified pattern:** Directly supported by source literature in its original system.
- **Agent-inferred extension:** Mechanistically plausible transfer to a new system, requiring new controls.
- **Speculative hypothesis:** Plausible but unconstrained by current evidence; must be labeled as such.
- Never present single-study observations as field consensus.
- Never infer practical readiness, safety, or environmental benefit from mechanism-level evidence alone.

# Failure Modes

- **Hypothesis failure:** The proposed mechanism is contradicted by controls or orthogonal evidence.
- **Artifact failure:** Apparent gains are explained by unmatched loading, geometry, impurities, or measurement bias.
- **Transfer failure:** Mechanism-level improvements do not survive in full-device or realistic-boundary tests.
- **Reproducibility failure:** Results vary across replicates or batches beyond predefined thresholds.
- **Safety-critical failure:** Uncontrolled degradation, gas evolution, or thermal indicators; triggers immediate stop.
- **Scope creep:** Optimizing endpoint metrics without mechanism isolation; leads to unfalsifiable claims.

# Validity Checks

Before finalizing any research plan or claim:
- Check confounding by assembly differences, substrate roughness, separator interaction, electrolyte redistribution, and counter-electrode effects.
- Check post-test artifacts from handling, sampling bias, or environmental exposure.
- Check that model fits are treated as supporting evidence, not proof, unless assumptions are justified.
- Verify that each data point traces to a documented sample, condition, and processing step.
- Ensure failed controls and negative results are reported.
- Confirm that the analysis plan distinguishes measured performance from inferred mechanism.

# Provenance

- Synthesized from cluster 49 (subcluster 49.0): observable-driven mechanism discovery and validation.
- Derived from source skills: selective-interfacial-regulation-for-aqueous-zn-batteries, mediator-ion-energy-storage-exploration, aqueous-electrode-mechanism-complementarity, aqueous-zinc-anode-interface-exploration, sodium-ion-anode-research-workflows, aqueous-zinc-battery-interface-discovery, alkaline-battery-material-discovery-workflow, zinc-polymer-electrolyte-interface-design.
- Preserves the shared workflow route: coupled failure diagnosis → falsifiable hypothesis generation → controlled minimum viable validation → orthogonal evidence integration → iterative claim bounding.
