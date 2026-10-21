---
name: sci-dft-catalysis-mechanism-discovery-validation-workfl-129115bd
description: A reusable end-to-end workflow for designing mechanistic research plans in catalysis and organometallic chemistry, from anomaly identification through competing hypothesis generation, minimal validation design, orthogonal evidence integration, iterative model updating, and claim bounding.
scienceevolve-title: "Organometallic catalysis and DFT · catalysis mechanism discovery validation workflow"
scienceevolve-area: organometallic-catalysis-and-dft
---

# Purpose

Synthesize a transferable, non-operational workflow for investigating reaction mechanisms in homogeneous catalysis and organometallic systems. It guides the generation of testable hypotheses, the design of discriminating validation plans, the integration of multi-source evidence, and iterative refinement while excluding system-specific recipes or unsafe execution details.

# When to use

Use this skill when:
- Proposing new mechanistic questions for catalytic or organometallic transformations.
- Explaining reactivity anomalies, selectivity switches, nonlinear catalyst dependence, or unexpected inhibition.
- Designing minimal validation plans that combine kinetic, spectroscopic, isotopic, perturbation, or computational evidence.
- Distinguishing productive catalysis from off-cycle speciation, deactivation, or artifact pathways.
- Translating mechanistic reasoning across metal, ligand, or substrate classes within the same research domain.

Do not use for operational synthesis recipes, scale-up guides, safety manuals, or as a source of field-wide consensus.

# Inputs required

Before using the workflow, obtain or clarify:

- Target reaction class and the mechanistic puzzle or anomaly to be explained.
- Candidate catalysts, ligands, additives, media, or substrate families relevant to the new question.
- Available analytical readouts, such as time-resolved progress, product distribution, isotope distribution, spectroscopy, or computation.
- Known benchmark systems, positive controls, negative controls, and likely confounders.
- Safety, regulatory, and feasibility constraints for the chemical class.
- Whether the user wants a conceptual plan only or a plan suitable for expert-reviewed execution.

If the reaction class, available readouts, or safety constraints are unclear, ask for clarification before proposing a concrete validation plan.

# Core Workflow

1. **Frame the mechanistic puzzle**
   - State the observed anomaly (unusual rate, selectivity switch, nonlinear dependence, inhibition, or scope boundary).
   - Sketch a mechanistic map: productive cycle, pre-equilibria, resting states, off-cycle traps, and deactivation branches.
   - Mark branch points where explanations diverge.
   - **Decision Gate 1 — Clarity:** If the puzzle is ambiguous or the map contains unsupported elementary steps, pause and clarify inputs before proceeding.

2. **Generate competing hypotheses**
   - Produce at least three hypotheses that explain the anomaly (e.g., rate-limiting step change, active-species speciation, coordination-site competition, step-order reversal, or competing pathway).
   - For each hypothesis record: evidence strength (high / medium / low / speculative), key assumptions, predicted experimental signatures, falsifiers, and likely failure modes.
   - Label provenance: `literature-supported`, `agent-inferred`, or `speculative`.
   - **Decision Gate 2 — Discriminability:** If hypotheses do not make mutually exclusive predictions, redesign the variable axis or redefine the branch point.

3. **Design minimal viable validation**
   - Identify the causal variable to perturb and the minimal observation that would support, weaken, or reject each hypothesis.
   - Select independent variables with direct mechanistic meaning (component abundance, electronics, sterics, isotope state, medium class).
   - Define controls: baseline, negative, positive, orthogonality, and confounding controls.
   - Define readouts and metrics (progress profiles, selectivity, isotope patterns, spectroscopic signatures, stability indicators).
   - Predefine stop conditions (indistinguishable readouts, multi-feature perturbation, dominant decomposition, safety concerns).
   - **Decision Gate 3 — Test Rigor:** If a proposed test cannot distinguish at least two mechanisms, or if controls are incomplete, redesign before advancing.

4. **Integrate and analyze evidence**
   - Separate direct observations from interpretations and predictions.
   - Interpret kinetic signatures cautiously: low apparent dependence on a component does not prove irrelevance; nonlinear catalyst dependence triggers speciation checks.
   - Interpret isotope/labeling signatures: rapid exchange indicates reversible accessibility, not necessarily productive pathway involvement.
   - Interpret additive/medium effects: inhibition may reflect blocking, deactivation, or altered availability.
   - Use computation to rank alternatives only after experimental signatures define relevant states; treat energy rankings as hypotheses unless they reproduce multiple observations.
   - Assign evidence strength: **Strong** (multiple orthogonal probes agree), **Moderate** (two streams, one indirect), **Weak** (single probe), **Speculative** (no direct validation).
   - **Decision Gate 4 — Evidence Quality:** If evidence is single-source, irreproducible, or confounded, halt mechanistic claims and flag uncertainty.

5. **Iterate or terminate**
   - Update the mechanistic map: add, remove, or reweight steps and species.
   - Reclassify hypotheses based on new evidence; maintain an evidence ledger.
   - Identify the strongest remaining alternative to the leading hypothesis.
   - Design the next minimal discriminating test that distinguishes the leader from the strongest alternative.
   - Test boundary conditions by varying substrate class, ligand environment, or concentration regime.
   - **Decision Gate 5 — Resolution:**
     - *Proceed* if the leading hypothesis is supported by at least two independent signals and survives controls.
     - *Redesign* if the leader and strongest alternative remain unresolved.
     - *Stop* if decomposition or artifacts dominate, safety thresholds are unmet, or new data contradict core assumptions.

6. **Bound claims and archive**
   - Restrict conclusions to the tested variable set and chemical regime.
   - Explicitly separate verified observations, agent-inferred mechanisms, computational predictions, and speculative extensions.
   - State boundary conditions and extrapolation limits.
   - Document the final evidence ledger, decision record, and residual risks.

# Output Format

Return a structured research plan containing:

1. **Mechanistic puzzle** — Observed behavior, target reaction class, and scientific significance.
2. **Competing hypotheses** — Hypothesis statement, evidence label, key assumptions, predicted signatures, falsifiers, and likely failure modes.
3. **Mechanistic map** — Productive steps, pre-equilibria, off-cycle species, and branch points.
4. **Minimal viable validation plan** — Variables, controls, readouts, predicted outcomes, and stop conditions.
5. **Analysis plan** — How kinetic, isotopic, perturbation, and computational evidence will be interpreted and integrated.
6. **Iteration plan** — How results will update the mechanistic model and what the next discriminating test should be.
7. **Validity and safety checks** — Confounders, reproducibility requirements, boundary conditions, evidence strength, and safety review needs.

# Validation Gates

- **Gate 1 — Puzzle Clarity:** The anomaly is well-defined and the mechanistic map is chemically plausible before hypotheses are generated.
- **Gate 2 — Hypothesis Discriminability:** Competing hypotheses make mutually divergent predictions suitable for experimental or computational separation.
- **Gate 3 — Test Rigor:** Every proposed test distinguishes at least two mechanisms, and baseline, negative, positive, orthogonality, and confounding controls are specified.
- **Gate 4 — Evidence Quality:** Claims rely on orthogonal, reproducible evidence; single-source or confounded data trigger uncertainty flags rather than mechanistic conclusions.
- **Gate 5 — Mechanistic Resolution:** The leading hypothesis is supported by multiple independent signals and survives all controls before scope expansion or generalization.

# Claim Boundaries

- Claims are bounded to the tested metal, ligand, substrate, and medium regime.
- A single validated mechanism does not establish field-wide consensus.
- Verified observations, computational inferences, literature analogies, and speculative extensions must be explicitly separated.
- Yield or conversion optimization alone is not evidence for mechanism.
- Detection or isolation of an intermediate does not automatically prove its on-cycle catalytic relevance.

# Failure Modes

- Readouts cannot distinguish the competing mechanisms.
- A perturbation changes too many mechanistic features simultaneously.
- Catalyst stability cannot be separated from intrinsic rate behavior.
- Controls produce the same result as the target system.
- Decomposition, aggregation, or heterogeneous artifacts dominate the observation.
- Isotope scrambling or analytical ambiguity invalidates pathway interpretation.
- Results are irreproducible across independent preparations or calculations.
- Evidence supports only a vague correlation rather than a causal mechanistic link.

# Validity Checks

- **Mechanistic discrimination:** Does each proposed test distinguish at least two mechanisms?
- **Control completeness:** Are baseline, negative, positive, orthogonality, and confounding controls included?
- **Reproducibility:** Are repeats, uncertainty estimates, and analytical calibration addressed?
- **Statistical validity:** Are trends evaluated with appropriate uncertainty rather than single-run impressions?
- **Confounders:** Are product inhibition, catalyst degradation, impurities, medium effects, aggregation, and analytical artifacts considered?
- **Boundary conditions:** Are concentration regime, substrate class, ligand environment, counterion, and medium limitations stated?
- **Evidence separation:** Are source-verified claims distinguished from agent-inferred hypotheses?
- **Safety boundary:** Are only non-operational, expert-reviewable design elements proposed for risky chemistry?

# Provenance

- Synthesized from cluster 6 / subcluster 6.0 (observable-driven mechanism discovery and validation).
- Source skills: test1500, test1848, test1407, test1539, test0362, test0055, test0330, test0243.
- Represents a semantic merge of shared workflow routes; no single source paper's conclusions, numerical parameters, or chemical systems are reproduced.
