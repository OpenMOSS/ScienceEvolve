---
name: sci-immune-antibody-epitope-structural-mapping-workflow-4a518c47
description: Guide agents in designing reusable, non-operational research plans for mapping and validating antibody epitopes by integrating structural, sequence, and binding evidence through hypothesis generation, specificity discrimination, and iterative refinement.
scienceevolve-title: "Antibody and immune recognition · antibody epitope structural mapping workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Guide agents in designing reusable, non-operational research plans for mapping and validating antibody epitopes. The skill supports hypothesis generation, specificity discrimination, and iterative refinement by integrating structural, sequence, and binding evidence. It is intended for research-design use only and does not embed source-specific conclusions or operational protocols.

# When to use

- Generate research questions about antibody–antigen recognition, epitope mapping, or paratope/epitope relationships.
- Design specificity-boundary studies across target variants, homologs, or structural states.
- Plan validation of candidate epitopes or binding determinants before higher-complexity experiments.
- Compare binding patterns between parent and engineered binding formats, or between monoclonal and polyclonal sources.
- Iterate from binding data to structural hypotheses using orthogonal evidence streams.

Do not use for clinical decision-making, therapeutic recommendations, patient-specific interpretation, or operational wet-lab protocol generation.

# Inputs required

- **Target antigen:** identity, sequence, available structures or models, known domains, and homologous proteins.
- **Binding partner:** antibody clone, polyclonal serum, receptor, nanobody, engineered fragment, or other binding domain.
- **Prior evidence:** known epitope type (linear, conformational, discontinuous), existing binding data, and prior mapping studies.
- **Comparative context:** target variants, homologs, peptide fragments, or structural states relevant to specificity.
- **Intended use:** mechanistic mapping, diagnostic probe design, cross-reactivity assessment, or repertoire-level exploration.
- **Constraints:** biosafety level, ethics approvals, data access, sample availability, and permissible assay complexity.

# Core Workflow

1. **Frame the recognition problem.** Define the antigen, binding partner, and the unknown specificity or structural relationship. Identify whether the gap concerns linear, conformational, or discontinuous epitopes.

2. **Generate competing hypotheses.** Formulate at least three alternative mechanistic explanations (e.g., shared surface patch, variant-specific residue, accessibility/presentation dependence, format-dependent artifact, non-specific binding). For each, record evidence strength, key assumptions, predicted observations, and likely failure modes.

3. **Build a comparative specificity matrix.** Compare binding or reactivity across target variants, homologs, fragments, or structural states. Identify regions that differentiate recognized from non-recognized targets.

4. **Decision Gate — Pattern Sufficiency.** If no differential pattern emerges, stop and revisit the target panel, binding partner panel, or assay design before proceeding.

5. **Map candidate determinants to sequence and structure.** Align candidate regions to the target protein and homologues. Evaluate surface accessibility, spatial coherence, and structural plausibility. Treat homology models as provisional when experimental structures are unavailable.

6. **Design minimal validation.** Define the smallest comparison that can discriminate the leading hypothesis from its strongest rival. Specify independent variables, positive/negative/specificity controls, primary readouts, and pre-registered criteria for support, ambiguity, and rejection.

7. **Decision Gate — Control Adequacy.** If controls cannot separate specific signal from background, or if the required validation exceeds safety or ethical boundaries, stop and redesign.

8. **Integrate orthogonal evidence.** Pair binding data with at least one independent stream (structural comparison, sequence analysis, mutagenesis, repertoire concordance, or serum competition). Upgrade confidence only when multiple streams converge.

9. **Evaluate outcomes against pre-registered criteria.** Classify each hypothesis as supported, ambiguous, or contradicted based on control behavior, reproducibility, and cross-method agreement.

10. **Decision Gate — Evidence Convergence.**
    - *If supported:* refine epitope boundaries and test harder boundary cases (e.g., more divergent variants or altered structural states).
    - *If ambiguous:* add an orthogonal evidence stream or increase replicate depth; do not advance mechanistic claims.
    - *If contradicted:* revisit core assumptions (e.g., linear vs. conformational recognition, assay artifact, target folding state) or terminate the hypothesis branch.

11. **Assess boundaries and terminate.** State whether conclusions apply only to the tested binder–antigen pair, a domain class, or broader contexts. Document negative results and assay limitations. Terminate when further experiments would not improve discrimination, when negative controls dominate, or when continued validation exceeds available constraints.

# Output Format

1. **Research question and scope:** concise statement of the recognition or mechanism question and intended use.
2. **Evidence map:** table of prior evidence, evidence type, strength, assumptions, and limitations.
3. **Hypothesis table:** candidate mechanism, evidence strength, key assumptions, predicted observations, and likely failure modes.
4. **Minimal validation plan:** variables, controls (positive, negative, specificity), primary readouts, evaluation metrics, and stop conditions.
5. **Analysis plan:** normalization rules, clustering or comparison method, structural mapping logic, integration of orthogonal streams, and uncertainty handling.
6. **Iteration rules:** actions for supported, ambiguous, and contradictory outcomes.
7. **Boundary statement:** scope of inference, generalizability limits, and validity constraints.

# Validation Gates

- **Pre-registered criteria:** define support, ambiguity, and rejection thresholds before interpreting results.
- **Control performance:** positive, negative, specificity, and assay-background controls must behave as expected before claims are advanced.
- **Reproducibility:** require independent replicates, orthogonal probes, or independent datasets before promoting a candidate from low to higher confidence.
- **Structural confirmation:** mapped regions must be surface-accessible and spatially coherent; do not infer epitope location from sequence alone when folding or accessibility is unknown.
- **Reciprocal consistency:** competition, cross-reactivity, or serum-overlap patterns must be consistent in both directions before accepting shared-determinant hypotheses.

# Claim Boundaries

- Distinguish directly measured observations from inferred or speculative claims.
- Limit conclusions to the tested antibody–antigen pair, assay format, and structural context.
- Do not generalize from a single clone, single paper, or computational model to field-wide rules.
- Separate computational prioritization from experimental validation.
- Avoid clinical interpretation, diagnostic claims, or therapeutic recommendations.

# Failure Modes

- Non-specific binding or assay artifacts (aggregation, scaffold binding, detection reagent interference).
- Library or selection bias enriching non-native binders unrelated to the native epitope.
- Candidate motifs mapped to structurally inaccessible or buried regions.
- Conformational changes, post-translational modifications, or presentation effects altering the native epitope.
- Overfitting to a single antibody clone, repertoire source, or computational model.
- Reagent cross-reactivity mimicking shared idiotypic or epitope determinants.
- Discordance between peptide-level recognition and native-protein competition.

# Validity Checks

- **Confounding:** assess target purity, folding state, presentation format, multimerization, and non-specific adsorption.
- **Reproducibility:** require independent selections, clones, assays, or datasets before strengthening claims.
- **Boundary conditions:** distinguish linear, conformational, and discontinuous epitopes; native vs. denatured states; model vs. experimental structures; and peptide vs. full-protein contexts.
- **Statistical validity:** predefined endpoints, adequate replication, uncertainty reporting, effect sizes, and multiple-comparison adjustment.
- **Structural validity:** confirm accessibility and model confidence before inferring surface recognition.
- **Generalization:** avoid extrapolating beyond the tested binder class, target family, and biological context.
- **Ethics and compliance:** ensure human-derived materials, pathogens, allergens, and biologics are handled only under approved institutional protocols and qualified oversight.

# Provenance

Synthesized from cluster 18 / subcluster 18.1.split0. Source skills: allergen-epitope-research-workflow, structure-guided-antibody-epitope-exploration, antibody-epitope-exploration-workflow, proteome-context-epitope-discovery, antibody-epitope-discovery-workflow, antibody-repertoire-research-exploration, adaptive-ir-antigen-exploration, antibody-idiotypic-crossreactivity-exploration.
