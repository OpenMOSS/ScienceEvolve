---
name: sci-neuro-ising-stochastic-hardware-evidence-analysis-v-9f9a0a3c
description: A reusable end-to-end workflow for designing, validating, and auditing research claims in optimization, Ising, stochastic, and unconventional hardware systems, emphasizing observable-driven evidence and iterative claim bounding.
scienceevolve-title: "Neuromorphic computing and Ising optimization · ising stochastic hardware evidence analysis validation"
scienceevolve-area: neuromorphic-computing-and-ising-optimization
---

# Purpose

Help an agent generate transferable research questions, design validation studies, and audit claims for optimization, stochastic, and unconventional hardware systems. The workflow abstracts a reusable pattern: identify a controllability or benchmark gap, map it to a testable abstraction, validate through layered controls and staged evidence, and bound claims by rigorously separating mechanism from implementation artifact.

# When to use

Use this skill when proposing research questions or experiments in combinatorial optimization, energy-minimization solvers, stochastic or probabilistic hardware, analog/neuromorphic/optical computing substrates, Ising-style machines, QUBO accelerators, constraint-satisfaction dynamics, or hardware–algorithm co-design. It applies to both simulation-based and prototype-based studies, provided the goal is research design rather than operational deployment.

Do not use this skill to provide fabrication recipes, device-operation procedures, hazardous experimental parameters, or safety-critical deployment guidance.

# Inputs required

Before producing a proposal, ask for or infer:

- **Target problem class** and computational objective (e.g., inference, sampling, optimization, control).
- **Candidate abstraction or platform family**, described at a non-operational level.
- **Available validation environment** (simulator, emulator, benchmark suite, or prototype access).
- **Baseline methods** and their implementation maturity.
- **Resource constraints** (time, energy, memory, calibration budget, or sample complexity).
- **Claim level** intended: mechanism hypothesis, benchmark design, scalability study, or application study.
- **Safety, ethics, and compliance boundaries** relevant to the domain.

If inputs are missing, state assumptions explicitly and mark the output as provisional.

# Core Workflow

1. **Frame the gap.**  
   Identify a missing capability, bottleneck, or benchmark gap. State it as a narrow, testable research question—not as established consensus.  
   - *Stop*: If the gap cannot be operationalized into an observable comparison, reformulate or stop.

2. **Formulate mechanism hypotheses.**  
   Generate 2–5 hypotheses linking a proposed mechanism to an expected observable outcome. For each, specify evidence strength (paper-validated, transferable, inferred, speculative), key assumptions, a minimal falsifying test, likely failure modes, and an extrapolation boundary.  
   - *Gate*: Hypothesis audit. Pass only if the hypothesis is falsifiable, resource-aware, and distinguishable from baseline explanations.

3. **Map to a shared abstraction.**  
   Express the target problem as an objective, iterative process, or decision loop. Preserve natural variable types and constraints. Identify the dominant operation that controls cost or behavior, and align it with candidate platform strengths without forcing unnatural encodings.  
   - *Gate*: Abstraction sanity. Stop if the mapping hides practical overhead such as conversion cost, memory movement, or calibration burden.

4. **Design minimal viable validation (MVV).**  
   Select the smallest experiment or simulation that can falsify the core hypothesis. Prefer controlled synthetic instances with known behavior before application-derived cases. Define independent, dependent, and nuisance variables upfront.  
   - *Gate*: MVV feasibility. Revise if correctness cannot be verified independently of the method under test.

5. **Layer controls and baselines.**  
   Include at minimum: a strong positive control (established method expected to succeed), a negative control (configuration that disables the key mechanism), a baseline (task without the proposed abstraction), an ablation (removing one component at a time), and a fairness control (matched implementation maturity).  
   - *Gate*: Control adequacy. Stop if negative controls mimic the claimed signal, or if baselines are weaker than necessary for the problem class.

6. **Execute staged validation.**  
   Proceed in order:  
   a. Validate primitive or node-level behavior before composed or network-level behavior.  
   b. Validate in simulation or digital twin before physical or operational implementation.  
   c. Validate on easy/tractable instances before hard or real-world structured instances.  
   - *Gate*: Stage pass/fail. If primitives fail, diagnose representation or calibration. If simulation and physical results diverge, treat the implementation gap as a central finding. If easy instances fail, do not escalate.

7. **Analyze observable evidence.**  
   Verify final-state correctness independently of search trajectory or training process. Separate outcome success from mechanism support. Separate algorithmic effects from implementation or hardware-specific effects. Analyze instance families (easy, hard, infeasible) separately rather than pooling. Propagate uncertainty from seeds, calibration, and reconstruction assumptions. Label every conclusion as observed, inferred, or speculative.  
   - *Gate*: Mechanism discrimination. Pass only if ablations and controls support the proposed explanation over confounds.

8. **Iterate and update.**  
   Based on stage results:  
   - If supported: narrow the claim boundary and proceed to escalation.  
   - If contradicted: diagnose whether the cause is representation, initialization, numerical error, model misspecification, or hidden constraints. Downgrade evidence strength accordingly.  
   - If ambiguous: redesign the readout or add diagnostic variables before repeating.  
   - *Stop*: If strong controls repeatedly contradict the core mechanism, abandon or redesign the direction.

9. **Escalate complexity incrementally.**  
   Increase only one dimension at a time (problem size, graph complexity, resource dimension, depth, noise level, or task class). Repeat MVV and controls at each step.  
   - *Stop conditions*: Halt when fidelity or success probability degrades irreversibly; when resource overhead grows faster than benefit; when results are not reproducible after recalibration; when a generality claim rests on a single narrow benchmark; or when safety or compliance boundaries would be crossed.

10. **Audit and bound claims.**  
    Produce a final claim-boundary statement separating paper-verified evidence from transferable inference, agent-inferred findings, and speculative extensions. Explicitly state boundary conditions (problem class, scale, platform, noise regime). Document negative findings and failure modes. Never present a single demonstration as field-wide consensus.

# Output Format

When using this skill, produce:

1. **Research question** and controllability/benchmark gap.
2. **Ranked hypotheses table** with evidence strength, key assumptions, failure modes, and boundaries.
3. **Shared abstraction mapping** and dominant-operation analysis.
4. **Experimental design** with MVV, variables, layered controls, metrics, and stop conditions.
5. **Staged validation report** with stage-gate outcomes.
6. **Analysis plan** including correctness checks, mechanism/implementation separation, uncertainty propagation, and evidence labels.
7. **Iteration plan** with decision rules for support, contradiction, or ambiguity.
8. **Final claim-boundary statement** and audit trail.

# Validation Gates

- **Hypothesis audit:** Hypotheses must be falsifiable, resource-aware, and distinguishable from baseline or classical explanations.
- **Abstraction sanity:** The mapping must not hide practical overhead (conversion, memory movement, calibration) or force unnatural encodings.
- **MVV feasibility:** The minimal experiment must allow independent verification of correctness and a clear path to falsification.
- **Control adequacy:** Negative controls must not mimic the claimed signal; baselines must be strong and fairly tuned for the problem class.
- **Stage pass/fail:** Primitives must pass before composition; simulation must align with physical behavior before scaling; easy instances must pass before hard instances.
- **Mechanism discrimination:** Ablations and diagnostics must support the proposed mechanism over confounding factors such as initialization, numerical precision, or instance structure.
- **Escalation readiness:** Bounded success must be reproducible across seeds, recalibrations, and multiple instances before increasing complexity.

# Claim Boundaries

- **Paper-verified:** Mechanism or behavior demonstrated in prior peer-reviewed evidence.
- **Transferable:** Plausible by analogy to related systems, but requiring new validation.
- **Inferred:** Agent-proposed for the new problem; supported by study design but not yet tested.
- **Speculative:** Untested extension beyond current evidence.
- **Overgeneralization guard:** Never infer universal superiority, scalability, or domain-wide consensus from a single solver, benchmark family, platform, or demonstration.

# Failure Modes

- **Representation mismatch:** The abstraction or encoding does not preserve the intended problem structure or constraints.
- **Hidden overhead:** Conversion, memory movement, calibration, or synchronization costs negate the claimed advantage.
- **Confounding by implementation:** Differences in maturity, tuning, or measurement boundaries between the proposed method and baselines.
- **Initialization or seed sensitivity:** Results driven by undocumented starting conditions or random-number behavior rather than the mechanism.
- **Simulation–reality gap:** Continuous or idealized dynamics diverge from discrete or physical implementation without explicit treatment.
- **Reward or metric misalignment:** Optimized proxy diverges from the true scientific objective (reward hacking, shortcut policies).
- **Narrow benchmark overfitting:** Gains disappear on structurally different or application-derived instances.
- **Claim overreach:** Presenting inferred or speculative results as verified, or a single demonstration as universal consensus.

# Validity Checks

- **Confounding:** Are observation, preprocessing, reward, hardware, or numerical differences driving the result?
- **Reproducibility:** Are seeds, versions, instances, calibration states, and data transformations documented?
- **Statistical validity:** Are sample counts, uncertainty estimates, and convergence criteria appropriate for the claim?
- **Baseline fairness:** Are baselines strong, fairly tuned, and matched in implementation maturity?
- **Metric alignment:** Do runtime, quality, trajectory length, and efficiency metrics answer the same research question?
- **Boundary explicitness:** Are claims limited to the tested problem class, scale, platform, and noise regime?
- **Safety and ethics:** Does the plan avoid unsafe operational details, hazardous parameters, and high-risk autonomous deployment without human oversight?

# Provenance

- Synthesized from cluster **14.1** (optimization, Ising, stochastic, hardware).
- Source skills: `silicon-photonic-quantum-processor-research`, `hardware-belief-network-research-workflow`, `analog-fixed-point-research-design`, `rl-physics-research-workflow`, `constraint-dynamics-research-workflow`, `rl-benchmark-exploration-skill`, `ising-hardware-exploration`, `sat-fpga-exploration-workflow`.
- Paper-derived patterns are abstracted; no specific device parameters, materials, numerical results, or paper conclusions are preserved in the reusable workflow body.
