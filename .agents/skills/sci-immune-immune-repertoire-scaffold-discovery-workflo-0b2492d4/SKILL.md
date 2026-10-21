---
name: sci-immune-immune-repertoire-scaffold-discovery-workflo-0b2492d4
description: Reusable end-to-end workflow for mining natural or synthetic immune repertoires to discover binding scaffolds and affinity reagents, with mechanism-aware validation and iterative refinement.
scienceevolve-title: "Antibody and immune recognition · immune repertoire scaffold discovery workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Use this skill to design research programs that mine natural or synthetic immune repertoires to discover binding scaffolds and affinity reagents. It guides hypothesis generation, candidate prioritization, non-operational validation design, and iterative refinement while separating binding from function and preserving mechanistic interpretability.

# When to use

Use this skill when the user asks to:
- Discover binders, antibodies, scaffold proteins, or affinity reagents from immune repertoires, display libraries, or genomic/transcriptomic datasets.
- Plan repertoire mining, candidate ranking, specificity validation, or scaffold transfer to a new targeting context.
- Evaluate whether a repertoire-derived candidate is likely to be specific, functional, and transferable.
- Design comparative or evolutionary analyses of repertoire-derived binding families.

Do not use this skill for clinical recommendations, therapeutic decision-making, operational wet-lab protocols, or executable production procedures.

# Inputs required

Before generating hypotheses or designs, collect or state assumptions for:

- **Target definition**: antigen, receptor, cell phenotype, molecular state, or biological event that defines the desired recognition.
- **Repertoire source**: natural (e.g., B-cell, T-cell, in vivo repertoire) or synthetic (e.g., phage, yeast, ribosome, computational library).
- **Available data**: sequences, structures, binding data, repertoire annotations, database provenance, or comparative genomics evidence.
- **Candidate class**: antibody, fragment, nanobody, scaffold protein, peptide, or engineered variant.
- **Functional objective**: binding, neutralization, targeted delivery, immune modulation, or diagnostic readout.
- **Constraints**: biosafety limits, ethics approvals, computational-only scope, non-clinical boundaries, and governance requirements.

# Core Workflow

Follow this ordered end-to-end route. Each gate is a hard decision point; stop or redesign if the gate is not satisfied.

## Stage 1: Define target and repertoire scope
- State the biological event, target state, and the recognition or delivery gap.
- Select the repertoire source and establish provenance audit rules (species, construct, expression host, annotation quality).
- **Gate 1**: Stop if the target is ill-defined, or if repertoire provenance cannot support downstream inference.

## Stage 2: Mine and prioritize candidates
- Search for convergent sequence, structural, or chemical features compatible with the target.
- Cluster candidates by family, clonal lineage, scaffold class, or architectural motif.
- Rank by plausible functional association rather than abundance, popularity, or homology alone.
- **Gate 2**: Stop if candidates lack coherent binding architecture or if database/library annotation is too ambiguous to trust.

## Stage 3: Generate mechanistic hypotheses
For each candidate or family, generate testable hypotheses in order:
1. **Feature-convergence**: the candidate presents a target-compatible recognition feature.
2. **Feature-function**: the proposed feature contributes to target association.
3. **Scaffold-compatibility**: the scaffold supports the feature without unacceptable folding or display penalties.
4. **Specificity/selectivity**: the candidate discriminates the target from related off-targets.
5. **Function-concordance**: binding phenotype corresponds to the intended functional outcome.
- Label evidence strength (low/moderate/high/context-dependent) and the most likely failure mode for each.
- **Gate 3**: Stop if no hypothesis can be tested by a minimal validation panel without unsafe operational detail.

## Stage 4: Design minimal viable validation
- Define variables: candidate identity, target state, comparator binders, readout classes.
- Assemble a strong control set: positive, negative, feature-negative, specificity, and mechanistic controls.
- Explicitly separate binding readouts from functional readouts.
- Define primary and secondary metrics, plus stop conditions, before testing.
- **Gate 4**: Stop if controls are insufficient to distinguish specific binding from nonspecific artifact, developability failure, or assay interference.

## Stage 5: Collect evidence (non-operational design level)
- Assess binding activity relative to background and comparators.
- Profile specificity against related targets and expected off-targets.
- Map determinants (epitope/paratope, domain, modification, or structural state).
- Evaluate scaffold fitness (expression, folding, stability, aggregation) independently from target binding.
- **Gate 5**: If binding is absent, off-target activity dominates, or scaffold fitness fails, deprioritize the candidate and return to Stage 2 or 3.

## Stage 6: Integrate and map mechanism
- Correlate sequence/structural features with binding and functional outcomes.
- Distinguish correlation from causation; require rescue or disruptive logic for causal claims.
- Determine whether evidence supports recognition-overlap, phenotype-association, or scaffold-transfer logic.
- **Gate 6**: If mechanism remains ambiguous after orthogonal checks, do not promote the candidate to broader claims.

## Stage 7: Iterate or terminate
- **Promote**: candidates with reproducible target activity, acceptable off-target profile, coherent mechanism, and scaffold fitness.
- **Refine**: candidates with promising activity but ambiguous specificity by adding off-target models, target-state perturbations, or determinant-mapping tests.
- **Split**: divergent families or architectures that imply different mechanisms into separate hypothesis tracks.
- **Deprioritize**: candidates with binding but no function unless a scaffold-compatibility or presentation hypothesis can be tested safely.
- **Pivot**: if the target phenotype is not sufficiently distinct from off-target populations, redefine the target or repertoire filter.
- **Stop**: if the design requires unsafe operational protocols, clinical extrapolation, or if no rescue path exists after mechanistic revision.

# Output Format

Return results in this structure:

```markdown
## Research question
- Target context:
- Repertoire source and provenance status:
- Functional gap:

## Candidate hypotheses
| Hypothesis | Mechanism | Evidence strength | Key assumptions | Failure modes | Validated vs inferred |

## Minimal viable validation
- Target model:
- Off-target comparators:
- Candidate set and controls:
- Readouts (binding vs. functional):
- Stop conditions:

## Analysis plan
- Selectivity logic:
- Binding-function logic:
- Determinant mapping:
- Reproducibility and uncertainty checks:

## Iteration decision
- Promote:
- Refine:
- Deprioritize:
- Stop or redesign:

## Validity and safety notes
- Confounders:
- Boundary conditions:
- Ethics and compliance limits:
```

# Validation Gates

1. **Target and provenance clarity**: The target state is defined and repertoire annotations can be audited for species, construct, and source reliability.
2. **Architectural coherence**: Candidates possess recognizable binding architecture and are not selected solely by abundance or weak homology.
3. **Testability**: At least one hypothesis can be addressed by a minimal, safe, non-operational validation panel.
4. **Control sufficiency**: The design includes positive, negative, feature-negative, and specificity controls adequate to separate binding from artifact.
5. **Evidence convergence**: Binding, specificity, determinant mapping, and scaffold fitness are each evaluated before mechanistic claims are advanced.
6. **Mechanistic resolution**: Orthogonal evidence or rescue/disruptive logic supports causal interpretation before promotion.

# Claim Boundaries

- Distinguish repertoire-mining predictions from experimentally validated binders.
- Distinguish in vitro binding from functional delivery, neutralization, or modulation.
- Distinguish model-system or computational evidence from clinical or in vivo relevance.
- Mark species, strain, scaffold, expression host, and assay-context limits explicitly.
- Do not treat a single paper's favorable pattern as field-wide consensus.

# Failure Modes

- **Provenance ambiguity**: Unreliable database labels, mixed synthetic/natural library composition, or unresolved construct metadata mislead candidate selection.
- **Homology trap**: High sequence or structural similarity to known binders does not guarantee equivalent function or specificity.
- **Binding without function**: Strong target association in the absence of the intended functional outcome.
- **Off-target dominance**: Activity on related targets or shared features exceeds desired selectivity.
- **Scaffold incompatibility**: A recognition feature is present but destabilized, misfolded, or sterically blocked in the chosen scaffold or display context.
- **Assay artifact**: Aggregation, nonspecific interference, batch effects, or expression/folding defects dominate the readout.
- **Mechanistic overinterpretation**: Correlation between mutation, feature, or lineage and phenotype is treated as causation without targeted validation.

# Validity Checks

Before presenting a plan or conclusion, verify:
- **Confounding**: Target state, marker density, activation status, species differences, cell-line artifacts, and mixed-population composition are considered.
- **Specificity**: Unrelated binders, unrelated targets, and closely related off-targets are included.
- **Mechanism**: Binding, scaffold display, entry, and downstream readout are distinguished rather than conflated.
- **Reproducibility**: Independent samples, batches, candidate families, or data sources are conceptually included.
- **Statistical validity**: Endpoints, comparators, effect sizes, variability, and uncertainty are defined before interpreting results.
- **Boundary conditions**: Findings are limited to the tested model system and not extrapolated to clinical use.
- **Evidence labeling**: Every claim is marked as paper-derived, literature-supported, reproduced in the proposed study, or speculative.

# Provenance

- Synthesized from cluster 39, subcluster 39.0.split0.
- Derived from representative source skills: cell-targeted-delivery-discovery, sulfation-mimicry-antibody-discovery, schistosome-antigen-discovery-workflow, engineered-glycosylation-antibody-fragment-discovery, antibody-database-provenance-research-design, comparative-immune-receptor-discovery, oligoclonal-antibody-evolution-research, structure-guided-antibody-humanization-workflow.
- Source-specific biological systems, materials, operational parameters, numerical results, and paper conclusions have been removed to produce a reusable workflow.
