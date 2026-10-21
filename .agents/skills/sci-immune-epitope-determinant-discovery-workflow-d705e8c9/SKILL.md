---
name: sci-immune-epitope-determinant-discovery-workflow-d705e8c9
description: A reusable end-to-end workflow for coarse-to-fine immune-recognition mapping, proxy-to-native validation, and specificity testing to discover epitopes and molecular determinants across viral, allergen, and autoantigen targets.
scienceevolve-title: "Antibody and immune recognition · epitope determinant discovery workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Guide agents to design defensible, iterative research plans for discovering and validating candidate immune-recognition determinants on proteins. The workflow abstracts a transferable pattern: move from biological context and prior evidence to ranked mechanistic hypotheses, then validate through staged proxy-to-native evidence while bounding claims and iterating on discordance. It is a research-design aid for hypothesis generation, candidate prioritization, and validation architecture—not a source of clinical advice, operational protocols, or field-wide consensus.

# When to use

Use this skill when the user asks to:

- Propose new research questions about candidate epitopes, antigenic regions, antibody-binding sites, autoantigenic determinants, or cross-reactive immune-recognition regions.
- Design a non-operational validation plan that progresses from coarse mapping to fine determinant identification and full-target confirmation.
- Compare sequence-derived, structure-derived, and experimental-binding evidence streams for immune-recognition candidates.
- Prioritize candidate regions for follow-up validation, including controls, metrics, failure criteria, and iteration rules.
- Distinguish linear, conformational, discontinuous, glycan-dependent, or modification-driven determinants.

Do not use this skill for clinical diagnosis, treatment advice, patient-specific risk assessment, operational wet-lab instructions, or high-risk biological protocol generation.

# Inputs required

Before generating a research plan, identify:

- **Target context**: protein family, source organism, disease or exposure relevance, and known functional sites.
- **Prior evidence**: serological, binding, mutational, conservation, expression, or structural evidence linking the target to immune recognition.
- **Structural information**: experimental structures, homology models, predicted ensembles, or sequence-based feature maps (surface exposure, secondary structure, flexibility).
- **Candidate scope**: hypothesized regions, domains, or motif classes; known homologs and expected cross-reactivity sources.
- **Recognition reagents**: available or planned binder classes (antibodies, sera, peptides, nanobodies, aptamers) and their selection history.
- **Validation constraints**: non-operational readouts, control materials, biosafety boundaries, ethics requirements, and decision goals.
- **Boundary conditions**: contexts where the hypothesis should not be extrapolated.

If essential inputs are missing, produce a minimal plan with explicit assumptions and list the information needed to strengthen it.

# Core Workflow

Execute the following ordered route. At each gate, stop or iterate if the criteria are not met.

## Stage 1: Frame the recognition problem

- Define the target protein, intended recognition molecule class, and biological question (specificity, cross-reactivity, diagnostic relevance, or mechanistic binding).
- **Decision gate**: Is the target plausibly accessible and disease- or exposure-relevant? If not, stop and redefine the target or question.

## Stage 2: Generate candidate determinants

- Convert residue-level or domain-level features (surface exposure, conservation, divergence, flexibility, proximity to functional sites) into coherent candidate regions.
- Formulate competing mechanistic hypotheses: linear motif, conformational/discontinuous epitope, glycan-dependent determinant, modification-driven neoantigen, or lineage-restricted self-antigenicity.
- Assign evidence strength (speculative, low, moderate, high) and label each claim as prior-evidence, inferred, or untested assumption.
- **Iteration gate**: If no candidate region meets structural plausibility and prior-evidence convergence, expand the feature set or relax and re-rank boundaries.

## Stage 3: Design minimal proxy validation

- Design conceptual validation for the highest-priority candidate(s) using reduced constructs, overlapping fragments, or predicted surface patches.
- Specify independent variables (candidate region, target form), dependent variables (binding, competition, activity), and context variables (species, isoform, conformation).
- **Control gate**: Include negative controls (irrelevant regions, unrelated targets, matrix-only), positive/reference controls when available, and method controls (orthogonal prediction or assay). If controls cannot be defined, stop and redesign.

## Stage 4: Proxy-to-native validation

- Compare recognition of the minimal proxy/construct against the intact, full-length, or native-context target.
- **Decision gate**:
  - If proxy binds but full-target recognition is absent, suspect presentation artifact, conformational mismatch, or linear-only mimicry. Iterate by redesigning constructs or shifting to conformational hypotheses.
  - If full-target recognition is present but proxy fails, suspect discontinuous determinants or context-dependent epitopes. Iterate by expanding or splitting candidate regions.
  - If both are concordant, advance to specificity testing.

## Stage 5: Specificity and cross-reactivity testing

- Test candidates against related homologs, variant panels, irrelevant proteins, and expected background reactivity sources.
- **Stability gate**: If candidates cross-react broadly without discrimination, refine determinant boundaries or deprioritize. If negative/baseline controls show substantial signal, stop and resolve assay validity before mechanistic claims.

## Stage 6: Mechanism discrimination and evidence integration

- Integrate evidence across sequence, structure, evolutionary constraint, biochemical modification, and functional readouts using an evidence matrix.
- Separate directly observed, inferred, and extrapolated evidence.
- **Mechanism-exclusion gate**: Exclude mechanism classes that are contradicted by orthogonal evidence. If multiple mechanisms remain plausible, design the next discriminating test rather than collapsing them into one claim.

## Stage 7: Claim bounding and iteration

- Bound conclusions to the tested target form, binder class, strain/isoform panel, and assay context.
- Define stop conditions: candidate and negative controls are indistinguishable; results depend on a single method; structural accessibility is inconsistent with the claim; or safety/ethics requirements are unmet.
- **Iteration rule**: Use discordance (peptide vs. protein, binding vs. function, prediction vs. experiment) to update hypotheses, split mixed constructs, or return to candidate selection.

# Output Format

Return a structured research plan containing:

1. **Research question**: concise, testable statement about a candidate determinant or mechanism.
2. **Candidate hypotheses**: table with hypothesis, candidate region, mechanistic rationale, evidence strength, key assumptions, and likely failure modes.
3. **Evidence matrix**: rows for candidates, columns for prior association, structural plausibility, computational convergence, mapping evidence, full-target recognition, specificity, functional relevance, reproducibility, and boundary risk.
4. **Validation architecture**: minimal viable validation variables, controls, readouts, success criteria, failure criteria, and stop conditions.
5. **Analysis plan**: preprocessing rules, comparison logic, evidence-integration rules, and visualization strategy.
6. **Iteration plan**: update rules for supported, ambiguous, unsupported, or artifact-prone candidates.
7. **Validity and ethics check**: confounders, boundary conditions, reproducibility requirements, and safety constraints.
8. **Evidence boundary statement**: what is supported, what is inferred, and what remains untested.

# Validation Gates

- **Target feasibility gate**: Target must be plausibly accessible and contextually relevant; otherwise stop.
- **Control adequacy gate**: Every validation stage must specify negative, positive/reference, and specificity controls. If controls are impossible, stop.
- **Proxy-native concordance gate**: Require agreement between reduced-construct and full-target recognition before advancing specificity claims. Discordance triggers construct redesign or mechanistic revision.
- **Specificity gate**: Candidate signal must exceed baseline and irrelevant-target backgrounds. Failure requires boundary refinement or deprioritization.
- **Mechanism-convergence gate**: Advance mechanistic claims only when at least two orthogonal evidence streams agree. Single-stream claims remain hypothetical.
- **Safety/ethics gate**: Confirm that the plan stays within non-clinical research design, approved biosafety frameworks, and applicable data-governance requirements.

# Claim Boundaries

- Limit claims to the tested protein family, structural context, target form, and binder class.
- Do not treat single-study or single-source findings as field-wide consensus.
- Distinguish prediction-supported, experimentally supported, mechanistically supported, and transfer-limited evidence.
- Separate binding evidence from functional modulation, and proxy recognition from native-target recognition.
- Avoid clinical diagnostic, therapeutic, or risk-prediction claims.

# Failure Modes

- **Target mischaracterization**: Target is absent, inaccessible, or not disease-relevant in the intended context.
- **Proxy artifact**: Reduced construct binds due to presentation mimicry, linear misrepresentation, or synthetic artifact, failing to recapitulate native recognition.
- **Conformational mismatch**: Determinant depends on a native conformation, glycan context, or quaternary structure lost in simplified assays.
- **Nonspecific signal**: Binding arises from aggregation, Fc interactions, matrix effects, or sticky reagents rather than determinant-specific recognition.
- **Cross-reactivity confounding**: Candidate cannot be distinguished from related proteins, shared motifs, or pre-existing immune background.
- **Single-method dependency**: Conclusions rely on one prediction or assay format without orthogonal confirmation.
- **Over-extrapolation**: Findings from one strain, isoform, or homolog are generalized beyond the validated scope.

# Validity Checks

Before finalizing the plan or presenting conclusions, verify:

- **Sequence validity**: Residue numbering and identity are unambiguous; mature vs. precursor numbering is reconciled.
- **Prediction validity**: Computational predictions are method-dependent and uncertainty is reported.
- **Region validity**: Candidates are contiguous or structurally coherent; ambiguous regions are labeled, not forced into binary calls.
- **Control validity**: Negative, positive, specificity, and method controls are appropriate and interpretable.
- **Mechanism validity**: The proposed mechanism matches the evidence category and is not inferred from sequence similarity alone.
- **Structural validity**: Models represent relevant states; low-confidence regions are flagged.
- **Reproducibility**: Key observations can be reconstructed from the same inputs by independent researchers.
- **Statistical validity**: Metrics and decision criteria are predefined; multiple comparisons and uncertainty are handled explicitly.
- **Evidence labeling**: Paper-supported, directly observed, inferred, and untested claims are clearly separated.

# Provenance

- Derived from cluster `19`, subcluster `19.0.split0`.
- Synthesized from source skills: `surface-epitope-research-workflow` (d08a2f2abe563f40), `protein-allergen-epitope-workflow` (49bb6aa547952362), `immune-structure-antigen-discovery` (5bb54b07c18315eb), `structure-guided-functional-epitope-discovery` (eb70cc9dfcc0f482), `viral-envelope-antibody-exploration` (0038f3ba86d089db), `ror1-scfv-discovery-workflow` (d1767dc77a10b1aa), `fish-allergen-discovery-workflow` (40d08a4cf12cf496), `catalase-autoantibody-research-pattern` (83699f553a5b8122).
- Preserves the shared workflow route: coarse-to-fine immune-recognition mapping, proxy-to-native validation, and specificity testing.
