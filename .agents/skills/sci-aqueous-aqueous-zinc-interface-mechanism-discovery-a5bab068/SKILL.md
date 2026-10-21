---
name: sci-aqueous-aqueous-zinc-interface-mechanism-discovery-a5bab068
description: A reusable end-to-end workflow for transforming performance gaps in aqueous zinc and related metal battery interfaces into testable mechanism hypotheses, discriminating validation plans, and bounded, evidence-ranked claims.
scienceevolve-title: "Aqueous battery interfaces · aqueous zinc interface mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Help an agent turn an observed performance gap in aqueous zinc or related aqueous metal battery systems into a mechanism-driven research plan. The goal is to generate testable hypotheses, design minimal validation experiments with strong controls, analyze results as causal chains, and iterate until claims are supported by convergent evidence or explicitly bounded by failure modes.

# When to use

Use this skill when a user asks to:

- Propose new research questions for aqueous metal batteries, zinc-based energy storage, or reactive metal/electrolyte interfaces.
- Translate a performance limitation—such as reversibility, stability, efficiency, or rate capability—into testable mechanistic hypotheses.
- Design a minimum viable validation plan with baseline, positive, negative, and single-factor controls.
- Evaluate whether an interfacial or additive effect is mechanistically supported or only an empirical performance increase.
- Iterate after ambiguous, contradictory, or trade-off-laden results.

Do not use this skill for operational laboratory execution, clinical decisions, biological safety judgments, or unrelated experimental domains.

# Inputs required

Before generating a plan, obtain or infer:

- Target system class, such as metal anode, electrolyte family, and counter electrode or full-cell context.
- Dominant failure mode or performance gap, for example nonuniform deposition, corrosion, side reactions, or poor reversibility.
- Candidate intervention concept at a functional level, such as an additive, coating, interphase, electrolyte modifier, or substrate motif.
- Available diagnostic categories, including electrochemical, structural, spectroscopic, microscopic, or modeling approaches.
- Benchmark and negative-control concepts in the same research family.
- Application constraints and non-operational safety boundaries.

If any input is missing, state assumptions explicitly, label conclusions as provisional, and avoid transferring source-paper conditions to the new system.

# Core Workflow

Follow this ordered end-to-end route. Treat each gate as a hard stop or redesign trigger.

1. **Gap Diagnosis & Scope Bounding**
   - Define the performance gap as a reversible process being lost competing against an irreversible pathway.
   - Identify the likely bottleneck stage: bulk transport, interfacial conversion (desolvation, adsorption, charge transfer), or nucleation and growth.
   - State boundary conditions, including chemistry class, operating regime, and what is out of scope.
   - *Gate 1: Stop if the gap is not linked to a measurable electrochemical or physicochemical endpoint.*

2. **Mechanism Hypothesis Generation**
   - Propose candidate mechanisms that explain the gap.
   - For each, write an if-then causal chain: If [intervention] provides [function], then [mechanistic descriptor] changes, producing [signature], leading to [performance or stability outcome].
   - Rank hypotheses by evidence strength: strong, moderate, weak, or speculative.
   - Annotate key assumptions, predicted positive and negative signals, likely failure modes, and the smallest decisive test.
   - Explicitly separate: paper-supported principles, system-specific inferences, and unverified assumptions.
   - *Gate 2: Stop if a hypothesis lacks at least one falsifying observation or independent mechanism readout.*

3. **Minimal Viable Validation Design**
   - Define comparison groups: baseline, candidate intervention, single-function comparator, negative control (inactive analogue), and positive or benchmark control.
   - Select at least one mechanistic metric and one downstream performance metric per hypothesis.
   - Define stop conditions before testing, such as: controls fail to bracket expected behavior; the effect depends on only one measurement mode; or replicate variability prevents distinguishing mechanism from noise.
   - *Gate 3: Stop and redesign if the intervention cannot be distinguished from a single-factor or artifact effect.*

4. **Evidence Collection & Causal Chain Analysis**
   - Check data integrity—normalization, comparability, outliers, drift—before interpretation.
   - Analyze results as a stage-by-stage causal cascade: supply and transport → interfacial conversion → growth and morphology → device-level outcome.
   - Use orthogonal evidence to link the intervention to a mechanistic signal, and the mechanistic signal to performance and stability.
   - Quantify trade-offs: report gains in one metric alongside losses in efficiency, rate behavior, or cycling stability.
   - *Gate 4: If the mechanistic proxy changes but the downstream metric worsens, or vice versa, flag a bottleneck shift or broken causal link and add diagnostics.*

5. **Evidence Classification & Claim Bounding**
   - Assign evidence strength:
     - **Strong:** reproducible performance plus consistent mechanistic and stability evidence with strong controls.
     - **Moderate:** reproducible performance with partial mechanistic support.
     - **Weak:** performance trend without adequate controls.
     - **Speculative:** plausible mechanism without target-system validation.
   - State claim boundaries: specify which claims are limited to the tested electrode/electrolyte pair and which may cautiously generalize.
   - *Gate 5: Do not advance to broader claims until at least two independent evidence types support the same mechanism.*

6. **Iteration or Redesign**
   - Use the dominant failure mode to choose the next step:
     - Performance improves without mechanism support → add attribution controls.
     - Mechanism signal appears without performance gain → inspect transport, utilization, or device-level bottlenecks.
     - One bottleneck is relieved → immediately inspect the next stage for a newly exposed limitation.
     - Trade-offs appear → treat them as mechanistic information for the next hypothesis.
   - Update the hypothesis table: strengthen, narrow, abandon, or reformulate based on evidence.
   - *Gate 6: Archive or deprioritize a hypothesis if a decisive control or boundary condition falsifies it.*

7. **Final Synthesis & Reporting**
   - Compile the research question, gap diagnosis, hypothesis table, validation plan, analysis plan, iteration log, and validity notes.
   - Distinguish claims as verified in the target system, inferred from related systems, or unsupported/speculative.
   - *Gate 7: Stop if safety, stability, or compliance constraints are violated, or if claims exceed tested boundary conditions.*

# Output Format

Each use of this skill should return:

1. **Research question** — concise problem statement and scope boundary.
2. **Gap diagnosis** — likely bottleneck stage and supporting evidence.
3. **Hypothesis table** — mechanism, evidence strength, key assumptions, predicted signals, failure modes, minimal test, and go/no-go criteria.
4. **Validation plan** — groups, controls, primary and secondary metrics, and stop conditions.
5. **Analysis plan** — causal order, orthogonal evidence to collect, decision rules, and trade-off quantification.
6. **Iteration plan** — update rules for supported, partially supported, unsupported, and inconclusive outcomes.
7. **Validity and safety notes** — confounders, reproducibility needs, boundary conditions, and non-operational safety constraints.

Always distinguish:
- `Verified in target system`
- `Inferred from related systems`
- `Unsupported or speculative`

# Validation Gates

Before advancing, confirm:

- **Gap-to-mechanism linkage:** The performance gap is tied to a specific electrochemical or physicochemical endpoint.
- **Falsifiability:** Each hypothesis identifies an observation that would weaken or reject it.
- **Control adequacy:** Baseline, single-factor, negative, and benchmark controls are included.
- **Mechanistic specificity:** The intended effect can be distinguished from incidental processing, morphology changes, or measurement artifacts.
- **Convergent evidence:** At least two independent diagnostics are required before advancing a claim.
- **Trade-off transparency:** Gains are reported alongside any losses in efficiency, stability, or rate capability.
- **Reproducibility:** Repeated measurements or uncertainty estimates are required for decisive claims.
- **Boundary respect:** Claims are confined to the tested chemistry, architecture, and operating regime.

# Claim Boundaries

- Distinguish observations (what was measured), mechanisms (what is inferred), and predictions (what remains untested).
- Label every claim as `Verified in target system`, `Inferred from related systems`, or `Unsupported or speculative`.
- Do not generalize from a single material system to the entire field.
- Do not infer full-device readiness, safety certification, or commercial viability from component-level evidence.
- Treat single-paper or single-system results as bounded evidence, not as domain consensus.

# Failure Modes

- **Unfalsifiable hypothesis:** The proposed mechanism cannot be distinguished from a null or artifact effect.
- **Bottleneck shift:** Relieving one limitation exposes another (for example, transport improves but interfacial resistance worsens).
- **Trade-off concealment:** A single metric improves while efficiency, stability, or safety degrades without mechanistic explanation.
- **Control inadequacy:** Positive or negative controls fail to bracket expected behavior, or process controls explain the improvement.
- **Confounding dominance:** Loading, morphology, impurities, or measurement protocol explain the result better than the proposed mechanism.
- **Extrapolation overreach:** Claims extend beyond the tested chemistry, cell format, or operating window.
- **Reproducibility breakdown:** Replicate variability prevents distinguishing mechanism from noise.

# Validity Checks

Before finalizing a research plan or interpreting results, check:

- **Confounding factors:** electrode mass loading, surface area, porosity, conductivity, binder and current collector effects, electrolyte volume, cell geometry, counter-electrode limitations, and impurities.
- **Mechanistic ambiguity:** A single electrochemical signature alone does not prove the proposed mechanism.
- **Normalization consistency:** Metrics are compared on the same basis without selective switching to favor one result.
- **Statistical validity:** Small differences are not ranked without variability, replicate structure, or appropriate uncertainty reporting.
- **Ex situ artifacts:** Final-state characterization may misrepresent transient interfacial states.
- **System compatibility:** Anode-side improvements may create cathode cross-talk, separator incompatibility, or new side reactions.
- **Literature framing:** Source papers are treated as motivating examples, not as field-wide consensus.

# Provenance

- Synthesized from cluster `8.1` (`observable-driven mechanism discovery and validation`) of the Codex scientific skills corpus.
- Derived from source skills: `supercapacitor-redox-additive-research-workflow`, `mixed-chemistry-interface-research`, `aqueous-rechargeable-battery-exploration`, `zinc-interface-energy-cascade-research`, `aqueous-zinc-battery-research-workflow`, `precursor-templated-electrode-design`, `interface-modulation-zhsc-electrode-research`, `aqueous-metal-interface-research`.
- Paper-specific materials, numerical results, and operational protocols have been removed; only the transferable workflow structure is retained.
