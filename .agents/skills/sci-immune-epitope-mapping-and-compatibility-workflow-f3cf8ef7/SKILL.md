---
name: sci-immune-epitope-mapping-and-compatibility-workflow-f3cf8ef7
description: Reusable end-to-end workflow for pairwise or competition-based mapping of antibody-antigen, ligand-receptor, or protein-protein interfaces using compatibility matrices, systematic perturbation, and orthogonal localization to infer linear, conformational, or spatially separated recognition mechanisms.
scienceevolve-title: "Antibody and immune recognition · epitope mapping and compatibility workflow"
scienceevolve-area: antibody-and-immune-recognition
---

## Purpose

Synthesize a transferable research workflow for mapping molecular recognition interfaces. The workflow separates linear-sequence evidence from conformation-dependent evidence, builds pairwise compatibility matrices, and uses orthogonal perturbations to infer whether binders recognize overlapping, neighboring, or allosterically linked sites. It is designed for hypothesis generation, experimental planning, and iterative validation in non-clinical epitope, paratope, and interface studies.

## When to use

Use when designing or critiquing research on:
- Epitope/paratope mapping, binder compatibility, or receptor-ligand interface characterization.
- Cross-reactivity, specificity determinants, or minimal recognition motif discovery.
- Competition-based or sequential assembly mapping of multi-binder complexes.
- Distinguishing linear versus conformational, or overlapping versus neighboring recognition.

Do not use for clinical diagnosis, treatment recommendations, patient-specific decisions, or executable wet-lab protocols.

## Inputs required

- Target scaffold or receptor identity and available structural/sequence context.
- Binder set (antibodies, fragments, peptides, aptamers, ligands) and known binding evidence.
- Research objective: epitope grouping, compatibility mapping, mechanism discrimination, or candidate prioritization.
- Available evidence: prior binding data, competition assays, peptide/fragment panels, mutagenesis, structural models.
- Constraints: sample availability, biosafety, ethics, assay platform limits, and claim level.

## Core Workflow

An ordered, end-to-end route with decision gates and iteration/stop conditions.

1. **Define the recognition problem**
   - Frame the interface question: which regions or features mediate binding?
   - Identify the gap: motif boundaries, overlap, conformational dependence, or cross-reactivity.
   - **Gate:** Stop if the target-binder pair lacks any prior binding evidence or safe non-clinical context.

2. **Generate mechanistic hypotheses**
   - Propose candidate models: linear determinant, conformational determinant, overlapping site, neighboring site, allosteric linkage, or mixed evidence.
   - Assign evidence strength (high/medium/low/speculative), key assumptions, and likely failure modes for each.
   - **Gate:** Require at least two competing hypotheses before proceeding.

3. **Design staged validation architecture**
   - Stage A: Pairwise compatibility/competition matrix.
   - Stage B: Systematic perturbation (peptide competition, fragment mapping, site-directed variation).
   - Stage C: Orthogonal localization (structural prediction, independent assay, native-context readout).
   - Define controls: positive, negative, specificity, background, and order/reverse-order where applicable.
   - Define stop conditions: control failure, assay artifact, or unresolved confounding.

4. **Build pairwise compatibility evidence**
   - Test whether binders coexist, interfere, or depend on binding order.
   - Classify each pair as compatible, interfering, inconclusive, or assay-failed.
   - Construct a compatibility matrix; group binders by shared patterns.
   - **Gate:** If the matrix is inconsistent across replicates or lacks reverse-order tests, flag ambiguity and require replication before mechanistic inference.

5. **Add orthogonal localization evidence**
   - Overlay peptide/fragment competition, mutagenesis, or structural data to refine candidate regions.
   - Distinguish linear-region evidence from conformational evidence.
   - **Gate:** If orthogonal data conflict with the matrix, stop to redesign perturbations or capture strategy rather than forcing a single map.

6. **Integrate and classify interface mechanism**
   - Combine matrix groups with orthogonal localization to infer:
     - Overlapping sites (interference + shared localization).
     - Neighboring/allosteric sites (interference + distinct localization).
     - Linear recognition (peptide/fragment sufficient).
     - Conformational recognition (folded structure required).
   - Label each conclusion with confidence and boundary conditions.
   - **Gate:** Do not advance to functional or therapeutic claims from binding evidence alone.

7. **Iterate or terminate**
   - **Advance:** Promote hypothesis if direct binding, pairwise compatibility, and orthogonal localization agree.
   - **Refine:** Narrow claim scope if evidence is partial (e.g., from "same epitope" to "neighboring region").
   - **Redesign:** If ambiguous negatives, weak positives, or capture failures occur, revise controls, probe format, or perturbation design.
   - **Stop:** Terminate when candidates cannot be separated from plausible confounders, controls fail, or safety/ethics review is incomplete.

## Output Format

Return a structured research plan containing:
1. Research question and scope.
2. Hypothesis portfolio with evidence strength, assumptions, and failure modes.
3. Experimental design summary: variables, controls, staged validation, and stop conditions.
4. Compatibility matrix template and classification rules.
5. Analysis plan: normalization, background subtraction, uncertainty handling, and mechanism classification.
6. Iteration plan: decision rules for advancing, reframing, or stopping.
7. Validity, safety, and boundary checks.
8. Scope statement distinguishing prior evidence, agent inference, and unvalidated speculation.

## Validation Gates

Before advancing between stages:
- **Problem clarity:** The interface question is falsifiable and scoped to non-clinical research.
- **Hypothesis diversity:** At least two mechanistic alternatives are on record.
- **Control adequacy:** Positive, negative, specificity, and background controls are defined.
- **Reproducibility:** Independent replicates or reverse-order tests are planned.
- **Orthogonality:** At least two independent evidence types are required before strong mechanistic claims.
- **Safety/ethics:** Biosafety, sample governance, and institutional oversight are addressed.

## Claim Boundaries

- Binding evidence alone does not prove clinical relevance, therapeutic utility, or diagnostic value.
- Peptide non-binding does not prove absence of all linear epitopes; weak fragment binding does not prove a dominant epitope.
- Compatibility matrix groups represent candidate recognition regions, not confirmed atomic coordinates.
- A result in one scaffold form, binder class, or assay platform does not generalize to all contexts.
- Distinguish paper-verified observations from agent-generated inferences for new systems.

## Failure Modes

- **Probe/assay artifact:** Nonspecific binding, aggregation, steric hindrance, or detection background mistaken for target recognition.
- **Capture failure:** Failed scaffold immobilization or presentation abolishes recognition and is misinterpreted as biological incompatibility.
- **Presentation dependence:** Results valid only in one assay format (e.g., denatured versus native) and incorrectly generalized.
- **Overinterpretation:** Weak or single-assay signals treated as definitive mechanistic evidence.
- **Confounding by homologs:** Cross-reactive binders or shared domains produce false specificity patterns.
- **Model mismatch:** Cell-line or recombinant evidence overgeneralized to native tissue or clinical contexts.

## Validity Checks

- **Confounding:** Could steric hindrance, avidity, orientation, batch effects, or non-specific binding explain the pattern?
- **Reproducibility:** Are independent preparations, replicate assays, and blinded classification included?
- **Statistical validity:** Are thresholds, error estimates, missing-data rules, and multiple-comparison risks predefined?
- **Mechanistic plausibility:** Does the proposed map fit sequence, structure, and known functional regions without overclaiming?
- **Boundary conditions:** Are claims limited to the tested system, scaffold state, and assay format?
- **Data provenance:** Are raw observations, background corrections, classification decisions, and excluded measurements documented?

## Provenance

Derived from cluster 11 / subcluster 11.1.split0 via semantic merge of representative source skills: e1b29ed5a2c4f451, 9616a5bbd23cc3cc, d79bacfdfe44969c, 33e0ba28a1839139, 3373aca06c8db1aa, 3885893d324cc7eb, 1b658da25299658c, 5b59e641199da488. Source-specific biological systems, materials, and numerical results were excluded to produce a transferable workflow pattern.
