---
name: sci-immune-surrogate-guided-molecular-recognition-disco-4b24f344
description: A reusable end-to-end workflow for discovering and validating surrogate molecules that recapitulate native recognition features and generating mechanistic insight through convergent orthogonal evidence.
scienceevolve-title: "Antibody and immune recognition · surrogate guided molecular recognition discovery workflow"
scienceevolve-area: antibody-and-immune-recognition
---

## Purpose

Help an agent design and execute a staged research workflow to discover and validate surrogate molecules—such as mimotopes, probes, scaffolds, or templates—that recapitulate native epitope, ligand, or receptor recognition features, and to generate mechanistic or functional insight without overgeneralizing from a single system.

## When to use

Use when the user needs to plan non-clinical research for surrogate molecules intended to mimic native recognition features in molecular recognition systems (e.g., antibody–antigen, receptor–ligand, enzyme–substrate, aptamer–target). It is appropriate for hypothesis generation, experimental design, analysis planning, and iteration. Do not use for clinical recommendations, operational wet-lab protocols, or paper summarization.

## Inputs required

- Target recognition molecule and native ligand or epitope context.
- Rationale for the surrogate approach (e.g., native target instability, poor immunogenicity, engineering need).
- Candidate surrogate library, scaffold, template, or probe set concept.
- Concepts for orthogonal assays spanning binding, specificity, structure, and function.
- Constraints: safety, ethics, computational versus wet-lab scope, and available controls.

## Core Workflow

1. **Define the recognition gap.** State why the native target is insufficient and which mechanistic features must be preserved.
2. **Generate or select surrogate candidates.** Use display technologies, structural templates, computational modeling, or probe engineering.  
   *Decision gate:* Candidates must be structurally plausible and compatible with the intended recognition framework.
3. **Validate surrogate integrity.** Confirm correct folding, assembly, and structural plausibility before interpreting binding data.  
   *Stop condition:* Halt if scaffold integrity fails.
4. **Screen for target-dependent binding and specificity.** Assess candidate interaction with the intended recognition molecule and counter-screen against irrelevant or closely related molecules.  
   *Stop condition:* Stop if target-dependent binding is absent or specificity collapses.
5. **Decompose mechanism with orthogonal readouts.** Integrate structural modeling, sequence diversity analysis, competition assays, and independent functional or kinetic measurements.  
   *Decision gate:* Require at least two independent readout types to converge before accepting mechanism claims.
6. **Compare surrogate behavior to native biological context.** Test whether the surrogate reproduces native-target responses or merely creates a private binding site.  
   *Stop condition:* Redesign or stop if native-context validation fails.
7. **Iterate based on evidence convergence.** Advance candidates showing convergent mimicry, specificity, and functional relevance. Redesign if surrogate-self recognition dominates. Halt if confounding by assay format, scaffold artifact, or presentation effect cannot be experimentally resolved.

## Output Format

- Research question and gap framing.
- Ranked mechanistic hypotheses with evidence strength, key assumptions, and failure modes.
- Validated surrogate candidates or a stop/redesign recommendation.
- Comparative mechanistic model relating surrogate and native recognition.
- Staged validation plan with explicit decision gates and stopping conditions.
- Boundary statement on generalizability and claim limits.

## Validation Gates

- **Scaffold integrity control:** Surrogate must be folded and conformationally appropriate before binding interpretation.
- **Specificity control:** Signal must distinguish target from irrelevant and closely related molecules.
- **Competition control:** Surrogate must compete with native ligand or probe-target recognition where applicable.
- **Orthogonal concordance:** At least two independent readout types must converge before accepting mechanism claims.
- **Native-context check:** Surrogate behavior must be validated against native biological context, not only the selection probe.
- **Negative evidence handling:** Null or weak findings must be reported as constraints on the hypothesis.

## Claim Boundaries

- **CAN** support claims about surrogate binding specificity, relative candidate ranking within the tested panel, and mechanistic hypotheses grounded in convergent evidence.
- **CAN** support engineering directions for improved mimicry when supported by structure–activity relationships.
- **CANNOT** support claims that the surrogate equals the native epitope or ligand without independent functional validation.
- **CANNOT** support clinical efficacy, therapeutic mechanism, or field-wide generalization from a single surrogate system.

## Failure Modes

- Stop if the surrogate fails scaffold integrity or target-dependent binding baselines.
- Split into sub-studies if screening success diverges from native-context functional relevance.
- Weaken claims if only binding data exist without specificity controls or orthogonal validation.
- Redesign if surrogate-self recognition dominates over target-system response.
- Halt if confounding by assay format, scaffold artifact, or presentation effect cannot be experimentally resolved.

## Validity Checks

- **Confounding:** Verify that surrogate, scaffold, display format, recognition molecule source, and assay format are not mixed across comparisons.
- **Baseline strength:** Compare against relevant positive and negative controls, not only against no-signal baselines.
- **Statistical validity:** Report variability, replicate structure, uncertainty, and whether differences are large enough to be meaningful.
- **Specificity:** Test related recognition molecules and non-target ligands before claiming epitope mimicry.
- **Orthogonality:** Confirm key claims with at least two assay formats when the claim will guide downstream use.
- **Reproducibility:** Document candidate provenance, design rules, assay endpoints, control identities, model parameters at a non-operational level, and data-processing steps.
- **Boundary conditions:** State whether conclusions apply to the selecting recognition molecule, related recognition molecules, native ligand, or only the tested surrogate format.
- **External validity:** Do not treat one surrogate system or one paper's result as field-wide consensus.

## Provenance

Synthesized from cluster 72, subcluster 72.0. Representative source skills: antibody-mimotope-research-design (a451ed188dfcb242), phage-antibody-mimicry-research (13fc508d1ebe4df7), hiv-env-antibody-quality-exploration (df1bc76030582c0f), structure-informed-ligand-recognition (edd59ac3e255dbe0), epitope-surrogate-vaccine-discovery (7cc2aced01917408), antibody-enzyme-analogy-research-design (a2ee37286e95cb78), fc-receptor-antibody-research-pattern (28c90e2919d1045d), cd1-lipid-probe-research-flow (9f30f4fbc15bf912). Excluded incompatible routes: clinical biomarker prognosis (063661e5752e8ea9) and bioanalytical assay standardization (1a4ed0ac4e6bf619).
