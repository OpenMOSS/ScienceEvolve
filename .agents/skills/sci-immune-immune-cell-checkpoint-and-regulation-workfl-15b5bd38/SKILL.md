---
name: sci-immune-immune-cell-checkpoint-and-regulation-workfl-15b5bd38
description: A reusable end-to-end research workflow for discovering and validating immune cell checkpoint and regulation mechanisms, integrating receptor-ligand interaction mapping, effector modulation, repertoire selection analysis, and stage-resolved perturbation validation.
scienceevolve-title: "Antibody and immune recognition · immune cell checkpoint and regulation workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Help an agent translate an immune checkpoint or regulation problem into a mechanism-guided research plan. The workflow covers hypothesis generation, minimal validation design, stage-resolved perturbation mapping, convergent evidence analysis, and bounded claim generation across receptor-ligand interactions, effector function modulation, and immune repertoire dynamics.

# When to use

Use this skill when the user asks to:

- Design or evaluate mechanistic hypotheses for immune cell checkpoints, regulatory interactions, or effector-target engagement.
- Compare engineered or natural recognition molecules, receptor/ligand interfaces, or delivery concepts while preserving target specificity.
- Investigate selection bias, repertoire diversity layers, or clonal patterns in immune cell populations.
- Plan stage-resolved perturbation experiments with timing, reversibility, and context controls.
- Propose non-operational validation strategies for binding specificity, functional activity, trafficking, or persistence.

Do not use this skill for clinical recommendations, patient-specific interpretation, executable wet-lab protocols, or operational parameter specification.

# Inputs required

Ask the user or environment to provide:

- **Biological context**: effector and target cell types, tissue or compartment, expression patterns, and known heterogeneity.
- **Molecular entities**: receptors, ligands, recognition scaffolds, payloads, or encoded biologics under study.
- **Mechanistic focus**: intended regulatory node, checkpoint, effector function, or selection process.
- **Perturbation and readout classes**: available specific and orthogonal perturbations, primary/secondary functional readouts, and detection methods.
- **Constraints**: biosafety, ethics, data quality, sample provenance, and regulatory boundaries.

If any input is missing, state the assumption explicitly, mark its evidence strength as provisional, and identify the control needed to test it.

# Core Workflow

1. **Frame the mechanism question**
   - Define the regulatory or checkpoint gap (e.g., unwanted activation, missing inhibition, aberrant selection).
   - Identify the functional outcome to explain and the most plausible biological nodes.
   - **Decision gate**: Is the question answerable with available perturbations and readouts? If no, stop and redefine scope.

2. **Map functional stages**
   - Decompose the interaction into stages: recognition/initiation, commitment/signaling, execution/effector outcome.
   - Assign candidate nodes (effector-side, target-side, bridging/context) to stages.
   - **Decision gate**: Can stage-specific sensitivity be tested? If no, redesign for coarser resolution or alternative nodes.

3. **Generate ranked hypotheses**
   - For each node and stage, state the primary hypothesis, competing alternatives, and null scenario.
   - Annotate every hypothesis with: evidence strength, key assumptions, minimal validation, strong controls, likely failure modes, and decision rules.
   - **Decision gate**: Are hypotheses falsifiable and distinguishable? If no, refine until predictions diverge.

4. **Design minimal viable validation**
   - Select the smallest comparison set that can discriminate the leading hypothesis from its strongest alternative.
   - Include: target-positive and target-negative contexts; matched comparators; positive, negative, irrelevant, and baseline controls; primary and secondary readouts.
   - Define stop conditions before data collection.
   - **Decision gate**: Do controls isolate the intended variable? If no, add specificity or artifact controls.

5. **Execute stage-resolved perturbation and observation**
   - Apply perturbations at defined stages and measure timing, reversibility, and context dependence.
   - Separate binding, trafficking, signaling, and effector readouts rather than relying on a single endpoint.
   - Record batch, donor, platform, and metadata for confounding assessment.

6. **Analyze convergent evidence**
   - Classify each result as direct support, indirect support, boundary evidence, negative evidence, or inconclusive.
   - Require orthogonal agreement to upgrade confidence; treat single-assay or single-system findings as exploratory.
   - Explain negative results by mapping failure to recognition, trafficking, effector mismatch, exposure, heterogeneity, or confounding.

7. **Validation gate review**
   - **Gate 1 — Specificity**: Target engagement is preserved and activity is target-context-dependent.
   - **Gate 2 — Mechanism discrimination**: The effect tracks the intended stage/node and not nonspecific disruption.
   - **Gate 3 — Orthogonal convergence**: At least two independent readout or perturbation classes agree.
   - **Gate 4 — Context relevance**: Model findings are bounded by known higher-context gaps.
   - If any gate fails, stop escalation and iterate or redesign.

8. **Iterate, stop, or escalate**
   - If all gates pass and higher-context relevance is plausible, design the next validation stage.
   - If results are discordant, change one module or assumption at a time and re-test recognition before downstream mechanisms.
   - If target recognition is lost, nonspecific toxicity dominates, positive controls fail, or required safety checks are missing, stop and redesign.
   - Update hypothesis labels and record which conclusions are system-specific versus transferable.

# Output Format

When using this skill, respond with:

1. **Research question framing** — Biological context, current limitation, intended mechanism, and main uncertainty.
2. **Functional stage model** — Proposed stages, nodes, and transition points.
3. **Hypothesis set** — Annotated hypotheses with evidence strength, assumptions, controls, and failure modes.
4. **Minimal validation design** — Comparators, controls, readouts, and predefined stop conditions.
5. **Analysis plan** — How timing, reversibility, specificity, and context results will be interpreted.
6. **Iteration decision rules** — Conditions for stopping, redesigning, pivoting, or escalating.
7. **Validity and safety notes** — Confounders, reproducibility requirements, boundary conditions, and ethics constraints.

# Validation Gates

- **Specificity gate**: Target engagement must be demonstrated before downstream activity is interpreted as target-mediated.
- **Mechanism gate**: The observed effect must be attributable to the proposed stage/node and not to viability loss, assay interference, or off-target binding.
- **Orthogonal gate**: Key claims must be supported by more than one independent readout or perturbation class.
- **Context gate**: Findings must be explicitly bounded by the model system, species, assay format, and known higher-context limitations.
- **Quality gate**: Samples, sequences, or products must pass predefined purity, annotation, and reproducibility thresholds before biological interpretation.

# Claim Boundaries

- Binding preservation is necessary but not sufficient for functional mechanism claims.
- In vitro or single-system activity does not imply higher-context efficacy or clinical benefit.
- Repertoire enrichment or depletion supports selection hypotheses but does not prove functional consequence.
- A result from one platform, cell type, or selection process is a hypothesis about mechanism, not field consensus.
- Distinguish confirmed, plausible, inferred, and not-established claims in every output.

# Failure Modes

- **Recognition failure**: Target engagement is lost or never achieved; downstream claims are invalid.
- **Specificity failure**: Activity appears in target-negative or irrelevant-molecule controls; indicates off-target or nonspecific effects.
- **Trafficking failure**: Internalization, clearance, or compartmentalization prevents mechanism access despite binding.
- **Effector mismatch**: The intended regulatory outcome is not engaged; alternative pathways dominate.
- **Confounding dominance**: Batch, donor, coverage, matrix, or technical artifacts explain the signal.
- **Over-interpretation**: Repertoire patterns, binding data, or stage-resolved timing are treated as causal proof without perturbation evidence.
- **Escalation without gates**: Advancing to higher-context or therapeutic claims before lower-context validation is complete.

# Validity Checks

- **Confounding**: Are source, state, tissue, platform, and annotation differences balanced or modeled?
- **Sampling and depth**: Are comparisons normalized for detection depth, coverage, or missingness?
- **Controls**: Do positive, negative, irrelevant, and comparator controls separate as expected?
- **Reproducibility**: Are independent replicates, split samples, or orthogonal methods included?
- **Statistical discipline**: Are endpoints predefined, multiple comparisons handled, and uncertainty reported?
- **Boundary conditions**: Are claims limited to the studied system, state, and data context?
- **Evidence labeling**: Are observations distinguished from inferences and speculation?
- **Safety and ethics**: Does the plan avoid unsafe procedural details and comply with oversight requirements?

# Provenance

- Synthesized from cluster 1 / subcluster 1.0.split0.
- Source skills: antibody-effector-engineering-research-workflow, repertoire-selection-bias-discovery, antibody-repertoire-layered-diversity, stage-resolved-immune-interaction-discovery, ige-interface-binding-discovery, surface-protein-orientation-discovery, in-situ-antibody-gene-delivery-research, thymic-b-cell-repertoire-exploration.
