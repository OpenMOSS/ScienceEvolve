---
name: sci-aqueous-zinc-aqueous-battery-interface-mechanism-di-5684f8c8
description: A reusable end-to-end workflow for generating mechanism-driven hypotheses, designing controlled validation studies, and iteratively discriminating interfacial mechanisms in aqueous metal battery systems.
scienceevolve-title: "Aqueous battery interfaces · zinc aqueous battery interface mechanism discovery workflow 2"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Help agents transform aqueous battery interface performance bottlenecks into structured research questions, falsifiable hypotheses, and evidence-backed validation plans. The workflow emphasizes mechanism discrimination over empirical optimization, using orthogonal evidence triangulation and strong controls to isolate interfacial effects from bulk artifacts.

# When to use

Use this skill when:
- Exploring new research questions around aqueous metal battery interfaces, including anode stability, electrolyte regulation, deposition morphology, interfacial side reactions, or additive-mediated mitigation.
- Generating competing, mechanism-centered hypotheses for interface-driven failure modes.
- Designing non-operational validation plans with explicit controls, metrics, and stop conditions.
- Discriminating between multiple candidate mechanisms using convergent evidence.
- Iterating a research direction based on partial, contradictory, or ambiguous evidence.

Do not use this skill for direct laboratory execution, hazardous protocol generation, or treating single-study results as field-wide consensus.

# Inputs required

Before producing a plan, request or infer:
- **Target system family**: aqueous metal battery chemistry and cell format class.
- **Dominant failure mode**: nonuniform deposition, corrosion, passivation, gas evolution, impedance growth, or reversibility loss.
- **Candidate intervention class**: additive, substrate texture, electrolyte motif, interfacial architecture, or solvation regulator.
- **Available evidence streams**: electrochemical, spectroscopic, imaging, transport, or computational.
- **Baseline comparator**: standard electrolyte or unmodified interface against which to compare.
- **Control requirements**: negative, positive, orthogonal, and integration controls needed to isolate the mechanism.
- **Intended output**: hypothesis map, validation plan, analysis schema, or iteration strategy.

If inputs are missing, state assumptions explicitly and label downstream claims as provisional.

# Core Workflow

Follow this ordered end-to-end route. At each gate, pause and redesign if the criterion is not met.

1. **System Boundary & Failure Mode Decomposition**
   - Define the aqueous battery family and operating context.
   - Isolate the interface or anode failure mode and separate bulk electrolyte effects from near-electrode effects.
   - Identify hidden variables often uncontrolled (e.g., dissolved gases, local pH, impurity redox chemistry, substrate history).
   - *Gate*: Is the failure mode defined as a coupled transport–interface problem? If not, return to input clarification.

2. **Mechanism-Centered Hypothesis Generation**
   - Generate at least three competing hypotheses that link a molecular or formulation variable to a specific interfacial structure, kinetic pathway, deposition morphology, and cell-level outcome.
   - For each hypothesis, specify: mechanistic lever, expected signals at each scale, evidence strength (preliminary/moderate/strong), key assumptions, likely failure modes, falsifying observations, and boundary conditions.
   - Include an artifact or mismatch hypothesis that attributes apparent improvement to measurement bias, loading differences, or cathode limitation.
   - *Gate*: Are all hypotheses falsifiable and mechanism-specific (not merely “performance will improve”)? If not, refine before proceeding.

3. **Minimum Viable Validation Design**
   - Design a non-operational study schema: baseline, negative control (inactive analogue), positive control (known benchmark if appropriate), orthogonal control (isolates one mechanism while holding another constant), and integration control (half-cell to full-cell).
   - Define independent variables at the abstraction level of mechanism classes; dependent variables spanning chemical, interfacial, morphological, and electrochemical outcomes; and confounders to measure or bound.
   - Predefine primary metrics (directly tied to the mechanism), secondary metrics (cell-level performance), and diagnostic metrics (interface composition, morphology, impedance evolution).
   - Define stop/redesign conditions: safety-relevant instability, mechanism-specific diagnostics absent despite performance change, or controls explaining the effect.
   - *Gate*: Does the design isolate the proposed mechanism from bulk-property artifacts (conductivity, viscosity, pH, concentration)? If not, redesign controls.

4. **Evidence Acquisition & Triangulation**
   - Gather orthogonal evidence across scales: molecular/speciation → interfacial structure → nucleation/growth kinetics → deposit morphology → half-cell reversibility → full-cell stability.
   - Require at least two independent evidence streams before promoting a mechanism from plausible to supported.
   - Do not treat single-metric improvement (e.g., cycling life alone, or a single morphology image) as proof of mechanism.
   - *Gate*: Is there independent evidence at multiple links of the proposed causal chain? If a link is missing, flag it as a weak link and add the smallest diagnostic needed to test it.

5. **Mechanism Discrimination & Attribution**
   - Map all evidence to the hypothesis set using a mechanism-to-evidence matrix.
   - Use control attribution to rule out baseline mismatch, cathode limitation, substrate artifacts, and nonspecific bulk effects.
   - Exclude hypotheses inconsistent with controls; rank surviving hypotheses by convergence of independent diagnostics.
   - *Gate*: Do controls rule out all major alternative explanations? If not, withhold mechanism claims and downgrade evidence strength.

6. **Claim Bounding & Robustness Check**
   - Bound claims to the tested chemistry, cell format, and operating window.
   - Distinguish verified observations from analogical inferences and speculative extrapolations.
   - Check boundary conditions: half-cell versus full-cell, laboratory-scale versus application-scale, and aqueous versus non-aqueous analogies.
   - *Gate*: Are claims explicitly bounded and labeled by evidence class (verified / analogical / speculative)? If claims extrapolate beyond evidence, return to hypothesis refinement.

7. **Iteration or Redesign**
   - Evaluate the evidence pattern:
     - **Supported**: formation, mechanism, electrochemistry, morphology, and device-level evidence agree. Advance to more realistic cell formats or broader operating windows.
     - **Partially supported**: one evidence layer supports the hypothesis but another is missing. Add the specific diagnostic that resolves the missing link and return to step 4.
     - **Contradicted**: interface forms but worsens stability, or mechanism diagnostics move opposite to prediction. Revise or retire the hypothesis and return to step 2.
     - **Inconclusive**: confounding variables or high variability obscure interpretation. Resolve reproducibility and return to step 3.
   - **Stop conditions**: halt if safety-relevant instability appears; if the intervention improves performance without changing the proposed mechanism; if mechanism evidence improves without reversibility gains; or if half-cell results fail to transfer to full cells without explanation.

# Output Format

Return results in this structure:

1. **Research question framing**
   - Target system family
   - Failure mode and hidden variables
   - Candidate mechanism
   - Significance

2. **Ranked hypothesis map**
   - Hypothesis statement
   - Mechanistic lever(s)
   - Evidence strength
   - Key assumptions
   - Predicted diagnostic signals (molecular, interfacial, morphological, electrochemical)
   - Likely failure modes
   - Boundary conditions

3. **Validation plan**
   - Minimum viable validation schema
   - Control hierarchy (baseline, negative, positive, orthogonal, integration)
   - Variables and confounders
   - Primary, secondary, and diagnostic metrics
   - Stop/redesign conditions

4. **Analysis plan**
   - Mechanism-to-evidence matrix
   - Control attribution logic
   - Failure-mode classification
   - Uncertainty quantification and normalization rules
   - Boundary tests

5. **Iteration strategy**
   - Conditions that strengthen the hypothesis
   - Conditions that weaken or falsify it
   - Next diagnostic or redesign step
   - Stop/go rules

6. **Validity and safety notes**
   - Confounders to measure or bound
   - Reproducibility checks
   - Claim boundaries and extrapolation limits
   - Non-operational safety and ethics constraints

# Validation Gates

- **Confounding control**: Purity, substrate history, surface roughness, loading, electrolyte inventory, separator behavior, cell geometry, and measurement normalization must be controlled or measured.
- **Control adequacy**: Baseline, sham-processed, negative, positive, orthogonal, and integration controls must be present and appropriate to the mechanism.
- **Metric relevance**: The primary metric must directly test the proposed mechanism; secondary metrics must not trade off fundamental safety or reversibility.
- **Mechanism specificity**: The evidence chain must link molecular or interfacial signals to electrochemical outcomes without relying solely on performance endpoints.
- **Reproducibility**: Replicate logic, variability reporting, outlier handling, and exclusion criteria must be predefined.
- **Boundary fidelity**: Claims must distinguish half-cell from full-cell, lab-scale from application-scale, and the tested aqueous chemistry from analogical systems.

# Claim Boundaries

- Distinguish observations verified in the target system from analogical inferences drawn from literature.
- Label source-review claims as reviewed evidence, not universal consensus.
- Do not generalize across metal chemistries, electrolyte families, or cell formats without cross-system validation.
- Treat performance improvement alone as insufficient proof of mechanism.
- Treat single-study results as case studies requiring independent replication before field-level assignment.

# Failure Modes

- **Compatibility trap**: The hypothesis is merely compatible with data but not necessitated by it.
- **Bulk-property confound**: The intervention improves performance via conductivity, viscosity, pH, or concentration rather than the proposed interfacial mechanism.
- **Half-cell/full-cell disconnect**: Gains observed in simplified cells fail to transfer to practical full cells without mechanistic explanation.
- **Morphology–reversibility split**: Deposition morphology improves while Coulombic efficiency or long-term stability does not, indicating hidden side reactions.
- **Control match**: Controls reproduce the intervention effect, indicating a nonspecific or artifactual cause.
- **Single-scale fallacy**: A conclusion relies on one evidence stream (e.g., only spectroscopy or only cycling data) without triangulation.
- **Boundary overreach**: Claims extrapolate beyond tested chemistries, formats, or operating windows.

# Validity Checks

Before finalizing any plan or conclusion, verify:
- The research question is specific to an interfacial mechanism, not a broad performance target.
- Baseline and candidate comparisons are matched in all relevant variables except the mechanism-linked factor.
- Bulk-property changes are measured or bounded separately from interfacial effects.
- Cathode-side, separator, and current-collector artifacts are separated from anode/interface effects.
- Spectroscopic or imaging claims are treated cautiously and supported by complementary diagnostics.
- Statistical criteria, replicate definitions, and exclusion rules are predefined.
- Safety, ethics, and compliance boundaries are respected at the design-review level.
- Source-specific observations are labeled as such and not presented as universal defaults.

# Provenance

- Synthesized from cluster 2.0 (observable-driven mechanism discovery and validation).
- Derived from source skills: aluminum-anode-interface-research (6c07dabb9f59cf2b), flexible-energy-storage-research-design (ad27510a05a8441c), aqueous-zn-interfacial-research (f4cec9b89cc9f778), aqueous-zinc-anode-research-exploration (a456ad4636f2fc02), metal-electrolyte-interface-research-design (aa9289a223aea606), aqueous-battery-dissolved-oxygen-exploration (27f8684d0c1cc45b), zinc-bromine-flow-battery-research (b85fdab977d59f1c), heterogeneous-interface-metal-anode-research (5034f09cd2436189).
