---
name: sci-immune-binder-discovery-repertoire-workflow-1d71f5c8
description: Reusable end-to-end research planning workflow for discovering and validating candidate binders from immune, synthetic, or engineered repertoires through staged recognition, specificity, and functional triage.
scienceevolve-title: "Antibody and immune recognition · binder discovery repertoire workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Guide agents in designing non-operational research plans for binder discovery from repertoires, including immune, synthetic, naive, or computationally enriched sources. The workflow structures hypothesis generation, scaffold-aware diversity design, staged validation across binding and function, and iterative refinement while keeping claims bounded and source-specific details abstracted.

# When to use

Use this skill when:
- Designing a discovery campaign from a repertoire or library against a new target.
- Turning a known binder or anchor into a starting point for specificity, affinity, or function engineering.
- Planning staged validation that separates molecular recognition from biological mechanism.
- Interpreting enrichment or screening data to decide between iteration, redesign, or stop.
- Evaluating whether a candidate set is ready for downstream engineering, format conversion, or translational claims.

Do not use this skill for clinical recommendations, executable wet-lab protocols, pathogen-handling instructions, or high-risk operational parameters.

# Inputs required

Before generating a plan, ask for or infer:
- **Target biology and desired property:** binding, specificity, neutralization, inhibition, or modulation.
- **Repertoire or source type:** immune, synthetic, naive, display-based, or computational.
- **Scaffold or anchor class:** known liabilities, structural constraints, and format compatibility.
- **Available readouts and constraints:** assay types, biosafety level, ethics approvals, and institutional boundaries.
- **Prior evidence:** previous screens, structural data, known epitopes, homologs, or failed attempts.
- **Intended output:** research proposal, experimental schema, analysis plan, critique, or iteration strategy.

# Core Workflow

Follow this ordered route from problem framing to advancement decision. At each gate, evaluate whether to proceed, iterate, or stop.

## 1. Frame the discovery problem
- Define the target property and explain why exhaustive search is infeasible.
- Formulate a **scaffold hypothesis** (why the chosen scaffold class may support the property) and a **diversity hypothesis** (which regions to vary and why).
- **Decision Gate 1 (Source Viability):** Is the repertoire source or anchor plausibly linked to the target biology?
  - *If no:* Stop or redesign the source hypothesis before constructing the repertoire.

## 2. Design controlled diversity
- Focus variation on regions expected to influence the target property; avoid unconstrained randomization that creates uninterpretable redundancy.
- Define constraints (length, physicochemical balance, motif rules) and plan **design-realization checks** before functional screening.
- **Decision Gate 2 (Design Realization):** Does the realized or simulated repertoire match the intended diversity distribution and integrity?
  - *If no:* Iterate the construction or diversification strategy; do not interpret functional data from a failed design.

## 3. Screen or select for recognition
- Apply target-guided enrichment or screening with background and process controls.
- Monitor for nonspecific recovery, amplification artifacts, and assay bias.
- **Decision Gate 3 (Enrichment Quality):** Is target enrichment reproducible and significantly above background/negative controls?
  - *If no:* Reassess selection pressure, source quality, or assay logic.

## 4. Validate binding and specificity
- Use orthogonal binding readouts and an off-target panel of related or irrelevant targets.
- Distinguish target engagement from nonspecific binding, aggregation, or cross-reactivity.
- **Decision Gate 4 (Specificity):** Is binding specific within the tested panel and not dominated by artifacts?
  - *If no:* Add competitive specificity pressure, expand the off-target panel, or redesign the variable region.

## 5. Test functional relevance
- Link molecular engagement to a mechanism-linked functional endpoint (e.g., neutralization, inhibition, signaling change).
- Include functional positive and negative controls; separate binding evidence from functional evidence.
- **Decision Gate 5 (Function):** Does binding correlate with the intended biological effect across independent replicates?
  - *If discordant:* Investigate epitope relevance, format accessibility, assay artifacts, or scaffold-context dependence before advancing.

## 6. Assess format and context transferability (if applicable)
- Compare the discovery format with the evaluation format or biological context (e.g., valency, stability, presentation).
- **Decision Gate 6 (Transferability):** Does the candidate retain activity after format conversion or context change?
  - *If no:* Revisit scaffold, presentation, or environmental assumptions.

## 7. Benchmark and integrate evidence
- Compare candidates against a relevant benchmark comparator (e.g., parental binder, polyclonal reference, established standard).
- Build an evidence matrix across binding, specificity, function, and reproducibility.
- **Decision Gate 7 (Convergence):** Do independent readouts converge with reproducible effect sizes?
  - *If no:* Hold for additional orthogonal validation; do not advance on a single assay.

## 8. Decide: advance, redirect, or stop
- **Advance:** Convergent evidence across binding, specificity, and function; proceed to focused follow-up, mechanistic characterization, or downstream engineering.
- **Redirect:** Partial evidence or assay discordance; generate mechanism-specific follow-up questions and redesign the weakest evidence layer.
- **Stop:** Persistent control failures, irreproducible results, unacceptable off-target profiles, or ethical/safety boundaries reached.

# Output Format

When using this skill, produce:

1. **Research question**
   - Target property and why exhaustive search is infeasible.

2. **Hypothesis portfolio**
   - Scaffold, diversity, distribution, functional, and mechanistic hypotheses.
   - For each: evidence strength, key assumptions, predicted observation, failure mode, required control, and next iteration.

3. **Experimental design schema**
   - Design space, fixed elements, variable elements.
   - Control architecture (positive, negative, background, process, specificity).
   - Selection/screening logic and evaluation metrics.
   - Minimal viable validation and stop conditions.

4. **Analysis plan**
   - Assay-validity checks.
   - Design-realization checks.
   - Enrichment and specificity analysis.
   - Candidate characterization and feature mapping.
   - Evidence-strength assignment.

5. **Iteration plan**
   - If controls fail: fix measurement validity first.
   - If design realization fails: revise construction before interpreting function.
   - If enrichment lacks specificity: add specificity controls or redesign selection.
   - If enrichment is specific and reproducible: characterize features and propose focused follow-up.
   - If results contradict the model: update the mechanistic hypothesis and test the smallest discriminating experiment.

6. **Validity and safety checks**
   - Confounders, reproducibility, boundary conditions, statistical validity, ethics and compliance boundaries.

7. **Clear separation of claims**
   - Supported by the methodological precedent.
   - Inferred for the new problem.
   - Unvalidated and requiring evidence.

# Validation Gates

| Gate | Question | Pass Criteria | Fail Action |
|---|---|---|---|
| 1. Source Viability | Is the repertoire source plausibly linked to the target? | Defensible rationale for enrichment or anchor suitability | Redesign source or stop |
| 2. Design Realization | Does the realized repertoire match the intended design? | Integrity and distribution checks agree with plan | Redesign diversity/construction |
| 3. Enrichment Quality | Is target enrichment reproducible above background? | Reproducible signal with appropriate controls | Reassess selection or source |
| 4. Specificity | Is binding specific within the tested panel? | Specificity controls and off-target panel pass | Add competitive pressure or redesign |
| 5. Function | Does binding correlate with the intended biological effect? | Functional endpoint matches mechanism with controls | Investigate discordance; do not advance |
| 6. Transferability | Does activity persist across formats/contexts? | Equivalent or explainable performance in new context | Revisit scaffold/format assumptions |
| 7. Convergence | Do independent readouts agree reproducibly? | Multi-assay convergence with effect sizes | Hold for orthogonal validation |

# Claim Boundaries

- **Supported by precedent:** Controlled diversity design, scaffold-based search-space reduction, staged binding-to-function validation, and iterative hypothesis updating are transferable methodological patterns.
- **Inferred for each new problem:** Any claim that a specific scaffold, diversity rule, epitope, or candidate will work for a new target is provisional until validated.
- **Unvalidated:** Clinical relevance, therapeutic safety, broad cross-reactivity beyond the tested panel, and field-wide consensus cannot be claimed from early-stage discovery evidence alone.

# Failure Modes

- **Source/Repertoire failure:** No enrichment due to poor source-target linkage or library quality issues.
- **Design realization failure:** Unintended diversity, artifacts, or integrity defects that preclude functional interpretation.
- **Assay artifact:** Nonspecific binding, readout saturation, immobilization bias, or detection interference.
- **Specificity failure:** Cross-reactivity with related targets or broad sticky behavior.
- **Functional discordance:** Binding without mechanism (non-neutralizing epitope) or function without clear binding (indirect mechanism or artifact).
- **Format/context failure:** Loss of activity upon reformatting, expression, or transfer to a new biological context.
- **Reproducibility failure:** Inconsistent results across independent replicates, batches, or preparations.

# Validity Checks

- **Confounding:** Could readout reflect non-specific effects, scaffold differences, expression variation, or assay artifacts rather than the intended property?
- **Reproducibility:** Are there independent replicates, batches, or runs? Are metrics applied consistently before and after iteration?
- **Statistical validity:** Are success criteria predefined? Is the replicate structure sufficient? Are multiple comparisons and selection bias considered?
- **Boundary conditions:** Does the plan assume that one target or candidate proves general usefulness? Are claims limited to the tested scaffold, assay, and molecular class?
- **Transferability:** Are paper-derived methods separated from new-problem inferences? Is the plan framed as research design, not as an executable protocol?

# Provenance

- Synthesized from cluster 32, subcluster 32.0.split0.
- Derived from source skills: `controlled-diversity-antibody-library-discovery`, `antibody-vaccinia-neutralizer-discovery`, `integrin-synthetic-ligand-exploration`, `scorpion-antivenom-antibody-discovery`, `hbv-pres2-antibody-exploration`, `recombinant-antibody-exploration-skill`, `humoral-immune-complex-research-exploration`, `antibody-cdna-functional-engineering-workflow`.
