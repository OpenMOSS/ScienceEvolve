---
name: sci-immune-molecular-structure-function-mechanism-workf-a27d5859
description: A reusable end-to-end workflow for discovering and validating how molecular determinants govern structure-function relationships in macromolecules, separating recognition from functional output and testing context dependence through controlled perturbation and iterative model updating.
scienceevolve-title: "Antibody and immune recognition · molecular structure function mechanism workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

This skill helps an agent design reusable research strategies to discover which molecular determinants—such as regions, domains, residues, modifications, or conformational states—causally govern recognition, activity, stability, or functional output in macromolecules. It abstracts a transferable pattern of isolating determinants, triangulating binding versus function, and testing context dependence across enzymes, cytokines, receptors, antibodies, and engineered scaffolds.

# When to use

Use this skill when the task involves one or more of the following:

- Investigating how a specific sequence region, domain, or structural feature contributes to binding, catalysis, signaling, stability, or assembly.
- Observing a decoupling between recognition and functional output (e.g., strong binding but weak activity, or vice versa).
- Exploring whether a determinant is permissive, constrained, necessary, sufficient, modulatory, or context-dependent.
- Designing controlled perturbation experiments (swaps, deletions, substitutions, rigidification, stabilization, or isolation) to test mechanistic hypotheses.
- Iterating mechanistic models after preliminary results are ambiguous, negative, or discordant across readouts.

Do not use this skill as a substitute for domain-specific wet-laboratory protocols, clinical decision-making, or operational procedures. Do not treat single-system findings as field-wide consensus.

# Inputs required

Before generating a research plan, obtain or infer:

- **Target system**: molecule class, architecture, known functional states, and cellular or molecular context.
- **Determinant candidates**: regions, domains, loops, interfaces, residues, or modifications to test.
- **Functional mismatch or residual behavior**: the observed or suspected decoupling between recognition and output, or behavior that remains unexplained after accounting for known contributors.
- **Available readouts**: binding or recognition, functional or activity, structural or conformational, dynamic, stability, and specificity proxies.
- **Perturbation space**: feasible conceptual modifications such as swap, delete, mutate, rigidify, stabilize, or isolate.
- **Context panel**: related targets, variants, conditions, compartments, or larger constructs for boundary testing.
- **Constraints**: biosafety level, ethics requirements, reproducibility standards, and acceptable non-operational design boundaries.

# Core Workflow

Follow this ordered route from question framing through iteration or termination. Each step includes decision gates that must be passed before proceeding.

## 1. Frame the mechanistic uncertainty

- Define the recognition–function mismatch, residual behavior, or scaffold-performance bottleneck.
- Separate what the known contributor explains from what remains unexplained.
- Define the minimal claim to test: necessity, sufficiency, modulation, independence, or context-dependence.

## 2. Generate competing hypotheses

- For each candidate determinant, generate at least three competing hypotheses (e.g., local contribution, propagated conformational change, composite state, measurement artifact).
- Annotate every hypothesis with: evidence strength (low / moderate / high), key assumptions, predicted discriminator outcome, and likely failure mode.
- Prioritize falsifiable hypotheses that can be distinguished by matched contrasts rather than single observations.

## 3. Design minimal viable validation

- Select the smallest perturbation set that can distinguish the top two hypotheses.
- Define conceptual variables: system, state, perturbation class, and readout category.
- Establish controls: positive, negative, specificity or orthogonal, availability or parental, and context controls.
- Predefine stop conditions: assay artifact, global instability, uninterpretable perturbation, or inability to generate a testable prediction.

## 4. Execute conceptual comparison (Decision Gate 1)

- Compare matched configurations (e.g., intact vs. modified, isolated domain vs. full context, swapped vs. parental, stabilized vs. non-stabilized).
- Validate data quality: confirm that controls separate, availability is stable, and readouts are reliable.
- **Gate**: If controls fail or availability cannot be confirmed, stop and redesign the measurement model before interpreting results.

## 5. Attribute causality and separate mechanisms (Decision Gate 2)

- Classify the determinant role: necessary, sufficient, modulatory, independent, or ambiguous.
- Separate affinity from productive geometry, local mechanism from global stability, and marker from mechanism.
- Evaluate proxy validity: determine whether the measured state represents the functional state.
- **Gate**: If recognition and function diverge without a plausible discriminating mechanism, reassess hypotheses and proxy validity before claiming causality.

## 6. Test context dependence (Decision Gate 3)

- Probe related targets, variants, conditions, or larger constructs to assess generalizability.
- Compare isolated vs. intact behavior, or related vs. original context.
- **Gate**: If results disagree across contexts, refine the model to include context-dependent contacts or coupled determinants. Do not generalize beyond the tested context.

## 7. Update mechanistic model and evidence ledger (Decision Gate 4)

- Re-rank hypotheses by evidence strength based on the new results.
- Update the working model: local contribution, propagated change, composite state, or artifact.
- Document boundary conditions: target, determinant, scaffold, cell context, and readout limits.
- **Gate**: If the effect disappears under stronger controls or orthogonal readouts, stop or pivot rather than expanding the claim.

## 8. Iterate or terminate

- **If supported**: test generalization with an independent design or scaffold before combining interventions.
- **If partially supported**: identify the failed evidence stream and design the smallest follow-up that resolves it.
- **If refuted**: remove the dominant explanation and search for alternative mechanisms.
- **If ambiguous**: label the determinant as ambiguous and design the single most informative discriminator experiment.
- **Stop conditions**: controls fail, specificity remains unresolved, the assay cannot distinguish the proposed mechanism, the perturbation causes broad nonspecific loss of function, or the conclusion would exceed the current evidence class.

# Output Format

When using this skill, produce the following structure:

1. **Research question**
   - Functional mismatch or residual behavior.
   - System scope and determinant under test.
   - Why the question matters scientifically.

2. **Hypothesis portfolio**
   - Competing hypotheses with evidence strength, key assumptions, predicted outcomes, and failure modes.

3. **Minimal viable validation plan**
   - Perturbation classes and matched comparisons.
   - Control structure (positive, negative, specificity, availability, context).
   - Primary and secondary readouts.
   - Predefined stop conditions.

4. **Analysis plan**
   - Matched comparison logic.
   - Confounder checks and proxy-validity assessment.
   - Mechanism classification rules (necessary, sufficient, modulatory, independent, ambiguous).
   - Evidence matrix linking hypotheses, predictions, controls, and outcomes.

5. **Iteration plan**
   - Update rules for supported, partially supported, refuted, and ambiguous results.
   - Next discriminator experiment.
   - Pivot or stop criteria.

6. **Validity and safety notes**
   - Main confounders.
   - Reproducibility checks.
   - Boundary conditions and extrapolation limits.
   - Ethics, biosafety, and compliance constraints.

# Validation Gates

- **Control separation gate**: Positive and negative controls must separate before interpreting any perturbation result.
- **Availability gate**: Construct or system presence, folding, and interpretability must be confirmed.
- **Orthogonal gate**: Primary mechanistic claims require at least one independent readout or assay class.
- **Context gate**: Generalization claims require evidence from more than one target, variant, condition, or construct context.
- **Mechanism gate**: Causal attribution requires that perturbation, proposed structural feature, and functional output shift together in matched contrasts.

# Claim Boundaries

- Distinguish localization evidence from direct binding or direct causality evidence.
- Distinguish observed result, inferred mechanism, and speculative extrapolation.
- Limit claims to the tested target, determinant, scaffold, and context unless cross-system evidence independently supports broader generalization.
- Do not present single-system or single-paper findings as field consensus.
- Label agent-proposed inferences separately from paper-supported transferable patterns.

# Failure Modes

- **Assay artifact dominates**: readout reflects probe bias, buffer effects, or nonspecific signal rather than the biological mechanism.
- **Global instability confounds**: perturbation disrupts folding, expression, or stability rather than the intended determinant.
- **Coupled modules**: multiple determinants vary together, preventing causal attribution to a single feature.
- **Proxy-state mismatch**: the measured ligand, marker, or assay state does not represent the functional state.
- **Context transfer failure**: isolated-domain or single-context results do not predict behavior in the native or larger system.
- **Selection or expression bias**: enrichment or recovery reflects display efficiency, refolding, or purification rather than intrinsic mechanism.
- **Overextrapolation**: conclusions exceed the tested molecular context, evidence class, or validated system.

# Validity Checks

Before finalizing a proposal or conclusion, check:

- Are the target, determinant, and context clearly separated?
- Does the design distinguish recognition from function, and marker from mechanism?
- Are negative, positive, specificity, orthogonal, and availability controls included?
- Are success, failure, and stop criteria explicit and predefined?
- Are hypotheses labeled by evidence strength and annotated with key assumptions and failure modes?
- Are statistical and reproducibility requirements appropriate for the readout type?
- Are conclusions bounded to the tested system and context?
- Are paper-specific values, parameters, materials, and one-off conditions avoided in the reusable workflow?

# Provenance

- Derived from cluster 27 / subcluster 27.0.split0 (molecular-structure-function-mechanism-workflow).
- Synthesized from representative source skills: intrabody-stability-workflow, conformational-binding-function-exploration, protein-state-probe-research, tcr-recognition-functional-perturbation, antibody-binding-component-swap-discovery, structure-guided-antibody-solubility-engineering, protein-conformational-domain-localization, ig-like-domain-stability-exploration.
- Paper-derived patterns are abstracted into transferable logic; specific systems, numerical results, and operational protocols have been removed.
