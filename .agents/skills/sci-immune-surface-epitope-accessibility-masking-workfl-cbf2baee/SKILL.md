---
name: sci-immune-surface-epitope-accessibility-masking-workfl-cbf2baee
description: Reusable end-to-end workflow for discovering and validating whether state-dependent molecular changes expose or mask surface epitopes, and how altered accessibility drives recognition or functional outcomes at host-pathogen or other biomolecular interfaces.
scienceevolve-title: "Antibody and immune recognition · surface epitope accessibility masking workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Guide agents to transform a biological state change into a reusable research workflow for discovering whether altered shielding, accessibility, or conformation of a surface biomolecule exposes or masks epitopes or other recognition features, and whether such changes drive specific recognition or functional outcomes. This skill abstracts the pattern: **state change → accessibility alteration → recognition → functional interpretation**. It does not encode any specific biological system, pathogen, or paper conclusion.

# When to use

Use this skill when a user asks to:

- Generate research questions about state-dependent epitope exposure, glycan masking, mucin-like surface changes, or host-pathogen interface recognition.
- Design studies to test whether a molecular modification reveals or hides a normally inaccessible feature.
- Build analysis and iteration plans linking molecular state, surface accessibility, recognition, and disease-relevant or functional outcomes.
- Evaluate whether a proposed accessibility mechanism is supported by specificity, state dependence, and functional linkage.

Do not use this skill for clinical advice, patient management, diagnostic interpretation, or executable high-risk wet-laboratory procedures.

# Inputs required

Before designing a study, identify or request:

1. **Biological context**: disease, tissue, cell type, organism, or model system and the state contrast of interest.
2. **Candidate surface molecule**: glycoprotein, mucin-like protein, receptor, viral envelope protein, extracellular matrix component, or other surface-presented biomolecule.
3. **Candidate state change**: altered glycosylation, proteolysis, conformational remodeling, aggregation, truncation, or other modification linked to the state contrast.
4. **Candidate exposed or masked feature**: peptide motif, carbohydrate-sensitive epitope, conformational determinant, binding interface, or cryptic domain.
5. **Recognition component**: antibody, receptor, lectin, complement factor, enzyme, inhibitor, or other binding partner.
6. **Available evidence**: prior binding data, structural data, omics data, assay constraints, sample availability, and known controls.
7. **Intended inference level**: association, mechanism, causality, biomarker discovery, or therapeutic hypothesis generation.

If critical inputs are missing, state assumptions explicitly and prioritize a minimal validation design that can test them.

# Core Workflow

Follow this ordered route. Treat each numbered step as a stage with defined decision gates.

## 1. Frame the state-dependent recognition gap

- Identify the measurable recognition phenotype that differs across the biological state contrast.
- Define the domain gap: the phenotype is observable, but whether it arises from epitope exposure, masking, conformational change, or artifact is unresolved.
- State the biological state axis (e.g., quiescent vs. proliferating, native vs. modified, infected vs. uninfected).

## 2. Generate competing mechanistic hypotheses

Produce at least three hypotheses using this structure:

- **Exposure hypothesis**: the state change reveals a feature that is normally shielded or conformationally constrained.
- **Masking hypothesis**: the state change adds or elongates a shield (glycan, proteinaceous layer, membrane organization) that hides an otherwise accessible site.
- **Dominance/redundancy hypothesis**: recognition is driven by a different, co-varying feature; the candidate is not required.
- **Artifact hypothesis**: the phenotype reflects cell viability, aggregation, nonspecific probe binding, preparation effects, or downstream toxicity rather than surface accessibility.
- **Context-dependence hypothesis**: host or environmental organization modulates accessibility independently of the candidate feature.

For each hypothesis, record: mechanistic claim, key assumptions, predicted observations, evidence strength (exploratory / plausible / supported / causal), likely failure modes, and boundary conditions.

## 3. Design minimal viable validation

- Define state-positive and state-negative comparison groups before measuring outcomes.
- Include matched phenotype controls, baseline controls, and target-absent or feature-absent comparators.
- Predeclare primary metrics, expected direction of effect, and failure criteria.
- Ensure the design can answer three questions independently:
  1. Is the target feature present and accessible in the recognition-competent system?
  2. Does recognition differ specifically between states?
  3. Can the candidate feature explain the difference rather than a correlated confounder?

**Decision Gate A — Control sufficiency:** If the design cannot separate biological state effects from surface-specific effects, or lacks matched negative controls, redesign before proceeding.

## 4. Plan orthogonal evidence streams

Select at least two independent conceptual readouts from the following classes:

- **Recognition readout**: binding, agglutination, neutralization, or adhesion phenotype.
- **Accessibility readout**: competition, masking reversal, soluble inhibition, or fraction binding activity (described non-operationally).
- **State-verification readout**: confirmation that the suspected molecular modification or conformational state actually occurs.
- **Functional linkage readout**: early-step functional outcome (attachment, entry, signaling) separable from downstream replication or viability effects.

## 5. Execute conceptual validation

- Compare recognition across states with background correction and predefined positivity logic.
- Test specificity with matched negative perturbations, unrelated motifs, irrelevant probes, and scrambled competitors.
- Test state-dependence by comparing native, modified, and restored or masked states where feasible.
- Separate early interaction effects from downstream toxicity, growth inhibition, or general viability loss using stage-resolved or time-resolved logic.
- Verify that perturbations engage the intended surface feature class rather than causing global system collapse.

**Decision Gate B — Assay integrity:** If negative controls reproduce the targeted effect, if background exceeds signal, or if state assignment is confounded by the readout, halt mechanistic interpretation and resolve assay quality or confounders.

## 6. Reconstruct the evidence chain

Map results onto a causal chain:

1. **Modification evidence**: does the biomolecule show the proposed state change in the target context?
2. **Exposure evidence**: does the state change increase or decrease accessibility of the candidate feature?
3. **Recognition evidence**: does the recognition component bind or respond differentially across states?
4. **Specificity evidence**: is recognition reduced by relevant-feature masking or competition and not by unrelated controls?
5. **Context evidence**: is the recognition phenotype enriched in the target state compared with matched controls?
6. **Functional evidence**: is recognition linked to a plausible biologically relevant outcome?

Report effect sizes and uncertainty, not only significance. Separate predefined primary comparisons from exploratory analyses.

## 7. Score evidence strength and update confidence

Use an evidence-strength ladder:

- **Low**: candidate is associated with the system; perturbation changes a broad phenotype.
- **Moderate**: targeted perturbation shows an interpretable, state-dependent functional difference with appropriate negative controls.
- **Strong**: localization, binding, or accessibility evidence shows interface contact.
- **Stronger**: competition or masking links the phenotype to the candidate feature specifically.
- **Mechanistic**: stage-resolved analysis separates early accessibility effects from downstream outcomes.
- **Robust**: orthogonal perturbation and context-state variation clarify necessity, redundancy, and boundary conditions.

**Decision Gate C — Weakest-link check:** Identify the weakest link in the evidence chain. If it is below the threshold required for the intended inference level (association, mechanism, or causality), downgrade the claim and specify the missing evidence.

## 8. Iterate, broaden, or stop

Apply these iteration rules:

- **If recognition is state-specific but feature evidence is weak**: prioritize orthogonal structural or accessibility characterization before claiming a specific motif.
- **If specificity is absent**: retain the association but weaken the exposure mechanism; improve specificity controls.
- **If state dependence is absent**: reconsider the exposure model, biological state definition, or recognition component.
- **If functional linkage is absent**: treat the finding as a recognition phenomenon only; design functional follow-up.
- **If orthogonal evidence converges**: broaden to related variants or contexts, explicitly stating boundary conditions.
- **If evidence conflicts**: deprioritize the current mechanism and generate alternatives based on cell-state, probe-specificity, or preparation artifacts.

**Stop conditions** — End the workflow branch if:

- Target engagement or state change is not reproducible.
- Negative controls reproduce the targeted effect.
- The phenotype is explained by nonspecific toxicity, viability loss, or assay artifact.
- Candidate deficiency cannot be verified or causes broad nonspecific system failure.
- Context-state comparisons are too confounded to interpret.
- Safety, ethics, or compliance boundaries are exceeded.

# Output Format

Respond with structured sections:

```markdown
## Research question
- Target context and state contrast:
- Candidate surface molecule:
- Candidate state change:
- Candidate exposed/masked feature:
- Recognition component:

## Hypotheses
1. **Hypothesis A (e.g., Exposure)**
   - Mechanistic claim:
   - Evidence strength:
   - Key assumptions:
   - Predicted observations:
   - Likely failure modes:
   - Boundary conditions:

## Minimal viable validation plan
- State comparisons and groups:
- Specificity controls:
- State-dependence controls:
- Primary metrics:
- Secondary metrics:
- Failure criteria and stop conditions:

## Analysis plan
- Evidence-chain mapping:
- Primary comparison:
- Confounder checks:
- Reproducibility checks:
- Statistical/analytical checks:

## Iteration plan
- Current weakest link:
- Next discriminator experiment:
- Alternative hypotheses:
- Decision rule (continue / refine / stop):

## Validity and ethics notes
- Boundary conditions:
- Non-clinical/safety limits:
- What remains unverified:
```

# Validation Gates

- **Control Adequacy Gate**: Negative, positive, unrelated, and state-matched controls must be sufficient for the claimed inference. Do not proceed if controls are missing or fail.
- **Specificity Gate**: Recognition must be distinguishable from nonspecific binding, scaffold effects, carrier effects, and general disease-associated changes.
- **State-Independence Gate**: The biological state contrast must be measurable independently of the recognition readout.
- **Orthogonal Convergence Gate**: At least two independent evidence streams must agree before increasing confidence beyond "moderate."
- **Reproducibility Gate**: Independent samples, replicate measurements, and consistent decision thresholds must support the claim before causal interpretation.
- **Functional Separation Gate**: Early accessibility or recognition effects must be separable from downstream toxicity, replication, or viability artifacts.

# Claim Boundaries

- **Association**: The state change and recognition phenotype co-occur. Claim only correlation with appropriate uncertainty.
- **Mechanism**: The state change alters accessibility of a specific feature, which drives recognition. Requires specificity controls and state-dependence evidence.
- **Causality**: Perturbation of the candidate feature predictably changes recognition and functional outcome in a stage-specific manner. Requires orthogonal perturbation, necessity/redundancy evidence, and replication.
- Do not present single-study or single-system findings as field consensus.
- Do not claim clinical protective or therapeutic relevance from binding-only or in vitro accessibility data.
- Label cross-species, cross-variant, or cross-system analogies as hypotheses requiring independent validation.

# Failure Modes

- **Nonspecific recognition**: Binding arises from aggregation, dead-cell adhesion, matrix carryover, or probe cross-reactivity rather than the candidate feature.
- **Cell-state confounding**: Apparent accessibility differences are driven by viability, density, metabolic state, or preparation history.
- **Masking misattribution**: A recognition change is attributed to epitope masking when the true cause is motif truncation, probe steric hindrance, or unrelated surface reorganization.
- **Downstream toxicity misclassified as early inhibition**: Reduced pathogenic or functional signal is caused by general viability loss rather than blockade of an early recognition step.
- **Single-assay artifact**: A result depends on one probe, one batch, or one platform and fails upon replication.
- **Overgeneralization**: A mechanism validated in one cell type, strain, or state is assumed universal without boundary testing.

# Validity Checks

Before finalizing a research plan or interpretation, verify:

- **Confounding**: Could general severity, inflammation, sample handling, abundance differences, or nonspecific binding explain the signal?
- **Control adequacy**: Are negative, positive, unrelated, and state controls sufficient?
- **Boundary conditions**: Does the hypothesis apply only to a subtype, stage, tissue, molecular state, or recognition component?
- **Reproducibility**: Are independent samples, replicate measurements, orthogonal assays, and transparent exclusions included?
- **Statistical validity**: Are effect sizes, uncertainty, multiple comparisons, distributional assumptions, and subgroup claims handled appropriately?
- **Mechanistic caution**: Are association, mechanism, and causality clearly separated?
- **Transferability**: Are source-paper-derived patterns abstracted rather than mechanically copied into the new system?

# Provenance

Derived from cluster **31.1a** (surface-epitope accessibility and masking mechanism workflow) and synthesized from representative source skills: `97ea8a8a42ba324c`, `df0b8d546b90409b`, `088581bf30e26dde`, `56c9edd605a1f817`, `dd4914911c3ba20b`. Source-specific systems, numerical results, and paper conclusions have been removed; only the shared workflow route and validation logic are preserved.
