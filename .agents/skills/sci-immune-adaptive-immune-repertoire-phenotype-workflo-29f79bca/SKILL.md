---
name: sci-immune-adaptive-immune-repertoire-phenotype-workflo-29f79bca
description: A reusable end-to-end workflow to compare immune receptor repertoires across biological compartments or conditions, link clonal usage patterns to phenotypes, and iterate from observation to mechanistic hypothesis with appropriate controls and boundary checks.
scienceevolve-title: "Antibody and immune recognition · adaptive immune repertoire phenotype workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Guide agents in designing and executing comparative immune-repertoire studies that connect clonal patterns to phenotypes while distinguishing biological signal from technical artifact, confounding, and sampling bias.

# When to use

Use this skill when the task involves:
- comparing immune receptor repertoires across compartments, conditions, or phenotypic strata;
- linking clonal usage, diversity, or sequence features to biological states or phenotypes;
- planning controls and validation for repertoire-phenotype associations;
- iterating from exploratory repertoire patterns to testable mechanistic hypotheses.

Do not use for clinical decision-making, patient-specific interpretation, diagnostic advice, or operational wet-lab execution.

# Inputs required

Before starting the workflow, collect or infer:
- **Biological context**: target compartments or conditions, phenotype classes, and the receptor system under study.
- **Comparison axes**: the primary contrast (e.g., local versus systemic, treated versus untreated, phenotype-positive versus phenotype-negative).
- **Sample constraints**: availability, metadata completeness, ethical approvals, biosafety limits, and privacy requirements.
- **Repertoire readouts**: planned sequence, usage, clonality, or motif-level measurements.
- **Prior evidence**: known determinants, expected background patterns, and competing hypotheses.
- **Success criteria**: whether the goal is hypothesis generation, association testing, or mechanism discrimination.

# Core Workflow

1. **Frame Question and Boundaries**  
   Define the biological compartments or conditions, phenotype classes, receptor system, and the specific repertoire-phenotype link to be tested.  
   *Decision gate:* Stop if the comparison lacks a clear biological rationale or feasible comparator.

2. **Generate Competing Hypotheses**  
   Translate expected or observed repertoire patterns into alternative mechanistic explanations (e.g., local selection, clonal expansion, trafficking, sampling bias, technical artifact). For each, state expected signatures, key assumptions, failure modes, and minimum evidence needed.  
   *Decision gate:* If hypotheses are not falsifiable with available or obtainable data, narrow scope or stop.

3. **Design Comparison Schema**  
   Specify independent variables (compartment, condition, phenotype stratum), dependent repertoire endpoints (usage bias, diversity, clonal overlap, recurrent features), and a tiered control strategy (positive, negative, technical, biological).  
   *Decision gate:* Redesign if controls cannot separate biological signal from confounding or batch effects.

4. **Quality Control and Normalization**  
   Audit metadata completeness, filter low-quality samples, and normalize for sampling depth, cell composition, tissue purity, and technical batch.  
   *Stop condition:* Halt if quality is insufficient, batch effects are unresolvable, or metadata are inadequate for paired comparisons.

5. **Extract Repertoire Features**  
   Quantify receptor-family usage, clonal relatedness, diversity metrics, shared sequence motifs, and compartment overlap.  
   *Decision gate:* Revisit normalization if features are driven by technical variation rather than biology.

6. **Compare Across Compartments or Conditions**  
   Test for differential usage, convergence, or divergence between groups. Evaluate concordance and discordance before pooling.  
   *Decision gate:* Treat patterns as preliminary if they do not replicate across independent samples or batches.

7. **Link Features to Phenotype**  
   Associate repertoire patterns with phenotypic strata using covariate-adjusted models. Correct for multiple comparisons and report effect sizes with uncertainty.  
   *Decision gate:* Stop or reformulate if associations disappear after confounder adjustment or do not meet predefined statistical thresholds.

8. **Discriminate Mechanisms**  
   Separate observation from mechanism. Distinguish selection, expansion, trafficking, and bias using specificity contrasts, orthogonal readouts, or perturbation logic where available.  
   *Decision gate:* Label conclusions as observed, inferred, or speculative. Do not promote to mechanism claims without orthogonal support.

9. **Iterate and Refine**  
   Update hypotheses based on concordant or discordant signals, then return to Step 2, 3, or 7 as appropriate.  
   *Stop conditions:* Controls fail; signal is indistinguishable from artifact; phenotype labels are unreliable; ethical or biosafety requirements are unmet.

10. **Finalize Outputs and Boundaries**  
    Document claims, evidence grades, limitations, and the next decision (continue, redesign, validate, or stop).

# Output Format

When using this skill, produce:

1. **Research question and boundaries** — disease or biological context, receptor system, compartments, and phenotype class.
2. **Competing hypotheses table** — hypothesis, expected pattern, evidence strength, key assumptions, and failure modes.
3. **Comparison design schema** — variables, controls, primary and secondary endpoints, and stop conditions.
4. **Quality-control and normalization report** — exclusions, batch structure, and normalization approach.
5. **Repertoire feature summary** — usage, diversity, clonality, overlap, and motif metrics.
6. **Cross-compartment/condition comparison** — concordant and discordant patterns with uncertainty.
7. **Phenotype association results** — covariate-adjusted associations, effect sizes, and multiple-testing status.
8. **Mechanistic interpretation** — evidence grade for each claim (observed, inferred, speculative).
9. **Iteration plan and next decision** — how results update hypotheses and whether to continue, redesign, validate, or stop.
10. **Validity, ethics, and boundary statement** — confounders, reproducibility requirements, scope limits, and non-clinical disclaimer.

# Validation Gates

- **Specificity**: Probes or assays detect intended receptor features and not background or framework signals.
- **Sample integrity**: Metadata are complete, identities are correct, and low-quality samples are flagged or excluded.
- **Normalization adequacy**: Comparisons account for sampling depth, composition, batch, and tissue purity.
- **Reproducibility**: Patterns replicate across independent samples, donors, or batches before biological interpretation.
- **Control separation**: Positive, negative, technical, and biological controls produce interpretable separation.
- **Statistical validity**: Endpoints are predefined, multiple comparisons are adjusted, and effect sizes include uncertainty.
- **Mechanistic support**: Mechanism claims require orthogonal evidence; repertoire-phenotype associations alone do not prove causality.

# Claim Boundaries

- Repertoire data alone can support detected bias and reproducible association, but cannot establish antigen specificity, causality, or clinical actionability.
- Claims are bounded by the tested receptor system, compartments, conditions, and population.
- Distinguish observed patterns, statistically supported associations, inferred mechanisms, and speculative extensions.
- Do not generalize from a single cohort, assay platform, or source paper to field-wide consensus.

# Failure Modes

- Probe or assay lacks specificity for intended receptor features.
- Controls fail to separate cleanly (positive/negative overlap).
- Signal is confounded by batch effects, immune-cell composition differences, or sampling bias.
- Insufficient sampling depth or cell count produces artifactual diversity or clonality patterns.
- Phenotype labels are unreliable, misaligned with repertoire data, or subject to circular selection.
- Clonal thresholds or reference assignments are ambiguous or inconsistent.
- Results reverse across independent assay formats or batches without plausible explanation.
- Ethical, privacy, or biosafety constraints invalidate the proposed design.

# Validity Checks

- **Confounding**: Evaluate donor background, tissue location, disease state, time point, processing batch, and immune-cell composition.
- **Sampling bias**: Assess whether regions or samples were selected because they already appeared interesting.
- **Technical bias**: Consider amplification, sequencing error, contamination, reference limits, and platform-specific artifacts.
- **Statistical validity**: Check for small counts, multiple comparisons, clonal-threshold uncertainty, and inappropriate pooling.
- **Reproducibility**: Require independent replication, preserved provenance, and consistent analysis rules.
- **Boundary conditions**: Sequence and repertoire evidence alone do not identify antigen, prove causality, or establish field consensus.
- **Ethics and safety**: Confirm appropriate approvals, consent, de-identification, and non-clinical scope before interpreting human or animal data.

# Provenance

Derived from cluster 45, subcluster 45.1.split0. Synthesized from source skills: immune-repertoire-research-design, tcr-repertoire-spectratyping-oncology-exploration, antigen-cd4-discovery-workflow, antibody-idiotypic-exploration-workflow, receptor-targeted-immunomodulation, idiotype-context-research-workflow, hiv-envelope-antibody-escape-workflow, idiotype-regulation-research-pattern. Paper-specific systems, materials, parameters, numerical results, and conclusions have been abstracted or removed.
