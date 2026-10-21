---
name: sci-chromatin-regulatory-enhancer-mechanism-discovery-w-7ed2c0a5
description: A reusable end-to-end workflow for discovering and validating chromatin-level regulatory mechanisms, linking enhancer states, epigenomic marks, and transcriptional outputs through hypothesis-driven multi-layered evidence and iterative perturbation logic.
scienceevolve-title: "Chromatin and epigenomic regulation · regulatory enhancer mechanism discovery workflow"
scienceevolve-area: chromatin-and-epigenomic-regulation
---

## Purpose

Help an agent design rigorous, iterative research programs to discover and validate chromatin-level regulatory mechanisms—particularly enhancer-driven, epigenomic, and transcriptional-state mechanisms—by connecting multi-layered evidence, perturbation logic, and causal inference without treating any single study as field consensus.

## When to use

Use this skill when the user asks to:
- Generate new research questions about chromatin state, enhancer function, epigenomic regulation, or transcriptional control.
- Design multi-omics studies linking regulatory accessibility, histone marks, factor occupancy, DNA methylation, or 3D contacts to gene expression or phenotype.
- Plan validation experiments to test causal enhancer–promoter wiring, factor-mediated state transitions, or dynamic regulatory logic.
- Discriminate between permissive chromatin states, proximal mechanistic events, and downstream consequences.

Do not use this skill for clinical recommendations, patient-specific interpretation, executable wet-lab protocols, or high-risk operational guidance.

## Inputs required

Before producing a research plan, ask for or infer:
- Biological system and context (organism, cell or tissue type, developmental or disease state).
- Regulatory layer(s) of interest (e.g., chromatin accessibility, histone modifications, transcription factor occupancy, DNA methylation, enhancer RNA, 3D contacts).
- Phenotype or expression output trajectory to explain.
- Available or planned data types (genomic, transcriptomic, epigenomic, contact maps, imaging, perturbation).
- Candidate factors, elements, or pathways.
- Constraints: ethics approvals, sample availability, perturbation feasibility, replication capacity, and acceptable non-clinical scope.

If essential inputs are missing, state assumptions explicitly and label proposed hypotheses as preliminary.

## Core Workflow

Follow this ordered end-to-end route. Each numbered step includes a decision gate; stop or redesign if the gate criteria are not met.

1. **Gap Definition & System Scoping**
   - Frame the unexplained observation as a missing link between a regulatory layer (e.g., chromatin state, enhancer activity, factor occupancy) and a downstream output (transcription, phenotype).
   - Define the biological system, dynamic axis, and regulatory elements under study.
   - *Decision Gate — Scope Gate*: Stop and refine if the question cannot be expressed as a falsifiable regulatory link.

2. **Hypothesis Generation & Competing Models**
   - Generate at least three competing hypotheses (e.g., coarse-state permissive model, local-event driver model, combinatorial/context-rewiring model, null model).
   - For each hypothesis, state predicted signatures, evidence strength (weak/moderate/strong), key assumptions, and likely failure modes.
   - *Decision Gate — Candidate Gate*: Proceed only if hypotheses are distinguishable with available or planned measurements.

3. **Study Design & Control Architecture**
   - Define study groups: baseline, perturbed, state-comparator, and relevant matched controls.
   - Specify positive, negative, technical, biological, and orthogonal controls.
   - Predefine independent and dependent variables, primary endpoints, evaluation metrics, and stop conditions.
   - *Decision Gate — Design Gate*: Redesign if controls are undefined or replication is infeasible.

4. **Multi-Layer Data Acquisition & Quality Control**
   - Acquire matched measurements across regulatory layers (accessibility, histone marks, occupancy, contacts, RNA abundance, phenotype).
   - Perform QC for replicate concordance, batch effects, assay specificity, normalization adequacy, and confounder balance.
   - *Decision Gate — Feasibility Gate*: Halt biological interpretation and redesign the measurement strategy if QC fails.

5. **Discovery Analysis & Candidate Prioritization**
   - Identify differential or state-specific regulatory regions; annotate with genomic context and contact or topological evidence.
   - Stratify by baseline activity, state, or regulatory class; infer candidate regulators via motif or enrichment analysis.
   - Prioritize candidates supported by at least two convergent evidence layers.
   - *Decision Gate — Convergence Gate*: Return to hypothesis generation if no candidates survive multi-layer filtering.

6. **Mechanism Discrimination & Causal Inference**
   - Establish temporal ordering of upstream state, local event, and output; prefer temporal logic over endpoint correlation.
   - Test specificity by comparing predicted targets with nearby or matched non-targets.
   - Distinguish abundance, distribution, and kinetic residence of factors or marks.
   - *Decision Gate — Mechanism Gate*: Downgrade causal claims if temporal logic or specificity is unsupported.

7. **Perturbation-Based Validation**
   - Execute minimal viable validation: perturb the candidate element or factor and measure the predicted output against controls.
   - If supported, advance to stronger validation: independent perturbation, rescue or reconstitution, context comparison, or orthogonal assay.
   - Apply failure criteria: broad cell-state disruption, loss of positive/negative control separation, or directionally inconsistent effects trigger redesign.
   - *Decision Gate — Validation Gate*: Stop mechanistic claims if perturbation is nonspecific or rescue fails.

8. **Model Integration & Boundary Setting**
   - Build a conditional causal model: necessary permissive conditions, proximal drivers, downstream consequences, and context-specific modifiers.
   - Scope claims to tested systems; explicitly distinguish description, correlation, and causation.
   - *Decision Gate — Robustness Gate*: Narrow or reject claims that lack independent replication or cross-context support.

9. **Iteration or Termination**
   - **Supported**: Propose the next decisive test against the strongest alternative model.
   - **Partial or ambiguous**: Identify the weakest evidence link and redesign.
   - **Refuted**: Reject or reframe the hypothesis rather than forcing the model.
   - **Stop conditions**: Persistent control failure, irreproducible effects, nonspecific perturbation, or violated boundary conditions.

## Output Format

When using this skill, produce:

1. **Research question and mechanistic gap**: concise statement of the unresolved regulatory link.
2. **Competing hypotheses table**: hypothesis statement, evidence strength, key assumptions, predicted signatures, and likely failure modes.
3. **Study design**: groups, variables, control architecture, primary endpoints, and stop conditions.
4. **Analysis plan**: QC steps, multi-layer integration, stratification, temporal ordering, specificity tests, and visualization strategy.
5. **Validation plan**: minimal viable validation, stronger validation package, rescue logic, and failure criteria.
6. **Causal model summary**: permissive conditions, proximal drivers, downstream consequences, and boundary conditions.
7. **Iteration path**: decision rules for supported, partial, ambiguous, and refuted outcomes.
8. **Validity and ethics summary**: confounders, reproducibility requirements, statistical checks, and non-clinical scope.

## Validation Gates

- **Scope Gate**: The question is framed as a falsifiable regulatory link between an upstream state and a downstream output.
- **Candidate Gate**: Hypotheses are mutually distinguishable and falsifiable with planned measurements.
- **Design Gate**: Controls and replication are defined, feasible, and aligned with the hypothesized regulatory unit.
- **Feasibility Gate**: Data quality, replicate concordance, and assay specificity meet predefined thresholds.
- **Convergence Gate**: At least one candidate is supported by two or more independent evidence layers.
- **Mechanism Gate**: Temporal ordering and specificity support causal inference beyond correlation.
- **Validation Gate**: Perturbation effects are specific, control-separated, and directionally consistent.
- **Robustness Gate**: Claims are bounded by tested contexts and supported by independent replication.

## Claim Boundaries

- Do not treat binding, accessibility, contact, or correlation as causal proof.
- Do not assume nearest-neighbor target assignment without contact or functional evidence.
- Do not generalize from a single cell type, tissue, organism, sex, age, or condition to broad biology.
- Distinguish paper-supported observations from new-agent inferences.
- Label descriptive maps, correlative patterns, and mechanistic claims separately.
- Avoid presenting single-study or single-system evidence as field-wide consensus.

## Failure Modes

- Coarse chromatin signal obscures local regulatory changes.
- Local-event proxy reflects technical bias (e.g., antibody specificity, batch effects, normalization artifacts) rather than biology.
- Apparent transcript or mark changes reflect cell-composition shifts rather than a regulatory mechanism.
- Perturbation causes broad stress, off-target effects, or viability artifacts that mimic specific regulation.
- Temporal resolution is too sparse to infer causal order.
- Context-specific wiring produces different outcomes across states, invalidating uniform models.
- Missing cooperative elements or redundant pathways mask single-perturbation effects.
- Assay dropout or insufficient depth produces false negatives.

## Validity Checks

- **Confounding**: Check batch, cell composition, genetic background, developmental state, circadian timing, inflammation, stress, and microbiome status.
- **Specificity**: Confirm predicted targets differ from matched non-targets; ensure perturbation effects are not genome-wide or cell-wide.
- **Reproducibility**: Require biological replicate agreement and stability across reasonable analysis parameters.
- **Orthogonality**: Support key claims with more than one measurement concept or perturbation strategy.
- **Statistical validity**: Apply multiple-testing correction, report effect sizes and uncertainty intervals, and predefine primary endpoints.
- **Causality**: Separate correlation from causation using perturbation, rescue, or temporal ordering.
- **Boundary conditions**: Scope claims to the tested organism, cell type, state, regulatory layer, and assay system.

## Provenance

- Synthesized from cluster 5.0 (chromatin-epigenetic-regulatory-enhancer-mechanism-discovery).
- Source skills: intestinal-epigenomic-research-design (10.3390_cells13171419), rna-regulatory-specificity-explorer (10.1016_j.molcel.2023.08.026), circadian-chromatin-exploration-skill (10.1101_2023.08.15.553315), enhancer-promoter-wiring-discovery (10.1093_nar_gky051), chromatin-factor-transcription-state-workflow (10.1016_j.celrep.2019.05.099), transcription-topology-research-pattern (10.1016_j.cell.2016.02.036), fungal-chromatin-research-workflow (10.1016_j.fgb.2015.03.006), dynamic-gene-regulation-exploration (10.1093_g3journal_jkad269).
