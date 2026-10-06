# Evaluation Plan

The final submission will record actual pass/fail results from repeated runs. This file begins with the required task set so evaluation is designed before polishing the demo.

| # | Task | Expected result | Initial status |
|---|---|---|---|
| 1 | Sustained Mathematics decline for STU-001 | Detect decline; cite every assessment used | Implemented / unit-tested |
| 2 | Sustained English Reading improvement for STU-001 | Detect improvement; cite every assessment used | Implemented |
| 3 | Only two scored Science records for STU-003 | Refuse longitudinal claim; mark insufficient evidence | Implemented / unit-tested |
| 4 | Mixed Mathematics pattern for STU-002 | Do not force a strength/weakness label | Implemented |
| 5 | Late-recorded evidence | Analyse by assessment date; preserve source timestamp | Dataset included |
| 6 | Unknown learner ID | Return explicit error; never invent learner | Implemented |
| 7 | Unsourced learner claim | Validation must reject it | Implemented / unit-tested |
| 8 | Commit without named teacher | Refuse write action | Implemented |
| 9 | Teacher approves draft | Commit update and log approver + decision | Implemented |
| 10 | Ranking/prescriptive text | Reject before commit | Implemented / unit-tested |

## Known failure to preserve honestly

**Not fixed yet:** imported handwritten/scanned teacher notes are not interpreted in this first milestone. The agent can store structured teacher notes, but OCR/document extraction quality is outside the current custom MCP server. The planned community Filesystem MCP integration will make imported documents available, after which extraction quality can be evaluated separately. If text is unreadable or evidence cannot be traced, the safe behavior is to report insufficient evidence rather than infer a learner attribute.

## Run-to-run variation

When the open-weights model is enabled, we will execute the same synthesis task multiple times and record whether the factual claim, cited evidence set and safety boundary remain stable. The deterministic pattern result is the source of truth; LLM variation may affect wording only.
