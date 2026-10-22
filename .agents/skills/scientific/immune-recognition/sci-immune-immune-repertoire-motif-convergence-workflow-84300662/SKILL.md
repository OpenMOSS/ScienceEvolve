---
name: sci-immune-immune-repertoire-motif-convergence-workflow-84300662
description: A reusable workflow for mining adaptive immune receptor repertoires to discover sequence motifs, associate them with disease or survival contexts, and validate convergence across matched controls through iterative, evidence-graded analysis.
scienceevolve-title: "Antibody and immune recognition · immune repertoire motif convergence workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

This skill guides agents through an end-to-end, observable-driven workflow for discovering and validating sequence motifs in adaptive immune receptor repertoires (TCR/BCR). It abstracts the common pattern across repertoire studies: define a biologically anchored observation, mine receptor sequences at multiple resolutions, test motif recurrence against matched controls, link findings to disease or survival relevance, and discriminate convergent selection from technical or germline bias. The workflow is designed for hypothesis generation and non-operational study planning, not for clinical diagnosis or executable laboratory protocols.

# When to use

Use this skill when the user asks to:

- Explore TCR or BCR repertoire data for recurrent sequence motifs, clonotype patterns, or convergent features across individuals or conditions.
- Associate repertoire-level observations with clinical phenotypes, survival outcomes, disease activity, or antigen-selection pressure.
- Design non-operational validation studies for candidate motifs identified through repertoire mining, fingerprinting, or paired-molecule analysis.
- Compare repertoire composition longitudinally, across tissues, or between matched host contexts to test persistence or convergence hypotheses.
- Evaluate whether an observed motif is biologically meaningful, technically artifactual, or confounded by sampling, amplification, or germline bias.

Do not use this skill for clinical diagnosis, treatment recommendations, patient management, or generation of executable wet-lab protocols.

# Inputs required

Before initiating the workflow, identify or request:

- Biological system and receptor class (e.g., TCR, BCR, antibody) and whether same-cell pairing must be preserved.
- Disease, antigen, or selective pressure context, plus the cell population or compartment under study.
- Available repertoire data types: bulk, single-cell, paired-chain, longitudinal, spectratyping, or sequence-level.
- Comparator groups: unrelated controls, phenotype-matched controls, tissue-matched controls, technical controls, and cross-context cohorts.
- Candidate feature resolution: V/J usage, CDR3 length, exact motif, fuzzy/physicochemical motif, or clonal lineage.
- Clinical or functional metadata: disease stage, activity scores, survival status, treatment exposure, antigen specificity, or functional readouts.
- Known confounders: sampling depth, batch, amplification cycles, donor background, cell viability, and platform effects.
- Ethical, privacy, biosafety, and data-governance constraints.

If key inputs are missing, return a minimum information request before proceeding.

# Core Workflow

1. **Frame the observation and define boundaries**
   - Define the research question around a repertoire-level observable (motif recurrence, convergence, divergence, or survival association).
   - Specify the parent compartment, cell population, and selective context.
   - Predefine the motif search space, control groups, and primary outcome.
   - **Gate:** If the biological question cannot be framed independently of the candidate motif, or if no appropriate comparator exists, stop and request missing inputs.

2. **Inventory and quality control**
   - Catalog data sources, sample provenance, chain pairing status, and metadata.
   - Validate sequence and annotation quality: reading frames, CDR3 boundaries, V/J assignment consistency, clone duplication, dropout, and sampling depth.
   - Flag batch effects, amplification bias, and technical artifacts.
   - **Gate:** If quality checks fail or pairing precision is inadequate for paired-chain claims, stop biological interpretation and fix data quality or redesign the sampling plan.

3. **Multi-resolution motif mining**
   - Search from broad to fine-grained: V/D/J gene usage, CDR3 length distributions, exact sequence motifs, fuzzy/physicochemical motifs, and clonal lineage structure.
   - For paired-chain data, preserve same-unit pairing during clustering and motif definition.
   - For longitudinal data, define fingerprint stability rules before comparing time points.
   - **Gate:** If broad features are uninformative, escalate to finer resolutions (e.g., CDR3 physicochemical features). If exact motifs are too sparse, generalize to motif families while tracking specificity loss.

4. **Control comparison and enrichment estimation**
   - Compare candidate motifs against unrelated, phenotype-matched, pathogenicity-matched, tissue-matched, and technical controls.
   - Estimate enrichment with uncertainty and sensitivity to control selection.
   - Test for cross-unit convergence: evaluate whether motif sharing across individuals exceeds background expectations given germline constraints and sequence-space limits.
   - **Gate:** If enrichment depends on a single annotation choice, disappears after quality filtering, or is absent in independent samples, downgrade the candidate to exploratory or reject it.

5. **Disease relevance and context anchoring**
   - Link motif recurrence to disease-relevant behavior: pathogenic potential, tissue localization, persistence, disease-stage association, or survival outcome.
   - Require functional, phenotypic, or clinical metadata to strengthen sequence-only claims.
   - **Gate:** If enrichment persists across controls but lacks disease or functional relevance, reframe the motif as a marker candidate rather than a mechanistic feature. If disease relevance is found, proceed to mechanism discrimination.

6. **Mechanism discrimination and orthogonal validation**
   - Compete explanations: antigen-driven selection, developmental selection, germline bias, tissue selection, clonal expansion, or technical artifact.
   - Design the smallest conceptual validation that distinguishes the leading mechanism from the strongest alternative (e.g., pathway contrast, orthogonal assay, structural inference, or independent replication).
   - **Gate:** If the mechanism effect is nonselective (affects the parent compartment equally), or if orthogonal evidence is conflicting, stop mechanistic claims and label the inference as ambiguous.

7. **Iteration or redesign**
   - If the motif is supported and mechanism-discriminated: refine toward generalizability, narrow boundary conditions, and plan independent replication.
   - If the motif is weak, absent, or conflicting: diagnose whether the signal was artifact, poorly resolved, or biologically unstable; redesign the screen or analysis thresholds.
   - If multiple hypotheses remain plausible: add orthogonal evidence rather than over-interpreting weak signals.
   - **Stop condition:** Terminate the workflow if controls repeatedly fail, if the signal is non-reproducible across independent samples, or if the next step would require clinical advice or executable high-risk protocols.

# Output Format

When using this skill, produce:

1. **Research question** — One sentence stating the biological context, cell population, and candidate motif or convergence feature.
2. **Hypothesis table** — For each hypothesis: claim, evidence strength, mechanistic model, key assumptions, likely failure modes, and boundary conditions.
3. **Data quality summary** — Sequence/annotation quality flags, pairing precision (if applicable), batch effects, and sampling adequacy.
4. **Motif inventory** — Broad to fine-grained candidate motifs with enrichment estimates, control comparisons, and resolution notes.
5. **Minimal validation plan** — Core comparisons, variables, controls, primary and secondary metrics, and failure criteria.
6. **Iteration roadmap** — Decision rules for upgrading, downgrading, splitting, or rejecting hypotheses based on possible outcomes.
7. **Validity and ethics statement** — Confounders, reproducibility checks, extrapolation limits, and compliance boundaries.

# Validation Gates

- **Input completeness gate:** Research question, comparators, and motif definition are independent and pre-specified.
- **Quality gate:** Sequence annotation, pairing precision, and sampling depth support the planned resolution.
- **Enrichment gate:** Candidate motifs show reproducible enrichment beyond background and technical controls.
- **Relevance gate:** Sequence patterns are anchored to disease, functional, or survival context.
- **Mechanism gate:** The leading explanation is discriminated from the strongest alternative by selective effect or orthogonal evidence.
- **Safety gate:** The proposed next step does not require clinical advice, executable protocols, or high-risk biological procedures.

# Claim Boundaries

- Keep sequence-only claims at **exploratory** strength unless replicated across independent samples and robust to analysis choices.
- Label **supported** claims only when reproduced in matched controls with pre-specified endpoints.
- Label **mechanistically plausible** claims only when competing explanations are constrained and the feature fits receptor biology.
- Label **causally supported** claims only when temporal, perturbation, or tracking evidence favors the proposed role.
- Do not generalize findings beyond the tested antigen, host background, tissue, disease stage, or platform.
- Do not treat paired-chain recovery, clonal expansion, or motif sharing as proof of pathogenicity without functional or clinical linkage.

# Failure Modes

- **Technical artifact:** Amplification bias, primer bias, sequencing error, batch effects, or annotation inconsistency produces apparent motif recurrence.
- **Sampling artifact:** Low depth, uneven sampling, or dropout causes false absence or overrepresentation of rare clones.
- **Germline confounding:** Recurrent motifs reflect germline-encoded structural constraints rather than antigen-driven convergence.
- **Control failure:** Inappropriate comparator selection leads to inflated enrichment estimates.
- **Circular inference:** Using the same data to discover and validate a motif without pre-registration or independent replication.
- **Overgeneralization:** Extending a context-specific signal to all diseases, tissues, or populations without boundary testing.
- **Mechanistic overreach:** Inferring causal antigen recognition or pathogenicity from sequence correlation alone.

# Validity Checks

- **Population validity:** Is the studied population defined independently of the candidate motif?
- **Control validity:** Are unrelated, phenotype-matched, pathogenicity-matched, tissue-matched, and technical controls included?
- **Annotation validity:** Are CDR3 boundaries, V/J assignments, reading frames, clone duplication, and pairing links handled consistently?
- **Motif validity:** Is the motif exact, fuzzy, physicochemical, or germline-derived, and is that distinction explicit?
- **Statistical validity:** Are enrichment, uncertainty, multiple testing, sample selection, and sensitivity analyses addressed?
- **Mechanism validity:** Are antigen selection, developmental selection, germline bias, tissue selection, clonal expansion, and technical bias considered as alternatives?
- **Reproducibility:** Is the feature replicated across independent samples, datasets, or annotation choices?
- **Boundary validity:** Does the claim remain within the tested antigen, host, tissue, disease stage, and platform context?
- **Ethical validity:** Are human data, animal research, biosafety, and privacy constraints handled before any validation is proposed?

# Provenance

- Derived from cluster 73 / subcluster 73.0.split0 via semantic merge of representative source skills.
- Source skill references: `tcr-motif-autoimmunity-exploration`, `paired-molecule-repertoire-discovery`, `ig-cdr3-fingerprint-exploration`, `rare-bcell-subset-research-workflow`, `antigen-repertoire-longitudinal-exploration`, `autoimmune-repertoire-exploration`, `sequence-distribution-role-inference`, `allergen-epitope-discovery-workflow`.
- Synthesized as an end-to-end workflow skill; no paper-specific systems, parameters, or conclusions are preserved.
