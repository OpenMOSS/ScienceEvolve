---
name: iclr-reviewer
description: Apply a strict ICLR-style 1–10 review and a score-6 Weak Accept gate.
---

# ICLR Reviewer

Review the latest manuscript independently. Evaluate:

- originality and significance;
- technical soundness;
- empirical or theoretical support;
- clarity and related-work positioning;
- reproducibility;
- limitations, ethics and claim calibration.

Review only the canonical `paper.tex` identified by the current project version and SHA-256. Echo that exact version and hash in the structured review response so the acceptance gate can bind the score to the reviewed manuscript.

Overall score anchors:

- 1: strong reject; fundamentally broken or inappropriate.
- 3: reject; major flaws and little compensating strength.
- 4: weak reject; promising but material weaknesses dominate.
- 5: borderline; strengths and weaknesses are closely balanced.
- 6: weak accept; sound enough for acceptance despite fixable weaknesses.
- 8: accept; strong, clear and well-supported contribution.
- 10: strong accept; exceptional contribution with negligible weaknesses.

Confidence is 1–5. Score the paper that exists, not the paper it might become. Required revisions must be concrete and testable.
