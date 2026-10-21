---
name: sci-dft-computational-dft-organometallic-mechanism-disc-c286b6e9
description: A reusable end-to-end workflow for first-principles mechanism discovery and validation in transition-metal and organometallic catalysis through computational hypothesis generation, pathway discrimination, and iterative model refinement.
scienceevolve-title: "Organometallic catalysis and DFT · computational dft organometallic mechanism discovery"
scienceevolve-area: organometallic-catalysis-and-dft
---

# Purpose

Convert a catalytic-performance or selectivity problem into a mechanism-first research plan. This skill guides the generation of testable mechanistic hypotheses, the design of minimal discriminating validations, and the iterative refinement of catalytic cycle models using computational chemistry and orthogonal evidence. It treats single-source conclusions as case studies, not field consensus.

# When to use

Use this skill when:
- A user asks for new research questions, mechanistic hypotheses, or study designs in transition-metal-catalyzed or organometallic transformations.
- The task requires comparing multiple plausible pathways, intermediates, or elementary steps rather than assuming a single mechanism.
- The goal is to explain selectivity, activity, or scope limitations through competing-pathway analysis.
- Available evidence includes computed structures, energy profiles, experimental trends, or literature benchmarks.

Do not use this skill for executable wet-lab protocols, synthesis optimization recipes, safety-critical operational instructions, or as a substitute for experimental validation.

# Inputs required

Before starting the workflow, collect or infer:
- **Target reaction class** and desired bond-forming outcome.
- **Catalyst family** conceptual descriptors (metal center, ligand scaffold, accessible oxidation/spin states).
- **Mechanistic uncertainty**: unresolved steps, competing pathways, suspected resting states, or off-cycle traps.
- **Design axes**: variables to perturb (electronic, steric, medium, substrate class).
- **Evidence base**: prior computations, experimental observations, kinetic data, spectroscopic hints, or benchmarks.
- **Computational scope**: acceptable model levels, uncertainty tolerance, reproducibility requirements.
- **Validation target**: the decision to support (e.g., mechanism discrimination, scope prediction, catalyst redesign).
- **Safety and ethics constraints**: non-operational boundaries for hazardous or regulated chemical spaces.

If inputs are missing, state assumptions and downgrade confidence accordingly.

# Core Workflow

Follow the end-to-end route below. At each numbered stage, apply the associated decision gate before proceeding.

## 1. Frame the mechanistic gap
- Define the selectivity or activity puzzle as a branching-pathway problem from a shared intermediate or catalyst state.
- Separate verified observations from inferred mechanisms.
- **Decision gate — candidate_gate**: If the reaction class lacks a plausible shared intermediate or the evidence base is purely anecdotal, stop and request additional boundary data or refine the question.

## 2. Map the reaction network
- Enumerate all plausible elementary steps: activation, substrate binding, bond cleavage/formation, product release, catalyst regeneration, and off-cycle traps.
- Mark each step as product-forming, reversible, rearrangement, or off-cycle.
- **Decision gate — stability_gate**: If catalyst regeneration cannot be plausibly connected or a dominant off-cycle trap makes turnover impossible under the stated assumptions, flag the cycle as incomplete and redesign the network before ranking pathways.

## 3. Generate ranked hypotheses
- For each competing branch or mechanistic role, state: proposed controlling factor, predicted pathway preference, expected observable consequence, evidence strength (low/medium/high), key assumptions, and likely failure modes.
- Label evidence as directly computed, experimentally supported, analogy-based, or speculative.
- **Decision gate — candidate_gate**: If only one pathway is considered, return to Step 2 and enumerate alternatives before proceeding.

## 4. Design minimal validation plan
- Select the smallest set of comparisons that can distinguish the leading hypotheses.
- Define arms: baseline, variant, mechanism-comparison, negative control, positive control, and robustness/sensitivity checks.
- Specify conceptual variables, non-operational evaluation metrics, and stop conditions.
- **Decision gate — robustness_check**: If the plan lacks a negative control or a benchmark case with known behavior, revise the design before execution.

## 5. Execute comparison and collect evidence
- Run or evaluate the planned computational comparisons (or conceptual experimental probes) at the research-design level only.
- Record model choices, reference states, convergence criteria, and structural identifiers needed for reproducibility.
- **Decision gate — iteration_gate**: If transition-state connectivity is unvalidated or the intended state relaxes into a different binding mode, pause and fix structural assignments before interpreting energetics.

## 6. Analyze pathway energetics and descriptors
- Rank competing steps by relative free-energy barriers and thermodynamic sinks using consistent reference states.
- Extract interpretable descriptors (electronic, steric, geometric, charge/spin) to explain barrier differences.
- Decompose trends into physical contributions where possible.
- **Decision gate — robustness_check**: If energy rankings change qualitatively under reasonable model variations (solvation, spin state, conformer treatment), treat conclusions as model-sensitive and stop broad claims.

## 7. Validate against controls and benchmarks
- Confirm positive/negative controls behave as expected.
- Benchmark against known experimental or computational trends before extrapolating.
- Check confounding factors: solvent, entropy, counterions, aggregation, conformational diversity, or electronic-state changes.
- **Decision gate — functional_validation**: If controls fail or predictions contradict reliable independent evidence, reject or downgrade the hypothesis and proceed to iteration.

## 8. Classify conclusions and bound claims
- Label each claim as supported, ambiguous, or rejected.
- Separate kinetic preference from thermodynamic stability.
- Define boundary conditions: applicable catalyst class, substrate scope, reaction family, and mechanistic regime.
- **Decision gate — claim_bounding**: If a conclusion depends on a single unvalidated model or lacks orthogonal evidence, mark it speculative and do not generalize.

## 9. Iterate or redesign
- **If supported**: test boundary conditions by changing one design variable at a time; escalate to higher-fidelity validation only after robustness checks pass.
- **If ambiguous**: improve conformer sampling, solvation treatment, spin-state coverage, or method sensitivity analysis; return to Step 5.
- **If rejected**: revise the mechanistic map (Step 2), add missing pathways or alternative active species, and generate new hypotheses (Step 3).
- **Stop conditions**:
  - Catalyst regeneration is not plausible.
  - The active species is inaccessible under stated assumptions.
  - A lower-energy off-cycle state dominates the landscape.
  - Descriptor trends are inconsistent across reasonable variants.
  - The user requests claims beyond the evidence (e.g., field-wide consensus or experimental readiness without validation).

# Output Format

Produce the following structured deliverables:

1. **Research question and boundary** — the mechanistic problem, reaction family, and scope limits.
2. **Evidence map** — known observations, assumptions, and confidence level for each.
3. **Hypotheses table** — proposed mechanism, controlling variable, predicted outcome, evidence strength, key assumption, and likely failure mode.
4. **Mechanistic scaffold** — shared intermediate, competing branches, and proposed selectivity determinant.
5. **Minimal validation plan** — candidate matrix, controls (positive, negative, mechanistic, robustness), primary metrics, and stop conditions.
6. **Analysis plan** — reaction-network construction, transition-state validation, energy comparison, descriptor extraction, and visualization.
7. **Iteration triggers** — rules for strengthening, weakening, or replacing each hypothesis.
8. **Validity and safety statement** — non-operational safety boundary, uncertainty limits, and reproducibility requirements.

# Validation Gates

- **Mechanistic completeness**: The cycle must include substrate activation, productive steps, product release, and catalyst regeneration; off-cycle traps must be identified.
- **Transition-state connectivity**: Each transition state must connect intended minima; unvalidated connectivity blocks interpretation.
- **Control consistency**: Positive and negative controls must show expected qualitative behavior; otherwise, halt and reassess.
- **Model sensitivity**: Conclusions must survive reasonable changes in solvation, spin-state treatment, conformer sampling, and reference-state choices.
- **Descriptor causality**: Proposed descriptors must be chemically interpretable and consistent across multiple variants; correlation alone is insufficient.
- **Reproducibility**: Model choices, state definitions, variant logic, and analysis steps must be documented for independent rerun.

# Claim Boundaries

- Claims are strongest within the same reaction family, catalyst class, and mechanistic regime.
- Do not transfer conclusions to unrelated metals, substrates, or conditions without explicit validation.
- Computational energy rankings are model outputs, not experimental proof of activity or selectivity.
- Distinguish directly computed support from analogy-based or speculative extensions.
- Avoid claims of catalytic viability, scalability, safety, or environmental benefit from mechanism studies alone.

# Failure Modes

- **Incomplete pathway search**: A neglected low-energy competing route invalidates the preferred mechanism.
- **Model overfitting**: Descriptor trends rely on a single variant or an unjustified approximation.
- **Structural misassignment**: The optimized state relaxes into an unintended binding mode or spin state.
- **Confounding by medium**: Solvent, counterion, or aggregation effects reverse pathway rankings.
- **Resting-state misidentification**: The most stable intermediate is an off-cycle trap, not a productive precursor.
- **False extrapolation**: Mechanistic conclusions from one substrate or catalyst are applied to untested classes without boundary checks.

# Validity Checks

- Are all plausible pathways, intermediates, spin states, and charge states considered?
- Do transition states connect the intended minima, and are off-cycle traps identified?
- Is the proposed intermediate assignment supported by multiple electronic-structure descriptors?
- Are relative barriers compared using consistent reference states and comparable model choices?
- Could ligand simplification, solvation treatment, entropy approximation, or omitted coordination change the conclusion?
- Are trends based on enough variants to avoid overfitting, and are outliers discussed?
- Are paper-supported, model-supported, and speculative claims clearly separated?
- Does the recommendation identify a discriminating test rather than overclaiming certainty?

# Provenance

- Derived from cluster 1 / subcluster 1.0 (first-principles mechanism discovery and validation).
- Synthesized from source skills: transition-metal-ch-functionalization-mechanism-design (test1250), computational-pincer-catalysis-exploration (test0230), dft-mechanism-catalyst-exploration (test0814), computational-organometallic-catalyst-exploration (test1790), mechanism-guided-catalysis-exploration (test1905), organometallic-dft-selectivity-workflow (test1836), dft-guided-catalysis-mechanism-design (test1609), dft-catalysis-mechanism-exploration (test0686).
