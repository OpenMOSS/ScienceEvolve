---
name: sci-catalysis-asymmetric-catalysis-mechanism-discovery-d6c452be
description: A reusable end-to-end workflow for designing, validating, and iterating falsifiable mechanistic hypotheses in asymmetric catalysis and chiral ligand discovery through structured controls, observable triangulation, and explicit claim bounding.
scienceevolve-title: "Asymmetric catalysis · asymmetric catalysis mechanism discovery workflow 6"
scienceevolve-area: asymmetric-catalysis
---

# Purpose

Guide research agents through observable-driven mechanism discovery and validation in asymmetric catalysis and chiral ligand or catalyst design. The skill converts broad performance gaps into falsifiable hypotheses, structures interpretable experiments with strong controls, and enforces evidence grading and claim bounding so that single-system observations are not overstated as field-wide rules.

# When to use

Use this skill when the user asks to propose new research questions, design ligand or catalyst libraries, plan substrate-scope studies, interpret structure-performance trends, or validate mechanistic hypotheses in asymmetric catalysis, enantioselective synthesis, or related molecular recognition systems.

Use it when the task requires non-operational research design, hypothesis generation, control architecture, or iteration planning.

Do not use this skill to provide executable laboratory protocols, hazardous operational parameters, step-by-step synthesis recipes, scale-up instructions, or clinical, environmental, or industrial deployment recommendations.

# Inputs required

Before generating a research plan, ask for or infer:

- Target transformation, binding event, or functional outcome and the stereochemical or mechanistic bottleneck.
- Candidate ligand or catalyst scaffold and its variable design axes (e.g., stereochemistry, sterics, electronics, coordination geometry).
- Desired improvement dimension: activity, selectivity, substrate scope, robustness, or mechanistic clarity.
- Known benchmark systems and their limitations.
- Available non-operational analytical readouts for structure, purity, conversion, selectivity, and reproducibility.
- Safety, ethics, environmental, and compliance constraints.
- Whether the goal is hypothesis generation, minimal validation, mechanism probing, or scope expansion.

# Core Workflow

1. **Gap Definition & Hypothesis Framing**
   - Convert the broad performance gap into a narrow, falsifiable research question focused on one interpretable design axis.
   - Formulate a primary mechanistic hypothesis, at least two alternatives, and an explicit failure hypothesis.
   - Label evidence strength (strong, moderate, weak, speculative), critical assumptions, and inference boundaries.
   - **Gate 1 — Falsifiability:** Proceed only if the question isolates one variable and every hypothesis states what result would falsify it.

2. **Control Architecture & Study Design**
   - Build a matched candidate set varying one design axis at a time around a constant core scaffold.
   - Define positive (benchmark), negative (missing the proposed feature), blank (no catalyst or achiral), and mechanistic (substrate or ligand variant testing a specific assumption) controls.
   - Pre-register primary endpoints (feasibility, activity, selectivity) and stop conditions (irreproducibility, ambiguous controls, safety breach).
   - **Gate 2 — Control Adequacy:** Stop if the design cannot isolate the intended variable or if critical controls are missing.

3. **Minimal Validation & Feasibility Test**
   - Evaluate a representative substrate or probe with the minimal candidate set against all controls.
   - Separate catalyst-dependent activity from background conversion.
   - **Gate 3 — Catalyst Dependence:** If no catalyst-dependent signal is observed, pivot to an alternative hypothesis or stop. If selectivity appears without activity, redesign the activation hypothesis before optimizing stereocontrol.

4. **Mechanistic Discrimination & Data Collection**
   - Collect structure-performance data across matched variants; map trends to steric, electronic, or geometric descriptors.
   - Use independent mechanistic probes (spectroscopic, kinetic, competition, or computational) to distinguish competing pathways.
   - Record failed, ambiguous, and outlier results explicitly.
   - **Gate 4 — Consistency:** If trends contradict the primary hypothesis, update the model or test the next-ranked alternative. If controls fail, pause interpretation and resolve analytical ambiguity before proceeding.

5. **Triangulation, Analysis & Evidence Grading**
   - Build a structure-performance table linking each design axis to activity, selectivity, and mechanistic metrics.
   - Triangulate mechanism claims with at least two independent measurement types.
   - Grade each conclusion as observed, inferred, or speculative; bound benchmark results to the tested scaffold and substrate class.
   - **Gate 5 — Scope Bounding:** Do not generalize to new substrate classes, metals, or reaction conditions without explicit boundary statements and additional controls.

6. **Iteration, Redesign, or Termination**
   - **If supported:** Expand scope one orthogonal axis at a time; add mechanistic probes before broad claims.
   - **If partially supported:** Isolate the failing assumption with a focused variant; update evidence strength.
   - **If failed:** Verify structural realization and control integrity; document the result as a boundary condition.
   - **If ambiguous:** Increase replication or simplify the candidate set; do not expand scope until resolved.
   - **Termination conditions:** Core structural motif is inaccessible; effect disappears under strong controls; stereochemical assignment is unreliable; safety or ethics boundaries are breached.

# Output Format

When using this skill, return a structured research plan containing:

1. **Research question** — a narrow, falsifiable question tied to a specific design axis.
2. **Ranked hypotheses** — primary, alternatives, and failure hypotheses with evidence strength, critical assumptions, likely failure modes, and boundary of inference.
3. **Control table** — list of positive, negative, blank, mechanistic, and reproducibility controls with their purpose.
4. **Minimal validation plan** — candidate series, variables, metrics, and stop conditions.
5. **Analysis plan** — structure-performance mapping, observation-vs-inference separation, mechanistic triangulation, and visualization strategy.
6. **Iteration rules** — decision map for supported, partial, failed, or ambiguous outcomes.
7. **Validity and boundary statement** — confounders, reproducibility risks, extrapolation limits, and non-operational safety constraints.

# Validation Gates

- **Falsifiability gate:** The research question must be narrow enough to yield a clear negative result.
- **Control gate:** Every hypothesis test must include a matched negative control and a benchmark comparison.
- **Reproducibility gate:** Key comparisons must be repeatable or explicitly flagged as preliminary.
- **Mechanism gate:** Mechanistic claims require converging evidence from at least two independent probes or measurement types.
- **Scope gate:** Expansion to new substrates, reagents, or conditions requires prior catalyst-dependent selectivity and credible stereochemical assignment.
- **Safety gate:** All plans must remain at the research-design level with explicit institutional review boundaries; no executable hazardous parameters.

# Claim Boundaries

- Benchmark success is evidence for the tested task class and scaffold only, not proof of broad generality.
- Source-supported observations, analogy-based inferences, and speculative extensions must be labeled separately.
- A single successful ligand or catalyst system does not establish field consensus.
- Structure-performance trends apply to the tested substrate class, metal or ligand family, and reaction conditions unless explicitly validated beyond them.
- Do not extrapolate to clinical, environmental, or industrial applicability from synthetic accessibility or a single benchmark result.

# Failure Modes

- Background or uncatalyzed reaction dominates, masking catalyst control.
- Catalyst speciation, decomposition, or unproductive binding invalidates the design model.
- Loss of stereochemical integrity in the ligand or catalyst.
- Competing pathways produce the same product with different stereochemical outcomes.
- Poor reproducibility due to uncontrolled impurities, moisture, or batch variation.
- Analytical misassignment of product identity or stereochemical outcome.
- Confounding from correlated variables (e.g., steric and electronic changes co-varying).
- Descriptor correlation without causal mechanistic support.

# Validity Checks

Before finalizing any plan, verify:

- The research question is falsifiable and bounded.
- Source-supported observations are separated from agent-generated inferences.
- Each hypothesis includes evidence strength, critical assumptions, failure modes, and boundaries.
- Variables are varied one at a time or explicitly labeled as correlated.
- Positive, negative, blank, mechanistic, and reproducibility controls are included.
- Activity and selectivity are evaluated and reported separately.
- Benchmark results are bounded to the tested scaffold and task class.
- Confounders are considered: purity, stability, speciation, binding mode, substrate scope, analytical calibration, and reproducibility.
- Safety, ethics, environmental, and compliance boundaries are explicit and non-operational.

# Provenance

Synthesized from cluster 22.0 (catalysis-asymmetric-chiral-ligand-mechanism-discovery-workflow; workflow archetype: observable-driven mechanism discovery and validation). Derived from representative source skills: modular-chiral-ligand-discovery-workflow (10.1016_s0957-4166_01_00464-5), asymmetric-co2-utilization-research (10.1039_d3ob00555k), chiral-iridium-catalyst-exploration (10.1002_chem.200501500), chiral-sulfone-asymmetric-hydrogenation-workflow (10.1039_d4ob01515k), ligand-controlled-synergistic-catalysis-research (10.1002_chem.202202951), perovskite-interface-passivation-research (10.1002_eom2.12470), p-stereogenic-ligand-research-design (10.1021_acs.accounts.9b00609), and asymmetric-catalysis-research-design (10.1021_acs.joc.2c02676).
