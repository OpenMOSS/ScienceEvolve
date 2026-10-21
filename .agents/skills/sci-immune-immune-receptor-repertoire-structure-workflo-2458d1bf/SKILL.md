---
name: sci-immune-immune-receptor-repertoire-structure-workflo-2458d1bf
description: Use when designing end-to-end non-clinical research plans that triangulate immune-receptor sequence, structure, and function to discover and validate recognition mechanisms from repertoires while bounding claims and excluding operational protocols.
scienceevolve-title: "Antibody and immune recognition · immune receptor repertoire structure workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

This skill guides an agent through a reusable, non-operational workflow for discovering and validating immune-receptor recognition mechanisms—spanning immunoglobulin and T-cell receptor variable regions—by triangulating sequence diversity, structural inference, and functional readouts from repertoires. It synthesizes target qualification, repertoire mapping, candidate triage, orthogonal validation, and iterative hypothesis updating without treating any single study’s findings as universal truth.

# When to use

Use this skill when the user asks to:

- Propose research questions that link immune-receptor repertoire diversity to antigen recognition, binding specificity, or functional outcome.
- Design conceptual workflows for mining natural, synthetic, or biologically enriched repertoires for candidate receptors or fragments.
- Validate whether sequence features, gene-family usage, or predicted structures explain observed recognition.
- Iterate from preliminary binding or repertoire data to refined mechanistic hypotheses.
- Evaluate controls, confounders, reproducibility, and extrapolation boundaries in receptor-discovery projects.

Do not use this skill for clinical advice, treatment recommendations, operational wet-lab protocols, or hazardous biological procedures.

# Inputs required

Before producing a research plan, ask for or infer:

- **Biological question:** target antigen or ligand, disease or exposure context, and intended non-clinical research use (e.g., detection, blocking, mechanistic probing).
- **Repertoire source:** origin and expected diversity (natural, synthetic, biologically enriched, spatially sampled) with rationale for enrichment.
- **Evidence base:** what is literature-supported, assumption-based, or agent-inferred.
- **Available readouts:** sequence, structural prediction, binding, specificity, functional activity, or spatial localization.
- **Comparators and controls:** reference binders, negative targets, irrelevant receptors, orthogonal assays.
- **Constraints:** ethics, biosafety, privacy, data governance, and non-operational boundaries.

If critical inputs are missing, state assumptions explicitly and mark conclusions as tentative.

# Core Workflow

1. **Target & Question Qualification**
   - Define the non-clinical research question, target antigen or ligand, and intended use.
   - Justify target relevance and accessibility using evidence independent of the discovery result.
   - **Gate 1 — Stop/Pivot:** If target relevance is unsupported, the question is clinical, or accessibility is implausible, stop or reframe.

2. **Repertoire & Diversity Mapping**
   - Select a repertoire source and strategy that plausibly contains relevant diversity.
   - Preserve metadata and assess integrity, coverage, and contamination risk.
   - **Gate 2 — Iterate:** If repertoire quality is poor, diversity is inadequate, or metadata are missing, redesign the source or sampling before proceeding.

3. **Sequence-to-Structure Triangulation**
   - Map variable-region sequences, gene-family usage, and clonal relatedness with transparent rules.
   - Infer structural features and correlate sequence clusters with predicted recognition motifs.
   - **Gate 3 — Iterate:** If sequence-structure links are ambiguous, dominated by annotation artifacts, or sensitive to clone-definition thresholds, refine models or definitions.

4. **Candidate Triage & Primary Screening**
   - Rank candidates by target engagement, sequence integrity, and predicted structural compatibility.
   - Include minimal controls: negative targets, background, and process controls.
   - **Gate 4 — Stop:** If no candidates exceed background, or if controls fail, stop and revisit target or repertoire assumptions.

5. **Orthogonal Validation & Specificity Testing**
   - Confirm target recognition with at least one independent readout.
   - Test specificity against related antigens, tags, matrix components, and irrelevant receptors.
   - **Gate 5 — Iterate:** If binding is assay-specific, matrix-dependent, or non-specific, redesign the candidate format or control set.

6. **Native-Context & Functional Validation**
   - Test whether recognition transfers from simplified or recombinant contexts to biologically relevant samples.
   - Separate binding from functional effect using binding-only, effector-only, and non-targeting controls.
   - **Gate 6 — Stop/Pivot:** If recognition disappears in native context, or target-negative controls respond similarly, revise target accessibility or mechanism assumptions.

7. **Mechanism Discrimination & Claim Bounding**
   - Compare alternative mechanisms (e.g., direct recognition, conformational dependence, combinatorial pairing).
   - Bound claims: label evidence as observed, inferred, or speculative; define extrapolation limits.
   - **Gate 7 — Proceed/Archive:** Advance only if convergent evidence supports a bounded mechanistic claim; otherwise, redesign or stop.

8. **Iteration & Hypothesis Update**
   - Update evidence strength for each hypothesis based on the limiting bottleneck.
   - Decide whether to proceed to stronger models, redesign the binding module, or stop.
   - **Stop conditions:** reproducible phenotype, orthogonal sequence/structural support, adequate controls, no control-derived artifact, and transparent uncertainty.

# Output Format

When using this skill, produce:

1. **Research question and claim boundary** — concise non-clinical question and intended use.
2. **Evidence map** — literature-supported, assumption-based, and agent-inferred claims with key uncertainties.
3. **Hypothesis set** — main and alternative hypotheses with evidence strength, key assumptions, likely failure modes, and minimal discriminating tests.
4. **Minimal viable validation plan** — target qualification, repertoire source, conceptual screening strategy, controls, primary/secondary readouts, and stop conditions.
5. **Analysis plan** — evidence chain, confounder and artifact checks, uncertainty handling, and interpretation rules.
6. **Iteration decision** — advance, redesign, or stop rationale with the next diagnostic experiment.
7. **Safety, ethics, and reproducibility notes** — oversight requirements, privacy constraints, non-clinical boundaries, and transparency requirements.

# Validation Gates

- **Target relevance gate:** target accessibility and relevance are supported independently of discovery results.
- **Repertoire quality gate:** source diversity, integrity, and metadata are adequate for the research claim.
- **Sequence-structure gate:** annotation confidence and clone-definition robustness are tested under alternative thresholds.
- **Primary screen gate:** candidate signals exceed background and process controls.
- **Orthogonal confirmation gate:** at least one independent readout confirms target recognition.
- **Native-context gate:** recognition transfers to biologically relevant material or the failure is explained.
- **Mechanism gate:** discriminating predictions distinguish among alternative mechanistic explanations.
- **Claim-boundary gate:** extrapolation limits are explicitly defined and clinical utility is not inferred.

# Claim Boundaries

- Distinguish repertoire observation from candidate discovery.
- Distinguish binding evidence from functional mechanism.
- Distinguish recombinant or simplified-antigen recognition from native-context recognition.
- Distinguish supported inference from speculative extrapolation.
- Do not generalize beyond the tested target variant, receptor source, assay format, or species.
- Do not infer clinical utility, therapeutic efficacy, or safety from binding or repertoire data alone.

# Failure Modes

- Repertoire source lacks relevant diversity or is compromised by contamination or bias.
- Target is inaccessible or conformationally masked in the intended biological context.
- Selection or screening enriches non-specific, tag-specific, or carrier-specific binders.
- Assay artifacts such as matrix effects, immobilization, or aggregation mimic specific recognition.
- Clone-definition or sequence-annotation errors generate false structural or genealogical inferences.
- Single-assay success is over-interpreted as mechanistic proof without orthogonal support.
- Lack of native-context transfer invalidates claims derived from simplified systems.
- Sampling bias or insufficient coverage distorts diversity and precursor-diversity estimates.

# Validity Checks

Before finalizing a plan or conclusion, verify:

- **Target specificity:** related proteins, isoforms, species differences, and modifications are considered.
- **Repertoire validity:** the source plausibly contains relevant diversity and coverage is adequate.
- **Control validity:** positive, negative, background, and orthogonal controls are appropriate and behave as expected.
- **Assay validity:** the readout distinguishes specific recognition from background and matrix effects.
- **Reproducibility:** results are consistent across replicates, batches, or independent samples.
- **Statistical validity:** endpoints are pre-specified, uncertainty is reported, and multiple comparisons are handled.
- **Boundary conditions:** conclusions are limited to the tested target, receptor source, species, disease state, and assay format.
- **Evidence labeling:** observed, inferred, and speculative claims are clearly separated.
- **Ethical and safety constraints:** human-subject protections, biosafety oversight, privacy, and data governance are respected.

# Provenance

- Synthesized from cluster 3, subcluster 3.1.split0.
- Derived from source skills: cancer-testis-antigen-binding-reagent-discovery (734db302223d9747), local-repertoire-antibody-discovery (39290a686fa827b3), viral-antigen-binding-fragment-exploration (e885186d2d41136b), immunoglobulin-hybrid-chain-discovery (f0227405dc2c90ab), antibody-fragment-immunotoxin-research-design (ab41fd028767bb0c), mucosal-iga-local-expansion-exploration (2a6069f85b4ddc57), motif-guided-immune-recognition-discovery (6568ae1473bec4fd), accessible-biomarker-reagent-workflow (8f26ea8e7c146cb0).
- No single source paper’s findings are treated as field consensus.
