---
name: sci-immune-recombinant-binder-discovery-selection-workf-306e874f
description: A reusable end-to-end workflow for designing in vitro display-based discovery campaigns to identify recombinant binders against small molecules, modified peptides, transient targets, or conformational states, emphasizing mechanism-anchored target selection, background-controlled enrichment, and iterative validation without operational protocols.
scienceevolve-title: "Antibody and immune recognition · recombinant binder discovery selection workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Guide agents in generating research questions and non-operational experimental designs for discovering recombinant binders—such as antibody fragments, nanobodies, peptides, or engineered scaffolds—against small molecules, modified peptides, transient targets, or specific conformational states. The workflow translates a mechanistic hypothesis into an iterative, evidence-limited discovery and validation program without prescribing executable laboratory parameters.

# When to use

Use this skill when the user asks to:

- Design a discovery campaign for novel binders against small molecules, short peptides, modified motifs, cleavage sites, or conformational epitopes.
- Translate a biological mechanism into a target-driven selection and validation strategy.
- Diagnose why an enrichment workflow may be failing due to poor target presentation, background binding, or weak specificity.
- Plan format conversion from a display-derived fragment to a soluble or deployable binder while preserving linked molecular identity.
- Evaluate whether binding evidence is sufficient to support a functional, mechanistic, or translational claim.

Do not use this skill as a clinical decision tool, treatment recommendation system, or source of executable wet-lab protocols.

# Inputs required

Before generating a plan, request or infer:

- **Research domain and biological question:** the process to influence, measure, or report.
- **Target feature:** the specific molecular entity, modification, or conformational state to be recognized.
- **Target rationale:** structural, functional, genetic, or prior binding evidence supporting mechanistic relevance.
- **Repertoire strategy:** immune-derived, naïve, synthetic, engineered, or mixed library source.
- **Discovery platform:** display technology or genotype-phenotype linkage system at a conceptual level.
- **Assay context:** available binding, specificity, functional, orthogonal, and structural readouts.
- **Constraints:** biosafety, ethics, regulatory, sample stability, and resource limits.
- **Evidence threshold:** what the user considers sufficient to advance, stop, or redirect.

# Core Workflow

## Stage 1: Mechanism anchoring and target definition
1. Define the interaction whose disruption or reporting would answer the research question.
2. Anchor the target to a region, interface, or feature supported by mechanistic evidence rather than convenience.
3. Identify competing states, off-target surfaces, and presentation artifacts that could confound recognition.
4. **Decision gate:** Proceed only if the target hypothesis is mechanistically justified and distinguishable from related features.

## Stage 2: Repertoire and presentation hypothesis
1. Select a repertoire whose diversity and bias match the target class and expected recognition mode.
2. Formulate a presentation hypothesis: the target feature must remain accessible and representative during selection, accounting for tags, surfaces, carriers, or immobilization handles.
3. Formulate a background hypothesis: identify likely non-target sources (matrix, tag, surface, blocking material, carrier) that could become unintended selection targets.
4. **Decision gate:** Proceed only if the presentation strategy is defensible and matched background controls are designed.

## Stage 3: Controlled enrichment
1. Execute iterative selection conceptually, monitoring relative enrichment of target-binding candidates over matched background.
2. Track sequence diversity and watch for artifact-dominated collapse or amplification of a single clone.
3. Prefer relative specificity metrics over absolute recovery.
4. **Iteration/Stop:** Redesign presentation or background controls if enrichment does not improve specificity, if diversity collapses to apparent artifacts, or if background dominates.

## Stage 4: Candidate screening and integrity check
1. Recover candidates and verify sequence integrity, construct identity, and assayable behavior.
2. Evaluate individual candidates for target binding against background and non-target conditions.
3. Normalize for expression, display, or loading differences before ranking.
4. **Decision gate:** Advance only candidates with reproducible target binding and acceptable construct quality.

## Stage 5: Specificity and counter-screening
1. Test candidates against a panel of related targets, competing states, and background materials.
2. Use competition or displacement logic to confirm addressability to the intended feature.
3. Include tag-only, surface-only, and carrier-only controls to detect presentation artifacts.
4. **Iteration/Stop:** Reject candidates that recognize only tags, surfaces, or unrelated features; redesign the target panel if specificity is universally weak.

## Stage 6: Format conversion and fidelity check (when applicable)
1. Convert candidates from the discovery format to the intended soluble or deployable format while preserving linked molecular identity.
2. Verify that conversion fidelity is high enough to distinguish true candidates from chimeric, mismatched, or dropout artifacts.
3. Re-assess binding and specificity in the new format.
4. **Decision gate:** Proceed only if binding and specificity survive format conversion; stop if artifact rates obscure true signal.

## Stage 7: Functional and mechanistic validation
1. Test whether binding perturbs the mechanism-relevant interaction in an orthogonal assay.
2. Distinguish target engagement from biological modulation; require functional readouts aligned with the original mechanistic hypothesis.
3. Use loss-of-recognition or gain-of-recognition experiments to map the interface only after binding and function are confirmed.
4. **Iteration/Stop:** If binding persists but function is absent, revisit the epitope, mechanism model, or assay context before claiming mechanism.

## Stage 8: Model update and iteration
1. Integrate binding, specificity, format, and functional evidence to revise the target hypothesis, selection strategy, or mechanism model.
2. Update evidence-strength labels for each hypothesis (supported, partially supported, contradicted, inconclusive).
3. **Stop conditions:** Terminate the workflow when candidates meet predefined specificity and functional criteria, when failure modes are unresolvable, or when safety/ethics constraints prevent continuation.

# Output Format

When using this skill, respond with:

1. **Research question:** concise statement of the proposed discovery problem and its mechanistic basis.
2. **Hypothesis table:** target-state, presentation, background, selection, and functional hypotheses with evidence strength, key assumptions, likely failure modes, and minimum validation tests.
3. **Experimental design funnel:** target rationale, repertoire strategy, conceptual selection plan, control design, primary/secondary metrics, decision rules, and stop conditions.
4. **Analysis plan:** enrichment evaluation, candidate-level validation, specificity mapping, format-fidelity checks, and functional interpretation.
5. **Iteration plan:** how each major failure mode (weak enrichment, background dominance, format loss, nonfunctional binding) redirects the design.
6. **Validity and safety statement:** confounders, boundary conditions, reproducibility requirements, and non-clinical scope.

# Validation Gates

- **Target validity:** The target must be mechanistically linked to the biological question and distinguishable from competing states.
- **Presentation validity:** Target feature accessibility must be preserved and verifiable against matched background.
- **Enrichment validity:** Signal must improve relative to background across iterations without artifact-driven diversity collapse.
- **Candidate validity:** Sequences must be intact, non-chimeric, and reproducibly assayable.
- **Specificity validity:** Binding must survive counter-target, competition, and presentation-artifact controls.
- **Format validity:** Post-conversion binding must be consistent with pre-conversion evidence, or divergence must be explained.
- **Functional validity:** Affinity or binding must be connected to a mechanism-relevant perturbation through orthogonal readouts.

# Claim Boundaries

- **Binding claims:** Limited to the tested target presentation, assay format, and candidate set.
- **Specificity claims:** Require evidence against related targets and background materials; do not extrapolate from a single counter-target.
- **Mechanism claims:** Require convergence of binding, functional disruption, and interface-mapping evidence; binding alone does not prove mechanism.
- **Translational claims:** Not supported by in vitro discovery alone; clinical, diagnostic, or therapeutic utility requires independent regulated development.
- **Format claims:** Post-conversion behavior is system-specific; do not assume universal transferability of display-format results.

# Failure Modes

- **Target mis-anchoring:** The chosen feature is not mechanistically relevant or is inaccessible in the presentation context. Detected by lack of specific enrichment despite diverse repertoire.
- **Presentation artifact:** Binders recognize the tag, surface, carrier, or denatured conformation rather than the intended feature. Detected by tag-only/surface-only positive signal.
- **Background dominance:** Nonspecific binders or matrix-interacting clones outcompete target-specific candidates. Detected by high background recovery and poor target-to-background ratio.
- **Diversity collapse:** Enrichment yields redundant clones or a single amplified artifact. Detected by low sequence diversity and lack of independent validation.
- **Format-conversion artifact:** Linked identity is lost, expression fails, or binding is lost upon reformatting. Detected by sequence-level mismatch or loss of signal post-conversion.
- **Binding without function:** Candidates bind the target but fail to perturb the mechanism-relevant interaction. Detected by discordance between binding and functional assays.
- **Assay-context mismatch:** Binding observed in one format or context disappears in orthogonal validation. Detected by format-dependent or batch-dependent signal variation.

# Validity Checks

Before presenting conclusions, check:

- **Confounding:** Could avidity, display artifacts, surface effects, expression differences, or nonspecific adsorption explain the result?
- **Specificity:** Were background, non-target, related-target, and presentation-artifact controls included and reported?
- **Reproducibility:** Were key observations repeated across independent preparations, runs, or clone sets?
- **Format dependence:** Did candidates behave differently in display versus soluble or deployable formats?
- **Mechanism alignment:** Does the functional assay test the interaction that motivated the target choice?
- **Diversity and redundancy:** Are hits meaningfully diverse, or is the result driven by a single clone or artifact?
- **Statistical validity:** Are sample size, replication, variance, and multiple-comparison concerns addressed at the design level?
- **Boundary conditions:** What target biology, repertoire source, assay context, or model system limits generalization?
- **Claim discipline:** Are conclusions limited to the evidence level (binding, specificity, function, mechanism) actually obtained?

# Provenance

- Derived from cluster **24**, subcluster **24.0.split0**, workflow archetype **end-to-end mechanism discovery and validation**.
- Synthesized from source skills: `mechanism-anchored-antibody-fragment-discovery` (d76d3870c3b97cf6), `antibody-fragment-peptide-panning-method` (97dccc8d94647bc0), `scaffold-receptor-biosensor-design` (e87885637227a258), `antigen-driven-repertoire-discovery` (4a7154aa91f81081), `morphology-aware-iterative-selection` (3af54685b1e372ff), `antibody-format-conversion-discovery` (86a295fb0d231b4a), `antibody-affinity-epitope-discovery` (e5e440a88b992090), `antibody-binder-discovery-workflow` (552c8411e2d5b1db).
