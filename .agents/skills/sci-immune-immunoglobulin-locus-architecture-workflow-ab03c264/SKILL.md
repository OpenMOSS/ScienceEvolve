---
name: sci-immune-immunoglobulin-locus-architecture-workflow-ab03c264
description: A reusable end-to-end workflow for discovering and validating immunoglobulin locus architecture, genomic rearrangement patterns, allelic polymorphism, and haplotype structure through layered evidence, controlled hypothesis testing, and iterative model refinement.
scienceevolve-title: "Antibody and immune recognition · immunoglobulin locus architecture workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Help an agent design reusable, evidence-driven research plans for immunoglobulin and antigen-receptor locus architecture, genomic rearrangement, allelic polymorphism, haplotype comparison, and locus annotation. The workflow emphasizes scaffold-first reasoning: anchor on reliable known elements, separate inherited structure from process-generated signal, integrate heterogeneous evidence types, and validate claims without overreaching.

# When to use

Use this skill when a user asks to:

- Explore immunoglobulin heavy-chain, light-chain, or related antigen-receptor loci for novel organization, isotypes, or structural variants.
- Generate hypotheses about genomic rearrangement mechanisms, recombination signal usage, or aberrant joining patterns.
- Validate candidate inherited alleles, haplotypes, or locus polymorphisms against process-generated and technical alternatives.
- Compare locus architecture across species, strains, or homologues.
- Design structural genomics or annotation studies for antibody gene families.

Do not use this skill for clinical interpretation, diagnostic advice, treatment recommendations, or operational wet-laboratory protocol execution.

# Inputs required

Before proposing a study, identify or request:

- **Target locus or region** and its biological context (species, chain type, cell state).
- **Candidate observation** and how it was first detected (genomic, transcript, comparative, or mapping evidence).
- **Reference resources**: germline sequences, annotation version, coordinate system, and curated domain definitions.
- **Confounding processes**: known rearrangement, somatic mutation, selection, editing, or technical artifacts that could mimic the observation.
- **Comparative context**: homologues, outgroups, haplotypes, or independent samples available for recurrence and co-segregation checks.
- **Governance constraints**: ethical, privacy, consent, biosafety, and data-access limitations.

If inputs are missing, state assumptions explicitly and mark the plan as provisional.

# Core Workflow

Follow this ordered route. At each decision gate, stop or redirect if the condition is not met.

## Stage 1: Observation and Anchoring
1. Define reliable known anchors (conserved domains, established germline references, validated markers).
2. Map the current evidence coverage: known regions, partial evidence, gaps, and contradictory observations.
3. Treat gaps and anomalies as signals rather than noise.

**Decision Gate 1 — Anchor Reliability:**  
If anchors are ambiguous, incomplete, or mismatched to the target system, stop and refine the reference framework before proceeding.

## Stage 2: Generate Competing Hypotheses
For each candidate observation, produce at least three hypotheses:
- **Inherited/structural hypothesis**: the observation reflects a stable germline allele, haplotype, or locus architecture.
- **Process-generated hypothesis**: the observation reflects recombination, somatic change, selection, editing, or other dynamic immune-receptor processes.
- **Technical artifact hypothesis**: the observation reflects assembly, annotation, alignment, sequencing, or contamination error.
- **Mixed hypothesis**: the observation is real but does not map cleanly to a single cause.

For each hypothesis, record: evidence strength (high / moderate / low / speculative), key assumption, predicted discriminator, likely failure mode, and boundary condition.

**Decision Gate 2 — Testability:**  
If no hypothesis generates a testable prediction with available data, mark the question as unresolved and stop.

## Stage 3: Design Minimal Validation
1. Select an upstream evidence layer or orthogonal data type that can discriminate among hypotheses.
2. Define comparison groups:
   - Germline or non-rearranged baseline.
   - Rearranged or variant-bearing sample.
   - Reciprocal product or matched locus comparator (if applicable).
   - Non-rearranging or out-of-domain negative control.
3. Specify controls:
   - Positive: known stable architecture or validated marker.
   - Negative: unrelated locus, out-of-domain sequence, or expected absence.
   - Orthogonal: independent data type or computational method.
   - Annotation: reference version and coordinate consistency checks.
4. Define evaluation metrics (e.g., concordance between evidence layers, locus coverage, replication consistency).
5. Predeclare stop conditions:
   - Stop if controls fail.
   - Stop if only one evidence type is available and alternatives remain indistinguishable.
   - Stop mechanism or prevalence claims if sampling is biased or coverage is insufficient.

**Decision Gate 3 — Feasibility:**  
If the minimal validation cannot be constructed from available non-operational evidence, return a provisional plan with explicit gaps.

## Stage 4: Layered Evidence Integration
Collect and classify evidence into independent layers:
- **Genomic structure**: gene order, orientation, domain architecture, breakpoint topology.
- **Transcript evidence**: isoform structure, splice compatibility, expression context.
- **Comparative evidence**: homology, phylogenetic placement, conserved motifs across taxa.
- **Allelic/haplotype evidence**: co-segregation, recurrence, database provenance.

**Decision Gate 4 — Convergence:**  
If fewer than two independent evidence types converge, classify the claim as weak or speculative and do not upgrade the hypothesis.

## Stage 5: Scaffold Reconstruction and Model Comparison
1. Integrate convergent evidence into a traceable locus scaffold (map, graph, or structured table).
2. Classify each element:
   - Functional candidate.
   - Nonfunctional or impaired candidate.
   - Ambiguous.
   - Artifact or insufficient evidence.
3. Compare alternative structural models (single-copy, duplicated, inverted, translocated, mixed).
4. Prefer the model that explains the most independent evidence with the fewest unsupported assumptions.

**Decision Gate 5 — Model Discrimination:**  
If multiple models remain equally plausible, preserve them as competing alternatives and identify the minimum additional evidence needed to separate them.

## Stage 6: Mechanism Discrimination and Confounding Exclusion
1. Evaluate whether process-generated or technical alternatives can explain the observation:
   - For rearrangement claims: assess junction architecture, reciprocal-product logic, motif compatibility, and topology.
   - For polymorphism claims: assess co-segregation, independent recurrence, and database provenance.
   - For annotation claims: assess reference coverage, paralog confusion, and repeat-region artifacts.
2. List all mimic mechanisms explicitly before favoring the inherited/structural hypothesis.

**Decision Gate 6 — Confounding Exclusion:**  
If plausible alternatives cannot be excluded, downgrade the inherited/structural claim to "compatible with" rather than "supported."

## Stage 7: Claim Grading and Boundary Setting
Assign a claim level:
- **Verified observation**: directly observed and independently replicated.
- **Supported inference**: convergent evidence with passed controls.
- **Plausible alternative**: consistent with evidence but lacking decisive exclusion of alternatives.
- **Unresolved**: insufficient or conflicting evidence.

State explicitly:
- What the evidence supports and what it does not support.
- Extrapolation boundaries (species, locus, population, cell state, evidence type).
- Separation between paper-supported logic and agent-inferred extensions.

## Stage 8: Iteration or Termination
- **If supported**: strengthen the scaffold, generate a follow-up prediction, and proceed to functional-plausibility questions only when structural evidence justifies it.
- **If partially supported**: retain uncertainty, identify the ambiguous element, and design a follow-up targeting the disagreement.
- **If unsupported**: revise the scaffold or switch to the best-supported alternative hypothesis.
- **If inconclusive**: improve controls, expand comparative sampling, or seek orthogonal data.

**Stop Conditions (terminal):**
- Controls fail or behave unexpectedly.
- Evidence depends on a single unreplicated source.
- Required operational details would constitute wet-lab protocols or high-risk parameters.
- Extrapolation exceeds the validated biological or technical boundary.
- Ethical, biosafety, or governance constraints prevent adequate validation.

# Output Format

Return results in this structure:

1. **Research question** — Concise statement of the locus-architecture or rearrangement problem.
2. **Evidence map** — Observed data, inferred intervals, hypothesized mechanisms, and extrapolations.
3. **Hypotheses table** — For each hypothesis: statement, evidence strength, key assumptions, predicted discriminator, likely failure mode, and boundary.
4. **Validation design** — Comparison groups, evidence layers, controls, evaluation metrics, and stop conditions.
5. **Analysis plan** — Scaffold integration, element classification, model comparison, and visualization strategy.
6. **Iteration plan** — Decision rules for upgrading, downgrading, splitting, or replacing hypotheses under each possible result.
7. **Validity and ethics checks** — Confounders, reproducibility checks, boundary conditions, and governance constraints.
8. **Claim-level summary** — What is verified, what is inferred, what remains unresolved, and what must not be generalized.

# Validation Gates

Predefined checkpoints that must be satisfied before advancing or finalizing claims:

- **Anchor Reliability Gate**: Known references and markers are appropriate for the target system.
- **Testability Gate**: At least one hypothesis yields a testable prediction.
- **Feasibility Gate**: Minimal validation can be constructed from available evidence.
- **Evidence Convergence Gate**: Claims rely on at least two independent evidence types.
- **Model Discrimination Gate**: Competing structural models are distinguishable or explicitly preserved.
- **Confounding Exclusion Gate**: Plausible mimic mechanisms are listed and evaluated.
- **Claim Proportionality Gate**: Conclusion strength matches evidence strength and control behavior.

# Claim Boundaries

- Distinguish observed genomic features from inferred function, expression, or clinical relevance.
- Separate structural plausibility from proof of biological activity.
- Limit generalization to the tested locus, species, population, cell state, and evidence type.
- Do not treat a single-species or single-locus observation as a field-wide consensus.
- Clearly label paper-supported logic versus agent-inferred extensions.
- Avoid equating genomic presence with disease relevance or therapeutic utility.

# Failure Modes

- **Assembly/annotation artifacts** misclassified as biological variation.
- **Paralog confusion** or repetitive-region misassignment distorting locus identity.
- **Process-generated signal** (recombination, somatic mutation, selection) misclassified as inherited polymorphism.
- **Single-evidence overinterpretation** where one data type is treated as decisive.
- **Model overfitting** to limited or biased data.
- **Coverage bias** causing false absence or misestimated boundaries.
- **Extrapolation beyond validated boundaries** (species, chain type, locus, cell state).
- **Clonality or sample mixing** confounding rearrangement or recurrence interpretation.

# Validity Checks

Before finalizing any plan or conclusion, verify:

- **Confounding**: Have all plausible junctional, somatic, editing, selection, technical, and paralog explanations been listed?
- **Evidence layer**: Is each claim supported by the correct biological layer (germline, transcript, comparative, etc.)?
- **Replication**: Is there independent confirmation before calling a rare variant, novel isotype, or atypical structure?
- **Coverage**: Is the relevant locus or feature interrogated with enough context for unambiguous assignment?
- **Annotation**: Are reference names, coordinates, and versions consistent and recorded?
- **Provenance**: Are sample origin, readout type, and database submission context documented?
- **Statistics**: Are frequency, enrichment, or association claims supported by the sampling design?
- **Model degeneracy**: Are alternative mechanisms that predict the same observation pattern explicitly listed?
- **Extrapolation**: Are conclusions limited to the tested locus, population, tissue, or readout?

# Provenance

- Derived from cluster 39, subcluster 39.1.split0.
- Synthesized from representative source skills:
  - `ig-j-allele-discovery-workflow` (a6bf7de8a3d88f94)
  - `comparative-igh-locus-research-design` (943338f5b1327f27)
  - `antibody-annotation-workflow` (b8b83c980f3f4553)
  - `fish-immunoglobulin-locus-discovery` (c9f92f5adf1606ae)
  - `v-j-rearrangement-mechanism-discovery` (ae44b00273baf399)
  - `immunoglobulin-locus-structural-exploration` (99d2d1f6c69718be)
  - `b-cell-lymphoma-antibody-discovery` (e03755093aa37281)
  - `immunogenetic-locus-mapping` (c19407e6bbb657eb)
- Paper-specific parameters, operational protocols, and unsupported conclusions have been excluded.
