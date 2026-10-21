---
name: sci-aqueous-electrolyte-zinc-interface-aqueous-mechanis-396d9f13
description: A reusable end-to-end workflow for designing, validating, and iterating mechanism-driven research in aqueous zinc battery electrolyte and interface systems.
scienceevolve-title: "Aqueous battery interfaces · electrolyte zinc interface aqueous mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

## Purpose

Guide agents in designing transferable research plans for aqueous zinc-based battery interfaces and electrolytes. The workflow teaches observable-driven mechanism discovery: map coupled interfacial failures to mechanistic hypotheses, validate them through tiered controlled experiments, and iterate based on evidence rather than paper-specific recipes.

## When to use

Use this skill when the user asks to:

- Propose new research questions involving aqueous zinc anode stability, solvation structure, desolvation, dendrite suppression, corrosion, hydrogen evolution, passivation, or side-reaction inhibition.
- Design interface engineering, electrolyte engineering, separator/interlayer, or hybrid strategies at the research-design level.
- Translate mechanistic observations into hypotheses, variables, controls, evaluation metrics, and iteration rules.
- Plan minimal validation before a larger experimental campaign.

Do not use this skill for unrelated battery chemistries without adaptation, or for requests requiring directly executable hazardous laboratory protocols.

## Inputs required

Ask for or infer the following before drafting a plan:

- **Target system:** anode chemistry (e.g., zinc metal), electrolyte family, cell format, and intended operating regime.
- **Dominant failure mode:** nonuniform deposition, corrosion, hydrogen evolution, passivation, byproduct formation, poor desolvation, or full-cell mismatch.
- **Candidate intervention class:** interfacial layer, electrolyte additive, solvation-structure redesign, separator/interlayer, or hybrid interface-electrolyte strategy.
- **Available evidence:** literature context, preliminary data, simulations, spectroscopy, microscopy, electrochemical diagnostics, or user-provided constraints.
- **Evaluation priorities:** reversibility, side-reaction suppression, deposition morphology, rate/cycling behavior, full-cell compatibility, safety, cost, or scalability.
- **Boundary constraints:** materials availability, compatibility requirements, environmental/safety limits, cost targets, and whether the goal is exploratory, comparative, or validation-oriented.

## Core Workflow

1. **Failure Decomposition & Mechanistic Mapping**
   - Define the bottleneck as a coupled failure network linking transport, interface chemistry, morphology, mechanics, and full-cell coupling.
   - Identify the limiting mechanistic step: ion-flux distribution, desolvation, nucleation, side-reaction pathway, or interphase evolution.
   - **Decision Gate 1:** Is the failure mode interfacial or electrolyte-coupled? If not, stop and redirect to a bulk-electrode or cathode workflow.

2. **Hypothesis Generation & Ranking**
   - Generate at least three mechanism-specific hypotheses.
   - For each, specify: causal claim, mechanistic rationale, evidence strength (strong/moderate/weak/speculative), key assumptions, possible failure modes, and a minimal falsification test.
   - Label provenance: paper-supported pattern, literature-informed extension, or agent inference.
   - **Decision Gate 2:** Are hypotheses falsifiable with available or obtainable diagnostics? If not, refine the hypothesis or acquire tools before proceeding.

3. **Intervention Logic & Control Design**
   - Map each hypothesis to an intervention family (interface engineering, electrolyte/additive, solvation modulation, or combined strategy).
   - Design a control hierarchy: baseline, negative/reduced control (lacks the active mechanism), mechanism control (isolates the proposed pathway), positive control (known benchmark), and full-cell control.
   - **Decision Gate 3:** Can the proposed mechanism be isolated from confounders such as conductivity, pH, viscosity, ionic strength, or generic surface protection? If not, redesign controls.

4. **Tiered Validation Execution**
   - **Stage A — Mechanism Probe:** Interfacial structure, adsorption, solvation signatures, or transport diagnostics.
   - **Stage B — Electrochemical Discrimination:** Half-cell or symmetric-cell reversibility, efficiency, and polarization trends.
   - **Stage C — Morphology & Chemistry Linkage:** Post-cycling or operando morphology, composition, and byproduct analysis.
   - **Stage D — System Relevance:** Full-cell or realistic-stress validation (loading, rate, temperature, duration).
   - **Stop Condition:** If Stage A fails to show the predicted interfacial change, abandon or revise the mechanism before advancing to Stage B.
   - **Stop Condition:** If Stage B improves performance but Stage C contradicts the proposed mechanism, halt and test alternative explanations.

5. **Evidence Integration & Analysis**
   - Require convergence across at least two independent evidence streams before claiming mechanism support.
   - Separate mechanism evidence from performance evidence.
   - Quantify trade-offs: transport penalty, cathode compatibility, cost, scalability, and environmental impact.
   - **Decision Gate 4:** Does the evidence support the full causal chain (intervention → mechanism → morphology → reversibility)? If not, downgrade claim strength.

6. **Iteration & Claim Refinement**
   - If mechanism and performance align: strengthen the hypothesis and test boundary conditions (substrate, rate, temperature, cell format).
   - If performance improves without mechanism evidence: add discriminating controls; treat the mechanism as provisional.
   - If mechanism evidence exists but performance lags: investigate transport penalties, interfacial stability, or full-cell mismatch.
   - If gains vanish under realistic stress: narrow claims to specific conditions or redesign the intervention.
   - **Stop Condition:** If the intervention consistently underperforms controls, introduces new side reactions, or fails reproducibility checks, pivot to an alternative hypothesis.

7. **Documentation & Boundary Setting**
   - State tested boundary conditions and untested extrapolations explicitly.
   - Distinguish paper-supported, newly observed, and inferred claims.
   - Archive control definitions, metric definitions, and exclusion criteria.

## Output Format

Return the following structured research plan:

1. **Research question** — Target system, dominant failure mode, and proposed mechanistic lever.
2. **Mechanism map** — Failure mode → candidate mechanism → intervention point → expected observable.
3. **Candidate hypotheses** — At least three hypotheses with evidence strength, key assumptions, failure modes, minimal tests, and provenance labels.
4. **Experimental plan** — Independent variables, dependent variables, control hierarchy, minimum viable validation, strong validation, and stop conditions.
5. **Analysis plan** — Evidence chain, confounding checks, trade-off quantification, and uncertainty labeling.
6. **Iteration plan** — Rules for strengthening, weakening, simplifying, or reframing hypotheses based on outcomes.
7. **Validity and safety notes** — Confounding controls, reproducibility requirements, boundary conditions, and non-operational safety constraints.

## Validation Gates

- **Gate 1 (Scope):** The failure mode is interfacial or electrolyte-coupled and addressable by this workflow.
- **Gate 2 (Falsifiability):** Hypotheses can be tested with available or obtainable diagnostics.
- **Gate 3 (Control Rigor):** The mechanism can be isolated from conductivity, pH, viscosity, ionic strength, and generic surface-protection confounders.
- **Gate 4 (Convergence):** At least two independent evidence streams support the claimed mechanism before performance claims are linked to it.
- **Gate 5 (Transfer):** Full-cell or realistic-stress evidence exists before claiming practical relevance.

## Claim Boundaries

- Do not treat half-cell or symmetric-cell improvements as full-cell readiness.
- Do not treat single-paper observations as field-wide consensus.
- Distinguish paper-supported patterns from literature-informed extensions and agent inferences.
- Limit claims to tested electrolyte families, temperatures, cell formats, and failure modes.
- Mechanism evidence alone does not prove durability; performance evidence alone does not prove mechanism.

## Failure Modes

- **Misattribution:** The mechanism is generic surface protection rather than the proposed specific regulation.
- **Trade-off collapse:** The intervention improves stability while degrading transport, cathode compatibility, or scalability.
- **Condition narrowing:** Gains are driven by a narrow condition set and vanish under broader testing.
- **Control insufficiency:** Confounders (ionic strength, pH, viscosity, adsorption) are not distinguished from the intended mechanism.
- **Early-cycle artifact:** Kinetic improvement in initial cycles is mistaken for durable stabilization.
- **Scale gap:** Diagnostic-cell results fail to transfer to full-cell or realistic-loading configurations.
- **Reproducibility breakdown:** Uncontrolled surface state, impurities, or batch variability undermines claims.

## Validity Checks

- **Confounding:** Keep baseline and intervention systems matched in cell format, materials history, surface state, electrolyte background, measurement protocol, and data processing.
- **Baseline strength:** Compare against relevant modern strategies, not only bare or weak controls.
- **Mechanism validity:** Require mechanism-linked diagnostics before claiming that a strategy works through the proposed pathway.
- **Statistical validity:** Report variability, replicate trends, and uncertainty when feasible; avoid overclaiming small differences.
- **Reproducibility:** Document material provenance, sample preparation logic, measurement definitions, and analysis context without exposing hazardous operational details.
- **External validity:** Do not treat one paper, one benchmark cell, or one successful report as field-wide consensus.
- **Boundary conditions:** State which electrolyte families, temperatures, cell formats, and failure modes were tested and which remain unverified.
- **Trade-off check:** Evaluate whether gains in reversibility are offset by transport limits, cathode degradation, cost, safety, or scalability concerns.

## Provenance

- Synthesized from cluster 10.1 (observable-driven mechanism discovery and validation).
- Source skills: `zinc-aqueous-battery-solvation-design` (d848433c2adda9ca), `bilateral-interface-battery-research` (e2fb9455017983ec), `azib-interface-research-design` (67f37ce51a514047), `aqueous-zn-anode-transport-crystallization-exploration` (573f2e38bdf74b1f), `aqueous-zinc-anode-research` (bb52cbb16ebcd58b), `aqueous-zinc-electrolyte-interface-research` (36840baada4e3070), `biomimetic-zinc-electrolyte-additive-exploration` (79b1f5e7c21ff8f6), `zn-battery-dendrite-research-workflow` (08df5ec93c2b8a19).
