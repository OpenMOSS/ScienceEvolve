---
name: sci-fiber-composite-fiber-interface-mechanism-discovery-4a1abd20
description: A reusable end-to-end workflow for generating, testing, and validating structure-function mechanisms in composite, fiber, textile, porous, and hybrid material interfaces through staged hypothesis-driven research.
scienceevolve-title: "Fiber composites and battery materials · composite fiber interface mechanism discovery workflow 2"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Guide agents through a transferable, end-to-end mechanism discovery and validation workflow for complex material interfaces and heterogeneous systems such as composites, fibers, textiles, porous media, coatings, and hybrid architectures. The goal is to move from an observed performance gap to a bounded mechanistic claim using staged hypothesis generation, minimum viable experimentation, multi-stream evidence triangulation, and iterative refinement—without treating any single source system as a universal benchmark.

# When to use

Use this skill when a user asks to propose new research questions, design experiments, interpret results, or iterate on hypotheses for material systems where structure, interface, or environmental coupling may drive emergent behavior. Applicable to composite formulations, fibrous or porous architectures, surface coatings, responsive interfaces, sensor films, and extreme-environment material systems. Do not use for operational fabrication recipes, clinical recommendations, or hazardous procedural execution.

# Inputs required

Before producing a plan, ask for or infer:

- Target system class and the dominant performance gap or observed anomaly.
- Candidate mechanisms or structure-function links suspected to matter.
- Available characterization, modeling, and simulation capabilities.
- Constraints: safety, reproducibility, sample quantity, equipment access, and compliance boundaries.
- Baseline or benchmark data for the neat matrix, unmodified substrate, or reference configuration.

If inputs are incomplete, state assumptions explicitly and design the plan to test those assumptions.

# Core Workflow

1. **Gap Framing & Mechanism Mapping**
   - Define the performance gap as a measurable deviation from a baseline or requirement.
   - Identify candidate mechanisms linking structure, interface, or environmental variables to the observed behavior.
   - Distinguish direct interactions from mediated, apparent, or artifact-driven interactions.
   - *Gate G1:* Stop if the gap is not measurable or the system scope is undefined. Reformulate the question before proceeding.

2. **Hypothesis Portfolio Generation**
   - Generate 2–5 competing hypotheses that explain the gap through distinct mechanisms.
   - For each hypothesis specify: evidence strength (strong / moderate / weak / speculative), key assumptions, predicted observations, failure modes, and boundary conditions.
   - Prioritize hypotheses that are falsifiable by matched controls and that predict coherent signatures across multiple observables.
   - *Gate G2:* If hypotheses cannot be discriminated by available methods, narrow the scope or seek alternative characterization before experimentation.

3. **Experimental Design & Control Architecture**
   - Select independent variables that isolate one mechanism at a time while holding confounders constant.
   - Define a control hierarchy: baseline control, negative control, positive control, mechanism control, and artifact control.
   - Design a staged validation path:
     - Module A — Baseline & feasibility
     - Module B — Mechanism discrimination
     - Module C — Robustness & boundary probing
   - Pre-register success criteria, stop conditions, and failure criteria before data collection.
   - *Gate G3:* Halt if controls are insufficient to separate confounders (e.g., mass, thickness, temperature, matrix composition, processing history) from the target mechanism.

4. **Staged Evidence Collection**
   - **Module A:** Characterize raw materials, building blocks, and unperturbed system behavior. Confirm measurement stability, reproducibility, and absence of dominant artifacts.
   - **Module B:** Execute the minimum viable experiment that can materially change confidence in the leading hypothesis. Collect at least two independent evidence streams.
   - **Module C:** Test reproducibility across batches, substrates, or environmental states; probe boundary conditions where the mechanism should weaken or fail.
   - *Decision after Module A:* If baseline variability exceeds expected signal, pause and improve process consistency before advancing.
   - *Decision after Module B:* If the mechanism control replicates the test condition, reject or weaken the hypothesis and return to Stage 2.
   - *Stop conditions:* Uncontrolled instability, irreversible degradation, safety limits reached, or confounding dominates the target signal.

5. **Multi-Stream Analysis & Mechanism Discrimination**
   - Screen data for artifacts, calibration drift, outliers, and batch effects.
   - Compare test conditions against matched controls first; attribute causal effects only when confounders are ruled out.
   - Normalize for covariates (mass, thickness, temperature offset, baseline drift, aging state) before cross-system comparisons.
   - Require convergence of at least two independent observables before accepting a mechanism.
   - Classify each claim as supported, partially supported, inconclusive, or contradicted.
   - *Gate G4:* If independent evidence streams disagree, treat the discrepancy as diagnostic of unresolved confounders or competing mechanisms; do not force convergence.

6. **Claim Convergence & Boundary Setting**
   - State the accepted mechanism only when supported by multiple observables and matched controls.
   - Explicitly define claim boundaries: material families, substrate classes, process routes, environmental ranges, and untested extrapolations.
   - Separate demonstrated evidence from inferred or speculative extensions.
   - Acknowledge trade-offs when improving one property compromises another.
   - *Gate G5:* If the mechanism is accepted only within a narrow operating window, bound the claim to that window and flag untested regions.

7. **Iteration or Termination**
   - **Iterate** when: evidence is promising but mechanism is ambiguous (add discriminating measurements); behavior is mechanism-consistent but non-uniform (focus on fabrication or interface controls); or boundary conditions need narrowing.
   - **Pivot** when: results contradict the hypothesis across multiple domains; controls replicate the apparent effect; or practical penalties outweigh functional gains.
   - **Terminate** when: the hypothesis is sufficiently validated and bounded; the mechanism is falsified; or safety/resource limits preclude further progress.
   - Document the iteration rationale and update the mechanism map.

# Output Format

When using this skill, produce:

1. **Research question and scope boundary** — one clear, testable question and the system limits.
2. **Mechanism map and gap rationale** — candidate links between structure, interface, and function.
3. **Hypothesis portfolio** — 2–5 hypotheses with evidence strength, key assumptions, predicted observations, failure modes, and boundary conditions.
4. **Staged experimental design** — variables, control hierarchy, Module A/B/C plans, and stop conditions.
5. **Analysis plan** — data-screening rules, normalization strategy, mechanism-convergence criteria, and evidence-classification scheme.
6. **Iteration plan** — decision rules for each possible outcome after Module A, B, and C.
7. **Validity and safety checks** — confounders, reproducibility requirements, statistical discipline, and non-operational safety constraints.
8. **Claim boundary statement** — explicit limits on extrapolation and a provenance reference list.

# Validation Gates

- **G1 — Gap clarity:** The performance gap is measurable and the system scope is defined.
- **G2 — Hypothesis discriminability:** At least one hypothesis can be falsified by the available methods.
- **G3 — Control sufficiency:** The control hierarchy can separate the target mechanism from mass, thickness, temperature, matrix, processing, and artifact confounders.
- **G4 — Convergence:** At least two independent observables support the mechanism before it is accepted.
- **G5 — Bounding:** Claims are explicitly limited to tested material families, substrates, processes, and environmental ranges.

# Claim Boundaries

- Limit conclusions to the tested material family, substrate class, process route, and environmental domain.
- Do not extrapolate from single-system observations to field-wide consensus.
- Distinguish coupon-level or lab-scale evidence from system-level or deployment-ready claims.
- Mark preliminary biological, clinical, environmental, or safety-critical claims as requiring independent domain-specific validation.
- Avoid stating that a single favorable endpoint proves readiness for application; report trade-offs and boundary windows transparently.

# Failure Modes

- **Confounding dominance:** Thickness, mass, temperature, humidity, matrix composition, aging, or processing history explains the result rather than the proposed mechanism.
- **Insufficient controls:** Negative or mechanism controls produce the same apparent effect, undermining causal attribution.
- **Single-evidence overreach:** A monotonic trend or single observable is interpreted as mechanistic proof without orthogonal support.
- **Extrapolation beyond boundaries:** Claims extend to untested substrates, analytes, operating conditions, or material classes.
- **Irreversibility or instability:** System degradation, fouling, or drift masks the target mechanism.
- **Reproducibility failure:** Batch-to-batch or sample-to-sample variation exceeds the claimed effect size.
- **Selectivity collapse:** Non-target variables or interferents reproduce the signal in complex matrices.

# Validity Checks

- Are baseline and raw-material characterizations completed before composite or assembly testing?
- Are replicate samples and sources of variability specified?
- Are failure criteria and stop conditions defined before testing?
- Are measurements aligned with the stated mechanism and pre-registered comparisons?
- Does the analysis separate observed results from inferred mechanisms?
- Are fresh versus aged or conditioned states compared when time-dependent behavior is relevant?
- Are source-specific values, exact formulation ratios, and exact processing conditions avoided for new systems?
- Are conclusions limited to the tested material–process combination?
- Are safety, sustainability, sourcing, and compliance boundaries considered for the intended application?
- Would the plan remain useful if the first candidate formulation or configuration failed?

# Provenance

- Synthesized from cluster 53.1 (composite-fiber-interface-textile-mechanism-discovery-workflow), an end-to-end mechanism discovery and validation archetype.
- Source skills merged: bio-filler-composite-research-design; porous-textile-acoustic-exploration; biomimetic-multifunctional-coating-research; cryogenic-detector-material-exploration; soft-substrate-colloid-exploration; scwd-selective-recovery-workflow; nematic-photoalignment-interface-workflow; carbon-nanotube-liquid-sensor-research.
- Provenance is preserved as cluster and source-skill references only; no paper conclusions or system-specific benchmarks are embedded in the reusable workflow body.
