---
name: sci-immune-immune-repertoire-function-mechanism-workflo-ac060110
description: Reusable end-to-end research design for resolving immune-repertoire identity versus functional discordance through determinant mapping, mechanistic perturbation, and convergent evidence matrices across B-cell, T-cell, idiotype-network, and counter-recognition contexts.
scienceevolve-title: "Antibody and immune recognition · immune repertoire function mechanism workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Help an agent transform observations of immune-repertoire composition into reusable, non-clinical mechanism-discovery workflows. The skill targets cases where repertoire identity (clonality, lineage, variable-region usage, or idiotype pattern) and functional readout (effector activity, specificity, or regulatory behavior) are discordant or underexplored. It guides hypothesis generation, determinant-centered comparison design, evidence integration, and iterative model updating without treating any single study as field consensus.

# When to use

Use this skill when the user asks to:

- Design research plans to explain why a B-cell or T-cell repertoire signature does or does not match a functional phenotype.
- Explore idiotype-network, counter-recognition, or antigen-mimicry hypotheses in adaptive immunity.
- Generate mechanistic hypotheses about repertoire selection, compartment-specific recruitment, affinity maturation, or immune-memory network effects.
- Build validation strategies that link receptor sequence features to functional specificity through orthogonal evidence.
- Adapt a paper-derived repertoire-selection or immune-network logic to a related but non-identical biological question.

Do not use this skill for clinical diagnosis, patient-specific recommendations, treatment guidance, or executable wet-laboratory protocol generation.

# Inputs required

Before generating a plan, request or identify:

- **Biological context:** disease model, antigen system, immune compartment, and species or platform class.
- **Repertoire type:** B-cell, T-cell, or other adaptive immune receptor repertoire; lineage or clonal structure of interest.
- **Discordance or gap:** the specific mismatch between repertoire identity and functional readout, or the unresolved state to be tested.
- **Candidate determinants:** variable regions, idiotypic motifs, receptor chains, or network signatures hypothesized to control specificity.
- **Functional readout concept:** effector function, binding specificity, regulatory activity, or comparable measurable outcome.
- **Comparators:** target vs background compartments, unselected vs selected repertoires, healthy vs disease contexts, and independent boundary systems.
- **Constraints:** ethics, biosafety, sample availability, and measurement access.

If inputs are missing, state assumptions explicitly and label conclusions as provisional.

# Core Workflow

Follow this ordered route from question framing to iteration or stop.

## 1. Frame the repertoire–function discordance
Define the exact observation that needs explanation: e.g., similar infiltration but divergent function, shared clonotypes without shared specificity, or preserved global response with missing repertoire dominance. State the biological context and why the standard selection or recruitment model is insufficient.

## 2. Define compartments and comparators
Identify:
- **Target compartment:** where the suspected footprint should appear.
- **Background compartment:** systemic or adjacent source for baseline variation.
- **Functional selection context:** enriched or depleted subsets relevant to the suspected driver.
- **Boundary system:** an independent antigen, tissue, or model context to test generalization.

## 3. Map candidate determinants
Rank candidate recognition determinants or signatures from variable receptor regions, chain pairings, or network motifs. Separate clone-specific features from broadly shared or tolerance-prone features. Treat panel coverage or motif scope as a hypothesis, not a given.

## 4. Generate competing mechanistic hypotheses
Produce at least two falsifiable hypotheses that explain the discordance. For each, specify:
- predicted readout pattern across determinant states;
- key biological assumptions;
- evidence strength (low / moderate / high);
- minimal observation that would support or weaken it;
- strongest alternative explanation.

Reusable hypothesis classes include:
- **Antigen-driven selection:** determinant-specific enrichment drives function.
- **Compartment or recruitment effect:** local expansion or bystander infiltration explains repertoire differences without target specificity.
- **Context-dependent suppression:** latent function is masked by the in vivo environment.
- **Network or counter-recognition modulation:** idiotype or mimicry interactions alter repertoire state or responsiveness.
- **Precursor/memory-network dependence:** the phenotype requires a pre-existing cellular or network context not captured by antigen exposure alone.

## 5. Design determinant-centered perturbation and controls
Build a minimal viable comparison matrix:
- Determinant-present vs determinant-absent/altered.
- Target-related vs unrelated target or recognition signature.
- Pre-perturbation vs post-perturbation or rescue context.
- Matched positive, negative, specificity, and mechanism controls.

**Decision Gate 1 — Control validity:** If positive or negative controls fail, or if determinant state is inseparable from system context, stop mechanistic interpretation and redesign the comparison.

## 6. Collect paired repertoire and functional readouts
Measure identity and function under identical conditions:
- **Identity layer:** clonal structure, lineage recurrence, variable-family usage, mutation burden, or idiotype pattern.
- **Function layer:** effector readout, specificity profile, regulatory impact, or activation state.
- **Mechanism layer:** signaling competence, inhibitory markers, or presentation context when available.

## 7. Build the evidence matrix
Construct a matrix where rows are candidate mechanisms and columns are perturbation conditions and readout dimensions. Mark whether each observation supports, weakens, or is neutral toward each mechanism. Quantify specificity ratios and uncertainty.

## 8. Evaluate convergence and dissociation
- Look for **concordance:** abundant clones track function and determinant specificity.
- Look for **dissociation:** abundant clones do not track function, or function appears without matching repertoire expansion.
- Look for **rescue/selection:** perturbation reveals function through rare clones, network modulation, or context change rather than dominant in vivo expansion.

**Decision Gate 2 — Evidence convergence:** If multiple orthogonal readouts align on one mechanism and specificity controls are satisfied, proceed to boundary testing. If readouts conflict or remain ambiguous, flag the result as unresolved and proceed to iteration.

## 9. Boundary test and generalization
Repeat the comparison logic in at least one independent context (different antigen, tissue, or model). Distinguish system-specific observations from transferable patterns.

**Decision Gate 3 — Replicability:** If the pattern fails to replicate across boundary systems, qualify the conclusion as context-specific and do not generalize.

## 10. Update model and iterate
Based on the evidence matrix:
- **If supported but narrow:** add an orthogonal determinant or context test.
- **If ambiguous:** strengthen controls and reduce confounding.
- **If contradicted:** revise the determinant, mechanism, or system assumptions.
- **If non-informative:** redesign the measurement before drawing conclusions.

**Stop conditions:**
- The mechanism is supported by orthogonal perturbations, specificity controls, and boundary replication.
- The hypothesis is falsified by pre-specified failure criteria.
- Remaining alternatives are indistinguishable with available methods and the next minimal experiment is infeasible.

# Output Format

When using this skill, produce:

1. **Research question framing** — target discordance, compartments, candidate determinants, and assumptions.
2. **Hypothesis portfolio** — competing hypotheses with evidence strength, assumptions, predicted patterns, and failure modes.
3. **Minimal viable design** — comparison matrix, controls, variables, evaluation metrics, and stop conditions.
4. **Analysis plan** — evidence matrix structure, specificity checks, dissociation analysis, and uncertainty quantification.
5. **Iteration plan** — how each result pattern updates hypotheses and the next minimal experiment.
6. **Validity and boundary statement** — confounders, reproducibility requirements, statistical cautions, and applicable context limits.

# Validation Gates

- **Control integrity:** Positive and negative controls must pre-specify success/failure criteria before interpretation.
- **Specificity gate:** Functional or repertoire signals must track the candidate determinant across independent comparisons, not only in the primary condition.
- **Reproducibility gate:** Key patterns must be consistent across biological replicates and, when feasible, independent assays or cohorts.
- **Orthogonality gate:** Mechanistic claims require convergent evidence from at least two non-identical readout types (e.g., sequence feature + functional perturbation).
- **Boundary gate:** Generalization claims require replication in a non-identical context; absence of replication limits the claim to the tested system.

# Claim Boundaries

- Distinguish **repertoire association** from **mechanistic causation**; enrichment alone does not prove necessity or sufficiency.
- Separate **peptide-level or sequence-level inference** from **native target-cell recognition** and from **in vivo relevance**.
- Separate **perturbation-induced rescue** in an assay from **physiological mechanism**; ex vivo activation may select cells unrelated to in vivo function.
- Do not infer clinical efficacy, diagnostic utility, or treatment recommendations from mechanistic repertoire findings.
- Do not present single-study or model-specific observations as field-wide consensus.

# Failure Modes

- **Control failure:** Positive or negative controls produce unexpected signals, invalidating mechanistic interpretation.
- **Repertoire–function mismatch:** Identity and function remain discordant after initial testing, suggesting unmeasured variables or alternative mechanisms.
- **Nonspecific activation:** Negative controls or unrelated targets show target-like signals, indicating cross-reactivity or assay artifact.
- **Confounded determinants:** Candidate determinant state is inseparable from system context, batch, or treatment history.
- **Insufficient coverage:** Repertoire panel or determinant library misses relevant diversity, producing false negatives.
- **Context-specific artifact:** Perturbation or culture conditions select cells that do not represent the in vivo mechanism.
- **Indistinguishable alternatives:** Two or more mechanisms remain equally compatible with the evidence matrix.

# Validity Checks

- **Confounding:** Assess tissue site, sampling timing, cell viability, treatment history, donor heterogeneity, batch effects, and annotation version.
- **Specificity:** Verify that readouts depend on the candidate determinant and not on generic inflammation, nonspecific binding, or technical carryover.
- **Reproducibility:** Require independent biological samples and report negative, inconclusive, or batch-sensitive results.
- **Statistical validity:** Predefine primary endpoints; apply multiple-comparison correction for high-dimensional repertoire features; report effect sizes and uncertainty intervals.
- **Boundary conditions:** State the disease, compartment, assay class, and model context to which conclusions apply; do not extrapolate beyond tested boundaries without independent validation.

# Provenance

Synthesized from cluster 55, subcluster 55.0.split0. Derived from source skills: dc184af42660f3a2, 3a5c2c0ff80449b4, 090165d6b24428eb, 43f896e2bbdbc1dc, 1faaca64de5462ff, 736f40a8ae75c8ed, b893fbcbc3d5bac2, 9b35df920c598dce.
