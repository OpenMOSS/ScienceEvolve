---
name: sci-neuro-mechanism-driven-hypothesis-research-workflow-ee7f79b6
description: Reusable end-to-end workflow for generating mechanism-driven hypotheses, designing controlled validation experiments, and iteratively refining claims across scientific domains.
scienceevolve-title: "Neuromorphic computing and Ising optimization · mechanism driven hypothesis research workflow"
scienceevolve-area: neuromorphic-computing-and-ising-optimization
---

## Purpose

Help an agent transform observational gaps or mechanism clues into falsifiable hypotheses, design validation experiments with strong controls, and iterate based on evidence while maintaining strict boundaries between verified findings and inference. This skill addresses research design and evidence evaluation, not operational execution or domain-specific recipes.

## When to use

- When a task requires proposing new research questions or mechanism-driven hypotheses from incomplete evidence.
- When designing validation schemes—experimental, computational, or observational—with proper controls and stopping conditions.
- When evaluating whether evidence supports a mechanistic claim or only a correlational pattern.
- When iterating on hypotheses after negative results, partial support, or boundary findings.
- Do not use to generate operational lab recipes, clinical diagnoses, hazardous protocols, or direct deployment decisions.

## Inputs required

- **Target phenomenon or system** and its spatial, temporal, or organizational boundaries.
- **Available evidence** with its modalities, provenance, and known limitations.
- **Candidate mechanisms or hidden structures** suspected to drive the phenomenon.
- **Constraints**: ethical, resource, data-access, safety, and regulatory boundaries.
- **Baseline or benchmark** methods against which to compare mechanism-informed approaches.
- **Success criteria** and acceptable failure modes or stopping thresholds.

## Core Workflow

1. **Frame the gap and boundaries**
   - Define the phenomenon, the relevant scales, and the specific explanatory deficit.
   - *Decision gate:* If the gap cannot be expressed as a falsifiable question, stop and refine the scope.

2. **Map evidence and extract mechanism clues**
   - Inventory verified evidence, indirect support, model inferences, and unknowns.
   - Identify candidate hidden structures, symmetries, or mechanisms that could bridge the gap.
   - *Decision gate:* If no mechanism clue can be stated as a causal or structural proposition, return to Step 1.

3. **Generate candidate hypotheses**
   - Formulate falsifiable “if … then …” statements linking a mechanism to an observable signature.
   - For each hypothesis record: mechanism claim, evidence strength (high/medium/low), key assumptions, predicted observations, applicability boundaries, and failure modes.
   - *Decision gate:* Discard hypotheses that cannot be challenged by available or obtainable data; prioritize those with clear minimal viable validation.

4. **Design minimal viable validation**
   - Specify the smallest experiment, simulation, or analysis that can discriminate the leading hypothesis from null and alternative explanations.
   - Define independent variables, dependent variables, and controls (positive, negative, strong, ablation).
   - State stopping conditions before execution.
   - *Decision gate:* If the design violates safety, ethics, or resource constraints, redesign or terminate.

5. **Execute analysis with quality control**
   - Verify data integrity, independence of splits, leakage, batch effects, and preprocessing consistency.
   - Compare the mechanism-informed model against strong baselines, alternative models, and simplified nulls.
   - Decompose and report uncertainty (statistical, structural, measurement, extrapolation).
   - *Decision gate:* If negative controls fail or data quality is insufficient, halt mechanistic interpretation and diagnose methodology.

6. **Iterate based on evidence**
   - **Supported:** Narrow the claim’s boundary and plan stronger external validation.
   - **Partially failed:** Localize failure to data, scale translation, model structure, or experimental condition; revise hypothesis.
   - **Equivalent alternatives:** Downgrade mechanism claim and design a discriminative test.
   - **External validation failed:** Redefine generalization boundaries and check for confounders.
   - *Stop/iteration condition:* If the core mechanism is unsupported after minimal viable validation, return to Step 3 or abandon the line of inquiry.

7. **Consolidate claims and archive reproducibility artifacts**
   - Grade each conclusion: observed pattern, supported structural hypothesis, requires external validation, or insufficient for mechanism.
   - Document applicability limits, scale-translation assumptions, and residual risks.
   - Package analysis logs, versioned data references, and parameter provenance.
   - *Stop condition:* End when claims are bounded, artifacts are documented, and next steps are prioritized.

## Output Format

Produce a structured report containing:

1. **Research problem restatement** and system boundaries.
2. **Evidence matrix**: verified, indirect, inferred, and unknown items.
3. **Candidate hypothesis list**: each with evidence strength, key assumptions, failure modes, and minimal validation path.
4. **Validation design**: variables, controls (positive, negative, strong, ablation), metrics, and stopping conditions.
5. **Analysis plan**: quality checks, model comparison, uncertainty decomposition, and reproducibility measures.
6. **Iteration log**: hypothesis updates, excluded alternatives, and next minimal validation.
7. **Validity and ethics summary**: confounders, reproducibility, external validity, and safety boundaries.
8. **Actionable next steps**.

## Validation Gates

Before accepting any result as reliable, confirm:

- **Confounders**: Known and suspected confounders are recorded and addressed analytically or experimentally.
- **Reproducibility**: Data versions, software versions, random seeds, and analysis logs are traceable.
- **Statistical validity**: Sample selection, missing-data handling, multiple comparisons, and cross-validation are appropriate for the data structure.
- **Model validity**: The mechanism-informed model avoids overfitting, does not rely solely on unverifiable assumptions, and generates falsifiable predictions.
- **Scale translation**: Assumptions for moving across scales, species, or environments are explicit and testable.
- **External validity**: The result is not dependent on a single platform, dataset, modality, or implementation.
- **Ethics and safety**: Privacy, consent, data minimization, and risk mitigation meet the relevant governance requirements.

## Claim Boundaries

- Distinguish verified findings from model inferences, analogies, and agent-generated speculations.
- Do not present single-study or single-dataset results as domain consensus.
- State the boundary of applicability (scales, systems, conditions) for every mechanistic claim.
- Grade conclusions as: *observed pattern*, *supported structural hypothesis*, *requires external validation*, or *speculative*.

## Failure Modes

- Hypothesis is unfalsifiable or too broad to test with available means.
- Negative controls produce unexpected positive signals, indicating leakage or confounding.
- Performance gain vanishes under fair comparison with strong baselines or equivalent-complexity models.
- Results are only reproducible under a single random seed, dataset split, or implementation.
- Mechanism interpretation relies solely on post-hoc explanatory methods without independent diagnostic evidence.
- Scale translation or cross-domain extrapolation assumes unverified invariance.
- Ethical or compliance constraints invalidate the proposed validation path.

## Validity Checks

- Verify that confounders are accounted for before drawing causal or mechanistic conclusions.
- Confirm that data and code are versioned and that exclusion rules are pre-registered or documented.
- Ensure statistical methods match the data structure (e.g., repeated measures, hierarchical scales, non-IID sampling).
- Compare mechanism-informed models against plausible alternatives and simplified nulls.
- Test predictions on held-out data, external datasets, or cross-scale conditions.
- Decompose uncertainty into statistical, structural, measurement, and extrapolation components.
- Grade conclusions by evidence strength and label all agent inferences as distinct from source-paper findings.

## Provenance

- Synthesized from cluster 21.0 (candidate skill: physics-quantum-material-classification-hydrogen-embrittlement-hypothesis-workflow).
- Source-skill references: multiscale-brain-research-workflow; rs-eeg-neurodevelopmental-research-workflow; quantum-algorithm-research-workflow; auditory-cortex-ei-exploration; quantum-federated-research-explorer; physics-guided-regime-discovery-research-workflow; bifurcation-inspired-optimization-research; ai-rights-governance-exploration.
- This skill generalizes the shared hypothesis-generation, control-design, and iterative-validation route across the source cluster. It does not preserve domain-specific conclusions, numerical results, parameters, or operational protocols from any individual paper.
