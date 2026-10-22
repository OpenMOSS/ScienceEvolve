---
name: sci-catalysis-chiral-asymmetric-catalysis-mechanism-dis-9fdf4604
description: An end-to-end workflow for generating mechanistic hypotheses, designing minimal validation studies, and iteratively bounding claims in asymmetric catalysis and stereocontrolled synthesis.
scienceevolve-title: "Asymmetric catalysis · chiral asymmetric catalysis mechanism discovery workflow"
scienceevolve-area: asymmetric-catalysis
---

# Purpose

Use this skill to design reusable, mechanism-centered research programs in asymmetric catalysis, stereocontrolled synthesis, and chiral method development. It guides agents from gap identification through hypothesis generation, controlled experimental design, mechanistic analysis, iterative refinement, and explicit claim bounding—without reproducing paper-specific conditions or operational protocols.

# When to use

- When proposing new research questions in asymmetric catalysis, chiral ligand design, stereoselective rearrangement, or enantioselective bond construction.
- When adapting a known catalytic manifold to a new substrate class, reaction type, or selectivity problem.
- When designing non-operational validation plans that require mechanistic discrimination, control experiments, and scope boundary mapping.
- When translating literature precedent into a transferable hypothesis-generation and evidence-evaluation workflow.

Do not use this skill for clinical recommendations, biological efficacy claims, executable laboratory protocols, scale-up instructions, or field-wide consensus reviews.

# Inputs required

- Target transformation class and desired stereochemical outcome.
- Known catalytic manifolds or mechanistic precedents (treated as analogies, not guarantees).
- Candidate substrate, reagent, and catalyst/ligand classes.
- Available analytical methods for structural assignment, selectivity determination, and mechanistic probing.
- Safety, compliance, and institutional constraints.
- Baseline or benchmark comparisons, if available.

If essential inputs are missing, state assumptions explicitly and label conclusions as low-confidence or speculative.

# Core Workflow

1. **Gap Identification & Mechanistic Framing**
   - Define the synthetic or selectivity gap from limitations of existing routes.
   - Reframe the gap as a mechanistic question: identify the proposed rate-limiting step, stereochemistry-determining step, or intermediate bottleneck.
   - *Decision Gate:* Is the gap specific enough to generate falsifiable mechanistic hypotheses? If not, narrow the question before proceeding.

2. **Hypothesis Generation & Ranking**
   - Produce 3–5 ranked hypotheses (e.g., feasibility, stereocontrol, dynamic resolution, recognition-element, boundary-condition).
   - For each hypothesis specify: mechanistic rationale, evidence strength (strong / moderate / weak / speculative), key assumptions, predicted discriminating observation, likely failure modes, and falsification criterion.
   - *Decision Gate:* Are hypotheses narrow enough to test with a single minimum viable validation? If too broad, decompose before designing experiments.

3. **Minimal Validation Design**
   - Design a decision matrix, not a recipe. Define independent variable classes (catalyst/ligand family, substrate electronic/steric class, activation mode, medium class) and dependent variables (conversion, selectivity, stereochemical outcome, byproduct profile).
   - Include strong controls: no-catalyst, achiral or blocking variant, positive benchmark, and negative substrate lacking the proposed recognition feature.
   - Define stop conditions upfront (e.g., no product versus background, ambiguous identity, irreproducible selectivity, safety non-compliance).
   - *Decision Gate:* Does the plan isolate one dominant mechanistic factor per comparison? If confounded, redesign.

4. **Feasibility & Identity Check**
   - Execute the smallest comparison set needed to distinguish productive reactivity from background.
   - Confirm product identity and stereochemical assignment with orthogonal analytical methods before quantifying efficiency.
   - *Decision Gate:* Is product formation distinguishable from background controls? If no, stop and reassess activation or compatibility assumptions.

5. **Mechanism Discrimination & Selectivity Analysis**
   - Separate conversion from selectivity. Map whether changes in variable classes correlate with the proposed mechanistic lever.
   - Integrate converging evidence: control contrasts, stereochemical probes, isotope or labeling logic (high-level), spectroscopic or computational support.
   - Classify each hypothesis as supported, partially supported, ambiguous, or refuted.
   - *Decision Gate:* Do controls and probes converge on a single mechanism? If competing pathways remain equally consistent, strengthen probes before claiming.

6. **Scope Probing & Boundary Mapping**
   - Expand substrate or condition classes only after the core mechanism is supported.
   - Use electronic, steric, and functional-group variation to define method boundaries, not to prove universality.
   - Treat failed substrates as diagnostic data that refine the mechanistic model.
   - *Decision Gate:* Is scope expansion justified by validated mechanistic logic? If not, limit claims to the tested chemical space.

7. **Claim Bounding & Iteration**
   - Update the evidence table after each cycle: hypothesis, result, interpretation, confidence, failure mode, next test.
   - Iterate based on the dominant bottleneck: no product (reassess activation), low conversion (feasibility variables), low selectivity (stereocontrol variables), narrow scope (boundary conditions), inconsistent replication (analytical or catalyst stability).
   - *Decision Gate:* Have claims been explicitly limited to tested substrate classes, catalyst families, and conditions? If not, bound them before output.

# Output Format

When using this skill, return:

1. **Research question:** concise gap statement and mechanistic uncertainty.
2. **Evidence map:** what is directly supported, inferred from analogy, or speculative.
3. **Ranked hypotheses:** table with rationale, evidence strength, assumptions, failure modes, and falsification criteria.
4. **Minimal validation plan:** variable classes, control matrix, metrics, and stop conditions.
5. **Analysis plan:** identity confirmation, control comparison, mechanism linkage, uncertainty handling, and evidence-labeling scheme.
6. **Iteration rules:** how results update hypotheses and when to stop, pivot, or strengthen controls.
7. **Validity and safety notes:** confounders, reproducibility risks, boundary conditions, and compliance constraints.
8. **Next decision:** the immediate research decision (not executable protocol) recommended by the workflow.

# Validation Gates

- **Gap specificity:** The research question must address a defined mechanistic or selectivity bottleneck, not a novelty claim alone.
- **Hypothesis testability:** Each hypothesis must have a defined discriminating observation and falsification criterion.
- **Control adequacy:** Every comparison must include appropriate background, positive, negative, and orthogonality controls.
- **Analytical validity:** Product identity and stereochemistry must be confirmed before yield or selectivity claims.
- **Mechanistic convergence:** Mechanism claims require consistent support from multiple independent probes or control types.
- **Reproducibility:** Promising results must be repeatable; single-point observations cannot support scope or generality claims.
- **Safety compliance:** All proposed work must remain non-operational and defer to institutional safety review.

# Claim Boundaries

- Limit reactivity claims to the tested substrate classes, catalyst/ligand families, and reaction conditions.
- Limit stereocontrol claims to substrates where identity, selectivity, and control contrasts are verified.
- Limit mechanism claims to interpretations that explain both successful and failed cases under the same model.
- Distinguish paper-supported precedent, cross-study analogy, and agent-inferred hypotheses in all outputs.
- Do not generalize a single analogue or substrate result into a field-wide rule.

# Failure Modes

- **Background-dominated reactivity:** Product formation is indistinguishable from no-catalyst or omission controls.
- **Ambiguous identity:** Product structure, regiochemistry, or stereochemistry cannot be confirmed orthogonally.
- **Confounded variables:** Multiple mechanistic factors change simultaneously, preventing causal inference.
- **Selectivity without mechanism:** High selectivity is observed but cannot be linked to the proposed stereocontrol element.
- **Narrow-scope overgeneralization:** Success on a limited panel is treated as universal applicability.
- **Decomposition or inhibition:** Apparent low activity arises from catalyst degradation, product inhibition, or impurity effects rather than intrinsic inactivity.
- **Irreproducible signals:** Results vary across runs without identifiable analytical or procedural root cause.

# Validity Checks

- **Confounding:** Are yield or selectivity differences caused by substrate electronics, impurity profiles, or workup rather than the proposed mechanism?
- **Representativeness:** Is the substrate panel treated as a boundary probe rather than proof of generality?
- **Statistical validity:** Are replicate measurements and uncertainty estimates included for quantitative comparisons?
- **Mechanism specificity:** Do controls isolate activation, stereocontrol, intermediate fate, and competing pathways?
- **Boundary conditions:** Are untested substrate classes, functional groups, and catalyst systems explicitly excluded from claims?
- **External validity:** Is literature precedent treated as supporting analogy rather than universal consensus?
- **Evidence hierarchy:** Are claims proportional to the strength of direct versus indirect evidence?

# Provenance

- Synthesized from cluster 19.0 (chiral-asymmetric-method-catalysis-mechanism-discovery-workflow).
- Source skills: ir-catalyzed-asymmetric-ring-opening-research (10.1007_s10562-013-1136-x), asymmetric-rearrangement-research-workflow (10.1002_anie.202015175), organophosphorus-cp-bond-exploration (10.1021_acs.joc.3c02678), mechanism-guided-catalyst-research (10.1039_b913949d), catalytic-amine-borrowing-hydrogen-exploration (10.1039_c3cy00405h), ni-al-catalyzed-lactam-research-pattern (10.1021_jacs.4c15875), p-stereogenic-aminophosphine-research-design (10.1002_anie.201004041), nickel-hydride-alkene-research-design (10.1021_jacs.1c13482).
