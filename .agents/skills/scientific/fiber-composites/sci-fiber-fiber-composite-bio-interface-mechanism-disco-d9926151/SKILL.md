---
name: sci-fiber-fiber-composite-bio-interface-mechanism-disco-d9926151
description: A reusable end-to-end workflow for observable-driven mechanism discovery and validation in fiber, composite, and bio-interface material systems.
scienceevolve-title: "Fiber composites and battery materials · fiber composite bio interface mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

This skill guides agents through a systematic, mechanism-centered research workflow for fiber-reinforced composites, bio-nanofiller interfaces, surface-functionalized materials, and related polymer or particulate systems. The goal is to move from an observed performance gap to discriminated, evidence-backed mechanistic claims through controlled hypothesis generation, multi-modal validation, and iterative claim bounding—without relying on single-paper recipes or operational fabrication details.

## When to use

Use this skill when:
- Proposing new research questions or validation plans for composite, fiber, or bio-interface systems where a mechanism must be isolated from confounding effects.
- Designing experiments around interfacial modification, filler dispersion, architecture changes, surface grafting, aging resistance, or processing-structure-property optimization.
- Evaluating whether observed structural, chemical, or mechanical evidence supports a causal mechanism rather than a correlation.

Do not use this skill to:
- Provide operational fabrication recipes, hazardous synthesis parameters, or step-by-step laboratory procedures.
- Substitute for domain expert review, certified testing protocols, or safety-critical structural qualification.
- Offer clinical, biomedical treatment, or consumer product advice.

## Inputs required

Collect or infer the following before executing the workflow:

- **Target system**: material classes (fiber, matrix, filler, coating), architecture, and intended loading or exposure regime.
- **Performance gap**: the observable bottleneck, failure mode, or property trade-off to be explained.
- **Candidate design levers**: variables hypothesized to influence the gap (e.g., surface chemistry, loading level, hybridization, processing route).
- **Available characterization**: structural, chemical, morphological, mechanical, thermal, or spectroscopic methods accessible for convergent evidence.
- **Constraints**: safety boundaries, material availability, budget, reproducibility requirements, and environmental or ethical limits.
- **Prior evidence boundary**: what is verified by literature, what is inferred, and what is unknown.

## Core Workflow

1. **Gap Diagnosis & Observable Anchoring**
   - Define the performance bottleneck in terms of measurable observables (e.g., interfacial debonding, dispersion heterogeneity, degradation acceleration, non-monotonic property trends).
   - Bound the material system, geometry, and environmental conditions under study.
   - *Stop condition*: If the gap cannot be expressed through measurable observables with available methods, pause and refine the research question.

2. **Mechanism-Centered Hypothesis Generation**
   - Generate at least three competing hypotheses that link a design lever to the gap via a physical or chemical mechanism.
   - For each hypothesis, record:
     - **Evidence strength**: high (direct multi-study support), medium (plausible by analogy), or low (exploratory).
     - **Key assumptions**: conditions that must hold for the mechanism to operate.
     - **Predicted signatures**: expected patterns across multiple evidence streams.
     - **Likely failure modes**: ways the hypothesis could fail (e.g., agglomeration, poor wetting, competing reactions, stress concentration).
   - *Decision gate*: If no hypothesis is testable within resource and safety constraints, stop and rescope.

3. **Control-First Experimental Design**
   - Construct a minimal viable validation matrix:
     - **Baseline**: unmodified system with identical architecture and processing history.
     - **Process control**: system subjected to the modification workflow without the active intervention.
     - **Positive directional control**: a known effective condition, if available and appropriate.
     - **Negative directional control**: a condition expected to impair the target mechanism, when scientifically justified and safe.
     - **Modified conditions**: low, moderate, and high levels of the primary design lever to detect non-monotonic behavior.
   - Define primary endpoints tied to the hypothesized mechanism and secondary endpoints to capture trade-offs.
   - Pre-register stop/failure criteria: unacceptable defect formation, control failure, unexplained variability, or safety boundary breach.
   - *Iteration trigger*: If the matrix cannot isolate the mechanism from confounders (e.g., batch, geometry, measurement method), return to Step 2.

4. **Multi-Modal Evidence Collection**
   - Plan at least two independent evidence streams:
     - Structural/morphological (e.g., imaging, diffraction, porosity).
     - Chemical/spectroscopic (e.g., bonding state, surface chemistry, degradation markers).
     - Functional/mechanical or performance (e.g., load-bearing response, thermal transition, retained properties after exposure).
   - Collect data under consistent handling, documented batch conditions, and randomized or balanced run order where feasible.
   - *Stop condition*: If a critical evidence stream is compromised or inaccessible, pause and redesign before analysis.

5. **Mechanism Triangulation & Analysis**
   - Analyze each response family separately; do not merge mechanical, thermal, moisture, or chemical responses into a single composite score before interpretation.
   - Test for non-monotonic trends and competing mechanisms.
   - Link microstructural or chemical observations to macroscopic outcomes only when independent trends align.
   - Quantify uncertainty through replicate variability, batch effects, and appropriate interval estimates.
   - *Decision gate*: If structural and functional evidence diverge, classify the hypothesis as provisional and flag the need for targeted additional evidence.

6. **Decision Gate & Hypothesis Classification**
   - Classify each hypothesis based on convergent evidence:
     - **Supported**: multiple independent streams align with predicted signatures and controls are valid.
     - **Partially supported**: alignment in some streams, but confounders, contradictions, or unresolved ambiguity remain.
     - **Rejected**: evidence contradicts predicted signatures, or controls invalidate the comparison.
     - **Ambiguous**: high variability, insufficient replication, or unresolved confounding prevents classification.
   - *Iteration rules*:
     - **Rejected or Ambiguous** → Return to Step 2 to reformulate mechanisms or Step 3 to strengthen controls.
     - **Partially supported** → Return to Step 4 to collect targeted mechanism-specific evidence (e.g., interface-specific imaging, additional loading modes).
     - **Supported** → Proceed to Step 7.

7. **Claim Bounding & Next-Cycle Planning**
   - Bound all claims to the tested material system, processing route, geometry, and environmental conditions.
   - Document trade-offs explicitly (e.g., strength versus toughness, stiffness versus ductility, protection versus baseline mechanics).
   - Decide the next action:
     - Refine the design variable around the optimum or boundary.
     - Expand to neighboring material classes, architectures, or service environments.
     - Escalate to durability, aging, or scale-up validation.
     - Terminate the workflow if the mechanism is sufficiently validated or if safety/ethical limits are reached.
   - *Stop condition*: Terminate if the validated mechanism cannot be generalized beyond the current boundary without further qualification, or if application-specific certification (e.g., structural, medical, environmental) exceeds the current evidence base.

## Output Format

When using this skill, produce a structured research plan containing:

1. **Research question**: one sentence defining the gap and mechanism being tested.
2. **Evidence map**: separation of verified prior evidence, agent inferences, and unknowns.
3. **Hypotheses table**: at least three hypotheses with evidence strength, key assumptions, predicted signatures, and likely failure modes.
4. **Experimental design matrix**: groups, controls, factors, endpoints, and pre-registered stop criteria.
5. **Analysis plan**: statistical approach, visualization strategy, mechanism-linking criteria, and uncertainty handling.
6. **Iteration rules**: decision logic for supported, partial, rejected, and ambiguous outcomes.
7. **Validity and safety notes**: confounders, reproducibility checks, boundary conditions, and non-operational safety boundaries.

## Validation Gates

- **Pre-registration**: Primary endpoints, acceptance criteria, and decision logic are defined before data collection.
- **Control adequacy**: Baseline, process, positive, and negative controls must bracket the expected behavior and isolate the design lever from handling artifacts.
- **Convergent evidence**: Mechanism claims require alignment between at least two independent evidence streams (e.g., structural + functional, or chemical + mechanical).
- **Statistical validity**: Replication, uncertainty reporting, and appropriate model assumptions are verified before inference.
- **Mechanism-property linkage**: Macroscopic improvements are accepted as mechanism-supported only when microstructural or chemical evidence points in the same direction.

## Claim Boundaries

- Limit conclusions to the tested material system, architecture, processing history, loading regime, and environmental conditions.
- Distinguish confirmed observations from model-based predictions and from speculative extensions.
- Mark extrapolation risks: transferring conclusions to other material classes, longer timescales, harsher environments, or safety-critical applications requires additional validation.
- Treat single-study or single-system findings as case-specific evidence, not field-wide consensus.

## Failure Modes

- **Hypothesis failure**: Predicted observable signatures are absent despite adequate experimental power.
- **Control failure**: Baseline or process controls behave unexpectedly, invalidating comparisons.
- **Confounding dominance**: Batch, geometry, measurement method, or uncontrolled variables obscure the effect of the design lever.
- **Non-monotonic degradation**: Intermediate design levels improve performance while higher levels introduce defects (e.g., agglomeration, voids, embrittlement) that dominate benefits.
- **Evidence divergence**: Independent characterization streams yield contradictory conclusions about the mechanism.
- **Safety or ethical breach**: The proposed intervention or testing condition exceeds institutional safety, environmental, or ethical boundaries.

## Validity Checks

Before finalizing any recommendation or conclusion, verify:

- **Confounding isolation**: Changes in processing route, batch, cure history, surface preparation, specimen geometry, or measurement method are tracked separately from the design lever.
- **Replication and batch coverage**: Results are based on repeated specimens and, where possible, independent fabrication batches.
- **Control bracketing**: Controls are sufficient to separate material effects from handling, processing, and measurement artifacts.
- **Multi-modal alignment**: The proposed mechanism is supported by direct evidence from multiple characterization methods.
- **Loading and environmental relevance**: Tested conditions match the intended application’s dominant stresses or exposure scenarios.
- **Statistical adequacy**: Uncertainty, outliers, and non-monotonic trends are reported rather than suppressed.
- **Reproducibility**: Experimental logic and decision criteria are documented at a level that allows independent repetition without proprietary or unsafe operational details.

## Provenance

Synthesized from cluster 31.1 (observable-driven mechanism discovery and validation). Source skill references: `fiber-metal-laminate-exploration`, `hydrothermal-carbon-phase-exploration`, `centrifugal-spun-polymer-fiber-exploration`, `polysaccharide-nanoparticle-graft-design`, `natural-fiber-composite-exploration`, `particulate-filled-composite-exploration`, `bio-epoxy-composite-research-design`, `fiber-uv-aging-research-design`. These sources provided the shared workflow route; no specific material system, numerical result, or paper conclusion is embedded in the reusable body above.
