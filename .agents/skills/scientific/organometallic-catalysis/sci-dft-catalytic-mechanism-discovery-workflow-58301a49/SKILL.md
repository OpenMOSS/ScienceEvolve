---
name: sci-dft-catalytic-mechanism-discovery-workflow-58301a49
description: An end-to-end, non-operational workflow for mechanism-guided hypothesis generation, discriminating validation design, layered analysis, and iterative model updating in catalytic selectivity and functionalization research.
scienceevolve-title: "Organometallic catalysis and DFT · catalytic mechanism discovery workflow"
scienceevolve-area: organometallic-catalysis-and-dft
---

## Purpose

This skill guides an agent through a reusable, end-to-end research workflow for discovering and validating catalytic mechanisms and selectivity patterns. It abstracts common reasoning across multicomponent catalysis, difunctionalization, cycloaddition, transfer hydrogenation, metathesis, and directed C–H functionalization into a single mechanism-first route. The workflow produces non-operational research plans: ranked hypotheses, conceptual control structures, layered analysis rules, and iteration logic. It explicitly excludes laboratory recipes, reaction parameters, and hazardous procedural details.

## When to use

Use this skill when the task is to:

- Propose new research questions in catalytic functionalization, selectivity control, or mechanism discovery.
- Convert an unexpected product, competing pathway, or synthetic gap into a testable mechanistic hypothesis.
- Design conceptual experiments that distinguish productive catalysis from pairwise/sequential reactivity, deactivation, or off-cycle pathways.
- Plan controls, evaluation metrics, failure criteria, and iteration rules for a new catalyst system, substrate class, or transformation type.
- Evaluate whether a narrow result can be responsibly generalized or whether a mechanistic claim is overextended.

Do not use this skill for direct laboratory execution, scale-up, operational synthesis protocols, or hazardous handling instructions.

## Inputs required

Before entering the workflow, collect or infer:

1. **Target transformation** – bond class, product scaffold, or assembly logic sought.
2. **Known chemistry map** – established pairwise, stepwise, or related transformations and their limitations.
3. **Competing pathways** – plausible side reactions, deactivation routes, or rearrangements.
4. **Candidate catalyst/substrate features** – conceptual metal families, ligand roles, directing elements, or cooperative sites (no specific parameters).
5. **Analytical capabilities** – available methods for product identity, selectivity, intermediate detection, and stereochemical assignment.
6. **Constraints** – safety scope, regulatory boundaries, and whether outputs must remain non-operational.
7. **Prior evidence** – literature precedents, preliminary observations, or computational models with confidence labels.

If critical inputs are missing, state assumptions explicitly and downgrade evidence strength.

## Core Workflow

Execute the following stages in order. Do not skip decision gates.

### Stage 1 – Frame the gap and map the network
- Define the synthetic or selectivity bottleneck in terms of competing pathways, not just low yield.
- Map the reaction network: starting materials → catalyst engagement → key intermediate → desired branch vs. competing branch.
- Mark the branch point where productive and off-pathway chemistry diverge.
- **Decision gate:** If the gap cannot be framed as a mechanistic branch-point problem, restate the research question or stop.

### Stage 2 – Generate ranked, falsifiable hypotheses
- Propose mechanism-level hypotheses (e.g., synergy, intermediate involvement, conformation-gated selectivity, cooperative transfer, or directing-group control).
- For each hypothesis, specify: evidence strength (strong / moderate / weak / speculative), key assumptions, predicted diagnostic observations, and most likely failure mode.
- Prioritize hypotheses that can be falsified by controls, isotope placement, substrate trends, or side-product analysis.
- **Decision gate:** If no hypothesis is falsifiable with available conceptual tools, redesign the question before proceeding.

### Stage 3 – Design discriminating validation
- **Minimal viable validation:** choose the simplest substrate/partner set that tests the core assembly logic; include structural confirmation and at least one competing-pathway tracker.
- **Variables:** vary one conceptual dimension at a time (catalyst family, ligand environment, substrate electronics/sterics, coupling-partner class, or additive role).
- **Controls:** include negative (component omission, no catalyst), mechanistic (pathway probe, blocked site), boundary (stress substrate), and positive/benchmark (if available) controls.
- **Metrics:** product identity confidence, selectivity relative to competing products, catalyst dependence, reproducibility, and mechanistic consistency.
- **Stop conditions:** pre-register criteria for abandoning or redesigning (e.g., ambiguous product assignment, dominant competing pathway, negative-control match, irreproducibility, safety conflict).
- **Decision gate:** If the plan cannot independently distinguish identity, selectivity, and mechanism, refine controls before continuing.

### Stage 4 – Collect evidence and maintain an evidence ledger
- Record each observation as: hypothesis → prediction → result → interpretation → confidence change → next test.
- **Decision gate:** If structural assignments are ambiguous or analytical reliability is unverified, halt and resolve before mechanistic interpretation.

### Stage 5 – Analyze in four layers
1. **Identity layer** – confirm the intended product and distinguish regioisomers, stereoisomers, rearrangement products, and known alternative products.
2. **Selectivity layer** – compare desired vs. competing pathway products and background formation; require catalyst-dependent signal.
3. **Mechanism layer** – evaluate intermediate competence, stereochemical transfer, isotope effects, crossover behavior, and catalyst speciation as support for or against the proposed cycle.
4. **Scope/boundary layer** – map electronic, steric, and geometric limits; treat failures as boundary information, not noise.
- **Decision gate:** A result supports the hypothesis only if it satisfies at least two independent criteria (e.g., product formation + pairwise non-reactivity, or intermediate competence + stereochemical consistency). Otherwise label it provisional.

### Stage 6 – Update model and iterate
- Classify the outcome:
  - **Supported:** desired product forms, controls align, scope shows predictable trends → expand scope cautiously and add mechanistic probes.
  - **Ambiguous:** performance improves but mechanism is unclear → redesign controls to separate variables.
  - **Contradicted:** predeclared falsification result appears or negative controls replicate the “positive” signal → revise or abandon the hypothesis.
  - **Boundary-defining:** success is narrow or failure mode is systematic → state boundary explicitly and test adjacent chemical space.
- Choose the next discriminating test that separates the two strongest remaining hypotheses.
- **Iteration/stop rule:** Continue only if a plausible route remains and safety/compliance boundaries are respected. Stop if the hypothesis is unfalsifiable, product identity is unresolved, or the dominant pathway is unsafe/uncontrolled.

### Stage 7 – Bound claims and archive provenance
- Separate observed facts from inferred intermediates and analogy-based predictions.
- State explicit boundaries for substrate class, catalyst family, partner geometry, and reaction environment.
- Archive the evidence ledger and link to source-skill provenance.

## Output Format

When using this skill, return:

1. **Research question and gap statement** – target transformation, mechanistic bottleneck, and why it matters.
2. **Ranked hypothesis portfolio** – for each hypothesis: statement, evidence strength, key assumptions, predicted diagnostics, failure mode, and minimal validation.
3. **Validation plan** – minimal viable design, variable classes, control structure, evaluation metrics, and stop conditions.
4. **Evidence ledger** – compact running table of hypothesis, prediction, result, interpretation, confidence change, and next test.
5. **Layered analysis summary** – identity, selectivity, mechanism, and scope conclusions with evidence-quality labels.
6. **Iteration decision** – classification (supported/ambiguous/contradicted/boundary) and next discriminating test or stop rationale.
7. **Boundary and validity statement** – confounders, reproducibility checks, extrapolation limits, and non-operational safety boundaries.

## Validation Gates

Before advancing past each stage, confirm:

- **Gap clarity:** The bottleneck is expressed as a pathway-branch problem, not only a yield problem.
- **Falsifiability:** Every active hypothesis has a predeclared observation that would weaken or refute it.
- **Control adequacy:** The experimental plan includes negative, mechanistic, boundary, and positive controls sufficient to distinguish identity, selectivity, and mechanism.
- **Structural security:** Product identities are confirmed by orthogonal reasoning; ambiguous assignments block mechanistic claims.
- **Mechanistic convergence:** Claims require at least two independent evidence classes; single-metric conclusions are labeled provisional.
- **Scope discipline:** Failures are recorded and used to define boundaries rather than omitted.

## Claim Boundaries

- Do not present a single study, model system, or catalyst family as field-wide consensus.
- Do not extrapolate mechanism, selectivity, or generality beyond the tested chemical space.
- Do not infer biological activity, pharmaceutical utility, materials performance, or process viability from synthetic discovery alone.
- Do not provide operational reaction parameters, executable procedures, or scale-up guidance.
- Distinguish paper-supported patterns from agent-generated inferences and speculative extensions.

## Failure Modes

Common ways the workflow or underlying hypothesis can fail:

- **Apparent synergy is sequential:** multicomponent success is actually rapid pairwise coupling; pairwise controls are essential.
- **Off-cycle intermediate:** a trapped or observed species is a thermodynamic sink rather than a productive intermediate.
- **Selectivity artifact:** high selectivity in a narrow substrate set is misattributed to a general design rule.
- **Catalyst deactivation:** product formation arises from degraded or non-cooperative catalyst species.
- **Misassignment:** product or stereochemical assignment is incorrect, leading to false mechanistic consistency.
- **Confounding variable:** additive, solvent, impurity, or uncontrolled atmosphere drives the observed outcome.
- **Unfalsifiable hypothesis:** the proposed mechanism is so flexible that any outcome can be rationalized post hoc.

## Validity Checks

Before finalizing any output, verify:

- **Confounding:** Are additive, solvent, temperature, substrate, and assay effects conceptually separated?
- **Reproducibility:** Are independent preparations, replicate measurements, and consistent analytical interpretation required?
- **Statistical validity:** Are uncertainty estimates and appropriate comparisons used before claiming superiority or generality?
- **Mass/charge balance:** Does the proposed network account for by-products, catalyst regeneration, and redox changes?
- **Stereochemical logic:** Are stereochemical outcomes predicted by the model, not merely rationalized after observation?
- **Scope bias:** Does the substrate set overrepresent easy cases or hide major limitations?
- **Evidence labeling:** Are paper-supported findings, agent inferences, and speculative extensions clearly separated?
- **Safety boundary:** Does the plan remain non-operational and avoid executable high-risk parameters?

## Provenance

Synthesized from cluster 16, subcluster 16.0 (mechanism discovery and validation). Source skills: test1012 (synergistic-multicomponent-catalysis-research), test1899 (cobalt-catalyzed-alkene-difunctionalization-research), test0988 (carbonylative-cycloaddition-research-design), test1611 (iron-catalyzed-transfer-hydrogenation-research), test1098 (terminal-alkyne-metathesis-selectivity-workflow), test0141 (metal-sulfur-hydrogenation-catalyst-exploration), test0916 (rhodium-c-h-functionalization-research-design), test0953 (vinylogous-cycloaddition-research).
