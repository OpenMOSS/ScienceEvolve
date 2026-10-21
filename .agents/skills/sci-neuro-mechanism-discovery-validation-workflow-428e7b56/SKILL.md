---
name: sci-neuro-mechanism-discovery-validation-workflow-428e7b56
description: A reusable end-to-end workflow for generating falsifiable mechanism hypotheses, designing controlled experiments, analyzing representation or dynamics, and iterating toward causal explanations in computational and physical systems.
scienceevolve-title: "Neuromorphic computing and Ising optimization · mechanism discovery validation workflow"
scienceevolve-area: neuromorphic-computing-and-ising-optimization
---

## Purpose

This skill guides an agent to design research programs that explain how a system processes information, computes, or adapts internally, rather than only benchmarking performance. The core method is to turn observed functional patterns into mechanism questions, then use controlled comparisons, interventions, ablations, and iterative validation to evaluate competing causal explanations.

## When to use

Use this skill when the user asks to:

- Propose mechanism-first research questions about why a system architecture, algorithm, or substrate works.
- Compare internal mechanisms across model families, physical substrates, or algorithmic variants.
- Design controlled experiments on information scope, dynamics, coupling, delay, topology, or transferability.
- Convert observed patterns into falsifiable hypotheses and follow-up studies.
- Plan validation for a new mechanism claim before large-scale experiments.

Do not use this skill for unrelated scientific domains, deployment certification, high-stakes decision support, clinical or operational intervention protocols, or claims that a system is reliable solely because its internal structure resembles another.

## Inputs required

Collect the following before designing a study:

- **Target system** and a meaningful contrast (baseline, canonical model, or known-bias system).
- **Task or domain family** and the reason the target is scientifically interesting.
- **Available access:** internal states (activations, gradients, weights), simulation parameters, intervention interfaces, or measurement modalities.
- **Data or input conditions:** scale, distribution, noise regime, and evaluation splits.
- **Candidate mechanism axes** (e.g., locality, globality, delay, coupling, pathway flow, representation structure).
- **Compute, reproducibility, and release constraints.**
- **Existing controls, baselines, or prior observations** that must be respected.

If any input is missing, state the gap and propose a minimal study that remains interpretable.

## Core Workflow

1. **Frame the Mechanism Question**
   - Start from a functional or behavioral puzzle: identify where systems behave similarly or differently without an understood cause.
   - Refuse performance equivalence as mechanism evidence; treat parity as motivation, not proof.
   - Define the gap: state what the canonical account omits or fails to explain.
   - **Decision Gate 1:** Is the question falsifiable, scoped, and answerable with available access? If not, refine or stop.

2. **Generate Competing Hypotheses**
   - Decompose the mechanism into testable axes (e.g., information scope, propagation pathway, timing, coupling, topology).
   - Produce at least two competing hypotheses. For each, create a hypothesis card:
     - Core claim and mechanistic model.
     - Predicted signatures (representation, dynamic, or behavioral).
     - Evidence strength, key assumptions, likely failure modes, and boundary conditions.
   - **Decision Gate 2:** Do the hypotheses make divergent predictions that can be distinguished by the proposed diagnostics? If not, redesign.

3. **Design Controlled Validation**
   - Define the unit of comparison (architectural variants, training regimes, intervention conditions, or substrate configurations).
   - Select variables: independent (mechanism factor, scale, topology), dependent (mechanism-matched metric, robustness), and nuisance (seed, initialization, preprocessing).
   - Specify controls:
     - Baseline control: established system with known behavior.
     - Negative control: condition where the mechanism should not help.
     - Positive control: condition where a related effect is expected.
     - Ablation control: remove or alter the suspected mechanism.
     - Fairness/matched control: hold capacity, budget, or implementation effort constant.
   - Define primary metrics tied to the mechanism (not only task performance).
   - Define secondary metrics and stop/failure criteria before running.
   - **Decision Gate 3:** Can the minimal viable experiment distinguish the mechanism from implementation artifacts, capacity effects, or shortcuts? If not, simplify or stop.

4. **Execute and Audit**
   - Run the minimal viable validation first.
   - Perform leakage and shortcut audits: test for trivial cues, symmetries, biases, or unintended structure that bypass the intended mechanism.
   - Verify that controls behave as expected.
   - **Decision Gate 4:** Do controls pass and shortcuts fail? If controls fail or shortcuts succeed, revise the design before scaling.

5. **Analyze and Attribute**
   - Verify prerequisites: confirm comparability of states, normalization, alignment, and measurement stability.
   - Map internal structure: identify uniform, staged, modular, or boundary patterns in representations or dynamics.
   - Quantify mechanism contribution using ablations, interventions, and information-scope diagnostics.
   - Assess robustness across seeds, samples, scales, and perturbations.
   - Classify each claim as supported, conditional, inconclusive, or refuted based on control outcomes.
   - **Decision Gate 5:** Does the evidence meet the threshold for causal attribution (isolated intervention plus passing controls), or only correlational support? Label accordingly.

6. **Iterate or Terminate**
   - **If supported:** Strengthen the claim, test a sharper boundary condition, and scale to harder tasks or more realistic deployment settings.
   - **If conditional:** Narrow the claim to the regime where evidence holds; design a boundary test.
   - **If inconclusive:** Add the smallest experiment that would separate tuning artifacts from mechanism failure; check implementation and metric choices.
   - **If refuted:** Reject the hypothesis, pivot to a competing mechanism, or stop.
   - **Stop conditions:** Terminate if the advantage disappears under fair baselines or ablations; if results depend on a single seed, initialization, or implementation detail; if the mechanism is present without effect or the effect is present without the mechanism; if safety or ethical concerns cannot be resolved.

## Output Format

When using this skill, produce:

1. **Research question:** Concise mechanism question and why it matters.
2. **Contrast system:** Baseline or canonical account used for comparison.
3. **Hypothesis cards:** At least two competing hypotheses, each with core claim, predicted signatures, evidence strength, key assumptions, failure modes, and boundary conditions.
4. **Experimental plan:** Variables, controls, primary and secondary metrics, minimal validation, and stop conditions.
5. **Analysis plan:** Diagnostics, robustness checks, scaling or sensitivity analysis, and evidence classification rules.
6. **Iteration plan:** How results will strengthen, weaken, pivot, or stop the program.
7. **Validity statement:** Confounders, reproducibility requirements, external-validity limits, and safety-relevant caveats.

## Validation Gates

- **Gate 1 — Falsifiability:** The question is scoped so that a possible result could reject the hypothesis.
- **Gate 2 — Discriminability:** Competing hypotheses predict different signatures on the chosen diagnostics.
- **Gate 3 — Minimal Viability:** The experiment can distinguish mechanism from artifact with available resources.
- **Gate 4 — Control Integrity:** Positive, negative, and ablation controls behave as expected, and shortcut audits find no trivial bypass.
- **Gate 5 — Causal Threshold:** Claims of causal contribution are supported by isolated interventions, not only correlation or representation similarity.
- **Gate 6 — Boundary Clarity:** Generalizations are explicitly limited to tested architectures, data regimes, scales, and task families.

## Claim Boundaries

- Do not claim universal superiority or field-wide consensus from a single benchmark, domain, or study.
- Do not equate performance parity with mechanism equivalence.
- Do not infer causation from representation similarity, decodability, or benchmark ranking alone.
- Do not generalize beyond tested system families, scales, input distributions, or task conditions.
- Do not certify reliability, safety, fairness, privacy, or deployment readiness from mechanism studies.
- Distinguish simulation-based evidence from hardware or real-device claims.
- Clearly separate source-paper-supported findings, domain-supported knowledge, and new agent inferences.

## Failure Modes

- Confounding by scale, training data, optimization dynamics, initialization, or preprocessing.
- Benchmark or instance selection bias; unfair budget or capacity mismatch across methods.
- Shortcut recovery: the target is achieved via trivial cues, symmetries, or leakage rather than the intended mechanism.
- Degeneracy, plateau, or trivial landscape effects masking true mechanism difficulty.
- Implementation confounding due to language, hardware, tuning effort, or solver-specific heuristics.
- Overfitting to a single ensemble, seed, problem family, or disorder distribution.
- Mechanism present without measurable effect, or effect present without the proposed mechanism.
- Readout ambiguity: internal changes are decodable but not causally linked to behavior.

## Validity Checks

Before presenting conclusions, verify:

- **Confounding:** Are differences explainable by nuisance variables rather than the proposed mechanism?
- **Comparability:** Are extraction points, layers, modules, conditions, or measurement settings aligned defensibly?
- **Measurement stability:** Are diagnostics stable across repeated samples, seeds, or minibatches?
- **Causality:** Does the study distinguish correlation from causal contribution via interventions or ablations?
- **Control integrity:** Do positive, negative, and ablation controls isolate the mechanism?
- **Statistical validity:** Are enough independent instances used; is uncertainty reported; are multiple comparisons handled?
- **Reproducibility:** Are model states, data splits, seeds, versions, extraction points, and analysis settings documented?
- **Scaling validity:** Are fitted trends stable, or driven by boundary sizes and failed runs?
- **Negative results:** Are null or conflicting findings reported rather than hidden?
- **External validity:** Is the conclusion framed as conditional on the tested system, data, and task family?

## Provenance

- Cluster 19.0: optimization-neural-network-representation-mechanism-discovery.
- Synthesized from: vision-representation-mechanism-exploration (2108.08810); scalable-neuromorphic-research-exploration (Kudithipudi); hidden-ground-truth-landscape-research (Barthel); spin-glass-heuristic-benchmark-research-design (10.1038_s41467-023-41108-w); neuromorphic-sensory-representation-research (10.1186_1471-2202-12-s1-p233); physics-inspired-optimization-benchmarking (Aramon); energy-minimizing-nanocomputing-vision-research (Sarkar); delay-aware-adaptive-network-research (10.3389_fphys.2018.01849).
