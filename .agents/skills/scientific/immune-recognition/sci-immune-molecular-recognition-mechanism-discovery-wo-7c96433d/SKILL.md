---
name: sci-immune-molecular-recognition-mechanism-discovery-wo-7c96433d
description: A reusable end-to-end workflow for discovering and validating molecular recognition determinants, binding mechanisms, and epitope or ligand interfaces through hypothesis-driven screening, competition, mimotope inference, and structural triangulation.
scienceevolve-title: "Antibody and immune recognition · molecular recognition mechanism discovery workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

This skill guides the design of reusable, non-operational research plans for discovering and validating molecular recognition mechanisms. It abstracts the logic of binder-target interface mapping across systems such as antibody-epitope, protein-ligand, and mimotope-based recognition. The workflow emphasizes hypothesis generation, layered validation, and mechanistic triangulation without reproducing source-specific protocols or treating single-study findings as field consensus.

# When to use

Use this skill when the user asks to:

- Propose new research questions about binding determinants, epitopes, mimotopes, or conformational recognition interfaces.
- Design conceptual validation plans that combine direct binding, competition, sequence/structure inference, and perturbation logic.
- Evaluate whether a candidate binder, motif, or structural model plausibly reflects native recognition.
- Plan iterative studies that progress from exploratory screening to mechanistic claims.

Do not use this skill for clinical advice, therapeutic recommendations, operational laboratory execution, or claims that one binder defines a whole-class immune response.

# Inputs required

Before producing a design, ask for or infer:

- **Target and binder:** molecular partners, expected binding mode, and whether the interface is likely continuous or discontinuous.
- **Evidence baseline:** prior binding data, structural models, sequence alignments, known interfaces, or negative results.
- **Candidate source:** diversity strategy (e.g., library, scanning, computational design) if applicable.
- **Readouts available:** binding, competition, enrichment, structural, computational, or orthogonal assays.
- **Constraints:** biosafety, ethics, non-operational boundaries, and what must remain conceptual.
- **Success criteria:** specificity, mechanistic resolution, or application fit required by the user.

# Core Workflow

An ordered end-to-end route with decision gates and iteration/stop conditions.

1. **Frame the recognition gap**
   - State the binder, target, expected mode, and the specific mechanistic unknown (e.g., determinant location, conformational dependence, specificity basis).
   - Define what evidence would count as recognition versus artifact.
   - **Decision gate:** Is the question falsifiable and bounded? If not, refine scope before proceeding.

2. **Generate mechanistic hypotheses**
   - Propose candidate recognition determinants (chemical features, sequence motifs, structural states, presentation contexts).
   - Include at least one artifact or nonspecific-binding alternative.
   - Tag each hypothesis with evidence strength (e.g., speculative, plausible, supported), key assumptions, and predicted discriminators.
   - **Decision gate:** Are hypotheses specific, falsifiable, and separable from global folding or nonspecific effects? If not, decompose or add controls.

3. **Design minimal viable validation**
   - Plan candidate generation or diversity sourcing adapted to the new system (avoid copying source-specific library conditions).
   - Define direct readout, competition or displacement logic, and perturbation strategy.
   - Specify controls: positive, negative, specificity (close analogs), format/scaffold, and orthogonal.
   - Predefine primary endpoints, failure criteria, and stop conditions.
   - **Decision gate:** Does the design distinguish the leading hypothesis from the strongest alternative explanation? If not, redesign before execution.

4. **Collect converging evidence layers**
   - **Layer A – Direct binding/enrichment:** Measure recognition against target and background; require signal above nonspecific recovery.
   - **Layer B – Specificity filtering:** Test close analogs, irrelevant targets, and scaffold-only conditions; reject candidates that fail here.
   - **Layer C – Native overlap:** Use competition or orthogonal binding to test whether candidates share recognition space with the native target.
   - **Layer D – Structural/computational mapping:** Place inferred features onto available models; state model assumptions and template limitations.
   - **Layer E – Perturbation:** Test predicted determinants with conservative changes; include integrity and specificity controls.
   - **Decision gate after each layer:** Do controls pass and signal exceed predefined thresholds? If controls fail, stop and redesign.

5. **Triangulate and mechanistically interpret**
   - Compare direct binding, specificity, competition, structural plausibility, and perturbation results as independent evidence layers.
   - Distinguish core recognition features, tolerated substitutions, context-dependent effects, and likely artifacts.
   - **Decision gate:** Do at least two orthogonal evidence streams converge? If yes, advance the model. If no, downgrade confidence and flag unresolved assumptions.

6. **Iterate or terminate**
   - **Advance:** If convergence is strong, refine the model and test boundary conditions (e.g., alternative binders, target variants).
   - **Refine:** If evidence is promising but incomplete, identify the weakest layer and design the next minimal discriminating experiment.
   - **Reject/Revise:** If results contradict the hypothesis or artifacts dominate, revise the mechanism or reject the hypothesis rather than adding ad hoc explanations.
   - **Stop:** Terminate if safety/ethical limits are reached, controls consistently fail, the target cannot be distinguished from analogs, or mechanistic claims remain unsupported after orthogonal testing.

# Output Format

For each invocation, produce:

1. **Research context** – Target, binder, recognition readout, known evidence, and scope boundaries.
2. **Hypothesis set** – 2–5 ranked hypotheses with evidence strength, key assumptions, predicted observations, and failure modes.
3. **Minimal validation design** – Variables, conceptual controls, evidence layers, decision criteria, and stop conditions.
4. **Analysis plan** – Evidence hierarchy, convergence criteria, artifact checks, and uncertainty handling.
5. **Iteration plan** – Weakest evidence layer, next update step, and pivot criteria for success, ambiguity, or failure.
6. **Boundary statement** – What the design can support and what it cannot support without further evidence.

# Validation Gates

- **Scope gate:** The recognition question is falsifiable and bounded to a specific binder-target pair or interface class.
- **Hypothesis gate:** Hypotheses are specific, include alternatives, and are separable from nonspecific/global effects.
- **Design gate:** The validation plan includes positive, negative, specificity, and orthogonal controls; predefines failure criteria.
- **Control gate:** Background, scaffold-only, and irrelevant-target signals remain below predefined thresholds before interpreting target binding.
- **Convergence gate:** Mechanistic claims require agreement between at least two independent evidence layers (e.g., binding + competition, or mapping + perturbation).
- **Perturbation gate:** Interpretation of perturbation results is conditional on target/binder integrity controls and specificity checks.
- **Boundary gate:** Claims are explicitly limited to the tested system, format, and evidence level before generalization.

# Claim Boundaries

- Binding or enrichment evidence alone supports only the existence of an interaction, not its mechanism or physiological relevance.
- Motif or sequence convergence supports a plausible determinant but is not definitive proof of native interface identity.
- Competition or native-overlap evidence supports shared recognition space, not structural identity.
- Perturbation evidence supports the importance of a feature only when integrity and specificity controls are satisfied.
- Functional, protective, diagnostic, or therapeutic claims require evidence beyond binding and interface mapping.
- Single-binder or single-target findings must not be presented as consensus for an entire class.

# Failure Modes

- **Nonspecific binding:** Signal driven by charge, hydrophobicity, aggregation, or scaffold effects rather than target-specific recognition.
- **Format dependence:** Binding observed only in one presentation context (e.g., immobilized, multivalent, display) and lost in orthogonal formats.
- **Model overreach:** Structural or computational models treated as proof without empirical specificity or perturbation support.
- **Overfitting:** Conclusions based on a single candidate, clone, or motif without independent replication.
- **Integrity confounding:** Perturbation alters folding, stability, or expression rather than the intended interface feature.
- **Matrix or context interference:** Sample context, carrier, or presentation artifacts dominate the observed pattern.
- **Selection bias:** Enrichment reflects amplification, bottleneck, or readout artifacts rather than true recognition.

# Validity Checks

Before finalizing any output, verify:

- **Confounders:** Scaffold effects, avidity, immobilization artifacts, assay saturation, batch effects, target instability, and model-template bias.
- **Reproducibility:** Independent candidates, repeated enrichment, matched controls, and orthogonal readouts.
- **Specificity:** Positive and negative controls behave as expected; close analogs are discriminated.
- **Statistical validity:** Predefined ranking criteria, appropriate replication, variance estimates, and uncertainty reporting when data are available.
- **External validity:** Avoid generalizing from one strain, binder, assay, or structural model.
- **Claim discipline:** Label each claim as observed, inferred, or speculative.
- **Safety and ethics:** Outputs remain non-operational; clinical, therapeutic, and high-risk execution guidance is excluded.

# Provenance

- Derived from cluster `5`, subcluster `5.0.split0`.
- Synthesized from source skills: `flavivirus-mimotope-epitope-exploration`, `hapten-antibody-mechanism-exploration`, `epitope-mimotope-research-workflow`, `antibody-mimotope-research-design`, `vnar-affinity-reagent-discovery`, `antibody-glycan-binding-workflow`, `triplex-recognition-workflow`, `antibody-variable-peptide-workflow`.
- Paper-derived operational details, numerical parameters, and system-specific conclusions have been excluded; only the shared workflow route and validation logic are retained.
