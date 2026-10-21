---
name: sci-fiber-composite-fiber-interface-mechanism-discovery-f6107daf
description: End-to-end reusable workflow for generating, testing, and validating mechanistic hypotheses in composite, fiber, and interface material systems through controlled experimentation and iterative discrimination.
scienceevolve-title: "Fiber composites and battery materials · composite fiber interface mechanism discovery workflow 3"
scienceevolve-area: fiber-composites-and-battery-materials
---

# composite-fiber-interface-mechanism-discovery-workflow

## Purpose

Generate transferable research plans that move from an observed performance bottleneck in a composite, fiber, or interface material system to a validated, bounded mechanistic explanation. The workflow emphasizes hypothesis generation, minimal viable experimentation, multi-scale evidence chains, and iterative redesign without relying on source-specific recipes or treating single studies as field consensus.

## When to use

- When designing a new study to explain why a material system behaves as it does.
- When linking a material modification, processing change, or structural feature to a downstream functional outcome.
- When discriminating among competing mechanisms (e.g., interfacial versus bulk, transport versus reaction, structural versus chemical).
- When planning experiments for composites, scaffolds, fibers, fillers, coatings, membranes, adsorbents, or encapsulated active systems.
- Do not use for clinical treatment advice, operational execution of hazardous protocols, or as a substitute for institutional safety review.

## Inputs required

- Target material system and its architecture.
- Identified performance bottleneck or functional gap.
- Candidate mechanisms or modification strategies.
- Available characterization and testing capabilities.
- Constraints (safety, ethics, resources, environment).
- Prior evidence and its provenance (paper-derived, user data, or inference).

## Core Workflow

1. **Bottleneck and Gap Definition**
   - Define the specific performance limitation and the conditions under which it appears.
   - Specify the target outcome and the failure mode to be resolved.
   - **Decision gate:** Is the bottleneck observable and measurable? If no, stop and refine the research question.

2. **Mechanism Mapping and Hypothesis Generation**
   - Map plausible pathways from material state through interface/structure to function.
   - Generate at least three falsifiable hypotheses (e.g., chemistry-focused, structure-focused, trade-off-focused).
   - Label each hypothesis with:
     - Evidence strength (weak, moderate, strong).
     - Key assumptions.
     - Predicted observations.
     - Likely failure mode.
     - Boundary conditions for extrapolation.
   - **Decision gate:** Do hypotheses have falsifiable predictions and mechanism-discriminating observations? If no, return to step 1.

3. **Minimal Viable Experiment Design**
   - Design the smallest study that can discriminate among the leading hypotheses.
   - Define:
     - Variables (material, process, environmental).
     - Controls (baseline, blank, negative, positive, process/sham).
     - Primary and secondary responses.
     - Predefined stopping criteria.
   - **Decision gate:** Can the design falsify at least one hypothesis? If no, add mechanism-discriminating controls or metrics before proceeding.

4. **Execution and Data Integrity**
   - Collect data with predefined quality checks (calibration, replication, batch tracking, lineage).
   - Document exclusions, anomalies, and failed runs.
   - **Decision gate:** Do data pass integrity checks? If no, pause interpretation and fix the measurement system.

5. **Layered Analysis and Mechanism Discrimination**
   - Analyze in ordered layers: material/structure → intermediate state → function → mechanism support.
   - Compare against all relevant controls, not only baseline.
   - If mechanism proxies contradict the primary hypothesis, flag for revision.
   - **Decision gate:** Does evidence converge on one mechanism? If yes and robustness is required, proceed to step 6. If ambiguous, proceed to step 7 with a targeted follow-up. If contradicted, proceed to step 7 for redesign.

6. **Robustness and Boundary Testing (Escalation)**
   - Test durability, cyclic stress, regeneration, alternative conditions, or independent batches.
   - **Decision gate:** Does the effect persist under stress and across batches? If no, narrow the claim boundary and return to step 7.

7. **Iteration or Redesign**
   - Classify the outcome: supported, partially supported, unsupported, inconclusive, or unsafe.
   - Identify the limiting module (material, process, structure, interface, mechanism, measurement).
   - Revise only the failed module; preserve core controls for comparability.
   - Return to step 2 or 3 with updated hypotheses.
   - **Stop conditions:**
     - Hypothesis is falsified.
     - Safety or environmental limit is reached.
     - Reproducibility fails across independent batches.
     - Benefit appears only under unrealistically narrow conditions.
     - Claim boundaries are sufficiently bounded and no further discrimination is needed.

8. **Uncertainty Audit and Claim Bounding**
   - Summarize evidence strength for each claim.
   - Explicitly state what is not proven, where extrapolation is unsafe, and which conclusions are system-specific.
   - Archive failed conditions and negative results as boundary definitions.

## Output Format

When using this skill, return:

1. **Research question and bottleneck statement** — one concise, testable question.
2. **Mechanism map with ranked hypotheses** — evidence strength, assumptions, predicted observations, likely failure modes, and boundary conditions.
3. **Study design** — variables, controls, primary/secondary responses, and stop conditions.
4. **Analysis plan** — layered interpretation, required comparisons, model/uncertainty approach, and mechanism validation logic.
5. **Validation gates checklist** — what must pass before claiming support.
6. **Iteration decision tree** — support leads to robustness testing; partial support leads to targeted follow-up; contradiction leads to redesign; unsafe leads to stop.
7. **Claim boundaries and failure modes** — explicit limits and known failure patterns.
8. **Provenance and evidence separation notes** — labeling of paper-derived, user-provided, and inferred claims.

## Validation Gates

- **Question specificity:** The research question is testable and not a broad universal claim.
- **Hypothesis falsifiability:** Each hypothesis has a defined observation that would weaken or reject it.
- **Control adequacy:** Baseline, blank, and mechanism-discriminating controls are included.
- **Confounder control:** Key coupled variables are held constant or measured.
- **Mechanism convergence:** Structural, chemical, functional, and failure-mode evidence point to the same explanation before strong claims are made.
- **Reproducibility:** Replication and batch variability are addressed.
- **Statistical validity:** Uncertainty is reported and model assumptions are checked.
- **Safety and ethics:** The plan stays at the research-design level and respects institutional boundaries.

## Claim Boundaries

- Claims are bounded to the tested material system, processing route, model conditions, and measured endpoints.
- Do not generalize to clinical practice, field deployment, or unrelated material classes without independent validation.
- Distinguish paper-verified observations, user-provided data, and agent-generated inferences.
- Mark exploratory findings separately from confirmatory evidence.
- Do not present single-study results as field consensus.

## Failure Modes

- **Material or process failure:** The system cannot be formed or processed repeatably. *Action:* Fix fabrication before testing function.
- **Mechanism mismatch:** Performance changes but mechanism proxies do not align. *Action:* Reject the proposed mechanism and test alternatives.
- **Over-treatment or over-modification:** Benefit peaks then rebounds with increasing intervention strength. *Action:* Narrow the effective window and test robustness.
- **Confounded response:** Observed effect is due to dispersion, voids, orientation, or batch variability rather than the intended mechanism. *Action:* Add controls and characterization.
- **Trade-off lock:** Improvement in one metric causes unacceptable loss in another. *Action:* Define multi-objective acceptability criteria.
- **Non-reproducibility:** Results vary across batches or repeats. *Action:* Investigate preparation and measurement consistency before proceeding.
- **Safety or environmental limit:** The intervention introduces unacceptable hazard or secondary waste. *Action:* Stop and redesign.

## Validity Checks

- Are structural parameters (thickness, mass, porosity, size) coupled in ways that obscure causality?
- Are positive and negative controls behaving as expected?
- Are outliers documented and explained?
- Is sample lineage traceable from preparation through characterization to testing?
- Do test conditions match the intended application enough to support the claim?
- Are failed conditions, narrow windows, and unsupported extrapolations explicitly stated?
- Is evidence labeled by source (paper-derived versus inference)?

## Provenance

- Synthesized from cluster 54, subcluster 54.0 (composite-fiber-interface-material-mechanism-discovery).
- Source skills: multifunctional-wound-scaffold-discovery, textile-microfiber-release-exploration, alginate-nanofiber-adsorbent-research, nanofiber-filtration-research-design, natural-fiber-composite-process-research, polymer-fiber-interface-exploration, food-active-microcapsule-research-design, biochar-filled-natural-fiber-composites.
- The workflow abstracts shared structure without preserving paper-specific parameters, numerical results, or operational protocols.
