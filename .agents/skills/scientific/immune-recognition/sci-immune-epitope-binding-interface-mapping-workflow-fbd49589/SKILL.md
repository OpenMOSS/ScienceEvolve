---
name: sci-immune-epitope-binding-interface-mapping-workflow-fbd49589
description: A reusable end-to-end workflow for designing research to map conformational and linear epitopes, localize binding interfaces, and characterize molecular recognition using modular perturbation, structural readouts, and competition assays.
scienceevolve-title: "Antibody and immune recognition · epitope binding interface mapping workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Help an agent design non-clinical, non-operational research to map binding interfaces and epitopes. The workflow guides hypothesis generation, modular perturbation design, multi-probe readout selection, control architecture, and iterative evidence grading. It targets molecular recognition questions such as distinguishing conformational versus linear epitopes, attributing binding to specific domains or surfaces, and validating affinity-directed labeling or proximity-capture logic. The skill teaches methodological abstraction—how to constrain interface mechanisms with layered evidence—not how to replicate any single study’s conclusions.

# When to use

Use this skill when the user needs to:
- Propose new research questions about antibody, receptor, protein, or peptide binding interfaces and epitopes.
- Distinguish functional-core changes from surface-recognition changes, or direct contact from allosteric/indirect effects.
- Design fragment, mutation, domain-swap, competition, or distal-probe strategies to localize a binding site.
- Evaluate candidate epitopes across different presentation formats, scaffolds, or detection platforms.
- Migrate a “perturbation + multi-readout” methodology from one molecular system to another.

Do not use this skill to:
- Provide clinical diagnoses, treatment recommendations, or therapeutic decisions.
- Generate executable wet-lab protocols, hazardous reagent handling, dosages, equipment parameters, or pathogen procedures.
- Present conclusions from a single paper as domain consensus.

# Inputs required

Before starting, gather or request:
- **Target system**: The molecular partners (e.g., protein, antibody, receptor, peptide, nucleic-acid binder) and their known or modeled structural states.
- **Perturbation resources**: Candidate fragments, domains, point substitutions, loop swaps, oligomer-state variants, or presentation-format options.
- **Structural/sequence context**: Known structures, homology models, surface-exposure predictions, interface annotations, or conservation data.
- **Readout inventory**: Available binding, competition, affinity, kinetic, thermodynamic, structural, distal-probe, or functional readouts.
- **Control resources**: Unperturbed reference, irrelevant targets, scaffold-only controls, known active/inactive variants, orthogonal assays, and related-variant panels.
- **Constraints**: Biosafety/ethics boundaries, non-operational scope, platform limitations, and forbidden extrapolations.

# Core Workflow

An ordered, end-to-end route with decision gates (◆) and iteration/stop conditions (■).

1. **Define the mechanism question**  
   Frame a falsifiable question: Is the epitope linear or conformational? Does the interface overlap a functional site? Is recognition driven by direct contact, distal allostery, or presentation-context effects? Identify the domain gap (e.g., single-readout studies, missing structural constraints).

2. **Generate tiered hypotheses**  
   Produce 2–4 candidate hypotheses for interface location, epitope class, and mechanism. For each, annotate:
   - Evidence strength (High / Medium / Low / Speculative)
   - Key assumptions
   - Falsifiable predictions
   - Failure modes (e.g., global destabilization, scaffold dominance)

3. **Design modular perturbations**  
   Plan minimal, structurally informed perturbations (fragmentation, domain excision, surface substitution, loop swap, oligomer-state change) that can separate interface effects from folding/assembly defects.  
   ◆ **Decision gate**: Are perturbations localized and unlikely to globally destabilize the target? If no, redesign before proceeding.

4. **Select a multi-probe readout panel**  
   Choose at least two orthogonal readout classes (e.g., equilibrium binding, competition displacement, distal-probe reporting, structural mapping). Ensure probes sample distinct epitope patches or interface regions.  
   ◆ **Decision gate**: Do probes report on distinct binding events rather than redundant input-site occupancy? If no, revise probe selection.

5. **Define the control architecture**  
   Establish:
   - Baseline (unperturbed)
   - Negative (irrelevant target, scaffold-only, no-trigger, non-binding variant)
   - Positive (known binder, reference condition)
   - Strong (orthogonal assay, active/inactive variant pair, format control)
   - Specificity (related variants, cross-reactivity panel)  
   ◆ **Decision gate**: Can controls separate specific signal from background, scaffold effects, and non-specific binding? If no, ■ **Stop** and redesign.

6. **Run minimal viable validation (conceptual)**  
   Apply perturbations and collect readouts. Enforce ■ **Stop conditions** immediately if:
   - Positive controls fail or negative controls produce target-like signal.
   - Perturbation destroys global folding, stability, or assembly (confounding interface interpretation).
   - Signal is background/scaffold-dominated or lacks orthogonal support.
   - Ethical, biosafety, or compliance boundaries are breached.

7. **Control-first analysis**  
   Quantify background, scaffold-only, and irrelevant-target signals before mechanistic interpretation. Verify that positive and strong controls behave as expected.  
   ◆ **Decision gate**: Do controls pass? If no, ■ **Halt** mechanism inference; diagnose artifacts and iterate.

8. **Attribute mechanism and grade evidence**  
   Map readout changes to hypotheses:
   - If function is preserved but recognition profile shifts → selective interface/epitope remodeling.
   - If function and recognition co-decay → prioritize global structural/assembly defects.
   - If only one probe changes → insufficient to claim global epitope reprogramming.  
   Grade evidence: **High** (reproducible, orthogonal, transferable to native context), **Medium** (consistent but missing transfer/repeat), **Low** (single readout/presentation), **Insufficient** (indistinguishable from background).

9. **Iterate, expand, or stop**  
   - **Insufficient/Low evidence**: ■ **Iterate**—refine perturbations, add orthogonal readouts, or test alternative presentation formats.
   - **Medium evidence**: ■ **Iterate**—narrow to local mechanism (residue/loop-level), expand probe panels, or test boundary conditions.
   - **High evidence + local scope**: Proceed to boundary testing.
   - **Persistent control failure or safety breach**: ■ **Terminate** workflow.

10. **Boundary testing and generalization**  
    Test whether the mapped interface conclusion holds across:
    - Different presentation formats or scaffolds
    - Complementary detection platforms
    - Related target variants or biological backgrounds  
    ◆ **Decision gate**: Does the conclusion remain valid outside the initial system? If no, bound the claim strictly to the tested context.

11. **Synthesize final interface map and claim boundaries**  
    State the localized epitope or interface region, the supporting evidence level, the excluded alternative mechanisms, and explicit extrapolation limits. Do not upgrade binding evidence to functional, clinical, or consensus claims.

# Output Format

When invoked, the agent should produce:

1. **Research question** — One-sentence falsifiable mechanism question and domain gap.
2. **Hypothesis table** — Candidates with evidence strength, key assumptions, predictions, and failure modes.
3. **Perturbation and probe plan** — Modular perturbations, multi-probe readouts, and control architecture.
4. **Minimal validation scheme** — Variables, non-operational design logic, evaluation metrics, and stop conditions.
5. **Analysis plan** — Control-first procedure, mechanism attribution rules, evidence grading, and visualization strategy.
6. **Iteration roadmap** — Branches for supported, weakened, ambiguous, and artifact-dominated outcomes.
7. **Boundary statement** — Extrapolation limits, validity checks, and safety/ethics guardrails.

# Validation Gates

- **Control separation**: Specific signal must exceed scaffold-only, background, and irrelevant-target signals.
- **Orthogonal convergence**: Mechanism claims require agreement across at least two independent readout classes.
- **Structural integrity**: Perturbation-induced changes must be distinguishable from global folding, stability, or assembly collapse.
- **Specificity**: The mapped interface must differentiate target from related variants and non-target binders.
- **Reproducibility**: Key conclusions require independent repetition or cross-batch/cross-platform consistency.

# Claim Boundaries

- **Observation vs. inference**: Distinguish “a readout changed” from “the epitope is located at X” from “the mechanism is Y.”
- **Binding ≠ function**: Binding evidence alone does not imply neutralization, protection, diagnostic utility, or therapeutic efficacy.
- **System-specificity**: A conclusion from one antibody-antigen pair, scaffold, or assay platform does not automatically generalize to other systems.
- **No consensus by single source**: Do not present any single paper’s findings as established field consensus.
- **No clinical claims**: This workflow is for non-clinical research design only.

# Failure Modes

- **Global destabilization misattributed to interface change**: A mutation or fragment destroys folding, producing a false “interface disrupted” signal.
- **Scaffold or presentation dominance**: The readout reflects the carrier, linker, fixation method, or assay format rather than the candidate epitope.
- **Single-probe artifact**: A signal appears with only one probe or on one platform and lacks orthogonal support.
- **Residual non-covalent complex mistaken for stable capture**: In affinity-directed labeling, insufficient separation stringency confounds capture specificity.
- **Cross-reactivity misread as shared epitope**: Related targets produce signal due to sequence similarity, but the actual interface differs.
- **Distal-probe mislocalization**: A probe reports on the input site rather than the intended output site, invalidating allosteric claims.
- **Platform bias**: A conclusion depends on a single detection format (e.g., surface-binding artifact, avidity bias in multivalent display).

# Validity Checks

- **Confounders**: Expression level, folding state, oligomerization, aggregation, tag/linker effects, batch variation, target heterogeneity, and model uncertainty.
- **Reproducibility**: Independent preparations, technical/biological repeats, pre-defined analysis rules, and equal recording of negative/failed results.
- **Statistical validity**: Pre-registered primary endpoints, effect sizes with uncertainty, appropriate multiple-comparison correction, and model-fit diagnostics.
- **Extrapolation boundaries**: Results from simplified peptides, fragments, or single mutants do not automatically transfer to native proteins, cellular contexts, or clinical settings without additional validation.

# Provenance

Synthesized from cluster `37`, subcluster `37.0.split0`. Methodological patterns derived from source skills: `protein-epitope-remodeling-workflow` (2e1d4e79f1cd2294), `damaged-dna-antibody-recognition-workflow` (95d3348dab923d79), `antibody-epitope-research-workflow` (a29950088498b81a), `affinity-photoconjugate-research-design` (da3a1aee63146836), `peptide-presentation-immunogen-exploration` (e4d5d0b6da53ecd8), `antibody-fragment-research-design` (3cb42b8d0b3c5955), `antibody-allosteric-probe-workflow` (5af584bf50bd6f14), `antibody-knob-paratope-engineering-workflow` (c6e271003ff85504). No specific paper conclusions, systems, or operational protocols are embedded in the reusable workflow body.
