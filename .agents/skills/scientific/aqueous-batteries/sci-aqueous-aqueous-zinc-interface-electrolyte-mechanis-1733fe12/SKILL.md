---
name: sci-aqueous-aqueous-zinc-interface-electrolyte-mechanis-1733fe12
description: Generate, validate, and iterate mechanism-driven hypotheses for aqueous zinc battery electrode-electrolyte interfaces using controlled, evidence-first research design.
scienceevolve-title: "Aqueous battery interfaces · aqueous zinc interface electrolyte mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

## Purpose

Transform an observed aqueous zinc battery interfacial failure mode into a structured, mechanism-first research program. The workflow generates falsifiable hypotheses, designs minimum viable validation plans with matched controls, enforces orthogonal evidence triangulation, and iterates or terminates based on causal-chain coherence rather than isolated performance metrics.

## When to use

Trigger this workflow when the user needs to:

- Propose new research questions or hypotheses for aqueous zinc metal anodes, electrolyte additives, interphases, or interface modifiers.
- Design validation studies that link molecular or material design to interfacial structure, deposition morphology, and electrochemical behavior.
- Audit whether a proposed mechanism is supported by orthogonal evidence or explainable by artifacts, confounders, or incomplete controls.
- Iterate a research plan after observing ambiguous, contradictory, or negative results.

Do not use for operational laboratory protocols, battery-pack engineering, safety certification, manufacturing scale-up, or as a substitute for institutional safety review.

## Inputs required

Before executing the workflow, identify or request:

- **Target system:** anode, cathode, electrolyte class, separator, and intended operating regime at a conceptual level.
- **Primary failure mode:** e.g., dendritic deposition, corrosion, gas evolution, passivation, poor reversibility, or cathode incompatibility.
- **Candidate intervention class:** additive, coating, separator functionalization, solvation regulator, or interphase-forming motif, with a proposed mechanism.
- **Baseline and benchmark systems** for comparison.
- **Available evidence streams:** electrochemical, microscopy, spectroscopy, impedance, or computational.
- **Constraints:** safety boundaries, reproducibility standards, data-availability expectations, and environmental or compliance limits.

## Core Workflow

1. **Frame the failure mode and gap.** Define the bottleneck as a coupled chemical–transport–morphology problem rather than a single symptom. Identify the unresolved mechanism or tradeoff in existing strategies.
   - *Gate 1 (Specificity):* Is the failure mode specific enough to yield a falsifiable mechanism? If no, refine the scope or stop.

2. **Build a mechanism map.** Construct a causal chain from molecular or structural feature → interfacial chemistry → ion transport → deposition morphology → reversibility or device behavior. Assign an independent measurable proxy to each link.
   - *Gate 2 (Measurability):* Does every proposed function have a measurable proxy? If no, redesign the map before proceeding.

3. **Generate competing hypotheses.** Produce at least three falsifiable hypotheses plus a null/artifact hypothesis. For each, state the claim, design logic, mechanistic link, evidence strength (strong / moderate / weak / speculative), key assumptions, and likely failure modes. Explicitly label source-supported patterns versus new-system inferences.
   - *Gate 3 (Rigor):* Are hypotheses ranked, mutually competing, and free from unsupported extrapolation? If no, revise.

4. **Design minimum viable validation.** Define independent variables (intervention presence, structural variants) and dependent variables (mechanistic proxies, electrochemical metrics). Assemble a control hierarchy: baseline, negative/mechanism-inactive analogue, positive/benchmark, bulk-property control, and device-level control. Specify primary metrics (reversibility, efficiency, stability), secondary metrics (conductivity, morphology, composition), and stop conditions (safety concern, irreproducibility, cathode incompatibility, or gains that vanish under stronger controls).
   - *Gate 4 (Isolation):* Does the plan isolate the proposed mechanism from bulk, artifact, and device-level confounders? If no, add controls.

5. **Collect layered evidence.** Advance conceptually through ordered layers: (a) material/interface identity and compatibility; (b) interfacial chemistry and transport diagnostics; (c) half-cell reversibility and morphology; (d) full-cell behavior only when lower-layer evidence supports the mechanism. Require at least two orthogonal evidence streams before advancing to the next layer.
   - *Gate 5 (Convergence):* Do orthogonal diagnostics agree on the causal chain? If no, pause advancement and resolve discrepancies.

6. **Analyze with mechanism-first triangulation.** Perform data-integrity checks (raw availability, replicate consistency, calibration, normalization). Compare against matched baselines. Require at least two independent evidence streams per mechanistic claim. Screen for artifacts (pretreatment, impurities, mass balance, assembly variation, selective reporting). Map tradeoffs to identify hidden penalties.
   - *Gate 6 (Causality):* Is the mechanism supported by convergent evidence and inconsistent with leading alternatives? If no, reframe or downgrade the claim.

7. **Decide and iterate.** Classify the result as Supported (advance), Ambiguous (add discriminative control), or Refuted (preserve observation, discard mechanism). Update hypotheses accordingly: keep if convergent, narrow if system-specific, split if effects are confounded, reframe if bulk/artifact dominates, discard if controls invalidate the claim.
   - *Gate 7 (Survival):* Has the hypothesis survived stricter controls and reproducibility checks? If no, return to Phase 3 or terminate.

8. **Report boundaries and terminate.** State applicable chemistry classes, electrode formats, and operating regimes. Distinguish observed evidence, inferred mechanism, and speculative extension. Document negative results and failure modes as design constraints. Terminate when claims are bounded, evidence is transparent, and next steps are defined.

## Output Format

Produce:

1. **Scope and trigger:** target system, failure mode, and why the workflow applies.
2. **Gap statement:** unresolved mechanism or tradeoff.
3. **Mechanism map:** causal chain with measurable proxies for each link.
4. **Hypothesis table:** at least three hypotheses with evidence strength, key assumptions, and failure modes.
5. **Validation plan:** variables, control hierarchy, metrics, and stop conditions.
6. **Analysis plan:** data checks, triangulation rules, artifact screening, and statistical review.
7. **Iteration log:** decision rules for keep/narrow/split/reframe/discard and resulting redesign.
8. **Boundary and safety notes:** applicability limits, confounders, reproducibility requirements, and non-operational safety constraints.

## Validation Gates

- **Gate 1 (Specificity):** Failure mode is specific enough to yield a falsifiable mechanism.
- **Gate 2 (Measurability):** Every proposed function has an independent measurable proxy.
- **Gate 3 (Rigor):** Hypotheses are ranked, competing, and distinguish source evidence from new-system inference.
- **Gate 4 (Isolation):** Plan includes controls for bulk, artifact, and device-level confounders.
- **Gate 5 (Convergence):** Orthogonal diagnostics agree before advancing to higher complexity.
- **Gate 6 (Causality):** Mechanism is supported by convergent evidence and inconsistent with alternatives.
- **Gate 7 (Survival):** Hypothesis survives stricter controls and reproducibility checks before acceptance.

## Claim Boundaries

- Claims must be limited to the tested electrolyte class, electrode chemistry, cell format, and operating regime.
- Distinguish observed evidence from inferred mechanism and from speculative extrapolation.
- Do not generalize from a single candidate to all aqueous zinc systems.
- Performance improvements alone do not prove the proposed interfacial mechanism.
- Full-cell relevance requires independent half-cell support; half-cell gains do not automatically translate to devices.

## Failure Modes

- **Mechanism misattribution:** Improvement arises from bulk transport, cathode effects, or assembly artifacts rather than the proposed interface mechanism.
- **Control inadequacy:** Absence of structural analogues, bulk-property controls, or benchmark comparisons leads to false positives.
- **Single-stream overreach:** A mechanistic claim rests on only one diagnostic modality.
- **Irreproducibility:** Uncontrolled impurities, electrode history, or assembly variation produce non-replicable trends.
- **Hidden tradeoffs:** Conductivity penalty, cathode interference, or accelerated side reactions masked by selective metric reporting.
- **Boundary violation:** Claims extrapolated beyond tested rate, temperature, or chemistry without validation.
- **Data integrity lapse:** Missing raw data, inconsistent normalization, or incomplete figure panels undermine conclusions.

## Validity Checks

- **Confounding variables:** salt identity, pH, water activity, impurities, electrode history, separator effects, mass balance, temperature, and assembly differences.
- **Control adequacy:** baseline, negative, positive, mechanism, bulk-property, and device-level controls are present and matched.
- **Reproducibility:** replicate variability is reported; conclusions survive stricter controls.
- **Mechanistic specificity:** data support the proposed interface mechanism, not merely generic performance improvement.
- **Statistical validity:** uncertainty, outliers, normalization choices, and multiple comparisons are handled transparently.
- **External validity:** claims are framed as testable hypotheses, not field-wide consensus.
- **Data transparency:** raw curves, processed tables, post-mortem images, and analysis scripts are available for independent review.

## Provenance

- Derived from cluster 19 / subcluster 19.0: aqueous-zinc-interface-electrolyte-mechanism-discovery.
- Synthesized from source skills: `zinc-ion-electrolyte-interface-exploration` (4ad4de69716c1273), `aqueous-zinc-interface-research-design` (1e64e46b134bd5c1), `aqueous-zinc-interface-exploration` (a553ab67508b4b9e), `interfacial-ph-regulated-zinc-anode-research` (98dfbf4e2819be35), `selective-interface-zinc-anode-exploration` (97cbaaf72445c6e4), `aqueous-zn-additive-validation` (00ab1ebaa2b358e2), `aqueous-multivalent-battery-electrolyte-exploration` (d616f661f69212f0), `conductive-porous-hybrid-energy-storage` (efb438fc17835cbf).
- Workflow archetype: observable-driven mechanism discovery and validation.
