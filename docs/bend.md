# Bend proof workflow

Bend 2.0.38 is a development-time verification tool in this project.
Run from the repository root:

```sh
./tool/verify_bend.sh
```

The script finds the local Bend and elan installations, checks the Bend version,
and requires `bend PROOF.bend --verdict` to succeed. It never silently downgrades
to the ordinary checker. Lean 4.34.0 is required by this Bend release.

## Setup on another machine

Review and run the official installer:

```sh
curl -fsSL https://bend-lang.com/install.sh | sh
```

The URL currently installs 2.0.38; if it later installs another version, review
compatibility before changing the verification script's version pin.

Install elan from its official repository, then select
`elan toolchain install leanprover/lean4:v4.34.0`. The verification script adds
`~/.elan/bin` to its own PATH. A fresh shell on this machine also includes both
Bend and elan through `~/.zprofile`.

## Files and change discipline

- `BendModel.bend`: executable pure reference model.
- `LAWS.bend`: statements of the intended rules.
- `PROOF.bend`: proofs of those statements.
- `tool/verify_bend.sh`: explicit local verification gate.

Read `bend guide` before writing Bend. Change the model and proofs together;
do not weaken or delete laws just to get a passing check. A changed requirement
needs an explicit explanation and the user's authorization. Run the gate after
related changes and before committing them. Parallelize Bend computations only
where independent work and workload measurements justify it.

## What a passing check means

The declared properties hold for the Bend reference model under the checker and
kernel's assumptions. The proof does not establish the correctness of another
language's implementation, browsers, databases, native devices, or the compiler
backends. There is no generated production-code binding in this initial setup.
Keep existing tests and deployment or device gates.

Official references: [Bend repository](https://github.com/bendlang/bend),
[language guide](https://github.com/bendlang/bend/blob/main/guide/GUIDE.md),
[elan](https://github.com/leanprover/elan).

## Website scope

The published source is preserved at the repository root and the replacement
Astro application lives under `site/`. The initial model routes business enquiries to Contact,
experience reviews to Experience, and article readers to Writing. Every modeled
destination has no payment handling. This captures the current brief, including
retaining the blog, without choosing a frontend framework.

These laws do not check actual page existence, links, contact submissions, or
payment scripts. The application currently validates built routes and has browser
journey evidence independently. Binding its route registry to this reference model
remains pending; passing browser or build checks is not a new Bend proof.
