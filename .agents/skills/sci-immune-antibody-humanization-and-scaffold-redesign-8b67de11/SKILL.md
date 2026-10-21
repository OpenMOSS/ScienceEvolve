---
name: sci-immune-antibody-humanization-and-scaffold-redesign-8b67de11
description: Reusable end-to-end workflow for reducing scaffold-related liability in antibodies and binding proteins while preserving function through residue classification, combinatorial encoding, and comparator-based validation.
scienceevolve-title: "Antibody and immune recognition · antibody humanization and scaffold redesign workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Guide agents through a reusable, evidence-aware workflow to redesign antibody or binding-protein scaffolds for reduced liability (e.g., xenogeneic, developability, or stability risk) while preserving target recognition and specificity. The workflow treats redesign as an iterative trade-off resolution process driven by comparator-based evidence, not as a single sequence-transfer rule.

# When to use

Use this skill when a user asks to:

- Humanize, resurface, graft, or otherwise redesign an antibody variable domain or binding-protein scaffold.
- Compare design strategies that trade sequence or surface compatibility against retained antigen binding.
- Build a controlled validation plan for candidate variants without requesting executable wet-lab protocols.
- Analyze why a candidate redesign preserved or lost function and decide what to test next.
- Translate a paper-derived antibody engineering logic into a reusable agent workflow.

Do not use this skill for clinical recommendations, dosing guidance, treatment selection, manufacturing protocols, or executable laboratory procedures.

# Inputs required

Before generating a plan, collect or infer the following:

- **Target molecule and redesign goal**: antibody, fragment, scaffold, or binding protein; desired change such as humanization, species adaptation, affinity retention, specificity retention, or developability improvement.
- **Available molecular data**: sequence, chain pairing, CDR/framework annotation, structural model, known binding interface, prior variants, or reference databases.
- **Functional context**: antigen or target class, intended biological interaction, known off-target risks, and relevant nonclinical use case.
- **Comparator availability**: parent molecule, benchmark designs, positive/negative controls, and intermediate states if available.
- **Constraints**: validation scope, regulatory context, biosafety limits, data quality limits, and whether only computational or also nonclinical validation is allowed.
- **Success criteria**: predefined primary and secondary outcomes, acceptable tradeoffs, and stopping conditions.

If key inputs are missing, state assumptions explicitly and separate them from evidence-supported claims.

# Core Workflow

## 1. Frame the trade-off and pre-register criteria

- Define the function to preserve (binding, specificity, chain pairing, structural integrity).
- Define the liability to reduce (non-human surface features, developability risk, instability, or species incompatibility).
- Pre-register primary/secondary metrics, acceptable tradeoffs, and stopping thresholds.
- **Gate:** If success criteria are undefined or mutually incompatible, stop and refine the research question before proceeding.

## 2. Partition residues into decision classes

- **Retain-first:** antigen-contact residues, CDR-supporting framework positions, buried/core packing residues, and chain-interface positions.
- **Change-first:** surface-exposed scaffold positions with low predicted functional risk and high liability-reduction benefit.
- **Test-first (ambiguous):** positions where structural, sequence, or comparative evidence conflicts.
- **Gate:** If partitioning lacks structural or evolutionary rationale, flag high uncertainty and expand the test-first set rather than guessing.

## 3. Encode ambiguity into a controlled candidate space

- Translate change-first positions into substitution rules based on compatibility (e.g., human-compatible, stability-compatible).
- Encode test-first positions as combinatorial alternatives or diverse candidate sets rather than single fixed choices.
- **Gate:** If the candidate space is too broad to resolve with available validation capacity, narrow it by mechanistic rationale; if too narrow to cover plausible alternatives, add defensible options before screening.

## 4. Assemble design arms and comparators

- **Parental comparator:** original molecule as the functional baseline.
- **Minimal redesign arm:** changes only the highest-confidence change-first positions.
- **Alternative scaffold arm:** tests whether acceptor or template choice alters the outcome.
- **Hybrid/rescue arm:** tests conservative substitutions or back-mutations at failed test-first positions.
- **Benchmark arm:** independent reference design logic when available.
- Include positive, negative, and process controls.
- **Gate:** If controls are unmatched or insufficient to isolate the redesign effect, redesign the comparator strategy before screening.

## 5. Screen and evaluate with orthogonal readouts

- **Tier 1 – Design fidelity / structural plausibility:** confirm the intended redesign is represented.
- **Tier 2 – Integrity and presentation:** assess assembly, expression behavior, and molecular coherence.
- **Tier 3 – Binding and specificity:** compare target recognition and off-target profile to the parent under matched conditions.
- **Tier 4 – Developability:** evaluate stability, aggregation tendency, and formulation-relevant liabilities.
- **Decision gates:**
  - If Tier 1 or 2 fails → reject candidate as a quality failure; do not interpret as a redesign hypothesis failure.
  - If Tier 3 fails → classify as functional loss; map failure to residue class (retain, change, or test).
  - If Tier 4 fails → flag developability liability; compare magnitude to parent and predefined limits.

## 6. Analyze, normalize, and map structure to function

- Normalize all readouts to the parental comparator under matched conditions.
- Separate true functional effects from expression, presentation, or assay artifacts.
- Map failures to structural regions (CDR proximity, interface, surface, core).
- Use recurrence patterns among functional candidates to update tolerability rules, but do not treat absence of recurrence as proof of intolerance.
- **Gate:** If orthogonal assays disagree and the discrepancy is unresolvable, stop iteration and debug measurement confounders before redesigning the molecule.

## 7. Iterate or stop based on evidence

- **Advance:** If binding is retained and liability improved, narrow the design space, update change-first rules, and move to stronger validation.
- **Rescue:** If binding is partially retained, reopen test-first positions and test mechanistically justified back-mutations or alternative templates.
- **Redesign:** If functional loss is severe, reassess the residue partition and scaffold choice; avoid blind restoration.
- **Stop conditions:**
  - No candidate meets pre-registered success criteria after reasonable coverage of the design space.
  - The same failure mode repeats without a plausible mechanistic intervention.
  - Liability reduction and function preservation appear incompatible under the current constraints.
  - Assay or comparator integrity cannot be established.

## 8. Package design rules and boundary conditions

- Summarize supported design rules, inferred heuristics, and remaining speculative assumptions.
- Explicitly state scaffold, antigen, assay, and species boundaries beyond which rules should not be extrapolated.
- Label each conclusion with its evidence strength (directly supported, mechanistically inferred, or agent-proposed).

# Output Format

When using this skill, return results in this structure:

1. **Research question and trade-off definition**
   - Function to preserve.
   - Liability to reduce.
   - Evidence status and assumptions.

2. **Residue classification map**
   - Retain-first, change-first, and test-first positions with rationale.

3. **Candidate design arms and comparator plan**
   - Design arms, controls, and primary/secondary metrics.

4. **Tiered evaluation results**
   - Normalized comparisons to parent and benchmark.

5. **Updated design rules**
   - Supported, inferred, and speculative rules with evidence strength labels.

6. **Iteration recommendation**
   - Advance, rescue, redesign, or stop with justification.

7. **Boundary conditions and extrapolation limits**
   - Contexts where conclusions do and do not apply.

8. **Validity and ethics summary**
   - Confounders, reproducibility, and non-clinical framing.

# Validation Gates

- **Comparator validity:** Parent and benchmark measurements are performed under matched conditions.
- **Control integrity:** Positive, negative, and process controls behave as expected before candidate results are interpreted.
- **Orthogonal agreement:** At least two independent readouts agree before advancing a candidate.
- **Reproducibility:** Critical comparisons hold across independent preparations, runs, or analysis choices.
- **Statistical adequacy:** Multiple comparisons, candidate-set size, and uncertainty are handled appropriately.

# Claim Boundaries

- Sequence human-likeness or compatibility does not constitute proof of low immunogenicity or clinical safety.
- Retained binding in nonclinical assays does not imply clinical utility or therapeutic efficacy.
- Results from one scaffold, antigen, assay format, or expression system do not generalize without direct evidence.
- Computational predictions remain hypotheses until validated by appropriate controlled experiments.
- This workflow produces nonclinical research plans and design rules, not clinical recommendations, dosing guidance, or executable protocols.

# Failure Modes

- **Residue misclassification:** Functionally important residues are labeled as change-first, causing binding or stability loss.
- **Library bias:** The candidate space is too narrow to find viable compromises or too broad to resolve with available validation capacity.
- **Assay artifact:** Expression, presentation, or background differences are mistaken for true binding improvement or loss.
- **Template/scaffold lock-in:** Conclusions become overly dependent on one acceptor scaffold or reference template.
- **Single-readout overfitting:** A candidate optimizes one metric while sacrificing specificity, developability, or robustness.
- **Mechanistic incompatibility:** Liability reduction and functional preservation prove incompatible for the given scaffold under the chosen constraints.

# Validity Checks

Before finalizing conclusions, check:

- **Confounding:** Could expression differences, purity, aggregation, labeling, antigen presentation, batch effects, or nonspecific binding explain the result?
- **Model validity:** Do structural models support the proposed residue roles, or merely suggest them?
- **Database bias:** Do reference sets overrepresent certain families, species, or annotation conventions?
- **Boundary conditions:** Does the conclusion depend on one antigen, one scaffold, one assay format, or one species context?
- **Reproducibility:** Do conclusions replicate across orthogonal assays and independent design rounds?
- **Claim scope:** Does the evidence support molecular mechanism, nonclinical performance, or only a narrow design observation?
- **Ethics and safety:** Is translational language limited to evidence-supported, nonclinical interpretation?

# Provenance

Synthesized from cluster 34, subcluster 34.1.split0. Source skills: antibody-humanization-research-design (0878b6b7fefe67cc), antibody-humanization-combinatorial-library-design (759dc84333fccef5), antibody-humanization-research-pattern (bcd2af1422102f7d), antibody-sequence-active-optimization (d9b953a973f25fb5), antibody-conditioned-geometric-design (82fbe6c001ab9033), antibody-adapter-engineering-workflow (a4b176845e538b34), phage-display-exploration-workflow (e4f949b514ffd87d), immunology-mimotope-discovery-workflow (69c142b6cca05d07).
