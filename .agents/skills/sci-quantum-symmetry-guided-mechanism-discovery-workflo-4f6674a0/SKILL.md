---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-4f6674a0
description: A reusable end-to-end workflow for generating, discriminating, and validating competing physical mechanisms in symmetry-sensitive quantum and magnetic transport systems through controlled variation, cross-probe consistency, and artifact-aware inference.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 18"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Teach an agent to design research plans that isolate a target physical mechanism from competing intrinsic, extrinsic, and artifact-driven contributions in symmetry-sensitive materials. The workflow emphasizes mechanism discrimination over signal maximization by using scaling laws, symmetry tests, cross-probe validation, and iterative hypothesis refinement.

# When to use

Use this skill when:

- A measured macroscopic response in spintronic, magnetic, topological, correlated, or interface-controlled materials may arise from multiple competing mechanisms.
- The user needs to generate new research questions, experimental plans, or analysis strategies that distinguish mechanism classes rather than optimize a single material stack.
- Observed asymmetries, transitions, or nonlinearities require attribution to specific structural, electronic, spin, or thermal origins.
- A proposed mechanism depends on subtle signals that may be confounded by background, geometry, contact effects, or measurement artifacts.

Do not use this skill for clinical decision support, biological intervention design, operational safety protocols, or executable laboratory instructions.

# Inputs required

Before generating a plan, collect or state assumptions for:

- **Target system:** material family, heterostructure, or device class and its known degrees of freedom.
- **Primary observable:** the transport, magnetic, optical, thermal, or spectroscopic response to be explained.
- **Candidate mechanisms:** at least three plausible origins (intrinsic, extrinsic/conventional, mixed, artifact-driven).
- **Tuning variables:** external or internal control axes expected to separate mechanisms (e.g., temperature, thickness, field orientation, composition, strain).
- **Symmetry handles:** crystallographic axes, magnetization direction, layer order, current polarity, or other variables that discriminate mechanisms by symmetry.
- **Available probes:** independent measurement modalities capable of cross-checking the same mechanism.
- **Controls:** baseline, positive, negative, necessity, and background reference conditions accessible in the research setting.
- **Constraints:** reproducibility requirements, sample availability, and acceptable uncertainty bounds.

If any input is missing, label it as an assumption and prioritize experiments that can falsify it.

# Core Workflow

Follow this ordered route. Treat each **Decision Gate** as a hard checkpoint; do not proceed until the condition is satisfied or the plan is redesigned.

1. **Define the observable and mechanism ambiguity.**  
   State the primary observable and list all plausible mechanism families that could produce it, including intrinsic, extrinsic, and artifact-driven alternatives.

2. **Predict discriminating signatures.**  
   For each mechanism, specify expected scaling behavior, symmetry/orientation dependence, and response to the chosen tuning variables.

3. **Generate ranked, falsifiable hypotheses.**  
   Assign evidence strength (high, medium, low, speculative), key assumptions, predicted observables, strongest falsification tests, and likely failure modes. Prefer hypotheses testable by more than one observable.

4. **Design minimal viable validation.**  
   Define positive, negative, necessity, background, and symmetry controls. Select primary and secondary variables. Predefine success, failure, and stop conditions before data collection.

5. **Pre-register analysis logic.**  
   Specify data-quality checks, background-separation strategy, mechanism-sensitive derived quantities, fitting assumptions, and model comparison criteria.

6. **Execute controlled variation and cross-probe measurement.**  
   Collect the primary observable and at least one independent probe (structural, local, vibrational, magnetic, or complementary transport) across the tuning regime while preserving matched geometry and common preparation history where possible.

7. **Apply symmetry and scaling decomposition.**  
   Separate odd/even, directional, or regime-specific components. Quantify background and artifact contributions. Preserve uncertainty through every transformation.

8. **Decision Gate 1 — Artifact audit.**  
   - *Pass:* Background/artifact contributions are bounded below the target signal, or their removal leaves the trend unchanged under alternative plausible models.  
   - *Fail:* Artifacts dominate or cannot be bounded. **Stop.** Redesign controls and return to step 4.

9. **Cross-probe alignment and model comparison.**  
   Compare transition markers, scaling trends, or symmetry-resolved signatures across independent probes. Evaluate consistency with microscopic or phenomenological models (trend, symmetry, and magnitude). Treat disagreement as evidence for hidden variables or model breakdown, not noise.

10. **Decision Gate 2 — Mechanism discrimination.**  
    - *Pass:* One mechanism is strongly favored by multiple independent signatures; competing alternatives are falsified or bounded.  
    - *Partial:* Mechanisms remain degenerate. Identify the next discriminating variable or probe, update hypotheses, and **iterate** from step 4.  
    - *Fail:* All hypotheses are contradicted by controls. **Stop.** Preserve the negative result as a boundary condition.

11. **Update evidence strength and bound claims.**  
    Revise hypothesis rankings based on new data. Explicitly state the validity regime (temperature, thickness, material, geometry) where the conclusion holds.

12. **Decision Gate 3 — Stopping check.**  
    - *Stop* when the mechanism is robustly separated, all tested mechanisms are falsified, or additional measurements cannot reduce the dominant uncertainty.  
    - Otherwise, define the next research cycle and **iterate**.

# Output Format

Return the research plan in this structure:

1. **Research question:** one sentence focused on mechanism, material comparison, or device concept.
2. **Mechanism map:** candidate mechanisms with expected scaling, symmetry, and cross-probe signatures.
3. **Hypotheses table:** hypothesis, evidence strength, key assumptions, predicted signature, strongest falsification test, likely failure mode.
4. **Experimental design:** minimal viable validation, controls (positive, negative, necessity, background, symmetry), primary and secondary variables, and stop conditions.
5. **Analysis plan:** preprocessing, background separation, symmetry/scaling decomposition, cross-probe comparison, model checks, and uncertainty handling.
6. **Iteration plan:** how results update evidence strength and select the next discriminating experiment.
7. **Validity and ethics statement:** confounders, reproducibility risks, boundary conditions, and safety/compliance constraints.
8. **Expected deliverables:** figures, tables, raw-data checklist, fit assumptions, and decision criteria for the next cycle.

# Validation Gates

Before accepting a proposed mechanism, verify:

- **Competing hypotheses considered:** at least intrinsic, extrinsic, mixed, and artifact-driven possibilities are on the table.
- **Symmetry consistency:** the observed response follows the predicted symmetry under reversal, orientation, or geometric transformation.
- **Scaling discrimination:** the dynamic range and functional form distinguish mechanisms rather than merely fitting a curve.
- **Control consistency:** positive, negative, and background controls behave as expected.
- **Cross-probe agreement:** independent observables support the same transition region or mechanism trend.
- **Background boundedness:** the target signal remains after transparent background correction and is stable under alternative plausible background models.
- **Statistical validity:** uncertainties, repeatability, and sensitivity to baseline choices are reported.
- **Model identifiability:** the proposed fit or model can distinguish competing mechanisms without unverified tuning.
- **Reproducibility:** trends are consistent across samples, sessions, or batches.
- **Boundary conditions:** the conclusion is explicitly scoped to the tested regime and not overgeneralized.

# Claim Boundaries

- Distinguish **observed** correlations from **inferred** mechanisms and **speculative** extrapolations.
- State the validity regime (temperature, composition, thickness, geometry, field range) for every mechanism claim.
- Do not treat a single paper, material stack, or sample series as field-wide consensus.
- Label agent inferences for new systems separately from validated methodological precedents.
- When magnitude agrees but symmetry or scaling fails, downgrade the claim to unconfirmed.

# Failure Modes

Pause or redesign the study when:

- Negative or background controls show signal magnitudes comparable to test devices.
- Independent extraction methods or probes disagree beyond stated uncertainty.
- The signal changes with measurement configuration (wiring, contact layout, geometry) more strongly than with the intended material variable.
- Thermal, nonlinear, or drift indicators suggest the intended mechanism is not isolated.
- The conclusion depends on an unsupported correction assumption or unverified background model.
- Structural or compositional validation reveals uncontrolled artifacts co-varying with the primary variable.
- Results reverse across nominally identical replicates.
- Further measurements would not reduce the dominant uncertainty.

# Validity Checks

Audit the following continuously:

- **Confounding:** Are thickness, roughness, crystallinity, strain, disorder, oxidation, or contact properties changing along the same axis as the tuning variable?
- **Thermal and environmental mixing:** Could heating, thermoelectric voltages, or temperature gradients explain the asymmetry or transition?
- **Geometric and instrumental artifacts:** Could contact misalignment, current crowding, mixed channels, calibration drift, or detector nonlinearity mimic the target signal?
- **Regime boundaries:** Is the analysis avoiding phase coexistence, compensation points, or instrument-limit regions unless those are the explicit target?
- **Statistical and fitting validity:** Are parameters identifiable, uncertainties propagated, and baseline choices robust?
- **Negative evidence:** Are absence-of-transition and failed-control results reported as boundaries rather than failures?
- **External validity:** Is the mechanism transferable to similar systems, or is it tied to a specific interface, substrate, or preparation history?
- **Safety and compliance:** Does the plan remain within institutional review, facility safety, and materials-handling boundaries without providing executable hazardous procedures?

# Provenance

Synthesized from cluster 61.0 (transport-spin-symmetry-magnetic-mechanism-discovery-workflow). Source skills: spintronic-umr-exploration, pressure-tuned-correlated-materials-workflow, complex-oxide-magnetism-background-resolved-research, spintronics-artifact-aware-sot-exploration, berry-curvature-transport-research-workflow, complex-oxide-interface-exploration, iron-pnictide-local-structure-exploration, cascaded-quantum-exploration.
