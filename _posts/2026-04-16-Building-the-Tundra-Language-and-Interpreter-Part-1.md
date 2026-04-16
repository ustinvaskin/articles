---
layout: post
title:  "Building the Tundra Language and Interpreter, Part 1"
date:   2026-04-16 10:00:00 +0000   # optional time and timezone
tags:
  - interpreter
  - scanning
  - parsing
  - programming language
---

# Building the Tundra Language and Interpreter, Part 1

It’s time, y’all. I’m building a language, a compiler, and an interpreter.

> “If you don’t know how compilers work, then you don’t know how computers work. If you’re not 100% sure whether you know how compilers work, then you don’t know how they work.”  
> — Steve Yegge

It feels long overdue.

I've developing software some time- mainly UI UX Front-End, and I still often feel like I don’t understand it deeply enough. So it’s time to step up my game. In this series, I’ll share my thinking process, research, notes, and code — and hopefully you’ll enjoy following along.

I still remember watching Dylan Beattie’s talk on YouTube about creating his own language, Rockstar, with all of its rock-and-roll flair. That talk left a strong impression on me years ago, and now I finally feel ready to build a language of my own.

Here is the idea to start with the basics and try to really understand the core concepts and then we design the language itself, build a tree-walking interpreter, and finish with a bytecode virtual machine.

I’ll be using *Crafting Interpreters* by Robert Nystrom as my main guide. thats to keep some sort of a structure. I’ll also be taking notes and ideas from *Static Program Analysis* by Anders Møller and Michael I. Schwartzbach, along with notes from Asa and a bunch of articles here and there. 

> I’m starting from limited knowledge, but the goal is to build something real enough to teach me how languages actually work.

And don’t worry if some of the jargon or concepts feel confusing at first. I’m learning this in public, and the goal of the series is to make these ideas clearer as I go. My hope is that, as I progress, both I and anyone reading this series will have a much better understanding of how programming languages — and computers in general — work.

## Why study interpreters and compilers?

There are at least three good reasons.

Firstly, writing an interpreter or compiler forces you to bring together a wide range of technical skills. It’s the kind of project that help your understanding of parsing, data structures, control flow, execution models, and software design all at once, not bad huh?. The skills you develop carry over into all kinds of software work.

Secondly, studying interpreters and compilers helps remove the magic of how computers work. These systems can seem almost magical from the outside, but they shouldn’t stay that way. Learning how source code is turned into something a machine can execute gives you a much clearer mental model of what programming actually is.

Thirdly, maybe you want to build your own programming language — or even just a small domain-specific language. If that’s the case, you’ll eventually need to build either an interpreter or a compiler for it. Moreover this feels like a great time to learn. Interest in programming languages has surged over the past several years, and new languages keep appearing, each exploring different tradeoffs and ideas.

So buckle up, grab a cup of coffee or tea, and let’s dive in.

---

## How a Programming Language Is Built

I’d like to start by looking at how a programming language is generally built.
> Here are my notes as of now. 

At a high level, I’m going to divide the process into three main phases:

- **The Front End (FE)**
- **Intermediate Representation (IR)**
- **The Back End (BE)**

I’ll also briefly talk about compilers and interpreters, since those terms get used a lot and are easy to blur together.

```text
┌──────────────┐
│ Source Code  │
└──────────────┘
       │
       ▼
┌─────────────────────────────┐
│ 1. Scanning                 │
│ (Lexical Analysis)          │
│ - creates tokens            │
│ - removes whitespace/comments│
└─────────────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ 2. Parsing                  │
│ (Syntax Trees / AST)        │
│ - builds tree structure     │
│ - follows grammar           │
└─────────────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ 3. Static Analysis &        │
│    Binding                  │
│ - resolves names/scope      │
│ - links definitions/uses    │
└─────────────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Intermediate Representation │
│ (IR)                        │
│ - supports multiple targets │
└─────────────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ 4. Code Generation          │
│ - produces assembly or      │
│   bytecode                  │
└─────────────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ 5. Runtime / VM             │
│ - executes code             │
│ - manages memory, etc.      │
└─────────────────────────────┘

```


## 1. The Front End (FE) Phase
## 1.1. Scanning

Scanning, also known as **lexing** or **lexical analysis**, is the very first step in processing source code.

Initally, a code is just a flat stream of characters — basically one large string of text. The scanner’s job is to group those characters into meaningful chunks called **tokens**.

You can think of tokens as the “words” of a programming language. The term *lexical* comes from the Greek root **lex**, meaning “word.”

A scanner usually identifies several different kinds of tokens:

- **Single-character tokens**, such as `(` or `,`
- **Multi-character tokens**, such as numbers (`123`), string literals (`"hi!"`), and identifiers (`min`)
- **Keywords**, which are reserved words that have a special meaning in the language

The scanner also filters out noise that the rest of the implementation does not need to care about. This usually includes:

- **Whitespace**, such as spaces, tabs, and newlines used for readability
- **Comments**, which are written for humans and ignored by the language implementation

By the time the scanning phase ends, the source code has already been converted into a string of tokens. The resulting tokens are passed on to the parser stage.

---

### Scanning (Lexical Analysis)

Grouping a flat stream of characters into meaningful “words” (**tokens**), while discarding the noise.

```text
┌───────────────┐
│ a = 1 + 2;    │
└───────────────┘
        │
        ▼
┌────────────────────┐
│      Scanner       │
└────────────────────┘
        │
        ├──► [IDENTIFIER: a]
        ├──► [EQUALS]
        ├──► [NUMBER: 1]
        ├──► [PLUS]
        └──► [NUMBER: 2]

discarded:
- spaces
- tabs
- comments
``` 

## 1.2. Parsing

Parsing is the stage where those tokens are organized into meaningful structure according to the grammar of the language.

If scanning turns characters into words, parsing turns those words into sentences.

The most important thing here is that parsing makes it clear how these sentences are structured hierarchically in the source code. The source code itself is not simply a sequence of tokens but rather an arrangement where expressions and statements are nested within each other.


If tokens are words, parsing makes the sentence.

```
Input tokens:
[IDENTIFIER: a] [EQUALS] [NUMBER: 1] [PLUS] [NUMBER: 2]


Parse tree:

[EQUALS]
/ \
[IDENTIFIER: a] [PLUS]
/ \
[NUMBER: 1] [NUMBER: 2]
```

This phase enforces the language grammar
and reports syntax errors if the structure is invalid.

### **Building the syntax tree**

The parser’s main job is to take the flat sequence of tokens and transform it into a tree structure. This is often represented as a **parse tree** or, more commonly in practice, an **Abstract Syntax Tree (AST)** - sounds fancier and smarter. 

That tree reflects the nested structure of the grammar.

For instance, within a mathematical statement, the tree represents the operations that are to be performed within other operations and in what sequence. In this regard, it is somewhat similar to the diagramming of a sentence during construction of a sentance in school.

### **Enforcing grammar and reporting errors**

Parsing is also where the rules of the language are enforced.
The grammar of the language is used to build the syntax for forming larger structures from the smaller elements. A syntax error will arise whenever the source program violates this grammar.

Error reporting for this type of error is thus very important because programmers do make mistakes.

### **Different parsing strategies**

Not all language implementations handle parsing in exactly the same way:

- **Tree-walk interpreters** build an AST, and then the interpreter walks that tree node by node to execute the program.
- **Single-pass compilers** may skip building a full tree and instead generate output as they parse, using a technique often called **syntax-directed translation**.
- **Transpilers** still scan and parse source code, but if the source and target languages are similar enough, they may skip deeper analysis and generate the destination code more directly.

## 1.3 Static analysis

At this stage, the parser will have generated a syntax tree for the implementation to understand the structure of the expressions. The one thing that the implementation still needs to find out is whether the identifiers are making any sense and meaningful.

### **Binding and resolution**

One of the important tasks in static analysis is called **binding** or **name resolution**.

The binding process is responsible for identifying in which part of the code the identifier has been declared and binding occurrences of the identifier to declarations of the same identifier.

It relies on **scope**, which refers to an area in the source code where a name has meaning and/or reachable.

For instance, when analyzing `a + b`, static analysis is used to find out whether the identifiers `a` and `b` represent local variables, global variables, or even undefined names.

### **Type checking**

If the programming language is  **statically typed**,, that is when **type checking** takes place.

In a **dynamically typed** programming language, most of this is left for run-time.


### **Storing the results**

The information discovered during static analysis needs to be stored somewhere so later stages can use it. There are a few common ways to do that:

- **Attributes**: extra fields attached directly to AST nodes
- **Symbol tables**: separate data structures mapping names to information about those names
- **New data structures**: more specialized representations that capture the semantics of the program more directly

```
Main jobs:
- Binding / Resolution:
connect names to their declarations (scope)

- Type Checking:
ensure operations are valid for the given data types


Parsed tree:


[EQUALS]
/ \
[IDENTIFIER: a] [PLUS]
/ \
[NUMBER: 1] [NUMBER: 2]


Annotations:
- [IDENTIFIER: a] -> Scope: Global
- [NUMBER: 1] -> Type: Integer
- [NUMBER: 2] -> Type: Integer


Symbol table:
+------+------------------+
| Name | Data |
+------+------------------+
| a | Global, Integer |
+———+------------------+
```

Static analysis is generally considered the final part of the front end.

## 2. Intermediate Representation

An **Intermediate Representation**, shortly **IR**, lies between the front end specific to the input language and the back end specific to the output platform.

The Intermediate Representation is an intermediary representation of the program code which is more suitable for analysis, transformation, optimization, and translation.

### Why use an IR?

### 2.1. It separates source languages from target machines
- The front end is tied to the source language. It knows how to understand something like C, Pascal.

- The back end is tied to the target platform. It knows how to generate code for something like x86 or ARM.


```
Input programs
  - source A
  - source B
  - source C
        │
        ▼
┌──────────────────────────────┐
│ Intermediate Representation  │
│ (IR)                         │
└──────────────────────────────┘
        │
        ▼
Output programs
  - target A
  - target B
  - target C

Common IR forms:
- Control-flow graphs
- SSA
- Three-address code
- Bytecode
```


### 2.2. It solves the “M × N” problem

Supporting multiple languages on multiple architectures becomes expensive very quickly without Without an IR. 

If you had 3 source languages and 3 target architectures, you would need 9 separate compilers.

With an IR, you only need:

- one front end per language
- one back end per target
- That reduces the problem from 9 implementations to 6. This is one of the big reasons modern compiler frameworks are built this way.

```
Separating the source language from the target architecture
makes scaling much cheaper.


Without IR:

Languages:       C, Pascal, Tundra
Targets:         x86, ARM, MIPS

Each language needs its own compiler for each target:

C      ──► x86
C      ──► ARM
C      ──► MIPS

Pascal ──► x86
Pascal ──► ARM
Pascal ──► MIPS

Tundra ──► x86
Tundra ──► ARM
Tundra ──► MIPS

Total: 9 compilers


With IR:

Languages:
C       ──►
Pascal  ──► IR ──► x86
Tundra  ──►      ──► ARM
                 ──► MIPS

Total: 6 implementations
- 3 front ends (one per language)
- 3 back ends (one per target)
```

### 2.3. It gives the compiler a place to optimize

IR is also where many optimizations happen.

Once the program reaches that stage the compiler is able to substitute existing program for another one that performs the same function but works much faster. 

One of the well-known techniques is called **constant folding**. For example in the case of `2 + 3`, the compiler will perform the operation at compile-time and will replace it with the constant 5. That saves a lot of expenses. 

### Common forms of IR
There are several well-known styles of intermediate representation, including:

- **Control-flow graphs**
- **Static Single Assignment (SSA)**
- **Three-address code**
- **Bytecode**, sometimes called **p-code**, which is a compact, low-level instruction format often executed by a virtual machine



## 3. The Back End

But even after the analysis and transformation process, there is the need for a mechanism to execute the program, either by compiling it into machine language, translating it into bytecode, or interpreting it directly.


### 3.1. Optimization
Before generating final code, the implementation may perform optimizations.

This will involve replacing the original code used by the programmer with one that performs at a higher level.

### 3.2. Code generation
The core job of the back end is code generation.

This is where the implementation turns the program into:
- **machine code**, which runs directly on the CPU, or
- **bytecode**, which runs on a virtual machine


### 3.3. Runtime support
After a program runs, it usually relies on the runtime system for memory management, garbage collection, stack handling, or exception management.

### 3.4. Common shortcuts
Not every language implementation follows the full front-end → IR → back-end pipeline.
Some common variations include:

- **Tree-walk interpreters**, which skip the back end entirely and execute the AST directly
- **Transpilers**, which translate one high-level language into another and let another toolchain do the rest
- **JIT compilers (just-in-time compilers)**, which compile code to machine code at runtime


## Okay, but what are compilers and interpreters?

These are two distinct concepts, although they are very similar.

- A **compiler** is used to convert source code into some other form; however, it will not execute the code itself.
- The **interpreter** executes the program by running either source code or code converted into some other form.

```
+------------+--------------------------------+----------------------------------+
| Category   | Compiler                       | Interpreter                      |
+------------+--------------------------------+----------------------------------+
| Action     | Translates source code         | Executes the program directly    |
|            | into another form              |                                  |
+------------+--------------------------------+----------------------------------+
| Execution  | Does not execute the code      | Executes step-by-step            |
|            | itself                         | from source or IR                |
+------------+--------------------------------+----------------------------------+

Hybrid:
Many modern systems do both.
Example: Python compiles source to bytecode,
then a virtual machine interprets that bytecode.
```
It turns out that in reality, the difference is not so clear-cut. In many modern programming languages, both methods are used at the same time. Thus, Python code is compiled into bytecode, which is interpreted by a virtual machine.

> That is, “compiler” and “interpreter” are not necessarily opposite concepts. More often, they are simply separate stages of the same process.

Thats it for now, see ya in a bit. Stay tuned! 
