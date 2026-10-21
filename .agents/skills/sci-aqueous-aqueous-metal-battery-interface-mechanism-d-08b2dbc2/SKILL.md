---
name: sci-aqueous-aqueous-metal-battery-interface-mechanism-d-08b2dbc2
description: A reusable end-to-end workflow for proposing, validating, and iterating mechanism-linked hypotheses in aqueous or mixed-solvent metal-battery electrolyte and interface research.
scienceevolve-title: "Aqueous battery interfaces · aqueous metal battery interface mechanism discovery workflow 2"
scienceevolve-area: aqueous-battery-interfaces
---

## Purpose

This skill helps an agent turn observational or paper-derived insights into a transferable, end-to-end research workflow for electrolyte and interface problems in aqueous or mixed-solvent metal batteries. It focuses on decomposing coupled device failures into stage-specific mechanisms, generating falsifiable hypotheses, designing staged validation with strong controls, and bounding claims through converging multi-scale evidence. It does not reproduce specific material systems, operational protocols, or numerical parameters.

## When to use

Use this skill when a user asks to:

- propose new research questions for structured electrolytes, interfacial modifiers, transport-regulating layers, or reactive-metal electrode interfaces;
- generate mechanism-linked hypotheses about suppressing side reactions, unstable deposition, transport limitations, or interfacial degradation;
- design minimal validation experiments with matched controls and explicit stop conditions;
- interpret whether structural, transport, interfacial, and device-level evidence support a proposed mechanism;
- iterate on a design when one property improves but another fails.

Do not use this skill for unrelated chemistry domains, requests for executable high-risk operational procedures, or device-scale engineering approval.

## Inputs required

Before generating a plan, collect or clarify:

- target battery chemistry and reactive electrode context;
- dominant failure mode (e.g., side reaction, unstable plating/stripping, transport loss, mechanical degradation);
- candidate design class (e.g., structured medium, interfacial layer, additive, co-solvent, transport-regulating separator);
- intended operating stress (temperature range, rate, cycling depth, mechanical constraint);
- available characterization and electrochemical measurements;
- safety, containment, waste, and compliance constraints.

If inputs are missing, state assumptions explicitly and mark the plan as preliminary.

## Core Workflow

Follow this ordered route. Do not skip decision gates.

### Stage 1: Decompose the device failure
- Identify the primary observable failure and its stage-level contributors: bulk transport, interfacial chemistry, deposition morphology, mechanical stability, or full-cell integration.
- Separate transport limitations from interfacial chemical limitations.

**Decision Gate 1 (Scope Gate):** Is the failure mode specific enough to link to a molecular or mesoscale mechanism? If no, stop and refine the problem statement.

### Stage 2: Map mechanisms and generate falsifiable hypotheses
- Build a causal chain: design variable → local environment → interface behavior → transport/deposition → electrode stability → device performance.
- Mark each link as verified, plausible, or speculative.
- Generate at least two mechanism-linked hypotheses. For each, state:
  - predicted observables at multiple length scales,
  - evidence strength (strong, moderate, weak, speculative),
  - key assumptions,
  - explicit falsification criteria.

**Decision Gate 2 (Hypothesis Gate):** Does every hypothesis have a falsifying observation and a stage-specific diagnostic? If no, iterate the mechanism map.

### Stage 3: Design a staged validation matrix
- Define minimal viable validation across scales: structure/phase → transport → interface → electrode → device.
- Specify a control matrix that isolates mechanism:
  - baseline without the proposed design;
  - negative or architecture-only control;
  - single-function control lacking the secondary tuning component;
  - contrast control that changes a key chemical or physical feature;
  - compatibility control for cross-component interactions.
- Define primary and secondary metrics, and preset stop conditions for each substage.

**Decision Gate 3 (Design Gate):** Do controls isolate the proposed mechanism from confounders such as loading, geometry, assembly, or mass accounting? If no, redesign before execution.

### Stage 4: Execute mechanism-first validation
- Confirm structural or phase integrity and reproducibility first.
- Collect transport, interfacial kinetic, and morphological diagnostics before advancing to full-device tests.
- After each substage, evaluate against stop conditions:
  - structure or phase is irreproducible;
  - transport collapses below baseline;
  - interfacial instability or polarization rises sharply;
  - safety-relevant behavior worsens.

**Decision Gate 4a (Mechanism Gate):** Does mechanism-level evidence support the predicted causal chain? If no, skip device-level claims and proceed to Stage 6.
**Decision Gate 4b (Safety Gate):** Does the candidate worsen gas evolution, thermal instability, leakage, or other safety-relevant behavior? If yes, stop and redesign.

### Stage 5: Triangulate evidence and separate mechanism from performance
- Build a mechanism-to-evidence table linking each hypothesis to structural, transport, kinetic, morphological, and device observations.
- Require converging evidence: no single metric is treated as sufficient proof.
- Flag correlations that lack mechanistic support.

**Decision Gate 5 (Convergence Gate):** Do at least two independent diagnostic layers align on the same causal story? If no, classify the result as inconclusive.

### Stage 6: Discriminate hypotheses and update claims
- Classify each hypothesis as supported, partially supported, contradicted, or inconclusive.
- If contradicted, identify which causal link failed and revise the mechanism map.
- Bound claims to the tested chemistry, electrode pair, cell format, and stress condition.

**Decision Gate 6 (Claim Gate):** Are claims limited to tested conditions and distinguished from field-wide consensus? If no, return to Stage 2 or 3.

### Stage 7: Iterate, pivot, or terminate
- **If supported:** Propose boundary tests (higher loading, longer duration, alternative chemistries) and tighten generalization limits.
- **If partially supported:** Target the weakest causal link with a revised design variable; return to Stage 3.
- **If contradicted:** Pivot to an alternative mechanism or terminate the line.
- **Terminate** if the mechanism is falsified, confounding is unresolvable, reproducibility fails, or safety/compliance requirements cannot be met.

## Output Format

Return the research plan in this structure:

1. **Research question** — Target system, failure mode, and significance.
2. **Mechanism map** — Causal chain with evidence status for each link.
3. **Hypotheses** — At least two hypotheses with predicted observables, evidence strength, key assumptions, and falsification tests.
4. **Experimental design** — Staged validation plan, control matrix, variables, metrics, and stop conditions.
5. **Analysis plan** — How to integrate molecular, interfacial, electrode, and device evidence; how to handle contradictions.
6. **Iteration plan** — Next design change for each possible outcome (support, partial support, contradiction, inconclusive).
7. **Validity and boundary statement** — Confounders, reproducibility requirements, statistical checks, and limits of generalization.
8. **Safety note** — Non-operational safety and compliance boundaries.

## Validation Gates

Explicit gates and their pass criteria:

| Gate | Criterion | Fail Action |
|------|-----------|-------------|
| Scope Gate | Failure is decomposed into stage-specific observables | Refine problem statement |
| Hypothesis Gate | Each hypothesis has a falsifying observation and stage-specific diagnostic | Iterate mechanism map |
| Design Gate | Control matrix isolates mechanism from confounders | Redesign experiments |
| Mechanism Gate | Mechanism-level evidence matches predictions before device claims | Skip device tests; analyze contradictions |
| Safety Gate | No worsening of safety-relevant behavior | Stop and redesign |
| Convergence Gate | At least two independent diagnostic layers align | Classify as inconclusive |
| Claim Gate | Claims are bounded to tested conditions and labeled by evidence strength | Return to hypothesis or design stage |

## Claim Boundaries

- Do not generalize beyond the tested chemistry, electrode pair, cell format, and stress condition.
- Do not infer mechanism from device performance alone; require independent mechanism-level diagnostics.
- Do not treat single-study or agent-inferred results as field consensus.
- Do not claim practical device readiness from half-cell or low-stress validation alone.
- Clearly separate paper-supported method patterns from new agent-inferred hypotheses.

## Failure Modes

Common ways the workflow or research plan can fail:

- The structured phase or interfacial architecture is not reproducible.
- Transport penalty exceeds interfacial stability gain.
- Interfacial metrics improve but full-cell performance does not translate.
- Controls reveal the improvement is an artifact of assembly, loading, or mass accounting.
- Evidence layers contradict (e.g., molecular prediction without local-structure support).
- Safety-relevant behavior worsens without compensating benefit.
- Results are irreproducible across independent repeats.

## Validity Checks

Before finalizing a research plan, verify:

- **Confounding control:** separator, electrode loading, cell format, and assembly handling are matched across comparisons.
- **Control adequacy:** negative, architecture-only, single-function, contrast, and compatibility controls are included where feasible.
- **Mechanistic sufficiency:** each claimed mechanism has at least one independent diagnostic.
- **Reproducibility:** repeated measurements and variability are reported, not only best-case metrics.
- **Statistical validity:** endpoints are predefined and failed cells are not selectively excluded.
- **Boundary conditions:** claims specify the tested chemistry, format, and stress context.
- **Evidence labeling:** paper-supported facts are separated from agent-inferred hypotheses.
- **Safety and ethics:** the plan avoids executable high-risk operational details and follows applicable laboratory, environmental, and regulatory requirements.

## Provenance

Synthesized from cluster 63 / subcluster 63.0. Source skills: aqueous-zinc-hydrogel-electrolyte-research (ad3d45b5366debf0), multi-stage-zinc-electrolyte-exploration (6c198eb97a4e3c1e), interfacial-electrolyte-additive-discovery (9ac40165edd1286c), aqueous-metal-battery-solvent-interface-research (48a489118d6edd3d), azib-transport-separator-research (833805e9f2b242c2), coupled-gpe-research-workflow (dccffdae79f0c912), lithium-anode-interphase-research-pattern (333565ff6b108142), hydrophobic-interface-zinc-battery-exploration (ddfb446df4efa86f).
