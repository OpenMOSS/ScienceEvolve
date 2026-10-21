---
name: sci-immune-antibody-molecular-architecture-genetics-wor-232c037b
description: A reusable end-to-end workflow for sequence-to-structure analysis, germline comparison, and gene-organization studies in immunoglobulin primary structure and repertoire characterization.
scienceevolve-title: "Antibody and immune recognition · antibody molecular architecture genetics workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Guide an agent through a reusable, non-operational end-to-end workflow for antibody molecular architecture and genetics research. The skill converts sequence-characterization evidence into structured hypothesis generation, comparative analysis, and iterative validation for immunoglobulin primary structure and repertoire characterization, without treating any single study as field-wide consensus.

# When to use

Trigger this skill when the user asks to:

- Explore research questions in antibody genetics, B-cell receptor repertoires, immune receptor recombination, or antigen-specific monoclonal antibody structure.
- Convert sequence and architectural evidence into testable hypotheses about antigen recognition, germline gene usage, somatic diversification, or repertoire organization.
- Design a non-operational research plan with variables, controls, evaluation metrics, and iteration rules.
- Compare candidate antibodies or repertoire patterns against germline references and related antigen-specific sets.

Do not use this skill for clinical diagnosis or treatment advice, operational wet-lab protocol generation, paper summarization only, or as a replacement for qualified biosafety, ethics, or institutional review.

# Inputs required

Collect or request the following before producing a research plan:

- **Target system:** antigen or antigen family, antibody class, species, biological context, and intended research decision.
- **Molecular evidence:** paired heavy/light-chain sequences, repertoire datasets, germline reference databases, allele information, or published comparison sequences.
- **Structural context:** domain boundaries, known motifs, homology models, or experimental structures.
- **Functional evidence (if available):** specificity, epitope mapping, affinity, neutralization, or cellular readouts.
- **Provenance and ethics:** sample origin, consent status, and institutional approvals for human-derived or clinical materials.
- **Constraints:** data availability, database quality, computational resources, acceptable validation depth, and governance boundaries.

# Core Workflow

Follow this ordered end-to-end route. Do not skip a gate; if a gate fails, stop and resolve before proceeding.

1. **Scope and Input Triage**
   - Define the antibody system, chain types, antigen context, and research decision.
   - Gather sequence evidence, structural context, germline references, and repertoire datasets.
   - **Gate 1 — Input Sufficiency:** If essential inputs are missing, stop and document assumptions before proceeding.

2. **Sequence Architecture and Primary-Structure Analysis**
   - Quality-check sequences for identifier consistency, chain pairing, completeness, and artifacts.
   - Annotate V(D)J gene segments, CDR/FR partitions, junctional regions, and conserved motifs.
   - Flag ambiguous regions, incomplete coverage, or conflicting annotations.
   - **Gate 2 — Integrity Gate:** If sequence integrity is compromised or chain pairing is unresolved, stop and resolve data quality before interpretation.

3. **Comparative Germline and Repertoire Contextualization**
   - Compare variable regions against germline references; quantify divergence without assuming the nearest database entry is the true allele.
   - Assess gene usage, somatic diversification, and junctional diversity.
   - Place candidates in repertoire context by comparing with related antigen-specific antibodies, unrelated antibodies, and available population-level datasets.
   - **Gate 3 — Comparative Coherence:** If germline assignment is unstable, reference bias is severe, or repertoire coverage is insufficient, flag uncertainty and narrow claims.

4. **Mechanistic Hypothesis Generation**
   - Propose hypotheses linking sequence architecture (gene usage, CDR/FR composition, domain organization) to recognition or function.
   - Map candidate regions to structural roles: direct contact, pocket shape, flexibility, peripheral tuning, or framework constraint.
   - Label each hypothesis with evidence strength (high / moderate / low / speculative), key assumptions, predicted observations, and likely failure modes.
   - **Gate 4 — Hypothesis Viability:** If no hypothesis can be framed with at least moderate evidence and a minimal testable prediction, stop or redesign the scope.

5. **Validation Design**
   - Design a minimal viable validation plan at the research-logic level: independent variables, dependent variables, and controlled variables.
   - Specify controls: baseline unmodified sequence, positive comparator if available, negative comparator, internal consistency check, and orthogonal readout.
   - Predefine success criteria, ambiguity thresholds, and stop conditions.
   - **Gate 5 — Design Rigor:** If the plan lacks sufficient controls or readouts cannot distinguish the proposed mechanism from confounding effects, redesign before advancing.

6. **Evidence Integration and Analysis**
   - Integrate sequence, structural, comparative, and functional evidence.
   - Classify each claim as directly supported, indirectly supported, plausible but untested, or speculative.
   - Update evidence strength based on convergence or conflict across data streams.
   - **Gate 6 — Convergence Gate:** If evidence streams conflict, generate alternative hypotheses rather than forcing a single conclusion.

7. **Iteration and Boundary Setting**
   - Decide whether to refine the hypothesis, expand the comparison set, or stop.
   - If results support the hypothesis, strengthen the claim and define the next boundary test.
   - If results contradict the hypothesis, revise the mechanism or abandon the candidate.
   - If results are inconclusive, add orthogonal evidence or narrower controls.
   - **Stop Condition:** Halt when claims reach the limit of tested boundaries, further iteration yields diminishing returns, or ethical/safety constraints prevent valid inference.

# Output Format

When using this skill, produce:

1. **Scope and Inputs:** target system, available data, constraints, and documented assumptions.
2. **Research Question:** the specific uncertainty addressed.
3. **Sequence Architecture Summary:** gene-segment annotation, CDR/FR partitioning, quality flags, and ambiguous regions.
4. **Comparative Context:** germline divergence summary, repertoire placement, and reference-bias assessment.
5. **Hypothesis Table:** for each hypothesis—mechanistic claim, evidence strength, key assumptions, expected pattern, failure mode, and minimal validation.
6. **Validation Plan:** variables, controls, readouts, success/ambiguity/stop criteria.
7. **Evidence Integration:** classified claims and updated evidence strengths.
8. **Iteration Plan:** how each possible result updates or rejects hypotheses, and the next minimal step.
9. **Validity and Ethics Statement:** confounders, reproducibility checks, boundary conditions, and compliance constraints.

# Validation Gates

- **Input Sufficiency Gate:** Essential inputs and assumptions are documented before analysis begins.
- **Integrity Gate:** Sequence quality, chain pairing, and annotation confidence are verified.
- **Comparative Coherence Gate:** Germline and repertoire comparisons are stable and reference bias is flagged.
- **Hypothesis Viability Gate:** At least one hypothesis is testable with moderate evidence and a minimal prediction.
- **Design Rigor Gate:** Controls and readouts can distinguish the proposed mechanism from artifact and confounding.
- **Convergence Gate:** Evidence streams converge before confidence is escalated.
- **Boundary Gate:** Claims do not exceed tested species, isotype, donor, or antigen context.

# Claim Boundaries

- Distinguish sequence observation from mechanistic inference.
- Treat germline nearest-reference similarity as supportive, not proof of true allele usage.
- Treat homology-based structural mapping as lower-strength evidence unless supported by orthogonal data.
- Limit population-level claims to population-level data; single-clone or single-donor findings are not generalizable without replication.
- Separate evidence for genomic presence, expression, rearrangement, and functionality.
- Do not extrapolate from one species, isotype, antigen, or database annotation to all immunoglobulins.

# Failure Modes

- **Data quality failure:** ambiguous chain pairing, incomplete sequence coverage, misannotation, or contamination.
- **Reference bias:** incomplete or taxonomically biased germline databases leading to false assignment.
- **Confounding identity:** isotype, allele, species, or sample mix-up explaining observed differences.
- **Overinterpretation:** treating correlated sequence patterns as causal without minimal validation.
- **Assay artifact:** expression, folding, aggregation, or background effects mimicking specificity or stability changes.
- **Scope creep:** generalizing findings beyond the tested antibody class, antigen, donor, or species.
- **Ethical or compliance breach:** proceeding without appropriate oversight for human-derived or pathogen-associated materials.

# Validity Checks

Before finalizing a plan or claim, check:

- **Confounding:** donor history, exposure context, cell-source effects, allelic variation, chain mispairing, and database incompleteness.
- **Reproducibility:** independent clones, repeated annotations, alternative tools or references, and transparent handling of ambiguous calls.
- **Statistical validity:** appropriate comparison sets, correction for multiple comparisons when needed, uncertainty reporting, and avoidance of overinterpreting small samples.
- **Boundary conditions:** antigen family, antibody class, species, tissue/source context, and whether conclusions apply only to a single clone or donor.
- **Evidence hierarchy:** direct sequence support is stronger than nearest-reference similarity; functional validation is stronger than sequence-only inference; population-level claims require population-level data.
- **Ethical and privacy limits:** do not infer or disclose donor identity, clinical status, or sensitive health information beyond what is authorized.

# Provenance

- Synthesized from cluster 74 / subcluster 74.1.split0.
- Derived from source skills: antibody-genetics-research-exploration (979fbe485e8caec4), antibody-primary-structure-research-workflow (66bb0f9aaf8a53a1), comparative-immunogenetics-repertoire-discovery (6b391a80b7b89f93), camelid-heavy-chain-antibody-mechanism-exploration (53dd1ed6e59b46b2), antibody-specificity-exploration (1e930f225bcc57f8), conserved-interface-stabilization-research (173124cd3d821349), epitope-guided-antibody-research (c68bb94b1826c2f9), allergen-epitope-cross-reactivity-workflow (bde0717f11b4327b).
- No single source paper conclusions are treated as consensus.
