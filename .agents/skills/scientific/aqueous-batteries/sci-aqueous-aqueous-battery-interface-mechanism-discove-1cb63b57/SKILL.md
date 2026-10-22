---
name: sci-aqueous-aqueous-battery-interface-mechanism-discove-1cb63b57
description: A reusable end-to-end workflow for generating hypotheses, designing controlled validation plans, and iterating on mechanism discovery for aqueous battery interfaces where electrochemical degradation is coupled to interfacial structure and transport.
scienceevolve-title: "Aqueous battery interfaces · aqueous battery interface mechanism discovery workflow 2"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Transform an aqueous battery interface problem into a mechanism-grounded, testable research plan. This skill guides hypothesis generation, non-operational experimental design, multi-modal evidence analysis, and iterative refinement. It preserves scientific reasoning patterns without copying specific material recipes, operational protocols, or single-study conclusions.

# When to use

Use this skill when the user asks for:
- New research questions, hypotheses, or mechanism validation plans for aqueous battery interfaces (e.g., metal anodes, cathodes, electrolytes, separators).
- A framework to design interfacial modifications, solvation regulation, or deposition control strategies.
- Analysis plans that link electrochemical performance to structural, chemical, or transport mechanisms.
- Iteration strategies after mixed, negative, or inconclusive results.

Do not use this skill to generate executable laboratory protocols, high-risk operational parameters, or clinical/biological advice. Do not treat single-paper results as field-wide consensus.

# Inputs required

Before generating a plan, collect or infer:
- **Target system and component**: electrode, electrolyte, separator, or full-cell configuration.
- **Dominant failure mode**: dendritic growth, corrosion, parasitic reactions, interfacial instability, poor reversibility, or coupled degradation.
- **Candidate intervention class**: interface modifier, additive, solvation regulator, protective layer, or architectural change (if any).
- **Available evidence**: literature context, preliminary data, computational predictions, or characterization capabilities.
- **Application level**: fundamental interface study, half-cell screening, or full-cell relevance.
- **Safety and compliance boundaries**: non-operational design constraints, institutional review requirements, and environmental considerations.
- **Output priority**: hypothesis generation, experimental schema, analysis plan, iteration strategy, or complete research proposal.

# Core Workflow

Follow this ordered end-to-end route. At each numbered stage, apply the decision gate before proceeding. If a gate fails, iterate or stop as indicated.

## 1. Failure network mapping
Map the coupled degradation loop: bulk electrolyte structure → interfacial chemistry → ion transport/deposition → morphology evolution → device-level performance. Identify the bottleneck node most likely to control reversibility under target conditions.
- **Decision gate**: Is the bottleneck interfacial or coupled to interface-mediated transport? If the problem is purely bulk electronic conductivity with no interfacial component, flag a scope mismatch and stop or redirect.

## 2. Hypothesis generation
Generate a ranked set of 3–5 hypotheses in this order:
1. **Failure diagnosis**: the limiting process (transport, nucleation, side reaction, impedance, mechanical stress).
2. **Mechanism proposal**: the primary interfacial function that should interrupt the failure loop (e.g., flux homogenization, chemical protection, dynamic stabilization).
3. **Synergy/trade-off**: if combining functions, state the expected non-additive signature or predicted penalty.
4. **Boundary hypothesis**: conditions where the mechanism should fail (high rate, long cycle, alternate chemistry, full-cell mismatch).
5. **Alternative hypothesis**: a competing non-interfacial explanation that must be ruled out.

For each hypothesis, define: evidence strength (weak/moderate/strong), key assumptions, falsifiable prediction, likely failure mode, and minimum validation required.
- **Decision gate**: Are all hypotheses falsifiable and linked to a mechanism marker? If not, reformulate until each has a discriminating test.

## 3. Validation schema design
Design a non-operational, staged validation plan:
- **Variables**: define independent (intervention class, architecture), mediating (flux uniformity, solvation structure, interfacial stability), and dependent (reversibility, morphology, retention) variables at the conceptual level only.
- **Controls**: baseline (unmodified), negative (function-absent), positive/benchmark (established comparator when appropriate), and orthogonal/mechanistic (isolates one causal pathway).
- **Tiers**:
  - *Minimal viable validation*: baseline + intervention + one mechanism-isolating control + pre/post interface characterization + electrochemical diagnostic.
  - *Strong validation*: add replicates, state-resolved interfacial measurements, full-cell or practical-configuration check, and sensitivity to stress conditions.
- **Stop conditions**: define before execution. Stop if the intervention improves one metric while severely worsening another; if half-cell gains disappear at the device level; if the mechanism marker does not change; if controls fail; or if uncontrolled variables dominate.

- **Decision gate**: Do controls isolate the proposed mechanism from confounders (dilution, loading, impurities, protocol differences)? If not, redesign controls.

## 4. Evidence collection and analysis
Analyze results in causal order:
1. **Interface verification**: confirm the intended interface exists, is stable, and changes as predicted.
2. **Descriptor check**: verify the target interfacial property (e.g., wetting, speciation, field distribution) changed relative to baseline.
3. **Kinetic/transport linkage**: connect interfacial changes to charge-transfer, diffusion, or polarization metrics.
4. **Morphology and chemistry**: compare pre-, in-, and post-operation structure; link to electrochemical signatures.
5. **Performance and reversibility**: assess efficiency, retention, and failure onset.
6. **System relevance**: test whether component-level gains translate to the full cell or practical configuration.

Build an evidence matrix that records mechanism evidence, performance evidence, control evidence, and unresolved ambiguity for each hypothesis.
- **Decision gate**: Do at least two independent evidence classes converge on the same mechanism? If only one metric improves, classify as unresolved and do not proceed to claim.

## 5. Mechanism discrimination and claim bounding
Classify the outcome:
- **Supported**: mechanism and performance improve; controls bracket the effect; multi-modal evidence aligns.
- **Partially supported**: one evidence stream improves while another is ambiguous.
- **Refuted**: intervention fails under controls or contradicts the predicted mechanism.
- **Inconclusive**: artifacts, poor normalization, or missing controls prevent interpretation.

Update evidence strength. Explicitly exclude alternative explanations using control comparisons. State the boundary conditions where the claim holds.
- **Decision gate**: Does the evidence support a specific causal mechanism, or only a correlation? If correlation only, downgrade the claim and require a discriminating follow-up.

## 6. Iteration or redesign
Route the next step based on the classification:
- **If supported**: escalate to stronger validation (practical configuration, longer duration, broader boundary test).
- **If partially supported**: redesign to isolate the missing variable (add orthogonal controls, change one lever at a time).
- **If refuted**: abandon or substantially revise the mechanism; test an alternative hypothesis from the ranked set.
- **If inconclusive**: improve reproducibility, add replicates, and tighten control matching before re-testing.

**Global stop conditions** (terminate the workflow):
- The combined intervention fails to outperform relevant single-function controls.
- Morphology or chemical stability degrades despite average metric improvement.
- Full-cell validation consistently contradicts component-level results.
- The interface is unstable, sacrificial, or evolves into a degrading state.
- Results depend on uncontrolled or unreported variables.
- Safety, compliance, or ethical boundaries are violated.

## 7. Synthesis and archival
Compile:
- Research question and mechanism map.
- Ranked hypotheses with final evidence strength.
- Evidence matrix and control table.
- Iteration log showing what was tested, what changed, and why.
- Claim boundary statement limiting generalizability.
- Clear separation of paper-supported patterns from new-system inferences.

# Output Format

Return results in this structure:

1. **Research question** — One-sentence question tied to a failure mode and component.
2. **Mechanism map** — Bottleneck, proposed causal pathway, expected intermediate signal, and expected battery-level outcome.
3. **Ranked hypotheses** — Table with hypothesis statement, evidence strength, key assumptions, predicted observation, likely failure mode, and minimum validation.
4. **Experimental design schema** — Variables, control set (baseline, negative, positive/benchmark, orthogonal), minimal viable validation, strong validation upgrades, and predefined stop conditions.
5. **Analysis plan** — Evidence matrix template, required comparisons, mechanism-to-metric decision rules, and alternative explanations to flag.
6. **Iteration log template** — Decision rules for supported, partial, refuted, and inconclusive outcomes; next experiment recommendation.
7. **Validity and safety notes** — Confounders, reproducibility requirements, boundary conditions, and non-operational safety constraints.
8. **Evidence boundary** — Explicit labeling of what is paper-supported pattern versus new agent inference.

# Validation Gates

Before advancing between stages, confirm:
- **Falsifiability check**: Every hypothesis has a defined result that would refute it.
- **Control adequacy check**: The design includes baseline, negative, and mechanism-isolating controls matched for loading, geometry, and protocol context.
- **Mechanistic specificity check**: The planned measurements can distinguish the proposed mechanism from dilution, transport penalty, impurity effects, or measurement artifacts.
- **Convergence check**: At least two independent evidence classes are required to upgrade a claim.
- **Reproducibility check**: Replicates or variance estimates are planned for key comparisons.
- **Full-cell relevance check**: Device-level claims are supported by practical-configuration testing, not extrapolated from half-cell diagnostics alone.
- **Safety/ethics check**: The plan remains at the research-design level and respects institutional safety and environmental boundaries.

# Claim Boundaries

- Do not present single-study or single-system evidence as field-wide consensus.
- Distinguish paper-supported reasoning patterns from new-system agent inferences.
- Do not extrapolate from simplified diagnostic tests to commercial readiness, consumer safety, or deployment viability.
- State electrolyte chemistry, stress regime, cell architecture, and material-family boundaries where the hypothesis may fail.
- Label evidence strength honestly: weak (plausible but unverified), moderate (partial controls), strong (multi-modal, controlled), robust (replicated, device-relevant, boundary-tested).

# Failure Modes

Ways the workflow or research plan can fail or mislead:
- **Single-metric overfitting**: Improved Coulombic efficiency or capacity retention without mechanistic evidence does not validate the proposed interface function.
- **Confounding dominance**: Uncontrolled surface roughness, impurities, separator effects, counter-electrode reactions, or protocol differences produce apparent improvement.
- **False synergy**: A composite intervention appears superior only because it dilutes the active component or introduces a transport penalty that masks a side reaction.
- **Mechanism misattribution**: Performance gains stem from an unmeasured variable (e.g., pH shift, water activity change) rather than the intended interfacial regulation.
- **Premature escalation**: Advancing to full-cell or practical claims before component-level mechanism and controls are firm.
- **Boundary violation**: Generalizing a mechanism beyond the tested chemistry, rate, loading, or cycle window.

# Validity Checks

Apply these checks before finalizing any plan or conclusion:
- **Confounding**: Could surface state, electrolyte impurities, separator properties, temperature, or cell assembly explain the result?
- **Reproducibility**: Are independent repeats, replicate cells, or variance reports included?
- **Statistical validity**: Are comparisons matched, metrics normalized consistently, and small-sample trends treated as preliminary?
- **Boundary conditions**: Are the limits of the hypothesis stated for electrolyte class, electrode family, rate, loading, temperature, and cell format?
- **Practical relevance**: Are energy-density, scalability, or device-level estimates based on all relevant components, not only the modified electrode?
- **Safety and ethics**: Are outputs confined to non-operational research design? Are hazards, waste, and compliance constraints acknowledged without providing executable hazardous procedures?

# Provenance

Derived from Codex cluster 44.1 (observable-driven mechanism discovery and validation) and synthesized from the following source skills:
- `interface-regulated-metal-deposition-research` (8e0b9e0b781a19f6)
- `dynamic-interphase-research-workflow` (55e34b227c8cb0ec)
- `zinc-electrolyte-research-pattern` (Adv Funct Materials - 2024 - Song)
- `zinc-ion-battery-research-design` (3654ba7c46fdcdf2)
- `interface-regulated-electrochemical-exploration` (9912e0e88a2c163d)
- `interfacial-solvation-zinc-battery-research` (64069acec223fcdf)
- `aqueous-mn-oxide-battery-exploration` (4fb467465d667f33)
- `aqueous-metal-battery-interface-exploration` (66c7576e9a6a15c2)

Source-specific materials, additive identities, numerical parameters, and paper conclusions have been abstracted into this reusable workflow.
