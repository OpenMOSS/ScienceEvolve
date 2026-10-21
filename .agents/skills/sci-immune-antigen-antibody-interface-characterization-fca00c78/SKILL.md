---
name: sci-immune-antigen-antibody-interface-characterization-fca00c78
description: A reusable end-to-end workflow for hypothesis generation, staged validation, and iterative refinement in antigen-antibody interface characterization, spanning epitope mapping, paratope analysis, cross-reactivity, and state-dependent mechanistic discovery.
scienceevolve-title: "Antibody and immune recognition · antigen antibody interface characterization workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Guide agents to plan and execute non-clinical research programs that characterize antigen-antibody interfaces through structural, functional, and evolutionary evidence. The workflow supports epitope/paratope mapping, cross-reactivity analysis, and mechanistic discovery while keeping claims bounded to the evidence and explicitly separating binding recognition from biological function.

# When to use

Use this skill when a task involves one or more of the following:

- Proposing research questions for epitope or paratope mapping, binder engineering, or protein-interface characterization.
- Designing hypothesis-driven plans to modulate or understand recognition by targeting specific interface features rather than optimizing affinity alone.
- Investigating cross-reactivity, family-level broad recognition, or state-dependent conformational epitopes.
- Turning uncertain structural models, homologous structures, or partial interaction data into testable interface hypotheses.
- Planning computational screening, focused design spaces, and orthogonal validation for antigen-antibody systems.

Do not use this skill to provide clinical recommendations, therapeutic claims, operational wet-lab protocols, or high-risk implementation parameters.

# Inputs required

Ask the user or retrieve from the environment:

- Target antigen identity, family context, and biological function of interest.
- Candidate functional site, interface region, or rationale for why a surface may control recognition or function.
- Available structural, sequence, evolutionary, and interaction evidence, with uncertainty noted.
- Binder or probe panel: antibodies, fragments, scaffolds, or mimics, including known specificity and limitations.
- Biological states to compare: native, denatured, assembled, immature, modified, or conformational states.
- Functional endpoints and available readouts for binding, specificity, structural integrity, and mechanistic confirmation.
- Constraints: biosafety level, ethical approvals, specificity requirements, and prohibited operational details.
- Known assay limitations, confounders, and acceptable stop criteria.

If the target site is not functionally or structurally justified, first generate alternative interface hypotheses before proceeding.

# Core Workflow

Follow this ordered end-to-end route, applying decision gates and stop conditions at each phase.

1. **Frame the interface question.** Define the mechanistic gap: which interface features determine recognition, specificity, functional modulation, or escape? Specify the antigen, binder class, and relevant biological state (e.g., native assembly, conformational transition).
   - *Decision Gate 1 — Question Justification*: If the target interface lacks functional or structural rationale, return to evidence gathering or generate alternative site hypotheses before proceeding.

2. **Assemble and tier evidence.** Collect structural, sequence, evolutionary, and functional data. Label each item as direct, predicted, or analogical. Separate binding evidence from functional consequence.
   - *Stop Condition*: If no structural or functional anchor exists, stop and request additional inputs.

3. **Generate competing interface hypotheses.** Propose at least three alternative explanations for the observed or desired recognition pattern (e.g., hotspot-mediated binding, conformational/discontinuous epitope, quaternary interface, shared cross-reactive motif, state-dependent exposure). For each, state evidence strength, key assumptions, predicted observations, and failure modes.
   - *Decision Gate 2 — Hypothesis Discriminability*: If the hypotheses cannot be distinguished by feasible experiments, redesign the perturbation space or readouts.

4. **Design minimal staged validation.** Plan the smallest non-operational study that can discriminate the lead hypothesis from alternatives. Stage validation as:
   - (a) Binding/recognition assessment.
   - (b) Specificity and competition mapping.
   - (c) Structural or mechanistic confirmation.
   Include baseline, negative, positive, specificity, and orthogonal controls. Define success, failure, and stopping criteria before data collection.
   - *Stop Condition*: If appropriate controls or orthogonal readouts are unavailable, pause and revise the plan.

5. **Execute orthogonal readouts.** Acquire binding, structural integrity, competition, and functional data using at least two independent assay principles where possible. Record molecule quality, assay context, and uncertainty.
   - *Decision Gate 3 — Technical Validity*: If controls fail, replicates disagree, or integrity checks are ambiguous, halt biological interpretation and resolve technical issues first.

6. **Integrate evidence and classify interface features.** Build an evidence matrix mapping each candidate region to sequence, structural, binding, competition, and functional data. Classify features as linear, conformational, discontinuous, quaternary, or ambiguous. Explicitly distinguish binding from functional relevance.
   - *Iteration Trigger*: If binding and function diverge, revisit the contact hypothesis, epitope model, or assay readout rather than forcing agreement.

7. **Assess cross-reactivity, breadth, or state-dependence.** For family-level or cross-reactive questions, compare responses across a representative target panel and related non-targets. For state-dependent questions, compare conformational or assembly contexts. Quantify coverage, balance, and specificity.
   - *Decision Gate 4 — Artifact Exclusion*: If results are driven by nonspecific binding, assay artifacts, molecule quality issues, or confounding variables, stop and redesign.

8. **Iterate or terminate.** Compare observations against predictions.
   - *If supported*: Refine the interface model and test boundary conditions (variants, formats, contexts).
   - *If partially supported*: Add orthogonal readouts and re-score hypotheses.
   - *If contradicted*: Generate revised hypotheses without forcing residue-level transfer from unrelated systems.
   - *Stop Condition*: Terminate when claims reach the boundary of available evidence, when redesign cannot improve discriminability, or when safety/ethical constraints are triggered. Maintain a decision log across rounds.

# Output Format

When using this skill, produce:

1. **Research question summary** — Target, functional effect, biological state, and rationale.
2. **Evidence map** — Tiered inventory of direct, predicted, and analogical evidence with uncertainty labels.
3. **Hypothesis ledger** — At least three competing hypotheses, each with mechanism, evidence strength, key assumptions, predicted observations, failure modes, and boundary conditions.
4. **Staged validation plan** — Non-operational design with perturbation classes, probe classes, controls, readouts, success/failure criteria, and stopping conditions.
5. **Analysis plan** — Evidence matrix template, classification rules for epitope/paratope type, normalization strategy, and criteria for reconciling predictions with observations.
6. **Iteration plan** — Result patterns that trigger redesign, site revision, scaffold revision, or termination.
7. **Validity and ethics statement** — Confounders, boundary conditions, reproducibility risks, and safety constraints.

# Validation Gates

- **Gate 1 — Question Justification:** The target interface must have a plausible structural or functional rationale before hypothesis generation proceeds.
- **Gate 2 — Hypothesis Discriminability:** Competing hypotheses must be distinguishable by the proposed experiments; if not, redesign the perturbation or readout space.
- **Gate 3 — Control and Orthogonality:** Every plan must include baseline, negative, positive, specificity, and orthogonal controls; absence of any required control blocks progression.
- **Gate 4 — Technical Validity:** Controls must pass and replicates must agree before biological meaning is inferred.
- **Gate 5 — Evidence Convergence:** A mechanistic claim requires agreement across at least two independent evidence streams; single-assay claims remain provisional.
- **Gate 6 — Specificity and Artifact Exclusion:** Nonspecific binding, molecule quality failure, assay artifacts, and confounding variables must be ruled out before advancing cross-reactivity or breadth claims.

# Claim Boundaries

- Binding evidence alone does not prove functional modulation, neutralization, or biological importance.
- Antigenicity or accessibility does not establish clinical relevance, therapeutic potential, or disease causality.
- Computational similarity, conservation, or structural overlap does not constitute empirical cross-reactivity.
- A single structural model or pose is insufficient to prove a mechanism; treat models as uncertain evidence.
- Observations from one antigen-binder pair, serotype, scaffold, or assay context should not be presented as field-wide consensus.
- Agent-inferred hypotheses for new systems remain provisional until validated by matched controls and orthogonal readouts.

# Failure Modes

- **Misfolding or aggregation** confounds binding signals and mimics specific recognition.
- **Assay artifacts** such as avidity effects, tag interference, background drift, or signal saturation produce false specificity or false negatives.
- **Overfitting to a single structural pose, clone, model, or assay** leads to irreproducible interface claims.
- **Conserved patch binding** causes broad reactivity that is mistaken for targeted cross-reactivity.
- **State-dependent epitopes** are misclassified when native-context validation is missing.
- **Unsupported transfer** of residue-level rules across scaffolds, formats, or unrelated antigens generates incorrect redesigns.
- **Confounding by conformational coupling** misattributes distant effects to direct interface contacts.
- **Premature clinical extrapolation** converts non-clinical binding data into unsupported therapeutic or diagnostic claims.

# Validity Checks

Before presenting conclusions, verify:

- **Site validity:** Is the target interface mechanistically linked to the desired functional or recognition outcome?
- **Model validity:** Are structural models incomplete, flexible, or outside the training domain of predictors?
- **Scaffold validity:** Does the binder scaffold plausibly tolerate intended changes without loss of folding or expression?
- **Specificity validity:** Are related proteins, orthologs, family members, and irrelevant controls included?
- **Functional validity:** Does the readout measure the proposed interface mechanism rather than a downstream proxy only?
- **Statistical validity:** Are replicates, uncertainty estimates, multiple-testing correction, and selection bias addressed?
- **Reproducibility:** Can the result be reproduced across independent designs, preparations, assays, or contexts?
- **Boundary conditions:** Are claims explicitly limited to the studied target, family, species, construct format, and assay context?
- **Failure transparency:** Are negative results, ambiguous results, and alternative explanations reported?

# Provenance

Derived from cluster 20, subcluster 20.1.split0. Synthesized from source skills: epitope-guided-functional-antibody-design (79080592e7f948ea), viral-capsid-epitope-discovery (3dfab8a4a1338b61), allergen-autoantigen-crossreactivity-research (bf435da3f8e6ebca), scfv-multimer-design-exploration (1634ebb4a388ebcc), viral-glycoprotein-state-mechanism-discovery (4b8ba055b1ade731), adenovirus-penton-epitope-research (13cf4d7e689055ac), influenza-na-paratope-interface-exploration (4190ecf078511903), and structure-informed-broad-recognition-research (5b5ec9792efd7fe7).
