# Search Terminal UI Design

## Overview

Redesign the Search modal UI to evoke an old computer terminal / train station flip-board aesthetic.

## Visual Design

### Color Scheme (CSS Variables)

```scss
--search-bg: #1a1a1a;              // Dark charcoal background
--search-text-primary: #c0c0c0;    // Faded white for main text
--search-text-secondary: #707070;  // Dim gray for metadata
--search-text-input: #ffffff;      // Bright white for input
--search-highlight: #33ff33;       // Phosphor green for accents
--search-selected-bg: #2a2a2a;     // Slightly lighter for selection
```

### Typography

- All text uses `var(--font-monospace)`
- Uppercase for placeholder messages
- Sharp edges (no rounded corners)

## Animation: Scramble Effect

When results or placeholder text changes:
1. All characters scramble simultaneously (random chars: A-Z, 0-9, █▓░│─)
2. Duration: ~1000-1200ms
3. Characters resolve left-to-right with randomness
4. Implemented via `<ScrambleText>` component

**Applies to:** Results list, placeholder messages
**Does NOT apply to:** Input field, typeahead suggestion

## Placeholder Text

| Context | Text |
|---------|------|
| Input placeholder | `ENTER QUERY_` |
| No input yet | `AWAITING INPUT...` |
| Typing but < min chars | `SCANNING...` |
| No results found | `NO MATCHES FOUND` |

## Result Item Styling

- Title: uppercase, primary text color
- Date: military format `22-JUN-2024`, secondary color
- Matched terms: highlight color
- Selection indicator: `[001/005]` format
