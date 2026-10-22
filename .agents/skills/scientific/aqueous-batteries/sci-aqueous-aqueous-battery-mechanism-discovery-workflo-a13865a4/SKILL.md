---
name: sci-aqueous-aqueous-battery-mechanism-discovery-workflo-a13865a4
description: A reusable end-to-end workflow for proposing, validating, and iterating mechanism-driven hypotheses in aqueous battery research through staged controls and converging evidence.
scienceevolve-title: "Aqueous battery interfaces · aqueous battery mechanism discovery workflow 3"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Guide agents to translate aqueous battery performance limitations into testable mechanistic hypotheses, design staged validation studies with rigorous controls, and iterate based on converging structural, interfacial, and electrochemical evidence. The workflow treats mechanism discovery as an evidence chain rather than a materials recipe.

# When to use

Use this skill when:
- Designing research around electrolyte solvation, ion transport, electrode interfaces, or host-structure stability in aqueous batteries.
- Translating a structural or interfacial hypothesis into testable predictions across multiple length scales.
- Diagnosing parasitic reactions, degradation pathways, or failure modes in aqueous electrochemical systems.
- Evaluating whether a performance improvement is causally linked to a proposed mechanism.
- Building a staged validation plan that links molecular or atomic-scale behavior to device-level metrics.

Do not use this skill for operational laboratory protocols, safety review, or direct cell assembly instructions.

# Inputs required

Before generating a research plan, request or identify:
- Target battery chemistry and electrode roles (anode, cathode, electrolyte, interface).
- Dominant failure mode or performance bottleneck (e.g., dendrite growth, dissolution, side reactions, kinetic limitation).
- Candidate design lever and the intended local change (e.g., solvation structure, host architecture, interface modifier).
- Available structural, spectroscopic, and electrochemical diagnostics.
- Baseline and comparator systems that isolate the proposed variable.
- Constraints: safety boundaries, environmental considerations, material availability, cell-format limits, and validation budget.

# Core Workflow

1. **Bottleneck Decomposition**
   - Frame the practical limitation as a local chemical or physical process (e.g., interfacial side reaction, ion transport limitation, structural degradation).
   - Rank candidate mechanisms by likely impact on reversibility and device metrics.
   - **Decision Gate:** If the bottleneck cannot be expressed as a falsifiable local process, stop and refine the research question.

2. **Mechanism Hypothesis Formulation**
   - State a causal chain: design lever → local environment change → interface or bulk behavior shift → observable diagnostic signal and device metric.
   - List alternative explanations and falsifying observations.
   - Assign evidence strength (e.g., literature plausibility, structural support, interface diagnostic, full-cell control, multi-diagnostic convergence).
   - **Decision Gate:** If the hypothesis lacks a discriminating prediction that distinguishes it from alternatives, return to Step 1.

3. **Control-Rich Experimental Design**
   - Define the candidate, baseline, negative controls (inactive analogues, missing-component variants), positive controls (relevant benchmarks), and strong controls (matched ionic strength, morphology-only variants).
   - Predefine primary metrics (performance), mechanism metrics (structural/interfacial), and failure criteria before data collection.
   - **Decision Gate:** If the control matrix cannot isolate the proposed design lever from confounders (loading, conductivity additive, processing history), redesign before execution.

4. **Staged Validation Execution**
   - **Stage A – Structure/Composition:** Verify phase identity, coordination environment, morphology, and purity.
   - **Stage B – Interface/Half-cell:** Test interfacial stability, deposition behavior, side-reaction suppression, and kinetic response against baseline and controls.
   - **Stage C – Device/Full-cell:** Validate that interface improvements translate to retention, efficiency, and rate behavior under realistic pairing and operating windows.
   - **Stage D – Stress/Boundary:** Challenge the mechanism with at least one high-rate, extended-cycling, alternative-electrode, or mechanically stressed condition.
   - **Stop Condition:** Abort if (i) structural evidence contradicts the hypothesis, (ii) controls replicate the improvement, (iii) a linked degradation mode worsens, or (iv) reproducibility is poor.

5. **Evidence Integration & Mechanism Analysis**
   - Construct a causal evidence matrix linking each mechanism step to independent observations and control outcomes.
   - Require convergence of at least two diagnostic categories (e.g., spectroscopy + electrochemistry, or microscopy + impedance) before accepting a mechanism claim.
   - Separate true performance gains from artifacts of normalization, single-cell outliers, or post-mortem changes.
   - **Decision Gate:** If mechanism metrics and performance metrics conflict, label the result inconclusive and do not promote the hypothesis.

6. **Hypothesis Update & Iteration**
   - **Promote** when structural, interface, and device evidence align under strong controls; proceed to boundary testing.
   - **Revise** when one evidence layer fails (e.g., structural support is strong but one electrode interface degrades); identify transport, compatibility, or competing reaction bottlenecks.
   - **Split** when anode and cathode improvements arise from distinct mechanisms.
   - **Reject** when structural signals are absent, side reactions persist despite structural evidence, or full-cell gains are explained by a comparator.
   - **Narrow** when success depends on a specific material pair, narrow voltage window, or cell format.
   - **Iteration Rule:** Return to Step 2 with updated assumptions. Do not expand scope to new chemistries or formats without targeted validation.

7. **Boundary Definition & Transferability Assessment**
   - Define explicit boundary conditions: chemistry family, electrode pairing, temperature, rate, voltage window, and cell format.
   - Generalize only after testing at least one alternative electrode or stress condition that probes the mechanism.
   - **Stop Condition:** Halt extrapolation to commercial readiness, universal performance, or field consensus until independent replication and lifecycle assessment are available.

# Output Format

When using this skill, produce:
1. **Research Question:** Concise bottleneck-focused question.
2. **Mechanistic Hypothesis:** Causal chain, evidence strength, key assumptions, alternative explanations, and falsifying observations.
3. **Experimental Design Schema:** Variables, baseline, controls, metrics, and stop conditions.
4. **Causal Evidence Matrix:** Agreement/disagreement across structure, interface, and device layers.
5. **Analysis Plan:** Uncertainty quantification, statistical checks, confounder handling, and visualization strategy.
6. **Iteration Log:** Updated hypothesis, next minimum viable test, and promote/revise/reject decision.
7. **Validity & Boundary Statement:** Reproducibility requirements, extrapolation limits, and safety/ethics constraints.

# Validation Gates

- Controls must isolate the design lever from morphology, loading, conductivity additives, and processing artifacts.
- Mechanism claims require converging evidence from at least two independent diagnostic categories.
- Full-cell claims must be consistent with half-cell/interface observations under matched conditions.
- Reproducibility must be demonstrated across independent preparations or cells before strong claims.
- Stress-test results must meet predefined thresholds to claim practical relevance.

# Claim Boundaries

- Distinguish validated reusable patterns from system-specific evidence and agent-generated inferences.
- Do not treat single chemistry-electrode-format combinations as domain-wide consensus.
- Separate material-level success from device-level success; interface and mechanical durability require independent validation.
- Mark claims about scale-up, commercial readiness, or universal safety as unproven unless directly tested.

# Failure Modes

- **False Mechanism:** Improvement arises from confounders (impurities, pH drift, viscosity, uncontrolled side reactions) rather than the proposed lever.
- **Incomplete Validation:** Structural evidence exists but interface or device evidence is missing or contradictory.
- **Narrow Applicability:** Gains disappear under alternative electrodes, higher rates, extended cycling, or mechanical stress.
- **Control Failure:** Baseline or comparator was mismatched, preventing causal attribution.
- **Reproducibility Collapse:** Results vary across replicates beyond measurement noise.
- **Scope Creep:** Hypothesis is generalized to new chemistries or formats without targeted validation.

# Validity Checks

- **Confounders:** Audit salt concentration, pH, impurity content, viscosity, conductivity, water activity, electrode loading, cell geometry, temperature, and assembly pressure.
- **Controls:** Include conventional baseline, component-ablation, inactive analogue, and electrode-only controls.
- **Reproducibility:** Require repeated measurements or independent replicates for key metrics.
- **Statistical Validity:** Report uncertainty, replicate count, outlier handling, and signal-to-noise assessment.
- **Mechanistic Consistency:** Ensure structural, kinetic, interfacial, and device evidence converge on the same causal chain.
- **Boundary Conditions:** Explicitly state valid chemistry, format, and operating ranges.
- **Data Integrity:** Preserve raw spectra, voltage curves, images, and fitting records; distinguish measured from inferred quantities.

# Provenance

- Synthesized from cluster 48, subcluster 48.1 ("observable-driven mechanism discovery and validation").
- Source skills: solvation-structure-electrolyte-research, aqueous-zinc-cathode-host-interface-co-design, manganese-zib-research-workflow, carbon-dot-battery-research-design, entropy-coordination-aqueous-battery-cathode-research, aqueous-zn-anode-interface-design, zinc-anode-interface-exploration, aqueous-zinc-cathode-exploration.
- Source-specific materials, numerical results, and operational parameters have been abstracted to preserve reusability.
