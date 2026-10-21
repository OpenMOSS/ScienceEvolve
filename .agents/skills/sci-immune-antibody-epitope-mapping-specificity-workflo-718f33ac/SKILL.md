---
name: sci-immune-antibody-epitope-mapping-specificity-workflo-718f33ac
description: A reusable end-to-end workflow for experimental localization and validation of antibody binding sites, distinguishing linear, conformational, neo-, and discontinuous epitopes across assay formats with specificity controls.
scienceevolve-title: "Antibody and immune recognition · antibody epitope mapping specificity workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Use this skill to guide mechanistic mapping and specificity validation of antibody-antigen recognition sites. It converts binding signals into ranked epitope hypotheses, designs orthogonal validation plans, and iteratively updates mechanistic claims while bounding conclusions by assay context and evidence strength.

# When to use

Trigger this skill when the user asks to:

- Map or propose antibody-binding sites on a protein or antigen family.
- Interpret peptide-display, random-peptide, phage-display, or mimotope-selection results.
- Design a non-clinical epitope-mapping study for a new antibody, antigen, or protein complex.
- Distinguish linear, conformational, discontinuous, neo-, or cryptic epitope mechanisms.
- Plan validation experiments that separate true epitope signals from library bias, nonspecific binding, assay artifacts, or preparation-state effects.

Do not use this skill for clinical recommendations, diagnostic interpretation, therapeutic decision-making, or operational wet-lab protocol generation.

# Inputs required

Before producing a research plan, request or identify:

- **Target antigen**: sequence, known domains, available structures or models, glycosylation or modification status, and biological context.
- **Antibody or binder**: source, format, known function, neutralization or blocking activity if available, and intended research use.
- **Existing binding evidence**: assays already performed, positive and negative binders, cross-reactivity, and denaturation sensitivity.
- **Library or display system** (if applicable): display format, peptide length or constraint type, diversity, selection history, and known sequence biases.
- **Structural information**: experimentally solved structures, homologous templates, predicted models, surface-accessibility estimates, and flexible-loop annotations.
- **Validation resources**: antigen fragments, peptides, mutants, structural models, binding assays, and orthogonal readouts.
- **Safety, ethics, and compliance constraints**: biosafety level, biological-material permissions, human-sample approvals, data-use limits, and whether any application is clinical or deployment-oriented.

# Core Workflow

1. **Scope and Mechanistic Framing**  
   Define the antigen, binder, and binding question as a mechanistic mapping problem. Before interpreting any data, separate hypotheses for continuous linear, conformational, discontinuous, neo-, and cryptic epitopes.  
   - *Decision gate*: Abort if the question lacks testable mechanistic alternatives or if safety and ethics constraints are unresolved.

2. **Evidence Inventory and Hypothesis Generation**  
   Catalog existing binding, sequence, structural, and functional evidence. Generate at least two competing mechanistic hypotheses (e.g., linear motif, discontinuous interface, accessibility-dependent recognition, preparation-state artifact). For each, annotate evidence strength, key assumptions, predicted observations, and failure modes.  
   - *Decision gate*: Do not proceed to experiments if only one hypothesis is plausible; redesign to create falsifiable alternatives.

3. **Minimal Viable Validation Design**  
   Design the smallest experiment that can distinguish the leading hypotheses. Define independent variables (antigen construct, binder, perturbation), dependent variables (binding signal, specificity), and context variables (folding state, assay format). Specify positive, negative, specificity, preparation, and assay-interference controls.  
   - *Decision gate*: Redesign if controls are inadequate or if no hypothesis can be falsified by the proposed experiment.

4. **Specificity Establishment**  
   Establish that the binder specifically recognizes the target antigen in the chosen format. Compare cognate binding against unrelated antigens, non-binding conditions, and negative controls.  
   - *Stop condition*: Halt and redesign if specific binding cannot be distinguished from nonspecific signal or assay artifact.

5. **Candidate Localization and Perturbation**  
   Map candidate regions using sequence-spanning probes, fragment libraries, enrichment patterns, or structural hypotheses. Apply perturbations (fragmentation, mutation, denaturation, competition) to test whether binding depends on sequence continuity, conformation, or multimeric assembly.  
   - *Decision gate*: Discard candidates that fail independent binding tests or depend solely on single-peptide or single-library artifacts without orthogonal support.

6. **Orthogonal Confirmation and Mechanistic Discrimination**  
   Validate surviving candidates with at least one independent assay format or readout. Discriminate linear from conformational or discontinuous epitopes by comparing native, denatured, and fragmented antigen presentations. Integrate structural, dynamic, and functional evidence.  
   - *Decision gate*: Do not advance to residue-level or structural claims unless converging orthogonal evidence is present.

7. **Evidence Grading and Model Update**  
   Classify each claim as observed, inferred, or speculative. Update the epitope model using decision rules: keep, narrow, split, merge, discard, or reframe. If results are ambiguous, iterate to the next most informative test.  
   - *Stop condition*: Stop when enrichment is dominated by library or selection artifacts, candidate motifs fail orthogonal tests, structural models disagree irreconcilably, or binding is inconsistent across independent replicates.

8. **Claim Bounding and Documentation**  
   Bound conclusions to the tested antigen preparation, binder, assay format, and biological context. Document uncertainty, untested assumptions, and external-validity limits.  
   - *Decision gate*: Escalate to broader biological or translational claims only after independent replication and appropriate governance review.

# Output Format

When using this skill, produce:

1. `Scope and target definition`: antigen, binder, research objective, and safety boundary.
2. `Evidence inventory and gap analysis`: available binding, sequence, library, fragment, mutant, and structural data; what is known, unknown, and potentially confounded.
3. `Hypothesis table`: for each candidate, list observation, gap, hypothesis, evidence strength, key assumptions, failure modes, and minimal validation.
4. `Experimental design`: study type, variables, controls, evaluation metrics, and stop conditions.
5. `Analysis plan`: quality control, motif or region discovery, background correction, sequence and structural mapping, and evidence grading.
6. `Iteration plan`: keep, narrow, split, merge, discard, or reframe rules for each candidate, with triggers for the next cycle.
7. `Validity and ethics notes`: confounders, reproducibility requirements, safety boundaries, and external-validity limits.

# Validation Gates

- **Specificity gate**: Binding signal must exceed negative and unrelated controls under the same assay conditions.
- **Orthogonality gate**: Mechanistic claims require confirmation across independent assay formats, readouts, or perturbation types.
- **Mechanistic gate**: Classification as linear, conformational, or discontinuous must survive comparative perturbation tests (e.g., native vs. denatured, intact vs. fragmented).
- **Reproducibility gate**: Signals must be consistent across independent preparations, replicates, or selection rounds.
- **Safety and ethics gate**: Research scope must remain non-clinical; clinical or high-risk biological work requires independent expert oversight and institutional approval.

# Claim Boundaries

- Do not infer a definitive epitope from a single enriched peptide, a single motif match, or a single computational model.
- Do not treat binding evidence as proof of neutralization, biological function, or clinical utility.
- Distinguish peptide, fragment, or model-system results from full-length native target behavior.
- Limit conclusions to the tested antigen preparation, folding state, binder, and assay geometry.
- Label paper-derived or single-study observations as system-specific evidence unless independently replicated.

# Failure Modes

- **Library or selection bias**: artifactual enrichment driven by display-system codon bias, amplification duplicates, or host-sequence contamination.
- **Nonspecific binding or assay interference**: signal from off-target adsorption, detection reagent background, or matrix effects.
- **Preparation-state artifacts**: altered apparent reactivity due to immobilization, denaturation, tag interference, or degradation.
- **Structural model uncertainty**: incorrect residue or region assignment caused by template mismatch, flexible-loop error, or prediction bias.
- **Overinterpretation of single-channel evidence**: advancing claims based on one assay, one replicate, or one structural snapshot.
- **Antigen heterogeneity**: confounding by isoforms, modifications, oligomeric states, or conformational dynamics not captured by the assay.

# Validity Checks

Before finalizing a research plan, check:

- **Library bias**: Are motifs enriched relative to input or nonselected library rather than merely frequent in the display system?
- **Selection stringency**: Could low-stringency or over-amplified rounds create false positives?
- **Clone independence**: Are repeated sequences independent clones or amplification duplicates?
- **Nonspecific binding**: Are negative controls, unrelated antigens, and unrelated binders included?
- **Antigen integrity**: Are folding state, tags, modifications, degradation, and expression system compatible with the binding question?
- **Assay compatibility**: Could denaturation, immobilization, or detection reagents alter binding?
- **Structural uncertainty**: Do conclusions survive alternative templates, predicted models, or flexible-region uncertainty?
- **Mimotope ambiguity**: Is the candidate a true epitope segment, a conformational mimic, or only a binder-specific motif?
- **Statistical validity**: Are enrichment, motif recurrence, and assay differences compared against appropriate baselines and replicates?
- **Reproducibility**: Are selection history, sequencing provenance, filters, controls, and analysis choices documented?
- **External validity**: Are conclusions limited to the tested antigen, antibody, assay, and model without overgeneralizing to the whole protein family or clinical use?

# Provenance

- Synthesized from cluster **70** / subcluster **70.1.split0**.
- Derived from source skills: `antibody-epitope-discovery-workflow` (99ebeb94671c308c), `fibrin-epitope-exploration` (06e44a9b36ada3e2), `stx2-neutralizing-antibody-exploration` (1df38ddba65b41d4), `site-resolved-binding-workflow` (e33f804f7f702b1f), `difficult-target-epitope-discovery` (e50afa642f3b951d), `antibody-epitope-structural-discovery` (f584d8fb7d3eca05), `autoimmune-dsbr-epitope-research` (62e5a4cfea5bc961), `linear-binder-epitope-mapping-research` (1a6412e0cebd3e32).
