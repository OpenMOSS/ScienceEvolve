---
name: sci-catalysis-asymmetric-catalysis-chiral-ligand-mechan-cd2fa4da
description: A reusable end-to-end workflow for generating, validating, and iterating mechanism-guided hypotheses in asymmetric catalysis and chiral ligand discovery, from gap definition through minimal validation to scope boundary mapping.
scienceevolve-title: "Asymmetric catalysis · asymmetric catalysis chiral ligand mechanism discovery workflow"
scienceevolve-area: asymmetric-catalysis
---

## Purpose

Help an agent transform an asymmetric catalysis or chiral ligand problem into a structured, evidence-based research plan. The workflow guides gap definition, mechanistic hypothesis generation, minimal validation design, controlled experimentation, layered analysis, and iterative refinement—without reproducing paper-specific protocols or operational details.

## When to use

Use this skill when the user asks to:

- Propose new research questions in asymmetric catalysis, chiral ligand design, organocatalysis, or stereoselective synthesis.
- Design non-operational validation plans for catalyst/ligand analogues, new substrate classes, or mechanistic extensions.
- Interpret ambiguous results, poor selectivity, or unexpected reactivity in enantioselective transformations.
- Build a hypothesis-to-validation pipeline for mechanism discovery.

Do not use for clinical recommendations, biological efficacy claims, scale-up protocols, or operational laboratory instructions.

## Inputs required

Before generating a plan, identify or request:

- Target transformation and desired stereochemical outcome (central, axial, planar, etc.).
- Known benchmark catalyst/ligand class and its limitations.
- Candidate catalyst/ligand motif or substrate class, with high-level structural features.
- Suspected mechanistic bottleneck (e.g., weak binding, poor stereochemical communication, background reaction).
- Available analytical capabilities for conversion, selectivity, and structural assignment.
- Safety, regulatory, and institutional constraints.

## Core Workflow

1. **Define the synthetic gap and mechanism mismatch**
   - State why existing methods are insufficient for the target transformation.
   - Identify the specific transfer barrier from known systems to the target (coordination geometry, substrate binding mode, competing background pathways).
   - **Decision gate:** If the gap is purely incremental with no mechanistic hook, stop and reformulate the research question.

2. **Generate ranked mechanism-guided hypotheses**
   - Produce 3–6 hypotheses that link a concrete design variable to the suspected bottleneck.
   - For each hypothesis specify: mechanistic rationale, evidence strength (strong/moderate/weak/speculative), key assumption, discriminating observation, and likely failure mode.
   - Separate paper-supported patterns from new inferences and unvalidated assumptions.
   - **Decision gate:** If no hypothesis is testable with an analogue pair or minimal substrate set, stop and gather additional literature or data.

3. **Design minimal viable validation (MVV)**
   - Select one representative substrate/catalyst pair that directly tests the core hypothesis.
   - Define non-operational variables (catalyst/ligand class, substrate electronics/sterics, activation mode) to vary one interpretable feature at a time.
   - Specify essential controls: historical/positive, negative (omit chiral element), background (omit catalyst/oxidant), and structural (matched/mismatched or single-feature change).
   - Predefine success criteria (detectable product, meaningful selectivity, reproducibility) and stop conditions (no product above background, dominant decomposition, irreproducible selectivity).
   - **Decision gate:** If the MVV requires hazardous or uncontrolled conditions, redesign at a higher conceptual level before proceeding.

4. **Execute conceptual screening and collect evidence**
   - Run the MVV and a primary factor screen across the defined variable classes.
   - Record primary metrics (conversion, yield proxy, stereoselectivity) and secondary metrics (robustness, side-product classes, catalyst stability).
   - Document all failures and boundary observations.
   - **Iteration gate:** If the MVV fails, proceed to Failure Mode response (Step 7). If the MVV succeeds, proceed to mechanistic discrimination (Step 5).

5. **Discriminate mechanism and map structure–performance**
   - Compare results against controls to separate catalyst-controlled selectivity from background reactivity.
   - Use structural probes (interception, substitution, omission) to test necessity versus mere compatibility of proposed intermediates.
   - Map trends: correlate changes in ligand/substrate structure with changes in activity and stereochemical outcome.
   - **Decision gate:** If selectivity tracks with the proposed stereochemical model and controls behave as expected, proceed to scope probing (Step 6). If controls contradict the model, return to Step 2.

6. **Probe scope and define boundaries**
   - Expand systematically along orthogonal dimensions (electronics, sterics, heteroatoms, functional groups, ring size).
   - Stop when repeated failures reveal a boundary condition.
   - Preserve negative results as boundary evidence.
   - **Iteration gate:** If scope is narrow but mechanistically coherent, document boundary conditions and consider utility demonstration. If generality is claimed without boundary testing, return to Step 5.

7. **Iterate, revise, or stop**
   - **Revise hypothesis:** If partial success occurs (e.g., activity without selectivity, or selectivity for only one substrate), update the mechanism model and design one discriminating experiment.
   - **Pivot:** If structural evidence contradicts the model or background dominates, return to Step 2 with a new bottleneck hypothesis.
   - **Stop:** If product formation is indistinguishable from background, catalyst inactivation dominates, results are irreproducible, or safety/compliance constraints are violated.
   - **Decision gate:** Before each new cycle, confirm that the next experiment isolates one variable and includes appropriate controls.

8. **Synthesize design rules and finalize claims**
   - Convert validated trends into transferable rules (e.g., "matched stereochemistry improves selectivity when donor atom X is present").
   - State boundary conditions explicitly.
   - Label conclusions as demonstrated, supported, plausible, or speculative.
   - **Stop condition:** Do not extrapolate to unrelated substrate classes or catalyst families without new evidence.

## Output Format

When using this skill, produce:

1. **Research question** — Concise gap statement and target transformation.
2. **Evidence map** — Literature-supported patterns, inferred mechanisms, and untested assumptions with evidence-strength labels.
3. **Ranked hypotheses** — 3–6 hypotheses with mechanistic rationale, evidence strength, key assumptions, likely failure modes, and discriminating observations.
4. **Minimal viable validation plan** — Representative test, controls, variables, metrics, and stop conditions.
5. **Analysis plan** — How to compare controls, map structure–performance, assign confidence levels, and visualize trends.
6. **Iteration rules** — Explicit proceed/revise/stop criteria linked to possible outcomes.
7. **Validity and safety review** — Confounders, reproducibility checks, boundary conditions, and non-operational safety constraints.

## Validation Gates

- **Gap clarity:** The problem is underexplored and mechanistically grounded, not merely terminologically novel.
- **Hypothesis testability:** Each hypothesis connects a design variable to a bottleneck and can be tested with an analogue pair or minimal substrate set.
- **Control completeness:** Historical, positive, negative, background, and structural controls are included before interpreting selectivity.
- **Analytical validity:** Product identity and stereochemical assignment are confirmed by methods capable of distinguishing relevant isomers.
- **Reproducibility:** Key claims are supported by independent replication or consistent trends, not single-run observations.
- **Safety and compliance:** The plan remains non-operational; hazardous parameters are excluded and institutional review is required before execution.

## Claim Boundaries

- Treat single-paper or single-system results as case-study evidence, not field-wide consensus.
- Distinguish demonstrated observations from mechanistic inferences and speculative extensions.
- Do not claim a detailed mechanism from substrate scope alone; require converging evidence from discriminating controls.
- Do not extrapolate from one substrate class to all stereocenter types or from one ligand family to all catalyst classes without new validation.
- Avoid claiming biological, clinical, or environmental safety from synthetic feasibility or structural similarity.

## Failure Modes

- **No product above background:** Reassess substrate activation, catalyst speciation, or intermediate generation; stop if controls show decomposition dominates.
- **Product without selectivity:** Background reaction or nonselective pathway dominates; redesign chiral environment or directing group before optimizing conditions.
- **Selectivity without reproducibility:** Analytical ambiguity, substrate isomer effects, or catalyst instability; resolve confounders before scope expansion.
- **Narrow scope with no trend:** Mechanism may be substrate-specific; redefine boundary conditions rather than forcing generality.
- **Controls contradict hypothesis:** Proposed intermediate or binding model is incorrect; update mechanism before designing new analogues.
- **Catalyst inactivation or product inhibition dominates:** Shift focus to stability and turnover rather than selectivity optimization.

## Validity Checks

Before finalizing any plan or interpretation, verify:

- Paper-supported observations are separated from new inferences.
- The analogue matrix or substrate panel isolates one interpretable variable at a time.
- Mechanistic claims are supported by necessity tests, not only compatibility evidence.
- Negative results and failed substrate/catalyst classes are reported as boundary evidence.
- Comparative claims include uncertainty estimates or replication plans.
- Extrapolation limits are stated for substrate class, catalyst family, and reaction environment.
- Operational hazardous details (temperatures, pressures, reagent quantities, step-by-step protocols) are absent.
- Institutional safety review and regulatory compliance are required before any experimental execution.

## Provenance

- Derived from cluster `10` / subcluster `10.1`: end-to-end mechanism discovery and validation.
- Synthesized from source skills: `oxygen-boron-radical-c-h-functionalization`, `haloperoxidase-inspired-biocatalytic-oxidation-workflow`, `asymmetric-cascade-reaction-design`, `asymmetric-catalyst-ligand-discovery-workflow`, `asymmetric-c-h-activation-research-design`, `asymmetric-organocatalysis-research-workflow`, `asymmetric-catalyst-ligand-exploration`, `chiral-quaternary-center-research`.
- Preserves shared workflow patterns: gap-first definition, mechanism-guided hypothesis generation, minimal viable validation with layered controls, structure–performance analysis, and iterative boundary mapping.
