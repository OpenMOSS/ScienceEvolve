---
name: sci-aqueous-electrochemical-materials-evidence-audit-wo-c3b4ae3d
description: An end-to-end research workflow for generating mechanism-linked hypotheses, designing staged validation with orthogonal controls, and auditing evidence claims in electrochemical energy-storage materials research.
scienceevolve-title: "Aqueous battery interfaces · electrochemical materials evidence audit workflow"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Help an agent transform literature observations or user goals into a reusable, mechanism-driven research workflow for electrochemical energy-storage materials. The skill focuses on diagnosing system bottlenecks, generating falsifiable hypotheses, designing control-heavy validation plans, analyzing evidence through causal chains, and bounding claims to the level actually supported by data.

# When to use

Use this skill when the user asks to:

- Propose new research questions or hypotheses for electrochemical materials, interfaces, or devices.
- Design a validation plan with controls, metrics, and stopping criteria.
- Audit whether a materials claim is supported by sufficient evidence or confounded by artifacts.
- Iterate on a failed or partial result in energy-storage research (batteries, supercapacitors, hybrid devices, electrolytes, electrodes, separators).
- Translate a subsystem improvement into a full-device claim.

Do not use this skill for direct operational execution, clinical domains, or as a substitute for institutional safety review.

# Inputs required

Before generating a plan, request or identify:

- Target system class and application context.
- Suspected bottleneck or failure mode (storage, transport, interface, stability, balance).
- Candidate mechanism or material strategy.
- Available evidence types (literature, preliminary data, characterization access).
- Constraints (safety, environmental, cost, scalability, compliance).
- Baseline comparator and success criteria.

# Core Workflow

## Stage 1: Frame and Diagnose

Define the research question as a coupled system problem. Identify the weakest module (storage, transport, interface, mechanical integrity, or electrode/device balance). Convert the bottleneck into a structural or mechanistic descriptor.

**Decision Gate 1:** Proceed only if the bottleneck is linked to a measurable mechanistic diagnostic, not just a performance gap.

## Stage 2: Generate Mechanism-Linked Hypotheses

Produce 3–5 falsifiable hypotheses. For each:

- State the mechanism prediction (if X changes, then Y diagnostic should improve).
- Label evidence strength (directly supported / plausible / analogy-based / speculative).
- List key assumptions.
- State likely failure modes.
- Define boundary conditions for extrapolation.
- Specify minimal viable validation.

**Decision Gate 2:** Proceed only if each hypothesis can be rejected by a feasible experiment and includes at least one negative control.

## Stage 3: Design Staged Validation

Build a validation ladder, not a single experiment.

- **Variables:** Isolate one primary design axis per stage; add interaction tests only after base trends are interpretable.
- **Controls:** Include baseline, negative, positive, structural, chemical, and full-system controls to rule out artifacts.
- **Metrics:** Use a multi-metric panel aligned to the claim hierarchy (material → interface → device → system).
- **Stop conditions:** Define criteria to halt if the intended structure does not form, the mechanism diagnostic does not move, full-system gains disappear, or safety boundaries are breached.

**Decision Gate 3:** Proceed to data collection only if the plan includes orthogonal measurement classes and matched protocols.

## Stage 4: Collect and Check Data Integrity

Confirm replicate consistency, calibration, normalization basis, and inactive-mass or geometry accounting. Flag missing data, excluded runs, or protocol mismatches.

**Decision Gate 4:** Halt analysis if data quality is insufficient to distinguish signal from artifact.

## Stage 5: Analyze Through Causal Chains

Analyze in order:

1. **Structure verification:** Did the intended feature form?
2. **Lower-order baseline check:** Is the full-system signal additive or genuinely new?
3. **Mechanism discrimination:** Do orthogonal observables converge on the same candidate mechanism?
4. **Trade-off mapping:** Map energy vs. power, capacity vs. rate, retention vs. impedance, etc.
5. **Evidence-level classification:** Label conclusions as material-level, interface-level, device-level, or system-level.

**Decision Gate 5:** Upgrade the hypothesis only if multiple independent measurements support it and simpler additive explanations are rejected.

## Stage 6: Audit Claims and Boundaries

- Separate verified observations from model-supported inferences and speculative extrapolations.
- Ensure subsystem claims are not overstated as full-device conclusions.
- Require direct functional evidence before claiming downstream application relevance.
- Document uncertainty, variability, and reproducibility limits.

**Decision Gate 6:** Finalize claims only if they are proportionate to sample size, control quality, and evidence strength.

## Stage 7: Iterate or Redesign

Use the evidence to update the hypothesis:

- **Supported:** Test boundary conditions and full-system relevance.
- **Partially supported:** Add the missing diagnostic rather than increasing complexity.
- **Falsified:** Replace the mechanism assumption, not just the material label.
- **Confounded:** Redesign with orthogonal controls and matched protocols.

**Iteration / Stop Conditions:**

- Stop if the core mechanism is falsified after two independent control sets.
- Stop if safety, environmental, or compliance constraints block the direction.
- Redesign if the dominant failure mode lies outside the current hypothesis.
- Continue only if the next smallest discriminating experiment is defined.

## Stage 8: Finalize Validity and Safety Review

Check confounding, reproducibility, normalization, baseline relevance, boundary conditions, statistical validity, external validity, and literature scope. Confirm that no operational hazardous details are included and that institutional safety review is flagged where needed.

# Output Format

When using this skill, produce:

1. **Research question** – Bottleneck, target system, and trade-off.
2. **Ranked hypotheses** – Mechanism, evidence strength, assumptions, failure modes, boundary conditions.
3. **Study plan** – Variables, controls, metrics, minimal viable validation, stop conditions.
4. **Analysis plan** – Data integrity checks, mechanism diagnostics, trade-off maps, evidence-level classification rules.
5. **Validation plan** – Orthogonal measurement strategy, causal chain, and artifact exclusion.
6. **Control table** – Baseline, negative, positive, structural, and system-level controls.
7. **Claim boundaries** – What is verified, inferred, or speculative at each level.
8. **Failure modes** – Likely failure modes and how they will be detected.
9. **Iteration roadmap** – Next steps for supported, partial, falsified, and confounded outcomes.

# Validation Gates

- **Hypothesis falsifiability:** Every hypothesis must have a defined observation that would weaken or reject it.
- **Control adequacy:** Every claim level must have matched controls; subsystem improvements cannot stand alone for device-level claims.
- **Orthogonality:** At least two independent measurement classes must support a mechanistic claim.
- **Pre-registration:** Success criteria and stop conditions must be defined before testing.
- **Recovery check:** If the design relies on reversible behavior, recovery must be demonstrated or justified as intentionally irreversible.

# Claim Boundaries

- **Material-level:** Permitted when structural or compositional evidence is direct.
- **Interface-level:** Permitted when interfacial diagnostics (impedance, morphology, stability) are matched to material changes.
- **Device-level:** Permitted only when full-system performance is validated against appropriate blanks and benchmarks under matched conditions.
- **System-level:** Permitted only after trade-offs, scalability, safety, and cost are considered.
- Never transfer a claim across ion chemistries, electrode architectures, or operating windows without re-evaluating the mechanism.

# Failure Modes

Common failure modes to anticipate and monitor:

- The intended structure forms but does not improve the target transport or storage property.
- An interface stabilizes one process but increases resistance or side reactions.
- A subsystem improvement disappears when integrated into a full device.
- A performance gain depends on unmatched testing conditions or uncontrolled environmental variables.
- Morphology or composition changes are misattributed to mechanism without kinetic or interfacial evidence.
- Reversible behavior is actually irreversible degradation masked by initial recovery.
- Trade-offs are hidden by selective metric reporting or inconsistent normalization.

# Validity Checks

Before finalizing any plan or conclusion, verify:

- **Confounding:** Are multiple variables changing simultaneously? Are humidity, residual solvent, contact resistance, or geometry matched?
- **Reproducibility:** Are independent batches, repeated measurements, and uncertainty reported?
- **Normalization:** Are metrics consistently normalized and inactive components accounted for?
- **Baseline relevance:** Is the comparator appropriate for the target bottleneck?
- **Boundary conditions:** Does the claim depend on a narrow architecture, voltage window, or protocol?
- **Mechanistic validity:** Is there direct evidence for the proposed mechanism, or only correlation?
- **Statistical validity:** Are conclusions proportionate to sample size, variability, and effect size?
- **External validity:** Can the finding plausibly transfer to realistic loading, packaging, and operating constraints?
- **Safety and ethics:** Are materials, waste, and failure modes compatible with responsible practice and institutional review?

# Provenance

Synthesized from cluster 34.0 (observable-driven evidence analysis and claim audit). Derived from source skills:

- `c7d18f580a52cda7`: zinc-ion-hybrid-capacitor-research-workflow
- `b3f64e9ada3159d1`: biopolymer-spe-research-workflow
- `583f6e764e2f38a4`: coordination-speciation-research-workflow
- `8ddd870296f97ac9`: conductive-metallogel-research
- `73e2615d4061a326`: precursor-controlled-active-site-porous-carbon-discovery
- `98f38f9e64d9a0ac`: hydrated-soft-material-exploration
- `c497d6fd21760e26`: redox-materials-research-exploration
- `6a372370fa044ed8`: stimulus-gated-transport-electrolyte-design
