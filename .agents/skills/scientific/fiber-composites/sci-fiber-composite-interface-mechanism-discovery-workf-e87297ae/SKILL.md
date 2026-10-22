---
name: sci-fiber-composite-interface-mechanism-discovery-workf-e87297ae
description: Transform a materials performance bottleneck into a structured, mechanism-driven research plan for multifunctional composites, interfaces, or fiber-based architectures through observable-driven discovery and validation.
scienceevolve-title: "Fiber composites and battery materials · composite interface mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Transform a materials performance bottleneck into a structured, mechanism-driven research plan for multifunctional composites, interfaces, or fiber-based architectures. The skill guides hypothesis generation, controlled multi-level validation, and iterative refinement while keeping mechanism claims separable from implementation details.

# When to use

Use this skill when exploring new research questions in composite materials, interfacial engineering, fiber architectures, electrochemical energy storage, catalytic/support systems, or related domains where a performance gap may be addressed by coupling multiple functions such as transport, confinement, mechanical buffering, or active-site chemistry. Trigger when the user needs to design experiments that connect structure to function through layered evidence, not when reproducing a specific recipe or operational protocol.

# Inputs required

Ask for or identify:

- **Target system class** and dominant performance bottleneck.
- **Suspected limiting mechanism** (transport, interfacial, chemical, mechanical, or morphological).
- **Candidate architecture or component classes** (e.g., matrix, filler, scaffold, coating, binder, electrolyte, catalyst support) without assuming specific chemistries.
- **Available characterization capabilities**, stated as capability categories (e.g., microscopy, spectroscopy, electrochemical analysis, scattering) rather than step-by-step protocols.
- **Constraints**, including safety, sustainability, reproducibility, and non-operational boundaries.

# Core Workflow

1. **Bottleneck Decomposition**
   - Define the dominant performance-limiting mechanism (e.g., transport loss, interfacial degradation, mechanical failure, active-site inaccessibility).
   - Separate the bottleneck from material preferences or implementation details.
   - *Stop condition*: If the bottleneck cannot be linked to an observable structural, chemical, or transport variable, restate the research question.

2. **Architecture–Chemistry Separation**
   - Map architectural variables (morphology, porosity, hierarchy, dispersion, interface arrangement) independently from chemical variables (active-site identity, bonding, redox state, surface chemistry).
   - Treat each as a distinct hypothesis axis.

3. **Mechanism-Linked Hypothesis Generation**
   - Generate 3–5 falsifiable hypotheses that couple structure to function.
   - For each, label: evidence strength (paper-supported / inferred / speculative), key assumptions, discriminating prediction, and likely failure mode.
   - *Decision gate*: If a hypothesis cannot be falsified with available capabilities, narrow scope or request additional inputs before proceeding.

4. **Multi-Level Control Design**
   - Design experiments across material, interface, and device levels.
   - Mandated controls: baseline (conventional system), negative/inert (removes active feature), mechanism control (isolates architecture vs. chemistry), and process control (matched processing history).
   - Define independent variables, dependent variables, normalization basis, and pre-defined stop criteria.
   - *Decision gate*: If controls cannot isolate the proposed mechanism, redesign the experiment before execution.

5. **Structural Verification**
   - Confirm intended architecture, composition, dispersion, and stability before interpreting any performance data.
   - *Stop condition*: If the intended structure is absent, irreproducible, or compromised, halt performance evaluation and iterate on synthesis or processing.

6. **Performance and Transport Evaluation**
   - Measure target function and core transport requirements under matched conditions.
   - Report normalized metrics, sample-to-sample variability, and early-cycle vs. long-term behavior separately.
   - *Stop condition*: If core transport or mechanical integrity degrades beyond acceptable bounds, stop and revise.

7. **Mechanism Triangulation**
   - Integrate evidence from structure, chemistry, transport, and performance.
   - Advance claims only when at least two orthogonal data streams converge on the same mechanism.
   - *Decision gate*:
     - **Supported**: all evidence aligns → proceed to robustness checks and boundary expansion.
     - **Partial**: some evidence aligns → revise the specific architectural or chemical variable that is unsupported.
     - **Refuted**: controls match or exceed candidate performance → abandon the hypothesis and return to Step 2.
     - **Inconclusive**: high variability or missing controls → improve reproducibility or add mechanism controls before iterating.

8. **Iteration or Termination**
   - **Advance**: expand to stronger validation (additional loadings, architectures, or operating contexts).
   - **Revise**: reframe one hypothesis axis (architecture or chemistry) while holding the other constant.
   - **Stop**: terminate if safety limits are breached, reproducibility fails, controls invalidate the effect, or the mechanism cannot be isolated.
   - Update evidence strength labels after each cycle.

9. **Boundary-Aware Synthesis**
   - Document demonstrated findings, inferred mechanisms, and speculative extensions.
   - State explicit boundary conditions (tested chemistries, geometries, and contexts).
   - Archive the final mechanism map and unresolved questions for future cycles.

# Output Format

Return a structured research plan containing:

1. **Research question** and mechanistic bottleneck.
2. **Hypothesis table**: mechanism, evidence strength, key assumptions, failure mode, and discriminating prediction.
3. **Experimental design**: variables, controls, minimal viable validation, and stop conditions.
4. **Analysis plan**: structural checks, performance comparisons, confounder checks, and visualization strategy.
5. **Iteration decision tree**: advance / revise / stop rules linked to evidence patterns.
6. **Validity, boundary, and safety notes**.

# Validation Gates

- **Structure-before-function gate**: Intended architecture confirmed before performance claims.
- **Control gate**: Baseline and negative controls rule out processing artifacts and non-specific effects.
- **Mechanism-specificity gate**: Each control isolates one proposed architectural or chemical function.
- **Reproducibility gate**: Independent samples show consistent trends with transparent variability reporting.
- **Safety gate**: The plan remains at the research-design level and respects institutional safety, environmental, and non-operational boundaries.

# Claim Boundaries

- Distinguish paper-supported patterns from agent-inferred extensions and speculative extrapolations.
- Do not generalize from a single material system or prototype to field-wide consensus.
- Separate component-level improvements from full-device causality.
- Avoid presenting relative composition changes as absolute yield, scalability, or deployment readiness.
- Do not transfer specific parameters or architectures to new systems without fresh structural and functional evidence.

# Failure Modes

- **Structure failure**: Architecture collapses, disperses poorly, or lacks the intended active feature.
- **Chemistry failure**: Active component is inactive, unstable, or dominated by support/matrix effects.
- **Performance artifact**: Improvement caused by loading differences, normalization bias, processing history, or uncontrolled variables.
- **Mechanism mismatch**: Performance improves but orthogonal evidence contradicts the proposed mechanism.
- **Reproducibility failure**: High sample-to-sample variability or irreproducible preparation.
- **Safety stop**: Uncontrolled side reactions, hazardous byproducts, or breach of non-operational boundaries.

# Validity Checks

- **Confounding**: Control mass, porosity, conductivity, adhesion, loading, film thickness, and batch variation.
- **Alternative explanations**: Consider processing artifacts, electrode variability, instrument calibration, and environmental exposure.
- **Statistical handling**: Use pre-defined success criteria, outlier rules, and transparent variability reporting.
- **Boundary conditions**: Limit claims to tested chemistries, geometries, and operating contexts.
- **Evidence labeling**: Clearly mark paper-supported, inferred, and speculative statements.
- **Normalization consistency**: Ensure metrics are normalized on a comparable basis across all samples.

# Provenance

- Synthesized from cluster 52.0 (composite-interface-fiber-battery-mechanism-discovery-workflow).
- Derived from source skills: `li-s-composite-electrode-exploration`, `multifunctional-nanocomposite-coating-research`, `sustainable-hydrogel-supercapacitor-research`, `surface-roughened-electrospun-fiber-design`, `lis-battery-functional-binder-exploration`, `structured-catalyst-support-research-design`, `polymer-electrolyte-multifunctional-battery-exploration`, `metal-oxide-nanoparticle-coating-research`.
- Preserves the observable-driven mechanism discovery and validation archetype without transferring paper-specific parameters, materials, or conclusions.
