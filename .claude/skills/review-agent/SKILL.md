---
name: review-agent
description: Reviews uncommitted code changes in the working tree for quality and safety issues before commit. Currently checks that new, changed, or removed behavior is properly gated behind a feature toggle/flag, so that turning the toggle off leaves end users unaffected. Use when the user asks to review uncommitted or staged changes, or invokes /review-agent.
---

# Review Agent

Reviews the uncommitted changes in the current git working tree against a checklist of quality gates. Gather the change set first with `git status` (for untracked files) and `git diff HEAD` (for staged + unstaged modifications) before evaluating anything below.

Feature toggle coverage is diff-scoped — it only evaluates changed hunks. Assertion density and CRAP score are whole-project baseline checks — run them every time, even if `git diff HEAD` is empty or the change set is unrelated to the flagged files; they're reporting on overall project health, not reviewing the diff itself. They're also independent of each other and of the diff-gathering step above, so kick off `assert-density.sh` and `./gradlew drop-a-duce` as parallel tool calls (same message, two Bash invocations) rather than waiting on one before starting the other — Gradle's JVM/daemon startup otherwise dominates the wall-clock cost of this skill.

## Checks

### Feature toggle coverage

Goal: any new, changed, or removed behavior in the diff must be wrapped in a feature toggle such that turning the toggle off leaves the end user experience identical to before the change. This applies symmetrically to additions and deletions — deleting a line of behavior unconditionally is just as unguarded as adding one unconditionally, since there's no toggle to flip if the removal needs to be undone without a revert/redeploy.

For each changed file/hunk:

1. Classify the change as one of:
   - **User-facing / behavioral** — changes what a user sees or how the system responds. Covers both additions (new feature, altered logic, new API field/response, changed default) and removals (deleted logging/output the user could observe, a deleted branch, a removed check, a dropped API field) — a deletion is a behavior change whenever the *before* and *after* states differ in something observable.
   - **Non-behavioral** — refactor with no observable behavior change, tests, docs, comments, formatting, internal tooling/config with no runtime effect, or removal of genuinely dead/unreachable code.
   - Non-behavioral changes are exempt from this check.
2. For behavioral changes:
   - Additions: confirm the new/changed code path is conditioned on a toggle check (e.g., `if (flags.isEnabled(...))`, a config/env-var gate, LaunchDarkly/Statsig/Unleash-style call, etc.), and that the "toggle off" branch reproduces the prior behavior exactly — not just skips the new code with a different fallback.
   - Removals: confirm the old behavior is still reachable on a "toggle off" branch (e.g., `if (flags.isEnabled(...)) { /* new path without the removed code */ } else { /* old path, unchanged */ }`) rather than deleted outright with nothing to flip back to.
3. Flag as a finding any of:
   - New or changed user-facing logic with no toggle check at all.
   - Behavior-changing code removed outright with no toggle preserving the old path — the deletion applies unconditionally, so disabling any toggle would not bring the old behavior back.
   - A toggle exists, but the "off" path doesn't actually restore prior behavior (e.g., a shared helper was changed unconditionally and only the call site is gated).
   - The toggle defaults to enabled, so the change ships immediately regardless of who has the flag off.
   - Partial coverage — the same behavior change also lands on a code path that isn't gated by the toggle.
4. For each finding, report the file:line, what's ungated (added or removed), and why disabling the toggle would not currently protect users from the change.

### Assertion density (Java)

Goal: catch a test suite whose assertion coverage is thin relative to the size of the production codebase it's meant to be validating — a lot of source code but few assertions overall, which is a common way for a project to look well-tested while checking almost nothing.

Applies only when the project contains Java source (`src/main/java`-style production code) alongside Java test files (`*Test.java`, `*Tests.java`, `*IT.java`, or anything under a `.../test/...` path).

Run the bundled script instead of reading files directly — it does the counting in-process via grep/awk/find and returns a single summary line, so this check costs a handful of output lines regardless of repo size:

```bash
.claude/skills/review-agent/scripts/assert-density.sh
```

With no arguments it scans the whole project (repo root, resolved via `git rev-parse --show-toplevel`). Pass a root path to scope both counts to a subtree instead, e.g. `assert-density.sh billing-service`. Override the flag threshold (default `0.1` asserts-per-source-LOC) with `THRESHOLD=0.15 assert-density.sh`.

The ratio is project-wide: total assertions across every test file divided by total lines of code across every production source file — not a per-file ratio, so an individual thin test doesn't get singled out; it's a signal about overall suite health.

Interpreting output:
- A `boo tomato tomato` line means the project's total-asserts/total-source-LOC ratio is below the threshold — treat this as a prompt to look closer at overall test coverage, not an automatic failure (a small, well-targeted assertion count can still be adequate for straightforward code).
- The `TOTAL` line reports the raw counts (`source_files`, `source_loc`, `test_files`, `asserts`) and the resulting `ratio` — use it to sanity-check the threshold, not as a pass/fail gate on its own.

### CRAP score (Java)

Goal: catch methods anywhere in the project that are both complex and undertested — the combination that's expensive to maintain and easy to break.

Run:

```bash
./gradlew drop-a-duce
```

The task chain (`crap-java-check` → `renderCrapJavaReportHtml` → `openCrapJavaReport`) always writes `build/reports/crap-java/report.json`, even when the CRAP threshold check fails and the command exits non-zero — its `finalizedBy` wiring guarantees the report exists regardless of exit code. The chain includes an `openCrapJavaReport` task that shells out to `open` on the rendered HTML, but that exec runs from inside the Gradle JVM and isn't reliable for actually popping a window — don't depend on it. Explicitly `open build/reports/crap-java/report.html` yourself as part of the Output step below; this check gets its own report window, separate from the combined report.

Once that command completes, filter the report with `jq` instead of reading the full file — `report.json` lists every method in the project, and only the failing ones matter here, so there's no reason to pull the passing majority into context on a large codebase:

```bash
jq '.methods[] | select(.status=="failed")' build/reports/crap-java/report.json
```

For each object returned, report it as a finding: file:line (`src:lineStart`), method name, `crap` score vs `threshold`, complexity (`cc`), and coverage (`cov`). This is a project-wide baseline check — report all failing methods, not just ones in files the current diff touched.

## Output

The CRAP score check produces its own report (`build/reports/crap-java/report.html`) as part of the `./gradlew drop-a-duce` task chain, but opening it is on you — see step 3. This section covers the other two checks, which get combined into a second, separate report.

Run feature toggle coverage and assertion density before writing anything — don't post findings check-by-check as they finish. Once both have completed:

1. Post a brief markdown summary in chat (a few lines: counts per check, whether anything blocks the commit — CRAP findings included).
2. Assemble the two results into a single JSON object matching this shape (either field's array/flag may be empty/false):

   ```json
   {
     "toggle": [ { "file": "path", "line": 12, "issue": "what's ungated", "why": "..." } ],
     "assertionDensity": { "ratio": 0.032, "threshold": 0.1, "flagged": true,
                            "sourceFiles": 10, "sourceLoc": 500, "testFiles": 4, "asserts": 16 }
   }
   ```

   Write it to `build/reports/review-agent/data.json` (create the directory if it doesn't exist). `assertionDensity` fields come straight from `assert-density.sh`'s `TOTAL` line — no reshaping needed beyond field selection.
3. Render both reports and explicitly open both of them yourself — don't rely on `openCrapJavaReport`'s own `open` call, it doesn't reliably surface a window:

   ```bash
   node .claude/skills/review-agent/scripts/render-report.js build/reports/review-agent/data.json build/reports/review-agent/report.html
   open build/reports/crap-java/report.html
   open build/reports/review-agent/report.html
   ```

Every run of this skill must end with both report windows open — the CRAP report and the toggle/assertion-density report. Keep each section's findings in the format already specified under that check above — this step only governs how results get assembled and presented, not what counts as a finding.
