---
name: sci-immune-comparative-perturbation-mechanism-discovery-2f00a662
description: Use when an observed functional effect or recognition pattern requires mechanistic explanation, and the goal is to localize the effect to specific molecular determinants through comparative hypothesis generation, controlled perturbation, and orthogonal validation.
scienceevolve-title: "Antibody and immune recognition · comparative perturbation mechanism discovery workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Localize an observed functional effect, binding pattern, or recognition specificity to specific molecular determinants and discriminate among competing mechanistic explanations (for example, direct interface, conformational coupling, allosteric, trafficking, or artifact) by leveraging comparative evidence, systematic perturbation, and orthogonal validation. This skill produces reusable research plans, not operational protocols.

# When to use

Use this skill when:

- An observed functional effect or recognition pattern lacks a resolved molecular mechanism.
- Comparative sequence, structural, or natural-variation data can generate candidate determinants.
- The goal is to design a non-operational validation strategy with explicit controls, decision gates, and iteration rules.
- The target system could be a protein complex, receptor, enzyme, multimeric assembly, or other molecular recognition system.

Do not use this skill for clinical decision-making, patient-specific recommendations, executable wet-lab protocols, or high-risk operational procedures.

# Inputs required

Before starting the workflow, identify or request:

- The observed functional effect, binding phenotype, or recognition pattern to be explained.
- Comparative data sources (homologs, variants, conservation patterns, structural models, or natural variation).
- The candidate molecular system and accessible perturbation targets (domains, motifs, residues, or interfaces).
- Available conceptual readout types (binding, activity, localization, competition, kinetics, structural integrity).
- Constraints: ethics, biosafety, resource limits, and construct feasibility.

If inputs are missing, state assumptions explicitly and separate them from evidence.

# Core Workflow

Follow this ordered route. At each step, apply the decision gate before proceeding.

1. **Frame the mechanistic gap**  
   Define the observed effect and articulate why existing evidence is insufficient to explain it.  
   - *Decision gate:* Proceed only if the effect is reproducible and distinguishable from background. If not, stop and refine the observation.

2. **Generate candidate determinants via comparative analysis**  
   Prioritize candidate residues, motifs, domains, or regions using homology, evolutionary conservation, natural variation, structural features, or phenotypic differences across related systems.  
   - *Decision gate:* Continue only if at least one testable candidate set emerges. If not, expand the comparative scope or stop.

3. **Formulate competing, falsifiable mechanistic hypotheses**  
   For each candidate set, state explicit mechanistic links (e.g., direct contact, conformational coupling, allosteric, trafficking, accessibility), predictions, key assumptions, and failure modes.  
   - *Decision gate:* Redesign readouts if the hypotheses cannot be discriminated with available tools.

4. **Design a minimal perturbation matrix**  
   Plan single-site, limited combination, and reciprocal-conversion variants. Include wild-type, negative, positive, folding/specificity, and process controls.  
   - *Stop condition:* Halt if perturbations are infeasible, unsafe, or likely to cause global structural disruption.

5. **Assess structural integrity and specificity before functional interpretation**  
   Verify folding, stability, expression, and localization using readouts independent of the primary functional assay.  
   - *Decision gate:* Interpret functional changes only for variants that pass integrity checks; redesign others.

6. **Collect orthogonal readouts**  
   Gather at least two independent evidence types (e.g., binding plus activity, localization plus competition, kinetics plus protection).  
   - *Decision gate:* Stop and troubleshoot if readouts are not independent or if controls fail.

7. **Discriminate mechanisms by converging evidence**  
   Integrate results to support, weaken, or reject each hypothesis; exclude indirect and artifactual explanations.  
   - *Iteration:* If evidence does not converge, return to step 3 or 4 to refine hypotheses or add variants.

8. **Iterate from broad to narrow localization**  
   Progress from domain-level to motif-level to residue-level or interface-level determinants as evidence accumulates.  
   - *Stop condition:* Stop narrowing when added resolution yields no new discriminating power or when technical limits are reached.

9. **Bound claims and define transferability limits**  
   State whether a determinant is necessary, sufficient, or consistent with the effect under the tested conditions. Specify contexts where the mechanism may not apply and define the next decision gate.  
   - *Stop condition:* End the workflow when claims are bounded and the scope of the next study is defined.

# Output Format

When using this skill, return:

1. **Research question framing** — Concise statement of the mechanistic gap.
2. **Assumptions and evidence inputs** — Known evidence and explicit assumptions.
3. **Candidate hypotheses table** — For each hypothesis: mechanistic link, evidence strength, key assumptions, predictions, and likely failure modes.
4. **Minimal perturbation and validation plan** — Variables, control architecture, primary and secondary metrics, failure criteria, and stop conditions.
5. **Analysis and integration plan** — How results will be normalized, classified, and combined across orthogonal readouts.
6. **Iteration path and next decision gates** — Conditions for narrowing, expanding, or stopping the investigation.
7. **Validity and safety check summary** — Confounders, reproducibility needs, boundary conditions, and ethics/biosafety constraints.
8. **Evidence map** — Separate “directly supported by proposed validation” from “inferred from analogy/model” and “not established.”

# Validation Gates

- Structural integrity is confirmed by an independent readout separate from the functional assay.
- Specificity is demonstrated against unrelated targets, scaffolds, carriers, and negative variants.
- Orthogonal convergence: agreement across at least two independent readout types.
- Reciprocal consistency: bidirectional perturbations support the same determinant set.
- Reproducibility across independent preparations, batches, or biological contexts.

# Claim Boundaries

- **Can support:** Candidate determinant X is necessary, sufficient, or consistent with observed effect Y under the tested conditions Z.
- **Cannot support:** Universal mechanism, clinical relevance, exhaustive epitope or interface mapping, or downstream physiological function without dedicated validation.
- **Must distinguish:** Binding localization from energetic contribution from causal mechanism.

# Failure Modes

- Perturbation disrupts global folding, stability, expression, or localization rather than the intended local function.
- Single-readout dominance without orthogonal support.
- Assay artifacts such as nonspecific binding, mass transport, epitope masking, carrier effects, or avidity bias.
- Overextrapolation from one homolog, species, construct, or assay context.
- Confounding by abundance, trafficking, compartmentalization, or preparation differences.

# Validity Checks

Before presenting conclusions, verify:

- **Confounding:** Expression, folding, localization, tags, aggregation, or background signals could explain the result.
- **Control validity:** Positive controls work, negative controls remain low, and perturbation controls affect only the intended feature.
- **Reproducibility:** Independent repeats or orthogonal readouts support the main direction.
- **Statistical validity:** Effect direction, variability, sample limitations, and uncertainty are reported; do not overstate single-experiment results.
- **Boundary conditions:** Identify where the mechanism may not apply, such as different conformations, systems, species, or disease contexts.
- **Evidence separation:** Distinguish what was directly shown from what is inferred by analogy or model.
- **Reciprocal consistency:** Bidirectional perturbations point to the same determinant set.
- **Specificity:** The signal is absent in appropriate negative or unrelated systems.

# Provenance

Derived from cluster 52, subcluster 52.0. Synthesized from source skills: antibody-epitope-research-workflow (4db1b9da5b01808d), immune-receptor-trafficking-research (7590b1e6fcec2c7b), antibody-subunit-variation-exploration (3af140315be68203), biotin-domain-inhibition-research-skill (362521540c5cc363), malaria-surface-epitope-discovery (23a3e0beecf6a889), antibody-framework-kinetics-research (f52012aa0774aaa1), conserved-autoantigen-repertoire-exploration (01f852f1dc524296), conformational-interface-mapping-research (7d3f361e8661c143).
