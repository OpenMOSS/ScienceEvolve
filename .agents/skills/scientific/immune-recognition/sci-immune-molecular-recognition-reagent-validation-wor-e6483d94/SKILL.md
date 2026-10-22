---
name: sci-immune-molecular-recognition-reagent-validation-wor-e6483d94
description: A reusable end-to-end workflow for designing non-clinical studies that discover and validate candidate molecular recognition reagents through target-panel screening, competition logic, and orthogonal readouts.
scienceevolve-title: "Antibody and immune recognition · molecular recognition reagent validation workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Use this skill to design a bounded, non-clinical research program for discovering and validating molecular recognition reagents such as antibodies, fragments, peptides, aptamers, or scaffolded binders. It guides an agent from an initial recognition question through candidate generation, specificity testing, epitope or feature boundary discrimination, and iterative go/no-go decisions without treating any single study as field consensus.

# When to use

Trigger when the task involves:

- Translating a target or disease motivation into a specific molecular-recognition problem.
- Designing specificity-first validation with target, related-target, unrelated-target, nonspecific-background, and scaffold controls.
- Planning candidate screening, epitope or feature boundary testing, or orthogonal confirmation for binders, ligands, or probes.
- Comparing discovery routes, reagent formats, or candidate classes for the same target.
- Iterating on hypotheses after weak binding, poor specificity, ambiguous identity, or inconsistent functional readouts.

Do not use for clinical decision-making, patient-specific recommendations, executable wet-lab protocols, or operational handling of hazardous materials.

# Inputs required

Ask for or identify:

- Target molecule, feature, or assembly state to be recognized, plus its biological context.
- Candidate modality (e.g., antibody fragment, displayed library, scaffolded binder, peptide, aptamer) and diversity rationale.
- Prior evidence map: what is directly validated, inferred, or unknown.
- Available non-clinical readouts for binding, specificity, identity, reproducibility, and boundary testing.
- Control requirements: unrelated targets, nonspecific backgrounds, scaffold or empty-platform controls, and positive controls.
- Constraints: ethics, biosafety, data governance, model relevance, and acceptable validation depth.

If inputs are missing, produce a clarification plan rather than inventing target-specific parameters.

# Core Workflow

Execute the following ordered stages. Do not advance past a decision gate until its criteria are met; stop or redesign if a stop condition is triggered.

1. **Frame the recognition question and competing hypotheses**
   - Define the specific target feature and why recognizing it matters.
   - Separate target biological relevance from binder specificity.
   - Formulate competing hypotheses: specific recognition of the intended feature; recognition of a related but unintended feature; scaffold, matrix, or nonspecific artifact; recognition of the presented form only.
   - Label evidence strength, key assumptions, predicted discriminating observations, and likely failure modes.
   - **Decision gate:** Proceed only if the recognition question is falsifiable and at least one negative control strategy is available.

2. **Design the target panel and candidate set**
   - Include the intended target or functional domain.
   - Include related targets or fragments that preserve or alter the suspected feature.
   - Include unrelated targets that test generic recognition.
   - Include nonspecific proteins, matrices, or background conditions.
   - Include scaffold-only or empty-platform controls.
   - Generate or select a diverse candidate set and justify the diversity logic without copying source-specific libraries.
   - **Decision gate:** The panel must include at least one unrelated target and one background or scaffold control before screening begins.

3. **Screen candidates for target engagement and specificity**
   - Evaluate individual candidates rather than relying solely on pooled enrichment.
   - Require target signal to exceed nonspecific background and unrelated-target signal.
   - Track reproducibility across independent preparations or assay runs.
   - **Stop condition:** If target-associated signal cannot be separated from background or unrelated targets, redesign the panel or selection pressure before proceeding.

4. **Map recognition boundaries and epitope or feature logic**
   - Use related-target or fragment comparisons and competition logic to localize the suspected recognition feature.
   - Treat competition or mapping data as evidence about relative binding sites, not as full structural proof.
   - Add orthogonal readouts to corroborate boundary hypotheses.
   - **Decision gate:** Boundary claims require converging evidence from at least two independent comparison types (for example, fragment panel plus competition).

5. **Confirm candidate identity and molecular quality**
   - Verify sequence or structural annotation matches the intended binder class.
   - Assess molecular state, aggregation, stability, and format integrity as potential confounders.
   - **Stop condition:** If identity is ambiguous or molecular quality is insufficient, do not interpret the candidate as a validated reagent.

6. **Validate functional or downstream utility (if applicable)**
   - Separate binding from functional inhibition, capture, localization, or mechanism.
   - Include orthogonal molecular or pathway readouts that support the phenotype.
   - Use binding-positive but nonfunctional comparators to test binding-function dissociation.
   - **Decision gate:** Functional claims are only evaluated after binding specificity and reproducibility are established.

7. **Integrate evidence and decide iteration or stop**
   - Update the hypothesis table with evidence gained, remaining uncertainty, and revised failure modes.
   - Classify each claim as directly observed, inferred, extrapolated, or unvalidated.
   - **Go / No-go rules:**
     - Promote a candidate to advanced characterization only if specificity, boundary, identity, and reproducibility converge.
     - Redesign if specificity is weak, boundary evidence conflicts, or functional readouts contradict binding.
     - Stop if controls fail repeatedly, candidate identity remains unresolved, or claims would require clinical or high-risk extrapolation beyond the evidence.
   - Archive negative results and document boundary conditions.

# Output Format

When using this skill, return:

1. **Research question:** One concise non-clinical question framed around target recognition or binder specificity.
2. **Hypothesis table:** Candidate recognition claims, evidence strength, key assumptions, predicted discriminating observations, and likely failure modes.
3. **Validation design:** Target panel, candidate-level screening logic, control categories, variables, metrics, and stop conditions.
4. **Analysis plan:** Specificity checks, boundary interpretation, identity confirmation, statistical checks, uncertainty reporting, and visualization strategy.
5. **Iteration plan:** How each result pattern (strong target contrast, nonspecific signal, scaffold artifact, boundary conflict, functional dissociation) updates or terminates the hypotheses.
6. **Validity and safety notes:** Confounders, reproducibility requirements, boundary conditions, ethics constraints, and non-clinical limits.

# Validation Gates

- **Assay validity gate:** Positive and negative controls must behave as expected before candidate data are interpreted.
- **Specificity gate:** Candidate signal must exceed both nonspecific background and unrelated-target signal under predefined criteria.
- **Boundary gate:** Recognition boundary claims require converging evidence from related-target comparisons and at least one orthogonal readout.
- **Identity gate:** Sequence or structural annotation must confirm the candidate belongs to the intended molecular class.
- **Reproducibility gate:** Effects must be stable across candidate-level checks, independent preparations, or repeated measurements.
- **Functional gate (if applicable):** Functional claims are only evaluated after binding specificity and reproducibility are established.
- **Statistical gate:** Comparisons are prespecified, variance is reported, multiple comparisons are considered, and effect sizes are interpreted.

# Claim Boundaries

- Claims apply only to the tested target form, presentation format, candidate scaffold, and assay context.
- Binding evidence does not imply functional inhibition, therapeutic utility, or clinical relevance.
- Epitope or feature boundary inferences are provisional until supported by structural or high-resolution mapping.
- Source-paper observations are treated as methodological precedents, not field consensus.
- New hypotheses generated for different targets or systems are explicitly labeled as inferred or speculative.

# Failure Modes

- **Nonspecific adsorption:** Candidate binds to surfaces, matrices, or tags rather than the target.
- **Scaffold or format artifact:** Signal is driven by the display scaffold, fusion partner, or preparation impurity.
- **Target-presentation bias:** Recognized epitope is accessible only in the recombinant or immobilized form used for screening.
- **Enrichment bias:** Repeated selection favors a single clone or family due to amplification advantage rather than true diversity.
- **Readout saturation or interference:** Assay signal is nonlinear or confounded by detection chemistry.
- **Ambiguous identity:** Sequence or structural data do not resolve the candidate to the intended class.
- **Binding-function dissociation:** Candidate binds the target but does not inhibit, capture, or localize as expected.
- **Overgeneralization:** Single-system results are extrapolated to broad scaffold families, target classes, or clinical contexts.

# Validity Checks

Before presenting conclusions, verify:

- Specificity against unrelated targets and nonspecific background is demonstrated.
- Scaffold, presentation, and matrix effects are considered as alternative explanations.
- Boundary evidence from related-target comparisons supports the inferred recognition feature.
- Identity evidence confirms the candidate is the intended molecular class.
- Reproducibility is supported by repeated measurements or clear uncertainty estimates.
- Statistical comparisons are prespecified, appropriately replicated, and reported with effect sizes.
- Claims are scoped to the tested target form, format, and biological context.
- Directly observed facts are separated from inferred mechanisms and broader extrapolations.
- Results are framed as precedents for related systems rather than field-wide consensus.

# Provenance

Synthesized from cluster 23, subcluster 23.2.split0. Source skills: amyloid-binder-discovery-workflow (f2dc11f31268c5bf), immune-repertoire-binding-function-research (d67c0cf214da8ff0), single-domain-antibody-discovery-workflow (cdad47a761abc751), antibody-fragment-route-comparison (b8f134ab4d8e2f0d), toxin-neutralizing-antibody-discovery (15de975ca2d7fd61), epitope-informed-recognition-reagent-workflow (cd4485c515dbf2f9), cross-context-antibody-probe-discovery (d2e0b07417c4c8b4), anti-idiotype-research-workflow (d51dd0fbeab90c6e).
