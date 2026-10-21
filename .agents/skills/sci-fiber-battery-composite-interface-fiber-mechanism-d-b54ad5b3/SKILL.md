---
name: sci-fiber-battery-composite-interface-fiber-mechanism-d-b54ad5b3
description: Reusable end-to-end workflow for discovering and validating interfacial and transport mechanisms in battery composites, interfaces, and fibrous architectures through observable-driven hypothesis testing and controlled experimentation.
scienceevolve-title: "Fiber composites and battery materials · battery composite interface fiber mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

This skill provides a transferable, end-to-end workflow for designing research that discovers and validates mechanisms in heterogeneous material systems—such as composite electrodes, functional interfaces, and architected fibers—where performance is governed by coupled transport, interfacial, conversion, or mechanical processes. It helps an agent move from a performance bottleneck to a rigorously tested mechanism without relying on source-specific material recipes or operational protocols.

## When to use

Use this skill when the user asks to:

- Propose new mechanism-centered research questions for composite, interfacial, or fibrous architectures in electrochemical or functional materials.
- Design experiments that separate structural effects from chemical effects using matched controls.
- Generate hypotheses with falsifiable signatures and explicit evidence-strength labels.
- Plan analysis workflows that triangulate mechanisms across multiple diagnostics.
- Iterate a design based on cross-diagnostic evidence rather than single-metric performance.

Do not use this skill for direct laboratory execution, operational fabrication recipes, hazardous procedural details, or unrelated domains without explicit analogy framing.

## Inputs required

Collect or infer the following before generating a plan:

- **Target system and bottleneck:** the performance failure (e.g., capacity fade, polarization growth, mechanical degradation) reframed as a transport, interfacial, or kinetic limitation.
- **Candidate architectures:** composite host, functional coating, interlayer, fiber scaffold, or other structured design concepts.
- **Design levers:** structural variables (porosity, connectivity, confinement, deformation mode) and chemical variables (surface functionality, catalytic activity, binding affinity).
- **Available diagnostics:** electrochemical, imaging, spectroscopic, mechanical, or modeling tools capable of resolving time-resolved or spatially resolved mechanism signatures.
- **Constraints:** safety boundaries, equipment limits, scalability goals, and whether the plan is conceptual, computational, or high-level experimental.
- **Evidence base:** relevant literature beyond any single source to avoid overgeneralizing paper-specific observations.

If inputs are missing, state assumptions and produce a conditional plan rather than a fixed prescription.

## Core Workflow

Follow this ordered route. Do not skip decision gates.

1. **Bottleneck Reframing**
   - Convert the broad performance failure into 1–3 testable mechanistic subquestions about species transport, interfacial reaction, electron/ion pathway, or mechanical stability.
   - **Gate:** Stop if the bottleneck cannot be expressed as an observable variable (e.g., a migration front, an impedance component, a morphology change, or a spectral feature).

2. **Mechanism-Centered Hypothesis Generation**
   - Produce 2–4 hypotheses that link one design variable to a predicted observable signature.
   - For each hypothesis record: proposed mechanism, predicted signature, evidence strength (high/medium/low), key assumptions, and likely failure modes.
   - **Gate:** Falsifiability check. If no available diagnostic can falsify the hypothesis, reformulate or deprioritize it before proceeding.

3. **Control-Centric Experiment Design**
   - Select one dominant independent variable to isolate the proposed mechanism.
   - Define dependent variables as both performance metrics and mechanism-specific metrics.
   - Establish a control hierarchy:
     - *Negative control:* absence of the proposed functional feature.
     - *Scaffold-only control:* physical structure or conductivity without the proposed chemical/interfacial function.
     - *Function-disabled control:* chemically similar but mechanistically inactive analogue.
     - *Positive/benchmark control:* known effective comparator, used for relative assessment only.
   - Define stop conditions upfront (e.g., controls fail, signatures are irreproducible, or confounding variables cannot be matched).
   - **Gate:** Control adequacy review. If the control set cannot separate structural effects from chemical effects, redesign before any validation stage.

4. **Multi-Modal Evidence Collection and Alignment**
   - Gather complementary diagnostics capable of resolving transport, interfacial, chemical, and mechanical behavior.
   - Align all time-resolved measurements to a common reference frame (e.g., state of charge, cycle number, deformation step).
   - **Gate:** Calibration and alignment check. Pause if diagnostics are uncalibrated, unnormalized, or mismatched in state; resolve before analysis.

5. **Cross-Diagnostic Mechanism Analysis**
   - Extract reproducible features (onset timing, peak position, front velocity, impedance trend, spectral shift, morphological metric).
   - Construct a consistency matrix that classifies each hypothesis as **supported**, **challenged**, or **unresolved** based on converging or diverging evidence streams.
   - Prefer simple explanatory models that account for multiple observations over complex models that fit a single curve.
   - **Gate:** Mechanism discrimination. If independent diagnostics contradict, do not advance the claim. Redesign the next experiment to resolve the active ambiguity.

6. **Hypothesis Update and Iteration Decision**
   - **Advance:** mechanism is supported by multiple diagnostics; proceed to test boundary conditions or the next design variable.
   - **Refine:** mechanism is plausible but confounded; add controls, increase resolution, or normalize more strictly.
   - **Pivot:** central assumption is contradicted by evidence; return to bottleneck reframing with a new mechanism map.
   - **Stop:** terminate if safety or resource limits are reached, if controls consistently fail, or if the mechanism remains unresolved after redesign.
   - **Gate:** Evidence-strength review. Downgrade any claim to the level of the weakest supporting diagnostic (e.g., single-diagnostic support → provisional only).

7. **Boundary and Transferability Assessment**
   - Identify which conclusions depend on model geometry, loading, cell format, deformation mode, or narrow operating window.
   - Mark any extrapolation beyond tested boundaries as an inference requiring independent validation.

## Output Format

When using this skill, produce:

1. **Research question:** one concise mechanism-centered question.
2. **Evidence-grounded gap map:** what is known, what is inferred, and what remains unresolved.
3. **Hypothesis table:** 2–4 hypotheses with mechanism, predicted signature, evidence strength, key assumptions, and likely failure modes.
4. **Experimental design:** independent variables, control hierarchy, evaluation metrics, and stop conditions.
5. **Analysis plan:** alignment rules, feature extraction criteria, consistency matrix template, and model-comparison strategy.
6. **Iteration decision:** advance, refine, pivot, or stop, with the next most informative test specified.
7. **Validity and safety notes:** confounders, reproducibility requirements, boundary conditions, and non-operational safety constraints.

## Validation Gates

- **Confounding check:** Ensure active-material loading, geometry, porosity, conductivity, processing history, and environmental conditions are matched or explicitly accounted for across comparisons.
- **Control adequacy:** Require negative, scaffold-only, and function-disabled controls for any mechanism claim.
- **Reproducibility:** Observations must show consistent trends across replicates, cycles, or samples before mechanism-level interpretation.
- **Mechanistic specificity:** At least two independent diagnostic streams must converge before a mechanism is treated as supported.
- **Claim proportionality:** Match the strength of the claim to the evidence label (high/medium/low) and avoid presenting single-source observations as field consensus.

## Claim Boundaries

- Distinguish **directly observed facts** from **inferred mechanisms** and from **agent-generated speculation**.
- Limit claims to the tested architecture, material class, and operating regime.
- Do not extrapolate from model-system or low-loading conditions to practical systems without explicit validation.
- Treat improved performance as necessary but insufficient evidence for any specific mechanism.
- Cite source skills only as provenance, not as consensus evidence.

## Failure Modes

- **Confounded mechanism:** Performance change arises from unmatched loading, geometry, or processing rather than the intended mechanism. *Response:* enforce matched controls and strict normalization.
- **Single-diagnostic artifact:** One measurement supports the hypothesis while independent diagnostics contradict it. *Response:* halt advancement; redesign to resolve the discrepancy.
- **Control indistinguishability:** The scaffold-only or function-disabled control performs similarly to the full design. *Response:* weaken or discard the chemical/interfacial hypothesis; test simpler structural alternatives.
- **Irreproducible signature:** The observed effect does not repeat across samples, cycles, or batches. *Response:* stop and inspect uncontrolled variables such as assembly, calibration, or environmental drift.
- **Boundary overreach:** The mechanism is visible only under narrow conditions (e.g., special cell geometry, excess medium, low loading). *Response:* explicitly bound the claim and redesign for broader validation before transfer.

## Validity Checks

Before finalizing a research plan or interpreting results, verify:

- Are chemical, morphological, and mechanical variables separated by appropriate controls?
- Are observations repeated across cycles, samples, and independent diagnostics?
- Are extracted features (imaging contrast, spectral assignments, impedance parameters) validated against standards or complementary methods?
- Are all hypotheses labeled with evidence strength, key assumptions, and predicted failure modes?
- Are paper-verified observations distinguished from new-agent inferences?
- Are safety and institutional review boundaries respected, with no operational hazardous instructions included?

## Provenance

- Synthesized from cluster **58**, subcluster **58.0** (observable-driven mechanism discovery and validation).
- Derived from source skills: `li-s-battery-operando-research-pattern`, `lithium-sulfur-cathode-exploration`, `lithium-sulfur-capillary-cathode-exploration`, `lis-battery-interlayer-research-workflow`, `biomimetic-interfacial-evaporation-research`, `flexible-electrode-multiscale-research-design`, `lithium-sulfur-deposition-research`, `liquid-metal-anchor-battery-research`.
