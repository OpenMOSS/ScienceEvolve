---
name: sci-immune-computational-biomolecular-interface-design-304cd7e9
description: A reusable end-to-end workflow for in-silico epitope definition, residue-level hotspot prediction, virtual perturbation scoring, and geometry/sequence co-design of protein interfaces, with structured validation and iteration gates.
scienceevolve-title: "Antibody and immune recognition · computational biomolecular interface design workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Guide agents through a reusable, end-to-end computational workflow for designing and validating biomolecular interfaces. It abstracts the logic of in-silico epitope definition, residue-level hotspot prediction, virtual perturbation scoring, and geometry/sequence co-design into a structured route with decision gates, controls, and iteration loops. The goal is to generate testable hypotheses and non-operational validation plans without embedding system-specific parameters or treating any single study as consensus truth.

# When to use

Use this skill when the user asks to:

- Design or optimize antibody, nanobody, receptor–ligand, or other protein–protein interfaces computationally.
- Generate residue-level or motif-level hypotheses about interface determinants.
- Plan virtual perturbation campaigns and interpret predicted binding or specificity changes.
- Co-design geometry and sequence for modular binding regions.
- Structure validation plans for computational interface predictions.

Do not use this skill for clinical recommendations, therapeutic dosing, executable wet-lab protocols, or operational biological procedures.

# Inputs required

Before proposing a plan, ask for or identify:

- Target molecule, epitope boundary, or functional site and its biological context.
- Designable component class (e.g., CDR loops, scaffold interface segments, binding modules).
- Available structural information and model-quality constraints.
- Prior evidence for candidate regions: conservation, preliminary binding data, structural models, or known escape variants.
- Intended outcome: affinity, specificity, stability, selectivity, or conformational preference.
- Positive and negative reference complexes or decoy sets, if available.
- Computational modeling assumptions, diversity constraints, and feasibility boundaries.
- What the user wants as output: research questions, hypotheses, design concepts, analysis plans, or iteration roadmaps.

If any input is missing, state assumptions explicitly and mark conclusions as provisional.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

1. **Interface Definition & Structural Quality Gate**
   - Define target interface boundaries and designable regions conceptually.
   - Verify structure quality, chain mapping, residue numbering, and interface geometry.
   - *Decision gate:* If structure quality is insufficient or boundaries are ambiguous, pause for model refinement or homology modeling before generating residue-level claims.

2. **Hypothesis Generation & Candidate Prioritization**
   - Propose candidate residues, motifs, or architectural features expected to influence binding.
   - Assign mechanistic roles: direct contact determinant, structural support, permissive surface, or context-dependent.
   - Label each hypothesis with evidence strength, key assumptions, alternative explanations, and likely failure modes.
   - *Decision gate:* If no plausible candidates emerge, broaden the search space or revisit the target definition.

3. **Virtual Perturbation & Baseline Scoring**
   - Apply systematic in-silico perturbations across candidate positions using an appropriate model.
   - Score relative interface changes against an unmodified baseline.
   - Include negative and positive reference controls in the same scoring framework.
   - *Decision gate:* If positive and negative references fail to separate, stop. Diagnose scoring bias, target misdefinition, or model inadequacy before ranking candidates.

4. **Geometry–Sequence Co-Design**
   - Generate candidate backbone or motif combinations geometrically compatible with the target.
   - Assign sequence or composition states using a model appropriate to the scaffold class.
   - Iteratively refine local geometry and sequence states until metric convergence or until improvements plateau.
   - *Decision gate:* If candidates collapse to redundant structures, violate scaffold feasibility, or depend on a single arbitrary modeling choice, diversify the search or relax constraints.

5. **Multi-Metric Ranking & Evidence Classification**
   - Rank candidates by predicted effect, structural plausibility, specificity against non-target references, and architectural diversity.
   - Decompose effects into interpretable components (packing, electrostatics, solvation, hydrogen bonding, conformational strain).
   - Classify candidates as high-confidence hotspot, moderate-confidence hotspot, warm spot, neutral, stabilizing but non-specific, or unsupported.
   - *Decision gate:* If top candidates lack structural support or conflict with independent evidence, downgrade confidence and revisit the interface definition or perturbation strategy.

6. **Validation Planning & Control Design**
   - Design a minimal conceptual validation package: target binding, specificity, target-state integrity, and orthogonal comparison.
   - Define positive, negative, orthogonal, and sensitivity controls conceptually.
   - Predefine primary metrics, secondary metrics, and stop conditions.
   - *Decision gate:* If the validation plan cannot falsify the hypothesis, redesign controls before advancing.

7. **Iteration, Escalation, and Stop**
   - Run positive, negative, and sensitivity checks.
   - If predictions conflict with independent data, revise the mechanistic model and update evidence labels.
   - If robustness checks fail, perturb one major assumption at a time (scoring model, epitope boundary, flexibility treatment, or motif library).
   - *Stop conditions:* Terminate the cycle when (a) references separate cleanly and reproducibly, (b) candidates survive reasonable model-choice variation, and (c) the validation plan is conceptually sound. Terminate and redesign if repeated iteration fails to resolve reference separation, specificity loss, or scaffold infeasibility.

# Output Format

Return results in this structure:

1. **Research Question** – Target, designable component, and intended discovery task.
2. **Candidate Hypotheses** – Table with residue/motif, predicted effect, mechanism, evidence strength, key assumptions, likely failure modes, and minimal validation.
3. **Design Plan** – Perturbation strategy, variables, controls (positive, negative, orthogonal, sensitivity), primary and secondary metrics, and stop conditions.
4. **Analysis Plan** – Ranking logic, component interpretation, reference comparison, diversity assessment, reproducibility checks, and uncertainty handling.
5. **Iteration Plan** – Triggers for hypothesis revision, escalation to higher-fidelity validation, or termination.
6. **Validity & Safety Notes** – Confounders, boundary conditions, and non-operational safety constraints.

# Validation Gates

- **Structure Quality Gate:** Interface boundaries and residue numbering must be unambiguous before residue-level claims are made.
- **Reference Separation Gate:** Positive and negative references must separate within the scoring framework before candidate scores are interpreted.
- **Specificity Gate:** Candidates must show predicted discrimination against non-target references or decoys.
- **Robustness Gate:** Top candidates must survive reasonable changes to scoring assumptions, target flexibility, or boundary definitions.
- **Feasibility Gate:** Designs must remain compatible with scaffold constraints and avoid obvious geometric or steric incompatibility.

# Claim Boundaries

- Computational predictions are research hypotheses, not validated biological facts.
- Residue-level importance inferred from virtual perturbation requires orthogonal validation to distinguish binding contribution from folding, stability, or expression effects.
- Geometry/sequence co-design outputs are candidate architectures, not guaranteed binders or therapeutics.
- Single-system findings must not be generalized to entire protein families or clinical contexts without additional evidence.
- Do not present in-silico scores as proof of safety, efficacy, or therapeutic utility.

# Failure Modes

- **Model Bias:** Scoring function systematically favors certain chemistries or conformations. Mitigate by multi-metric ranking and sensitivity controls.
- **Reference Failure:** Positive and negative references do not separate. Indicates target misdefinition, model inadequacy, or inappropriate comparator choice.
- **Redundancy Collapse:** Candidate set converges to a single architecture or sequence motif. Mitigate by enforcing diversity constraints and clustering.
- **False Hotspot:** Predicted determinant is actually a structural scaffold or folding artifact. Mitigate by target-state controls and accessibility analysis.
- **Specificity Loss:** Candidates improve target affinity metrics but lose discrimination against non-targets. Mitigate by explicit selectivity controls in ranking.
- **Overfitting:** Optimization exploits scoring artifacts rather than physical binding. Mitigate by cross-model checks and component decomposition.

# Validity Checks

- **Confounding:** Check whether target flexibility, protonation states, epitope ambiguity, or scoring-function bias could explain the result.
- **Reproducibility:** Verify that rankings are stable across independent model choices, random seeds, or perturbation strategies.
- **Statistical Rigor:** Ensure sampling is adequate for position-level claims and that multiple comparisons are accounted for.
- **Mechanistic Consistency:** Confirm that component-wise effects do not contradict the total predicted effect.
- **Boundary Conditions:** State where scaffold-specific, target-class-specific, or antibody-specific assumptions limit transferability.
- **Evidence Labeling:** Distinguish source-supported method patterns, direct analogies, and new agent inferences.

# Provenance

- Synthesized from cluster 33, subcluster 33.1.split0.
- Derived from source skills: antibody-protein-interface-mapping (158a1a8d30a74211), biomolecular-interface-hotspot-discovery (f0f18bb739724077), computational-antibody-epitope-design-exploration (1e5caa2795f2a36c), reproductive-interface-epitope-exploration (98dcfeb4cbe6976f), targeted-cytokine-antibody-delivery (5135da8a79b4dfef), targeted-protein-delivery-research-design (bce7acf1f679fb1c), conserved-viral-enzyme-epitope-research (9aaab4e5af9eaba5), apl-mimicry-research-design (dca4267cef5ac573).
