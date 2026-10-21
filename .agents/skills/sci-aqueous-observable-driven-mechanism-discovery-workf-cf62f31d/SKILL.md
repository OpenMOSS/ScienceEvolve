---
name: sci-aqueous-observable-driven-mechanism-discovery-workf-cf62f31d
description: Reusable end-to-end workflow for discovering and validating component-level mechanisms from system-level failure modes in electrochemical energy research.
scienceevolve-title: "Aqueous battery interfaces · observable driven mechanism discovery workflow 8"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Transform system-level performance gaps or failure symptoms into falsifiable component- or interface-level mechanism hypotheses, then validate them through staged experiments with strong controls, independent multi-modal evidence, and iterative refinement. This workflow treats single-study observations as inspiration rather than consensus and keeps all recommendations at the research-design level.

# When to use

Use this skill when the user asks to:
- Diagnose a system-level failure mode, degradation symptom, or performance bottleneck in an electrochemical energy device.
- Propose mechanism-first research questions rather than material-screening lists.
- Design validation plans for interfacial, electrolyte, electrode, or architectural hypotheses.
- Evaluate whether a candidate intervention plausibly improves stability, reversibility, transport, or compatibility.
- Iterate on a hypothesis after initial evidence is collected.

Do not use this skill for clinical decision-making, operational laboratory protocols, hazardous procedure instructions, or general literature review without a specific mechanism question.

# Inputs required

Before generating a plan, collect or infer:
- **System scope:** device type, component of interest, and intended application boundary.
- **Observable symptoms:** specific performance loss, degradation signature, or failure pattern.
- **Suspected location:** component or interface where the failure likely initiates.
- **Candidate interventions:** conceptual design changes, not operational recipes.
- **Available evidence:** prior data, literature context, characterization access, or computational resources.
- **Constraints:** safety boundaries, material availability, regulatory limits, and metrics that must not be sacrificed.

If key inputs are missing, state assumptions explicitly and mark resulting hypotheses as lower confidence.

# Core Workflow

Execute the following ordered route. Treat each numbered step as a gate; do not proceed to the next until the current gate is satisfied or explicitly bypassed with documented risk.

## 1. Failure mode mapping
Decompose observable system symptoms into candidate component-level failure modes (e.g., interfacial instability, uneven deposition, transport blockage, side reactions, mechanical degradation). Separate root causes from secondary symptoms.
- **Decision gate:** Is the failure mode specific, observable, and linked to a physical location? If not, stop and gather more diagnostics.
- **Stop condition:** Symptoms remain ambiguous after decomposition; require additional baseline data.

## 2. Mechanism hypothesis generation
For each candidate failure mode, generate mechanism-first hypotheses that specify:
- The local mechanistic variable the intervention is expected to change.
- The causal chain from design change to intermediate effect to system outcome.
- Evidence strength (high / moderate / low / speculative).
- Key assumptions and likely failure modes of the hypothesis itself.
- Transfer boundary: what is inferred from prior work versus what is unverified in the new system.
- **Decision gate:** Are hypotheses falsifiable with minimal viable experiments and available controls? If not, reformulate.
- **Iteration trigger:** If multiple failure modes compete, design a discriminating experiment before full validation.

## 3. Validation ladder design
Structure validation as a staged ladder:
- **Minimum viable validation:** smallest experiment that can falsify the central mechanism.
- **Strong-control validation:** expanded experiment that rules out confounding by geometry, mass loading, bulk properties, or unrelated material effects.
- **System-level check:** test whether gains persist under realistic integration constraints.
Define explicit controls for every stage:
- Baseline (no intervention).
- Negative / weak-control (removes proposed function).
- Material / architecture control (isolates the intended mechanism from generic physical effects).
- Positive / benchmark control (established reference, if available).
- **Decision gate:** Can the proposed mechanism be isolated from bulk and confounding effects? If not, redesign controls.
- **Stop condition:** Safety, ethics, or environmental flags remain unresolved; or the experiment cannot isolate the mechanism.

## 4. Multi-modal evidence collection
Gather independent evidence across at least two categories, such as:
- Electrochemical kinetics and transport.
- Surface or interfacial chemistry and composition.
- Morphology and structural evolution.
- Device-level performance and stability.
- Degradation or compatibility indicators.
- **Decision gate:** Are data quality, replicate structure, and measurement independence sufficient? If not, pause and improve diagnostics.

## 5. Mechanism–performance integration
Link intermediate mechanism evidence to system-level outcomes:
- Confirm that the intervention produced the predicted local change.
- Verify that the local change aligns with the observed performance shift.
- Check that combined designs outperform single-function or partial controls.
- Separate interfacial effects from bulk effects.
- **Decision gate:** Do independent evidence streams converge? If divergent, diagnose confounding variables or secondary bottlenecks before claiming mechanism confirmation.
- **Iteration trigger:** If performance improves without mechanism evidence, treat the mechanism as uncertain and add targeted diagnostics. If mechanism evidence appears without performance improvement, identify secondary bottlenecks or mismatched degradation modes.

## 6. Iteration or stop
Based on integrated evidence, classify the result and decide:
- **Strengthen:** Evidence converges; add boundary tests and robustness checks.
- **Revise:** Partial support; refine the intervention or diagnostics.
- **Pivot:** Unsupported or contradicted by controls; return to failure mode mapping with updated assumptions.
- **Stop:** Predefined stop conditions met (controls fail, safety flags, unresolved confounding, or gains vanish under realistic conditions).
Maintain a hypothesis ledger: original prediction, observed evidence, revised mechanism, next decisive test, and confidence change.

# Output Format

Return results in this structure:

1. **Research target:** one-sentence statement of the question or design challenge.
2. **Failure-mode map:** dominant symptoms, suspected root causes, and evidence needed to confirm each.
3. **Candidate hypotheses:** table with hypothesis statement, mechanism, evidence strength, key assumptions, likely failure modes, and transfer boundary.
4. **Validation ladder:** minimum viable validation, strong controls, system-level check, and stop conditions.
5. **Evidence plan:** independent evidence streams, metrics, and control comparisons.
6. **Analysis logic:** how to integrate mechanism-level and performance-level data.
7. **Iteration decision:** rules for strengthening, revising, pivoting, or stopping.
8. **Validity and safety notes:** confounders, reproducibility requirements, boundary conditions, and non-operational safety constraints.

# Validation Gates

Before advancing past each stage, confirm:
- **Failure clarity:** The symptom is tied to a specific component or interface mechanism, not restated as a generic performance gap.
- **Falsifiability:** The hypothesis predicts an observable outcome that can be contradicted.
- **Control adequacy:** Controls exist to isolate the mechanism from geometry, mass, bulk properties, and unrelated chemistry.
- **Evidence independence:** Mechanistic claims rely on more than one measurement type.
- **Convergence:** Device-level, mechanism-level, and control-level evidence point in the same direction before the hypothesis is treated as supported.

# Claim Boundaries

- Limit claims to the tested chemistry, architecture, loading, and operating context.
- Distinguish directly observed evidence from model-based inference and from literature extrapolation.
- Do not treat single-study or single-paper results as field-wide consensus.
- Do not claim commercial readiness, clinical safety, or deployment viability from laboratory-scale mechanism evidence alone.
- Mark flexible, large-area, or integrated-device claims as unproven unless tested under relevant boundary conditions.

# Failure Modes

The workflow or research plan can fail when:
- The hypothesis is not falsifiable because controls are missing or confounded.
- Bulk property changes explain the result, but only interfacial mechanism evidence is collected.
- Performance improves in simplified cells but vanishes under realistic system integration.
- Early biological, environmental, or safety screening produces adverse signals that invalidate the candidate.
- A single metric improves while critical trade-offs (stability, compatibility, transport) degrade unacceptably.
- Replicate variability or insufficient diagnostics prevent mechanism discrimination.

# Validity Checks

Before finalizing any output, verify:
- **Confounding:** Have loading, geometry, thickness, processing, and assembly variation been controlled?
- **Measurement independence:** Are structural, chemical, kinetic, morphological, and electrochemical claims supported by orthogonal data?
- **Statistical rigor:** Are replicates, variability, outlier handling, and primary endpoints predefined?
- **Boundary conditions:** Are claims restricted to the tested system and clearly separated from extrapolation?
- **Reproducibility:** Is the design logic, control set, and analysis criteria specific enough for independent evaluation without operational recipes?
- **Safety and ethics:** Are all experimental descriptions at the research-design level, with hazardous execution deferred to qualified personnel and approved procedures?

# Provenance

- **Cluster:** 23 (zinc-aqueous-electrolyte-battery-mechanism-discovery)
- **Subcluster:** 23.0
- **Source skills:** `self-healing-interphase-zinc-battery-exploration`, `graphene-zib-research-workflow`, `biodegradable-power-electronic-medicine`, `bioresorbable-wireless-power-research`, `flow-battery-failure-mode-research`, `aqueous-zinc-anode-interface-exploration`, `field-coupled-interfacial-electrolyte-design`, `zinc-anode-electrochromic-research-design`.
- **Synthesis note:** Derived from shared workflow routes across aqueous battery, flow battery, biodegradable power, and electrochromic device research patterns; source-specific materials, parameters, and numerical results have been abstracted out.
