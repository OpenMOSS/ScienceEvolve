---
name: sci-immune-protein-immune-recognition-discovery-workflo-55efd544
description: Reusable end-to-end workflow for discovering, ranking, and validating candidate immune-recognition sites on protein targets while bounding mechanistic claims and separating binding evidence from functional consequence.
scienceevolve-title: "Antibody and immune recognition · protein immune recognition discovery workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

This skill guides the design of a staged research program to identify, map, and validate immune-relevant recognition sites on protein targets. It helps translate a biologically motivated target into testable candidate regions, screen for specific recognition, validate findings through orthogonal and reciprocal assays, assess specificity, and cautiously link recognition to functional or downstream immune outcomes. The workflow prevents conflation of binding detection with biological mechanism or translational potential.

# When to use

Use this skill when:
- A protein target has prior biological relevance but the precise immune-recognition regions remain unresolved.
- The goal is to map candidate epitopes, binding motifs, accessible domains, or functional regions using sequence, structural, or functional annotations.
- Designing a staged validation plan for recognition reagents, diagnostic antigens, or mechanistic hypotheses.
- Evaluating whether binding or recognition evidence is sufficient to justify functional or mechanistic follow-up.
- Comparing recognition breadth across variants, formats, or contexts.

Do not use this skill for:
- Clinical diagnosis, treatment advice, or patient management.
- Direct experimental execution or operational wet-lab protocols.
- Claims that a candidate is ready for translational use without independent functional and safety validation.
- Field-wide consensus statements from single-study evidence.

# Inputs required

Before generating a plan, identify or request:
- **Target protein or class**: the molecule of interest and its biological rationale.
- **Prior evidence**: binding, functional, genetic, or structural support for the target.
- **Annotations**: sequence, structure, conservation, accessibility, domain architecture, or functional site data.
- **Assay concept**: high-level description of the recognition or binding measurement platform.
- **Control materials**: positive, negative, background, and format-specific controls available or needed.
- **Variant or decoy panel**: related non-targets, strains, or sequence variants for specificity testing.
- **Decision thresholds**: prespecified signal, reproducibility, and promotion criteria.
- **Constraints**: biosafety, ethics, regulatory, sample availability, and governance boundaries.

If inputs are missing, state assumptions explicitly and mark the plan as provisional.

# Core Workflow

Follow this ordered route with explicit decision gates and iteration loops:

1. **Frame the recognition gap**
   - Define the protein target, prior evidence, and the unresolved localization or mechanism question.
   - State the intended use (e.g., mechanistic mapping, reagent development, hypothesis generation).

2. **Generate candidate recognition sites**
   - Partition the target into candidate regions using sequence, structure, conservation, predicted accessibility, and functional annotations.
   - Generate at least three candidate classes when possible: (a) a region supported by prior evidence; (b) a region suggested by conservation or structural features; (c) a negative or weakly supported region to test assay specificity.
   - For each candidate, document selection rationale and a falsifiable prediction.

3. **Prespecify controls and promotion criteria**
   - Define positive, negative, background, format, and unrelated-target controls.
   - Set reproducibility thresholds, signal-to-background requirements, and candidate promotion rules before screening begins.
   - Establish stop conditions for the entire study if controls fail or background is excessive.

4. **Execute primary recognition screening**
   - Run the primary assay measuring recognition, binding, or reactivity.
   - Compare candidates against controls within the same assay and endpoint.
   - **Decision gate**: Promote candidates only if they meet prespecified criteria for signal, reproducibility, and plausibility. Do not promote based on highest raw signal alone.

5. **Reciprocal and orthogonal validation**
   - Test whether candidate-derived reagents recognize the original target (reciprocal validation).
   - Repeat measurement with a different physical readout or platform (orthogonal validation).
   - **Decision gate**: If a candidate fails reciprocal or orthogonal checks, classify it as a platform artifact or deprioritize it. Iterate to refine probes or controls.

6. **Assess specificity**
   - Test promoted candidates against related non-targets, variants, decoy regions, or off-target proteins.
   - **Decision gate**: If broad cross-reactivity is observed, halt specificity claims and redesign the candidate panel or selection criteria.

7. **Test mechanistic linkage**
   - Design perturbation experiments that connect recognition to a functional or downstream readout.
   - Separate binding recognition from functional consequence using mechanistic controls.
   - **Decision gate**: If recognition persists but functional effect is absent, downgrade mechanistic claims to "binding detected, function unsupported."

8. **Grade evidence and iterate or terminate**
   - Classify each claim by evidence level: detection, recognition, specificity, functional relevance, or translational promise.
   - Update the evidence ladder and hypothesis table based on results.
   - **Stop conditions**: Terminate if controls fail, no candidate exceeds thresholds, orthogonal validation contradicts primary screening, or functional linkage remains unsupported after iteration. Otherwise, define the next minimal validation step.

# Output Format

The workflow produces:
1. **Research question framing**: target, prior evidence, gap, and intended use.
2. **Candidate hypothesis table**: hypothesis, evidence strength, key assumptions, and possible failure modes.
3. **Candidate generation rationale**: biological or structural justification for each tested region.
4. **Experimental design plan**: primary screen, controls, promotion criteria, reciprocal validation, orthogonal validation, specificity panel, and functional follow-up.
5. **Analysis plan**: endpoints, comparison strategy, decision rules, and recommended visualizations.
6. **Evidence ladder**: ranked claims distinguishing detection, recognition, specificity, and functional relevance.
7. **Iteration or termination plan**: explicit next steps, pivot conditions, or stop decisions.

# Validation Gates

- **Control performance**: All predefined control thresholds must be met before candidate interpretation.
- **Reproducibility**: Consistent direction and magnitude across technical and biological replicates.
- **Orthogonal concordance**: Promoted candidates must replicate in a distinct assay format.
- **Specificity confirmation**: Signal must exceed unrelated-target and decoy-region backgrounds.
- **Mechanistic separation**: Binding and functional claims must be supported by distinct evidence layers.
- **Stopping criteria**: Predefined failure rules must be applied before escalating claims.

# Claim Boundaries

- **Can support**: existence of target-specific recognition; relative candidate ranking within the tested panel; specificity against tested decoys; and mechanistic hypotheses when convergent evidence is present.
- **Cannot support**: clinical efficacy, protective immunity, diagnostic utility, translational readiness, or universal cross-reactivity beyond the tested variant or condition panel.
- **Cannot support**: field-wide consensus from single-study or single-system evidence.

# Failure Modes

- Control failure or excessive background invalidating the assay window.
- No candidate exceeds the prespecified signal or reproducibility threshold.
- Loss of signal in orthogonal validation indicating platform artifact.
- Recognition without functional effect undermining mechanistic claims.
- Broad cross-reactivity indicating insufficient specificity for useful targeting.
- Inadequate strain, variant, or sample diversity to support breadth claims.

# Validity Checks

Before finalizing a research plan or claim:
- Confirm the target is motivated by prior evidence, not a single paper-level conclusion.
- Verify that candidate regions are justified by transparent biological or structural rationale.
- Ensure positive, negative, blank/background, format, and related non-target controls are included.
- Confirm promotion criteria were defined before results were interpreted.
- Check that binding, recognition, specificity, and functional efficacy are not conflated.
- Ensure recombinant or artificial presentation is not assumed to match native biological context.
- Flag limited organism, variant, or molecule panels as preliminary.
- Address replication, uncertainty, and negative results explicitly.
- Confirm safety, ethics, and compliance constraints are appropriate for the biological system.

# Provenance

- Synthesized from cluster 26, subcluster 26.1 ("symmetry-guided mechanism discovery and validation").
- Derived from source skills: `oral-pathogen-antigen-epitope-discovery` (57a35e186c875595), `viral-protein-antibody-epitope-discovery` (2f0b62b1ec95389f), `hiv-tat-cross-recognition-research` (cc8b26feaa79c872), `receptor-domain-probe-exploration` (a8b738d8cc7fe8ba), `conserved-internal-antigen-helper-bridge` (c6832ffb83087a90), `antigen-epitope-vaccine-exploration` (cd4757fc32c3f79b), `ccr3-pathway-research-design` (2799bda4f1ba23eb).
- Excluded source skill: `89df65d6716e6967` (comparative vaccine immunogenicity strategy and maternal antibody transfer; outside the epitope-to-mechanism pipeline).
