## Revised: add Title as a safe-bet twin where it actually helps

### Rule shape per collection group

**Single-category** (`clothing`, `shoes`, `bags`, `accessories`) — `disjunctive: true` (ANY), 2 rules:
- `Tag Equals <Category>`
- `Title Contains <Category>` (singular form too where useful: shoe/bag — see note)

**Composite gender + category** (`women-clothing`, `men-clothing`, `women-shoes`, `men-shoes`, `women-bags`, `men-bags`, `women-accessories`, `men-accessories`) — `disjunctive: false` (ALL), 2 rules:
- `Tag Equals Women` (or `Men`)
- `Tag Equals <Category>`

Title-contains **does not safely combine with AND-matching** on composites: a rule like `Title Contains Clothing` would force every product title to literally include the word "Clothing", which kills membership (almost no titles do). For composites the Tag+Tag intersection is already the correct, safe answer (~1,138 for women-clothing).

**Brand collections** — untouched; keep the existing `Vendor Equals X` OR `Title Contains X` (disjunctive=true) twin you already approved.

### Title-contains conditions per category

| Category | Title Contains values (one rule each, OR'd via disjunctive) |
|---|---|
| Clothing | (skipped — too generic, no titles contain the word "Clothing") |
| Shoes | "Shoes" — covers "Pumps Shoes", "Leather Shoes", etc. Also acceptable: leave Tag only. |
| Bags | "Bag" — singular catches "Shoulder Bag", "Tote Bag", "Crossbody Bag". |
| Accessories | (skipped — generic; titles say "Scarf"/"Belt"/"Hat" not "Accessories") |

So Title-contains twin gets added only to `shoes` (→ "Shoes") and `bags` (→ "Bag"). `clothing` and `accessories` stay Tag-only, single rule, no false-safety added.

### Final per-handle outcome

| Handle | Rules | Match |
|---|---|---|
| clothing | Tag=Clothing | ANY (1 rule) |
| shoes | Tag=Shoes OR Title contains "Shoes" | ANY |
| bags | Tag=Bags OR Title contains "Bag" | ANY |
| accessories | Tag=Accessories | ANY (1 rule) |
| women-clothing | Tag=Women AND Tag=Clothing | ALL |
| men-clothing | Tag=Men AND Tag=Clothing | ALL |
| women-shoes | Tag=Women AND Tag=Shoes | ALL |
| men-shoes | Tag=Men AND Tag=Shoes | ALL |
| women-bags | Tag=Women AND Tag=Bags | ALL |
| men-bags | Tag=Men AND Tag=Bags | ALL |
| women-accessories | Tag=Women AND Tag=Accessories | ALL |
| men-accessories | Tag=Men AND Tag=Accessories | ALL |

### Execution

1. Patch `public/imports/smart-collections-matrixify-fixed.csv`: rewrite the 12 handles above per the table.
2. Run `scripts/shopify/update-smart-collection-rules.mjs --dry`, inspect payloads for those 12.
3. Run live push.
4. Verify by counting products in `women-clothing`, `men-shoes`, `women-bags`, `shoes` via Admin REST.

If you'd rather also add Title-contains to `clothing` / `accessories` despite the low yield, say the word and I'll include them.
