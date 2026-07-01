---
layout: post
title:  "When Runtime Evidence Helps LLMs Repair Code, and When It Does Not"
date:   2026-05-18 13:00:00 +0200
tags:
  - interpreter
  - programming language
  - llm
  - debugging
  - evaluation
  - research
---

Large language models are getting better at writing and repairing code, but
there is a question I kept coming back to while building Tundra:

```text
When a model fixes a bug, what kind of information actually helped it?
```

An error message tells you that something went wrong. It does not always tell
you where the responsible value came from, which branch sent execution down the
wrong path, or how the final result was produced.

That gap became the starting point for TundraTrace.

## The Basic Idea

TundraTrace is a small research project built around one comparison:

```text
same buggy program
same expected output
same failure information
one prompt without runtime evidence
one prompt with compact runtime evidence
```

Then I compare the repairs.

The point is not to ask whether traces always help. That question is too blunt.
The more useful question is:

```text
When does runtime evidence help, when does it do nothing, and when does it make
things worse?
```

Here is the whole idea in miniature:

<div class="evidence-flow" aria-label="Illustrative Tundra repair flow">
  <section class="evidence-flow__step">
    <p class="evidence-flow__label">1. Buggy code</p>
    <pre><code class="language-tundra">val raw = { price: "10" };
val total = raw.price + 5;
print(total);</code></pre>
  </section>

  <section class="evidence-flow__step">
    <p class="evidence-flow__label">2. Failure</p>
    <pre><code class="language-text">Cannot add
String and Number.</code></pre>
  </section>

  <section class="evidence-flow__step evidence-flow__step--accent">
    <p class="evidence-flow__label">3. Runtime evidence</p>
    <pre><code class="language-text">raw.price was
string "10"</code></pre>
  </section>

  <section class="evidence-flow__step evidence-flow__step--success">
    <p class="evidence-flow__label">4. Repair</p>
    <pre><code class="language-tundra">val raw = { price: 10 };
val total = raw.price + 5;
print(total);</code></pre>
  </section>
</div>

## Why I Used A Small Language

Most code benchmarks use popular languages like Python, JavaScript, or Java.
That is useful when the goal is realism, but it also makes some questions harder
to study cleanly.

If a model repairs a familiar Python bug, it may be reasoning from the prompt.
It may also be leaning on patterns it has already seen many times before.

For TundraTrace, I wanted tighter control over the experiment, so I used
TundraCore, the small language I have been building in earlier posts.

```text
TundraCore   = the small language and interpreter
TundraTrace  = the compact runtime-evidence layer
TundraBench  = the benchmark and evaluation harness
```

Tundra is not here because I think everyone should start writing production
software in a new language. It is here because a small language is easier to
hold still while testing one idea at a time.

## What I Mean By Runtime Evidence

The main kind of evidence I studied is **value provenance**.

Imagine a program where the final addition fails because one value is still a
string:

```tundra
val raw = {
  price: "10"
};

val item = {
  cost: raw.price
};

val cart = [item];
val subtotal = cart[0].cost;
val total = subtotal + 5;

print(total);
```

A normal runtime error can say:

```text
Cannot add String and Number.
```

That is true, but not very generous.

A compact provenance trace can say:

```text
subtotal came from cart[0].cost
cart[0].cost came from item.cost
item.cost came from raw.price
raw.price was string "10"
```

Now the model sees not only the symptom, but the path the value took before the
failure.

The benchmark also includes two other evidence families:

- **branch behavior**: which condition or branch caused the wrong behavior;
- **final-value history**: how the final output changed over time, such as an
  accumulator being overwritten instead of updated.

## The Experiment

The final benchmark contains 36 repair tasks. For each task, I tested:

- three local coding models;
- a baseline prompt;
- an evidence-assisted prompt;
- three trials per condition;
- strict scoring and normalized scoring.

The strict-versus-normalized split turned out to matter more than I expected.

Strict scoring uses the raw model output exactly as returned. Normalized scoring
removes only wrappers such as Markdown fences or surrounding prose before
executing the code. It does **not** fix syntax, change expressions, or repair the
program for the model.

That distinction is useful because two failures can look similar at first:

```text
the model did not understand the bug
the model fixed the bug but returned the answer in the wrong format
```

Those are not the same failure.

## What Happened

Overall, compact runtime evidence helped:

```text
baseline normalized success:           194 / 324
evidence-assisted normalized success:  228 / 324
```

That is an increase from **59.9%** to **70.4%**.

On value-provenance tasks, the result also improved:

```text
baseline:           138 / 216
evidence-assisted:  156 / 216
```

The comparison I care about is very simple:

<div class="equation-card" aria-label="Delta equals evidence-assisted success rate minus baseline success rate">
  <span class="equation-symbol">Δ</span>
  <span>=</span>
  <span>p(evidence-assisted)</span>
  <span>−</span>
  <span>p(baseline)</span>
</div>

For the full benchmark:

```text
228 / 324 - 194 / 324 = +10.5 percentage points
```

The main slices look like this:

| Task slice | Baseline | Evidence-assisted | Change |
| --- | ---: | ---: | ---: |
| All tasks | 59.9% | 70.4% | +10.5 pp |
| Value provenance | 63.9% | 72.2% | +8.3 pp |
| Low-leakage value provenance | 88.9% | 84.8% | -4.0 pp |
| Medium-leakage value provenance | 46.3% | 66.7% | +20.4 pp |

But the most interesting part was not the average.

The gain was not uniform.

```text
low-leakage value-provenance tasks:      88.9% -> 84.8%
medium-leakage value-provenance tasks:   46.3% -> 66.7%
```

So the cleanest, least leading traces did **not** show a positive advantage in
this benchmark. The strongest gains appeared when the evidence narrowed the
suspicious behavior enough to be useful, but still left the model to form the
repair.

That was a useful correction to my own intuition. More principled evidence is
not automatically more helpful if it is too weak to reduce the actual debugging
burden.

## The Part I Care About Most

I did not want the benchmark to end at one pass-rate table, so I also manually
audited 30 evidence-assisted repairs.

The labels were:

```text
used_evidence
ignored_evidence
misused_evidence
evidence_not_needed
unclear
```

The results were mixed in a way that felt more realistic than a single summary
number:

- some repairs clearly followed the evidence;
- some passed even though the evidence was not really needed;
- some ignored it;
- some reacted to it and still repaired the program in the wrong way.

That last group matters. Runtime evidence is not magic context. A model can see
the right clue and still do the wrong thing with it.

## What I Think This Means

The main lesson is not:

```text
traces help LLMs repair code
```

It is closer to:

```text
runtime evidence is a conditional repair signal
```

It can help when the evidence reduces a real localization burden. It may do very
little when the task is already easy, and it may still be misused when the model
does not have enough repair ability to act on the clue well.

For me, that makes the problem more interesting rather than less.

The next question is not only whether to provide evidence, but what kind of
evidence to provide for a particular bug and model:

- how much detail is enough;
- when a compact trace is better than a verbose one;
- when evidence should stay quiet because the model does not need it;
- and whether the same pattern holds in mainstream languages like Python.

## Where The Project Lives

Artifacts:

- [GitHub artifact bundle](https://github.com/ustinvaskin/TundraTrace-artifacts)
- [Zenodo archive](https://doi.org/10.5281/zenodo.20228789)

Related component repositories:

- [TundraCore](https://github.com/ustinvaskin/TundraCore)
- [TundraTrace](https://github.com/ustinvaskin/TundraTrace)
- [TundraBench](https://github.com/ustinvaskin/TundraBench)

This project started with a small language experiment. It has now turned into a
more focused question about debugging evidence, model behavior, and how to study
repair without pretending that one headline number explains everything.
