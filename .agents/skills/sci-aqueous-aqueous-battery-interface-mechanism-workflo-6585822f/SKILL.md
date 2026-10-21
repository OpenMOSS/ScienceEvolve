---
name: sci-aqueous-aqueous-battery-interface-mechanism-workflo-6585822f
description: A reusable end-to-end workflow for proposing, testing, and iterating mechanism hypotheses in aqueous battery electrode-electrolyte interfaces, from bottleneck diagnosis through orthogonal validation to claim bounding.
scienceevolve-title: "Aqueous battery interfaces · aqueous battery interface mechanism workflow"
scienceevolve-area: aqueous-battery-interfaces
---

## Purpose

Help an agent transform an observed performance bottleneck in aqueous battery electrode-electrolyte interfaces into a structured, falsifiable research program. The workflow generates competing mechanism hypotheses, designs minimally controlled validations, triangulates orthogonal evidence, and iterates based on mismatch signals—without treating any single source system as universal consensus.

## When to use

Use this skill when:

- The user asks for new research questions or experimental designs for aqueous battery anodes, conversion electrodes, or electrolyte/electrode interfaces.
- The target system involves coupled degradation such as dissolution, passivation, dendritic growth, side reactions, morphology collapse, or interfacial instability.
- A proposed design uses interfacial layers, selective matrices, electrolyte additives, or confinement strategies to improve stability or reversibility.
- The task requires distinguishing paper-supported method patterns from agent-generated hypotheses for a new chemistry or architecture.

Do not use this skill to claim field-wide consensus from a single paper, to copy a specific reported architecture without revalidation, to generate operational fabrication recipes, or to design unsafe electrochemical operations.

## Inputs required

Ask for or infer:

- Target chemistry and electrode pairing (anode class, cathode class, electrolyte family).
- Observed bottleneck: transport limitation, interfacial degradation, deposition disorder, capacity fade, efficiency loss, or mechanical failure.
- Candidate design concept: interfacial layer, additive, confinement matrix, electrolyte modification, or deposition regulator (optional).
- Available evidence classes: electrochemical, structural, spectroscopic, imaging, transport, and modeling.
- Baseline and feasible controls.
- Safety, compliance, and reproducibility context.
- Intended output: hypothesis map, experimental design schema, analysis plan, or iteration strategy.

If inputs are missing, state assumptions explicitly and label each as paper-supported pattern, plausible transfer, or new inference.

## Core Workflow

1. **Bottleneck diagnosis and framing**
   - Define the reproducible performance gap independently of any preferred solution.
   - Classify the failure mode: dissolution, passivation, dendritic growth, side reaction, transport blockage, mechanical degradation, or coupled.
   - **Decision gate:** If the bottleneck cannot be defined without reference to a specific material or additive, stop and reframe.

2. **Mechanism-layer mapping**
   - Map the bottleneck to candidate layers: bulk electrolyte transport, solvation/desolvation, electrode/electrolyte interface, interphase evolution, deposition morphology, or full-cell coupling.
   - Identify which layer is most likely rate-limiting or failure-initiating.
   - **Decision gate:** If multiple layers are indistinguishable without evidence, list them as competing contributors rather than selecting one prematurely.

3. **Competing hypothesis generation**
   - Generate at least three hypotheses. For each, specify: a concise causal claim; evidence strength (strong, moderate, weak, or speculative); key assumptions; a predicted observable signature; and likely failure modes.
   - Consider hypothesis families such as selective confinement, interfacial regulation, deposition-field redistribution, solvation modification, morphology retention, transport-coupled stability, and artifact/non-specific effects.
   - **Decision gate:** If fewer than three hypotheses can be formulated, broaden the mechanism search or gather additional domain input before proceeding.

4. **Minimal viable validation design**
   - Select one primary design variable that discriminates between the top hypotheses.
   - Define a control matrix: baseline; negative control (removes the suspected factor); positive/rescue control (restores the factor); structural or chemical analogue controls; component-swap controls; and artifact controls (pH, conductivity, impurities, geometry, assembly).
   - Specify primary and secondary readouts tied to the proposed mechanism, not solely to performance metrics.
   - Predefine stop conditions: e.g., baseline is irreproducible, controls are indistinguishable, the active state is absent, or safety constraints are violated.
   - **Decision gate:** If the experiment changes multiple variables simultaneously without isolation, redesign before validation.

5. **Orthogonal evidence collection**
   - Collect evidence from at least two independent assay classes (e.g., electrochemical plus structural, or spectroscopic plus kinetic).
   - Separate static from dynamic or operando observations when interfacial evolution is central to the claim.
   - **Decision gate:** If only one evidence class is available, downgrade mechanism confidence to provisional and plan additional diagnostics.

6. **Mechanism discrimination and analysis**
   - Compare results across controls. Attribute improvement only when structural and chemistry controls rule out simpler explanations.
   - Map each result onto the mechanism chain: structure → interface → transport/intermediate → electrochemical outcome.
   - Label every claim as measured, inferred, plausible but untested, or speculative.
   - **Decision gate:** If performance improves but the intermediate mechanism is absent, search for alternative explanations (impedance change, roughness smoothing, cathode limitation, electrolyte depletion, or measurement artifact).

7. **Discordance handling and iteration**
   - If evidence converges: promote the hypothesis to plausible; plan a boundary test or independent replication.
   - If evidence partially converges: keep the leading hypothesis but generate alternatives; add an assay that directly challenges the weakest assumption.
   - If evidence diverges: split the system into possible sub-mechanisms; re-examine whether the active state is stable and whether the cell configuration masks the intended effect.
   - If controls fail: treat the result as assay-development or condition-development evidence, not mechanistic evidence; redesign specificity before interpreting function.
   - **Decision gate:** After each cycle, decide whether to continue, modify the hypothesis, stop, or switch from mechanism discovery to design validation.

8. **Claim bounding and output**
   - Bound claims to the tested chemistry, cell format, and operating regime.
   - Separate paper-supported patterns from agent-generated inferences.
   - Document failure modes, boundary conditions, and unresolved questions.
   - **Decision gate:** If claims generalize beyond tested boundaries, flag them as extrapolation and require additional validation.

## Output Format

When using this skill, produce:

1. **Research question** — One concise sentence tied to a specific degradation bottleneck and mechanism layer.
2. **Mechanism map** — A causal chain from architecture or design feature to interfacial/transport effect to electrochemical outcome.
3. **Competing hypotheses** — At least three hypotheses, each with evidence strength, key assumptions, predicted observable signature, and likely failure modes.
4. **Experimental design schema** — Variables, minimal viable validation, control matrix, primary and secondary readouts, and stop conditions.
5. **Analysis plan** — Evidence ladder, confounder checks, and rules for integrating multi-modal or discordant data.
6. **Iteration rules** — Decision tree for convergent, partial, divergent, or failed evidence patterns.
7. **Validity and safety notes** — Confounders, reproducibility checks, boundary conditions, and non-operational safety constraints.
8. **Evidence labeling** — Clear separation of paper-supported method patterns, controlled-result evidence, and agent-generated extrapolations.

## Validation Gates

Before presenting conclusions, verify:

- **Mechanism specificity:** The design tests the proposed failure mode rather than merely adding another component.
- **Control adequacy:** Baseline, negative, positive, analogue, and artifact controls are present and matched in relevant composition, loading, and format.
- **Orthogonality:** The mechanism is supported by at least two independent evidence classes.
- **Baseline fairness:** Comparison groups are matched; counter-electrode confounding and electrolyte-ratio artifacts are considered.
- **Transport compatibility:** Necessary charge carriers can still access active sites.
- **Statistical validity:** Repeated samples, uncertainty, and appropriate comparisons are included conceptually.
- **Reproducibility:** Fabrication, handling, and testing conditions are described enough for independent conceptual replication.
- **Boundary humility:** Claims are limited to the tested chemistry, cell format, and operating regime.

## Claim Boundaries

- Do not present a single paper’s conclusion as field-wide consensus.
- Do not claim a mechanism is proven unless data show the architecture improves active-material retention, preserves structure, and improves electrochemical behavior under matched conditions.
- Distinguish paper-supported method patterns from agent-generated inferences for any new system.
- Limit causal claims to the study design and control quality available.
- Avoid generalizing from half-cell or idealized results to full-cell or practical applicability without explicit boundary testing.

## Failure Modes

- **Convergence illusion:** Performance improves via an uncontrolled variable (e.g., active area, conductivity, pH drift, impurity) rather than the proposed mechanism.
- **Control failure:** The negative control performs similarly to the proposed design, or the baseline cannot be reproduced.
- **Discordant evidence:** Half-cell and full-cell results diverge; static and operando observations conflict; morphology improves but reversibility or side-reaction metrics do not.
- **Transport-reversibility tradeoff:** An interfacial modification blocks charge carriers or increases polarization beyond acceptable limits.
- **Synergy mirage:** A multifunctional design outperforms baseline but not single-role analogues, indicating non-specific or confounded effects.
- **Extrapolation risk:** The mechanism is supported only under idealized conditions and collapses in practical formats or representative cell configurations.
- **Assumption collapse:** A key assumption (e.g., active chemical state, interface continuity, selective transport) is unsupported or contradicted by controls.

## Validity Checks

- Confirm the bottleneck was defined independently of the preferred solution or regulator.
- Ensure each hypothesis has a falsifiable prediction and a defined failure mode.
- Verify that controls isolate chemistry, structure, and transport contributions where possible.
- Consider confounders: electrolyte amount, electrode state, cell geometry, separator effects, environment, processing history, and characterization timing.
- Classify all evidence as measured, inferred, plausible but untested, or speculative.
- Require consistent pre- and post-cycling analysis before strong structural or retention claims.
- Address variability, batch effects, and outliers explicitly.
- Acknowledge safety and compliance constraints; do not bypass institutional review or governance.

## Provenance

- Derived from cluster 6.1 ("aqueous-interface-zinc-battery-mechanism-discovery-workflow") of the scientific skills codex.
- Synthesized from source skills: compartmentalized-aqueous-conversion-electrode-exploration (e15b040a1a5f5a66), zinc-ion-battery-electrolyte-interface-exploration (695911050d986203), aqueous-zn-mn-mechanism-discovery (ca6496081437fb23), zinc-anode-interface-research-design (80b9452b8192c589), interfacial-modification-battery-exploration (4c536128ee673a14), interfacial-regulator-zinc-battery-research (a5a571bca12435cb), quasi-solid-zinc-interface-exploration (27d17cd12832a9e8), and azib-electrolyte-additive-research-workflow (b106fd6102c6fe2e).
- Preserves the observable-driven mechanism discovery and validation archetype without embedding paper-specific materials, numerical parameters, or operational protocols.
