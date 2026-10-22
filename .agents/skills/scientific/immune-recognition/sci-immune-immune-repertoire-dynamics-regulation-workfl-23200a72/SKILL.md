---
name: sci-immune-immune-repertoire-dynamics-regulation-workfl-23200a72
description: A reusable end-to-end workflow for discovering regulatory mechanisms in immune networks by comparing phenotypic states, tracking systemic-to-local biomarker equilibria, and testing mediator necessity through perturbation and repertoire readouts.
scienceevolve-title: "Antibody and immune recognition · immune repertoire dynamics regulation workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Use this skill to design and evaluate research plans that infer immune-state structure and regulatory mechanisms from immune-repertoire profiles. It guides hypothesis generation, comparator design, multi-layer analysis, and conservative iteration without treating a single study as field consensus.

# When to use

Use this skill when:
- Proposing new questions about immune repertoire contraction, expansion, skewing, or recovery after a biological perturbation.
- Comparing protected versus susceptible, tolerant versus reactive, or stable versus event-state phenotypes.
- Tracking longitudinal repertoire dynamics or systemic-to-local biomarker equilibria.
- Evaluating whether repertoire features—such as diversity, clonality, V/J usage, CDR3 structure, shared clones, or sequence motifs—explain or monitor an immune phenotype.
- Designing non-operational validation plans to test mediator necessity and specificity.

Do not use this skill for clinical decision support, patient management, operational laboratory protocols, or therapeutic recommendations.

# Inputs required

Before generating a plan, identify:
- The biological system, perturbation, and immune state of interest.
- Candidate sample compartments and time points, with justification for biological relevance.
- Cohort definitions: index state, stable/background comparator, baseline or external reference, and any longitudinal arm.
- Metadata: demographics, treatment exposure, infection status, inflammation, tissue source, batch, assay platform, and cell-type composition.
- Repertoire data indicators: receptor locus, sequencing depth proxies, read/clone counts, annotation completeness, and missingness.
- Intended use: exploratory mechanism generation, biomarker discovery, classifier development, or validation planning.

# Core Workflow

1. **Define the immune-state gap and map mechanisms to repertoire observables**
   - Identify a biologically unresolved state where standard indicators are incomplete.
   - Frame the research question as: “Does [repertoire feature] distinguish or predict [immune state] beyond [baseline indicators]?”
   - Map proposed mechanisms to independent observables:
     - Clonal expansion → increased dominance of selected clones.
     - Repertoire contraction → reduced diversity or effective clone count.
     - Antigen-driven convergence → recurrent CDR3 motifs or shared clones across samples.
     - Reconstitution or suppression → shifted V/J usage, recombination structure, or compartment balance.
   - *Decision gate:* Stop if the state lacks a clear definition, if no plausible observable can be measured independently, or if the proposed feature is circular with the state label.

2. **Structure comparators and reference roles**
   - Assign cohort roles: index state, stable/background comparator, baseline/external reference, and longitudinal phases if dynamics are central.
   - Define covariates to record: timing, treatment, infection, inflammation, tissue compartment, cell composition, batch, and platform.
   - Define controls: technical negative, assay positive/performance, stable/background, and batch-randomized processing.
   - *Decision gate:* Redesign if index and comparator states overlap on core metadata or if appropriate reference states are unavailable.

3. **Generate ranked, falsifiable hypotheses**
   - For each candidate mechanism, produce at least one hypothesis and one alternative-model hypothesis (technical or confounding).
   - Annotate each with:
     - Evidence strength (direct, indirect, exploratory).
     - Key assumptions about timing, compartment, and assay validity.
     - Predicted pattern across availability, state, and response readouts.
     - Likely failure modes and the strongest disconfirming result.
   - *Decision gate:* Downgrade or discard hypotheses that cannot be falsified or lack a minimal conceptual validation path.

4. **Prespecify analysis rules, endpoints, and stop conditions**
   - Lock primary endpoints (one or two repertoire metrics), statistical approach, and validation strategy (independent set or locked cross-validation).
   - Define stop conditions: unreliable phenotype labels, QC failure, metadata overlap between states, disappearance of signal after confounder adjustment, or unvalidated state markers.
   - *Decision gate:* Halt if prespecification is impossible or if assay validity is unconfirmed.

5. **Audit data quality and normalize comparability**
   - Filter or flag samples with poor read support, incomplete annotation, excessive missingness, or batch artifacts.
   - Normalize for sequencing depth and platform differences before comparing clone counts or diversity summaries.
   - *Decision gate:* Exclude failed samples and reassess power; stop if batch or technical effects dominate the biological signal.

6. **Execute the diversity-to-clonotype evidence ladder**
   - Begin with global repertoire structure: diversity, clonality, dominant-clone contribution, and V/J usage distributions.
   - Escalate to family-level or gene-level skewing only after broad patterns are stable.
   - Proceed to clonotype or motif-level evidence only when candidate signals are enriched at the relevant phase and survive background correction.
   - Compare groups using distribution-aware statistics, adjust for multiple comparisons, and report effect sizes.
   - *Decision gate:* If global features do not separate groups, inspect timing, compartment, confounders, and local patterns before escalating. If local signals also fail, revisit the hypothesis or sample design.

7. **Test association, discrimination, and specificity**
   - Establish descriptive association before testing discriminative ability.
   - If classification is attempted, prevent leakage, balance or stratify splits, compare against metadata-only baselines, and evaluate calibration.
   - Distinguish target-specific regulation from total response change using subset and specificity controls.
   - *Decision gate:* If classifiers fail despite descriptive differences, retain features as mechanistic or descriptive leads rather than biomarkers.

8. **Apply regulatory-layer or state-availability triangulation**
   - Separate recognition, regulatory, effector, and outcome layers; or triangulate availability, pre-existing state, and response recruitment.
   - Check whether the proposed regulatory node changes before the effector output.
   - Test whether the same input produces different outcomes in different regulatory or state contexts.
   - Compare benign versus pathological, transient versus persistent, and targeted versus non-targeted perturbations.
   - *Decision gate:* If state or regulatory manipulation does not shift the outcome as predicted, revise the causal model rather than forcing the original hypothesis.

9. **Integrate convergent and orthogonal evidence**
   - Require agreement across independent evidence streams (e.g., repertoire metric, state marker, functional readout, orthogonal assay) before increasing confidence.
   - Use positive controls to confirm assay competence and negative controls to detect nonspecific signal.
   - Label each finding as observed association, validated association, or inferred mechanism.
   - *Decision gate:* If evidence streams disagree, generate technical or mechanistic hypotheses to explain discordance. Do not advance to strong mechanistic claims on a single stream.

10. **Iterate, reframe, or stop**
    - **If supported:** Require alignment across layers and boundary tests before generalizing. Design orthogonal validation or a second context.
    - **If partially supported:** Identify the failing layer, revise the causal diagram, and add discriminating comparisons.
    - **If contradicted:** First verify controls and confounders. If robust, abandon or substantially revise the causal claim and preserve the failed prediction as boundary evidence.
    - **If ambiguous:** Improve measurement specificity, reduce confounding, or split the hypothesis into smaller testable claims.
    - *Stop conditions:* Controls fail; confounding dominates; signal is non-reproducible across independent runs or cohorts; repeated results contradict the predicted direction; or compliance review is missing.

# Output Format

Return a structured research plan with the following sections:
1. **Research question** — concise question and intended use.
2. **Evidence map** — what is source-supported, what is inferred, and what is unknown.
3. **Hypotheses** — table with mechanism, evidence strength, key assumptions, predicted pattern, failure modes, and minimal validation.
4. **Comparator and control design** — cohort roles, variables, controls, primary metrics, validation strategy, and stop conditions.
5. **Analysis plan** — QC, normalization, statistical tests, visualization, feature screening, classifier safeguards, and interpretation rules.
6. **Integration and iteration plan** — convergence criteria and update rules for supported, partial, contradictory, or ambiguous outcomes.
7. **Validity and ethics checklist** — confounders, reproducibility checks, boundary conditions, and safety/ethics constraints.

# Validation Gates

- Phenotype labels are reliable and distinct from comparators on core metadata.
- Assay and technical controls confirm platform competence.
- Signal survives confounder adjustment and multiple-testing correction.
- Effect direction is consistent across sensitivity analyses.
- Independent replication or held-out validation is achieved before strong claims.
- State markers are validated for the target system rather than copied from source literature without justification.

# Claim Boundaries

- Distinguish validated associations from exploratory signatures.
- Avoid causal claims unless supported by independent functional or longitudinal evidence.
- Do not treat a single study as field consensus.
- Separate paper-supported patterns from agent-inferred extensions.
- Peripheral blood signals may not represent tissue-local immunity; single time points may miss dynamics; small or heterogeneous cohorts limit generalization.

# Failure Modes

- Confounding by treatment, infection, inflammation, genetic background, or batch effects masks or mimics biological signal.
- Peripheral compartment mismatch with local immunity.
- Small or heterogeneous cohorts that limit statistical power and generalization.
- Unvalidated state markers or assay artifacts producing spurious specificity.
- Overfitting or data leakage inflating classifier performance.
- Signal that disappears after covariate adjustment or replication attempt.
- Monotonic or nonspecific effects where biphasic or specific regulation was hypothesized.

# Validity Checks

- **Confounding:** test whether treatment, infection, disease etiology, donor/recipient factors, inflammation, medication changes, time since event, sample timing, or cell-type composition explains the signal.
- **Technical validity:** check sequencing depth, primer or capture bias, sample quality, contamination, platform drift, annotation pipeline consistency, and barcode/index artifacts.
- **Statistical validity:** account for repeated measures, small sample sizes, multiple comparisons, effect-size uncertainty, class imbalance, overfitting, and leakage. Separate confirmatory from exploratory analyses.
- **Biological validity:** distinguish peripheral repertoire signals from tissue-local processes; avoid assuming sequence similarity implies identical function; distinguish transient from persistent dynamics.
- **Reproducibility:** require locked analysis decisions, independent validation, sensitivity analyses, and transparent reporting of excluded samples.
- **Boundary conditions:** state where the model should not be extrapolated, such as different immune compartments, perturbation types, or populations with incompatible covariate structures.

# Provenance

- Synthesized from cluster 46 / subcluster 46.1.split0.
- Source skills: bab9cb9c6265b6bf, 9ee13e43780bd62c, d8ab2f38e9a32be5, d2621fc9cf136468, 56bdcc4c3660fa55, df848656bc57674a, 9548531563543b7a, 62f8174ea7c22f12.
- Representative sources: 9c650b8b84d7f64e, d3ebb037e17ba799, 00466fe12ef770b3.
