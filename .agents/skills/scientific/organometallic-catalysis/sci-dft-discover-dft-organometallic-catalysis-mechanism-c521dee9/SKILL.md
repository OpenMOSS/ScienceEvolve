---
name: sci-dft-discover-dft-organometallic-catalysis-mechanism-c521dee9
description: End-to-end workflow for generating, validating, and iterating mechanistic hypotheses in computational organometallic catalysis using first-principles evidence and control comparisons.
scienceevolve-title: "Organometallic catalysis and DFT · discover dft organometallic catalysis mechanisms"
scienceevolve-area: organometallic-catalysis-and-dft
---

# Purpose

Transform observed catalytic phenomena, selectivity anomalies, or structure–reactivity trends into a reusable, evidence-driven mechanism-discovery pipeline. This skill guides the agent to define falsifiable mechanistic questions, enumerate competing catalytic cycles, design non-operational computational validation, compare paths on a common reference frame, and iterate based on structured evidence—all without reproducing paper-specific conclusions or operational laboratory protocols.

# When to use

- A user reports a selectivity anomaly, unexpected product distribution, or catalyst performance difference and asks for a mechanistic rationale or computational validation route.
- Competing mechanistic hypotheses exist (e.g., different elementary-step orders, active-species identities, or spin states) and need discrimination.
- Preliminary computational results conflict with experiment, requiring systematic hypothesis revision rather than attribution to generic “calculation error.”
- A new substrate, ligand, or metal platform needs a mechanism study designed from first principles rather than direct literature extrapolation.

Do not use this skill to provide executable wet-lab procedures, hazardous material handling, synthesis recipes, or scale-up parameters.

# Inputs required

- **Reaction context**: Target transformation, substrate class, catalyst/metal center type, ligand environment, and known or suspected products and byproducts.
- **Observables**: Experimental selectivity, regio-/stereochemical outcomes, kinetic trends, failed reactions, or spectroscopic clues.
- **Candidate space**: Baseline mechanism(s) from literature or intuition, plus explicit alternative paths (e.g., different activation orders, spin states, or off-cycle routes).
- **Model constraints**: Acceptable levels of theory, model simplification boundaries, conformational sampling scope, and computational resource limits.
- **Safety/compliance boundaries**: Non-operational research limits; any experimental follow-up must be flagged for qualified personnel review.

# Core Workflow

1. **Frame the mechanistic question**
   - Convert the observed phenomenon into a falsifiable proposition (e.g., “Intermediate X governs the observed regioselectivity”).
   - Define what constitutes support, partial support, or falsification.

2. **Build the candidate mechanism pool**
   - **Baseline**: The most commonly assumed intermediate or path.
   - **Structural alternatives**: Different coordination modes, oxidation states, ligand arrangements, or counter-ion effects.
   - **Kinetic alternatives**: Alternative rate-determining or selectivity-determining steps, pre-equilibria, reversible steps, or post-reaction isomerization.
   - **Environmental/off-cycle alternatives**: Solvent effects, ion pairing, aggregation, catalyst deactivation, or byproduct-forming side paths.
   - *Decision gate*: If fewer than two competing paths can be articulated, pause and gather more domain input before proceeding.

3. **Design the minimal validation plan**
   - **Variables**: Mechanism variables (intermediate type, coordination mode, spin state), path variables (competing bond-making/breaking sequences), and model variables (truncation, solvent representation, conformational scope).
   - **Controls**:
     - *Baseline control*: The simplest/default mechanism for comparison.
     - *Positive control*: A known system expected to recover established trends.
     - *Negative control*: A variant expected to suppress the target selectivity or path.
     - *Strong control*: A direct comparison of two mechanistic branches that should yield distinguishable observables.
   - **Evaluation metrics**: Relative feasibility, selectivity direction, connectivity of intermediates/transition states, structural/electronic descriptors, and robustness to model perturbations.
   - **Stop conditions**:
     - A candidate cannot connect reactants to products.
     - Predictions contradict strong control results and no confounder explains the mismatch.
     - Conclusions depend on a single unverified conformation or computational setting.

4. **Execute comparative analysis**
   - Map each candidate as a continuous path from a common precursor to products; verify connectivity.
   - Compare relative energy/free-energy profiles; distinguish kinetic from thermodynamic control.
   - Analyze electronic and geometric features (charge redistribution, orbital interactions, steric changes) and link them to selectivity.
   - Perform sensitivity checks: alter model truncation, conformational sampling, solvent treatment, or spin-state representation. If ranking inverts, downgrade the conclusion strength.
   - *Decision gate*: If sensitivity analysis overturns the preferred path, return to Step 2 to expand the candidate pool.

5. **Evaluate evidence and classify conclusions**
   - **Supported**: Mechanism explains major observables and survives at least one strong control or sensitivity check.
   - **Partially supported**: Explains some trends but leaves anomalies or exhibits model dependence.
   - **Not supported**: Predictions conflict with primary observables and the conflict cannot be reconciled by reasonable model refinement.
   - **Indistinguishable**: Multiple mechanisms yield predictions within uncertainty bounds; flag for discriminatory probe design.
   - *Decision gate*: If indistinguishable, do not force a winner; proceed to Step 6 to design higher-resolution tests.

6. **Iterate or redesign**
   - **If supported**: Define applicability boundaries (metal, ligand, substrate scope). Design extension tests that perturb electronic or steric parameters to check transferability.
   - **If partially supported**: Identify the failing assumption (reference state, charge/spin state, omitted off-cycle step). Generate a revised hypothesis and return to Step 3 with targeted controls.
   - **If not supported**: Treat the failure as a mechanism filter. Generate an alternative pool (Step 2) prioritizing hypotheses that explain why the baseline failed.
   - **If evidence is insufficient**: Output an “undetermined” status, list the top three discriminatory experiments or calculations needed, and stop.
   - *Iteration gate*: After each cycle, update the evidence ledger (validated, inferred, pending, excluded).

# Output Format

The agent must produce:

1. **Research question** — One-sentence falsifiable mechanistic proposition.
2. **Evidence ledger** — Stratified list of: (a) validated facts, (b) current inferences, (c) pending assumptions.
3. **Candidate mechanisms** — Table with path description, evidence strength (High/Medium/Low), key assumptions, observable predictions, and failure modes.
4. **Minimal validation plan** — Non-operational study design including variables, baseline/positive/negative/strong controls, metrics, and stop conditions.
5. **Analysis plan** — How to compare reaction coordinates, electronic/structural descriptors, model sensitivity, and experimental consistency.
6. **Iteration rules** — Triggers for support, weakening, exclusion, or redesign of each hypothesis.
7. **Validity and boundary notes** — Confounders, extrapolation limits, uncertainty sources, and safety/compliance boundaries.

# Validation Gates

- **Candidate gate**: At least two mechanistic paths are articulated before analysis begins.
- **Control gate**: Every hypothesis is paired with a strong control that could falsify it.
- **Connectivity gate**: All reported paths are checked for continuous reactant-to-product linkage.
- **Sensitivity gate**: Conclusions are tested against reasonable model variations; rank-dependent conclusions are flagged.
- **Consistency gate**: Computational trends are cross-checked against experimental observables; mismatches trigger hypothesis revision rather than data dismissal.
- **Falsifiability gate**: Each major assumption must yield a testable prediction; untestable explanations are rejected or downgraded to speculation.

# Claim Boundaries

- Distinguish **paper-derived method templates** from **new-system inferences**. Source skills provide reasoning patterns, not transferable conclusions.
- Do not present single-system computational rankings, selectivities, or barrier heights as domain consensus.
- Extrapolate only within analogous metal centers, ligand classes, and reaction types; flag any cross-class extension as unverified.
- Avoid causal claims where only correlation is established (e.g., “feature X is associated with higher selectivity” is permissible; “feature X causes higher selectivity” requires kinetic control evidence).
- Never state that a computational result proves a real-world mechanism; state that the model supports or weakens the hypothesis under its stated assumptions.

# Failure Modes

- **Path connectivity failure**: A key intermediate or transition state cannot be reasonably linked to its neighbors; the candidate is shelved.
- **Model sensitivity**: Changing solvent model, truncation, conformational treatment, or spin state reverses the preferred path; conclusion strength is reduced to “competitive” or “undetermined.”
- **Indistinguishable predictions**: Competing mechanisms predict identical or overlapping observables within uncertainty; the agent must design discriminatory probes rather than select a winner.
- **Scope overreach**: The user asks for direct experimental execution, scale-up, or hazardous protocols; the agent must decline and restate the non-operational boundary.
- **Evidence misattribution**: Single-point energies, single conformations, or unverified reference states are treated as definitive; caught by the sensitivity and connectivity gates.

# Validity Checks

- **Confounders**: Assess whether solvent, counter-ion, ligand dissociation, substrate conformation, aggregation, off-cycle reactivity, or catalyst deactivation could alter the conclusion.
- **Reproducibility**: Document model assumptions, reference states, connectivity checks, conformational sampling rules, and uncertainty sources so the mechanism map can be reconstructed.
- **Statistical validity**: Avoid deciding selectivity from a single energy value or single structure; report trends across conformations or model variants and note when differences are within method uncertainty.
- **Boundary conditions**: State the applicable metal, ligand, substrate, and reaction-type scope explicitly; do not imply universal validity.
- **Evidence stratification**: Maintain clear separation between validated facts, model-supported inferences, reasonable analogies, and untested hypotheses.
- **Falsifiability**: Every retained hypothesis must include predefined conditions under which it would be excluded.

# Provenance

- Synthesized from cluster `13.0` (end-to-end mechanism discovery and validation).
- Source skills: `dft-regioselectivity-mechanism-exploration`, `catalytic-cycle-network-mechanism-design`, `organopalladium-heck-dft-mechanistic-design`, `transition-metal-ch-catalysis-mechanistic-exploration`, `ni-decarboxylative-cycloaddition-mechanism`, `dft-organometallic-mechanism-exploration`, `organometallic-catalysis-mechanism-discovery`, `computational-organometallic-mechanism-exploration`.
