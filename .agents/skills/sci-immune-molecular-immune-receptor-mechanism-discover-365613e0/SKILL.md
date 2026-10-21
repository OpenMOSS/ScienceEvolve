---
name: sci-immune-molecular-immune-receptor-mechanism-discover-365613e0
description: A reusable end-to-end workflow for discovering and validating molecular mechanisms of immune receptor-ligand and determinant recognition through perturbation-rescue logic, specificity controls, and convergent evidence.
scienceevolve-title: "Antibody and immune recognition · molecular immune receptor mechanism discovery workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

This skill helps an agent turn an immune receptor recognition problem into a rigorous, reusable mechanism-discovery workflow. It abstracts patterns from receptor-phenotype mapping, determinant inference, perturbation-rescue design, and repertoire-bottleneck analysis into an ordered route that discriminates direct recognition from indirect, nonspecific, or context-dependent effects—without treating any single study as domain consensus.

# When to use

Use this skill when the user asks to:

- Generate research questions about immune receptor, antibody, or ligand/determinant recognition mechanisms.
- Design non-clinical studies that link receptor features to functional outcomes via perturbation and rescue.
- Discriminate determinant-specific recognition from scaffold, isotype, abundance, or assay artifacts.
- Validate surrogate probes, map antigenic determinants, or test receptor-ligand architecture hypotheses.
- Iterate on conflicting or partial evidence in immunology receptor research.

Do not use this skill for clinical advice, treatment recommendations, patient-specific guidance, executable wet-lab protocols, or high-risk operational parameters.

# Inputs required

Before producing a research plan, ask for or infer:

- **Target system:** species, cell type or subset, activation state, and biological context.
- **Receptor object:** receptor family, class, structural variant, or modification state under study.
- **Proposed determinant/recognition feature:** ligand, motif, domain, post-translational modification, or shared feature.
- **Downstream decision:** the functional outcome, cell-state change, or response phenotype to be explained.
- **Perturbation concept:** genetic, enzymatic, chemical, structural, or comparative perturbation at a design level.
- **Readout layers:** molecular (binding/recognition), cellular (organization/signaling), and functional (output) assays available in principle.
- **Constraints:** non-clinical scope, ethical limits, biosafety level, institutional approval status, and data availability.

If any input is missing, state assumptions explicitly and mark conclusions as provisional.

# Core Workflow

Follow this ordered route. At each gate, decide whether to proceed, revise, or stop.

## 1. Frame the recognition problem
- Define the receptor–ligand axis and the biological decision it is proposed to control.
- Distinguish whether the feature of interest is hypothesized to act as a marker, mediator, biosynthetic product, or context-dependent modulator.
- **Decision gate:** If the problem cannot be framed as a testable receptor-level mechanism, refine the scope or stop.

## 2. Generate competing mechanism hypotheses
- Produce at least three competing hypotheses that explain the downstream outcome, for example:
  - Direct determinant-recognition model.
  - Occupancy/architecture or receptor-organization model.
  - Context-dependent or threshold model.
  - Indirect/bypass or repertoire-bottleneck model.
- For each hypothesis, label: evidence strength, key assumptions, predicted pattern, likely failure mode, and minimal discriminating test.
- **Decision gate:** If hypotheses are not mutually distinguishable with available readouts, redesign the variable map before proceeding.

## 3. Design the perturbation–rescue ladder and control matrix
- Define conceptual conditions:
  - **Baseline:** native or unmodified comparator.
  - **Perturbation:** loss or reduction of the proposed determinant or receptor feature.
  - **Rescue/Restoration:** condition expected to restore the feature without unrelated changes.
  - **Specificity comparator:** irrelevant ligand, unrelated receptor, pathway-bypass, or matched-scaffold control.
- Build a control matrix including negative, positive, specificity, viability/stress, handling, and batch controls.
- **Decision gate:** If the design cannot separate receptor abundance from receptor activity, or lacks orthogonal readouts, redesign.

## 4. Define the measurement and analysis plan
- Map readouts to mechanistic layers:
  - **Molecular:** binding, affinity, or recognition proxy.
  - **Cellular:** receptor organization, signaling, trafficking, or membrane localization.
  - **Functional:** cell-state change, secretion, differentiation, or higher-level immune output.
- Predefine primary and secondary endpoints, statistical approach, multiple-comparison strategy, and null expectations.
- **Decision gate:** If readouts are not orthogonal or do not span at least two mechanistic layers, revise the plan.

## 5. Execute conceptual validation and quality gating
- Confirm perturbation specificity, receptor abundance, cell viability, assay dynamic range, and batch comparability.
- Flag failed controls, high background, or low dynamic range before mechanism interpretation.
- **Stop/Go:** If quality gates fail, halt biological interpretation and troubleshoot the assay or design.

## 6. Discriminate mechanisms through convergent evidence
- Compare baseline, perturbation, rescue, and specificity conditions across readout layers.
- Where multiple independent perturbations are available, cluster response profiles and map molecular changes to identify convergent candidate determinants.
- Evaluate competing models using pre-defined decision rules:
  - Support the leading model if orthogonal readouts converge and controls behave as expected.
  - Revise if evidence is directional but confounded.
  - Reject or suspend if controls fail or patterns are no better than random expectation.
- **Decision gate:** If orthogonal readouts disagree, classify the mechanism as unresolved and proceed to iteration.

## 7. Map boundary conditions and context dependency
- Evaluate whether the effect depends on species, strain, cell subset, activation state, post-translational modification, compartment, or presentation context.
- Test necessity and sufficiency conceptually: does removing the determinant abolish the response? Does adding it to a negative scaffold create response?
- **Decision gate:** If the effect tracks generic similarity rather than the specific determinant, stop and reformulate the feature definition.

## 8. Iterate or terminate
- **If supported:** Increase evidence strength only when independent evidence converges. Define the next boundary test or confirmatory step.
- **If ambiguous:** Identify the limiting assumption (specificity, viability, context, assay resolution). Design the smallest next experiment that discriminates between the leading hypothesis and the strongest alternative.
- **If contradictory/failed controls:** Stop, reject the hypothesis, or return to Step 2 to redesign.
- **Stop conditions:** Nonspecific effects dominate; rescue fails for technical reasons inseparable from mechanism; cell-system and organismal readouts conflict; safety or ethical constraints prevent meaningful interpretation.

# Output Format

When using this skill, return:

1. **Research question** — Focused receptor–determinant–function question.
2. **Competing hypotheses** — For each: claim, evidence strength, key assumption, predicted pattern, and likely failure mode.
3. **Perturbation–rescue design** — Baseline, perturbation, rescue, specificity comparator, and control matrix at a conceptual level.
4. **Measurement plan** — Orthogonal readouts mapped to molecular, cellular, and functional layers.
5. **Analysis plan** — Quality gates, integration logic, statistical checks, and visualization strategy.
6. **Iteration roadmap** — Stop/go/revise criteria and the next minimal discriminating test.
7. **Validity and safety check** — Confounders, boundary conditions, reproducibility safeguards, and ethics/biosafety constraints.

# Validation Gates

- **Quality gate:** Assay performance, cell viability, receptor abundance, handling artifacts, and batch effects are within acceptable bounds before mechanism interpretation.
- **Specificity gate:** The response tracks the proposed determinant more strongly than matched-scaffold, irrelevant-ligand, or generic similarity controls.
- **Mechanism gate:** Orthogonal readouts across at least two mechanistic layers converge on the same model; conflicting readouts flag an unresolved mechanism.
- **Boundary gate:** The effect is reproducible across independent preparations or systems and is explicitly bounded by context, species, cell subset, or receptor family.

# Claim Boundaries

- Distinguish **observed association** from **causal mechanism** and **physiological consequence**.
- Label every claim as **paper-supported**, **agent-inferred**, or **speculative**; do not present single-study findings as field-wide consensus.
- Separate recognition evidence from claims of sufficiency, necessity, or therapeutic relevance.
- Limit extrapolation to the tested receptor, ligand, cell type, species, and activation context unless independent comparative evidence exists.

# Failure Modes

- **Nonspecific perturbation:** The manipulation alters global cell health, receptor abundance, or broad signaling rather than the intended feature.
- **Rescue confounding:** Restoration fails for technical reasons that cannot be separated from the proposed mechanism.
- **Assay artifact:** Background, cross-reactivity, batch effects, or handling artifacts are mistaken for biological mechanism.
- **Determinant misidentification:** Convergent molecular changes map to an indirect structural feature rather than a direct functional determinant.
- **Overextrapolation:** Findings from one model system, species, or cell state are generalized without boundary testing.
- **Premature closure:** A single readout or unvalidated clustering pattern is treated as definitive proof.

# Validity Checks

Before finalizing any plan or interpretation, verify:

- Does the hypothesis set distinguish direct recognition, occupancy/architecture, context-dependence, and indirect mechanisms?
- Are structural/biochemical readouts orthogonal to functional readouts?
- Does the control matrix include negative, positive, specificity, viability, handling, and batch controls?
- Are receptor abundance, surface availability, biosynthesis, turnover, and activity treated as separate variables?
- Are stop/go criteria and primary endpoints predefined before data interpretation?
- Are historical or single-paper findings labeled as system-specific rather than domain consensus?
- Are statistical approaches matched to the data structure, with effect sizes and uncertainty reported?
- Are all proposed manipulations described at a non-operational research-design level?
- Are animal, human, infectious, genetic, or regulated biological activities governed by institutional approvals and applicable law?

# Provenance

Synthesized from cluster **45** / subcluster **45.0.split0**. Derived from source skills: `b-cell-receptor-phenotype-function`, `viral-antigenic-determinant-discovery`, `glycoimmune-receptor-research-design`, `anti-idiotype-research-design`, `determinant-network-immunology-research-design`, `receptor-antigen-competitive-probing`, `repertoire-bottleneck-immune-response`, `antibody-response-mechanism-exploration`.
