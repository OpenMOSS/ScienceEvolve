---
name: sci-immune-protein-binding-interface-mechanism-discover-62e10153
description: A reusable end-to-end workflow for mapping and discriminating protein-protein interaction determinants using perturbation, structural, thermodynamic, and kinetic evidence with orthogonal controls.
scienceevolve-title: "Antibody and immune recognition · protein binding interface mechanism discovery workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Use this skill to turn a structural or functional model of a protein-protein interaction into a testable research program. The workflow guides hypothesis generation, minimal viable experimental design, staged analysis, and iterative model revision to map interaction determinants—such as binding hotspots, epitopes, or paratopes—while distinguishing direct contact contributions from conformational, dynamic, or assay artifacts.

# When to use

Trigger this skill when a user asks to:

- generate new research questions about protein binding interfaces or molecular recognition;
- design non-operational studies to localize and validate interaction determinants;
- discriminate between direct interface effects, indirect structural effects, and assay artifacts;
- plan iterative validation using perturbation hierarchies and orthogonal readouts;
- evaluate mechanism hypotheses using thermodynamic, kinetic, or structural evidence.

Do not use this skill for clinical decision-making, patient-specific advice, operational wet-lab protocols, or therapeutic development guidance.

# Inputs required

- **Target interaction**: the protein pair, complex, or molecular system under study.
- **Candidate regions**: domains, loops, surface patches, or motifs hypothesized to contribute.
- **Prior evidence**: sequence conservation, structural models, mutational data, competition results, or known probe information.
- **Perturbation concepts**: feasible probe classes, variant strategies, or truncation designs described conceptually.
- **Measurement modalities**: primary binding/function readouts and orthogonal integrity or presentation readouts.
- **Constraints**: biosafety, ethical, reproducibility, and sample-access boundaries.

# Core Workflow

1. **Frame the mechanistic gap**
   - State the unresolved binding or activation mechanism.
   - List competing models: localized interface, distributed interface, conformational, indirect steric, or mixed.

2. **Decompose and prioritize candidate elements**
   - Map structural units and label exposure, conservation, and flexibility.
   - Prioritize elements with convergent prior evidence; include predicted neutral controls.

3. **Generate ranked hypotheses**
   - For each candidate model, specify the hypothesis statement, evidence strength (weak/moderate/strong), key assumptions, predicted observations, and likely failure modes.
   - Include at least one negative-control hypothesis to guard against confirmation bias.

4. **Design minimal viable validation**
   - Select the smallest perturbation set that can discriminate the leading hypotheses.
   - Define a hierarchy: coarse localization → surface-element mapping → fine-grained physicochemical test.
   - Specify controls: reference, negative, positive (if available), specificity, structural integrity, and assay artifact controls.

5. **Gate A: Integrity and specificity check**
   - Confirm scaffold integrity and assay specificity before interpreting functional effects.
   - **Decision**: If integrity fails or specificity is absent, stop and redesign the perturbation or assay.

6. **Measure proximal interaction**
   - Quantify binding, recognition, or inhibition under matched conditions.
   - Separate association, dissociation, and equilibrium components when kinetics are relevant.

7. **Measure downstream or orthogonal function**
   - Assess functional consequence or an orthogonal readout independently.
   - Detect tradeoffs or decoupling between binding and function.

8. **Analyze and classify outcomes**
   - Classify each perturbation as direct-interface, indirect-structure, neutral, or ambiguous.
   - Require convergent evidence from at least two independent assay classes before mechanistic claims.
   - Distinguish observed result, inference, speculation, and boundary.

9. **Gate B: Mechanistic consistency check**
   - Compare proximal and downstream readouts.
   - **Decision**: If discordant, audit controls and confounders; if unresolved, classify as ambiguous and redesign.

10. **Test additivity and context**
    - Combine validated perturbations to test independence, saturation, or cooperativity.
    - Test transfer to related contexts only after the principle is supported in the initial system.

11. **Update model and iterate**
    - Revise evidence strength, assumptions, and failure modes based on results.
    - Select the next discriminator experiment that most strongly resolves remaining ambiguity.

12. **Gate C: Stop or finalize**
    - **Stop** if controls fail, effects are irreproducible, or confounders dominate.
    - **Finalize** when convergent evidence supports a bounded mechanistic claim and boundary conditions are documented.

# Output Format

When using this skill, produce:

1. **Research question framing**: concise gap statement and scope.
2. **Hypothesis table**: hypothesis, evidence strength, key assumptions, predicted result, and likely failure mode.
3. **Experimental design**: perturbation hierarchy, controls, variables, evaluation metrics, and stop conditions.
4. **Analysis plan**: classification rules for direct/indirect/ambiguous, convergent evidence requirements, and uncertainty handling.
5. **Iteration plan**: model update rules and next discriminator experiment.
6. **Boundary and validity summary**: claim limits, reproducibility checks, and non-clinical scope.

# Validation Gates

- **Gate A (Integrity/Specificity)**: Scaffold integrity and assay specificity must be confirmed before mechanistic interpretation.
- **Gate B (Mechanistic Consistency)**: Proximal binding and downstream/orthogonal readouts must align or be reconciled with a plausible model.
- **Gate C (Convergence)**: At least two conceptually distinct assay classes or evidence types must support the claim before promotion from candidate to supported determinant.
- **Gate D (Context)**: Claims must be bounded to the tested construct, state, probe, and assay context before any generalization.

# Claim Boundaries

- Distinguish observed results from inferences, speculations, and field-wide generalizations.
- Limit claims to the tested protein pair, construct, post-translational state, and assay conditions.
- Do not present a single study as consensus for an entire protein family or biological class.
- Mark all new-system hypotheses as provisional until independently validated.
- Keep outputs at the research-design level; do not provide clinical recommendations, dosing guidance, or operational protocols.

# Failure Modes

- Probe or perturbation lacks specificity in simplified or native contexts.
- Native-state recognition cannot be separated from background or nonspecific binding.
- Primary signal loss coincides with scaffold failure, misfolding, or instability.
- Apparent binding improvement is dominated by non-specific binding or aggregation.
- Proximal and downstream readouts conflict without a reconciling mechanism.
- Large effects appear in only one assay format or are irreproducible across preparations.
- Assay saturation, mass-transport limits, or detection artifacts obscure true differences.
- Context transfer fails due to scaffold, species, or state mismatches.

# Validity Checks

- **Confounding**: Could isoform composition, post-translational modification, preparation history, or associated partners explain the result?
- **Specificity**: Is the signal reduced by an appropriate specificity control and absent in negative controls?
- **Reproducibility**: Are independent preparations, probes, or readouts consistent?
- **Statistical validity**: Are endpoints predefined, replication adequate, and analysis unbiased?
- **Alternative explanations**: Have epitope masking, conformational mismatch, nonspecific binding, aggregation, degradation, and assay artifacts been considered?
- **Boundary validity**: Are conclusions limited to the tested system and not generalized without evidence?
- **Orthogonality**: Do independent readouts converge on the same mechanistic conclusion?
- **Non-operational scope**: Does the plan avoid executable high-risk parameters, hazardous protocols, or clinical advice?

# Provenance

- Synthesized from cluster 52 / subcluster 52.1.split0.
- Derived from source skills: conserved-domain-probe-research (d089057ceeec2d52), receptor-interface-perturbation-workflow (1ef84d97a6310bd9), contact-activation-binding-site-workflow (f2ec3e6b17f37756), protein-interface-energy-discovery (aece37200b449cbb), conditional-fcrn-binding-research (3fcea9a13e81a102), viral-antigen-epitope-mapping-workflow (9e87d5aa5c57dc87), electrostatic-antibody-affinity-research (79692d3fe59175d4), antibody-fc-complement-exploration (6afaa12ba7adbc05).
- Represents a semantic merge of the shared workflow route for symmetry-guided mechanism discovery and validation; no single paper conclusion is endorsed as universal.
