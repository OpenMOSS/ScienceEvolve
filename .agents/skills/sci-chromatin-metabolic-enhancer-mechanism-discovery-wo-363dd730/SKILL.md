---
name: sci-chromatin-metabolic-enhancer-mechanism-discovery-wo-363dd730
description: A reusable end-to-end workflow for discovering and validating molecular mechanisms linking chromatin architecture, epigenetic states, metabolic signals, and enhancer-driven transcription across biological contexts.
scienceevolve-title: "Chromatin and epigenomic regulation · metabolic enhancer mechanism discovery workflow"
scienceevolve-area: chromatin-and-epigenomic-regulation
---

# Purpose

This skill guides an agent through an end-to-end mechanism discovery workflow that connects upstream drivers—such as metabolic states, signaling inputs, or structural perturbations—to chromatin and epigenetic changes, enhancer activity, and downstream transcriptional or phenotypic outcomes. It provides a reusable pattern to separate competing mechanisms, design orthogonal perturbations, integrate multi-layer evidence, and bound claims appropriately.

# When to use

Use when a user requests research planning, hypothesis generation, or experimental design for questions involving chromatin architecture, epigenetic regulation, metabolic-transcriptional coupling, enhancer-promoter mechanisms, or cell-state transitions where multiple causal explanations are plausible. Do not use for clinical decision-making, patient-specific recommendations, or executable laboratory protocols.

# Inputs required

Before producing a design, ask for or infer:

- **Biological context:** organism, cell type, tissue, disease state, or model system.
- **Phenotype:** the structural, transcriptional, metabolic, or functional outcome to explain.
- **Comparator:** a related state to test specificity (e.g., different disease stage, stress condition, or lineage).
- **Candidate mechanisms:** competing upstream drivers, chromatin or epigenetic layers, or regulatory nodes.
- **Available readouts:** molecular, imaging, sequencing, or computational assays feasible in the setting.
- **Constraints:** ethical, biosafety, sample availability, cost, time, and feasibility limits.
- **Prior evidence:** what is established versus unresolved in the target system.

# Core Workflow

1. **Define Phenotype Boundaries and Specificity**
   - State the phenotype precisely and select a comparator state that could produce similar observations through a different mechanism.
   - Define the distinguishing features expected if the target mechanism is operative.
   - *Decision Gate:* If the phenotype cannot be reliably distinguished from the comparator, refine the phenotype definition or stop.

2. **Map Competing Mechanisms and Generate Hypotheses**
   - List at least two plausible mechanisms linking upstream drivers to the phenotype through chromatin, epigenetic, enhancer, or transcriptional layers.
   - For each mechanism, specify: predicted affected regulatory sub-features, features that should remain unchanged, key assumptions, likely failure modes, and a falsifiable prediction.
   - Label evidence strength (strong, moderate, weak, speculative) and distinguish direct support from inference.
   - *Decision Gate:* If hypotheses are not mutually distinguishable with available readouts, refine predictions or expand assay scope before proceeding.

3. **Design Orthogonal Perturbations and Multi-Layer Readouts**
   - Prefer perturbations that target different mechanisms in separable ways rather than relying on a single intervention.
   - Map readouts to causal layers: upstream driver or metabolic state; chromatin architecture or epigenetic mark; transcription-factor occupancy or accessibility; transcript output; and functional or phenotypic consequence.
   - Include matched controls: baseline, vehicle or procedural, perturbation-validation, positive assay, negative nonspecific, and batch-distributed.
   - Define minimal viable validation (one perturbation, one control, one validation readout, one structural readout, one integrity check) and stronger validation (multiple perturbations, rescue, time resolution, orthogonal assays).
   - *Decision Gate:* If a perturbation lacks a matched validation readout or control, redesign before execution.

4. **Execute Quality Control and Perturbation Validation**
   - Assess replicate consistency, batch structure, normalization behavior, viability, and nonspecific stress before biological interpretation.
   - Confirm that each perturbation altered its intended target without inducing global deterioration.
   - *Stop Condition:* If validation fails, controls show major nonspecific effects, or replicates are inconsistent without explanation, halt and redesign the perturbation or assay.

5. **Analyze by Regulatory Scale and Temporal Order**
   - Separate local features (boundaries, contacts, enhancer-promoter loops), regional features (compartments, domains, states), and global features (population summaries, batch effects).
   - If time-resolved, preserve temporal order: early chromatin or occupancy changes should precede later transcriptional and phenotypic changes.
   - Compare each perturbation to its matched control first; cross-mechanism comparisons only after quality and validation checks pass.
   - Use enrichment or overlap tests as association evidence, not proof of direct causality.
   - *Decision Gate:* If effects are global and nonspecific, suspect stress or artifact; add integrity controls or stop. If early and late readouts are disconnected, revisit the causal model.

6. **Discriminate Mechanisms Through Causal Tests**
   - Test necessity and sufficiency: does perturbing the candidate node change the outcome, and does restoring it rescue the effect?
   - Test specificity: does an orthogonal perturbation of the same axis produce concordant effects, and does a related comparator state respond differently?
   - Test downstream mediation: are target gene programs or effectors required for the phenotype?
   - Classify each conclusion as Supported, Consistent, Inferred, or Unresolved.
   - *Decision Gate:* If two mechanisms produce indistinguishable effects, add rescue, reversal, or orthogonal perturbation. If rescue fails, downgrade causal claims to descriptive.

7. **Iterate, Update, or Terminate**
   - Redraw the causal diagram after each result, labeling each edge as supported, weakened, refuted, or untested.
   - Update evidence strength and narrow or reframe hypotheses based on outcomes.
   - *Stop Conditions:*
     - Perturbation does not engage the intended target.
     - Effects are explained by viability, toxicity, or batch artifacts.
     - Results are irreproducible across replicates or models.
     - Mechanism relies on a single unreplicated signal.
     - Safety, compliance, or feasibility constraints block validation.
     - A simpler alternative explains observations equally well.

8. **Bound Claims and Package Outputs**
   - State the limits of extrapolation: system, context, assay modality, and regulatory scale.
   - Explicitly separate paper-supported patterns, user-provided evidence, and agent-inferred extensions.
   - Finalize the research package.

# Output Format

When using this skill, produce:

1. **Research Question:** Clear mechanism-separation question linking driver, regulatory layer, and phenotype.
2. **Mechanism Map:** Candidate mechanisms, predicted affected features, distinguishing predictions, and likely confounders.
3. **Hypotheses Table:** Each with evidence strength, key assumptions, failure modes, boundary conditions, and falsification criteria.
4. **Experimental Design:** Perturbation groups, matched controls, validation readouts, multi-layer readouts, integrity checks, and stop conditions.
5. **Analysis Plan:** QC steps, scale-specific metrics, temporal integration strategy, statistical approach, and visualization logic.
6. **Iteration Plan:** How each possible outcome updates the causal model and triggers redesign or termination.
7. **Validity Statement:** What is directly supported, what is inferred, and what remains unresolved.
8. **Claim Boundaries:** Explicit scope limits on generalizability and causality.

# Validation Gates

- Phenotype is distinguishable from the comparator before mechanism testing.
- Hypotheses generate mutually exclusive predictions testable with available readouts.
- Every perturbation has a matched validation readout and control.
- QC and perturbation validation pass before biological interpretation.
- Cross-mechanism comparisons occur only after matched-control analysis.
- Causal claims require necessity, sufficiency, or rescue evidence; association alone is labeled as such.
- Stop conditions are pre-defined and enforced when met.

# Claim Boundaries

- Limit causal claims to the tested biological system, model, assay, and regulatory scale.
- Distinguish correlation, temporal precedence, perturbation-supported necessity, and mechanistic causality.
- Do not generalize from a single donor, batch, cell type, or model to field-wide consensus.
- Label analogies and inferences as such; do not present them as established facts.
- Treat computational or simulation predictions as provisional until experimentally validated.

# Failure Modes

- Perturbation fails to engage the intended target or produces broad off-target stress.
- Nonspecific toxicity, viability loss, or global chromatin stress mimics mechanism-specific effects.
- Batch, donor, or model-specific artifacts are mistaken for biological signals.
- Assay readout is misaligned with the regulatory scale being claimed (e.g., using global averages to infer local loop mechanisms).
- Overlap or enrichment is interpreted as direct causation without perturbation or rescue.
- Early regulatory changes and late phenotypic readouts are disconnected but interpreted as causal.
- Single-replicate or unreplicated signals drive mechanistic conclusions.

# Validity Checks

Before finalizing a plan or claim, verify:

- Each hypothesis has a falsifiable prediction and defined boundary condition.
- Perturbation-specific controls are matched to each condition.
- Validation readouts are aligned with the intended mechanism.
- Structural or regulatory metrics are aligned with the claimed organizational scale.
- Positive, negative, and integrity controls are included.
- Batch effects and replicate consistency are addressed.
- Conclusions are limited to the tested system, assay, and scale.
- Paper-derived or analogy-based patterns are labeled as inference rather than established fact.
- Alternative explanations are explicitly listed.
- Stop conditions are defined for ambiguous, artifact-prone, or irreproducible results.

# Provenance

Derived from cluster 17, subcluster 17.0 (chromatin-epigenetic-metabolic-enhancer-mechanism-discovery-workflow). Synthesized from representative source skills: chromatin-architecture-mechanism-separation, chromatin-loop-differentiation-research, cardiac-aging-chromatin-research, metabolic-lactylation-neuroinflammation-research, metabolic-transcription-immune-evasion-research, chromatin-cohesin-architecture-research, replication-coupled-chromatin-exploration, enhancer-rna-osteoimmune-research. Specific biological systems, factors, marks, numerical parameters, and paper conclusions have been abstracted to produce a domain-general workflow.
