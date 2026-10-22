---
name: sci-immune-antibody-ligand-interface-epitope-mechanism-585fe0bc
description: A reusable end-to-end workflow for generating, validating, and iterating hypotheses about antibody–ligand recognition determinants from structural, sequence, and perturbation evidence.
scienceevolve-title: "Antibody and immune recognition · antibody ligand interface epitope mechanism discovery"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Design transferable research workflows to discover and validate molecular determinants of antibody–ligand recognition. The goal is to help an agent move from an unresolved interface question to testable epitope and paratope hypotheses, validate them through convergent multi-modal evidence, and iterate toward a bounded mechanistic model without overclaiming.

# When to use

Use this skill when the user asks to:

- Map antibody binding regions, epitopes, or paratopes for protein, peptide, viral, or small-molecule ligands.
- Interpret mutational, structural, sequence, or docking evidence to infer interface residues.
- Design non-operational validation studies with controls, baselines, and iteration rules.
- Distinguish direct binding contacts from indirect conformational effects, assay artifacts, or nonspecific signals.
- Plan convergent binding-functional validation or specificity-boundary analysis for molecular recognition studies.

Do not use for clinical recommendations, operational wet-lab protocols, pathogen-handling instructions, or as a substitute for independent field consensus.

# Inputs required

Before generating a plan, identify or request:

- **Antibody/binder identity**: class, variable-region sequence, numbering scheme, and CDR or paratope annotations if available.
- **Ligand/antigen identity**: molecule type (protein, peptide, viral protein, small molecule), sequence, domain architecture, and known homologs.
- **Evidence inventory**: structural models, homology models, mutational/perturbation data, binding assays, competition data, cross-reactivity observations, and prior epitope reports.
- **Intended claim level**: computational candidate, empirically recognized region, orthogonal support, robustness, or causal attribution.
- **Constraints**: biosafety category, ethics and privacy rules for human-derived data, data governance, and institutional approval status.

If key inputs are missing, return a minimum information request before proposing detailed experiments.

# Core Workflow

1. **Frame the recognition question and boundary conditions**
   - Define the specific antibody–ligand system and the unresolved determinant (e.g., epitope location, paratope residue, specificity gate).
   - State the intended claim level and antigen class boundaries.
   - Distinguish direct interface contact from indirect structural or assay effects.

2. **Generate candidate determinants from independent evidence streams**
   - **Stream A – Structural**: proximity, solvent accessibility, and contact geometry from complex or docking models.
   - **Stream B – Sequence**: conservation, surface features, CDR/paratope annotations, and variable-region motifs.
   - **Stream C – Perturbation**: mutational, deletion, or competition effects on binding or function.
   - **Stream D – Specificity**: cross-reactivity patterns across ligand analogues, variants, or homologs.
   - *Decision gate:* Candidates supported by only one stream are flagged as exploratory. Prioritize candidates with convergent support from ≥2 streams.

3. **Prioritize candidates and assign mechanistic classes**
   - Classify each candidate as: direct interface contact, indirect conformational effect, peripheral/weak contact, or inconclusive/artifact.
   - Assign evidence strength (low / medium / high) and document key assumptions (folding state, model quality, numbering correctness).
   - *Stop condition:* If no candidate reaches medium strength, return to Step 2 with revised evidence streams or broader search windows before proceeding.

4. **Design minimal convergent validation**
   - Define independent variables: candidate region, perturbation type, presentation format, and comparator set.
   - Define dependent variables: binding signal, competition effect, structural integrity, and functional readout.
   - Specify controls: positive, negative, irrelevant, integrity, and specificity controls.
   - Predefine evaluation criteria and stop conditions (e.g., integrity controls must pass before interpreting binding loss as direct contact).
   - *Decision gate:* If structural integrity cannot be assessed or appropriate controls are unavailable, stop and redesign.

5. **Execute validation and integrate evidence**
   - Compare perturbation-based predictions with orthogonal structural or functional readouts.
   - Require agreement between binding change and structural plausibility before labeling a residue as direct contact.
   - Treat discordant cases as prompts to investigate indirect mechanisms or assay artifacts rather than as contradictions.
   - *Decision gate:*
     - **Convergent support** → promote to high-confidence determinant.
     - **Discordant** → classify failure mode (global destabilization, conformational shift, assay interference) and downgrade.
     - **No signal** → consider tolerance, non-essential contact, or false negative.

6. **Test specificity and robustness**
   - Compare intended ligand against analogues, homologs, or irrelevant targets to infer necessary and sufficient features.
   - Assess whether recognition persists under alternative presentation formats or target perturbations.
   - *Stop condition:* If specificity is dominated by nonspecific matrix effects, or if irrelevant controls match candidate signals, deprioritize the candidate and revisit Step 2.

7. **Iterate or terminate the model**
   - **Iterate** if: partial support suggests context-dependence (conformational, glycan-dependent, flanking-context); controls are ambiguous; or the model generates new discriminating predictions.
   - **Terminate** if: controls fail repeatedly; performance collapses on non-redundant external targets; improvements depend on unrealistic constraints (e.g., oracle native-contact inputs); or assay sensitivity cannot distinguish direct from indirect effects.
   - After each round, update the hypothesis set, evidence strengths, and boundary conditions.

# Output Format

When using this skill, produce:

1. **Research question** – Concise, bounded molecular-recognition question with claim level.
2. **Candidate hypotheses** – Table of candidate regions/mechanisms with evidence strength, key assumptions, and likely failure modes.
3. **Validation plan** – Variables, controls, baselines, metrics, and predefined stop conditions.
4. **Evidence integration summary** – Convergence classification for each candidate (promoted, downgraded, inconclusive).
5. **Iteration decision tree** – Rules for promote, redesign, or stop based on validation outcomes.
6. **Boundary statement** – Explicit limits on generalizability (antigen class, binder class, assay context, construct boundaries).

# Validation Gates

- **Convergence gate:** High-confidence assignments require agreement between at least two independent evidence streams (e.g., structural proximity plus perturbation effect, or binding signal plus specificity pattern).
- **Control gate:** Positive and negative controls must behave as expected. If controls fail, pause interpretation and redesign.
- **Integrity gate:** Structural or functional integrity of modified targets must be confirmed before attributing binding loss to direct interface disruption.
- **Specificity gate:** Candidates must outperform irrelevant analogues, scrambled regions, and matrix controls.
- **Redundancy gate:** Computational validation must use held-out splits that avoid close sequence or structural similarity to training data.

# Claim Boundaries

- Distinguish contact prediction from energetic importance from docking pose quality; treat each as a separate claim.
- Limit causal attribution to cases where integrity controls, orthogonal assays, and reproducibility converge.
- Do not generalize from one antibody, strain, construct, or assay format to universal rules without explicit boundary justification.
- Separate computational candidates from empirically validated recognition and from clinical or therapeutic implications.
- Label conformational, glycan-dependent, or context-dependent epitopes as distinct from linear motif claims.

# Failure Modes

- **Overfitting:** Models trained on redundant or small datasets may recover known complexes but fail on non-redundant targets.
- **Confounding:** Global destabilization, misfolding, aggregation, expression failure, or assay interference mimics interface disruption.
- **Nonspecificity:** Peptide stickiness, matrix effects, electrostatic attraction, or irrelevant control reactivity produces false-positive binding signals.
- **Annotation errors:** Incorrect chain assignment, residue numbering, or CDR definitions mislocate candidate regions.
- **Epitope misclassification:** Conformational or discontinuous epitopes misclassified as linear; missed contributions from flanking context or post-translational modifications.
- **Collapse under realism:** Performance gains disappear when native-contact oracles, high-resolution crystals, or unrealistic constraints are removed.

# Validity Checks

- **Dataset boundaries:** Verify that test structures or sequences are held out from training data by appropriate similarity thresholds.
- **Annotation consistency:** Confirm comparable numbering, CDR definitions, and chain labels across methods.
- **Baseline fairness:** Ensure comparators receive equivalent information, constraints, and search spaces.
- **Threshold discipline:** Select score cutoffs on validation data only; test on held-out data.
- **Stochasticity:** Report variance across repeated runs for non-deterministic docking or sampling methods.
- **Reproducibility:** Require consistent direction of effect across replicates and, where possible, across orthogonal readouts.
- **Evidence separation:** Clearly label paper-verified observations versus agent-generated inferences.
- **Statistical validity:** Predefine endpoints, account for multiple comparisons, and report uncertainty intervals.

# Provenance

- Synthesized from cluster 16, subcluster 16.0.split0.
- Derived from source skills: antibody-paratope-docking-workflow, viral-antibody-epitope-discovery, viral-epitope-exploration-workflow, antibody-epitope-mapping-workflow, allergen-epitope-exploration-workflow, antibody-idiotypic-determinant-discovery, antibody-polyamine-binding-discovery, constrained-peptide-affinity-ligand-design.
- Excluded skill IDs: 00a6b4308fb01ef2, 0ff61738d1b6cdc3, 209b15eb978bfa5c, 67bfd3d221954816, 734bc32a2686e6f6, f0ed4b1392a21469, f1668e53af616851, f9601fe0d25db28c.
