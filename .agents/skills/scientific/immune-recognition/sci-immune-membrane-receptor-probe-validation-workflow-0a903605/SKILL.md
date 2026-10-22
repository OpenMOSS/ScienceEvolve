---
name: sci-immune-membrane-receptor-probe-validation-workflow-0a903605
description: A reusable end-to-end workflow for developing and validating probes that recognize cell-surface receptors in their native state, mapping molecular determinants of recognition, inferring topology and accessibility, and discriminating receptor states.
scienceevolve-title: "Antibody and immune recognition · membrane receptor probe validation workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Guide agents to design, validate, and iterate receptor-targeting probe strategies for cell-surface proteins in native cellular contexts. The workflow emphasizes distinguishing true native-state recognition from artifacts, mapping the structural and contextual determinants of probe behavior, and using validated probes to discriminate receptor abundance, conformation, trafficking, and signaling states.

# When to use

Use this skill when:
- Exploring cell-surface receptor biology where new questions require probes that distinguish native-state exposure, conformation, trafficking, or ligand-induced states.
- Developing or evaluating antibodies, nanobodies, ligands, biosensors, or other affinity reagents for membrane targets.
- Explaining why a probe works in purified, denatured, or immobilized assays but fails on intact cells.
- Mapping epitopes, domains, accessibility determinants, or state-dependent features of membrane receptors.
- Testing whether a perturbation changes receptor surface abundance, internalization, or direct activation.
- Generating research questions from evidence about receptor topology, glycosylation, species differences, or state-dependent conformations.

Do not use this skill as a substitute for clinical diagnosis, treatment advice, or operational wet-lab execution instructions.

# Inputs required

Before designing a study, collect:

1. **Target and system** — Receptor identity, known domains, predicted topology, post-translational modifications, species, and expression context (endogenous, engineered, or heterologous).
2. **Biological question** — Whether the question concerns surface abundance, localization, conformation, trafficking, downstream signaling, or determinant mapping.
3. **Probe concept** — Candidate recognition element class and intended readout modality.
4. **Assay landscape** — Available native-cell, denatured/immobilized, biochemical, imaging, and functional readouts.
5. **Model systems** — Target-present, target-absent or target-low comparators, including species or isoform differences.
6. **Constraints** — Non-clinical scope, biosafety level, ethical approvals, sample availability, and reproducibility requirements.

# Core Workflow

Follow the stages in order. At each decision gate, stop, redesign, or iterate if the criteria are not met.

## Stage 1: Define the measurement gap and state space
- State the biological question and the receptor state(s) to be distinguished (e.g., surface-exposed, internalized, ligand-bound, modified).
- Identify why existing probes or readouts are insufficient.
- **Decision Gate 1:** Is the state definable and distinguishable from total abundance or generic presence? If no, refine the question before proceeding.

## Stage 2: Generate probe hypotheses
- Propose candidate recognition principles based on predicted accessibility, known motifs, or structural hypotheses.
- Treat predictions as hypothesis-generating, not as proof of native-state accessibility.
- **Iteration:** If no plausible recognition handle exists, pivot to alternative biochemical or computational strategies.

## Stage 3: Minimal viable specificity validation
- Compare target-present versus target-absent or target-reduced conditions.
- Include negative controls (scaffold-only, isotype-matched, or irrelevant binder) and detection-system controls.
- **Decision Gate 2:** Does the candidate show target-dependent signal above background in at least one assay context? If no, redesign the probe concept or stop.

## Stage 4: Native-state context validation
- Compare recognition across denatured/immobilized, purified, and intact-cell presentations.
- Evaluate whether the epitope or binding site is masked, conformation-dependent, glycosylation-dependent, or species-specific.
- Use orthogonal detection methods to confirm surface localization and accessibility.
- **Decision Gate 3:** Does the probe recognize the native receptor in intact cells with acceptable background? If no, map accessibility barriers or select a different probe class.

## Stage 5: Determinant mapping and topology inference
- Compare recognition across variants, perturbations, or related targets to identify candidate sequence, domain, or modification determinants.
- Test bidirectional predictions when feasible: altering a negative case toward the positive pattern should increase response, and vice versa.
- **Decision Gate 4:** Is the determinant hypothesis supported by orthogonal evidence and falsifiable? If ambiguous, add rescue, partial perturbation, or independent readouts.

## Stage 6: Receptor-state discrimination
- Apply the validated probe to conditions expected to enrich or deplete the state of interest.
- Separate surface abundance changes from conformational or trafficking changes using paired readouts (e.g., surface probe versus downstream signaling).
- Include perturbation controls to exclude direct activation blockade or global toxicity.
- **Decision Gate 5:** Does probe signal covary with the intended state independently of total abundance? If no, reassess the state definition or probe selectivity.

## Stage 7: Mechanistic integration and iteration
- Synthesize binding, mapping, and functional evidence into a coherent model.
- Classify conclusion strength: **Validated** (target-dependent and orthogonal), **Supported** (consistent but incomplete controls), **Speculative** (plausible without direct native-state evidence), or **Rejected** (contradicted by decisive controls).
- Define the next discriminating experiment or terminate if the measurement gap is closed.
- **Stop conditions:** Nonspecific signal dominates; positive/negative controls fail; probe binding alters receptor state; ethical or safety constraints block progression.

# Output Format

When using this skill, return:

1. **Research question** — One sentence stating the biological question and system.
2. **Gap and rationale** — What measurement or mechanism is missing and why it matters.
3. **Hypothesis table** — Hypothesis, predicted pattern, required evidence, evidence strength, key assumption, and failure mode.
4. **Experimental design** — Staged validation with minimal viable tests, strong controls, variables, endpoints, and stop conditions.
5. **Analysis plan** — Normalization, paired comparisons, uncertainty quantification, and inference logic.
6. **Iteration plan** — How results update hypothesis ranking and what the next discriminating test would be.
7. **Validity and boundary statement** — Confounders, reproducibility checks, claim limits, and ethics constraints.

# Validation Gates

- **Gate 1 (State Definition):** The target state is biologically distinct and measurable independently of total abundance.
- **Gate 2 (Target Dependence):** Signal requires the intended target in at least one validated assay context.
- **Gate 3 (Native Relevance):** Probe recognizes the intact-cell receptor with low nonspecific background.
- **Gate 4 (Determinant Support):** Perturbation or variant evidence links recognition to a specific molecular feature.
- **Gate 5 (State Discrimination):** Probe signal covaries with the intended receptor state under orthogonal validation.
- **Gate 6 (Mechanistic Coherence):** Functional and localization data converge on a consistent, bounded model.

# Claim Boundaries

- Claims are limited to the tested receptor class, probe format, cell model, and assay conditions.
- Native-state recognition does not imply physiological relevance or clinical utility.
- Determinant mapping identifies candidate features, not necessarily exact residue-level or structural mechanisms.
- State discrimination describes observable covariation, not proof of causal mechanism.
- Single-system findings are not treated as field consensus; independent replication is required before generalizing.

# Failure Modes

- Probe recognizes denatured or purified target but fails on native cells due to epitope masking or conformational dependence.
- High background or nonspecific binding obscures specific signal.
- Probe binding sterically interferes with receptor function or alters the state being measured.
- Perturbation causes global toxicity, conformational collapse, or off-target pathway effects rather than specific state change.
- Species, isoform, or glycosylation differences prevent cross-reactivity.
- Assay artifacts such as fixation, detection reagents, or autofluorescence mimic state-specific signal.
- Overinterpretation of single-assay, single-variant, or single-perturbation evidence.

# Validity Checks

Before treating a result as mechanistic, verify:

- **Specificity** — Signal decreases when the target is absent, reduced, mutated, or independently blocked; nonspecific binding is comparable to negative controls.
- **Native-state relevance** — The assay preserves the receptor in an intact cellular membrane; denatured or purified-protein results are not overinterpreted as native-state evidence.
- **Epitope accessibility** — The binding site is not artifactually hidden or exposed by preparation conditions.
- **Abundance independence** — State-specific signal is separable from total target amount.
- **Orthogonal agreement** — Independent probes, labels, or readouts measuring the same biological state yield consistent results.
- **Reproducibility** — Results are replicated across biological replicates, independent preparations, or batches; analysis thresholds and exclusion criteria are documented.
- **Statistical validity** — Endpoints are predefined, effect sizes and uncertainty are reported, and multiple comparisons are corrected when needed.
- **Control coherence** — Positive, negative, mock, and detection controls behave as predicted.

# Provenance

Synthesized from cluster 63 / subcluster 63.0.split0. Source skills: membrane-receptor-probe-discovery (0911a750e1ea8aba), glycan-epitope-discovery-workflow (74bb16fe1e9a32b5), targeted-optical-probe-research (6dcc2df6ea675326), receptor-motif-grafted-protein-design (6de221566fc3be8c), epitope-affinity-purification-workflow (d3724a3d224e8b26), membrane-protein-determinant-mapping (84e439c1feebb8b6), ror1-nanobody-discovery-workflow (b828b75befbdb306), peroxisome-import-receptor-exploration (d46fb60c22398795).
