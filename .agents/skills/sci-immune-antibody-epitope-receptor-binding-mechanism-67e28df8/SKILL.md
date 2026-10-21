---
name: sci-immune-antibody-epitope-receptor-binding-mechanism-67e28df8
description: End-to-end workflow to derive residue-level binding mechanisms for antibody-antigen, immune receptor-ligand, and related protein-protein recognition systems by integrating structural, thermodynamic, sequence, and computational evidence with iterative hypothesis testing.
scienceevolve-title: "Antibody and immune recognition · antibody epitope receptor binding mechanism workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Help an agent propose, test, and refine residue-level binding mechanisms in antibody-antigen, immune receptor-ligand, and related protein-protein recognition systems. The workflow migrates the paradigm of “structure defines the interface, thermodynamics explains driving forces, and sequence/computation decomposes mechanism” into a reusable, hypothesis-driven route that explicitly distinguishes verified evidence from inference.

# When to use

- When exploring a new binding system where structural, thermodynamic, sequence, or computational data exist but the recognition mechanism is unresolved.
- When comparing conserved structural scaffolds that exhibit divergent binding functions (e.g., Fc receptors, antibody isotypes, immune receptor chains).
- When investigating conformational selection, induced fit, electrostatic recognition, hydrophobic stabilization, coevolution networks, or allosteric effects at an interface.
- When designing minimal validation to distinguish competing hypotheses about epitope/paratope mapping, cross-reactivity, competition, or state-specific binding.
- **Do not use** for clinical diagnosis, treatment recommendations, executable wet-lab protocols, or as a substitute for institutional biosafety/ethics review.

# Inputs required

- **Target system**: identities of binding partners, known domains, conformational states, complex partners, and functional context.
- **Existing evidence**: structural models (experimental or predicted), thermodynamic parameters, sequence alignments, mutation data, competition or binding assays, and/or simulation outputs.
- **Candidate mechanisms**: e.g., conformational selection, induced fit, electrostatic/hydrophobic complementarity, coevolutionary networks, allostery, germline-encoded vs. somatically matured features.
- **Operational constraints**: ethical/compliance boundaries, material availability, detection capabilities, budget, time window, and acceptable failure criteria.
- **Output goal**: research questions, ranked hypotheses, minimal validation design, analysis plan, iteration strategy, or project proposal.

# Core Workflow

1. **Mechanistic Gap Definition**
   - Reframe the problem from descriptive (“does X bind Y?”) to mechanistic (“which interface features dominate recognition?”, “how do dynamics contribute?”, “how does sequence variation map to specificity?”).
   - Identify the functional paradox: why does a conserved scaffold produce divergent binding, or why does a flexible epitope achieve stable recognition?
   - **Gate**: If the question is purely descriptive or cannot be linked to a structural/thermodynamic/dynamic explanation, stop and refine the question.

2. **Evidence Triangulation & Audit**
   - Catalog available evidence by type: structure (free vs. bound states, interface contacts), thermodynamics (affinity, enthalpy/entropy decomposition), sequence (germline, somatic variation, covariation), and computation (dynamics, energy decomposition, conformational sampling).
   - Label each item as **verified** (direct experimental/structural data) or **inferred** (model prediction, cross-system analogy).
   - Flag missing evidence and downgrade claim strength where gaps exist.
   - **Gate**: If fewer than two independent evidence types are available, flag the route as high-risk inference and restrict claims to exploratory hypotheses.

3. **Competing Hypothesis Generation**
   - Generate 2–5 mechanistic hypotheses that explain the gap.
   - For each hypothesis specify: mechanistic statement, evidence strength (low/medium/high), key assumptions, falsifiable predictions, and primary failure modes.
   - Prioritize hypotheses that can be tested by at least two independent evidence types.
   - **Gate**: If a hypothesis lacks a falsifiable prediction or a defined failure mode, reformulate it before proceeding.

4. **Minimal Viable Validation Design**
   - Design the smallest non-operational study capable of distinguishing the leading hypothesis from its closest competitor.
   - Define variables:
     - **Independent**: binding partner variant, conformational state, key residue status, or presentation context.
     - **Dependent**: binding signal, thermodynamic component, interface contact metric, conformational change, or competition outcome.
     - **Confounding**: sample source, preparation background, presentation format, batch, tag, or glycosylation state.
   - Define controls:
     - **Positive**: known binder/functional system.
     - **Negative**: non-target, disrupted interface, or irrelevant partner.
     - **Strong**: close homolog with divergent function, or same scaffold with altered candidate interface feature.
     - **Method/Process**: platform-specific checks for non-specific signal, background, and reproducibility.
   - Define **stop conditions**: control failure, signal-to-background collapse, unexplained sample heterogeneity, inter-platform inconsistency, or ethical boundary reached.
   - **Gate**: If controls are insufficient to rule out non-specific binding, presentation artifacts, or batch effects, redesign before execution.

5. **Multi-Layer Analysis & Integration**
   - **Structural layer**: Align free and bound states; annotate interface residues, backbone displacement, contact networks, hydrogen bonds/salt bridges, and solvent accessibility changes; flag low-confidence loops, missing coordinates, and crystal contacts.
   - **Thermodynamic layer**: Decompose binding free energy into enthalpic and entropic contributions; check consistency with structural contacts (e.g., strong enthalpy often indicates specific contacts; entropy penalty may indicate conformational constraint or desolvation cost).
   - **Sequence/coevolution layer**: Map sequence variation and covariation to structural positions; distinguish “position network conservation” from “specific amino-acid identity conservation”; check alignment quality, phylogenetic bias, and sub-group representation.
   - **Computational layer**: Assess trajectory stability, sampling adequacy, initial-structure dependence, and energy-decomposition sensitivity; report trends and candidate residues, not absolute quantitative measurements.
   - **Integration**: Build an evidence matrix per hypothesis, marking each evidence type as support, contradict, or uncertain.
   - **Gate**: If independent evidence types conflict, do not force a merged explanation. Proceed to conflict-resolution iteration.

6. **Convergence Assessment & Iteration**
   - Evaluate against the pre-defined rubric:
     - **Supported**: ≥2 independent evidence types agree; key controls pass.
     - **Partially supported**: Only one evidence type supports, or important alternative explanations remain.
     - **Not supported**: Key prediction fails and failure is not attributable to method defects.
     - **Undecidable**: Data quality or controls insufficient.
   - **Iteration rules**:
     - If structural evidence is strong but thermodynamic weak → check sample state, binding model, solvent/proton coupling, and readout noise.
     - If thermodynamic evidence is strong but structural weak → consider multiple binding modes, flexible epitopes, or low-occupancy states.
     - If computation conflicts with experiment → check model building, protonation states, force-field assumptions, and sampling scope before altering the mechanism.
     - If mutation/perturbation results reject the hypothesis → distinguish “mechanism is wrong” from “perturbation disrupted global fold/stability.”
   - Update evidence strength, key assumptions, and failure modes after each round.
   - **Gate**: If the iteration plan has not been updated with new boundaries, loop back to hypothesis generation.

7. **Conditional Synthesis & Boundary Setting**
   - State conclusions conditionally: “Under [conditions], the evidence supports [mechanism] with [confidence].”
   - Explicitly separate verified evidence from agent-inferred extrapolations.
   - List extrapolation boundaries: applicable species, scaffold types, conformational states, and in-vitro vs. in-vivo contexts.
   - Remove any clinical, therapeutic, or operational claims.
   - **Gate**: If clinical/therapeutic claims or executable protocols remain, redact them before final output.

# Output Format

Produce the following sections on each invocation:

1. **Research question**: One sentence defining the mechanistic gap and its origin (user input, verified evidence, or agent inference).
2. **Evidence map**: Verified evidence, missing evidence, and source-specific information that cannot be mechanically transferred.
3. **Hypotheses table**: For each hypothesis—mechanism, evidence strength, key assumptions, falsifiable predictions, and failure modes.
4. **Experimental design**: Minimal viable validation, variables, controls (positive/negative/strong/method), evaluation metrics, and stop conditions.
5. **Analysis plan**: Structure, thermodynamics, sequence/coevolution, computation, and integration steps.
6. **Iteration plan**: Update rules for supported, partially supported, unsupported, conflicting, and undecidable outcomes.
7. **Validity and safety notes**: Confounders, reproducibility risks, extrapolation boundaries, and ethics/safety constraints.

# Validation Gates

- **Gap clarity gate**: The question must be mechanistic (explaining *how* or *why*), not merely descriptive.
- **Evidence triangulation gate**: At least two independent evidence types are required for strong mechanistic claims.
- **Falsifiability gate**: Every hypothesis must have a defined prediction and a clear failure mode.
- **Control adequacy gate**: Controls must be able to distinguish specific binding/recognition from artifact, non-specific signal, and presentation effects.
- **Convergence gate**: Mechanistic claims require cross-evidence consistency; unresolved conflicts trigger redesign, not forced merger.
- **Boundary gate**: Clinical/therapeutic extrapolations and executable operational details are excluded before output.

# Claim Boundaries

- **Verified claims**: Supported by direct experimental or structural data provided by the user or robust literature.
- **Inferred claims**: Cross-system migration, model predictions, or unmeasured residues; must be labeled with evidence strength (low/medium/high) and key uncertainties.
- **Prohibited claims**: Do not assert clinical efficacy, therapeutic dosing, in-vivo outcomes from in-vitro binding, or universal rules derived from single-system studies.
- **Extrapolation limits**: Single-species, single-variant, or single-structure conclusions do not automatically generalize to protein families, disease states, or patient populations.

# Failure Modes

- **Systematic artifact**: Non-specific binding, tag interference, presentation/fixation effects, crystal packing, surface density artifacts, or batch variation.
- **Model inadequacy**: Homology model errors, force-field bias, insufficient sampling, protonation-state errors, alignment mis-mapping, or low-confidence loops.
- **Confounding variation**: Glycosylation, aggregation, degradation, conformational heterogeneity, oligomeric-state differences, or sample-source bias.
- **Interpretation overreach**: Correlation treated as causation; single evidence type treated as sufficient; structural similarity treated as functional equivalence; covariation treated as direct contact.
- **Control failure**: Positive or negative controls fail, breaking the validity chain and requiring suspension of mechanism interpretation.

# Validity Checks

- **Confounders**: Audit for sample-source bias, preparation heterogeneity, presentation-format effects, database-coverage bias, phylogenetic clustering, and batch effects.
- **Reproducibility**: Require independent replication for key signals; record data versions, model parameters, analysis code, and random seeds; retain negative results and failed controls.
- **Statistical validity**: Apply multiple-testing correction where appropriate; report effect sizes, confidence intervals, and sample limitations; distinguish pre-registered from exploratory analyses.
- **Structural validity**: Flag low-confidence regions, missing coordinates, model uncertainty, and environmental perturbations (e.g., crystal contacts); do not over-interpret interfaces from single structures or fixed states.
- **Mechanistic validity**: Distinguish spatial proximity/covariation from direct causation; distinguish in-vitro binding affinity from cellular or organismal outcome; distinguish germline-encoded potential from somatically matured specificity.

# Provenance

- Derived from cluster **38** / subcluster **38.0.split0** via semantic merge of representative source skills:
  - `antibody-epitope-binding-exploration` (d6e9c695fbeb3cd4)
  - `autoantibody-structural-exploration` (d15a058c2ee74ce1)
  - `immune-receptor-structure-exploration` (1f0c48126c053951)
  - `fcrn-igg-structure-function-exploration` (8ff6545f415880b1)
  - `antibody-covariation-network-research` (eba7cf86cf5c0725)
  - `antibody-light-chain-structure-workflow` (aca36431228bb8e4)
  - `vhh-conformational-binder-research` (8fdc8875fc872c34)
  - `antibody-paratope-idiotype-exploration` (348f8e20bed921e8)
- Excluded skill: e2fa4bf640cbe4b1.
