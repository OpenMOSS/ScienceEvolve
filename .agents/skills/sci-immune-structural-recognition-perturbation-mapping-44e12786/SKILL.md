---
name: sci-immune-structural-recognition-perturbation-mapping-44e12786
description: A reusable end-to-end workflow for discovering molecular recognition mechanisms through site-directed perturbation, truncation, domain swap, and combinatorial reconstitution with orthogonal binding or signaling readouts.
scienceevolve-title: "Antibody and immune recognition · structural recognition perturbation mapping workflow"
scienceevolve-area: antibody-and-immune-recognition
---

## Purpose

Help an agent design research questions and validation plans to discover how specific structural features mediate molecular recognition, binding, or downstream function. The workflow abstracts a transferable pattern of structured perturbation and orthogonal readout triangulation, applicable to proteins, peptides, receptors, antibodies, and macromolecular assemblies without relying on any single source system as a universal model.

## When to use

Use this skill when the user asks to:

- Propose new hypotheses about which structural features are necessary or sufficient for a recognition event.
- Design non-clinical validation studies using site-directed perturbation, truncation, domain swap, or combinatorial reconstitution.
- Distinguish local-contact, conformational-scaffold, whole-object necessity, and assay-artifact explanations.
- Iterate between binding, structural, and functional evidence to refine or reject mechanistic claims.

Do not use for clinical diagnosis, treatment selection, patient-specific recommendations, or executable wet-lab protocols.

## Inputs required

- **Target and context:** molecular object, binding partner or functional system, and available structural or sequence information.
- **Native reference:** the unperturbed interaction state and baseline readout behavior.
- **Perturbation candidates:** substitution, truncation, domain swap, flexibility change, or combinatorial variant classes under consideration.
- **Readout modalities:** available binding, structural, signaling, or functional assays.
- **Constraints:** biosafety scope, sample availability, model-system limitations, and ethical boundaries.
- **Prior evidence:** existing binding data, mutagenesis results, known confounders, and failed approaches.

## Core Workflow

1. **Frame the mechanistic gap.**  
   Define the observed phenotype or functional effect and the unresolved structural basis of recognition. State what existing models cannot explain.

2. **Generate competing hypotheses.**  
   Produce at least three mechanistic families (e.g., local-contact, conformational-scaffold, whole-object necessity, assay-artifact). For each, annotate evidence strength, key assumptions, predicted perturbation signatures, and failure modes.  
   - *Decision gate:* If hypotheses are not falsifiable with available readouts, stop and redefine the question.

3. **Assemble a minimal viable perturbation series.**  
   Include: native reference; predicted high-impact local perturbation; predicted low-impact local perturbation; geometry/disruption perturbation; truncation or motif isolate. Pre-register success, ambiguity, and failure criteria.  
   - *Decision gate:* If variant quality, stability, or assay window is inadequate, stop and redesign.

4. **Run a layered validation chain.**  
   a. **Specificity screen** — compare against domain-free, unrelated-domain, or non-target controls.  
   b. **Orthogonal binding confirmation** — confirm with a second assay principle or orientation.  
   c. **Native-context association** — test in biologically relevant material with background controls.  
   d. **Perturbation-to-phenotype test** — confirm the molecular change occurred before interpreting phenotype.  
   e. **Causal strengthening** — add rescue, orthogonal perturbation, or independent model when feasible.  
   - *Decision gate after each layer:* If controls fail or the signal is non-specific, halt mechanistic interpretation and redesign the affected layer.

5. **Analyze as an evidence chain.**  
   Evaluate sequentially: binding specificity → context relevance → perturbation confirmation → phenotype direction → dose-response concordance → specificity against controls → boundary conditions. Classify each hypothesis as supported, weakened, unresolved, or redirected.  
   - *Decision gate:* If evidence streams conflict, keep competing models active and do not upgrade confidence.

6. **Iterate or stop.**  
   - *If supported:* escalate to higher-resolution perturbation, broader context, or necessity/sufficiency testing.  
   - *If weakened:* pivot to the next-ranked alternative hypothesis.  
   - *If unresolved:* add the smallest discriminating control or orthogonal readout.  
   - *If artifact-suspect:* repair assay validity or variant quality before further claims.  
   - *Stop conditions:* failed specificity controls; unconfirmed perturbation; nonreproducible phenotype; evidence that a confounder explains the result; or additional experiments cannot distinguish remaining hypotheses.

7. **Map claim boundaries.**  
   Explicitly state what was directly measured, what remains inferred, and the system/context limits of the conclusion.

## Output Format

1. **Research question and gap statement** — concise mechanistic gap.
2. **Hypothesis table** — claim, evidence strength, key assumption, predicted signature, failure mode.
3. **Minimal validation plan** — perturbation series, controls, readouts, and pre-registered stopping conditions.
4. **Layered analysis plan** — evidence-chain evaluation, decision rules, and artifact checks.
5. **Iteration roadmap** — result categories, next discriminating experiment, and evidence-update rules.
6. **Boundary statement** — scope, measured versus inferred, and untested assumptions.

## Validation Gates

- Variant quality and assay-window adequacy before mechanistic interpretation.
- Control performance: negative, positive, specificity, and preparation/context controls.
- Reproducibility across independent preparations, batches, or runs.
- Concordance between orthogonal readouts before upgrading confidence.
- Independent confirmation of perturbation before phenotype attribution.

## Claim Boundaries

- Distinguish binding from function, association from directness, and perturbation from causality.
- Label conformational or structural claims as inferred unless supported by direct biophysical evidence.
- Limit generalization to the tested molecule class, conditions, and readout modalities.
- Separate reusable methodological logic from new-system inferences.

## Failure Modes

- Assay artifact from labeling, background, normalization, or preparation bias.
- Nonspecific perturbation causing broad destabilization, aggregation, or off-target effects.
- Confounding by expression level, trafficking, viability, or cell-state drift.
- Over-interpretation of a single evidence layer.
- False convergence due to shared hidden bias across non-independent assays.

## Validity Checks

- **Confounding:** Could stability, solubility, degradation, aggregation, or nonspecific binding explain the result?
- **Specificity:** Do controls bracket the expected response?
- **Reproducibility:** Are independent preparations and assay formats included?
- **Statistical validity:** Are endpoints predefined, effect sizes estimated, and exploratory and confirmatory evidence separated?
- **Mechanistic ambiguity:** Can competing hypotheses still fit the observed pattern?
- **Boundary conditions:** Are claims limited to the tested species, construct, modification state, and assay context?

## Provenance

Derived from cluster 14 / subcluster 14.1.split0 via semantic merge of representative source skills: f0c47cdc10a43308, 4a47878a82c46866, f7cb43cdb22eae2c, 31b2bacdb8ad337f, 2e3e60a2454be06a, 47cd869dd7a33073, 73c6fe95a095dc10, b869cb582aaea8fd. Source-specific systems, parameters, numerical results, and paper conclusions have been removed.
