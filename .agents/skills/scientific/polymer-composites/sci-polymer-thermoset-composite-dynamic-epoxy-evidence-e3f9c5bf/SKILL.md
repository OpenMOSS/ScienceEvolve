---
name: sci-polymer-thermoset-composite-dynamic-epoxy-evidence-e3f9c5bf
description: A reusable end-to-end workflow for generating hypotheses, designing controlled validation plans, and auditing evidence claims in thermoset, composite, dynamic covalent, and bio-based epoxy material systems.
scienceevolve-title: "Polymer composites and vitrimers · thermoset composite dynamic epoxy evidence analysis workflow"
scienceevolve-area: polymer-composites-and-vitrimers
---

# Purpose

This skill guides an agent through an observable-driven evidence analysis and claim audit workflow for research questions involving thermosets, composites, dynamic covalent networks (including vitrimers), and bio-based or lower-environmental-impact epoxy systems. It abstracts the shared scientific pattern across these domains: frame a coupled performance gap as a trade-off, generate mechanism-linked hypotheses, validate through staged structural and functional evidence, and iterate based on controlled comparisons rather than single-metric optimization.

# When to use

Use this skill when the user asks to:

- Generate new research questions or hypotheses for thermoset, composite, dynamic covalent, or bio-based epoxy material systems.
- Design non-operational validation studies that connect molecular architecture, network topology, processing behavior, thermal/mechanical performance, and end-of-life characteristics.
- Audit whether a proposed material claim is supported by structural evidence, appropriate controls, benchmark comparisons, and reproducibility checks.
- Evaluate trade-offs among sustainability, processability, service performance, reprocessability, or recyclability.
- Interpret multi-metric datasets where composition, structure, dynamics, and properties must be causally linked.

Do not use this skill for operational synthesis recipes, executable hazardous protocols, manufacturing scale-up parameters, or single-paper summaries treated as field consensus.

# Inputs required

Before executing the workflow, request or infer:

- **Target system and application context:** intended structural or functional role (e.g., matrix, adhesive, coating, panel, thermal-regulation material).
- **Performance tension:** the specific trade-off or coupled gap (e.g., stiffness vs. reprocessability, renewable content vs. moisture stability, functional retention vs. network constraint).
- **Incumbent benchmark:** the conventional or established system against which candidates will be compared.
- **Candidate design variables:** architectural levers such as backbone rigidity, functional group density, dynamic bond type, segment mobility, crosslink density, or filler/interface strategy.
- **Available evidence streams:** structural confirmation methods, thermal/mechanical/dynamic characterization access, and any prior data or literature constraints.
- **Safety, regulatory, and environmental boundaries:** constraints that exclude certain chemistries, processing concepts, or application claims.
- **Output priority:** whether the immediate need is hypothesis generation, experimental design, data analysis, claim audit, or iteration planning.

# Core Workflow

1. **Frame the coupled performance gap.**  
   Define the research question as a measurable trade-off between at least two properties or objectives (e.g., service performance vs. circularity, sustainability vs. processability). Identify the incumbent benchmark and the specific observable gap.  
   *Decision gate:* If the gap cannot be expressed as a falsifiable, measurable trade-off, stop and refine the research question.

2. **Build a mechanism map.**  
   Construct a causal chain linking composition/architecture → structure → transport/accessibility → chemical/physical response → bulk performance → end-of-life or service outcome. Mark each link as directly testable, indirectly testable, or assumed.  
   *Decision gate:* If the map contains no directly testable link to the target property, return to step 1 and narrow the scope.

3. **Generate ranked candidate hypotheses.**  
   Produce 3–5 hypotheses using the form: *If [design change] provides [mechanism], then [system] should show [observable shift] through [pathway].* For each, assign evidence strength (high / medium / low), state key assumptions, predict coupled property shifts, and list likely failure modes. Include at least one competing or negative hypothesis.  
   *Decision gate:* If no hypothesis is falsifiable with the available controls and metrics, return to step 2 to strengthen the mechanism map.

4. **Design minimum viable validation.**  
   Define comparison groups: baseline/benchmark, negative control (lacking the proposed mechanism), positive control (known to exhibit the target behavior), process control, and—where relevant—a physical-blending or non-dynamic analogue. Vary one dominant independent variable per stage. Select dependent variables across structural, kinetic, thermal, mechanical, and circularity families. Preset stop conditions (e.g., structural unconfirmed, benchmark incomparable, safety constraint breached).  
   *Decision gate:* If the matrix cannot separate the proposed mechanism from a confounding variable (e.g., cure completeness, moisture, processing history), simplify the design before proceeding.

5. **Stage evidence collection.**  
   Collect and interpret evidence in strict order:  
   a. Confirm structure, incorporation, and network formation.  
   b. Measure processability, accessibility, or transport behavior.  
   c. Measure functional, thermal, and mechanical responses.  
   d. Test reprocessing, recycling, or environmental stability only after service properties are established.  
   At each substage, require control comparison before interpreting trends.  
   *Iteration gate:* If structural confirmation fails or is ambiguous, pause all property interpretation and return to step 4 to revise the architecture or analytical plan.

6. **Analyze through coupled evidence chains.**  
   Separate physical accessibility effects from chemical activation or network effects. Normalize all comparisons to comparable cure history, geometry, and measurement context. Test for monotonic and non-monotonic trends; identify thresholds, plateaus, or reversals. Link observed property shifts to the mechanism map. Explicitly map trade-offs (e.g., stiffness vs. relaxation rate, strength vs. moisture uptake, functional retention vs. network constraint).  
   *Decision gate:* If results contradict the mechanism map and no plausible alternative explanation is supported by controls, stop and generate new competing hypotheses.

7. **Audit claims and classify evidence.**  
   Label every conclusion as:  
   - **Verified Observation:** directly measured in the current system.  
   - **Mechanistic Inference:** plausible explanation supported by multiple orthogonal evidence streams.  
   - **Untested Extrapolation:** prediction beyond the tested range; must be flagged as uncertain.  
   Bound all claims to the tested composition range, processing context, and application domain.  
   *Decision gate:* If a claim requires extrapolation to untested chemistries, scales, or service environments, downgrade it and specify the missing validation.

8. **Iterate or terminate.**  
   Apply result-driven rules:  
   - **Strengthen:** Structure confirmed, performance improved, and controls valid → proceed to expanded validation (broader benchmarks, multi-cycle tests, boundary testing).  
   - **Revise:** Mixed results, trade-offs, or partial support → isolate the limiting variable and return to step 3 with one changed design axis.  
   - **Stop:** Network fails to form reproducibly; dynamic exchange is indistinguishable from degradation; variability dominates trends; benchmark is mismatched; or safety/compliance constraints are breached.  
   *Stop condition:* Terminate when the next experiment no longer tests a distinct mechanism or when the risk of confounding exceeds the information gain.

# Output Format

When using this skill, deliver the following artifacts:

1. **Research question and gap statement.** One concise sentence defining the coupled performance tension and benchmark gap.
2. **Mechanism map.** A causal chain from architecture to outcome with testability labels.
3. **Ranked hypotheses table.** Hypothesis, evidence strength, key assumptions, predicted observable shifts, trade-offs, and likely failure modes.
4. **Minimum viable validation plan.** Comparison groups, controls, independent/dependent variables, metrics by evidence family, and stop conditions.
5. **Analysis plan.** Staging order, normalization strategy, control-comparison logic, trend-testing rules, trade-off mapping method, and mechanism-inference criteria.
6. **Iteration plan.** Decision rules for strengthening, revising, or stopping based on likely outcomes.
7. **Claim audit and evidence classification.** Explicit labels for verified observations, mechanistic inferences, and untested extrapolations, with stated boundary conditions.
8. **Validity and safety notes.** Confounders, reproducibility requirements, extrapolation limits, and non-operational safety/ethics constraints.

# Validation Gates

Before advancing between workflow stages or finalizing outputs, enforce these gates:

- **Structural validity gate:** The intended architecture, incorporation, or network formation must be supported by independent measurements before interpreting functional properties.
- **Control completeness gate:** Every claim must reference at least one negative control, one benchmark or positive control, and one process control.
- **Benchmark relevance gate:** The comparator must match the target chemistry, processing history, and measurement context; otherwise, comparisons are labeled as contextual, not mechanistic.
- **Mechanistic consistency gate:** Property trends across structural, thermal, mechanical, and dynamic metrics must align with the proposed mechanism map; conflicting metrics trigger hypothesis revision.
- **Reproducibility gate:** Batch-to-batch variability, replicate spread, and measurement uncertainty must be reported before upgrading evidence strength.
- **Safety and ethics gate:** All experimental concepts must remain at the research-design level; hazardous, uncontrolled, or non-compliant pathways are blocked pending qualified review.

# Claim Boundaries

Do not allow the following claim types unless explicitly supported by the staged evidence:

- Generalization from a single prototype or formulation to an entire material class (e.g., “all bio-based epoxies,” “all vitrimers”).
- Application suitability for load-bearing, biomedical, food-contact, transportation, or regulated environments without domain-specific qualification.
- Environmental, sustainability, or safety benefit based solely on renewable feedstock origin or dynamic bond presence.
- Operational fabrication parameters, synthesis recipes, curing schedules, or hazardous processing instructions.
- Field-wide consensus derived from a single source-paper observation.
- Conflation of molecular exchange evidence with bulk malleability, or of degradation with recyclability, without coupled validation.

# Failure Modes

Common workflow and hypothesis failure modes to monitor:

- **Structural failure:** Intended network architecture or functional incorporation is not confirmed.
- **Confounding dominance:** Results are driven by moisture, residual reagents, incomplete cure, batch variability, or processing heterogeneity rather than the design variable.
- **Over-constraint:** Functional segment or rigid motif suppresses the desired dynamic response, processability, or toughness.
- **Exchange-degradation ambiguity:** Dynamic relaxation or reprocessing is indistinguishable from irreversible network damage.
- **Benchmark mismatch:** The comparator differs in cure state, chemistry, or measurement context, invalidating comparative claims.
- **Monotonicity assumption:** Property trends are assumed linear with composition, missing thresholds or reversals.
- **Single-metric overclaim:** Improvement in one metric is presented as overall success while coupled losses are ignored.
- **Irreproducibility:** High batch or sample variability prevents mechanism-level conclusions.

# Validity Checks

Before finalizing any research plan, analysis, or claim, verify:

- **Confounding isolation:** Did the design change only one dominant structural feature, or are variables coupled?
- **Actual structure:** Does measured composition/architecture match the intended design?
- **Cure/state equivalence:** Are candidates comparable in network completeness, consolidation, or thermal history?
- **Control adequacy:** Are negative, positive, benchmark, and process controls present and appropriate?
- **Benchmark relevance:** Is the comparator chemically and contextually matched?
- **Statistical proportionality:** Are replicates, uncertainty, and effect sizes sufficient for the claim strength?
- **Mechanistic alignment:** Do trends across orthogonal metrics support the same mechanism?
- **Boundary discipline:** Are conclusions limited to the tested range, material family, and application context?
- **Evidence labeling:** Are paper-derived observations, user data, agent inferences, and speculations explicitly separated?
- **Safety and compliance:** Are hazards, waste, exposure, and regulatory constraints addressed at the design level?

# Provenance

This skill was synthesized from cluster **37.0** (cluster 37, subcluster 0) of the scientific skills codex. It merges shared workflow patterns from the following source skills:

- `biobased-epoxy-research-workflow` (10.1016_j.polymer.2021.124285)
- `dynamic-network-latent-heat-workflow` (10.3144_expresspolymlett.2025.85)
- `bio-based-thermoset-exploration` (10.1007_s10924-023-03112-5)
- `epoxy-thermoset-circular-recycling-research` (10.1039_d5gc04437e)
- `waste-derived-composite-panel-exploration` (10.32734_jotp.v6i1.13824)
- `dynamic-polymer-network-exploration` (10.1016_j.eurpolymj.2022.111272)
- `biobased-dynamic-epoxy-research` (10.1016_j.cclet.2021.10.079)
- `dynamic-covalent-network-exploration` (10.1021_jacs.8b03257)

The reusable workflow archetype is **observable-driven evidence analysis and claim audit**.
