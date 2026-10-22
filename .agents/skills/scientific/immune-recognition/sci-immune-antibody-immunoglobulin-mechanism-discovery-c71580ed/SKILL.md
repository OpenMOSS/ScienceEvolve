---
name: sci-immune-antibody-immunoglobulin-mechanism-discovery-c71580ed
description: A reusable end-to-end research workflow for generating mechanistic hypotheses, designing minimal validation studies, and iterating evidence integration in antibody, immunoglobulin, and adaptive immune receptor systems without clinical or operational wet-lab instructions.
scienceevolve-title: "Antibody and immune recognition · antibody immunoglobulin mechanism discovery workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Use this skill to transform observational gaps or recurrent patterns in antibody, immunoglobulin, receptor, ligand, and related adaptive immune systems into structured, testable mechanism-discovery workflows. The goal is to help an agent propose research questions, generate constrained hypotheses, design minimal orthogonal validation, and integrate multi-stream evidence while keeping claims bounded and separate from clinical or operational guidance.

This skill teaches the transferable pattern: define an observable gap; decompose the system into candidate structural, sequence, topological, or functional modules; generate hypotheses with explicit assumptions and failure modes; validate through the smallest viable set of independent observations; integrate evidence under uncertainty; and iterate until claims are either supported or explicitly bounded.

# When to use

Use this skill when the user asks for one or more of the following:

- Generate new research questions about antibody or immunoglobulin structure, sequence, connectivity, fragment organization, or ligand-receptor mechanism.
- Design comparative studies for variable-region patterns, subgroup membership, domain topology, or chain-linkage architecture.
- Propose mechanisms to explain unexpected binding, weak or partial functional effects, or discordance between affinity and activity.
- Plan serological or epitope-level discrimination studies for related biological entities.
- Explore repertoire biases or recurrent immune receptor patterns between biological groups.
- Build a research plan, hypothesis matrix, or validation strategy that integrates structural, sequence, mapping, binding, competition, functional, or evolutionary evidence.

Do not use this skill for clinical diagnosis, treatment selection, patient management, public-health decision-making, or operational wet-lab execution guidance.

# Inputs required

Ask for or identify the following before producing a research plan:

- **Target system and observed gap:** the molecule, receptor, ligand, or repertoire class and the specific pattern or uncertainty to be explained.
- **Candidate modules:** structural domains, sequence regions, fragment sets, topological features, or functional units that could plausibly influence the gap.
- **Available evidence streams:** sequence records, structural data, binding or competition assays, fragment maps, serological readouts, repertoire counts, or prior literature.
- **Comparison framework:** positive, negative, outgroup, and specificity comparators appropriate to the module being tested.
- **Constraints:** biosafety, ethics, data governance, sample provenance, and non-clinical boundaries.
- **Intended output:** exploratory hypothesis generation, minimal validation design, mechanism comparison, or iteration plan.

If key inputs are missing, state assumptions explicitly and label conclusions as provisional.

# Core Workflow

Follow this ordered end-to-end route. Apply decision gates at each stage; stop or redesign if the gate conditions are not met.

## 1. Frame the observable gap
State the pattern, bias, or structural uncertainty in neutral, mechanism-free terms. Define the biological groups, conditions, or molecular states being compared and the metric that captures the difference.

- **Decision gate:** Is the gap focused on a mechanistic or structural explanation rather than a clinical outcome? If not, refine or stop.

## 2. Decompose into candidate modules
Identify independently variable structural, sequence, topological, or functional modules that could explain the gap. Examples include variable-region subgroups, domain boundaries, fragment connectivity patterns, epitope locations, or linkage topologies.

- **Decision gate:** Can at least one module be isolated and tested without confounding by untested alternatives? If no module is separable, stop and seek richer data.

## 3. Generate constrained hypotheses
For each candidate module, formulate a hypothesis that includes:
- Predicted distinguishing pattern in at least two independent readouts.
- Evidence strength (strong, moderate, weak, speculative).
- Key assumptions.
- Likely failure modes.
- Boundary conditions where the hypothesis may not apply.

- **Decision gate:** Are the hypotheses falsifiable with available or obtainable evidence? If a hypothesis cannot be disproven, reformulate.

## 4. Design minimal orthogonal validation
Define the smallest set of non-operational observations that can discriminate among hypotheses. Specify:
- Primary variable (module state, comparison group, or perturbation).
- Positive, negative, specificity, and technical controls.
- Orthogonal confirmation strategy (e.g., pairing sequence evidence with structural constraints, or binding data with functional readouts).
- Evaluation metrics and predefined stop conditions.

- **Decision gate:** Are controls adequate and stop conditions explicit? If not, redesign before proceeding.

## 5. Collect and classify evidence
Gather observations from each evidence stream. Label every observation by type (structural, sequence, mapping, binding, competition, functional, evolutionary, or serological) and by independence from other streams.

- **Decision gate:** Do controls meet predefined quality criteria? If controls fail, stop and troubleshoot; do not interpret biological signals.

## 6. Integrate and discriminate mechanisms
Compare observations against predicted patterns:
- Prefer models consistent with multiple independent constraints over models supported by a single favorable score.
- Maintain competing arrangements or alternative mechanisms where evidence is ambiguous.
- Separate physical connectivity from functional association unless both are independently supported.
- Update evidence strength only when orthogonal constraints converge; downgrade when contradictions appear.

- **Decision gate:** Do independent evidence streams converge on a mechanism, or is there a testable path to resolve conflict? If conflict is unresolvable with current tools, flag for iteration.

## 7. Bound claims and quantify uncertainty
Produce an evidence-weighted conclusion that explicitly states:
- What is directly observed.
- What is inferred from constraints.
- What remains ambiguous or speculative.
- The extrapolation boundary beyond which the claim should not be generalized.

- **Decision gate:** Are claims limited to the current system and evidence scope? If not, trim or qualify them.

## 8. Iterate or terminate
- **Continue** if a focused uncertainty remains and a minimal next validation is defined.
- **Pivot** if the leading hypothesis fails and a competing module offers a better explanation.
- **Stop** if:
  - The gap is not reproducible.
  - Controls consistently fail.
  - Binding and functional data conflict without a testable explanation.
  - The required evidence exceeds safety, ethical, or resource boundaries.
  - Additional data would only repeat existing constraints without reducing uncertainty.

# Output Format

When using this skill, produce:

1. **Research question** — Concise mechanism-focused question and system context.
2. **Hypothesis matrix** — For each candidate module: predicted pattern, evidence strength, key assumptions, likely failure modes, and boundary conditions.
3. **Minimal validation plan** — Variables, controls, orthogonal confirmation strategy, evaluation metrics, and stop conditions.
4. **Analysis plan** — Evidence classification, integration logic, model-scoring criteria, confounder checks, and robustness tests.
5. **Integration summary** — Convergent and conflicting evidence, updated evidence strengths, and retained alternative models.
6. **Iteration decision** — Next uncertainty to resolve, revision triggers, and whether to continue, pivot, or stop.
7. **Confidence and limitations statement** — Direct evidence, inferred evidence, model-dependent claims, and extrapolation boundaries.

# Validation Gates

Before finalizing any plan or claim, verify:

- The research question is mechanism-focused and does not assume disease consensus from a single source.
- Binding evidence is not equated with functional neutralization or clinical effect.
- Sequence-derived epitopes or boundaries are treated as conformational when discontinuous evidence supports that interpretation.
- Computational or modeled structures are constrained by independent data and not presented as experimentally solved structures.
- Controls include negative, positive, specificity, structural, and analytical comparators where relevant.
- Functional or serological assays include predefined stop conditions and confounder checks.
- Statistical interpretation includes replication, predefined endpoints, effect sizes, and uncertainty intervals.
- Claims are bounded by the available evidence and biological system.
- New hypotheses are labeled with evidence strength, assumptions, failure modes, and extrapolation limits.

# Claim Boundaries

- **Observed:** Patterns directly supported by the current evidence (e.g., sequence conservation, binding signal, fragment recovery).
- **Inferred:** Mechanistic links plausible from convergent constraints but not directly observed (e.g., domain connectivity inferred from orthogonal fragment data).
- **Speculative:** Useful for future work but lacking sufficient current support.
- **Excluded:** Clinical efficacy, diagnostic utility, therapeutic suitability, and field-wide consensus cannot be claimed from a single system or in vitro result.
- Always distinguish:
  - **Workflow-derived method:** the transferable pattern inherited from the source skill cluster.
  - **System-specific inference:** a new hypothesis generated for the user's target system.
  - **Unverified extrapolation:** a claim that lacks direct evidence in the current system.

# Failure Modes

- **Confounding by background:** Source, purification history, expression context, aggregation, batch effects, or population structure masquerades as a biological signal.
- **Annotation or alignment artifacts:** Sequencing error, misalignment, gap-rich regions, or incorrect region boundaries produce spurious patterns.
- **Fragment or recovery loss:** Missing fragments, low recovery, co-migration, or incomplete mapping creates false-negative or ambiguous topology assignments.
- **Cross-reactivity and nonspecificity:** Shared epitopes, conserved regions, or high background obscure discriminatory signals in serological or binding studies.
- **Binding–function discordance:** Strong affinity is interpreted as functional neutralization without independent pathway evidence.
- **Overfitting and small-sample bias:** Multiple probes or subgroup analyses tested without correction generate false mechanistic associations.
- **Forced single-model bias:** Unresolved fragments or ambiguous evidence are forced into one structural or mechanistic layout rather than retaining alternatives.
- **Extrapolation beyond context:** Findings from one subclass, species, disease state, or fragment set are generalized without comparative evidence.

# Validity Checks

- **Provenance:** Are sequences, structures, samples, and references annotated with source, quality, and context?
- **Representativeness:** Does the comparison set include positive, negative, outgroup, and specificity comparators?
- **Orthogonality:** Does each key claim rely on more than one independent evidence stream?
- **Robustness:** Are conclusions stable under reasonable alternative alignments, filtering choices, normalization methods, or local-window settings?
- **Confounding:** Could preprocessing, platform-specific artifacts, disease context, or sample bias explain the pattern?
- **Reproducibility:** Are decision rules, exclusion criteria, and analysis logic documented clearly enough for independent reanalysis?
- **Statistical validity:** Are effect sizes, uncertainty intervals, and multiple-comparison considerations reported?
- **Boundary conditions:** Are claims limited to the evidence scope, and are taxa, loci, sample classes, or assay formats outside the inference range explicitly flagged?
- **Inference separation:** Are source-skill observations clearly distinguished from agent-generated hypotheses and from newly observed data?

# Provenance

- Derived from cluster `40`, subcluster `40.0.split0`.
- Synthesized from representative source skills:
  - `cytokine-autoantibody-mechanism-discovery`
  - `immunoglobulin-sequence-discovery`
  - `immunoglobulin-linkage-exploration`
  - `immunoglobulin-fragment-mapping`
  - `immunoglobulin-v-boundary-signature-workflow`
  - `htlv-peptide-serology-research-design`
  - `rsv-serology-epitope-discovery`
  - `tcr-repertoire-bias-research`
