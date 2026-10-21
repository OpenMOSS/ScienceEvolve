---
name: sci-aqueous-aqueous-battery-interface-mechanism-discove-94844caa
description: End-to-end workflow for generating, testing, and iterating mechanism-based hypotheses in aqueous battery and related electrochemical interface research.
scienceevolve-title: "Aqueous battery interfaces · aqueous battery interface mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Use this skill to drive observable-driven mechanism discovery and validation for electrochemical interfaces, especially in aqueous battery systems. It converts observed failure modes into layered, falsifiable hypotheses; designs diagnostic experiments with strong controls; and iterates based on convergent evidence rather than single-metric gains.

# When to use

- Use when proposing new research questions, hypotheses, or validation plans for electrochemical interfaces where failure modes limit reversibility or stability.
- Use when abstracting a paper-derived interfacial design idea into a reusable research plan for a new system.
- Use when the task requires mechanism discrimination, not just performance benchmarking.
- Do not use as a substitute for domain-specific safety review, regulatory approval, or laboratory standard operating procedures.
- Do not use to generate executable high-risk operational protocols.

# Inputs required

- Target system: electrode chemistry, electrolyte class, and dominant degradation or failure mode.
- Bottleneck scope: whether the limitation is interfacial, transport-related, mechanical, or coupled across device components.
- Candidate design space: additive, coating, architecture, or formulation concepts to evaluate.
- Available evidence: literature precedents, preliminary data, characterization access, and modeling resources.
- Constraints: safety, environmental, compatibility, scalability, and institutional review boundaries.
- Output goal: research question list, hypothesis ranking, experimental design, analysis plan, or iteration strategy.

# Core Workflow

1. **Bottleneck Framing**
   - Define the limiting interfacial failure from observables (e.g., nonuniform deposition, parasitic chemistry, transport blockage, mechanical degradation).
   - Map the failure to system-level symptoms and distinguish primary from secondary effects.
   - *Decision gate*: Stop if the failure mode is not observable or cannot be tied to a specific interface process.

2. **Hypothesis Generation**
   - Generate a failure-mode hypothesis (what is failing), a mechanistic hypothesis (how the intervention changes the interface), and a device-level hypothesis (how the change should appear in cell metrics).
   - Annotate each hypothesis with: evidence strength, key assumptions, predicted observables, likely failure modes, and a minimum falsification test.
   - Rank hypotheses by mechanistic clarity, feasibility of controls, and ability to discriminate alternatives.
   - *Decision gate (Candidate Gate)*: Advance only hypotheses that are falsifiable and distinguishable with available diagnostics.

3. **Layered Validation Design**
   - Define minimal viable validation: baseline system, candidate system, one mechanistic metric, one performance metric, and predefined stop conditions.
   - Add strong controls: negative control (lacks target function), positive control (known benchmark), mechanism-separating control (isolates one variable), and system control (detects failure migration).
   - Specify independent, dependent, and controlled variables conceptually; avoid operational recipes or material-specific parameters.
   - *Decision gate (Control Gate)*: Stop if controls cannot isolate the proposed mechanism from confounders such as geometry, loading, or impurities.

4. **Tiered Evidence Collection**
   - Tier 1 — Mechanistic screening: Determine whether the candidate changes the target failure signature under controlled conditions.
   - Tier 2 — Interface/medium validation: Assess functional stability, transport behavior, and interfacial kinetics.
   - Tier 3 — System validation: Test whether gains persist in a realistic cell configuration without shifting degradation to other components.
   - *Decision gate (Stability Gate)*: Pause if baseline or control behavior is unstable, if new degradation modes appear, or if reproducibility collapses across independent samples.

5. **Convergent Analysis and Mechanism Discrimination**
   - Normalize all comparisons against matched baselines and consistent data-processing rules.
   - Separate performance gains from mechanistic proof; improved capacity or lifetime alone does not validate an interfacial mechanism.
   - Triangulate across electrochemical, morphological, chemical-state, and transport evidence.
   - Apply an interpretation matrix:
     - Mechanism changed + function improved → mechanism supported; advance to stronger controls.
     - Mechanism changed + function unchanged → descriptor insufficient; add complementary metrics.
     - Mechanism unchanged + function improved → original mechanism not validated; search alternatives.
     - Mechanism changed + function worsened → hidden failure mode; redesign around limiting variable.
     - Inconsistent results → confounded or irreproducible; pause and improve controls.
   - *Decision gate (Mechanism Exclusion)*: Reject hypotheses contradicted by orthogonal characterization or negative controls.

6. **Claim Bounding and Robustness Check**
   - Label every claim as observed, inferred, or speculative.
   - State boundary conditions explicitly (substrate, geometry, electrolyte, operating window).
   - Check for tradeoffs, failure migration, and cell-to-cell variability.
   - *Decision gate (Robustness Gate)*: Downgrade or discard claims that rely on single observables, unmatched comparisons, or untested extrapolation.

7. **Iteration Decision**
   - **Advance** if convergent evidence supports the mechanism; proceed to broader candidates or device-level validation.
   - **Modify** if a promising mechanism is limited by a secondary variable (e.g., transport, compatibility).
   - **Pause** if results are inconsistent, confounded, or irreproducible.
   - **Stop** if the hypothesis is falsified, if degradation shifts to another critical component, or if safety/compatibility boundaries are breached.
   - Before continuing, update the mechanism map and define the next minimum falsification test.
   - *Decision gate (Iteration Gate)*: Do not escalate to optimization until the dominant mechanism and failure mode are clear.

# Output Format

Produce a structured research package:

1. **Target research question** — Scoped to a specific interfacial bottleneck and system.
2. **Mechanism map** — Normal operation, failure mode, and contributions (thermodynamic, kinetic, interfacial, transport).
3. **Ranked hypotheses table** — Claim, evidence strength, key assumptions, predicted observables, likely failure modes, and minimum falsification test.
4. **Experimental design schema** — Baseline, candidate, controls, primary and mechanistic metrics, and stop conditions.
5. **Analysis plan** — Normalization rules, triangulation strategy, interpretation matrix, and evidence-strength scoring.
6. **Iteration plan** — Advance/modify/pause/stop rules and the next diagnostic experiment.
7. **Validity and boundary statement** — Confounders, reproducibility requirements, external-validity limits, and separation of paper-supported patterns from new inferences.

# Validation Gates

- **Candidate Gate**: Hypotheses must name a causal mechanism, predict a specific observable, and be falsifiable by a defined control.
- **Control Gate**: The experimental design must include baseline, negative, positive, and mechanism-separating controls before any claim is tested.
- **Stability Gate**: Baseline and control systems must show stable, interpretable behavior; stop if artifacts or uncontrolled degradation dominate.
- **Mechanism Exclusion Gate**: A mechanism is excluded if orthogonal evidence contradicts it or if the negative control matches the candidate.
- **Robustness Gate**: Claims must survive matched comparison, reproducibility checks, and explicit boundary-condition tests.

# Claim Boundaries

- Distinguish paper-supported observations from transferable method patterns and from new agent inferences.
- Limit device-level and practical claims to the tested system and operating context.
- Do not present single-study or single-system findings as field-wide consensus.
- Label evidence strength for every claim: exploratory (single metric), plausible (partial convergence), strong (multi-modal evidence with controls).
- Avoid application-readiness or commercialization claims unless independent validation, safety review, and compliance evidence are explicitly addressed.

# Failure Modes

- Hypothesis lacks mechanistic specificity or cannot be falsified.
- Controls are insufficient to isolate the target mechanism from geometry, loading, or processing differences.
- Performance improvement arises from confounders rather than the proposed interface mechanism.
- Mechanism-specific evidence is absent despite performance gains (hidden variable).
- Degradation migrates to another electrode or component (failure migration).
- Interfacial evidence is ambiguous due to sample handling, interpretation bias, or incomplete coverage.
- Results are irreproducible across independent preparations or operational histories.

# Validity Checks

Before finalizing a plan or interpretation, confirm:

- The research question targets a specific, observable interfacial bottleneck.
- Hypotheses separate paper-supported logic from new-system inference.
- Controls are matched for electrode architecture, electrolyte volume, separator, testing protocol, and data processing.
- Both electrodes are considered after full-cell testing.
- Confounders such as viscosity, conductivity, mass transport, pH-related chemistry, and cell geometry are addressed.
- Cell-to-cell variability and independent replicates are required for strong claims.
- Source-specific numerical values and operational parameters are excluded from reusable reasoning.
- Safety, ethics, and compliance boundaries are stated without providing hazardous procedural details.
- Limitations and external-validity boundaries are explicitly documented.

# Provenance

- Synthesized from cluster 23, subcluster 23.1 (observable-driven mechanism discovery and validation).
- Derived from source skills: aqueous-zinc-interface-additive-research (`f6e2b506e015ff15`), aqueous-ion-storage-electrode-exploration (`28d836511e6d367f`), cold-resilient-aqueous-electrolyte-design (`0e7a58f9162f74b0`), molten-electrochemical-architecture-exploration (`dbad43cadf00f294`), graded-interface-research-exploration (`acc5b3932485e1e2`), aqueous-metal-anode-interface-exploration (`1e55ace97eed7457`), solvation-interphase-anode-research-design (`c03aa63fadf47bee`), porous-carbon-ion-storage-workflow (`e3b414fff16c76d9`).
