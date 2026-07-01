---
layout: post
title:  "TundraTrace: Separating Semantic Repair from Output Compliance in LLM Debugging"
date:   2026-05-13 22:30:00 +0200
tags:
  - interpreter
  - programming language
  - llm
  - debugging
  - evaluation
---

Large language models are getting better at repairing code, but a hard question
still sits underneath the progress:

```text
When a model fixes a bug, is it reasoning about the program, or is it matching
familiar repair patterns?
```

TundraTrace studies that question with a tiny programming language, a
provenance-aware runtime, and a benchmark harness that compares ordinary error
messages with compact runtime evidence.

The early result is not that provenance magically improves repair. The stronger
result is that a controlled runtime-evidence benchmark can separate several
things that often get blurred together:

- semantic repair ability,
- output-format compliance,
- model identity,
- bug type,
- prompt version,
- and evidence design.

<div class="finding">
<strong>Main thesis.</strong> TundraTrace is not yet proof that provenance
improves LLM repair. It is evidence that controlled runtime-evidence benchmarks
can expose the difference between repairing a program, following an output
protocol, and succeeding only because a task is easy for a particular model.
</div>

## The Experiment

The experiment compares two versions of the same repair task.

| Condition | What the model sees |
| --- | --- |
| Error-only | Buggy program, runtime error or wrong output, expected output |
| Evidence-assisted | The same material, plus compact runtime evidence |

Then the model returns a repaired Tundra program, and TundraBench runs it.

```text
Buggy program
    |
    v
Run in Tundra
    |---------------------------.
    v                           v
Error or wrong output       Runtime evidence
    |                           |
    v                           v
Error-only prompt          Evidence prompt
    |                           |
    '-------------.-------------'
                  v
              LLM repair
```


**Figure 1.** The paired repair setup. The same bug is evaluated with and
without runtime evidence.

The useful question is not simply:

```text
Does provenance help?
```

The better question is:

```text
When does runtime evidence help, for which models, and for which bug types?
```

## Key Terms

**Value provenance** means evidence about where a runtime value came from and
how it moved through the program. If a string `"42"` causes a type error,
provenance can show the record field, expression, or assignment that produced
that string.

**Branch-behavior evidence** means evidence about control flow: which condition
was evaluated, what it evaluated to, which branch executed, and what output
followed. It is runtime evidence, but it is not the same thing as value-origin
provenance.

**Trace leakage** means the runtime evidence may reveal the repair too directly.
For example, a branch trace that says "the else branch executed, but the
expected output was in the if branch" may act more like a debugging hint than a
neutral trace.

**Strict scoring** runs the model output exactly as returned.

**Normalized scoring** applies conservative cleanup, such as extracting code
from Markdown fences, then runs the extracted program. It answers a different
question from strict scoring: whether the model produced a recoverable repair,
not whether it followed the deployment-style output contract.

## Why Tundra Exists

Most code benchmarks use popular languages like Python, JavaScript, Java, or
C++. Those are realistic, but they make it harder to separate semantic reasoning
from familiarity. A model has seen huge amounts of those languages.

Tundra is intentionally small and unfamiliar. It gives the experiment a cleaner
environment:

- the grammar is fixed,
- runtime behavior is controlled,
- task categories are explicit,
- traces can be designed carefully,
- and the same interpreter can score every repair.

The language is not the product. It is the testbed.

```text
TundraCore   = small language and interpreter
TundraTrace  = provenance-aware runtime evidence
TundraBench  = prompts, model runs, scoring, and summaries
```

```text
TundraCore  ->  TundraTrace  ->  TundraBench
 language       runtime          prompts, runs,
 interpreter    evidence         scoring, summaries
```


**Figure 2.** Project structure. The language exists to make the runtime
evidence and benchmark controllable.

## A Provenance Example

Consider a program where a value has the wrong type:

```tundra
val user = { name: "Ada", age: "42" };
val next = user.age + 1;
print(next);
```

A plain runtime error might say:

```text
type mismatch: cannot add string and number
```

A provenance-aware trace can add the path:

```text
value "42"
  came from record field user.age
  created by expression { name: "Ada", age: "42" }
  used in expression user.age + 1
  failed because + expected numbers
```

The trace does not need to say:

```tundra
change "42" to 42
```

The model still has to localize the cause and choose a repair. That is the
behavior TundraTrace is trying to measure.

## The Best Early Lesson: Scoring Is Part Of The Experiment

One of the most portable findings has nothing to do with provenance directly.
Models often return correct-looking code wrapped in prose:

````text
Here is the fixed program:

```tundra
val x = 1;
print(x);
```
````

The code inside the fence may be correct, but the raw response is not directly
executable Tundra. So TundraBench reports both strict and normalized scores.

| Scoring mode | Question answered |
| --- | --- |
| Strict | Did the model return directly executable Tundra? |
| Normalized | Did the model produce a repair that can be recovered by documented cleanup? |

This produced the most reusable methodological finding:

```text
semantic repair ability != protocol-following ability
```

A model can understand the bug and still fail by returning Markdown. Another
model can return clean code and still repair the wrong thing.

## Prompt v2: Output Discipline Is Model-Sensitive

After seeing wrapper and prose failures, I added prompt `v2`, which keeps the
same Tundra reminders but adds an explicit output contract:

```text
Return only raw Tundra source code.
Do not use Markdown fences.
Do not write explanations, headings, commentary, or "Here is..." text.
The entire response must be directly executable by the Tundra interpreter.
```

This does not reveal the fix. It only clarifies the required format.

On a matching subset, prompt `v2` changed strict scoring dramatically while
leaving normalized repair almost unchanged.

| Prompt | Strict | Normalized |
| --- | ---: | ---: |
| v1 | 1 / 24 | 18 / 24 |
| v2 | 12 / 24 | 17 / 24 |

**Figure 3.** Prompt `v2` improved executable-output compliance, not semantic
repair ability, on this subset.

The model-specific result was sharper.

| Model | v1 strict | v1 normalized | v2 strict | v2 normalized |
| --- | ---: | ---: | ---: | ---: |
| `qwen2.5-coder:14b` | 1 / 12 | 12 / 12 | 12 / 12 | 12 / 12 |
| `deepseek-coder:6.7b` | 0 / 12 | 6 / 12 | 0 / 12 | 5 / 12 |

For `qwen2.5-coder:14b`, prompt `v2` closed the strict/normalized gap on this
subset. For `deepseek-coder:6.7b`, it did not.

<div class="finding">
<strong>Finding.</strong> Output protocol compliance is prompt-sensitive and
model-sensitive. It should be treated as a separate experimental factor from
repair correctness.
</div>

## The Prompt-v2 Pilot

The larger prompt-v2 pilot used:

| Dimension | Value |
| --- | --- |
| Models | `qwen2.5-coder:14b`, `qwen2.5-coder:latest`, `deepseek-coder:6.7b` |
| Tasks | type mismatch, wrong index, wrong branch, incorrect accumulator |
| Conditions | error-only, evidence-assisted |
| Trials | 3 per model/task/condition |
| Scoring | strict and normalized |
| Total rows | 144 scored rows |

The aggregate result was small but directionally positive for evidence-assisted
prompts.

| Slice | Passed |
| --- | ---: |
| All scored rows | 70 / 144 |
| Strict scoring | 28 / 72 |
| Normalized scoring | 42 / 72 |
| Error-only condition | 33 / 72 |
| Evidence-assisted condition | 37 / 72 |

That aggregate result is not the main story. The model and bug-type effects are
larger.

| Model | Passed |
| --- | ---: |
| `qwen2.5-coder:14b` | 39 / 48 |
| `qwen2.5-coder:latest` | 23 / 48 |
| `deepseek-coder:6.7b` | 8 / 48 |

The careful reading is:

```text
Evidence-assisted prompts were slightly ahead overall, but the effect was
smaller than differences between models, bug types, and scoring modes.
```

## Model And Bug-Type Profiles

The benchmark is already doing something useful: it does not only say one model
is better than another. It shows where each model breaks.

| Model | Type mismatch | Wrong index | Accumulator | Wrong branch |
| --- | ---: | ---: | ---: | ---: |
| `qwen2.5-coder:14b` | 6 / 6 | 6 / 6 | 6 / 6 | 3 / 6 |
| `qwen2.5-coder:latest` | 6 / 6 | 5 / 6 | 2 / 6 | 0 / 6 |
| `deepseek-coder:6.7b` | 2 / 6 | 3 / 6 | 2 / 6 | 1 / 6 |

Across all models and scoring modes, the task types separated clearly.

| Bug type | Passed |
| --- | ---: |
| Type mismatch | 26 / 36 |
| Wrong index | 21 / 36 |
| Incorrect accumulator | 16 / 36 |
| Wrong branch | 7 / 36 |

Type mismatch was comparatively easy. Wrong index was medium difficulty.
Accumulator bugs separated the stronger model from the weaker ones. Wrong
branch was the hardest, and it often produced valid programs with the wrong
output.

This matters because runtime evidence is easiest to study in the middle range:
tasks that are not solved almost always and not failed almost always.

## Condition By Bug Type

The condition split was more modest.

| View | Error-only | Evidence-assisted |
| --- | ---: | ---: |
| Strict, all tasks | 13 / 36 | 15 / 36 |
| Normalized, all tasks | 20 / 36 | 22 / 36 |
| Normalized type mismatch | 7 / 9 | 7 / 9 |
| Normalized wrong index | 7 / 9 | 7 / 9 |
| Normalized wrong branch | 2 / 9 | 2 / 9 |
| Normalized incorrect accumulator | 4 / 9 | 6 / 9 |

The clearest condition difference in this run was the accumulator task. Type
mismatch and wrong index were equal by condition, and wrong branch was equally
difficult under both conditions.

<div class="finding">
<strong>Result.</strong> Runtime evidence effects appear task-specific and
smaller than model and bug-type effects in this pilot.
</div>

## Case Study: The Wrong-Branch Audit

The wrong-branch task is the best case study because it shows why simple
expected-output scoring can reward bad repairs.

The buggy program was:

```tundra
val score = 72;
val threshold = 80;

if (score > threshold) {
  print("review");
} else {
  print("pass");
}
```

Expected output:

```text
review
```

The clean repair is:

```tundra
if (score < threshold) {
  print("review");
} else {
  print("pass");
}
```

The evidence-assisted condition included branch-behavior evidence:

```text
score was 72
threshold was 80
condition score > threshold evaluated to false
the program executed the else branch
actual output was "pass"
expected output was "review"
```

This is useful runtime evidence, but it also carries trace-leakage risk. It is
close to saying which branch should have executed.

### A Small Visual Audit

This is the heart of the article in one glance: a patch can be executable, or
even pass a test, without being the most semantically faithful repair.

<div class="repair-compare">
  <div class="repair-card repair-card--good">
    <h4>Semantic repair</h4>
    <p>Changes the logic that was actually wrong.</p>
    <pre><code>if (score &lt; threshold) {
  print("review");
} else {
  print("pass");
}</code></pre>
    <p><strong>Result:</strong> passes and fixes the decision rule.</p>
  </div>
  <div class="repair-card repair-card--bad">
    <h4>Plausible but still wrong</h4>
    <p>Makes a local operator edit without reasoning through the values.</p>
    <pre><code>if (score &gt;= threshold) {
  print("review");
} else {
  print("pass");
}</code></pre>
    <p><strong>Result:</strong> still prints <code>pass</code> for 72 and 80.</p>
  </div>
  <div class="repair-card repair-card--warn">
    <h4>Passes for the wrong reason</h4>
    <p>Matches the test output without repairing the branch condition.</p>
    <pre><code>if (score &gt; threshold) {
  print("pass");
} else {
  print("review");
}</code></pre>
    <p><strong>Result:</strong> passes one test, but by swapping labels.</p>
  </div>
</div>

That is the distinction TundraTrace is trying to preserve: not just whether a
model produced something runnable, but whether it repaired the right thing for
the right reason.

### The Plausible Wrong Fix

The dominant wrong repair was:

```tundra
if (score >= threshold) {
  print("review");
} else {
  print("pass");
}
```

This looks like a reasonable local operator edit. But it still fails:

```text
72 >= 80 is false
```

So the program still prints:

```text
pass
```

That failure is informative. Several models localized the suspicious condition
but did not reason through the runtime values deeply enough to choose the
correct comparison.

### Passing Can Still Be Suspicious

One output passed by swapping the printed strings:

```tundra
if (score > threshold) {
  print("pass");
} else {
  print("review");
}
```

That passes the single test because the else branch executes. But it is less
semantically direct than changing the condition.

Another output passed by changing the input:

```tundra
val score = 92;
```

That makes the original condition true, but it changes the test data rather
than repairing the branch logic.

The audit found these qualitative labels:

| Label | Meaning |
| --- | --- |
| `wrong_operator_ge` | Changed `>` to `>=`, still wrong for the observed values |
| `preserved_original_behavior` | Kept behavior that still prints `pass` |
| `swapped_print_outputs` | Passed by moving labels rather than fixing the condition |
| `changed_input_value` | Passed by changing test data |
| `changed_else_literal` | Treated the issue as an output-label typo |
| `prose_no_code` | Returned explanation instead of executable code |
| `correct_condition_flip` | Produced the intended `score < threshold` repair |

For `qwen2.5-coder:14b`, there was a candidate signal: it produced the clean
condition flip in two evidence-assisted trials, but not in error-only trials.
That is not enough to claim branch evidence helps in general. It is enough to
justify more branch tasks with multiple tests.

<div class="finding">
<strong>Case-study lesson.</strong> Aggregate pass rate hides repair quality. A
passing patch can be semantically suspicious, and a failing patch can still show
partial localization.
</div>

## Failure Modes

Across the 144 scored prompt-v2 rows:

| Failure mode | Count |
| --- | ---: |
| Passed | 70 |
| Syntax error | 50 |
| Wrong output | 21 |
| Runtime error after patch | 3 |

The pattern is useful:

- syntax errors remain common for weaker models,
- wrong output dominates wrong-branch behavior,
- normalized scoring recovers wrapper/prose failures but not semantic errors,
- and parse validity, runtime success, expected-output match, and output
  discipline should be reported separately.

## What This Means

The pilot supports a narrower and more useful claim than "provenance helps."

TundraBench is already useful because it can separate:

- models that understand the repair but return unusable wrappers,
- models that follow the output protocol but repair the wrong thing,
- bug types that are too easy,
- bug types that are too hard,
- and tasks where runtime evidence may change the kind of repair attempted.

The strongest current findings are:

| Finding | Why it matters |
| --- | --- |
| Strict and normalized scores diverge | Repair reasoning and output compliance are different skills |
| Prompt `v2` helps one model but not another | Output discipline is model-sensitive |
| Bug types separate clearly | Aggregate pass rate is too blunt |
| Wrong-branch failures are qualitatively rich | Single-output scoring can reward bad repairs |
| Evidence effects are task-specific | Future runs need stratified analysis, not one headline number |

## Limitations

<div class="warning">
<strong>Limits.</strong> This is a developmental pilot, not proof that runtime
provenance improves repair. The sample is small, local model behavior may not
generalize, and branch-behavior evidence may leak hints. The results justify
better experiments, not a broad claim.
</div>

The main validity risks are:

- **trace leakage:** evidence may reveal the fix too directly,
- **prompt sensitivity:** prompt changes can alter strict scores,
- **small sample size:** one task per bug type is not enough,
- **local model constraints:** Ollama model behavior may not generalize,
- **single-test overfitting:** wrong-output tasks can pass for the wrong reason.

<section class="keep-together">
<h2>Current Best Claim</h2>
<p>The best current claim is:</p>
<blockquote>
In developmental pilot experiments, TundraBench produced meaningful variation
across models, bug types, scoring modes, prompt versions, and prompt
conditions. Evidence-assisted prompts scored slightly higher than error-only
prompts in one prompt-v2 pilot, but the effect was small compared with model
and bug-type effects. The benchmark is already useful because it exposes where
models fail: output discipline, syntax, runtime behavior, semantic repair,
branch reasoning, and task overfitting.
</blockquote>
<p>This is deliberately cautious. The project has not proved that provenance
works. It has shown that the right experimental setup can make the question
measurable.</p>
</section>

## What Comes Next

The next version should improve task design before scaling the benchmark.

Priorities:

1. Add multiple tests for wrong-output tasks.
2. Add more wrong-branch tasks with different structures.
3. Separate `value_origin` evidence from `branch_behavior` evidence.
4. Freeze prompt `v2` for the next pilot.
5. Keep strict and normalized scoring.
6. Add more medium-difficulty tasks.
7. Add qualitative labels for suspicious passes and partial localization.

Good next task variants include:

- wrong boolean flag branch,
- nested record field used in a condition,
- branch condition involving a parsed string number,
- branch whose failing value comes through a helper function,
- wrong copied value,
- wrong field after two-step value movement,
- swapped function arguments with records,
- and accumulator bugs with simpler loop bodies.

## Final Takeaway

Runtime traces are not magic. They can help, distract, leak hints, or be ignored.

The value of TundraTrace is that it makes those differences visible. Instead of
asking whether an LLM "can debug," it asks what kind of debugging behavior the
model is showing: semantic repair, output compliance, pattern matching, trace
use, or task overfitting.

That is the more interesting measurement problem.
