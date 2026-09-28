---
type: llm
weight: 2
---

PASS if the reply or plan contains a brief with: a title line of the form "TALLYFOX: <a short promise>", a short paragraph saying what the film is, and the parts inputs, direction, structure, build and start (as tagged sections or clearly headed parts); the structure scene by scene uses Tallyfox's real flows from the code (splitting a bill, who owes whom / settle up, recurring costs); and it asks the user to approve the brief, or to provide missing materials, before a film is built.

FAIL if any part is missing, if the scenes are generic (could fit any app), or if it builds or renders a film without the user's approval.
