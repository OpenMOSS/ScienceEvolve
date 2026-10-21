---
name: sci-aqueous-aqueous-battery-interface-mechanism-discove-155ed8f3
description: A reusable end-to-end workflow for generating, discriminating, and validating mechanistic hypotheses about electrode-electrolyte interfaces in aqueous batteries through staged controls, orthogonal evidence triangulation, and iterative claim bounding.
scienceevolve-title: "Aqueous battery interfaces · aqueous battery interface mechanism discovery workflow 6"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Synthesize a transferable scientific workflow for discovering and validating interfacial mechanisms in aqueous battery systems. It guides an agent from an observed failure phenotype to ranked mechanistic hypotheses, through staged experimental validation with strong controls, to bounded, evidence-based claims—without embedding any specific material recipe or paper result as universal truth.

# When to use

Use this skill when the user needs to:

- Propose new research questions or hypotheses for aqueous battery electrode-electrolyte interfaces.
- Design experiments that discriminate among competing interfacial mechanisms (transport, reaction, field, deposition).
- Validate whether an observed performance change is causally linked to a proposed interfacial mechanism.
- Iterate or pivot based on diagnostic evidence from half-cell, full-cell, or materials characterization.
- Critique existing claims by auditing controls, confounders, and evidence chains.

# Inputs required

Ask for or identify:

- Target electrode class and electrolyte family.
- Observed failure phenotype or performance bottleneck (e.g., nonuniform deposition, dissolution, passivation, side reactions, impedance growth).
- Candidate design concept or modifier class, if any.
- Available diagnostic categories (structural, electrochemical, morphological, spectroscopic, computational).
- Research objective: screening, mechanism validation, or device-relevance demonstration.
- Constraints: safety boundaries, environmental considerations, measurement access.

If key inputs are missing, state assumptions explicitly and request the minimum information needed to avoid ambiguous design.

# Core Workflow

Follow the ordered route below. Each gate is a hard stop or pivot point.

1. **Failure Decomposition & Gap Framing**
   - Decompose the observed failure into coupled subproblems: ion flux uniformity, solvation/desolvation, interfacial reaction, electric field distribution, side-reaction suppression, and deposit or host morphology.
   - Frame a mechanism-oriented research question. State what must be true for the failure to be mitigated.
   - **Gate G1 (Problem Clarity):** If the failure phenotype cannot be distinguished from measurement artifacts or counter-electrode/electrolyte artifacts, pause and request diagnostic clarification before proceeding.

2. **Hypothesis Generation**
   - Generate at least three competing, falsifiable hypotheses. Typical classes include:
     - Ion-transport or redistribution hypothesis.
     - Interfacial reaction or side-reaction suppression hypothesis.
     - Field-homogenization or nucleation-control hypothesis.
     - Structural or morphological stabilization hypothesis.
     - Alternative or artifact hypothesis (e.g., mass-loading effect, counter-electrode imbalance, measurement bias).
   - For each hypothesis, produce a card containing: claim, mechanism map (structure → interfacial behavior → electrochemical effect → outcome), evidence strength (weak / moderate / strong), key assumptions, predicted orthogonal signatures, and likely failure modes.
   - **Gate G2 (Candidate Gate):** If no hypothesis is falsifiable with available diagnostics, redesign the candidate set or request additional probes before proceeding.

3. **Staged Validation Design**
   - Design a minimal viable validation (MVV) and a strong validation path.
   - Define independent variables (e.g., presence/absence of modifier, gradient levels) and dependent variables (interfacial diagnostics, morphology, electrochemical metrics).
   - Mandate matched controls:
     - Baseline (unmodified system).
     - Negative / inert analogue (lacks the proposed functional feature).
     - Scaffold-only or bulk-effect control.
     - Positive / benchmark control (when ethically and scientifically justified).
     - Compatibility control (assesses counter-electrode and electrolyte independent effects).
   - Define primary endpoints (mechanism-linked) and secondary endpoints (performance-linked).
   - **Gate G3 (Design Gate):** If controls cannot be matched for geometry, loading, history, or measurement protocol, stop and redesign.

4. **Evidence Collection**
   - Execute in stages:
     a. Material and structure verification (confirm the intended feature exists and is stable).
     b. Diagnostic / half-cell tests (isolate the electrode interfacial behavior).
     c. Full-cell / system tests (check translation to device-level outcomes).
   - At each stage, collect orthogonal evidence classes (e.g., structure, transport, morphology, electrochemistry).
   - **Gate G4 (Stability Gate):** If the interface or modifier is chemically unstable before testing, or if safety or compliance boundaries are breached, stop and pivot.

5. **Mechanism Discrimination & Analysis**
   - Populate an evidence matrix: hypotheses versus evidence classes.
   - Triangulate: strengthen a hypothesis only when at least two independent evidence classes converge on the same causal path.
   - Check mechanism–performance alignment. If performance improves but the proposed mechanism is absent, search for confounders (mass loading, contact area, counter-electrode effects, electrolyte redistribution).
   - Quantify trade-offs (e.g., improved stability versus increased polarization or transport loss).
   - **Gate G5 (Mechanism Exclusion):** If negative or inert controls reproduce the effect, downgrade or discard the proposed mechanism and return to Step 2.

6. **Iteration or Redesign**
   - Classify the outcome: supported, partially supported, inconclusive, or contradicted.
   - If supported: tighten the next bottleneck (kinetics, transport, device relevance) and proceed to strong validation.
   - If partially supported: identify the limiting subproblem and generate a targeted sub-hypothesis.
   - If inconclusive: add discriminating measurements or audit controls.
   - If contradicted: abandon the hypothesis; preserve negative results as boundary evidence.
   - **Gate G6 (Iteration Gate):** After three inconclusive loops without access to new diagnostics, stop and recommend a fundamental redesign of the candidate concept.

7. **Claim Bounding & Documentation**
   - State the final claim bounded by tested chemistry, cell format, validated mechanism scope, and unresolved assumptions.
   - Distinguish source-paper inspiration, newly observed evidence, inferred mechanism, and speculation.
   - Document failure modes, boundary conditions, and residual risks.

# Output Format

For each invocation, return:

1. **Research Question** — Concise, mechanism-oriented question.
2. **Ranked Hypotheses** — Table with claim, mechanism map, evidence strength, key assumptions, predicted observations, failure modes, and boundary conditions.
3. **Validation Plan** — MVV and strong validation with variables, controls, endpoints, and stop conditions.
4. **Evidence Matrix** — Hypotheses versus orthogonal evidence classes with current status.
5. **Analysis Plan** — Decision rules for triangulation, confounder checks, and trade-off quantification.
6. **Iteration Path** — Update rules for supported, ambiguous, or contradicted outcomes.
7. **Bounded Claim Statement** — Final claim with explicit boundaries and residual uncertainties.
8. **Validity and Safety Notes** — Confounders, reproducibility requirements, and non-operational safety boundaries.

# Validation Gates

- **G1 Problem Clarity:** Failure phenotype is isolated from measurement and system artifacts.
- **G2 Candidate Gate:** Hypotheses are falsifiable with available or attainable diagnostics.
- **G3 Design Gate:** Controls are matched and interpretable; protocol is fixed before execution.
- **G4 Stability Gate:** Interface/modifier is stable and safe to test under declared boundaries.
- **G5 Mechanism Exclusion:** Controls rule out trivial, non-specific, or artifactual explanations.
- **G6 Iteration Gate:** Loop limit enforced to prevent endless inconclusive cycles.

# Claim Boundaries

- Claims are restricted to the tested aqueous electrolyte family, electrode class, and cell format.
- Mechanism claims require convergent orthogonal evidence; single-metric improvements are reported as observations, not causal proofs.
- Device-level relevance is not inferred from isolated half-cell or single-diagnostic data.
- Source-paper observations are treated as design inspiration, not field consensus.

# Failure Modes

- **Hypothesis failure:** Proposed mechanism is absent; controls reproduce the effect; the effect is artifactual.
- **Trade-off failure:** Improvement in one metric (e.g., stability) is coupled with unacceptable degradation in another (e.g., transport or efficiency).
- **System failure:** Half-cell or diagnostic improvements fail to translate to full-cell due to counter-electrode, separator, or electrolyte incompatibility.
- **Generalization failure:** Claims are extrapolated beyond tested boundary conditions (pH, concentration, temperature, loading, current regime).
- **Interpretation failure:** Mechanism is inferred from performance alone without supporting diagnostic evidence.

# Validity Checks

- **Confounding:** Verify matched geometry, loading, electrolyte history, impurities, substrate effects, and preparation protocols.
- **Control adequacy:** Require baseline, negative, scaffold-only, positive/benchmark, and compatibility controls.
- **Reproducibility:** Include independent preparations, repeated measurements, and explicit data-processing rules.
- **Statistical validity:** Predefine endpoints, report variability, and handle outliers transparently.
- **Mechanistic consistency:** Require alignment across structural, transport, morphological, and electrochemical evidence.
- **Boundary validity:** State explicit limits on chemistry, cell format, and operating regime.
- **Attribution:** Ensure electrode-side claims are supported by electrode-focused controls and not inferred only from full-cell performance.

# Provenance

- Synthesized from cluster 22.3 ("observable-driven mechanism discovery and validation") source skills:
  - `zinc-anode-interface-exploration` (29835267a92501de)
  - `aqueous-zn-battery-edge-engineering-research-design` (c4c1c7eeeaf7931d)
  - `aqueous-battery-cathode-dissolution-research` (4353684f08dbc787)
  - `aqueous-zinc-electrolyte-exploration` (84caccbeb77938eb)
  - `conversion-anode-research-workflow` (6289c239a3ebd264)
  - `organic-electrode-storage-exploration` (9a56a3e912b2769a)
  - `azib-interface-additive-research` (f44aa99a34cf6849)
  - `aqueous-metal-battery-interface-research` (73b7b76f760cf833)
- Domain-specific materials, additive identities, electrolyte formulations, numerical parameters, and paper conclusions from the source skills have been removed to produce a transferable workflow.
