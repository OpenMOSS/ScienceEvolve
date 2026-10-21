---
name: sci-immune-epitope-to-function-mechanism-discovery-work-e3a3c836
description: Map antibody or binder epitopes to functional mechanisms using perturbation, specificity controls, and layered validation in non-clinical research planning.
scienceevolve-title: "Antibody and immune recognition · epitope to function mechanism discovery workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Guide agents to design non-clinical research plans that map antibody or binder epitopes to functional mechanisms. The skill teaches a reusable end-to-end workflow: frame a recognition-to-function gap, generate falsifiable mechanistic hypotheses, stage validation from binding through perturbation and comparative breadth, and iterate based on failure diagnosis. It is for research planning and interpretation only.

# When to use

Use this skill when a user asks to:

- Propose research questions that link a defined epitope or recognition feature to a biological outcome.
- Design staged validation plans separating binding, specificity, function, and mechanism.
- Interpret perturbation, competition, or comparative evidence to discriminate alternative mechanisms.
- Iterate when binding-positive candidates lack function, or when functional effects lack target specificity.

Do not use for clinical decision-making, patient-specific recommendations, or operational wet-lab execution.

# Inputs required

Before generating a plan, ask for or identify:

- Target biology and the functional process or phenotype of interest.
- Candidate binder class and available epitope or recognition-feature evidence.
- Comparative cases (sensitive, resistant, perturbed, divergent, unrelated).
- Available readout classes (binding, functional, structural, computational).
- Constraints: biosafety, ethics, compliance, resources, and acceptable risk.

If inputs are missing, state assumptions and request confirmation before finalizing the plan.

# Core Workflow

1. **Frame the recognition-to-function gap**
   - Define the phenotype contrast and the specific recognition feature hypothesized to modulate it.
   - State what would falsify the proposed link.
   - *Decision gate:* Is the gap testable with available readouts and controls? If no, refine scope or stop.

2. **Generate layered hypotheses**
   - **Mechanistic hypothesis:** how recognition alters the biological process.
   - **Specificity hypothesis:** which target feature is recognized and why.
   - **Perturbation hypothesis:** what change should alter binding, function, or both.
   - **Failure hypothesis:** the most plausible reason the hypothesis could fail without disproving the overall approach.
   - Rank by evidence strength and label key assumptions.
   - *Decision gate:* Are hypotheses falsifiable and independent of source-paper conclusions? If no, reformulate.

3. **Design staged validation architecture**
   - Define minimal viable validation: the smallest comparison that can separate specific recognition from background and function from artifact.
   - Define independent variables (target context, candidate binder, perturbation, comparator).
   - Define dependent variables (binding, functional effect, specificity, reproducibility).
   - Define controls: negative, positive, binding-only, presentation, format, and assay-interference.
   - Predefine stop conditions and success criteria.
   - *Decision gate:* Do controls isolate mechanism from confounders? If no, redesign.

4. **Ascend the evidence ladder**
   Execute and interpret results in strict order:
   - **Layer 1 – Identity/integrity:** Confirm binder or perturbation design matches intent.
   - **Layer 2 – Binding:** Establish target-specific recognition above matched negatives.
   - **Layer 3 – Specificity:** Confirm discrimination against related and unrelated targets.
   - **Layer 4 – Function:** Evaluate whether recognition alters the intended biological process.
   - **Layer 5 – Mechanism:** Use perturbation, competition, orthogonal binding, or modeling to discriminate between alternative mechanisms.
   - **Layer 6 – Comparative breadth:** Test sensitive, resistant, divergent, and unrelated cases to distinguish mechanism from artifact.
   - *Iteration gate after each layer:* If a layer fails, diagnose the failure mode (source, presentation, screening, function, or interpretation), update the hypothesis, and decide whether to redesign, narrow scope, or stop.

5. **Integrate and interpret**
   - Report observed data separately from inferred mechanisms.
   - Map convergent evidence to a mechanism class (e.g., blocking, activation, conformational change).
   - Quantify uncertainty and reproducibility.
   - *Decision gate:* Do orthogonal evidence layers converge? If discordant, treat the mechanism as unresolved and return to Step 2 or 4.

6. **Iterate or terminate**
   - **Advance** when recognition, function, specificity, and mechanistic evidence are consistent.
   - **Redesign** when binding is strong but function is absent (revisit target accessibility or effector compatibility).
   - **Narrow scope** when evidence supports only a specific context or format.
   - **Stop** when controls fail, signal is indistinguishable from background, safety or ethical constraints are unmet, or further iteration would optimize within an unsupported mechanism.

# Output Format

When using this skill, produce:

1. **Research question** – Phenotype contrast and recognition-feature hypothesis.
2. **Hypothesis table** – Mechanism, evidence strength, key assumptions, likely failure modes, and minimal falsification test.
3. **Validation design** – Variables, controls, evaluation metrics, and stop conditions.
4. **Evidence ladder summary** – Layer-by-layer results, confidence rating, and discordance notes.
5. **Mechanistic interpretation** – Observed evidence, inferred mechanism, uncertainty, and boundary conditions.
6. **Iteration decision** – Advance, redesign, narrow, or stop with reasoning.

# Validation Gates

Before advancing past each layer, confirm:

- **Gate 1 – Specificity:** Target recognition is specific against matched negative and unrelated controls.
- **Gate 2 – Binding-function separation:** Binding-positive/function-negative cases are used to test mechanism; function is not assumed from binding alone.
- **Gate 3 – Perturbation fidelity:** Intended sequence, structural, or contextual perturbations are verified and free from confounding changes.
- **Gate 4 – Reproducibility:** Results hold across independent candidates, preparations, or datasets.
- **Gate 5 – Comparative logic:** Sensitive, resistant, divergent, and unrelated cases challenge the proposed mechanism rather than confirm it selectively.
- **Gate 6 – Statistical rigor:** Endpoints were predefined, uncertainty is reported, and multiple comparisons are accounted for.

# Claim Boundaries

- Binding is necessary but insufficient for functional mechanism; never equate the two.
- Conclusions are bounded to the tested target form, assay context, candidate set, and comparator panel.
- A single study, candidate family, or readout does not establish field-wide consensus.
- Preclinical or model-system evidence does not imply clinical or translational validity.
- Paper-derived findings are method inspiration; agent-generated hypotheses require independent validation.

# Failure Modes

- **Source bias:** Starting material lacks diversity to sample the relevant recognition space.
- **Presentation artifact:** Target form preserves non-native features that drive artifactual binding.
- **Binding without function:** Epitope is recognized but does not modulate the biological process.
- **Function without specificity:** Effect is driven by assay interference, nonspecific binding, or off-target activity.
- **Confounded mechanism:** Replication, fitness, expression, or genetic background differences explain the phenotype rather than recognition.
- **Narrow breadth:** Mechanism appears valid only for a single variant, clone, or immune context.
- **Inadequate discrimination:** Controls cannot separate the proposed mechanism from plausible alternatives.

# Validity Checks

- **Confounding:** Could tags, immobilization artifacts, aggregation, matrix effects, or genetic background explain the signal?
- **Control adequacy:** Are negative, positive, binding-only, presentation, format, and assay-interference controls aligned with the claims?
- **Reproducibility:** Are results supported by independent candidates, batches, or orthogonal readouts?
- **Statistical validity:** Are endpoints predefined, effect sizes reported, and multiple comparisons controlled?
- **Boundary conditions:** Are conclusions limited to the tested system and not generalized beyond evidence?
- **Falsifiability:** Is there a clear result that would refute or weaken the hypothesis?
- **Orthogonality:** Is the claim supported by more than one independent evidence type?

# Provenance

- Cluster 43 / subcluster 43.1.split0.
- Synthesized from source skills: antigen-guided-binder-discovery-workflow, antibody-gene-modularity-research, recombinant-antibody-fragment-research-design, ehrlichia-antibody-specificity-discovery, antibody-tool-discovery-workflow, phage-display-autoantibody-discovery-workflow, chimeric-antibody-redesign-exploration, lentiviral-envelope-glycan-neutralization-workflow.
- Representative paper-derived sources: e7bfa0481280759c, e44f33615f2d33a7, 04d4b938a4c5e054, e51f90d0d9954b33.
