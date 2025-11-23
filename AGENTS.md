# CaseManagerDashboard – Agent Guide

## Development Environment
- Requires **Node.js 20+** and **npm**.
- Install dependencies with `npm install`.
- The Vite dev server runs on port **5000**.

## Common Commands
- `npm run dev` – start the Vite dev server.
- `npm run build` – build the static client bundle to `dist/public`.
- `npm run check` – type-check the entire codebase.
- `npm test` – run Vitest tests.

## Contribution Guidelines
- Use TypeScript and ESM modules throughout.
- Keep code formatted (e.g., Prettier or editor auto‑format).
- Run `npm run check` and `npm test` before committing.
- Follow conventional commit messages (e.g., `feat:`, `fix:`).
- For UI changes, favor Radix UI components and Tailwind CSS.
- Shared types live in `/shared`; update client code when altering them.

## Project Structure
- `client/` – React front-end (hooks, components, pages, lib).
- `shared/` – Calculation logic and types shared with the client.
- Place new shared calculations in `/shared` and import them into the client.

## Environment Variables
- No environment variables are required for the static GitHub Pages build.

## Domain Terminology
| Abbrev. | Meaning |
| ------- | ------- |
| `UP`    | Uførepensjon |
| `BTUP`  | Barnetillegg til uførepensjon |
| `PAS`   | Pensjonsavtale‑fradrag (beløp opphører ved gitt alder) |
| `IF`    | Inntektsforsikring |
| `G`     | Folketrygdens grunnbeløp |

## Calculation Variable Cheat Sheet

### Shared Calculations
#### `calculateUPWithPAS` – `shared/up.ts`
- **Inputs**
  - `grunnDekningPct` – base coverage percentage (e.g., 66%)
  - `prosentAvGPct` – portion of the national base amount `G` to cover
  - `tilleggsDekningPct` – additional coverage percentage
  - `gValue` – current `G` value in NOK
  - `lonni100pct` – salary at 100% position
  - `stillingPct` – claimant's employment percentage
  - `pas[]` – PAS deductions with start and end intervals
  - `prevUP` – previous UP result for comparison (optional)
- **Derived**
  - `pensjonsgrunnlagMax12G` – pension base capped at 12 × `G`
  - `lonnbetween6and12G` – salary portion between 6 × and 12 × `G`
  - `pasApplied` – PAS deductions actually applied
- **Outputs**
  - `baseUP100` – UP at 100% before reductions
  - `totalUPByIntervals[]` – UP amounts per PAS interval
  - `totalCurrentUP` – overall UP after PAS adjustments
  - `warnings[]` – warnings about reduced benefits

#### `calculateBTUP` – `shared/btup.ts`
- **Inputs**
  - `btupPct` – coverage percentage for BTUP
  - `gValue` – current `G` value in NOK
  - `lonni100pct` – salary at 100% position
  - `stillingPct` – claimant's employment percentage
  - `prevBTUP` – previous BTUP result for comparison (optional)
- **Derived**
  - `grunnlagMax12G` – salary basis capped at 12 × `G`
  - `grunnlagMax6G` – salary basis capped at 6 × `G`
- **Outputs**
  - `btup100` – BTUP at 100% before caps
  - `btupResult` – final BTUP after caps
  - `warnings[]` – warnings about reduced benefits

### Client Helpers – `client/src/lib/calc.ts`
- `HistoryEntry` fields
  - `label` – period label displayed in tables
  - `monthsBeforeSick` – months between entry date and sick date
  - `nominalSalary` – salary adjusted by nominal percentage
  - `actualSalary` – salary adjusted by actual percentage
  - `originalSalary` – raw salary value from import
  - `nominalPercentage` – reported position percentage
  - `actualPercentage` – actual position percentage
  - `salary100` – salary normalized to 100% position
  - `percentage` – increase from previous period
  - `date` – starting date of the salary period
  - `benefits` – benefits active in the period
- `calculateIncreasePercentage(current, previous)` – percentage change between two numbers
- `calculateIncreaseInfo(current, previous, threshold)` – change with violation flag
- `buildHistoryEntries(baseEntries, { useNominal, sickDateSalary, displaySickSalary100 })`
- `isWithinNormalPeriod(diffDays)` – checks if a period is inside the normal window

### Hooks
#### `useThresholdChecks` – `client/src/features/home/hooks/useThresholdChecks.ts`
- **Uses data**
  - `salaryHistory` – normalized salary entries
  - `actualSalaryHistory` – salary entries without normalization
  - `sykdato` – first day of sickness
  - `useNormalizedSickSalary` – whether sick-date salary should be normalized
  - `nyIFYtelseCalc?`/`nyUPYtelseCalc?`/`nyBTUPYtelseCalc?` – new benefit calculations to compare
- **Derived**
  - `threshold85` – limit for salary increase (+85%)
  - `threshold92` – limit for stillingsprosent increase (+92%)
- **Checks**
  - `checkSalaryIncrease` – detects salary increases above threshold
  - `checkStillingsprosentIncrease` – detects position percentage increases
  - `checkNewBenefits` – finds new benefits added after sickness
  - `checkSalaryChanges` – evaluates frequent salary changes, compares actual vs normed salary and position, and reports the values used per check
- **Results**
  - `salaryIncreaseCheck`, `stillingIncreaseCheck`, `newBenefitsCheck`, `salaryChangesCheck` – individual check outcomes
  - `violationPeriods` – periods where any rule was violated
  - `BenefitsCheckResult` – summary object of all checks

#### `useSalaryHistory` – `client/src/features/home/hooks/useSalaryHistory.ts`
- **Inputs**
  - `sykdato` – first day of sickness
  - `gridData` – raw grid rows from user input
  - `manualCalculationOverride` – flag for manual editing of history
- **State**
  - `rawSalaryData` – raw parsed grid values
  - `lonnSykdato` – salary on the sickness date
- **Parsers**
  - `parseExcelSalaryData` – converts spreadsheet rows to entries
  - `parseDSOPSalaryData` – parses DSOP payload into entries
  - `parseSalaryHistory` – generic parser
  - `parseNorwegianNumber` – helper for localized numbers
- **Outputs**
  - `salaryHistory` – normalized salary entries used in checks
  - `actualSalaryHistory` – non-normalized entries for comparison
  - **Note**: Salary entries are deduplicated based on both salary and benefit sums; if any benefit amount changes, a new entry is retained even when the salary is identical.

#### `useMeldekortAnalysis` – `client/src/features/home/hooks/useMeldekortAnalysis.ts`
- **State**
  - `avgUforegrad` – average disability percentage rounded
  - `avgUforegradExact` – average disability as exact decimal
  - `uforegradDateRange` – analyzed date range
  - `uforegradPerioder` – periods with disability grading
  - `meldekortWarnings` – warnings detected in meldekort data
- **Functions**
  - `analyzeMeldekort` – performs analysis
  - `resetAnalysis` – clears state

### Components
#### `OverallResult` – `client/src/features/home/components/OverallResult.tsx`
- **Flags**
  - `showGRegulertBeregning` – show G‑adjusted calculation
  - `showNormertIFBeregning` – show normalized IF result
  - `showStillingProsentBeregning` – show position percentage calculation
  - `showIFYtelseBeregning` – display IF benefit calculation
  - `showUPYtelseBeregning` – display UP benefit calculation
  - `showBTUPYtelseBeregning` – display BTUP benefit calculation
- **Calculation objects**
  - `nyIFYtelseCalc`/`normertIFYtelseCalc` – new vs normalized IF results
  - `nyUPYtelseCalc`/`normertUPYtelseCalc` – new vs normalized UP results
  - `nyBTUPYtelseCalc`/`normertBTUPYtelseCalc` – new vs normalized BTUP results
  - `karensAvslagCalc` – calculation used for waiting‑period refusal

### Updating the Cheat Sheet
- When introducing new calculation variables or results, append them to the relevant subsection above.
- Note whether each variable is an input, derived value, or output.
- Keep descriptions concise and update domain terminology if new abbreviations appear.
