---
name: sci-aqueous-discover-aqueous-metal-electrolyte-interfac-b59e33e5
description: A reusable end-to-end workflow for discovering and validating electrolyte-interface mechanisms in aqueous metal batteries through observable-driven hypothesis generation, staged orthogonal validation, and iterative mechanism refinement.
scienceevolve-title: "Aqueous battery interfaces · discover aqueous metal electrolyte interface mechanisms"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

This skill converts a performance degradation problem in an aqueous metal battery into a transferable, mechanism-driven research workflow. It guides an agent to frame coupled bulk-electrolyte and interfacial failure modes, generate competing hypotheses, design staged validation with strong controls, and iterate using orthogonal evidence—without reproducing any specific material recipe or paper system.

# When to use

Use this skill when:

- A rechargeable aqueous metal battery suffers from coupled degradation such as active-species migration, interfacial instability, dendritic growth, corrosion, gas evolution, passivation, or impedance rise.
- A proposed electrolyte, additive, interphase, separator, or phase-structured medium must address more than one failure mode simultaneously.
- The task is to generate research questions, design non-operational validation plans, or evaluate whether a proposed mechanism is supported by converging evidence.
- The user needs to distinguish paper-specific observations from transferable scientific reasoning.

Do not use this skill for routine manufacturing instructions, direct operational electrochemical testing protocols, hazardous material handling recipes, or unsafe energy-device deployment.

# Inputs required

Before generating a plan, request or infer:

- **Target electrochemical system**: metal anode, electrolyte family, counter electrode or device architecture, and intended application context.
- **Primary degradation phenotype**: shuttle/crossover, nonuniform deposition, interface corrosion, dendritic growth, gas evolution, passivation, impedance growth, or capacity fade.
- **Candidate regulation strategy**: additive, solvent/co-solvent, ion-pairing motif, interphase layer, phase-selective medium, or hybrid architecture.
- **Available evidence types**: spectroscopy, electrochemistry, imaging, post-mortem analysis, transport measurements, simulation, or literature benchmarks.
- **Comparison systems**: baseline electrolyte or architecture, single-function control, inactive analogue, and positive reference when available.
- **Constraints**: safety limits, material availability, environmental concerns, scalability concerns, and data quality limits.
- **Desired output**: hypothesis map, experimental design, analysis plan, critique, or iteration strategy.

If key inputs are missing, state assumptions explicitly and mark conclusions as provisional.

# Core Workflow

1. **Phenotype Definition & System Framing**
   - Define the degradation phenotype in terms of observable electrochemical and morphological signatures.
   - Frame the bottleneck as a coupled problem linking bulk electrolyte behavior (solvation, transport) to electrode/electrolyte interfacial processes, not as isolated defects.
   - *Decision Gate 1*: Is the phenotype reproducible and distinct from measurement artifacts or assembly variability? If no, stop and refine diagnostics.

2. **Mechanistic Hypothesis Generation**
   - Generate at least three competing hypotheses that connect a molecular or structural design feature to a multi-scale causal chain: bulk electrolyte → interface structure → deposition morphology → electrochemical reversibility → device stability.
   - For each hypothesis, specify: evidence strength (low/medium/high), key assumptions, predicted observations at each scale, falsification criteria, and likely failure modes.
   - Prioritize hypotheses that simultaneously address multiple failure modes and predict measurable changes in both bulk and interfacial properties.
   - *Decision Gate 2*: Does each hypothesis predict discriminating evidence across independent measurement categories? If no, reformulate before proceeding.

3. **Staged Validation Design**
   - Design a minimal viable validation sequence rather than a single performance screen:
     - **Control schema**: baseline (unmodified), negative/inactive analogue, strong mechanism-related control, and component/reversed-location control where relevant.
     - **Mechanism-first probes**: non-operational diagnostics for solvation/coordination changes, interfacial adsorption or composition, and early nucleation/morphology.
     - **Electrochemical reversibility tests**: symmetric or half-cell configurations to assess plating/stripping stability, polarization, and efficiency.
     - **Device-level relevance tests**: full-cell or application-relevant format, conducted only after half-cell mechanism evidence is coherent.
   - Predefine stop/failure criteria (e.g., no interface evidence despite performance change, negative control matches candidate, transport penalties offset gains).
   - *Decision Gate 3*: Are controls sufficient to isolate the proposed mechanism from generic coating, conductivity, or pH effects? If no, redesign.

4. **Orthogonal Evidence Collection**
   - Gather evidence from at least two independent categories: molecular/structural probes, interface-sensitive analysis, electrochemical diagnostics, and post-mortem characterization.
   - Do not infer causality from a single spectral shift or a single performance curve.
   - *Decision Gate 4*: Is there convergence across ≥2 independent evidence categories supporting the same mechanistic link? If no, classify findings as preliminary and withhold mechanism claims.

5. **Mechanism-Driven Analysis**
   - Map each observation onto the causal chain. Compare candidate, baseline, and all controls.
   - Classify each hypothesis as: mechanism-supported, partially supported, ambiguous, or falsified.
   - Separate observed evidence from mechanistic inference, design implications, and boundary conditions.
   - Distinguish kinetic improvement from increased resistance or suppressed utilization.
   - *Decision Gate 5*: Do molecular/interface evidence and electrochemical improvements point in the same direction? If no, revise the causal chain.

6. **Iteration or Pivot**
   - **If supported**: escalate to harsher stress tests (temperature, rate, duration, scale) or compatibility checks (cathode, separator, flow).
   - **If partially supported**: identify the weakest link in the causal chain, revise the hypothesis component tied to that link, and add a decisive control.
   - **If falsified**: preserve the negative finding, downgrade the hypothesis, and generate an alternative explanation (e.g., confounder, artifact, or different dominant mechanism).
   - **If unresolved**: define the next minimal experiment that would discriminate between competing mechanisms.
   - *Decision Gate 6*: Has the mechanism survived minimum validation under the target operating constraints? If no, return to Stage 2 or stop.

7. **Boundary Labeling & Reporting**
   - Label every claim by evidence status: directly supported, mechanistically plausible, speculative extension, or not established.
   - State explicit boundary conditions: applicable chemistry classes, electrode architectures, temperature windows, duration limits, and scale.
   - Clearly separate source-paper observations, user-provided data, and agent-generated inferences.

# Output Format

When using this skill, produce:

1. **Research question**: one concise statement of the target system and coupled degradation problem.
2. **Transferable pattern fit**: explain why the coupled bulk-and-interface pattern is relevant, or why it is not.
3. **Hypothesis table**: at least three hypotheses with evidence strength, key assumptions, predicted observations, likely failure modes, and falsification criteria.
4. **Experimental design**: minimal viable validation sequence, control schema, variable layers (molecular, interface, electrolyte, electrode/device, operating), evaluation metrics, and predefined stop conditions.
5. **Analysis plan**: required evidence types, integration logic across scales, control contrasts, and decision criteria for mechanism classification.
6. **Iteration plan**: how each possible result pattern updates, refines, splits, or rejects hypotheses.
7. **Validity and boundary checks**: confounders, reproducibility requirements, statistical concerns, safety limits, and extrapolation boundaries.
8. **Evidence-status note**: clear separation of source-paper observations, user-provided data, and agent-generated inferences.

# Validation Gates

- **Gate 1 — Phenotype Reproducibility**: Degradation signature is repeatable and not an artifact of assembly or measurement.
- **Gate 2 — Hypothesis Discriminability**: Each hypothesis predicts distinct, observable outcomes across multiple independent measurement types.
- **Gate 3 — Control Adequacy**: The control set can separate the proposed mechanism from generic electrolyte property changes, pH shifts, conductivity effects, and inactive analogues.
- **Gate 4 — Orthogonal Convergence**: At least two independent evidence categories support the same mechanistic link before mechanism claims are made.
- **Gate 5 — Causal Consistency**: Molecular/interface evidence and electrochemical/device evidence align; improved stability is distinguished from increased resistance or suppressed utilization.
- **Gate 6 — Constraint Survival**: The mechanism remains coherent under the intended operating window and cell format before scope expansion.

# Claim Boundaries

- Do not present a single paper’s observations as field-wide consensus.
- Do not treat half-cell or short-duration performance as proof of practical device readiness.
- Do not extrapolate beyond the tested chemistry class, electrode architecture, and operating window.
- Distinguish correlation from causation: performance improvement alone does not validate a proposed mechanism.
- Label all agent-generated extrapolations as provisional.
- Avoid universal design rules; mechanisms may switch between conversion-like and intercalation-like cathode classes or different metal chemistries.

# Failure Modes

- **Confounding dominance**: pH shift, ionic strength change, viscosity increase, or impurity effect explains the observation rather than the intended mechanism.
- **Single-cell artifact**: A non-replicated result from one cell or one batch drives the conclusion.
- **Half-cell mirage**: Anode-side stabilization in simplified cells fails to translate to full-cell or practical-format compatibility.
- **Resistance masquerade**: Improved stability arises from increased interfacial resistance or reduced active-material utilization, not from desired kinetic control.
- **Control collapse**: The negative control or inactive analogue performs similarly to the candidate, indicating a generic electrolyte effect.
- **Scale-dependent failure**: The mechanism works only in small-format, short-duration, or idealized conditions and fails under scale or stress.
- **Mechanistic overreach**: A single spectral or morphological observation is over-interpreted as causal without electrochemical convergence.

# Validity Checks

Before finalizing a plan or conclusion, verify:

- **Confounding controls**: Electrode loading, surface area, separator, impurity, temperature, and conditioning history are matched or explicitly modeled.
- **Specificity**: An inactive analogue or reversed-location control tests whether the effect is chemically or structurally specific.
- **Orthogonality**: Migration and interface claims are supported by independent evidence types.
- **Reproducibility**: Repeated cells, repeated measurements, and uncertainty ranges are reported; single-cell successes are treated as preliminary.
- **Statistical validity**: Comparisons are made at matched states of charge, cycle stage, and normalization basis; cherry-picking is avoided.
- **Kinetic ambiguity**: Improved stability is distinguished from increased resistance or suppressed utilization.
- **Boundary conditions**: Temperature, scale, concentration, impurity tolerance, and duration limits are stated.
- **Safety boundary**: Flammable, volatile, corrosive, or high-energy components are flagged for qualified safety review; no unsafe operational instructions are provided.
- **Source-paper boundary**: Paper-specific observations are separated from new hypotheses and agent inferences.
- **Extrapolation limit**: Claims are restricted to the chemistry and architecture actually supported by evidence.

# Provenance

Synthesized from cluster 17 (subcluster 17.0), workflow archetype: observable-driven mechanism discovery and validation. Source skills:

- `self-segregated-electrolyte-battery-exploration` (4f09f2af00b96162)
- `aqueous-metal-battery-interface-additive-exploration` (1c3a948d5ef3d572)
- `electrolyte-interface-discovery-workflow` (cdbacb7cceb8fefc)
- `aqueous-zinc-additive-research` (76b40adc27a07242)
- `azib-electrolyte-interface-exploration` (eb7074c2ca2f649d)
- `aqueous-zinc-anion-cathode-research` (1ba5e51e246b84fa)
- `electrolyte-interface-battery-exploration` (3346317bac7fae54)
- `interface-gelation-battery-anode-exploration` (0b8077847cdf76f3)
