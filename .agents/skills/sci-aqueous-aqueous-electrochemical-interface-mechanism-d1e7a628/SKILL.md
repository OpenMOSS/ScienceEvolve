---
name: sci-aqueous-aqueous-electrochemical-interface-mechanism-d1e7a628
description: Reusable end-to-end workflow for designing, validating, and iterating mechanism-driven research in aqueous electrochemical energy storage interfaces.
scienceevolve-title: "Aqueous battery interfaces · aqueous electrochemical interface mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Use this skill to guide mechanism-driven research design for aqueous electrochemical energy storage systems where performance failure emerges from coupled bulk-solution, interfacial, and deposition phenomena. The workflow helps an agent translate observable failures into testable hypotheses, structure discriminating validation plans with layered controls, connect multiscale evidence, and iterate based on falsification rather than performance optimization alone. It is not a source-paper reproduction tool and does not provide operational laboratory protocols.

# When to use

Use this skill when the user asks to:
- Generate new research questions or hypotheses about interfacial stability, deposition behavior, or electrolyte regulation in aqueous metal-anode systems.
- Design validation plans that require distinguishing bulk effects from interfacial effects.
- Convert electrochemical, spectroscopic, microscopic, or simulation observations into a causal evidence chain.
- Iterate after partial, conflicting, or negative experimental evidence.
- Evaluate whether a proposed additive, modifier, or surface strategy has a plausible mechanism beyond empirical performance.

Do not use for operational lab instructions, safety-critical execution details, manufacturing scale-up, or non-electrochemical domains.

# Inputs required

Before generating a research plan, request or infer:
- Target system boundary: electrode class, electrolyte family, cell configuration, and intended operating regime.
- Dominant failure mode or performance bottleneck (e.g., unstable deposition, side reactions, transport limitation).
- Candidate intervention class or mechanistic lever, if any (e.g., additive, surface modifier, electrolyte reformulation).
- Available evidence and constraints: literature precedents, preliminary data, diagnostic tools, safety boundaries, and acceptable validation depth.
- Desired output type: hypothesis portfolio, minimal validation plan, analysis schema, iteration roadmap, or mechanism critique.

If key inputs are missing, state assumptions explicitly and mark conclusions as provisional.

# Core Workflow

Execute the following ordered stages. Do not skip a stage unless its decision gate explicitly permits progression.

### 1. Failure Localization & Mechanism Mapping
Treat the performance failure as an emergent, coupled system behavior rather than a single defect. Construct a mechanism map that links bulk-solution structure, interfacial chemistry, nucleation or deposition kinetics, and device-level observables. Identify dominant loss pathways and distinguish reversible from irreversible processes.

**Decision gate:** If the failure mode cannot be localized to at least one distinguishable mechanism layer (bulk, interface, morphology, kinetics), pause and request additional evidence before generating hypotheses.

### 2. Hypothesis Portfolio Generation
For each candidate mechanism, formulate a concise causal chain: molecular or interfacial lever → local microenvironment change → kinetic or transport consequence → macroscopic outcome. Assign evidence strength (high, medium, low, speculative). List key assumptions, falsification tests, likely failure modes, and extrapolation boundaries. Propose at least one alternative explanation.

**Decision gate:** Reject hypotheses that lack a falsifiable intermediate or depend solely on literature analogy without a local mechanistic rationale.

### 3. Experimental Design with Layered Controls
Define independent, intermediate, and outcome variables. Establish a control hierarchy:
- Baseline (no intervention).
- Negative control (lacks the target mechanistic function).
- Weak / analogue control (lacks the critical functional motif but preserves comparable bulk properties).
- Bulk-property control (isolates interfacial effects from conductivity, viscosity, pH, or water-activity changes).
- Positive / benchmark control (known comparator, when available).

Specify minimal viable validation: baseline confirmation, one mechanistic intermediate measurement, one morphology or kinetic outcome, and one system-level performance test. Specify strong validation upgrades only for hypotheses that pass minimal validation.

**Stop condition:** Halt if the design cannot isolate the intended mechanism from confounding variables.

### 4. Multiscale Evidence Collection
Gather evidence across at least two independent layers: bulk or solvation structure, interfacial composition or adsorption, deposition morphology, kinetic or transient behavior, and device-level performance. Do not infer mechanism from a single metric.

**Decision gate:** If diagnostics contradict the hypothesis at any layer, flag the conflict and proceed to Stage 6 before escalating to stronger validation or larger formats.

### 5. Mechanism-First Analysis
Connect evidence layers into a causal chain rather than reporting isolated improvements. Attribute performance changes to specific mechanism layers only when controls confirm the attribution. Assess trade-offs explicitly (e.g., transport penalty versus interfacial stability). Classify each claim as directly measured, mechanistically inferred, or extrapolated.

### 6. Validation, Iteration & Stop/Pivot
Update the mechanism map with negative and positive evidence. Re-rank hypotheses:
- **Reinforce** when multiscale evidence converges and controls are informative.
- **Weaken** when controls fail, intermediates are absent, or results are irreproducible.
- **Abandon** when falsified by diagnostic conflict or negative controls.

Redesign the intervention by modifying one mechanistic variable at a time. Apply the following stop/pivot rules:
- **Pivot** if morphology improves but transport or kinetics do not, unless the hypothesis explicitly targets mechanical shielding.
- **Pivot** if half-cell gains disappear in full-cell configurations; shift focus to cathode coupling, crossover, or cell-level constraints.
- **Stop** if safety-relevant instability appears, if key mechanism indicators remain absent after reasonable redesign, or if gains are non-reproducible across batches.
- **Stop scaling claims** if larger-format behavior diverges from controlled cells without an identified limiting variable.

**Decision gate:** Escalate from minimal validation to strong validation only after mechanism-specific failure modes are resolved and falsification risks are reduced.

### 7. Structured Reporting & Boundary Setting
Assemble outputs into the standardized format below. Clearly separate observed evidence, paper-derived patterns, user-provided assumptions, and new agent-generated inferences. State boundary conditions where the hypothesis must not be extrapolated.

# Output Format

When using this skill, return:

1. **Research question** — Concise problem statement, target failure mode, and system boundary.
2. **Mechanism map** — Dominant pathways, coupling points, and likely bottlenecks.
3. **Hypothesis portfolio** — Table with hypothesis, mechanism class, evidence strength, key assumptions, expected readouts, falsification tests, and likely failure modes.
4. **Experimental design schema** — Variables, control hierarchy, minimal viable validation, strong validation upgrades, and stop conditions.
5. **Analysis plan** — Layer-connection logic, required plots or tables, and criteria for mechanism support or rejection.
6. **Iteration roadmap** — Decision rules for reinforcing, revising, or abandoning hypotheses under success, partial success, diagnostic conflict, and full-cell mismatch.
7. **Validity and safety notes** — Confounders, reproducibility checks, boundary conditions, and non-operational safety constraints.
8. **Evidence ledger** — Separation of observed evidence, paper-derived patterns, user assumptions, and new inferences.

# Validation Gates

Before accepting a proposed plan or conclusion, verify:
- **Confounding check:** The intervention does not simultaneously alter multiple unrelated variables (surface area, conductivity, wettability, pH, water activity).
- **Control adequacy:** Baseline, negative, weak, orthogonal, and positive controls are included where relevant.
- **Metric alignment:** Metrics directly test the proposed mechanism rather than only generic capacity or efficiency retention.
- **Mechanistic sufficiency:** At least two independent evidence streams are required before claiming a mechanism is supported.
- **Scale transfer:** Conclusions are guarded against format-dependent artifacts (e.g., small-cell vs. practical-cell loading, separator, and current-distribution effects).
- **Reproducibility:** Replicate comparisons, batch variability, and failure criteria are predefined.
- **Statistical validity:** Comparisons use matched conditions and sufficient replicates; best-case traces are not overclaimed.

# Claim Boundaries

- Distinguish directly measured observations from model-inferred claims and extrapolations.
- Do not treat single-paper evidence as field-wide consensus.
- Do not extrapolate from one metal, electrolyte, or cell format to another without a new mechanism check.
- Frame environmental, safety, or commercial claims cautiously and require independent validation.
- Label agent-generated hypotheses as speculative until tested with system-specific controls.

# Failure Modes

- The intervention acts primarily through an unintended bulk property (viscosity, conductivity, pH) rather than the proposed interfacial mechanism.
- Apparent improvement arises from cathode limitation, reduced active area, or cell-assembly artifacts rather than anode stabilization.
- Solvation or bulk structural changes occur without interfacial improvement, indicating the lever is insufficient.
- Interfacial enrichment causes excessive transport resistance, additive depletion, or mechanical instability.
- Half-cell success does not translate to full-cell stability due to cathode coupling, crossover, or electrolyte consumption.
- Results are irreproducible due to uncontrolled surface preparation, contamination, or batch variation.
- A dominant side reaction or corrosion pathway masks the proposed mechanism.

# Validity Checks

- Before generating hypotheses: confirm the failure mode is defined and at least one mechanistic layer is identifiable.
- Before finalizing experiments: verify controls can distinguish interface action from bulk reformulation.
- Before analyzing data: pre-register comparisons, endpoints, and exclusion rules.
- Before iterating: confirm negative results are recorded and used to refine the mechanism map.
- Before reporting: ensure evidence is labeled by source (observed, paper-derived, inferred) and boundary conditions are stated.

# Provenance

- Synthesized from cluster 12 / subcluster 12.0 (observable-driven mechanism discovery and validation).
- Source skills: aqueous-zinc-bromine-battery-research-pattern (d6ff25a156b3460e), hb-network-electrolyte-research-design (553d6b60febad406), aqueous-zinc-interfacial-solvation-exploration (e8f9e53e47b87ff4), trace-interfacial-regulation-research (ef3c9dce0bb10dc4), aqueous-zinc-electrolyte-interface-research (8f7fd2383089b4ab), metal-anode-electrodeposition-research-workflow (812ab647b1a844b7), high-rate-metal-battery-interphase-exploration (4ff41bce1c7c0d56), aqueous-zinc-interface-solvation-exploration (ab7868e02d7ae6ba).
