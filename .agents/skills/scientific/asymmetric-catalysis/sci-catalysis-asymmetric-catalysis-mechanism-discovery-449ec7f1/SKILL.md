---
name: sci-catalysis-asymmetric-catalysis-mechanism-discovery-449ec7f1
description: A reusable end-to-end workflow for generating mechanism-driven hypotheses, designing controlled validation plans, analyzing stereochemical outcomes, and iterating catalyst or ligand discoveries in asymmetric catalysis without operational wet-lab instructions.
scienceevolve-title: "Asymmetric catalysis · asymmetric catalysis mechanism discovery workflow 11"
scienceevolve-area: asymmetric-catalysis
---

# Purpose

This skill guides an agent through a reusable, end-to-end research workflow for asymmetric catalysis and chiral catalyst mechanism discovery. It emphasizes framing gaps from precedent, generating falsifiable mechanism-linked hypotheses, designing minimal controlled validation, analyzing stereochemical outcomes against multiple baselines, and iterating based on bounded claims rather than operational wet-lab recipes.

# When to use

Use this skill when:

- Proposing new research questions for chiral ligand, catalyst, or biocatalyst discovery and optimization.
- Transferring a structural motif or design principle from one reaction family, scaffold, or substrate class to another.
- Explaining an unexpected stereochemical outcome or anomaly with competing mechanistic hypotheses.
- Planning non-operational validation concepts, control matrices, and iteration rules before broad scope expansion.
- Evaluating whether a reported transformation or selectivity trend can plausibly generalize.

Do not use this skill to generate executable hazardous protocols, step-by-step synthesis instructions, high-risk operating parameters, or device-specific reaction execution details.

# Inputs required

Before executing the workflow, collect or infer:

- Target transformation, reaction family, or desired bond formation.
- Precedent motif, catalyst class, or mechanistic analogy motivating the study.
- Proposed design variable (e.g., scaffold rigidity, modular steric/electronic feature, dynamic ligand property, coordination geometry).
- Candidate substrate or system panel spanning steric, electronic, and conformational variation.
- Available analytical methods for structure verification, purity, catalyst speciation, conversion, and stereochemical assignment.
- Baseline and benchmark comparators, plus negative and positive control concepts.
- Safety, regulatory, material-availability, and institutional constraints.

# Core Workflow

1. **Frame the catalytic gap and precedent.** Start from a documented limitation in an established reaction family. Identify a prior motif or mechanism that provides a plausible starting point. Define the gap as stereocontrol, substrate scope, robustness, or mechanistic ambiguity.
   - *Gate 1 — Gap clarity:* If the limitation lacks supporting precedent or the research question is purely speculative, stop and refine the question.

2. **Generate mechanism-linked hypotheses.** Propose falsifiable hypotheses that connect a design variable to a predicted active-site or transition-state effect and then to an observable outcome. Include at least three candidates (e.g., standard pathway, anomalous pathway, ambiguity-producing pathway).
   - For each hypothesis, label evidence strength (strong/moderate/weak), state key assumptions, and list likely failure modes.
   - *Gate 2 — Discriminability:* If hypotheses do not make distinct stereochemical or kinetic predictions, redesign the variables before proceeding.

3. **Design minimal controlled validation.** Define the smallest experiment set that can falsify the central hypothesis.
   - Identify independent variables (design feature, substrate class, catalyst variant), dependent variables (conversion, selectivity, stereochemical outcome), and context variables (analytical method, environment).
   - Specify controls: negative (no catalyst, inactive variant), positive (benchmark), mechanistic (matched pair altering only the predicted interaction), and analytical (orthogonal stereochemical assignment).
   - Define primary and secondary metrics and pre-register stop conditions.
   - *Gate 3 — Conceptual safety:* If the plan requires operational hazardous protocols or executable high-risk parameters, reject it and redesign at the conceptual level.

4. **Verify structural plausibility.** Confirm that the candidate catalyst, ligand, or biocatalyst can be obtained and characterized as intended (identity, purity, stereochemical integrity, speciation) before interpreting performance.
   - *Gate 4 — Structural validation:* If the candidate cannot be verified, stop the line and redesign the scaffold or preparation concept.

5. **Execute comparison and collect data.** Run the minimal validation panel under matched analytical conditions. Record variability, control outcomes, and negative results.
   - *Gate 5 — Control validity:* If negative controls produce product, positive controls fail, or comparators behave implausibly, halt interpretation and troubleshoot the assay or design.

6. **Analyze structure–activity/selectivity relationships.** Normalize results against relevant baselines. Compare matched substrate or ligand pairs to isolate steric, electronic, conformational, or dynamic effects. Treat outliers as mechanistic signals. Map boundary conditions.
   - *Gate 6 — Trend coherence:* If observed trends contradict all proposed hypotheses and no plausible alternative exists, pivot to a new mechanistic model.

7. **Adjudicate mechanism with orthogonal evidence.** Require agreement among multiple evidence streams (stereochemical mapping, kinetic behavior, control experiments, and computational discrimination) before favoring one pathway. Do not infer mechanism from stereochemical outcomes alone.
   - *Gate 7 — Mechanistic convergence:* If evidence streams conflict, label the mechanism as unresolved and design a discriminating follow-up test rather than forcing the original model.

8. **Bound claims and decide iteration path.** Classify each hypothesis as supported, partially supported, rejected, or unresolved. Distinguish demonstrated performance in the tested family from inferred generality.
   - *Decision branch:*
     - **Proceed:** Cautiously expand scope only after the design principle survives discriminating controls.
     - **Refine:** Adjust the design variable tied to a partial failure mode (e.g., activity versus selectivity trade-off).
     - **Pivot:** Adopt an alternative hypothesis if the central assumption is falsified.
     - **Stop:** Abandon the motif if structural integrity fails, controls remain invalid, or repeated cycles falsify the core mechanism without a viable alternative.

9. **Plan next falsification cycle.** Update the hypothesis table with new evidence strength, revised assumptions, and the next smallest experiment that distinguishes remaining competing explanations. Return to Step 2 or 3 as appropriate.

# Output Format

When using this skill, produce:

1. **Research question** — Target transformation, precedent, and gap.
2. **Hypothesis portfolio** — At least three mechanism-linked hypotheses with evidence strength, assumptions, and failure modes.
3. **Minimal validation plan** — Variables, controls (negative, positive, mechanistic, analytical), metrics, and stop conditions.
4. **Analysis plan** — Data integrity checks, comparator-normalized interpretation, outlier/boundary analysis, and mechanism evidence requirements.
5. **Iteration decision** — Classification of each hypothesis (supported, partially supported, rejected, unresolved) and the next experimental or redesign path.
6. **Validity and safety review** — Confounders, reproducibility checks, statistical and analytical validity, external validity, and non-operational safety boundaries.

# Validation Gates

- **Gap clarity:** The research question must address a documented limitation with plausible precedent.
- **Hypothesis discriminability:** Hypotheses must yield distinct stereochemical or kinetic predictions.
- **Conceptual safety:** Validation plans must remain non-operational and free of executable hazardous details.
- **Structural validation:** Candidate identity, purity, and speciation must be verifiable before performance claims.
- **Control validity:** Negative, positive, and mechanistic controls must behave plausibly before interpreting results.
- **Trend coherence:** Observed trends must be reconcilable with at least one working hypothesis or trigger a pivot.
- **Mechanistic convergence:** Mechanism claims require agreement among multiple independent evidence streams.

# Claim Boundaries

- Distinguish demonstrated performance in the tested substrate or catalyst family from inferred generality.
- Do not infer a transition-state or binding mechanism from stereochemical outcomes alone.
- Separate source-paper evidence, transferable method principles, and new agent-generated inferences.
- Do not treat a single successful substrate, variant, or assay as proof of broad applicability.
- Label mechanistic statements as proposed, supported, or speculative based on the evidence available.

# Failure Modes

- Incorrect catalyst speciation or assembly state.
- Dominant background or non-catalytic reaction.
- Low conversion with high selectivity, or high conversion with low selectivity.
- Ambiguous stereochemical assignment or analytical misalignment.
- Irreproducible catalyst or ligand preparation.
- Narrow substrate scope without mechanistic explanation.
- Assay artifacts, host metabolism, or product instability.
- Trade-offs where a design variable improves one metric while degrading another (e.g., steric gatekeeping reducing activity).
- Loss of stereochemical integrity during downstream derivatization.

# Validity Checks

- **Confounding:** Ensure ligand purity, catalyst preparation, substrate quality, and analytical calibration do not differ unintentionally across comparisons.
- **Reproducibility:** Document variability across independent preparations and repeat decisive experiments.
- **Statistical validity:** Predefine decision thresholds, report uncertainty, and treat small differences cautiously.
- **Analytical validity:** Confirm that stereochemical assignments use validated, orthogonal methods where feasible.
- **Mechanistic validity:** Enumerate all plausible pathways and update the model when evidence contradicts the favored hypothesis.
- **External validity:** Avoid generalizing from one reaction family, metal, or substrate class to unrelated systems without independent validation.
- **Safety validity:** Keep all planning non-operational; flag requirements for institutional safety review and qualified supervision.

# Provenance

Derived from cluster 3, subcluster 3.1. Synthesized from source skills: `chiral-ligand-exploration-workflow`, `modular-asymmetric-catalyst-design`, `chiral-ligand-scaffold-exploration`, `biocatalytic-alkene-hydration-discovery`, `catalytic-ch-activation-research-design`, `stereochemical-mechanism-design`, `asymmetric-catalysis-pchiral-research-workflow`, `asymmetric-ni-catalysis-exploration`.
