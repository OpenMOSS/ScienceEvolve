---
name: sci-immune-molecular-recognition-reagent-discovery-work-abc9d490
description: A reusable, non-operational workflow for designing research questions and validation plans to discover and characterize molecular recognition reagents through contrast-driven hypothesis generation, traceable candidate selection, orthogonal validation, and evidence-weighted iteration.
scienceevolve-title: "Antibody and immune recognition · molecular recognition reagent discovery workflow"
scienceevolve-area: antibody-and-immune-recognition
---

## Purpose

Use this skill to generate methodologically sound research questions and non-operational validation plans for discovering molecular recognition reagents (e.g., binders, probes, antibody fragments, peptides, or aptamers). It teaches an end-to-end pattern: frame a recognition problem by contrast, construct a traceable candidate space, enrich and triage candidates, validate orthogonally, bound claims, and iterate from discordance. It does not reproduce source-paper examples or provide executable laboratory instructions.

## When to use

Use this skill when the user asks to:
- Design a study to discover or validate binders, probes, or other recognition reagents against a defined target.
- Convert a single binding observation into a staged validation and iteration plan.
- Evaluate whether a candidate recognition reagent is specific, robust, or suitable for a defined research use.
- Compare candidate diversity strategies, format-engineering hypotheses, or assay-context dependencies.
- Generate hypotheses and controls for library-linked selection, specificity testing, or breadth validation.

Do not use this skill for clinical diagnosis, treatment recommendations, patient management, executable wet-lab protocols, or claims of therapeutic efficacy or diagnostic readiness without independent validation.

## Inputs required

Before producing a research plan, collect or state assumptions for:
- **Target definition**: the molecule, complex, state, modification, or context to recognize.
- **Contrast set**: target-absent material, related molecules, homologs, isoforms, modified forms, and application-relevant decoys.
- **Candidate space**: the type of binders/probes and the diversity dimensions they cover; how candidate identity links to observed binding.
- **Available evidence**: known binders, prior screens, sequence/structure information, or orthogonal datasets.
- **Intended use**: discovery tool, mechanistic probe, capture reagent, imaging reagent, analytical standard, or resource component.
- **Constraints**: biosafety, ethics, data privacy, material access, reproducibility requirements, and validation depth.

If any input is missing, label assumptions and request clarification before finalizing the plan.

## Core Workflow

Follow this ordered route. Do not skip decision gates.

### Stage 1: Target definition and contrast framing
1. Define the exact recognition target and the biological or technological question it must address.
2. Define the **contrast set** (target-absent, related targets, decoys, and alternative states).
3. State the recognition feature that should distinguish the target from the contrast set.

**Decision Gate 1 — Target viability:**  
If the target feature is not plausibly distinguishable or accessible in the intended context, stop and redefine the target or contrast set.

### Stage 2: Candidate-space design
1. Specify a diverse candidate source compatible with the target.
2. Ensure **recoverability**: link functional performance to candidate identity, sequence, structure, or design feature.
3. State how the candidate space covers plausible recognition modes.

**Decision Gate 2 — Coverage:**  
If the candidate space cannot plausibly sample recognition modes for the target, redesign the space or diversity strategy before proceeding.

### Stage 3: Discovery enrichment
1. Apply structured selection or screening using target-present, target-absent, and related-target conditions.
2. Prefer quantitative, per-candidate or population-level readouts over binary hit calls.
3. Monitor enrichment trends relative to background and platform controls.

**Decision Gate 3 — Enrichment specificity:**  
If enrichment cannot be separated from background, platform bias, or nonspecific behavior, stop and redesign the selection logic or controls.

### Stage 4: Primary triage and specificity screening
1. Screen candidates for target recognition versus off-target/background signals.
2. Assess candidate diversity; treat dominance as a potential bottleneck signal unless only one probe is needed.
3. Evaluate developability indicators (integrity, stability, handling) at a conceptual level.

**Decision Gate 4 — Candidate quality:**  
If candidates lack specific recognition, show unacceptable nonspecific binding, or collapse to a non-reproducible bottleneck, iterate on stringency, controls, or candidate source. Otherwise, advance.

### Stage 5: Mechanism-aware format or structural engineering (optional loop)
1. Treat any format change (valency, scaffold, stabilization) as a hypothesis test with a defined mechanistic rationale.
2. Compare original and modified forms using the same target/contrast panel.
3. Distinguish intrinsic recognition improvements from presentation, avidity, or assay-geometry effects.

**Decision Gate 5 — Format validity:**  
If the modification improves handling but loses function, or if effects are indistinguishable from assay artifacts, revert or redesign. If improvements are mechanism-consistent, advance.

### Stage 6: Orthogonal validation and context testing
1. Validate recognition in at least one independent assay format relevant to the intended use.
2. Test breadth across a target diversity panel; include unrelated and related non-targets to separate breadth from nonspecificity.
3. Test in alternative contexts (e.g., different presentation states, matrices, or biological environments).

**Decision Gate 6 — Cross-context robustness:**  
If orthogonal validation contradicts the discovery readout, or if recognition is strictly context-dependent without a plausible mechanism, restrict the claim or return to Stage 3. If consistent, advance.

### Stage 7: Evidence synthesis and claim bounding
1. Synthesize binding, specificity, breadth, robustness, and mechanism evidence.
2. Assign an evidence-strength label to each claim (speculative, weak, moderate, strong).
3. Explicitly bound the claim to the tested target forms, contexts, and research-tool use case.

**Decision Gate 7 — Claim readiness:**  
If the evidence supports only a narrower use case, bound the claim accordingly. If no claim is supported, stop and redesign.

### Stage 8: Iteration or redesign
1. Use discordant results to update the target definition, candidate-space assumptions, or validation strategy.
2. Define the next minimum viable experiment that discriminates between leading explanations.
3. Decide: advance the candidate, redesign the space/format, or stop.

**Stop conditions (global):**  
- Biosafety, ethics, or governance constraints are unmet.  
- Specific binding cannot be separated from controls after iteration.  
- Recognition is artifact-dependent or irreproducible across independent preparations.  
- The user attempts to extend research-tool evidence to diagnostic, therapeutic, or clinical claims without separate validation.

## Output Format

When using this skill, produce:
1. **Research question**: one clear, non-clinical question.
2. **Transferable pattern applied**: the method principle being used.
3. **Hypotheses table**: for each hypothesis, state the claim, evidence strength, key assumptions, and likely failure mode.
4. **Minimal validation plan**: target/contrast set, candidate traceability, controls, metrics, and stop conditions.
5. **Analysis plan**: evidence classification, control comparisons, reproducibility checks, and failure-boundary mapping.
6. **Iteration plan**: how results update hypotheses or trigger redesign.
7. **Validity and ethics notes**: confounders, claim scope, reproducibility needs, and safety/ethics constraints.
8. **Evidence labels**: mark each major claim as source-pattern-supported, agent-inferred, or requiring validation.

## Validation Gates

- **Target-contrast validity**: The target feature is defined relative to a meaningful contrast set; target-absent and related-target controls are included.
- **Enrichment validity**: Enrichment is interpreted as a candidate-generation signal, not proof of specificity, until background and platform controls are satisfied.
- **Specificity validity**: Candidates are evaluated against target-absent, unrelated, and related non-target controls before advancing.
- **Diversity validity**: Candidate diversity is assessed; monoclonal dominance is not overinterpreted as panel coverage unless justified.
- **Format validity**: Engineered-format effects are distinguished from intrinsic recognition improvements.
- **Orthogonal validity**: Recognition is confirmed in an independent assay format before claim strength increases.
- **Breadth validity**: Finite-panel breadth is treated as potential evidence, not proof of universal coverage.
- **Reproducibility validity**: Key conclusions are supported by independent candidates, repeats, or batches.
- **Claim-scope validity**: Research-tool claims are separated from diagnostic, therapeutic, or clinical readiness claims.

## Claim Boundaries

- This workflow supports **research-tool discovery claims** only.
- Binding evidence alone does not imply functional inhibition, neutralization, or therapeutic utility.
- Specificity against a finite panel does not imply universal target coverage or diagnostic readiness.
- Format-conversion success in one context does not guarantee performance in another.
- Single-source or single-candidate results are candidate-level evidence, not field-wide consensus.
- Agent-generated inferences for new targets are explicitly labeled and require independent validation.

## Failure Modes

- **Enrichment artifacts**: selection driven by expression bias, amplification bias, nonspecific sticking, or platform artifacts rather than target recognition.
- **Nonspecific binding**: candidates recognize tags, surfaces, carriers, or generic features instead of the intended target.
- **Clonal bottleneck**: low diversity due to amplification bias or over-selection, misinterpreted as target-driven convergence.
- **Context-dependent recognition**: candidates bind an artificial presentation state that does not transfer to the intended use context.
- **Format-dependent loss**: binding or specificity is lost upon conversion to a different scaffold or valency.
- **Assay artifacts**: avidity, immobilization, aggregation, orientation, or matrix effects dominate the readout.
- **Confounding by preparation**: signal explained by target quality, batch effects, or handling differences rather than candidate properties.

## Validity Checks

Before finalizing any plan or claim, check:
- **Confounding**: Could expression bias, amplification, sticking, sample preparation, or target presentation explain the result?
- **Specificity**: Are target-absent and related-target controls strong enough for the intended claim?
- **Reproducibility**: Are results supported by independent candidates, repeats, or orthogonal assays?
- **Mechanism specificity**: Was the suspected mechanism challenged independently of the candidate modification?
- **Statistical validity**: Are enrichment or performance claims compared against an appropriate background model, with replication and pre-specified thresholds?
- **Boundary conditions**: Are splice variants, modifications, complexes, membrane contexts, and sample complexity considered?
- **Claim scope**: Does the evidence support only the stated research-tool claim?
- **Single-source limitation**: Are source-paper examples treated as methodological illustrations rather than domain consensus?
- **Safety and ethics**: Are biological sample, human data, animal-derived material, pathogen/toxin, biosafety, and material-transfer constraints addressed?

## Provenance

Synthesized from cluster 6, subcluster 6.0.split0. Derived from source skills: renewable-binder-discovery-workflow, robust-recognition-reagent-discovery, biotin-pretargeting-probe-stability-workflow, phage-display-vector-midgut-probe-discovery, recombinant-binder-discovery-workflow, neurotoxin-human-antibody-research-design, nonclassical-immunoglobulin-expression-aml-research, natural-loop-mimotope-discovery.
