---
name: sci-immune-structure-guided-epitope-recognition-workflo-7094ca42
description: A reusable end-to-end workflow for designing non-clinical research plans that map antibody, antigen, or peptide recognition determinants through structural validation, comparative binding, and functional translation, with explicit decision gates and iteration rules.
scienceevolve-title: "Antibody and immune recognition · structure guided epitope recognition workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

This skill helps an agent design non-clinical research plans for structure-guided epitope recognition and biomolecular interaction mapping. It transfers the scientific logic of connecting conserved functional sites, conformational presentation, matched controls, staged validation, and functional translation across antibody, antigen, peptide, and receptor-ligand systems. Use it to propose new research questions, hypotheses, experimental designs, analysis plans, and iteration strategies without assuming any single paper's conclusions are field-wide consensus.

# When to use

Use this skill when a user asks for help with one or more of the following:

- Designing studies to map antibody, receptor, or ligand binding determinants to structural features.
- Evaluating whether a candidate epitope, motif, or surface is necessary, sufficient, or correctly presented for recognition.
- Comparing engineered or natural binders against controls under matched conditions.
- Distinguishing binding-only recognition from functionally relevant inhibition, neutralization, or cellular outcome.
- Generating hypotheses about conformational presentation, context extension, constraint effects, or display architecture.
- Planning iterative redesign when binding, structure, and function are discordant.

Do not use this skill for clinical treatment recommendations, patient management, executable wet-lab protocols, or claims of clinical efficacy.

# Inputs required

Before generating a research plan, ask for or infer the following:

- **Target system:** antigen, pathogen surface protein, allergen, receptor, or nucleic-acid topology and its biologically relevant states.
- **Candidate binder or motif:** antibody, nanobody, peptide, scaffolded mimetic, or receptor domain with known or predicted recognition features.
- **Structural context:** available experimental structures, predicted models, conservation patterns, or homology templates.
- **Desired functional outcome:** binding specificity, neutralization breadth, inhibition, cellular activation, or mechanistic blockade.
- **Comparator set:** original candidate, positive control, negative control, peer binder, and platform-only or scaffold-only conditions when relevant.
- **Constraints:** biosafety level, ethics approvals, privacy requirements, sample access, and non-clinical boundaries.
- **Prior evidence:** sequence data, prior binding results, mutagenesis, competition data, or known liabilities.

If key inputs are missing, state assumptions explicitly and label conclusions as provisional.

# Core Workflow

Follow this ordered end-to-end route. Each stage includes decision gates; stop or iterate when a gate fails.

## Stage 1: Define the recognition problem and functional gap
- Frame the question around an unresolved mismatch: which target features are recognized, and which of those are linked to the desired functional outcome?
- Separate three claims: binding specificity, native-context accessibility, and functional consequence.
- **Gate 1 (Problem clarity):** If the target state, biological transition, or functional readout is undefined, stop and clarify inputs.

## Stage 2: Build a mechanistic map and generate competing hypotheses
- Locate candidate recognition anchors using conservation, solvent exposure, structural complexes, or validated binders.
- Generate at least three competing hypotheses (e.g., recognition-site, conformational-presentation, context-extension, constraint, display-architecture, or functional-translation hypotheses).
- For each hypothesis, specify:
  - Evidence strength (strong, moderate, weak, speculative).
  - Key assumptions.
  - Most likely failure mode.
  - Minimal viable test.
- **Gate 2 (Hypothesis discriminance):** If competing hypotheses make indistinguishable predictions, redesign the contrastive test before proceeding.

## Stage 3: Design staged validation with matched controls
- Define candidate groups: original, redesigned, positive, negative, peer, platform-only, and mechanism controls.
- Vary one design variable at a time (motif length, conformational constraint, modification, orientation, or display format) before combining features.
- Predefine primary, secondary, robustness, and decision endpoints.
- **Gate 3 (Control adequacy):** If negative, positive, and process controls cannot separate specific recognition from background or scaffold effects, stop and revise the design.

## Stage 4: Execute structural or presentation validation
- Confirm that the intended conformation, exposure, or spatial arrangement is present using orthogonal methods when possible.
- Flag regions with high model uncertainty.
- **Gate 4 (Structural integrity):** If the candidate fails identity, purity, stability, or presentation checks, exclude it from functional claims and revisit Stage 2.

## Stage 5: Execute recognition validation
- Compare candidates using a common binding or interaction assay under matched conditions.
- Require that the proposed design feature improves recognition relative to controls.
- Treat relative binding scores as screening evidence unless the assay supports absolute interpretation.
- **Gate 5 (Recognition specificity):** If signal does not exceed target-negative background or platform-only background, stop and assess nonspecific binding or assay artifacts.

## Stage 6: Execute functional validation
- Test whether recognition translates into the desired biological effect.
- Include specificity checks to rule out nonspecific activity.
- Do not promote a candidate that shows binding or immunogenicity without functional relevance.
- **Gate 6 (Functional translation):** If binding is present but function is absent, treat this as mechanistic information: test accessibility, orientation, missing contacts, or decoy-epitope models. Do not dismiss as noise.

## Stage 7: Assess breadth, context dependence, and boundaries
- Test across target variants, altered target states, or different presentation formats.
- Examine whether results vary with expression level, sample type, or assay context.
- **Gate 7 (Boundary robustness):** If results hold only in one narrow setting, label the finding context-dependent and broaden validation before generalizing.

## Stage 8: Integrate evidence and decide
- Combine recognition, specificity, functional, and robustness evidence in a decision matrix rather than ranking by a single endpoint.
- Decision options:
  - **Advance:** proceed to deeper validation or next design stage.
  - **Redesign:** revise the hypothesis and test a new candidate.
  - **Deprioritize:** park the candidate and document the limiting assumption.
  - **Stop:** terminate if recognition is lost without compensating advantage, specificity is worse than baseline, or results are irreproducible.
- **Gate 8 (Decision criteria):** If predefined success/stop criteria are not met, iterate from Stage 2 with updated assumptions.

## Stage 9: Iterate and update the model
- Preserve failed designs as constraints on the design space.
- Combine design features only after each feature has independent support from matched controls.
- Update evidence strength, key assumptions, and failure modes after each round.
- **Stop condition:** Halt when ethical, consent, privacy, biosafety, or governance requirements are unresolved, or when model uncertainty dominates the predicted effect.

# Output Format

When using this skill, produce the following structure:

1. **Research question framing**
   - Target event, recognition anchor, and desired outcome.
   - Boundaries of inference.

2. **Hypothesis table**
   - For each hypothesis: claim, mechanism, evidence strength, key assumptions, predicted signature, failure modes, minimal viable test, and stop condition.

3. **Experimental design**
   - Candidate groups and variables.
   - Matched controls (negative, positive, process, platform-only, mechanism).
   - Staged validation plan (structural, recognition, functional).
   - Primary, secondary, robustness, and decision endpoints.
   - Stopping conditions.

4. **Analysis plan**
   - Quality, structural, recognition, specificity, functional, and boundary gates.
   - Matched comparison strategy.
   - Uncertainty and reproducibility assessment.
   - Decision matrix for proceed, iterate, deprioritize, or stop.

5. **Iteration plan**
   - Conditions for advancing, redesigning, deprioritizing, or stopping.
   - Updated hypotheses after each possible outcome.

6. **Validity and ethics notes**
   - Confounders, boundary conditions, reproducibility requirements.
   - Safety, biosafety, and governance constraints.

# Validation Gates

- **Target suitability:** Is the target feature sufficiently accessible, conserved, and contextually stable for the intended use?
- **Control separability:** Can platform-only, baseline, and scaffold effects be distinguished from antigen-specific or binder-specific effects?
- **Comparator fairness:** Are candidates evaluated under matched conditions with appropriate positive, negative, and mechanism controls?
- **Specificity:** Is there evidence against nonspecific binding, aggregation, background response, or assay artifact?
- **Reproducibility:** Are key observations repeated or supported by orthogonal evidence across independent preparations or batches?
- **Developability:** Are stability, aggregation, and presentation liabilities considered and measured?
- **Statistical validity:** Are endpoints predefined, effect sizes reported, and multiple-comparison risks addressed?
- **Boundary conditions:** Are conclusions limited to the tested target, binder class, sample context, and non-clinical setting?

# Claim Boundaries

- Distinguish **directly supported evidence** (observed in the user's dataset or a cited non-clinical study) from **mechanistically plausible inference** (supported by a reasonable model but not yet validated) and **new-system hypothesis** (proposed for a new target, disease, or binder and requiring experimental testing).
- Do not claim clinical efficacy, general superiority, or field-wide consensus from a single non-clinical study.
- Do not treat binding breadth, sequence conservation, or immunodominance as automatic proof of functional relevance or protective value.
- Label peptide or denatured-antigen findings cautiously with respect to native conformation.
- Treat template-based models, molecular similarities, and computational predictions as hypothesis generators, not definitive proof.

# Failure Modes

- **Target-gap failure:** The target is heterogeneous, masked, shed, or expressed on normal tissue, undermining selectivity assumptions.
- **Recognition-preservation failure:** Framework effects, conformational changes, epitope dependence, or altered avidity cause loss of binding after redesign.
- **Liability-reduction failure:** Redesign introduces new instability, aggregation, off-target binding, or loss of function.
- **Binding-function discordance:** A candidate binds specifically but fails to produce the desired functional outcome (decoy epitope, nonfunctional accessibility, or state mismatch).
- **Context dependence:** Results are valid only for one assay format, target variant, or presentation state and fail upon transfer.
- **Control failure:** Platform-only, negative, or process controls produce ambiguous signal, preventing specific attribution.
- **Model uncertainty:** Predictions depend on a single template, artifact-prone structure, or unreplicated dataset.
- **Assay artifact:** Nonspecific binding, aggregation, purity issues, or batch effects mimic specific recognition.

# Validity Checks

Before finalizing a research plan, verify:
- The proposal distinguishes binding, neutralization, enhancement, structural mechanism, and molecular determinant claims.
- Target-positive and target-negative conditions are both included.
- Positive, negative, mechanism, and artifact controls are specified.
- Immunodominance is not used as a shortcut for protective relevance.
- Conclusions are limited to the evidence strength and not generalized beyond the tested system.
- Target variants, host-context, or assay-state limitations are explicitly stated.
- Molecular similarities are presented as suggestive rather than definitive.
- Numerical parameters, executable protocols, and clinical recommendations are absent.
- Safety, ethics, and institutional oversight boundaries are stated.

# Provenance

- Derived from cluster 59 / subcluster 59.0.split0 via semantic merge of representative source skills:
  - `tumour-antigen-antibody-humanization-research` (51ca537ba2d71cfd)
  - `hiv-env-antibody-exploration` (9079b3860edc8eac)
  - `immune-repertoire-mechanism-exploration` (6c251eea3676aa6b)
  - `structure-guided-epitope-research-workflow` (0a504c205c780e15)
  - `antigen-display-vaccine-exploration` (fd3ee46506120ef3)
  - `antibody-dna-recognition-workflow` (27668cdff68c27b6)
  - `allergen-epitope-exploration-workflow` (dd857055c3a8a269)
  - `viral-epitope-neutralization-research` (b48b0589d1f4b664)
- Excluded skill: `dd986ceac3b9d293`.
