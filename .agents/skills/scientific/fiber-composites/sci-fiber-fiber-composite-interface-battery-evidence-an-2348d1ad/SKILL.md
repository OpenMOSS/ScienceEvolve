---
name: sci-fiber-fiber-composite-interface-battery-evidence-an-2348d1ad
description: End-to-end evidence analysis and claim audit workflow for fiber-composite, battery, and interfacial materials research, from bottleneck definition through falsifiable hypothesis generation to multi-signal validation and bounded mechanistic claims.
scienceevolve-title: "Fiber composites and battery materials · fiber composite interface battery evidence analysis workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Help agent translate performance bottlenecks and structural observations in fiber-reinforced composites, battery electrodes/electrolytes, and interfacial material systems into a reusable, end-to-end research workflow. The goal is to generate falsifiable hypotheses, design minimally sufficient validation with strong controls, map multi-scale evidence to mechanism claims, and bound conclusions so that source-specific findings are not over-generalized.

# When to use

- User needs to propose new research questions or mechanistic hypotheses for systems where interface, transport, and structure are coupled (e.g., fiber-matrix interfaces, electrode-electrolyte interfaces, solid-state boundaries).
- User has spatial, spectroscopic, electrochemical, mechanical, or transport data and needs to discriminate among competing mechanisms.
- User wants to audit whether a performance improvement truly supports a proposed mechanism, or whether alternative explanations have been excluded.
- User needs an iterative validation plan with explicit stop conditions and claim boundaries.

# Inputs required

- Target system and functional roles: matrix, fiber, active material, conductive network, electrolyte, interface modifier, etc.
- Observed bottleneck or phenomenon: degradation mode, rate limitation, anisotropy, impedance growth, delamination, phase transformation, etc.
- Available evidence types: imaging, spectroscopy, diffraction, electrochemical response, mechanical testing, transport measurements, simulation outputs.
- Constraints: safety boundaries, non-operational design limits, statistical rigor, reproducibility requirements, and applicable regulatory scope.
- Prior models or literature analogies, annotated as verified vs. inferred.

# Core Workflow

1. **Bottleneck Decomposition & Mechanism Scoping**
   - Decompose the system-level bottleneck into candidate mechanisms across transport, interface, structure, and mechanical domains.
   - Map each candidate to a falsifiable mechanism chain: structure/state → local behavior → macroscopic observation.
   - **Decision gate:** If the bottleneck cannot be linked to at least two distinct, observable mechanism variables, pause and request more specific data or clarify system boundaries.

2. **Hypothesis Generation with Evidence Grading**
   - For each candidate mechanism, generate a hypothesis stating the intervention, expected change in mechanism variables, and predicted observable signals.
   - Grade evidence strength: strong (multi-system replication), medium (adjacent system or partial evidence), weak (analogy/theory only).
   - Explicitly list key assumptions, alternative explanations, and failure modes for each hypothesis.
   - **Decision gate:** If no hypothesis can produce a testable prediction, return to Step 1 and refine the bottleneck decomposition.

3. **Minimal Viable Validation Design**
   - Design the smallest experiment or analysis that can discriminate the leading hypothesis from its nearest alternative.
   - Define independent variables (mechanism-relevant design levers), control variables (batch, geometry, processing history), and dependent variables (mechanism proxies + performance endpoints).
   - Establish a control matrix: baseline, negative control (absence of key functional element), positive control (known benchmark), and mechanism-decoupling controls (isolating transport vs. interface vs. structural effects).
   - **Stop condition:** If the minimal validation cannot be executed within safety/compliance boundaries or would require simultaneous change of multiple confounding variables, redesign the perturbation.

4. **Multi-Signal Data Acquisition & Alignment**
   - Collect at least two orthogonal evidence streams (e.g., spatial + temporal, electrochemical + spectroscopic, mechanical + morphological).
   - Align data in time, space, or state-of-charge/discharge to ensure mechanism signals are compared under equivalent conditions.
   - **Decision gate:** If orthogonal signals conflict, halt mechanism interpretation and design a de-confounding experiment before proceeding.

5. **Mechanism-Performance Mapping & Claim Bounding**
   - Map performance changes onto mechanism variables using the pre-defined causal chain.
   - Distinguish correlation from causation: performance improvement alone does not validate a mechanism; require consistent mechanism proxies.
   - Bound claims: state whether the conclusion is verified, supported, speculative, or contradicted by the current evidence.
   - **Decision gate:** If mechanism proxies are absent or inconsistent, downgrade the claim and flag the need for additional characterization.

6. **Robustness Check & Alternative Explanation Audit**
   - Systematically test confounding factors: batch variation, geometry, contact quality, processing history, measurement artifacts, and unintended side reactions.
   - Audit whether the result could be explained by a non-target mechanism (e.g., conductivity improvement masking interface failure).
   - **Stop condition:** If confounds cannot be excluded with existing data, stop short of strong mechanistic claims and prescribe targeted controls.

7. **Iteration or Redesign**
   - If hypothesis is supported: retain, tighten boundaries, and design the next perturbation to test transferability (e.g., higher loading, different chemistry, extended cycling).
   - If hypothesis is partially supported: split the mechanism chain, identify the dominant sub-bottleneck, and generate sub-hypotheses.
   - If hypothesis is unsupported or contradicted: document failure mode, generate alternative hypotheses, and return to Step 2.
   - **Stop condition:** Terminate the loop when (a) safety/compliance risks emerge, (b) reproducibility is insufficient, (c) evidence converges on a bounded mechanism with no viable alternatives, or (d) cost/benefit of further iteration is unjustified.

# Output Format

Agent must produce a structured report containing:

1. **Research question and system boundary definition.**
2. **Candidate hypothesis table:** hypothesis statement, mechanism variables, evidence strength, key assumptions, falsifiable predictions, failure modes.
3. **Validation plan:** minimal viable experiment, control matrix, variable definitions, evaluation metrics, and stop conditions.
4. **Evidence alignment map:** how multi-signal data will be cross-referenced.
5. **Mechanism claim with explicit bounding:** verified / supported / speculative / contradicted, plus boundary conditions.
6. **Iteration roadmap:** next steps for support, partial support, or refutation scenarios.
7. **Validity and safety summary:** confounds checked, reproducibility requirements, non-operational safety boundaries, and provenance references.

# Validation Gates

- **Bottleneck clarity gate:** Bottleneck must be decomposable into observable mechanism variables.
- **Testability gate:** Every hypothesis must yield at least one falsifiable prediction with defined failure criteria.
- **Control adequacy gate:** Validation plan must include baseline, negative, positive, and mechanism-decoupling controls.
- **Orthogonality gate:** Mechanism claims require at least two independent evidence streams that are mutually consistent.
- **Confound audit gate:** Major confounds (batch, geometry, processing, measurement artifact) must be addressed before strong claims.
- **Reproducibility gate:** Key conclusions require independent replication or batch-level statistics; single-sample claims must be flagged as provisional.

# Claim Boundaries

- Distinguish "verified" (direct evidence + strong controls), "supported" (consistent but incomplete evidence), "speculative" (analogy-based or single-source), and "contradicted" (evidence against).
- Never present source-specific material parameters, numerical results, or single-paper conclusions as domain consensus.
- Limit mechanistic claims to the tested material class, loading/scale range, and operational window.
- Flag extrapolation risks when moving from model systems to device-relevant conditions (e.g., half-cell to full-cell, low-load to high-load, single-crystal to composite).

# Failure Modes

- **Over-interpretation:** Conflating performance improvement with mechanism validation without mechanism-proxy evidence.
- **Confound collision:** Attributing effects to the target variable when batch, geometry, or processing differences explain the result.
- **Single-signal fallacy:** Drawing mechanism conclusions from one characterization technique without orthogonal confirmation.
- **Boundary violation:** Extrapolating conclusions beyond the tested chemistry, scale, or operating conditions.
- **Iteration stall:** Continuing to optimize performance while ignoring contradictory mechanism signals or safety/compliance limits.
- **Hypothesis fixation:** Failing to generate alternatives when the primary hypothesis is weakened by controls.

# Validity Checks

- **Mechanism specificity:** Does the evidence uniquely support the proposed mechanism, or do alternatives remain viable?
- **Statistical rigor:** Are sample sizes, error propagation, and outlier handling documented and matched to claim strength?
- **Measurement validity:** Are instrument calibration, linearity, resolution, and artifact rejection confirmed for critical data?
- **Material consistency:** Are source, batch, pretreatment, and environmental history controlled or recorded?
- **Scale translatability:** Are conclusions from model or simplified systems explicitly annotated before application to full devices or composites?
- **Safety and ethics:** Are all proposed activities framed as non-operational research design with institutional safety review boundaries preserved?

# Provenance

- Synthesized from cluster 13.0 (fiber-composite-interface-battery-evidence-analysis-workflow).
- Derived from source skills: anisotropic-phase-transform-research (10.1016/j.commatsci.2010.10.024), li-ion-battery-electrode-design-workflow (10.1016/j.ensm.2020.06.003), am-semicrystalline-interface-exploration (fiber__10.1016/j.compscitech.2018.09.010), lithium-sulfur-battery-research-workflow (10.1039/c4ta04727c), lean-electrolyte-ls-battery-research (10.1021/jacs.4c05000), sulfide-solid-battery-interface-exploration (10.1021/accountsmr.1c00137), layered-cathode-surface-interface-exploration (fiber__10.1002/adfm.202506727), carbon-nitride-photocatalyst-design (10.1038/ncomms12165).
- Source-specific materials, parameters, and conclusions have been excluded; only the shared workflow structure and decision logic are retained.
