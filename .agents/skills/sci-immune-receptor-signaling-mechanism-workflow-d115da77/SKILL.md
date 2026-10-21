---
name: sci-immune-receptor-signaling-mechanism-workflow-d115da77
description: Reusable end-to-end workflow for dissecting membrane receptor activation mechanisms through binding, domain, proximal signaling, and accessory-factor studies.
scienceevolve-title: "Antibody and immune recognition · receptor signaling mechanism workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Synthesize a reusable agent instruction for dissecting how a membrane receptor becomes activated, combining evidence from ligand binding, modular domain function, proximal signaling events, and accessory or co-receptor contributions. The workflow guides hypothesis generation, staged validation, mechanism discrimination, and iterative refinement without reproducing any single paper's specific system, materials, or conclusions.

# When to use

Trigger this skill when the user needs to:
- Dissect the causal chain from an extracellular trigger to a cellular response for a membrane receptor system.
- Distinguish direct binding, conformational change, proximal signaling, and downstream functional consequences.
- Evaluate whether a receptor domain, accessory factor, or proximal regulatory region is necessary or sufficient for activation.
- Design controls and readouts that separate specific recognition from nonspecific effects, artifacts, or indirect mediator loops.

Do not use for clinical recommendations, operational wet-lab protocols, therapeutic dosing, or as a source of field-wide consensus from a single study.

# Inputs required

- **Biological system**: cell or membrane context, receptor complex, ligand or trigger family, and candidate modulatory molecule.
- **Observed phenotype**: binding event, signaling marker, receptor exposure, or functional readout to be explained.
- **Candidate mechanism map**: direct engagement, domain-level requirement, conformational dependence, accessory-factor dependence, or indirect signaling loop.
- **Available evidence**: prior binding data, structural or sequence models, genetic evidence, known inhibitors, or control reagents.
- **Constraints**: biosafety, ethics, sample availability, reproducibility standards, and limits on extrapolation.

# Core Workflow

1. **Map the activation chain and identify the gap**  
   Decompose the pathway into trigger → target engagement → conformational/assembly change → proximal signaling → functional response. Identify the weakest causal edge or unresolved state transition.

2. **Generate competing hypotheses**  
   Formulate falsifiable alternatives: direct interaction, indirect mediator, domain necessity/sufficiency, accessory-factor dependence, parallel pathway, context dependence, and artifact. Label each with evidence strength, key assumptions, and likely failure modes.

3. **Gate 1: Specific binding validation**  
   Confirm that the trigger or candidate module engages the intended target above matched background. Use receptor-negative/blockade, irrelevant-trigger, and assay-background controls.  
   *Stop/Iterate*: If specific binding is absent or indistinguishable from background, stop mechanistic inference and test artifact or alternative-target hypotheses.

4. **Gate 2: Domain and conformational state resolution**  
   Test whether minimal domains, specific folded states, or oligomeric assemblies are necessary or sufficient for recognition. Include integrity checks, competition/blockade logic, and folded-vs-unfolded contrasts.  
   *Stop/Iterate*: If activity tracks with misfolding, aggregation, or linear sequence only, pivot to structural or artifact explanations.

5. **Gate 3: Separation of binding from activation competence**  
   Determine whether target engagement produces proximal signaling and downstream function. Distinguish ligand occupancy from receptor clustering, co-receptor recruitment, or signaling assembly.  
   *Stop/Iterate*: If binding occurs without function, probe missing co-signals, presentation state, or response thresholds; if function occurs without binding, investigate indirect mediators or assay interference.

6. **Gate 4: Accessory-factor and context discrimination**  
   Evaluate whether the primary receptor alone is sufficient or whether accessory molecules, co-receptors, or cell-state context are required. Use selective perturbations with general-responsiveness controls.  
   *Stop/Iterate*: If accessory perturbation globally suppresses the assay or positive controls fail, treat as nonspecific; if selective, refine the cooperative model.

7. **Gate 5: Mechanism integration and claim bounding**  
   Integrate evidence from all gates into a causal graph. Score overall evidence (high/moderate/low/speculative) based on orthogonal convergence and control passage. Explicitly define boundary conditions (cell type, receptor variant, activation state, presentation mode).  
   *Stop/Iterate*: If evidence layers conflict, specify the smallest discriminator experiment and return to the relevant gate; if converged, document residual uncertainty and stop.

# Output Format

When using this skill, produce:

1. **Research question and causal graph** — Concise question and a trigger-to-function chain with the weakest edge highlighted.
2. **Hypotheses table** — Competing hypotheses with evidence strength, key assumptions, and likely failure modes.
3. **Staged validation plan** — Per-gate controls, readouts, minimal viable validation, and predefined stop criteria.
4. **Analysis plan** — Calibration, specific/nonspecific separation, normalization, dose-response/time-course logic, and evidence-grading rubric.
5. **Iteration decision tree** — Continue, pivot, or stop rules for each gate outcome.
6. **Validity and boundary statement** — Confounders, reproducibility requirements, native-context gaps, and extrapolation limits.

# Validation Gates

- **Gate 1: Specific binding** — Target engagement is confirmed above matched background with orthogonal target-identity controls.
- **Gate 2: Domain/State dependence** — Minimal modules or conformational states show necessity or sufficiency under integrity-checked conditions.
- **Gate 3: Functional competence** — Proximal signaling and downstream function are receptor-dependent and separable from binding alone.
- **Gate 4: Accessory/Context selectivity** — Accessory-factor or context effects are selective and not due to global assay suppression.
- **Gate 5: Cross-layer coherence** — Binding, domain, signaling, and accessory evidence converge on a single causal graph.

# Claim Boundaries

- Claims are limited to the tested receptor, ligand/trigger, cell context, and assay geometry.
- Binding evidence does not imply functional consequence; functional evidence does not imply a specific molecular mechanism.
- Findings from recombinant domains, engineered cells, or model membranes are not equivalent to native-state biology without explicit validation.
- Single-system observations are not presented as field-wide consensus.

# Failure Modes

- Nonspecific binding or aggregation mimics specific recognition.
- Domain truncation or perturbation disrupts global folding rather than removing a functional determinant.
- Assay artifacts (labeling, fixation, detection cross-reactivity, calibration drift) produce false binding or signaling.
- Indirect mediator loops or secreted factors create apparent direct effects.
- Off-target perturbations globally disable cells or assays, mimicking specific pathway inhibition.
- Threshold effects or assay saturation obscure true dose-response relationships.
- Unmeasured cell activation state, donor variability, or batch effects confound context-dependent claims.

# Validity Checks

- **Specificity**: Does the trigger/module bind the intended target above background and fail in receptor-negative or blockade controls?
- **Receptor dependence**: Does the response require the intended receptor or partner?
- **Orthogonality**: Are key claims supported by more than one assay class or readout?
- **Control integrity**: Do positive, negative, matched-background, and molecule-integrity controls behave as expected?
- **Native-state relevance**: Is the evidence derived from biologically plausible presentation states?
- **Statistical validity**: Are endpoints predefined, replicates independent, and uncertainty reported?
- **Reproducibility**: Are findings consistent across independent preparations or contexts?
- **Evidence separation**: Are source-paper patterns clearly separated from new agent-generated inferences?

# Provenance

- Derived from cluster 14, subcluster 14.0.split0.
- Synthesized from source skills: e0e33cfde39ffcb3, d46e64dc570d9c0c, c94d8df42e781d0e, 0b9986fef9d847cf, 129cf3dca8c5fe40.
- Retains the shared scientific pattern of end-to-end mechanism discovery through layered validation, without source-specific systems, materials, parameters, numerical results, or paper conclusions.
