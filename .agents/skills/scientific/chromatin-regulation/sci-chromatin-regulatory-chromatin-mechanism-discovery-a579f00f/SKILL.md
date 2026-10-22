---
name: sci-chromatin-regulatory-chromatin-mechanism-discovery-a579f00f
description: A reusable end-to-end workflow for designing, validating, and iterating computational studies that discover regulatory and chromatin interaction mechanisms from sequence and multi-omic data while controlling for dependencies, leakage, and confounding.
scienceevolve-title: "Chromatin and epigenomic regulation · regulatory chromatin mechanism discovery workflow 2"
scienceevolve-area: chromatin-and-epigenomic-regulation
---

## Purpose

Help an agent turn a broad regulatory or chromatin-interaction question into a rigorous, reusable computational research plan. It guides hypothesis generation, dependency-aware validation design, controlled model comparison, and evidence-aware iteration without committing to specific datasets, parameters, or paper conclusions.

## When to use

Use when designing computational genomics studies for regulatory element prediction, chromatin interaction mapping, sequence-based mechanism discovery, or multi-omic integration where observations share genomic anchors, contexts, or donors. Trigger for research planning, benchmark design, model comparison, and hypothesis validation—not for clinical decision-making or wet-lab protocol execution.

## Inputs required

Before drafting a plan, identify or request:

- **Target question and claim:** the mechanistic or predictive claim and its intended generalization scope.
- **Observation unit and dependencies:** row identifiers and shared biological entities (anchors, windows, donors, cell types, batches, contexts).
- **Modalities and features:** candidate local (cis) and context-state (trans) feature families, and known simple confounders.
- **Validation axes:** intended generalization dimension (e.g., held-out region, context, donor, assay, dataset).
- **Baselines and resources:** simple models, prior benchmarks, compute limits, and data governance constraints.

## Core Workflow

An ordered, dependency-aware discovery and validation route. Stop or refactor at any gate where the condition is not met.

1. **Frame the scientific claim and boundary**
   - State the mechanistic or predictive claim before selecting features or splits.
   - Define the observation unit and the intended extrapolation level.
   - *Gate:* If the claim is not falsifiable or the unit is ambiguous, stop and refine the question.

2. **Map dependencies and audit leakage**
   - Inventory shared anchors, overlapping windows, repeated donors, cell types, batches, and spatial neighborhoods.
   - Quantify how much of the evaluation set is linked to training through shared groups.
   - *Gate:* If leakage channels cannot be audited or removed, stop and redesign data construction.

3. **Decompose information sources**
   - Separate local sequence or cis-regulatory features from context-state or trans-regulatory features.
   - Identify signals that are shared across contexts versus those that are context-specific.
   - *Gate:* If modalities are critically mismatched or missing without justification, flag the plan as provisional.

4. **Design validation axes and splits**
   - Align the split strategy with the intended claim (e.g., held-out region, context, donor, assay, dataset).
   - Use strict dependency-aware splits as primary evaluation; use shuffled splits only as diagnostic comparisons.
   - *Gate:* If the intended validation axis lacks sufficient data, narrow the claim or stop.

5. **Establish baselines and controls**
   - Simple structural baselines (distance, abundance, composition, prevalence).
   - Negative controls (permuted labels, scrambled features, mismatched contexts, label shuffling).
   - Positive or orthogonal controls when available.
   - *Gate:* If no credible simple baseline or negative control can be constructed, the claim may be untestable.

6. **Build candidate models and ablations**
   - Start with simple models before adding complexity.
   - Compare single-modality, pooled, specialized, and hybrid learning regimes.
   - Run feature-family ablations to test incremental value beyond confounders.
   - *Gate:* If the proposed model does not outperform the strongest simple baseline under the intended validation axis, stop and simplify the hypothesis.

7. **Evaluate under strict validation**
   - Report discrimination, calibration, and ranking metrics on held-out axes.
   - Stratify by context, region class, target prevalence, and biological subgroup.
   - Estimate uncertainty across repeated strict splits.
   - *Gate:* If performance collapses under strict validation, reject the generalization claim and diagnose leakage or narrow the scope.

8. **Interpret features and attributions as hypotheses**
   - Treat feature importance and model attribution as candidate mechanisms, not causal proof.
   - Check stability across folds, contexts, and preprocessing choices.
   - Link to orthogonal evidence only when independently available.
   - *Gate:* If attribution is unstable or disappears after controlling for simple confounders, downgrade to exploratory.

9. **Iterate and update claims**
   - If strict validation holds: test additional axes and orthogonal evidence before broadening the claim.
   - If strict validation fails: redesign splits, remove shared context, or narrow the claim to a dependency class.
   - If simple baselines match complex models: reformulate the hypothesis around confounders.
   - *Gate:* Stop when the claim boundary matches the evidence, or when the validation design cannot prevent known leakage paths.

## Output Format

Return a structured research plan containing:

1. **Research question and claim boundary** — target system, observation unit, intended generalization, and explicit limits.
2. **Dependency map and leakage audit** — shared entities, leakage channels, and split strategy.
3. **Hypothesis table** — for each hypothesis: concise claim, evidence strength, key assumptions, predicted comparison pattern, failure modes, and minimal test.
4. **Experimental design** — variables, learning regimes, controls, validation axes, minimum viable validation, strong validation, and stop conditions.
5. **Analysis plan** — metrics, stratification, uncertainty estimation, attribution rules, and confounder checks.
6. **Iteration plan** — decision rules for strengthening, weakening, splitting, or discarding hypotheses based on possible outcomes.
7. **Validity and ethics notes** — reproducibility requirements, privacy constraints, and interpretation limits.

## Validation Gates

- **Falsifiability gate:** The claim must be expressible as a testable prediction with a defined observation unit.
- **Leakage gate:** No shared dependency unit (anchor, window, donor, context) crosses the train-test boundary unless that crossing is the intended generalization axis.
- **Baseline gate:** Complex models must exceed simple structural baselines under the intended validation axis before claiming added value.
- **Context gate:** Within-context performance must be reported separately from held-out-context or held-out-donor generalization.
- **Attribution gate:** Feature importance must be stable across repeated strict splits and contexts before supporting mechanistic speculation.
- **Orthogonal-evidence gate:** Predictive performance alone is insufficient for causal or regulatory mechanism claims.

## Claim Boundaries

- Distinguish predictive performance from mechanistic causality.
- State which biological contexts, genomic regions, assays, donors, and datasets were evaluated and which were not.
- Label conclusions by provenance: paper-supported methods, newly observed benchmark results, inferred mechanisms, or speculative extrapolations.
- Do not extend computational predictions to clinical, diagnostic, or therapeutic claims.

## Failure Modes

- **Train-test leakage:** Labels become predictable through shared genomic anchors, donors, batches, or preprocessing windows rather than biology.
- **Confounding:** Apparent signal is explained by distance, abundance, GC content, mappability, batch effects, or cell-type composition.
- **Context overfitting:** A model captures patterns that do not transfer to held-out biological contexts, cell types, or assays.
- **Attribution instability:** Feature importance reflects correlated artifacts or model sensitivity rather than robust biological drivers.
- **Label bias:** Proxy labels or positive/negative construction introduce systematic bias that mimics prediction.
- **False discovery:** Inadequate negative controls or multiple-testing oversight produce spurious associations.

## Validity Checks

- **Independence audit:** Quantify overlap and similarity among same-class and cross-class samples; verify strict-split integrity.
- **Confounder audit:** Test whether simple structural variables explain performance before attributing it to complex features.
- **Metric validity:** Choose metrics appropriate for imbalance and ranking; report uncertainty across repeated splits, not single point estimates.
- **Reproducibility:** Document data provenance, preprocessing, feature definitions, split seeds, model versions, exclusion rules, and code.
- **Privacy and ethics:** Use human genomic data only under approved access, consent, and deidentification requirements; avoid re-identification risks.

## Provenance

Derived from cluster `0.0` (`regulatory-chromatin-interaction-sequence-mechanism-discovery-workflow`) and synthesized from source skills: `dependency-aware-genomics-ml-validation`, `cross-context-regulatory-ml-workflow`, `genomic-predictor-leakage-aware-discovery`, `context-specific-regulatory-interaction-modeling`, `tfbs-motif-benchmark-design`, `high-resolution-3d-genome-epigenome-research-design`, `enhancer-promoter-interaction-design`, `tf-binding-model-exploration`. Paper-specific conclusions, numerical results, operational protocols, and dataset parameters have been abstracted out.
