# Frontend Code Review Report

## Executive Summary
The frontend implementation establishes a solid foundation using React 19, Vite, and Zustand. The core file exploration and basic execution flows are implemented with high-quality UI/UX (animations, theming). However, several key features from the plan are missing (History, Configuration), and there are discrepancies between the `PatternMixer` implementation and the `TransactionDesk` logic.

## 1. Compliance with Plan (frontend_plan.md)

### Implemented
- **Architecture**: React 19 + Vite + TypeScript structure is correctly set up.
- **State Management**: Zustand store (`useAppStore`) implements the required slices (files, selection, mixerConfig, executionState).
- **File Explorer**: `FileGrid` and `FileCard` implement the required visualization and selection logic (multiselect, range select).
- **Execution Flow**: `TransactionDesk` and `ExecutionOverlay` implement the state machine (IDLE -> EXECUTING -> DONE/ERROR).
- **API Layer**: `api.ts` with mocking capabilities is implemented.

### Missing / Deviations
- **History (Phase 4)**: Entirely missing. Placeholder in `App.tsx`.
- **System Configuration (Phase 3)**: Entirely missing (Source Watchers, Target Roots management). Placeholder in `App.tsx`.
- **Pattern Mixer**:
    - The plan describes a "Custom Prefix" input. `MixerPanel` (active component) only has a toggle for `usePrefix`, and `TransactionDesk` uses `preset.defaultPrefix`. Users cannot type a custom prefix.
    - `PatternMixer.tsx` exists but appears unused (not imported in Dashboard). It contains the "Custom Prefix" input logic.
- **Previews**: `TransactionDesk` calculates previews locally. The plan mentions calling `/api/v1/preview` for server-side preview generation. This is a significant architectural deviation (Client-side vs Server-side logic).

## 2. Code Quality & Structure

- **Strengths**:
    - **UI/UX**: Excellent use of Tailwind for animations and dark mode theming.
    - **Types**: Strong TypeScript usage with shared types.
    - **Store**: Zustand store is well-structured and handles complex selection logic well.

- **Weaknesses**:
    - **Logic Duplication**: `TransactionDesk.tsx` contains significant business logic for file renaming (generating `previewOps`). This should be in a service or strictly server-side (as per plan).
    - **Unused Code**: `PatternMixer.tsx` seems abandoned in favor of `MixerPanel.tsx`.
    - **Hardcoded Constants**: `PRESETS` and `TARGET_ROOTS` are hardcoded in `constants.ts` rather than fetched from backend (as per "Phase 3: Config Management").

## 3. Error Handling & Security

- **Error Handling**:
    - `api.ts` has decent error wrapping (`ApiError`).
    - UI handles errors gracefully in `ExecutionOverlay`.
    - File loading errors log to console but default to `INITIAL_FILES`. This is good for demo but needs better user feedback for production connection failures.
- **Security**:
    - No obvious XSS vulnerabilities found (React handles escaping).
    - `dangerouslySetInnerHTML` is not used.
    - Input validation is minimal since Config pages are missing.

## 4. Testability

- **Unit Tests**:
    - Core logic in `useAppStore` is pure and easily testable.
    - Components are decoupled enough for testing, though `TransactionDesk` has some coupling to `PRESETS` constants.
    - API layer is easily mockable.

## Recommendations

1.  **Implement Server-Side Preview**: Move the renaming logic from `TransactionDesk` to the backend (or `previewService` mocking backend) to match the plan and ensure consistency.
2.  **Consolidate Mixer Components**: Delete `PatternMixer.tsx` or merge its features (Custom Prefix) into `MixerPanel.tsx`.
3.  **Implement Missing Phases**: Prioritize the System Configuration page to replace hardcoded constants.
4.  **Refactor Constants**: Move `PRESETS` and `TARGET_ROOTS` to the store and fetch them on init.
