---
name: review-agent
description: Reviews uncommitted code changes in the working tree for quality and safety issues before commit. Currently checks that new or behavior-changing code is properly gated behind a feature toggle/flag, so that turning the toggle off leaves end users unaffected. Use when the user asks to review uncommitted or staged changes, or invokes /review-agent.
---

# Review Agent

Reviews the uncommitted changes in the current git working tree against a checklist of quality gates. Gather the change set first with `git status` (for untracked files) and `git diff HEAD` (for staged + unstaged modifications) before evaluating anything below.

Feature toggle coverage is diff-scoped — it only evaluates changed hunks. Assertion density and CRAP score are whole-project baseline checks — run them every time, even if `git diff HEAD` is empty or the change set is unrelated to the flagged files; they're reporting on overall project health, not reviewing the diff itself. They're also independent of each other and of the diff-gathering step above, so kick off `assert-density.sh` and `./gradlew drop-a-duce` as parallel tool calls (same message, two Bash invocations) rather than waiting on one before starting the other — Gradle's JVM/daemon startup otherwise dominates the wall-clock cost of this skill.

## Checks

### Feature toggle coverage

Goal: any new or behavior-changing code in the diff must be wrapped in a feature toggle such that turning the toggle off leaves the end user experience identical to before the change.

For each changed file/hunk:

1. Classify the change as one of:
   - **User-facing / behavioral** — changes what a user sees or how the system responds (new feature, altered logic, new API field/response, changed default, etc.)
   - **Non-behavioral** — refactor with no observable behavior change, tests, docs, comments, formatting, internal tooling/config with no runtime effect.
   - Non-behavioral changes are exempt from this check.
2. For behavioral changes, confirm the new/changed code path is conditioned on a toggle check (e.g., `if (flags.isEnabled(...))`, a config/env-var gate, LaunchDarkly/Statsig/Unleash-style call, etc.), and that the "toggle off" branch reproduces the prior behavior exactly — not just skips the new code with a different fallback.
3. Flag as a finding any of:
   - New or changed user-facing logic with no toggle check at all.
   - A toggle exists, but the "off" path doesn't actually restore prior behavior (e.g., a shared helper was changed unconditionally and only the call site is gated).
   - The toggle defaults to enabled, so the change ships immediately regardless of who has the flag off.
   - Partial coverage — the same behavior change also lands on a code path that isn't gated by the toggle.
4. For each finding, report the file:line, what's ungated, and why disabling the toggle would not currently protect users from the change.

### Assertion density (Java)

Goal: catch a test suite whose assertion coverage is thin relative to the size of the production codebase it's meant to be validating — a lot of source code but few assertions overall, which is a common way for a project to look well-tested while checking almost nothing.

Applies only when the project contains Java source (`src/main/java`-style production code) alongside Java test files (`*Test.java`, `*Tests.java`, `*IT.java`, or anything under a `.../test/...` path).

Run the bundled script instead of reading files directly — it does the counting in-process via grep/awk/find and returns a single summary line, so this check costs a handful of output lines regardless of repo size:

```bash
.claude/skills/review-agent/scripts/assert-density.sh
```

With no arguments it scans the whole project (repo root, resolved via `git rev-parse --show-toplevel`). Pass a root path to scope both counts to a subtree instead, e.g. `assert-density.sh billing-service`. Override the flag threshold (default `0.05` asserts-per-source-LOC) with `THRESHOLD=0.1 assert-density.sh`.

The ratio is project-wide: total assertions across every test file divided by total lines of code across every production source file — not a per-file ratio, so an individual thin test doesn't get singled out; it's a signal about overall suite health.

Interpreting output:
- A `FLAG` line means the project's total-asserts/total-source-LOC ratio is below the threshold — treat this as a prompt to look closer at overall test coverage, not an automatic failure (a small, well-targeted assertion count can still be adequate for straightforward code).
- The `TOTAL` line reports the raw counts (`source_files`, `source_loc`, `test_files`, `asserts`) and the resulting `ratio` — use it to sanity-check the threshold, not as a pass/fail gate on its own.

### CRAP score (Java)

Goal: catch methods anywhere in the project that are both complex and undertested — the combination that's expensive to maintain and easy to break.

Run:

```bash
./gradlew drop-a-duce -x openCrapJavaReport
```

The task chain (`crap-java-check` → `renderCrapJavaReportHtml` → `openCrapJavaReport`) always writes `build/reports/crap-java/report.json`, even when the CRAP threshold check fails and the command exits non-zero — its `finalizedBy` wiring guarantees the report exists regardless of exit code. Exclude `openCrapJavaReport` with `-x` — it shells out to `open` on the rendered HTML, which would pop a browser window on the user's machine; this check only needs `report.json`, never the HTML.

Once that command completes, filter the report with `jq` instead of reading the full file — `report.json` lists every method in the project, and only the failing ones matter here, so there's no reason to pull the passing majority into context on a large codebase:

```bash
jq '.methods[] | select(.status=="failed")' build/reports/crap-java/report.json
```

For each object returned, report it as a finding: file:line (`src:lineStart`), method name, `crap` score vs `threshold`, complexity (`cc`), and coverage (`cov`). This is a project-wide baseline check — report all failing methods, not just ones in files the current diff touched.

## Output

Run all three checks before writing anything — don't post findings check-by-check as they finish. Once feature toggle coverage, assertion density, and CRAP score have all completed:

1. Post a brief markdown summary in chat (a few lines: counts per check, whether anything blocks the commit).
2. Assemble the three results into a single JSON object matching this shape (any array may be empty):

   ```json
   {
     "toggle": [ { "file": "path", "line": 12, "issue": "what's ungated", "why": "..." } ],
     "assertionDensity": { "ratio": 0.032, "threshold": 0.05, "flagged": true,
                            "sourceFiles": 10, "sourceLoc": 500, "testFiles": 4, "asserts": 16 },
     "crap": [ { "src": "path", "lineStart": 10, "method": "Foo#bar", "crap": 34.2,
                 "threshold": 30, "cc": 8, "cov": 12.5 } ]
   }
   ```

   Write it to `build/reports/review-agent/data.json` (create the directory if it doesn't exist). `assertionDensity` fields come straight from `assert-density.sh`'s `TOTAL` line; `crap` entries come straight from the `jq` filter output above — no reshaping needed beyond field selection.
3. Render and open the styled HTML report with the bundled script — don't hand-author the HTML:

   ```bash
   node .claude/skills/review-agent/scripts/render-report.js build/reports/review-agent/data.json build/reports/review-agent/report.html
   open build/reports/review-agent/report.html
   ```

Keep each section's findings in the format already specified under that check above — this step only governs how the three results get assembled and presented, not what counts as a finding.
