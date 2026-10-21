---
name: sci-aqueous-electrolyte-battery-interfacial-mechanism-d-24661e64
description: A reusable end-to-end workflow for generating, discriminating, and validating interfacial mechanistic hypotheses in electrolyte-based electrochemical storage systems.
scienceevolve-title: "Aqueous battery interfaces · electrolyte battery interfacial mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Guide an agent to convert observed interfacial instability into a structured, testable research program. The workflow moves from symptom framing through competing hypothesis generation, mechanism-filtering experimental design, cross-scale evidence integration, and gated iteration until a mechanistic claim is supported, revised, or rejected.

# When to use

Use this skill when the user needs to:

- Propose new hypotheses about interfacial regulation, deposition uniformity, or side-reaction suppression in electrolyte-based electrochemical cells.
- Design a mechanism-first validation plan for an electrode-electrolyte interface.
- Translate a reported interfacial mechanism into a reusable workflow for a new chemistry or cell architecture.
- Critique whether a performance improvement is supported by molecular, interfacial, kinetic, and device-level evidence.
- Plan iteration after mixed, contradictory, or incomplete evidence.

Do not use this skill for direct laboratory execution, cell manufacturing advice, commercial device modification, or operational safety procedures.

# Inputs required

Before producing a research plan, request or infer:

- Target chemistry, electrode class, electrolyte family, and dominant failure mode or symptom.
- Candidate modifier or interfacial strategy, if already specified.
- Baseline system and available comparator controls.
- Measurement capabilities: structural/solvation, interfacial, morphological, kinetic, and device-level.
- Constraints: material compatibility, stability, safety, environmental, and regulatory boundaries.
- Intended output: hypothesis map, experimental schema, analysis plan, iteration strategy, or critique of an existing plan.

If key inputs are missing, state assumptions explicitly and label all conclusions as provisional.

# Core Workflow

1. **Frame the Instability**
   - Start from the observed failure symptom rather than a preferred material or additive.
   - Diagnose whether the bottleneck is interfacial or bulk-transport dominated.

2. **Generate Competing Hypotheses**
   - Produce at least three falsifiable hypotheses plus an artifact/confounder null.
   - For each: state the mechanistic claim, predicted cross-scale signatures, evidence strength, key assumptions, likely failure modes, and the minimal test that would falsify it.

3. **Build the Mechanism Map**
   - Lay out the proposed causal chain from molecular interaction to device-level outcome.
   - Annotate each link as proposed; update after each evidence block.

4. **Design the Mechanism-Filtering Experiment**
   - Structure variables and controls to discriminate mechanisms, not to screen performance broadly.
   - Required arms: baseline; candidate variant; structural negative control lacking the proposed motif; inert/process control; surface-history control; practical-cell integration control.
   - Stage the validation:
     - Stage A: Confirm the local environment or interfacial state is altered.
     - Stage B: Confirm the intervention reaches or modifies the active interface.
     - Stage C: Test targeted failure-mode suppression in a simplified cell.
     - Stage D: Test reversibility and kinetic stability under repeated operation.
     - Stage E: Test persistence in an integrated/practical cell.

5. **Gate 1 — Candidate Gate**
   - After Stage A–B: Does structural and interfacial evidence support the proposed mechanism?
   - **NO**: Reject or redesign the candidate; return to Step 2.
   - **YES**: Proceed to Stage C–D.

6. **Gate 2 — Stability Gate**
   - After Stage C–D: Does the mechanism survive cycling without unacceptable kinetic penalties or new degradation modes?
   - **NO**: Diagnose transport blockage, interphase instability, or side reactions; iterate on descriptor or candidate.
   - **YES**: Proceed to Stage E.

7. **Gate 3 — Integration Gate**
   - After Stage E: Do simplified-cell gains persist under practical constraints?
   - **NO**: Identify system-level bottlenecks such as counter-electrode, separator, mass transport, or mechanical constraints; re-scope claim boundaries.
   - **YES**: Advance to robustness checks and claim formulation.

8. **Execute Cross-Scale Analysis**
   - Evaluate evidence sequentially: molecular/solvation → interfacial → morphological → kinetic → device.
   - Update the mechanism map: label each link supported, weakened, contradicted, or unresolved.
   - If evidence conflicts, do not force a single narrative; flag the conflict as an iteration trigger.

9. **Iterate**
   - Rank hypotheses by relevance and evidence strength.
   - Identify the weakest causal link.
   - Design the smallest additional control or analogue to falsify that link.
   - Separate bulk-solution effects from interface-specific effects before escalating complexity.
   - Update the hypothesis table and evidence strength after each loop.

10. **Stop or Exit**
    - Terminate the branch if: negative analogues perform similarly; interfacial evidence contradicts the proposed pathway; performance improves while the mechanism worsens; kinetic penalties offset benefits; practical-cell behavior is dominated by an unrelated failure mode; results are irreproducible across independent preparations; or safety and compliance constraints prevent meaningful validation.

# Output Format

When using this skill, produce:

1. **Research question and target system**: concise statement of the problem and scope.
2. **Dominant failure mode**: the instability the plan is designed to address.
3. **Candidate hypotheses**: at least three hypotheses, each with evidence strength, key assumptions, predicted signatures, and failure modes.
4. **Mechanism map**: causal chain from molecular interaction to device-level outcome, annotated with link status.
5. **Experimental design schema**: variables, controls, minimal viable validation stages, metrics, and stop conditions.
6. **Analysis plan**: cross-scale evidence integration, decision rules, and conflict resolution.
7. **Iteration plan**: rules for updating, replacing, or stopping each hypothesis.
8. **Validity and safety checks**: confounders, reproducibility, boundary conditions, and non-operational safety constraints.

# Validation Gates

- **Specificity Gate**: Does a negative analogue test whether the proposed molecular motif matters?
- **Reproducibility Gate**: Are matched baselines, replicate variability, and failure distributions reported?
- **Confounding Gate**: Are speciation shifts, impurities, decomposition, surface roughness, and assembly variation considered?
- **Mechanism Consistency Gate**: Do molecular, interfacial, kinetic, and device-level results support the same causal chain?
- **Boundary Gate**: Are claims limited to the tested chemistry and not generalized beyond the evidence?
- **Statistical Gate**: Are metrics calculated over comparable windows, and are outliers investigated rather than hidden?
- **Extrapolation Gate**: Are simplified-cell conclusions kept separate from practical-cell viability claims?

# Claim Boundaries

- Treat single-source observations as methodological examples, not field consensus.
- Distinguish source-supported logic from analogical extension and new agent inference.
- Limit mechanism claims to the tested electrode, electrolyte, and cell architecture.
- Do not present performance-only improvements as mechanistic proof.
- Keep simplified-cell or model-interface claims distinct from practical-cell claims until integration-gate evidence is obtained.

# Failure Modes

- **Descriptor Failure**: The intended interfacial property cannot be reproducibly controlled or verified.
- **Mechanism Failure**: The predicted microscopic signature is absent despite a performance change.
- **Trade-off Failure**: Stability improves but transport, impedance, or safety-relevant behavior degrades.
- **Translation Failure**: Component-level gains disappear in practical cells due to system-level bottlenecks.
- **Confounding Failure**: An uncontrolled variable explains the observed trend.
- **Iteration Failure**: Evidence remains contradictory after repeated minimal tests, indicating the hypothesis set is incomplete.

# Validity Checks

Before presenting a plan, verify:

- The research question is tied to a specific bottleneck, not a generic performance target.
- Hypotheses are falsifiable and include at least one artifact or confounder null.
- Controls isolate the proposed mechanism from generic additive effects.
- The experimental sequence measures mechanism before optimizing performance.
- Cross-scale evidence is required for high-confidence claims.
- Stop conditions and failure criteria are predefined.
- Safety and environmental constraints are framed as non-operational research boundaries.

# Provenance

- Derived from cluster 3.0 (observable-driven mechanism discovery and validation).
- Synthesized from source skills: interfacial-solvation-battery-additive-research (25d5e3c6da5ce2e1), aqueous-zn-interface-research (9c38a9acf4ab981e), zinc-anode-interphase-exploration (cb24520b35d2a565), polymer-electrolyte-dual-domain-research (5167d89e9d46f1dd), polymer-electrolyte-edlc-research (58c8f521db3bb416), metal-anode-interface-exploration-skill (6fd46af449b9e1a7), quasi-solid-zinc-electrolyte-transport-exploration (05ec2522b4c6016a), aqueous-metal-battery-side-reaction-discovery (d9d69ff78333ae45).
- Source-specific systems, numerical thresholds, and operational protocols have been removed to produce a transferable workflow.
