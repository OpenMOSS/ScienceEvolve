---
name: sci-dft-catalysis-organometallic-mechanism-discovery-wo-eabf4a2c
description: A reusable end-to-end workflow for generating, validating, and iterating mechanistic hypotheses in organometallic catalysis and coupling chemistry without operational protocols.
scienceevolve-title: "Organometallic catalysis and DFT · catalysis organometallic mechanism discovery workflow 3"
scienceevolve-area: organometallic-catalysis-and-dft
---

# Purpose

Convert a catalytic selectivity or reactivity problem into a structured, mechanism-guided research plan. The workflow emphasizes hypothesis generation, non-operational experimental design, orthogonal validation, and iterative refinement while excluding specific catalyst systems, numerical parameters, and laboratory recipes.

# When to use

Use this skill when:
- Proposing new research questions in organometallic catalysis, cross-coupling, C–H functionalization, or related bond-forming reactions.
- Selectivity is governed by competing catalytic cycles, ligand-controlled branching, or substrate-dependent pathway divergence.
- A project needs a hypothesis-driven design plan rather than a literature summary.
- Mechanistic ambiguity requires discriminating experiments, computational screening, or descriptor analysis.

Do not use this skill for executable laboratory protocols, hazardous operational details, or as a substitute for safety review and regulatory approval.

# Inputs required

Before starting the workflow, obtain or clarify:
- Target transformation and desired product class.
- Known or suspected mechanistic bottleneck (e.g., activation, insertion, selectivity, release, regeneration).
- Candidate design variables (metal class, ligand steric/electronic profile, substrate features, medium role).
- Baseline benchmark or prior motif with some mechanistic support.
- Available analytical and computational capabilities.
- Safety, regulatory, and institutional constraints.

If the user provides only a broad topic, first produce a mechanistic gap map and ask which design axis to prioritize.

# Core Workflow

Follow this ordered route. Do not proceed past a decision gate until the condition is satisfied; if a stop condition is met, terminate or redesign.

## 1. Frame the mechanistic gap
- Define the synthetic or selectivity limitation as a falsifiable mechanistic bottleneck (e.g., competing pathways, intermediate stability, branch-point control), not merely a missing example.
- **Decision gate:** If the gap cannot be expressed as a mechanistic tension with at least two plausible pathways or limiting steps, stop and request clarification.

## 2. Map the catalytic network
- Construct a conceptual catalytic cycle: substrate activation, key transfer/insertion steps, product release, and catalyst regeneration.
- Identify branch points where desired and undesired pathways diverge.
- Identify plausible resting states and off-cycle intermediates that could alter effective barriers.
- **Decision gate:** If the network lacks an identifiable branch point or resting-state hypothesis, flag high uncertainty and require additional literature or data input before proceeding.

## 3. Generate layered hypotheses
Produce at least:
- **Gap hypothesis:** what limits the reaction and why it matters.
- **Pathway hypotheses:** at least two plausible mechanisms for the limiting step (e.g., direct vs. assisted transfer).
- **Structure–selectivity hypotheses:** how catalyst or substrate structure biases the branch point.
- **Boundary hypotheses:** where the model should succeed, fail, or become ambiguous.

For each hypothesis record:
- Mechanistic rationale.
- Evidence strength: **high**, **medium**, **low**, or **speculative**.
- Key assumptions.
- Likely failure modes.

**Decision gate:** Reject hypotheses that are not falsifiable or lack a plausible causal link between a design variable and a mechanistic function.

## 4. Design minimal validation
- Define **independent variables** (one primary design axis per iteration).
- Define **dependent variables**: conversion, selectivity, product distribution, mass balance, catalyst persistence.
- Define **controls**:
  - Benchmark control (known productive system).
  - Negative controls (no catalyst, missing component).
  - Pathway contrast (direct vs. assisted route).
  - Reference-state contrast (resting-state inclusion).
  - Mechanistic diagnostic probe.
- Define **evaluation metrics** and predefine success/failure criteria.
- **Decision gate:** If the plan lacks a negative control or a mechanistic probe, pause and strengthen the design before any notional execution.

## 5. Analyze outcomes mechanistically
- Confirm product identity before interpreting yield or selectivity.
- Separate activity effects from selectivity effects.
- Compare perturbed systems against matched baselines.
- Assign outcomes to pathway classes: desired, competing, or decomposition.
- Correlate trends with electronic/structural descriptors; treat unexplained correlations as weak evidence.
- Check consistency between experimental observations and computational models, distinguishing relative trends from absolute predictions.
- **Decision gate:** If the no-catalyst control is productive, product assignment is ambiguous, or results depend on uncontrolled variables, classify the result as inconclusive and halt mechanistic interpretation.

## 6. Iterate or terminate
- **If supported:** Add orthogonal validation (external benchmark, scope boundary test) before broadening claims.
- **If ambiguous:** Add missing controls, refine reference-state assumptions, or deploy a discriminating probe.
- **If contradicted:** Revise the mechanistic map, test an alternative branch-point model, or stop.

**Stop conditions:**
- Product distribution is indistinguishable from background.
- Proposed intermediates are unsupported by any structural, kinetic, or computational evidence.
- Candidate ranking depends on inconsistent reference-state or model assumptions.
- Descriptor trends are unexplained or dominated by outliers.
- Safety or reproducibility barriers prevent meaningful validation.

**Decision gate:** After each iteration, re-label evidence strength and boundary conditions before proceeding.

## 7. Finalize claims and output
- Assemble the research question, mechanistic map, hypothesis table, validation record, and iteration log.
- Explicitly separate source-supported observations, analogical inferences, model-supported inferences, and unsupported extrapolations.
- State boundary conditions and unresolved assumptions.

# Output Format

Return a structured report containing:
1. **Research question** — Concise statement of the catalytic problem and its mechanistic gap.
2. **Catalytic network map** — Conceptual cycle with branch points, desired/undesired pathways, and plausible resting states.
3. **Hypothesis table** — For each hypothesis: claim, mechanistic rationale, evidence strength, key assumptions, likely failure modes.
4. **Validation plan summary** — Independent variables, controls, metrics, and stop conditions.
5. **Analysis record** — Outcomes, pathway assignments, descriptor correlations, and uncertainty assessment.
6. **Iteration log** — Updates, revised assumptions, next steps, and evidence-strength revisions.
7. **Validity and safety statement** — Confounders, reproducibility checks, boundary limits, and non-operational safety guardrails.

# Validation Gates

Before presenting any research proposal, verify:
- **Gap validity:** The gap is framed as a mechanistic limitation, not a missing example.
- **Pathway validity:** All key catalytic-cycle steps are represented and alternative pathways are compared.
- **Reference-state validity:** Stable intermediates and off-cycle states are considered in effective-barrier or rate analysis.
- **Control validity:** Baseline, positive, negative, pathway, and reference-state contrasts are included.
- **Confounding validity:** Metal, ligand, pathway, and medium effects are conceptually isolated one at a time.
- **Descriptor validity:** Electronic or structural descriptors explain trends; unexplained correlations are flagged as weak.
- **External validity:** Claims are compared with independent evidence and disagreements are marked.
- **Reproducibility validity:** Replicates, uncertainty estimates, and mass balance are addressed.
- **Boundary validity:** Extrapolations are limited to tested substrate, metal, ligand, and medium classes.
- **Consensus validity:** No single source is treated as domain consensus.

# Claim Boundaries

- Distinguish source-supported patterns from agent-inferred extensions.
- Do not treat computed barriers or screening rankings as direct experimental performance predictions.
- Limit scope claims to the tested chemical space; treat failures as boundary-defining data.
- Avoid presenting a single successful system as field-wide consensus.
- Do not extrapolate to biological, clinical, environmental, or scale-up claims without dedicated evidence.

# Failure Modes

- The design variable lacks a clear mechanistic function or causal link.
- The assisted or alternative pathway does not improve the relevant comparison.
- Negative controls perform equivalently to the proposed design.
- Candidate ranking depends on inconsistent reference-state or model assumptions.
- Results are driven by unstable, chemically inaccessible, or uncharacterized states.
- Product isomerization or catalyst decomposition fully explains the observed distribution.
- Descriptor trends are unexplained or dominated by outliers.
- Analytical ambiguity or coelution misassigns selectivity.
- Computational results depend strongly on arbitrary model choices without experimental anchoring.

# Validity Checks

- Confirm all Validation Gates are satisfied before presenting a proposal.
- Verify product identity is established before mechanistic interpretation.
- Ensure controls are interpreted before optimization trends.
- Check that mechanistic claims are conservative and account for all major observations.
- Confirm that safety and regulatory constraints are acknowledged and that no operational hazardous details are included.

# Provenance

- Synthesized from cluster 12 / subcluster 12.0 (catalysis-organometallic-catalyst-coupling-mechanism-discovery-workflow).
- Source skills: test0060 (mechanism-guided-computational-catalyst-screening), test0498 (recyclable-asymmetric-catalysis-workflow), test0819 (asymmetric-ch-carbonylation-research-design), test1359 (geometry-controlled-selectivity-research), test1382 (organometallic-catalysis-mechanism-design), test1470 (redox-neutral-c-h-acylation-discovery), test1691 (mechanism-guided-cross-coupling-design), test1779 (nhc-copper-migration-catalyst-design).
- Preserves shared workflow route: gap definition → network mapping → hypothesis generation → minimal validation → mechanistic analysis → iteration with stop conditions → bounded claim finalization.
