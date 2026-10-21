---
name: sci-chromatin-chromatin-epigenetic-regulatory-mechanism-9b60ae76
description: A reusable end-to-end workflow for generating, testing, and iterating hypotheses about chromatin and epigenetic regulatory mechanisms across cell states, contexts, or perturbations.
scienceevolve-title: "Chromatin and epigenomic regulation · chromatin epigenetic regulatory mechanism discovery workflow"
scienceevolve-area: chromatin-and-epigenomic-regulation
---

# Purpose

Help an agent transform a chromatin or epigenetic regulatory observation into a structured, testable mechanism-discovery plan. The workflow guides hypothesis generation, multi-layer evidence integration, control design, mechanism discrimination, and iterative refinement while enforcing claim boundaries and safety constraints.

# When to use

Use this skill when the user asks to:

- Explore how chromatin state, epigenetic marks, transcription-factor activity, or regulatory element usage changes across cell states, contexts, or perturbations.
- Integrate multi-omics data—such as chromatin accessibility, occupancy, methylation, expression, isoform, chromatin marks, or 3D contacts—to infer regulatory mechanisms.
- Distinguish shared from context-specific regulators, intrinsic sequence effects from trans-acting factors, or direct from indirect mechanisms.
- Design non-operational research plans, validation concepts, or analysis strategies for regulatory biology.

Do not use this skill for clinical decision-making, executable wet-lab protocols, operational biological parameters, or high-risk procedural details.

# Inputs required

Ask for or infer the following before designing the workflow:

- **Biological context**: system, cell or tissue type, developmental stage, disease or perturbation state, and environmental conditions.
- **Query actor and observation**: the regulatory feature, factor, gene, or program to explain, and the context-specific behavior (e.g., differential binding, accessibility, expression, or coordination).
- **Available data layers**: chromatin accessibility, occupancy profiles, methylation, histone marks, expression, isoform-resolved data, interaction networks, 3D contact maps, sequence annotations, or perturbation results.
- **Comparison structure**: target versus matched reference states, subgroup axes, temporal contrasts, or perturbation conditions.
- **Constraints**: ethics, data governance, biosafety, privacy, and validation feasibility boundaries.

If key inputs are missing, state assumptions explicitly, mark downstream conclusions as provisional, and show how the workflow changes if the assumption is wrong.

# Core Workflow

Follow this ordered route from gap framing to claim bounding. At each gate, pass only if the criterion is met; otherwise stop, redesign, or iterate.

## 1. Frame the mechanistic gap
- Define the query actor and the context-specific observation that needs explanation.
- Explain why a single data layer, static model, or abundance metric alone is insufficient.
- Identify whether the missing link is causality, locus specificity, temporal order, reversibility, or cross-layer coordination.

**Decision gate**: If the gap cannot be stated without presuming causality, reformulate it as a descriptive comparison first.

## 2. Generate layered, falsifiable hypotheses
- **Landscape hypothesis**: regulatory features redistribute across states (gained, lost, shared, or subgroup-specific).
- **Regulator hypothesis**: candidate trans-acting factors, chromatin modifiers, or cofactors explain the redistribution.
- **Mechanism hypothesis**: the relationship is direct, indirect, or permissive (pre-existing state gates the response).
- **Architecture hypothesis**: alternative regulatory elements, isoform usage, or module coordination modulate output.
- For each hypothesis, assign evidence strength (strong, moderate, weak, speculative), state key assumptions, and list likely failure modes.

**Decision gate**: If no hypothesis can be falsified with available data and constraints, stop and request additional data layers or a narrower context.

## 3. Design a minimal validation plan
- **Comparisons**: target state versus matched reference; subgroup or temporal contrasts; perturbed versus unperturbed.
- **Controls**:
  - Positive: known responsive elements or factors expected in the system.
  - Negative: unresponsive regions, permuted backgrounds, or unrelated contexts.
  - Context: a related but distinct state to separate shared from specific mechanisms.
  - Technical: replicate agreement, batch checks, assay quality, and normalization sensitivity.
  - Mechanistic: perturbation of the suspected node plus an indirect-effect control.
- **Variables**: regulatory features, state/subgroup, genomic compartment, motif context, and time.
- **Evaluation metrics**: reproducibility, specificity, concordance across molecular layers, perturbation dependence, and robustness to analytical choices.
- **Stop conditions**: controls fail to separate; signal is non-reproducible; batch, composition, or reference mismatch explains the pattern; or follow-up would require non-compliant operational details.

**Decision gate**: If the plan lacks at least one orthogonal readout and one negative control, redesign before proceeding.

## 4. Integrate and analyze multi-layer evidence
- **Quality audit**: confirm sample identity, cell-type identity, batch structure, metadata completeness, and reference compatibility.
- **Feature definition**: identify shared, gained, lost, and state-specific regulatory features consistently across samples.
- **Stratification**: compare across cell types, subgroups, expression states, genomic compartments, or temporal phases.
- **Multi-omics integration**: overlay accessibility with occupancy, methylation, expression, isoforms, chromatin marks, or 3D contacts; classify candidates as concordant, partially concordant, or discordant.
- **Robustness checks**: test alternative region definitions, background models, motif libraries, normalization methods, and independent datasets.
- **Intrinsic baseline**: where relevant, compare observed patterns against sequence-derived expectations to separate intrinsic mechanics from trans-regulated effects.

**Decision gate**: If quality checks fail, signals disappear after covariate adjustment, or intrinsic and trans models are indistinguishable, stop and revisit inputs or propose higher-resolution data.

## 5. Discriminate mechanisms
- **Intrinsic vs. trans-acting**: determine whether DNA mechanics, sequence grammar, or motif opportunity explain the pattern, or whether residual signal requires regulator involvement.
- **Direct vs. indirect vs. permissive**: classify based on perturbation response, temporal order, reversibility, and cofactor requirements.
- **Shared vs. context-specific**: use cross-context comparisons to classify regulators as core or state-specific.
- **Correlation vs. causation**: promote hypotheses only when perturbation, temporal, rescue, or orthogonal evidence converges; treat network proximity or motif enrichment as hypothesis generation, not proof.

**Decision gate**: If causality is claimed without perturbation or temporal evidence, downgrade to correlation and flag the required validation.

## 6. Iterate or redesign
- **If supportive**: strengthen the claim, define boundary conditions (cell type, species, state), and plan targeted replication.
- **If discordant**: split hypotheses by subgroup, genomic compartment, or timing; test intermediate regulators; or revisit cell identity and confounders.
- **If controls contradict**: archive the result as a negative constraint, downgrade or discard the hypothesis.
- **If new candidates emerge**: treat as exploratory until independently supported.
- **Stop conditions**: hypothesis remains unstable after sensitivity analysis; requires non-compliant follow-up; evidence strength does not justify further investment; or the signal is explained by a simpler confounder.

## 7. Bound claims and finalize outputs
- State evidence strength for each surviving hypothesis.
- List key assumptions, extrapolation boundaries, and generalization limits.
- Explicitly separate data-supported findings from agent-inferred hypotheses.
- Document failure modes and why rejected hypotheses were deprioritized.

# Output Format

When using this skill, return:

1. **Research framing** — biological context, query actor, gap, and missing-input assumptions.
2. **Ranked hypotheses** — hypothesis statement, evidence strength, key assumptions, likely failure modes, and extrapolation boundaries.
3. **Validation plan** — comparisons, control strategy, variables, evaluation metrics, and stop conditions.
4. **Analysis plan** — quality checks, feature definition, stratification strategy, multi-omics integration steps, robustness checks, and intrinsic-baseline logic if applicable.
5. **Mechanism discrimination summary** — intrinsic vs. trans, direct vs. indirect, shared vs. specific, and causal limits.
6. **Iteration log** — how results update hypotheses and what triggers redesign or stop.
7. **Claim boundary statement** — generalization limits, causal limits, and ethics/safety constraints.

# Validation Gates

- **Gap clarity**: the research question explains why a single data layer is insufficient.
- **Control adequacy**: positive, negative, context, technical, and mechanistic controls are defined.
- **Orthogonality**: at least two independent data types, perturbation directions, or cohorts support central claims.
- **Reproducibility**: signals persist across biological replicates, sensitivity analyses, or independent datasets.
- **Confounder control**: batch effects, cell-state heterogeneity, composition differences, reference mismatch, and annotation bias are addressed.
- **Statistical validity**: comparisons are prespecified, multiple testing is controlled, effect sizes and uncertainty are reported, and discovery is separated from validation.

# Claim Boundaries

- Treat computational predictions, correlation patterns, and enrichment signals as hypothesis-generating, not established mechanisms.
- Limit causal claims to contexts where perturbation, temporal, rescue, or orthogonal evidence exists.
- Do not extrapolate across cell types, tissues, species, disease states, or developmental stages without re-analysis.
- Distinguish source-supported methodological patterns from agent-generated inferences for new target systems.
- Avoid equating network proximity, visualization centrality, or motif presence with functional causality.

# Failure Modes

- Signal driven by batch effects, cell-state heterogeneity, reference mismatch, or global assay shifts rather than specific regulation.
- Motif enrichment or network centrality interpreted as causality without functional or perturbation evidence.
- Perturbation causes global stress, identity shift, or compensatory response, confounding mechanism interpretation.
- Accessibility-expression discordance ignored or forced into a single causal narrative.
- Hypothesis overgeneralized from a single dataset, platform, cell type, or model system.
- Module coordination or temporal pattern mistaken for direct mechanistic proof.

# Validity Checks

Before finalizing an output, verify:

- State labels and comparisons were predefined before analysis.
- Cell identity and purity are consistent with the intended biological context.
- Negative and positive controls behave as expected.
- Multiple-testing correction, effect sizes, and appropriate background sets are reported.
- Locus-to-gene links are supported by proximity, expression correlation, enhancer evidence, or binding data—not assumed.
- 3D contact enrichments are evaluated against distance-matched and state-matched backgrounds.
- Intrinsic sequence baselines are compared against observed patterns before invoking trans regulation.
- Clinical, diagnostic, or therapeutic claims are absent.
- Privacy, consent, and data-governance requirements are respected for human-derived or sensitive data.

# Provenance

- Synthesized from cluster **20.1** (chromatin-epigenetic-regulatory-cell-mechanism-discovery-workflow).
- Source skill references: `transcriptional-regulatory-module-explorer`, `epigenetic-occupancy-research`, `chromatin-atlas-fibrosis-vascular-research`, `hypoxia-hif-chromatin-research-design`, `dna-methylation-enzyme-coordination-exploration`, `promoter-switch-gene-regulation-exploration`, `circadian-chromatin-exploration`, `chromatin-dna-mechanics-splicing-research`.
- Paper-specific systems, materials, parameters, numerical results, and operational protocols have been removed to produce a reusable, domain-general workflow.
