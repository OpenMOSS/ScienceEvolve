---
name: sci-neuro-observable-driven-mechanism-discovery-workflo-e6e32ced
description: Guide the conversion of an observable response gap into a discriminated mechanistic explanation through hypothesis generation, controlled comparison, and iterative validation across excitable, transport, and adaptive systems.
scienceevolve-title: "Neuromorphic computing and Ising optimization · observable driven mechanism discovery workflow"
scienceevolve-area: neuromorphic-computing-and-ising-optimization
---

# Purpose

Guide agents in converting an observable response gap into a bounded, discriminated mechanistic explanation. The workflow generates testable hypotheses, designs minimal validation comparisons, and iterates on evidence while keeping claims separated from source-specific conclusions.

# When to use

Use this skill when the user asks to:

- Propose new research questions about a measurable response that is poorly understood, ambiguous, or confounded by background effects.
- Separate overlapping components of a complex response or infer a hidden variable that may govern a transport, plasticity, synaptic, neuronal, or phase-transition phenomenon.
- Design non-operational validation plans that distinguish competing mechanisms via controlled perturbations and readouts.
- Interpret existing data with explicit attention to confounders, stability, causal specificity, and claim boundaries.

Do not use this skill for clinical advice, therapeutic recommendations, executable wet-lab or fabrication protocols, or field-wide consensus claims based on a single source.

# Inputs required

Before generating a plan, identify or request:

- **Observable response gap:** the measurable phenomenon that needs explanation.
- **Target system class:** the general domain (e.g., excitable cell, synaptic circuit, magnetic multilayer, phase-transition material) without assuming a specific preparation.
- **Candidate mechanisms or hidden variables:** proposed mediators, effectors, textures, or pathways that could explain the response.
- **Available perturbations and readouts:** non-operational descriptions of independent variables and dependent variables at both mechanism and phenotype levels.
- **Known confounders and background contributions:** factors such as geometry, batch variation, contact effects, cell health, measurement artifacts, or competing pathways.
- **Decision criteria:** thresholds for accepting, revising, or abandoning a hypothesis.

# Core Workflow

1. **Define the observable response gap.**
   - State the measurable phenomenon that is unexplained, weak, or hard to separate from background.
   - Decompose the response into candidate components (e.g., temporal, spatial, functional) or identify a hidden variable / mediator predicted to govern it.
   - **Decision gate:** Is the response quantifiable and distinct from background? If not, refine the readout or measurement scope before proceeding.

2. **Build competing mechanism hypotheses.**
   - Construct at least two causal chains linking perturbation → mediator / hidden variable → effector → observable response.
   - For each hypothesis, specify discriminating predictions: onset, scaling, reversibility, symmetry dependence, or component-specific signatures.
   - Label evidence strength (e.g., source-supported pattern, cross-system analogy, agent inference, speculative), key assumptions, and likely failure modes.
   - **Decision gate:** Are the hypotheses mutually discriminable with available non-operational perturbations and readouts? If not, redesign the question or narrow the scope.

3. **Design minimal viable validation.**
   - Define an abstract comparison matrix:
     - *Independent variables:* parameters that tune the hidden variable or preferentially affect one model element.
     - *Dependent variables:* readouts at the mechanism level and the phenotype level.
     - *Controls:* negative, positive, background / orthogonal, sham, and mechanism-specific conditions.
   - Predefine stop conditions and failure criteria (e.g., nonspecific perturbation, loss of stability, ambiguous source attribution).
   - **Decision gate:** Does the design isolate the target mechanism from known confounders? If not, add mechanism controls or tighten boundary constraints.

4. **Collect evidence and audit quality.**
   - Gather readouts mapped to each link in the causal chain.
   - Verify baseline stability, sample comparability, and absence of global state changes (e.g., health degradation, batch drift, geometric artifacts).
   - Flag data-quality issues before interpreting biology or physics.
   - **Decision gate:** Are stability and specificity sufficient to proceed? If not, stop and redesign the measurement or perturbation logic.

5. **Discriminate mechanisms.**
   - Compare observations against each hypothesis’s predictions.
   - Decompose target vs. background contributions using symmetry, geometry, reference comparisons, or model-based subtraction.
   - Assess temporal order, co-variation between mediator and output, and consistency of scaling / sign.
   - Require convergence across multiple diagnostics before strengthening a claim.
   - **Decision gate:** Does evidence strongly favor one hypothesis over alternatives? If ambiguous, mark the leading alternative and proceed to iteration.

6. **Iterate or bound the claim.**
   - *If supported:* Strengthen the mechanism model, seek orthogonal validation, and test boundary conditions (system class, geometry, developmental stage, environmental window).
   - *If partially supported:* Refine the causal chain (e.g., add a parallel pathway, adjust the mediator, narrow the boundary) and design the next decisive test.
   - *If contradicted:* Reject the mechanism, assess whether the platform or measurement failed, and reformulate.
   - **Stop / redirect conditions:**
     - Controls fail or responses are unstable.
     - Perturbation is nonspecific (affects multiple model layers simultaneously).
     - The hidden variable cannot be inferred independently.
     - Background or confounder explains the response.
     - No feasible discriminator remains between leading alternatives.
     - Safety or ethics constraints are violated.

7. **Package outputs with explicit boundaries.**
   - Deliver the research product with claim limits, residual uncertainty, evidence labels, and provenance.

# Output Format

When using this skill, return:

1. **Research question and response gap:** one concise question and why it matters mechanistically.
2. **Component or hidden-variable model:** table of response components / candidate mediators, proposed drivers, predicted readouts, and uncertainty.
3. **Ranked competing hypotheses:** for each, state the causal claim, evidence strength, key assumptions, predicted signatures, and likely failure modes.
4. **Minimal validation design matrix:** non-operational variables, controls, primary and secondary readouts, and stop conditions.
5. **Analysis plan:** decomposition logic, comparison method, uncertainty quantification, and criteria for mechanism attribution.
6. **Iteration rules:** what result would strengthen, weaken, redirect, or abandon each hypothesis.
7. **Validity and boundary statement:** confounders, reproducibility requirements, scope of inference, and safety constraints.

# Validation Gates

Before presenting conclusions, confirm:

- **Specificity:** The perturbation has a plausible target and an orthogonal test is available.
- **Separation:** Components, mechanisms, or background contributions are measured in non-overlapping windows or with a defensible decomposition method.
- **Stability:** Baseline response, resting state, and system health are stable enough for interpretation.
- **Confounder control:** Batch, geometry, contact, developmental stage, cell identity, or measurement artifacts are addressed.
- **Mechanistic alignment:** Mediator and output changes co-vary in the predicted direction, onset, and scaling.
- **Causal logic:** Necessity, sufficiency, temporal order, and localization are tested where feasible.
- **Statistical validity:** Endpoints are predefined, nested data are handled, effect sizes and uncertainty are reported, and multiple comparisons are accounted for.
- **Boundary scope:** The claim is bounded to the tested system class and condition set.

# Claim Boundaries

- Distinguish source-paper observations from agent-inferred hypotheses in every output.
- Label evidence strength for every claim (e.g., source-supported, cross-system analogy, agent inference, speculative).
- Do not present a single source study as field-wide consensus.
- Separate observation from inference from design implication.
- Limit generalization to the tested material class, cell type, circuit context, geometry, or environmental window.
- Treat fitted parameters, concentration-response summaries, and kinetic constants as system-specific, not universal constants.

# Failure Modes

- Ambiguous perturbation specificity: the manipulation affects multiple layers of the causal chain at once.
- Hidden variable cannot be inferred independently from the target response.
- Background contribution (anisotropic, switching, geometric, contact, thermal, or health-related) explains the observed effect.
- Nonspecific system stress or global state change masquerades as mechanism-specific regulation.
- Non-monotonic or irreversible behavior invalidates the assumed simple causal model.
- Pathway or receptor readout is not specific to the proposed mechanism.
- Batch, deposition drift, contamination, or measurement artifacts dominate the signal.
- Competing mechanisms produce indistinguishable predictions given the available diagnostics.

# Validity Checks

- **Evidence integrity:** Verify traceability of figures, traces, and summary statistics to correct conditions; flag corrected or ambiguous data before building mechanisms.
- **Confounding:** Assess cell stress, viability, rundown, solvent effects, temperature shifts, oxidation, substrate effects, and sample history.
- **Reproducibility:** Require repeated cycles, independent samples, batch variation checks, calibration records, and clear baseline definitions.
- **Statistical validity:** Predefine primary outcomes, report variability and effect sizes, handle nested observations appropriately, and correct for multiple comparisons.
- **Boundary conditions:** State when the hypothesis depends on a specific developmental stage, cell subtype, material phase, interface geometry, stimulus modality, or environmental window.
- **Scope control:** Avoid generalizing from one system to all neurons, synapses, channels, materials, or device architectures.

# Provenance

- Synthesized from cluster 15.0 (transport-plasticity-synaptic-neuronal-mechanism-discovery).
- Source skill references: `calcium-ahp-excitability-workflow`, `ion-channel-pharmacology-exploration`, `stimuli-responsive-phase-transition-research`, `erratum-guided-synaptic-plasticity-research`, `compartment-aware-homeostatic-plasticity-research`, `exchange-spring-transport-exploration`, `synaptic-homeostatic-turnover-exploration`, `interface-mediated-spintronic-optimization`.
- Preserves only transferable methodological patterns; excludes source-specific systems, materials, parameters, numerical results, and paper conclusions.
