---
name: sci-aqueous-aqueous-metal-battery-mechanism-discovery-w-12dd9016
description: A reusable end-to-end workflow for designing, validating, and iterating mechanism-driven research in aqueous metal battery systems, emphasizing orthogonal evidence, strong controls, and claim bounding.
scienceevolve-title: "Aqueous battery interfaces · aqueous metal battery mechanism discovery workflow 2"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Guide agent-led mechanism discovery and validation for aqueous metal battery research. The workflow translates observed electrochemical behavior into testable mechanistic hypotheses, enforces rigorous control structures, and iterates only when orthogonal evidence supports causal claims.

# When to use

Use this skill when:

- Proposing new research questions around metal anode stability, electrolyte structure, interfacial selectivity, or phase pathway control.
- Designing experiments to distinguish competing mechanisms (e.g., interfacial vs. bulk, solvation vs. adsorption).
- Evaluating whether performance improvements are tied to a specific mechanism or are artifacts of confounding variables.
- Iterating after ambiguous or contradictory experimental results.

# Inputs required

Collect or state assumptions for:

- **Target system chemistry and architecture:** anode class, cathode class, electrolyte family, separator type, and cell format.
- **Dominant failure mode or bottleneck:** irreversible deposition, side reactions, phase transformation, dissolution, or interfacial degradation.
- **Candidate mechanism levers:** additive/co-solvent concepts, concentration regimes, interfacial modifiers, or host-structure changes.
- **Available characterization toolkit:** electrochemical diagnostics, spectroscopy, microscopy, diffraction, imaging, transport measurements, or modeling access.
- **Constraints and boundaries:** safety, environmental, regulatory, cost, loading, rate, temperature, and reproducibility requirements.

If key inputs are missing, state assumptions explicitly and mark them as provisional.

# Core Workflow

1. **Frame the coupled bottleneck.** Define the failure as an interaction between bulk electrolyte behavior and electrode-interface chemistry. Identify the degradation-prone species or pathway and the desired reversible alternative.  
   *Gate: If the bottleneck cannot be expressed as a coupled bulk-interface problem, stop and refine the research question.*

2. **Generate competing mechanism hypotheses.** For each candidate lever, formulate at least two competing hypotheses that explain how the lever redirects the reaction pathway. Each hypothesis must include: predicted bulk effect, predicted interface effect, coupling logic, evidence strength (low/medium/high), key assumptions, and falsification signals.  
   *Gate: If hypotheses are not falsifiable or lack a clear falsification signal, return to step 1.*

3. **Design minimal validation matrix.** Construct the smallest experiment set that can discriminate among hypotheses.
   - **Baseline:** standard condition without the proposed lever.
   - **Negative controls:** inert analogs, component-removal, or reactant-absent conditions.
   - **Positive controls:** known reference conditions when available and appropriate.
   - **Component-isolation:** separate anode, cathode, and electrolyte contributions using half-cells, symmetric cells, or analogous diagnostics.
   - Define independent variables (conceptual formulation changes), dependent variables (mechanism metrics and performance metrics), and stop conditions before data collection.

4. **Collect orthogonal evidence.** Gather at least two independent evidence streams for each hypothesis:
   - Bulk/solvation evidence (coordination environment, transport properties, solvent activity).
   - Interface evidence (adsorption, interphase composition, surface state, impedance evolution).
   - Structural/pathway evidence (phase identity, reversibility, morphology).
   - Electrochemical evidence (efficiency, polarization, rate response, gas accounting).
   *Gate: If only one evidence stream supports a hypothesis, flag as "mechanism incomplete" and do not proceed to device claims.*

5. **Integrate and discriminate.** Build an evidence chain linking formulation change → local chemistry → interface state → kinetic/morphological outcome → device response. Use the evidence matrix to classify each hypothesis as: supported, performance-only, conflicting, or rejected. Apply causal ranking (temporal precedence, specificity, dose-response, control consistency).  
   *Decision: If the intended pathway is supported and competing pathways are excluded, proceed to step 6. If ambiguous, proceed to step 7. If contradicted, proceed to step 8.*

6. **Test boundary conditions and robustness.** Evaluate whether the mechanism holds across relevant stressors (rate, loading, temperature, cycle depth). Check for cross-talk (counter-electrode compatibility, separator effects, electrolyte consumption).  
   *Gate: If the mechanism fails under mild stress or shifts failure to another component, return to step 7.*

7. **Iterate on the weakest link.** Identify the weakest evidence layer and redesign the lever, controls, or measurements.
   - If bulk regulation is weak: revise solvation/coordination strategy.
   - If interface regulation is weak: revise adsorption/interphase chemistry.
   - If kinetics degrade: balance stability against transport.
   - If side reactions shift: identify the new parasitic pathway before optimizing.
   - Update evidence strength and return to step 3 with a revised minimal validation.

8. **Stop or pivot.** Terminate the branch if:
   - The main signal persists under negative controls.
   - Competing products/pathways dominate despite lever variation.
   - The mechanism is contradicted by orthogonal evidence.
   - Safety or compatibility limits are breached.
   - Claims depend on unreplicated single-sample or single-method data.  
   *Pivot to an alternative hypothesis from step 2 or redefine the bottleneck in step 1.*

9. **Validate device relevance (final gate only).** Only after mechanism and component compatibility are strongly supported, evaluate higher-loading, packaged, or application-oriented formats with transparent accounting.  
   *Gate: Do not use device-level performance to compensate for weak mechanism evidence.*

# Output Format

When using this skill, produce:

1. **Research question framing** — coupled bottleneck and target pathway.
2. **Ranked hypotheses** — mechanism claims with evidence strength, assumptions, and failure modes.
3. **Study plan** — minimal validation matrix, controls, variables, and stop conditions.
4. **Analysis plan** — orthogonal evidence streams, integration logic, and causal-ranking criteria.
5. **Validation plan** — robustness checks, boundary tests, and reproducibility requirements.
6. **Control table** — baseline, negative, positive, and component-isolation controls with expected outcomes.
7. **Failure modes & claim boundaries** — known failure modes, extrapolation limits, and what remains unproven.

# Validation Gates

- **Mechanistic specificity:** The experiment tests a pathway mechanism, not only a performance target.
- **Reactant/condition necessity:** A negative control can distinguish background behavior from the intended signal.
- **Product/pathway identity:** At least two orthogonal methods support the dominant reaction pathway.
- **Reversibility tracking:** Formation and removal of the intended product/state are tracked across cycles.
- **Counter-electrode/interface compatibility:** The paired electrode and separator are evaluated under the same chemical environment.
- **Reproducibility:** Independent runs and variability estimates are specified before data collection.

# Claim Boundaries

- Distinguish paper-derived evidence, user-provided data, and new-agent inferences.
- Do not generalize from a single formulation, material, or cell format to the entire field.
- Do not use device-level demonstrations to override weak or incomplete mechanism evidence.
- Label claims as "mechanism-supported," "performance-correlated," or "speculative."

# Failure Modes

- **False mechanism attribution:** Performance improves for unrelated reasons (loading differences, transport blockage, reduced active material usage).
- **Hidden trade-off:** Stability gains at one electrode shift degradation to the counter-electrode or separator.
- **Incomplete control:** The apparent signal persists in negative controls due to unaccounted impurities or artifacts.
- **Single-signal fallacy:** Product or pathway assignment relies on one characterization method.
- **Overextrapolation:** A concentration-regime or architecture trend is treated as universal without boundary testing.

# Validity Checks

- Are confounders (ionic strength, viscosity, pH, conductivity, impurity, loading, geometry) controlled or explicitly accounted for?
- Are primary and secondary endpoints defined before analysis to avoid cherry-picking?
- Is variability reported across independent preparations and repeated measurements?
- Does the evidence chain satisfy temporal precedence, specificity, and dose-response consistency?
- Are boundary conditions stated (temperature, rate, loading, voltage window, cell architecture)?
- Are safety, environmental, and regulatory constraints reviewed at the design level?

# Provenance

- Synthesized from cluster 45.0 ("observable-driven mechanism discovery and validation").
- Source skill references: reversible-metal-oxygen-research (af65cae35628c7eb), zn-aqueous-electrolyte-concentration-regime-exploration (45e2a8e72477c062), electrolyte-phase-transition-battery-discovery (bd4e11a203efd322), nonaqueous-zinc-battery-research-design (2133b916b85416e1), aqueous-zinc-electrolyte-exploration (53f94256d3723d85), flexible-zinc-battery-research-design (f0687cfa0d1a5199), aqueous-zn-interfacial-additive-research (4042866533cd343c), zinc-ion-hybrid-supercapacitor-interface-discovery (8d4bd5faa38b79ee).
- Paper-specific conclusions, numerical parameters, and operational protocols have been removed to produce a reusable workflow.
