---
name: sci-aqueous-aqueous-metal-battery-mechanism-discovery-w-8c0dc693
description: A reusable end-to-end workflow for generating mechanism-driven hypotheses, designing staged validation plans, and iterating on evidence to discover and bound interfacial and bulk mechanisms in aqueous metal batteries.
scienceevolve-title: "Aqueous battery interfaces · aqueous metal battery mechanism discovery workflow 3"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

This skill provides a transferable, end-to-end workflow for turning observable failure modes in aqueous metal batteries into structured mechanism-discovery campaigns. It guides the generation of competing hypotheses, the design of tiered validation experiments with strong controls, the integration of cross-modal evidence, and iterative refinement based on convergence rules and stop conditions. The emphasis is on methodology, control discipline, and claim bounding rather than on reproducing any specific material system or paper result.

# When to use

Use this skill when you need to:

- Explore electrolyte, interface, or electrode engineering strategies for aqueous metal batteries.
- Generate falsifiable hypotheses for suppressing dendritic growth, corrosion, gas evolution, passivation, self-discharge, or interfacial impedance growth.
- Translate a mechanistic finding from one system into a validation plan for a new chemistry, additive, host, coating, or cell architecture.
- Design staged experiments that connect molecular descriptors, interfacial structure, deposition morphology, and cell-level metrics.
- Critique whether a proposed mechanism is supported by orthogonal evidence or inferred mainly from performance improvement alone.

Do not use this skill for direct operational laboratory execution, hazardous procedural instructions, or as a source of field-wide consensus derived from a single study.

# Inputs required

Before producing a plan, request or infer:

- **Target system:** metal anode class, electrolyte family, separator/cathode pairing, and intended cell format.
- **Observed failure mode:** specific instability such as uneven deposition, corrosion, gas evolution, passivation, or capacity fade.
- **Candidate intervention class:** additive, salt, co-solvent, interfacial layer, substrate texture, artificial interphase, separator function, or host architecture.
- **Available evidence:** spectroscopy, microscopy, impedance, deposition/stripping data, simulations, cycling results, or literature benchmarks.
- **Control strategy:** baseline electrolyte, intervention-free interface, inactive analogs, matched concentration/loading, and independent formats.
- **Intended output:** hypothesis map, experimental design schema, analysis plan, critique of an existing plan, or next-iteration strategy.

If key inputs are missing, state assumptions explicitly and keep conclusions provisional.

# Core Workflow

Follow this ordered route from problem framing to mechanism inference. Apply the decision gates and stop conditions at each tier.

## 1. System Framing & Failure Mode Definition
- Define the observable failure mode independently of any proposed solution.
- Bound the target system by anode class, electrolyte family, electrode pairing, and cell format.
- State the performance gap and why existing strategies are insufficient.

## 2. Mechanism Decomposition
- Map candidate causal chains across scales:
  - **Bulk electrolyte:** solvation structure, ion transport, water activity, side-reaction kinetics.
  - **Electrode interface:** adsorption, desolvation, charge transfer, interphase formation.
  - **Deposition morphology:** nucleation mode, growth orientation, uniformity.
  - **Full-cell coupling:** cathode interaction, separator effects, cross-talk.
- Label each link as evidence-supported or inferred.

## 3. Competing Hypothesis Generation
- Generate at least three falsifiable hypotheses that link an intervention to the failure mode.
- Include a null/artifact hypothesis (e.g., generic viscosity, concentration, or process effect).
- For each hypothesis record:
  - Mechanism pathway.
  - Evidence strength (strong / moderate / weak / speculative).
  - Key assumptions.
  - Likely failure modes.
  - Discriminating observation that would support or refute it.

## 4. Tier 1 — Minimal Viable Mechanism Validation
- Establish a baseline and an intervention-free control.
- Measure one bulk descriptor, one interfacial descriptor, and one simple electrochemical stability or deposition indicator.
- **Gate 1 (Reproducibility):** If the failure phenotype is absent or irreproducible, stop and refine the model system.
- **Gate 2 (Descriptor Presence):** If the proposed mechanistic descriptor does not change relative to baseline, do not escalate to Tier 2.

## 5. Tier 2 — Mechanistic Discrimination
- Add mechanism-isolation controls (e.g., structurally matched inactive analog, bulk-only vs. interface-only perturbation, cathode-side control).
- Collect orthogonal evidence from at least two independent measurement principles (e.g., spectroscopic, microscopic, transport, kinetic).
- **Gate 3 (Control Separation):** If negative controls show equivalent improvement, halt mechanistic claims and search for confounds.
- **Gate 4 (Orthogonality):** If only one evidence stream supports the hypothesis, add an independent diagnostic before proceeding.

## 6. Tier 3 — Strong Validation & Boundary Testing
- Test across at least two cell formats or loading conditions to detect scale-dependent artifacts.
- Evaluate full-cell coupling to ensure anode-side gains are not offset by cathode or separator degradation.
- Perform post-cycling analysis to link the final state back to the proposed mechanism.
- **Gate 5 (Format Robustness):** If improvement vanishes in more practical formats, bound claims to the original test conditions.
- **Gate 6 (Safety & Compatibility):** If side reactions, impedance growth, or instability worsen, stop and redesign.

## 7. Cross-Modal Integration & Mechanism Inference
- Align evidence across structure, solvation, interface, kinetics, morphology, and performance.
- Accept a mechanism only when expected improvements appear in mechanism-active conditions and not in negative controls.
- Label each claim as directly observed, mechanistically inferred, or extrapolated.

## 8. Iteration & Stop Conditions
- **Convergent evidence:** Promote the hypothesis to plausible; test harsher boundaries (e.g., extended duration, wider temperature range, higher loading).
- **Partial convergence:** Preserve the leading hypothesis but target the weakest causal link with a new discriminating test.
- **Divergent evidence:** Do not force a single mechanism. Split the problem into bulk-dominated, interface-dominated, or artifact-dominated subproblems and redesign controls.
- **Performance without mechanism:** Treat as an empirical screening lead; design a targeted structural or interfacial diagnostic.
- **Hard stops:**
  - No improvement over baseline.
  - Improvement only in half-cell metrics with full-cell failure.
  - Mechanism contradicted by controls.
  - Irreproducible phenotype or high variability without identifiable source.
  - Uncontrolled side reactions or compatibility concerns dominate.

# Output Format

When using this skill, produce:

1. **Research question** — One sentence framed around a specific instability or performance gap.
2. **Mechanism map** — Candidate causal chain from intervention to bulk/interfacial descriptors to deposition and cell metrics.
3. **Hypothesis table** — Columns: hypothesis, evidence strength, key assumptions, discriminating test, likely failure mode.
4. **Experimental design plan** — Tier 1 (minimal viable validation), Tier 2 (mechanism discrimination), Tier 3 (strong validation), with controls and stop conditions.
5. **Analysis plan** — Primary descriptors, decision rules, visualization plan, and criteria for supporting or rejecting each hypothesis.
6. **Iteration plan** — Next step if evidence converges, partially converges, diverges, or performance improves without mechanism support.
7. **Validity and boundary statement** — Explicitly state what is directly supported, what is inferred, what is extrapolated, and what remains outside the tested boundary.

# Validation Gates

Apply these criteria before advancing between tiers or presenting conclusions:

- **Phenotype validity:** The instability is defined independently of the proposed solution.
- **Control adequacy:** Baseline, matrix, interface, cathode-side, and format controls are sufficient to isolate the proposed mechanism.
- **Orthogonality:** Transport/solvation, adsorption/interphase, morphology, and performance are supported by independent evidence streams.
- **Artifact risk:** Viscosity, conductivity, pH drift, impurity effects, separator changes, cathode dissolution, gas management, or cell-format differences have been considered.
- **Statistical validity:** Replicates, uncertainty estimates, normalization, and pre-defined failure criteria are reported.
- **Reproducibility:** Key descriptors and performance trends can be reproduced across batches or formats.
- **Mechanistic consistency:** Bulk evidence, interface evidence, and cell performance support the same causal chain.
- **Boundary awareness:** Claims are limited to the studied electrolyte family, electrode, and cell format.

# Claim Boundaries

- **Directly observed:** Phenomena documented by at least two orthogonal measurements in the current system.
- **Mechanistically inferred:** Plausible causal links supported by convergent evidence and consistent controls, but not directly imaged or isolated.
- **Extrapolated/speculative:** Extensions to new chemistries, electrodes, electrolytes, or operating regimes not yet tested.
- Do not treat single-source evidence as field consensus.
- Separate half-cell findings from full-cell readiness.
- Avoid causal claims when only correlation or short-duration screening is available.

# Failure Modes

Common ways the workflow or candidate mechanism can fail:

- **Confounding:** Improvement is explained by viscosity, conductivity, ionic strength, pH, impurity, or loading artifacts rather than the proposed mechanism.
- **Process artifact:** Coating, pretreatment, or handling effects mimic a true mechanistic signal.
- **Half-cell/full-cell mismatch:** Anode-side stabilization is offset by cathode degradation, separator incompatibility, or cross-talk.
- **Single-stream mechanism:** The hypothesis relies on one indirect measurement without orthogonal support.
- **Ambiguous controls:** Mechanism-negative and mechanism-positive controls do not cleanly separate effects.
- **Performance without structure:** Cycling improves without corresponding changes in solvation, interfacial, or morphological descriptors.
- **Irreproducibility:** Phenotype or metric is inconsistent across repeats or batches.
- **Over-extrapolation:** Claims are extended beyond the tested chemistry, format, or duration.

# Validity Checks

Before finalizing outputs, verify:

- The research question addresses a real, unsolved limitation.
- At least three competing hypotheses were generated, including a null/artifact hypothesis.
- Each tier includes pre-defined stop conditions.
- Controls distinguish specific chemistry from generic physical effects.
- Evidence is classified as directly observed, inferred, or extrapolated.
- Full-cell compatibility is checked before claiming practical relevance.
- Safety and environmental boundaries are respected; no operational hazardous details are included.
- Source-paper findings are separated from new-system inferences.

# Provenance

Derived from cluster **60.0** (observable-driven mechanism discovery and validation) and synthesized from the following source-skill patterns:

- `aqueous-zinc-interface-regulation`
- `nonaqueous-zinc-conversion-battery-exploration`
- `single-ion-porous-electrolyte-research`
- `aqueous-zinc-electrolyte-exploration`
- `aqueous-zinc-electrolyte-research-design`
- `aqueous-zinc-anode-research-workflow`
- `helmholtz-plane-interface-design`
- `interfacial-microenvironment-zinc-battery-research`

These skills provided the shared workflow route; this merged skill treats them as provenance references and does not reproduce their source-paper conclusions.
