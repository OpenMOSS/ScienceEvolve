---
name: sci-immune-autoimmune-antibody-target-discovery-workflo-438177d2
description: A reusable end-to-end workflow for moving from disease-associated antibody populations to candidate target identification, specificity validation, and human-relevance triangulation in autoimmune research.
scienceevolve-title: "Antibody and immune recognition · autoimmune antibody target discovery workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

This skill helps an agent design reusable, non-operational research strategies to discover and validate candidate targets of disease-associated antibodies in autoimmune contexts. It converts mechanistic immunology logic into a transferable framework for hypothesis generation, experimental design, multi-layer evidence integration, and iterative refinement without copying paper-specific conclusions, protocols, or numerical results.

# When to use

Use this skill when the user asks to:

- Generate new autoimmune research questions starting from disease-associated antibody populations, autoreactive B-cell signals, or immune recognition data.
- Design candidate target discovery using differential, subtractive, epitope-mapping, or cross-reactivity logic.
- Validate whether a candidate target is specifically recognized in native or tissue-relevant context.
- Distinguish disease-relevant recognition from non-specific background, broad cross-reactivity, or terminal-stage artifacts.
- Triangulate human relevance across biological boundaries, heterogeneous samples, and independent model systems.
- Iterate hypotheses based on convergent or discordant multi-layer evidence.

Do not use this skill for clinical diagnosis, treatment selection, individualized medical advice, or operational wet-lab protocols.

# Inputs required

Before generating a research plan, collect or request:

1. **Disease context and antibody population**: the autoimmune setting, antibody class or repertoire features, and known or suspected autoreactivity.
2. **Biological system scope**: computational, literature synthesis, in vitro conceptual design, ex vivo observational design, or ethically approved animal/human-sample framework.
3. **Known evidence and gaps**: key prior findings, conflicting reports, tolerance mechanisms, and what remains untested.
4. **Candidate target classes**: protein families, determinant classes, intracellular partners, or surface-associated molecules, if any.
5. **Available readouts and constraints**: assay classes, imaging modalities, omics resources, biosafety limits, ethical boundaries, and sample availability.
6. **Success criteria**: what would count as supportive, inconclusive, or falsifying evidence for each claim.

# Core Workflow

Follow this ordered route from problem framing to iteration or termination. Each stage includes a decision gate.

## 1. Frame the discovery problem
- Define the disease-associated antibody population, the biological context, and the specific mechanistic gap (e.g., unknown target, unresolved determinant, or missing link between recognition and pathology).
- Identify comparator states or backgrounds that control for shared biology.
- **Gate**: Are the antibody population, target tissue context, and comparator sufficiently defined to distinguish disease-relevant recognition from background? If no, pause and request clarification.

## 2. Generate candidate targets
- Use convergent clue sources: differential accessibility/subtractive enrichment, epitope-mapping signals, structural surface accessibility, intracellular cross-reactivity hypotheses, or heterogeneous immune-repertoire patterns.
- Rank candidates by recurrence across independent clue sources, structural plausibility, and expected accessibility in the relevant cellular or tissue context.
- Annotate each candidate with evidence strength, key assumptions, and likely failure modes.
- **Gate**: Do candidate clues recur above background across multiple clue sources? If no, return to Step 1 to refine the problem scope or stop if the signal is irretrievable.

## 3. Design specificity validation
- Define a minimal viable validation package for the top candidates: direct binding confirmation, specificity controls, and at least one orthogonal readout.
- Architect controls that match each subclaim:
  - Positive control: confirms assay sensitivity for the intended recognition.
  - Negative/background control: estimates non-specific signal.
  - Specificity control: unrelated target, irrelevant determinant, or target-negative condition.
  - Native-context control: distinguishes candidate-format recognition from native antigen or tissue-context recognition.
  - Competition or perturbation control: tests whether recognition depends on the predicted determinant.
- Define primary and secondary variables, readouts, and predefined failure criteria.
- **Gate**: Can the proposed controls separate specific recognition from non-specific binding, assay artifact, or broad cross-reactivity? If no, redesign controls before proceeding.

## 4. Execute layered evidence collection
- Collect evidence across independent layers: molecular recognition, cellular context, spatial localization, and functional consequence.
- Maintain matched logic between test and control conditions across all layers.
- **Gate**: Does the primary probe show specific recognition loss upon candidate perturbation while broad controls remain unaffected? If the result is ambiguous, add assay integrity checks or mechanistic perturbation before interpreting.

## 5. Integrate and analyze evidence
- Build a convergence table per candidate summarizing: recognition specificity, native/tissue-context relevance, functional or phenotypic association, and reproducibility.
- Classify candidates:
  - **High priority**: convergent specific recognition, native-context support, and plausible functional link.
  - **Mechanistic candidate**: recognition and context evidence without strong phenotype.
  - **Low priority**: background-level recognition or absent context/phenotype.
  - **Boundary-dependent**: positive in one context but not another.
- Interpret discordant evidence diagnostically (e.g., candidate-format artifact vs. missing effector threshold vs. assay mismatch).
- **Gate**: Does evidence converge across at least two independent layers with consistent direction? If discordant, identify the missing layer and return to Step 2 or 4.

## 6. Triangulate human relevance
- Evaluate boundary conditions: host background, species, strain, tissue compartment, disease stage, and sample heterogeneity.
- Require independent replication or validation across heterogeneous samples before broad claims.
- Scope conclusions to the tested context; do not extrapolate animal or model-system findings directly to clinical decision-making.
- **Gate**: Do findings hold across predefined biological boundaries and independent sample sets? If not, restrict claims to the validated boundary.

## 7. Iterate or terminate
- Promote candidates with convergent, specific, and boundary-robust evidence to stronger mechanistic follow-up.
- Deprioritize candidates that fail specificity controls, lack native-context relevance, or show irreproducible results.
- **Stop conditions**:
  - Ethical, biosafety, or welfare constraints prevent meaningful validation.
  - Controls cannot distinguish mechanism from non-specific inflammation or assay artifact.
  - Evidence remains purely correlative and the user requests causal conclusions.
  - Repeated perturbations or independent tests contradict the hypothesis.
  - Candidate recognition is consistently background-level across clue sources.
- If continuing, define the single most informative next step and return to the appropriate earlier stage.

# Output Format

When using this skill, return a structured research plan:

1. **Research question and gap** — the mapping problem and why it matters.
2. **Candidate target panel** — ranked candidates with rationale and preliminary evidence strength.
3. **Hypotheses** — for each candidate: statement, evidence strength, key assumptions, likely failure modes, and boundary conditions.
4. **Minimal viable validation design** — variables, control architecture, primary/secondary readouts, and stop criteria.
5. **Analysis and decision rules** — convergence table logic, acceptance/rejection/ambiguous criteria, and evidence-strength update rules.
6. **Iteration plan** — how to update rankings, resolve discordance, and decide between redesign, stop, or mechanistic follow-up.
7. **Validity and ethics statement** — confounders, reproducibility risks, boundary limits, and non-clinical safety framing.

# Validation Gates

- **Input sufficiency gate** (Step 1): Required context, comparator, and constraints are defined.
- **Candidate signal gate** (Step 2): Clues recur above background across independent sources.
- **Control strength gate** (Step 3): Controls can separate specific recognition from artifact.
- **Specificity gate** (Step 4): Perturbation affects primary probe more than broad controls.
- **Convergence gate** (Step 5): Evidence aligns across at least two independent layers.
- **Boundary generalizability gate** (Step 6): Findings are replicated or tested across relevant biological boundaries.
- **Ethical and safety gate** (Step 7): The plan respects biosafety, ethics, and non-operational constraints.

# Claim Boundaries

- Distinguish **immune recognition** from **pathogenicity**; binding or autoreactivity alone does not prove disease causation.
- Distinguish **in vitro or model-system findings** from **human clinical conclusions**.
- Distinguish **paper-verified observations** from **new-agent inferences** generated for a different target or disease context.
- Do not treat a single paper’s target, model system, or numerical threshold as field-wide consensus.
- Label speculative hypotheses separately from supported mechanisms and state their evidence grade.

# Failure Modes

- Candidate recognition is background-level, non-reproducible, or dominated by known contaminants.
- Perturbation produces global structural or cellular disruption rather than determinant-specific recognition loss.
- Native-context or tissue-context recognition is absent despite strong candidate-format binding.
- Phenotype association exists without specific molecular recognition, indicating a missing mechanistic link.
- Broad cross-reactivity or shared epitopes undermine disease-specific utility.
- Sample heterogeneity masks true effects or creates false-positive subgroups.
- Assay artifacts (carryover, fixation, permeabilization, detection bias, batch effects) are mistaken for biological signal.
- Ethical or biosafety constraints prevent adequate validation of high-priority candidates.

# Validity Checks

- **Confounding**: Are antibody, target, and outcome measured independently? Are controls matched for background, batch, and handling? Have non-specific activation and detection artifacts been ruled out?
- **Reproducibility**: Are key findings observed across independent preparations, batches, or measurement modalities? Are negative and null results preserved?
- **Statistical validity**: Are primary endpoints predefined? Are effect sizes and uncertainty reported? Is caution exercised with multiple comparisons, small samples, and rare events?
- **Boundary conditions**: Are conclusions scoped to the tested species, tissue, disease stage, and assay context? Are animal-model findings separated from human clinical claims?
- **Scientific validity**: Is each claim linked to a specific evidence type? Is necessity distinguished from direct contact? Is correlation distinguished from causality?

# Provenance

- Derived from cluster 25, subcluster 25.0.split0.
- Synthesized from source skills: autoimmune-low-frequency-collaboration-research, intracellular-cross-reactivity-research, subtractive-antibody-discovery, immune-epitope-mapping-workflow, neuroimmunology-antigen-pathology-mapping, antibody-fragment-research-workflow, modulation-enhanced-target-discovery, radioimmunotherapy-spatial-distribution-research.
- Excluded skill: 0543d88fb3b3b5f7.
