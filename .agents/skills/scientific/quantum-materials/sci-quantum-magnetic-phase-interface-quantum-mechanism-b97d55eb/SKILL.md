---
name: sci-quantum-magnetic-phase-interface-quantum-mechanism-b97d55eb
description: A reusable end-to-end workflow for designing research questions, generating competing hypotheses, and validating mechanisms in quantum materials and related systems through convergent observables and controlled perturbations.
scienceevolve-title: "Quantum materials and condensed matter · magnetic phase interface quantum mechanism discovery workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Use this skill to transform a scientific observation or tuning-driven phenomenon into a transferable mechanism-discovery workflow. The goal is to help an agent propose research questions, generate competing hypotheses, design controlled validation plans, discriminate mechanisms through convergent evidence, and bound claims—without copying source-specific material systems, numerical conditions, or conclusions.

## When to use

Use this skill when the user asks for:

- new research questions in systems exhibiting emergent electronic, magnetic, or structural phases;
- hypothesis generation for tuning-driven phase evolution, transport anomalies, or interfacial phenomena;
- experimental or observational design around competing mechanisms;
- analysis plans that connect multiple observable classes such as transport, spectroscopy, imaging, symmetry analysis, or minimal modeling;
- iteration strategies for nonmonotonic, suppressed, reentrant, or crossover behavior.

Do not use this skill as a source of executable laboratory procedures, operational settings, or high-risk experimental parameters.

## Inputs required

Before generating a plan, ask for or identify:

- target system class and known or suspected active motifs (e.g., interfaces, layers, defects, anisotropic probes);
- relevant tuning axes such as pressure, strain, composition, gating, stacking, or field;
- target emergent phenomenon or phase;
- available observable classes and proxies;
- known reference systems and comparator conditions;
- user constraints including safety, compliance, and resource limits.

If key inputs are missing, state assumptions explicitly and label the resulting plan as provisional.

## Core Workflow

### Stage 1: Platform Decomposition & Gap Framing

1. Decompose the system into active motifs, mediating elements, and tuning-sensitive regions.
2. State what is unknown: phase stability, carrier evolution, symmetry change, coupling crossover, or competition between phases.
3. Flag any dependency on source-paper-specific assumptions; restate the gap generically if needed.

**Stop condition:** If the platform cannot be defined without source-specific conclusions, bound the plan as provisional and request more context.

### Stage 2: Mechanism Hypothesis Generation

1. Generate at least three competing hypotheses.
2. For each hypothesis record:
   - mechanism pathway;
   - key assumption;
   - predicted observable signatures across at least two independent observable classes;
   - evidence strength (strong / moderate / weak / speculative);
   - likely failure mode;
   - discriminating test or comparison.
3. Label claims as **observed/provided**, **inferred by analogy**, or **proposed for validation**.

**Gate A — Candidate Gate:** Are the hypotheses mutually distinguishable and falsifiable? If no, refine or split hypotheses before proceeding.

### Stage 3: Validation Design

1. Define the independent variable (tuning axis) and dependent variables (phase indicators, normal-state proxies, structural/symmetry proxies, reversibility metrics).
2. Design a minimal viable validation including:
   - baseline characterization;
   - negative control (condition expected to suppress the target mechanism);
   - positive control (condition that verifies the measurement pipeline);
   - orthogonal probe (independent observable class);
   - reversibility check;
   - reproducibility check across independent samples or runs.
3. Define success criteria, failure criteria, and explicit stop conditions.

**Gate B — Stability Gate:** Is the baseline reproducible and are controls conceptually sound? If no, stop and redesign controls.

### Stage 4: Evidence Alignment & Quality Audit

1. Collect observables from independent measurement classes.
2. Align all datasets to comparable states of the tuning axis; track metadata to distinguish reversible tuning from history effects.
3. Check for drift, degradation, calibration stability, and sample integrity.

**Stop condition:** If orthogonal probes contradict the phase assignment or datasets cannot be aligned, halt and diagnose artifacts before mechanism interpretation.

### Stage 5: Mechanism Discrimination

1. Map the tuning trajectory into regimes rather than fitting a single monotonic trend.
2. Compare predictions against observations for each hypothesis.
3. Test alternative explanations including disorder, strain, degradation, measurement artifacts, and single-probe bias.
4. Rank mechanisms by cross-modal consistency, not by a single observable.

**Gate C — Mechanism Exclusion Gate:** Do controls exclude the leading alternative explanations? If no, add discriminating tests or weaken claims.

### Stage 6: Claim Bounding & Iteration

1. Update the evidence matrix: promote, demote, or pivot hypotheses based on convergent evidence.
2. Reduce claim strength if structural evidence is ambiguous or data rely on a single probe.
3. Define the next discriminating measurement or stop.

**Gate D — Robustness Gate:** Is the surviving mechanism supported by convergent evidence from at least two independent observable classes? If no, bound the claim as provisional.

**Gate E — Iteration Gate:** If ambiguity remains and a safe, feasible discriminating test exists, loop to Stage 3 with revised hypotheses. Otherwise, finalize the bounded claim and state caveats.

## Output Format

When using this skill, produce:

1. **Research question** — concise question, system scope, and scientific motivation.
2. **Gap and mechanism map** — known evidence, inferred mechanisms, key assumptions, boundary conditions.
3. **Ranked hypotheses** — at least three hypotheses with evidence strength, predicted signatures, and failure modes.
4. **Validation plan** — variables, control table, success/failure/stop criteria.
5. **Analysis plan** — regime mapping, cross-modal comparison, artifact checks, decision rules for promoting/demoting/pivoting.
6. **Iteration recommendation** — next discriminating test, hypothetical result that would change the hypothesis, confidence level and caveats.
7. **Claim boundaries** — explicit statement of what is observed, inferred, or speculative.
8. **Failure modes** — plausible failure modes and mitigations for the proposed study.

## Validation Gates

- **Gate A — Candidate Gate:** Hypotheses must be mutually distinguishable and falsifiable before validation begins. Revisit Stage 2 if they are not.
- **Gate B — Stability Gate:** Baseline reproducibility and control integrity must be confirmed before mechanism interpretation. Stop if they fail.
- **Gate C — Mechanism Exclusion Gate:** Alternative explanations must be actively excluded by controls or orthogonal evidence. Add tests if exclusion is incomplete.
- **Gate D — Robustness Gate:** Mechanism claims require convergent support from at least two independent observable classes. Downgrade to provisional if unsupported.
- **Gate E — Iteration Gate:** Continuation requires a defined, safe discriminating test; otherwise, claims are bounded and finalized.

## Claim Boundaries

- **Observed:** Directly measured trends under reported conditions.
- **Inferred:** Mechanisms supported by multiple observables but not directly proven.
- **Speculative:** Extensions to new materials, parameters, or conditions without direct evidence.
- Never treat a single-system result as field-wide consensus.
- Never transfer source-paper numerical conditions or operational settings to new systems.
- Distinguish response-law evidence from microscopic mechanism evidence unless independent structural proof exists.

## Failure Modes

- **Non-reproducible signature:** Primary effect absent across independent samples or runs. Mitigate by requiring reproducibility controls before mechanism claims.
- **Single-probe artifact:** Conclusion relies on one observable class without orthogonal confirmation. Mitigate by mandating cross-modal evidence.
- **Confounding by disorder/strain/degradation:** Tuning axis co-varies with uncontrolled structural damage. Mitigate by structural and reversibility controls.
- **Mechanism underdetermination:** Multiple hypotheses explain the same dataset equally well. Mitigate by designing model-discriminating regimes.
- **Overfitting:** Hybrid mechanism introduces untestable variables. Mitigate by requiring independent testability for each added variable.
- **Boundary violation:** Claim extrapolated beyond validated tuning regime or sample class. Mitigate by explicit boundary statements.

## Validity Checks

Before finalizing output, check:

- Are source-paper observations separated from agent-inferred mechanisms?
- Are all hypotheses labeled with evidence strength, key assumptions, and failure modes?
- Does the design include minimal viable validation, strong controls, and stopping conditions?
- Are confounders considered, including sample quality, geometry, drift, degradation, calibration, inhomogeneity, and single-probe artifacts?
- Are extrapolations to other systems marked as hypotheses rather than consensus?
- Does the output avoid operational recipes, hazardous protocols, and unsupported numerical parameters?
- Is the plan safe, ethical, and compliant with applicable research governance?

## Provenance

- Derived from cluster 3 / subcluster 3.0 ("observable-driven mechanism discovery and validation").
- Synthesized from source skills: layered-quantum-materials-tuning-workflow, vector-field-self-organization-research, layered-tmd-intercalation-research-workflow, tip-enhanced-vibrational-nanoimaging-research, polymer-knot-dynamics-research-design, magnetic-torque-probe-research-planning, magnetic-compensation-workflow, luminescent-halide-structure-property-exploration.
