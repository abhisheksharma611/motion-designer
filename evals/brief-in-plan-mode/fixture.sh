#!/usr/bin/env bash
set -euo pipefail
mkdir -p src/screens
cat > package.json <<'JSON'
{
  "name": "household-ledger-desktop",
  "productName": "Tallyfox",
  "version": "0.9.0",
  "private": true,
  "scripts": { "dev": "vite", "build": "vite build" }
}
JSON
cat > README.md <<'MD'
# Tallyfox

Tallyfox keeps a household's shared money in one place: split a bill in two taps, see who owes whom,
and set recurring costs once so rent and subscriptions split themselves every month.
MD
cat > src/screens/SplitBill.tsx <<'TSX'
export function SplitBill() {
  return <Sheet title="Split a bill"><AmountField /><PeoplePicker /><Button>Split evenly</Button></Sheet>;
}
TSX
cat > src/screens/Balances.tsx <<'TSX'
export function Balances() {
  return <Screen title="Who owes whom"><BalanceRow from="Sam" to="Ria" amount={42.5} /><Button>Settle up</Button></Screen>;
}
TSX
cat > src/screens/Recurring.tsx <<'TSX'
export function Recurring() {
  return <Screen title="Every month"><RecurringRow name="Rent" split="50/50" /><RecurringRow name="Internet" split="3 ways" /></Screen>;
}
TSX
