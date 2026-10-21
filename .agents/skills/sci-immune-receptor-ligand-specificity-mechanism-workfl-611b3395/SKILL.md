---
name: sci-immune-receptor-ligand-specificity-mechanism-workfl-611b3395
description: A reusable end-to-end workflow for discovering and validating receptor-ligand specificity mechanisms from ambiguous binding or recognition observations, using model discrimination, matched comparisons, and iterative validation.
scienceevolve-title: "Antibody and immune recognition · receptor ligand specificity mechanism workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Use this skill to transform ambiguous receptor-ligand recognition observations into falsifiable mechanistic hypotheses and iterative validation plans. It provides a transferable workflow for discriminating direct molecular specificity from confounding mechanisms—such as altered presentation, mixture effects, or assay artifacts—across immune receptor, membrane receptor, and molecular probe systems.

# When to use

Use this skill when a user asks you to:

- Propose hypotheses about how a receptor recognizes contextual, conformational, or non-core features of a ligand.
- Design experiments that compare matched ligands, receptor variants, or cell states to isolate a candidate recognition determinant.
- Distinguish specific binding from nonspecific background, mixture effects, presentation changes, or structural artifacts.
- Plan analyses that link an observed binding or functional phenotype to a specific receptor identity, epitope, or mechanistic route.
- Evaluate whether a proposed recognition study includes adequate controls, orthogonal readouts, and stopping rules.

Do not use this skill for clinical decision-making, patient-specific recommendations, therapeutic dosing, or operational wet-lab protocols.

# Inputs required

Before producing a research plan, obtain or infer:

- **Domain scope:** receptor family, ligand class, model system, and whether the question is mechanistic or comparative.
- **Candidate recognition determinant:** the structural, contextual, or conformational feature proposed to be recognized.
- **Confounder space:** known or plausible alternative explanations (presentation, stability, abundance, mixture, nonspecific binding, assay artifact).
- **Comparison set:** minimal and extended ligands, structural variants, matched positive/negative controls, and unrelated specificity controls.
- **Available readouts:** binding, functional, imaging, sequencing, repertoire, or structural readouts.
- **Constraints:** ethics, biosafety, sample availability, and claim boundaries.
- **Prior evidence strength:** what is directly measured versus inferred or speculative.

If critical inputs are missing, state assumptions explicitly and request clarification before finalizing the design.

# Core Workflow

Follow this ordered route. Do not skip validation gates.

1. **Frame the gap as model discrimination.**
   Convert the ambiguous observation into a question about mechanism: does the phenotype arise from direct recognition of a specific determinant, an indirect effect, a mixture of units, or an artifact? State the null model (no direct recognition) and at least two competing alternatives.

2. **Map confounders and define the determinant.**
   Identify all plausible confounders that could mimic specific recognition: ligand presentation, stability, processing, abundance, receptor-independent effects, nonspecific binding, matrix interactions, or cell-state changes. Explicitly define the molecular feature that the primary hypothesis claims is being recognized, and distinguish it from broader classes.

3. **Generate ranked competing hypotheses.**
   For each hypothesis, specify:
   - the mechanistic claim,
   - evidence strength (weak / moderate / strong),
   - key assumptions,
   - testable predictions,
   - likely failure modes.
   Include at least one direct-recognition, one indirect-mechanism, and one artifact or mixture hypothesis.

4. **Design matched comparisons and controls.**
   Build a minimal viable validation around paired conditions that differ only in the intended determinant while preserving the core framework. Define:
   - core matched conditions (minimal vs. extended/contextual ligand, variant series),
   - positive and negative controls,
   - unrelated and structural-variant specificity controls,
   - background or matrix controls,
   - orthogonal readouts that test the same claim by a different principle.
   **Gate:** If the comparison set cannot isolate the determinant from confounders, stop and redesign.

5. **Apply complementary perturbations.**
   Use perturbations that discriminate among hypotheses: enrichment/removal, matched blocking, mismatched blocking, activation-state modulation, or competition. Retest the perturbed material to see whether the alternative activity persists or disappears.
   **Gate:** If positive and negative controls fail to separate, or if mismatched blocking suppresses the matched readout, stop and troubleshoot the assay before mechanistic interpretation.

6. **Analyze specificity and separate evidence layers.**
   - Confirm control integrity first.
   - Quantify target-to-comparator contrast and signal-to-background.
   - Evaluate whether presentation, stability, abundance, or processing differences could explain the phenotype.
   - Map which feature positions are necessary or sufficient.
   - Test whether receptor identity, sequence motifs, or repertoire composition co-segregate with the phenotype.
   **Gate:** If the effect disappears under matched ligand-density or presentation-matched conditions, reinterpret as indirect or artifactual.

7. **Integrate orthogonal evidence into a mechanistic model.**
   Update the model only when functional, structural/repertoire, and control evidence are mutually consistent. Label conclusions as: directly supported, indirectly supported, or speculative. Do not present model-based inference as observed fact.
   **Gate:** If orthogonal readouts conflict, revise the causal map rather than forcing the data into one hypothesis.

8. **Iterate or terminate.**
   - If the hypothesis is supported, plan the next decisive comparison to test boundary conditions or functional consequences.
   - If the hypothesis is weakened, split, broaden, or abandon it based on the failure mode.
   - **Stop conditions:** controls fail; the effect disappears under matched conditions; nonspecific signal dominates; the claim exceeds the tested system; assay reproducibility is inadequate; or ethics/biosafety boundaries are reached.

# Output Format

Produce a structured research plan containing:

1. **Research question:** one concise, falsifiable question framed around a receptor-ligand-context mechanism.
2. **Gap and rationale:** what is unknown, what motivates the question, and what remains speculative.
3. **Hypotheses table:** columns for hypothesis, mechanism, testable prediction, evidence strength, key assumption, likely failure mode, and minimal validation experiment.
4. **Experimental design:** matched conditions, independent variables, control hierarchy, readouts, and stop conditions.
5. **Analysis plan:** classification rules, confounder checks, specificity matrix, statistical approach, and model-updating criteria.
6. **Iteration plan:** next decisive comparison for support, weakening, or refutation.
7. **Validity and ethics statement:** main risks, boundary conditions, and safety/ethics constraints.

# Validation Gates

Predefined checkpoints that must be passed before escalating claims:

- **Control integrity:** positive and negative controls behave as expected.
- **Presentation decoupling:** ligand abundance, stability, processing, or register cannot explain the phenotype.
- **Specificity matrix:** the signal discriminates the proposed determinant from near-neighbors, unrelated molecules, and background.
- **Reproducibility:** findings are observed across independent biological replicates, batches, or model systems.
- **Orthogonal concordance:** at least two independent readouts support the same recognition claim.

# Claim Boundaries

- Distinguish demonstrated binding or recognition from inferred biological mechanism.
- Label every claim with its evidence strength and the system in which it was tested.
- State whether the conclusion applies only to the studied antigen/receptor/preparation or has broader relevance.
- Do not treat a single mechanistic study as a field-wide consensus or as support for clinical translation.

# Failure Modes

- **Presentation confounding:** altered ligand density, stability, processing, or register mimics recognition.
- **Nonspecific binding or assay artifact:** matrix effects, carrier/scaffold signal, detection reagent behavior, or saturation creates apparent specificity.
- **Mixture misinterpretation:** a sample contains multiple units with different capacities, falsely interpreted as same-unit multispecificity.
- **Dynamic range or batch variability:** insufficient signal-to-background or reagent-dependent behavior undermines quantification.
- **Cell-state artifact:** viability, activation, differentiation, or toxicity changes mimic receptor-specific effects.
- **Extrapolation beyond evidence:** extending conclusions to other antigens, species, disease contexts, or therapeutic applications without replication.

# Validity Checks

Before accepting a conclusion, verify:

- **Matched design:** compared conditions preserve the core and differ only in the intended determinant.
- **Confounder controls:** presentation, abundance, stability, receptor pairing, clonal ancestry, and expression-level alternatives are addressed.
- **Statistical adequacy:** sample size, replication, multiple-comparison handling, uncertainty estimates, and effect sizes match the claim.
- **Reproducibility:** independent biological replicates and, where appropriate, blinded scoring.
- **Boundary conditions:** the model's scope is limited to the tested cell type, receptor family, host background, and preparation context.
- **Data transparency:** raw measurements, preprocessing, exclusion criteria, and analysis criteria are available for review.
- **Ethics and compliance:** appropriate oversight for human, animal, infectious-agent, genetic, or immune-manipulation work.

# Provenance

Synthesized from cluster 46 / subcluster 46.0.split0. Derived from source skills: `tcr-pfr-research-workflow` (312c2cc0e33af313), `natural-antibody-multispecificity-research-design` (fed7436a83452894), `selective-molecular-probe-research` (b176aaef043649fe), `platelet-mk-receptor-exploration-workflow` (4f8662744f1c3aab), `immune-idiotypic-binding-workflow` (9310bf70cc38dc80), `cytophilic-antibody-competition-research` (49f9e3b8d90e25e3), `membrane-receptor-capping-exploration` (5ba0de707743d671), `conformation-specific-antibody-exploration` (5973120305846c6e).
