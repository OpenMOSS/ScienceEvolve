---
name: sci-aqueous-aqueous-metal-electrolyte-mechanism-discove-6f8549ee
description: Reusable end-to-end workflow for generating hypotheses, designing controlled validations, and iterating on mechanism discovery for aqueous metal-battery electrolyte and interface problems.
scienceevolve-title: "Aqueous battery interfaces · aqueous metal electrolyte mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Guide agents in creating transferable, mechanism-grounded research plans for electrolyte and interface engineering in aqueous metal-ion batteries. The workflow converts observable failure modes into falsifiable hypotheses, designs minimal staged validations with strong controls, and iterates based on cross-scale evidence without prescribing operational laboratory protocols.

# When to use

Use this skill when:

- A user asks how to investigate electrolyte additives, solvation regulation, electrode/electrolyte interface reconstruction, deposition uniformity, side-reaction suppression, or reversibility in aqueous metal-ion batteries.
- A preliminary result suggests a candidate intervention improves one metric, but a mechanism-aware research plan is needed.
- The task is to propose new research directions, critique a proposed mechanism, or compare electrolyte design strategies (e.g., additive, concentrated/localized, gel, quasi-solid, composite).
- The user needs a non-operational framework for hypothesis generation, control design, metrics selection, and iteration.

Do not use this skill to provide step-by-step experimental procedures, hazardous operating parameters, fabrication recipes, deployment advice, or to treat any single study as field consensus.

# Inputs required

Ask for or infer the following before producing a research plan:

- **Target system:** battery chemistry, electrode classes, electrolyte family, and cell architecture.
- **Known failure modes:** unstable metal deposition, corrosion, gas evolution, cathode dissolution, passivation, poor kinetics, low reversibility, or other coupled degradation issues.
- **Candidate intervention:** additive, solvent, salt, coating, interface modifier, or formulation concept under consideration.
- **Available evidence:** user data, literature, computational results, microscopy, spectroscopy, electrochemical traces, or prior observations.
- **Intended claim level:** empirical screening, mechanism proposal, full-cell validation, or boundary-condition discovery.
- **Constraints:** safety review status, reproducibility requirements, environmental boundaries, and known confounders.

If key inputs are missing, state assumptions explicitly and prioritize a minimal non-operational validation plan rather than inventing detailed experimental settings.

# Core Workflow

1. **Frame the coupled failure mode**
   - Start from a measurable device-level bottleneck (e.g., capacity fade, efficiency loss, morphology change).
   - Decompose into coupled contributions: bulk electrolyte structure, electrode/electrolyte interface, local reaction or deposition behavior, and full-cell reversibility.
   - **Decision Gate DG1:** Is the bottleneck defined in device-relevant terms and decomposed into coupled sub-components? If not, stop and clarify inputs.

2. **Map mechanisms and generate competing hypotheses**
   - Propose mechanism classes that could explain the bottleneck:
     - Solvation-structure or medium-structure modulation.
     - Interfacial adsorption, wetting, or interfacial organization.
     - Ion-flux homogenization or transport-field redistribution.
     - Kinetic barrier control (nucleation, charge transfer, desolvation).
     - Mechanical confinement or contact preservation.
     - Trade-off or artifact/confounding hypothesis.
   - For each hypothesis specify: predicted observations across mechanism layers, evidence strength (low/medium/high), key assumptions, a falsifying observation, and boundary conditions.
   - **Decision Gate DG2:** Does each hypothesis have at least one falsifiable prediction and a stated boundary? If not, refine before proceeding.

3. **Design a staged minimal validation plan**
   - **Comparison groups:** unmodified baseline; candidate-modified system with nonessential variables matched; structural analogs; negative/inactive controls; positive/benchmark controls when available; full-cell balance controls.
   - **Stage A – Physicochemical/structural screening:** assess intended solvation, coordination, or network changes using non-operational descriptors.
   - **Stage B – Half-cell mechanism isolation:** test reversibility, interfacial stability, and morphology in symmetric or asymmetric cells with strong controls.
   - **Stage C – Full-cell/practical translation:** advance only after Stage B supports the mechanism; include realistic loading, rate, and environmental stress relevant to the application.
   - **Stop/Pivot criteria for each stage:**
     - Baseline is irreproducible.
     - Candidate does not alter the claimed mechanism.
     - Anode-side improvements coincide with worse cathode compatibility, transport limitations, or hidden resistance.
     - Full-cell gains disappear under stronger controls or practical formats.
   - **Decision Gate DG3:** Are controls sufficient to separate bulk transport from interfacial effects and isolate the proposed mechanism? If not, redesign.

4. **Collect orthogonal evidence**
   - Require converging evidence from at least two independent classes (e.g., structural probe + electrochemical behavior, or morphology + transport) before elevating a mechanism claim.
   - **Decision Gate DG4:** Is the mechanism claim supported by multiple independent evidence streams? If only a single stream exists, label the claim as provisional.

5. **Analyze across mechanism layers**
   - Evaluate consistency across: bulk solvation/medium structure → interface organization → morphology → kinetics/transport → full-cell performance.
   - Build causal chains only when multiple layers converge.
   - If evidence is inconsistent, split the hypothesis or reframe the claim as empirical until ablations clarify the mechanism.
   - **Decision Gate DG5:** Do observations across scales support the same causal chain? If contradictory, trigger iteration.

6. **Iterate, stop, or advance**
   - **Confirmed:** Multiple layers converge and controls are strong. Narrow the claim to the demonstrated boundary and propose the next falsification test.
   - **Partial:** One layer improves while another degrades (e.g., anode stabilization vs. cathode incompatibility). Identify the emergent bottleneck, document the trade-off, and update the hypothesis.
   - **Contradicted:** Mechanism-specific evidence contradicts the hypothesis, or controls perform similarly to the candidate. Stop or pivot; archive confounders.
   - **Inconclusive:** High variability, ambiguous controls, or missing diagnostics. Add discriminating comparisons or tighten reproducibility before proceeding.
   - **Decision Gate DG6:** Have stop criteria been triggered (mechanism unsupported, unacceptable trade-off, safety boundary exceeded, irreproducible baseline)? If yes, halt and archive learnings.

# Output Format

For each use of this skill, produce:

1. **Research question** – One concise question linking target system, candidate intervention, mechanism, and cell-level objective.
2. **Mechanism map** – Bulk/medium-structure mechanism; electrode/interface mechanism; kinetics/morphology mechanism; cathode/full-cell compatibility mechanism.
3. **Hypothesis table** – Hypothesis type, evidence strength, key assumptions, predicted observations, possible failure mode, and boundary condition.
4. **Minimal validation plan** – Baseline and controls; staged mechanism checks; cell-level checks; stop/pivot criteria.
5. **Analysis plan** – How to integrate evidence across mechanism layers; how to handle contradictory or incomplete evidence.
6. **Iteration rules** – Decision logic for confirmed, partial, contradicted, and inconclusive outcomes.
7. **Validity and safety notes** – Confounding checks, reproducibility checks, boundary conditions, and non-operational safety boundaries.
8. **Evidence classification** – Separate observed, mechanism-supported, agent-inferred, and speculative claims.

# Validation Gates

Apply the following gates at the corresponding workflow steps:

- **VG1 – Problem clarity (DG1):** The bottleneck is decomposed into anode, cathode, bulk, and interface contributions.
- **VG2 – Falsifiability (DG2):** Every hypothesis has a defined falsifying observation and boundary statement.
- **VG3 – Control sufficiency (DG3):** Baseline, negative, analog, and balance controls are present; confounders are named.
- **VG4 – Evidence convergence (DG4):** Mechanism claims rest on at least two independent evidence classes.
- **VG5 – Cross-scale consistency (DG5):** Solvation, interface, morphology, kinetics, and cell-level observations point in the same direction.
- **VG6 – Stop review (DG6):** Trade-offs, safety limits, and irreproducibility are reviewed before advancing.

# Claim Boundaries

- **Observed:** Directly measured in the current validation under the tested conditions.
- **Mechanism-supported:** Inferred only when converging multi-layer evidence and appropriate controls align.
- **Agent-inferred:** Plausible extension based on structural analogy or modeling; requires independent verification.
- **Speculative:** Beyond current evidence; must be labeled explicitly.
- **Domain boundaries:** Limit claims to the tested chemistry family, electrode type, electrolyte class, cell format, and operating regime. Do not extrapolate to other metal chemistries, non-aqueous systems, or scale-up contexts without validation.

# Failure Modes

- **Irreproducible baseline:** Unstable reference behavior masks true candidate effects.
- **Confounded comparison:** Unmatched variables (impurities, geometry, surface state, loading) generate spurious improvement.
- **Single-metric trap:** Optimizing one electrochemical metric while ignoring morphology, interface, or cathode compatibility.
- **Translation gap:** Half-cell or benign-format gains disappear under realistic loading, rate, or full-cell balance.
- **Mechanistic overreach:** Claiming a solvation or interfacial mechanism from performance data alone.
- **Trade-off blindness:** Failing to detect that relieving one bottleneck creates another (e.g., stability at the cost of transport).
- **Depletion or artifact:** Apparent improvement arises from additive consumption, side-product masking, or measurement artifact rather than a stable mechanism.

# Validity Checks

Before finalizing any research plan or claim, verify:

- **Confounding isolation:** Baseline and modified systems are compared under matched conditions; material, impurity, and geometry differences are controlled.
- **Mechanism isolation:** Each proposed mechanism has a diagnostic that could fail; positive, negative, and orthogonal controls are included where feasible.
- **Cross-scale consistency:** Solvation, interface, kinetics, morphology, and cell-level observations support the same causal chain.
- **Reproducibility:** Repeated measurements, variability, outlier handling, and raw data preservation are addressed.
- **Statistical validity:** Claims are proportional to the number and independence of observations; improvements are compared against strong baselines.
- **Boundary conditions:** Extrapolation limits are stated for other chemistries, electrodes, separators, operating regimes, and formats.
- **Evidence labeling:** Paper-supported findings, cross-study support, agent-inferred extensions, and speculation are clearly separated.

# Provenance

Synthesized from cluster 10.0 (interface-aqueous-zinc-electrolyte-mechanism-discovery), source skills: `d3f9a05c745b86d7`, `6096031bc0730279`, `1c8daecb8d68552a`, `4eecbfa3943cf619`, `3f93ec03656280e4`, `2f22d085ce34f9a0`, `0b23c79f01c3fca7`, `feed9292e79adbd3`. No specific paper results, numerical parameters, or operational protocols from the source skills are reproduced in this workflow.
