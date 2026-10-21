---
name: sci-immune-antibody-epitope-recognition-mapping-workflo-58e669db
description: A reusable end-to-end workflow for discovering and validating antibody-antigen epitope recognition mechanisms, from structural hypothesis generation through layered orthogonal validation and iterative mechanism refinement.
scienceevolve-title: "Antibody and immune recognition · antibody epitope recognition mapping workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

This skill guides an agent through designing research questions and validation plans for antibody-antigen epitope recognition mapping. It abstracts a reusable pattern: define the target recognition problem, generate structure-biased or sequence-informed hypotheses, design orthogonal validation ladders, discriminate epitope mechanisms, and iterate based on differential evidence. The workflow applies to protein, carbohydrate, and discontinuous epitopes without prescribing specific molecular systems or operational protocols.

# When to use

Use this skill when the user asks to:

- Design studies to map antibody or receptor epitopes on protein, carbohydrate, or composite antigens.
- Generate hypotheses about conserved anchor versus variable specificity determinants across related ligand families.
- Plan structure-biased discovery or biased-versus-broad comparator strategies for epitope-targeted recognition.
- Design layered validation from binding through specificity, mechanism, native-context, and functional readouts.
- Iterate on unexpected mapping results or conflicting competition and perturbation data.

Do not use this skill for clinical decision-making, therapeutic recommendations, operational wet-lab protocols, or as a substitute for biosafety and ethics review.

# Inputs required

Before generating a plan, identify or request:

- Target antigen class, domain architecture, and presentation context (e.g., purified, cell-surface, native complex).
- Structural or sequence evidence available for the target and candidate binders.
- Discovery modality and comparator strategy (e.g., structure-biased versus broad-diversity).
- Related targets or homologues for specificity testing.
- Intended validation depth: binding, epitope localization, functional consequence, or generality.
- Constraints: non-clinical scope, biosafety, ethics, data limitations, and unavailable information to be treated as assumptions.

If critical inputs are missing, produce a provisional plan with explicit assumptions and the minimum information needed to finalize the design.

# Core Workflow

**Stage 1: Define target state space and recognition gap**

- Distinguish antigen forms: domains, conformational states, processing states, glycoforms, and complex-associated states.
- Identify the structurally or phenotypically defined feature proposed as the epitope handle.
- **Gate 1 — Feasibility:** If the feature is structurally inaccessible or biologically irrelevant, stop and redefine the target.

**Stage 2: Generate epitope-mechanism hypotheses**

- Propose anchor hypotheses (shared motifs across related antigens), specificity hypotheses (variable determinants), and structure-bias hypotheses (designed enrichment for a region).
- Include state-dependency and discontinuous-epitope or carbohydrate-specific mechanisms where structural context supports them.
- Label each hypothesis with evidence strength, key assumptions, and failure modes.

**Stage 3: Design validation ladder and comparator**

- Select a discovery strategy and a comparator (broad-diversity or alternative-bias).
- Define panels: target-positive, target-negative, related-target, feature-altered, fragment, and presentation controls.
- **Gate 2 — Design adequacy:** If controls cannot separate recognition, specificity, feature dependence, and assay artifact, redesign before proceeding.

**Stage 4: Collect layered evidence**

- **Layer 1 — Binding:** Target recognition above background.
- **Layer 2 — Specificity:** Discrimination from related and irrelevant systems.
- **Layer 3 — Mechanism / Epitope mapping:** Competition, feature perturbation, or structural reasoning to localize the epitope; treat discontinuous and carbohydrate epitopes with geometry-appropriate logic.
- **Layer 4 — Native context:** Recognition in physiologically relevant presentation.
- **Layer 5 — Functional linkage:** Correlation between binding and intended activity.
- **Decision rule after each layer:** Advance only if the layer meets predefined success criteria; otherwise trigger iteration or stop.

**Stage 5: Discriminate mechanisms and update model**

- Integrate binding, structural, competition, and perturbation data.
- If feature perturbation abolishes binding, strengthen the epitope-feature hypothesis.
- If perturbation has little effect, infer compensatory or adjacent-region dominance and revise the model.
- **Gate 3 — Mechanism coherence:** If the model cannot explain both positive and negative evidence, return to Stage 2.

**Stage 6: Iterate or stop**

- If biased and broad designs converge without mechanistic difference, question the value of the structural bias.
- If recognition is assay-format dependent, prioritize native-context validation.
- If binding lacks function, distinguish engagement from functional relevance.
- **Stop conditions:** Persistent nonspecific signal, inability to assign molecular states, unresolved contradictions across orthogonal assays, or safety and ethics barriers.

**Stage 7: Bound claims and output**

- Map conclusions to the claim hierarchy.
- Label evidence strength and archive deprioritized hypotheses with rationale.

# Output Format

Return:

1. **Research question** and target state definition.
2. **Hypotheses table:** statement, evidence strength, key assumptions, predicted discriminator, and failure mode.
3. **Validation ladder:** controls, variables, readouts, and stop conditions per layer.
4. **Mechanism model:** conserved anchor layer, variable specificity layer, and structural rationale.
5. **Iteration log:** decision points, observed outcomes, and model updates.
6. **Claim hierarchy** with evidence classification (validated, supported, plausible, speculative).
7. **Safety, ethics, and boundary statement.**

# Validation Gates

- **Gate 1 — Target feasibility:** Structural accessibility and biological relevance are confirmed before hypothesis generation.
- **Gate 2 — Design adequacy:** Comparator and control panels separate target recognition, specificity, feature dependence, and assay artifact.
- **Gate 3 — Layer clearance:** Each evidence layer meets predefined success criteria before advancing to the next.
- **Gate 4 — Mechanism coherence:** The epitope model explains binding, competition, perturbation, and context data without contradiction.
- **Gate 5 — Reproducibility:** Key observations are consistent across independent preparations or orthogonal assays.

# Claim Boundaries

- **Binding claims** require target-positive versus target-negative or irrelevant comparisons.
- **Specificity claims** require a related-target panel and irrelevant presentation control.
- **Mechanism / epitope claims** require competition, perturbation, fragment, or conformational evidence; sequence similarity alone is insufficient.
- **Native-context claims** require target-present versus target-deficient comparisons in a physiologically relevant presentation.
- **Functional claims** require linkage between binding and activity, not just endpoint correlation.
- **Generality claims** require comparable controls across variants or related systems; do not generalize from a single binder-antigen pair.

# Failure Modes

- No selective target recognition beyond controls.
- Recognition confined to a single non-native assay format.
- Intended epitope feature is dispensable and no revised mechanism is plausible.
- Binding without functional modulation.
- Competition and feature-mapping data conflict without defensible explanation.
- Biased and broad-diversity strategies perform equivalently without evidence that bias adds mechanistic value.
- Assay artifacts including aggregation, nonspecific adhesion, matrix interference, or presentation-context dominance.
- Structural model over-interpretation: treating templates or docking poses as causal proof.

# Validity Checks

- Is the research question tied to a real gap rather than a target name alone?
- Are structural features accessible, relevant, and compatible with the discovery modality?
- Do controls separate target recognition, specificity, feature dependence, native context, and function?
- Are confounders considered (immobilization, tag effects, avidity, conformational state, expression level, mixed populations)?
- Is replicate structure, uncertainty estimation, and orthogonal validation included?
- Are claims limited to the evidence class and not generalized beyond tested systems?
- Are human-derived materials, biosafety, and compliance constraints respected?
- Does the plan avoid paper-specific sequences, clones, numeric thresholds, and operational parameters?

# Provenance

Synthesized from cluster 66 / subcluster 66.1.split0. Source skills: structure-biased-antibody-discovery, hiv-antibody-exploration-workflow, antibody-modification-function-mapping, antibody-binding-module-design, antibody-epitope-discovery-workflow, carbohydrate-antigen-recognition, antibody-fragment-dimerization-workflow, antibody-carbohydrate-recognition-workflow. Paper-specific systems, parameters, and conclusions have been removed.
