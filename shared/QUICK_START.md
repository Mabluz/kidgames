# Design System Quick Start Guide

**Quick reference for using the KidGames Design System when creating new games**

## 1. Include the CSS (in your HTML `<head>`)

```html
<!-- REQUIRED: Design System (must be first) -->
<link rel="stylesheet" href="../shared/design-system.css">

<!-- Your other shared CSS files -->
<link rel="stylesheet" href="../shared/confetti.css">

<!-- Game-specific styles (last, for overrides) -->
<link rel="stylesheet" href="my-game.css">
```

## 2. Common Color Palette Variables

```css
/* Primary colors */
--color-primary: #FF6B6B          /* Coral Red */
--color-secondary: #4ECDC4        /* Turquoise */
--color-accent: #FFE66D           /* Sunny Yellow */

/* Feedback colors */
--color-success: #95E1A1          /* Mint Green - correct answers */
--color-error: #FF6B9D            /* Pink Red - wrong answers */

/* Game theme variety */
--color-purple: #A78BFA
--color-blue: #60A5FA
--color-green: #6EE7B7
--color-orange: #FBBF24
```

## 3. Button Classes

```html
<!-- Main action buttons -->
<button class="btn btn-primary">Start Game</button>
<button class="btn btn-secondary">Continue</button>
<button class="btn btn-success">Next Round</button>

<!-- Special purpose buttons -->
<button class="btn btn-record">🎤</button>        <!-- Record audio -->
<button class="btn btn-play">▶</button>          <!-- Play sound -->
<button class="btn btn-new-game">New Game</button>

<!-- Button sizes -->
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary btn-lg">Large</button>
```

## 4. Spacing

Use these variables instead of hardcoded values:

```css
padding: var(--spacing-md);        /* 16px - default */
margin: var(--spacing-lg);         /* 24px - sections */
gap: var(--spacing-xl);            /* 32px - large gaps */
```

| Variable | Size | Usage |
|----------|------|-------|
| `--spacing-xs` | 4px | Tiny gaps |
| `--spacing-sm` | 8px | Small gaps |
| `--spacing-md` | 16px | Default |
| `--spacing-lg` | 24px | Sections |
| `--spacing-xl` | 32px | Large spacing |
| `--spacing-2xl` | 48px | Extra large |

## 5. Game Structure Template

```html
<body>
  <div class="game-container">
    <!-- Header -->
    <div class="game-header">
      <h1>🎮 Game Title</h1>
      <p>Game description</p>
    </div>

    <!-- Info Bar -->
    <div class="game-info-bar">
      <div class="game-stat">
        <span class="game-stat-label">Score:</span>
        <span class="game-stat-value">0</span>
      </div>
      <button class="settings-btn">⚙️</button>
    </div>

    <!-- Game Content -->
    <div class="game-section">
      <h2>Game Area</h2>
      <!-- Your game here -->
    </div>
  </div>
</body>
```

## 6. Victory Screen

```html
<div class="victory-screen">
  <h1>🎉 Gratulerer! 🎉</h1>
  <div class="victory-stats">
    <p>Score: <strong>15/20</strong></p>
  </div>
  <div class="victory-buttons">
    <button class="btn btn-primary">Play Again</button>
    <button class="btn btn-secondary">Menu</button>
  </div>
</div>
```

## 7. Card System

```html
<!-- Basic interactive card -->
<div class="card card-interactive">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>

<!-- Feedback cards -->
<div class="card card-correct">Correct!</div>
<div class="card card-incorrect">Wrong!</div>
```

## 8. Grid Layouts

```html
<!-- 4 column grid -->
<div class="grid grid-4">
  <div class="card">Item 1</div>
  <div class="card">Item 2</div>
  <div class="card">Item 3</div>
  <div class="card">Item 4</div>
</div>

<!-- Auto-responsive grid -->
<div class="grid grid-auto">
  <!-- Automatically fits items -->
</div>
```

## 9. Common Animations

```css
/* Apply to elements */
animation: pulse 1.5s ease-in-out infinite;      /* Loading/recording */
animation: shake 0.5s ease;                       /* Error */
animation: correctPulse 0.6s ease;               /* Success */
animation: bounce 1s ease;                        /* Celebration */
```

## 10. Utility Classes

```html
<div class="hidden">...</div>              <!-- Hide -->
<div class="flex-center">...</div>         <!-- Center content -->
<div class="flex-between">...</div>        <!-- Space between -->
<div class="text-center">...</div>         <!-- Center text -->
<div class="flex gap-md">...</div>         <!-- Flex with 16px gap -->
```

## Example: Complete Mini Game

```html
<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <title>My Game</title>

  <!-- Design System -->
  <link rel="stylesheet" href="../shared/design-system.css">
  <link rel="stylesheet" href="my-game.css">
</head>
<body>
  <div class="game-container">
    <div class="game-header">
      <h1>🎯 Letter Match</h1>
      <p>Find matching letters!</p>
    </div>

    <div class="game-info-bar">
      <div class="game-stat">
        <span class="game-stat-label">Score:</span>
        <span class="game-stat-value">0</span>
      </div>
    </div>

    <div class="grid grid-4">
      <div class="card card-interactive">A</div>
      <div class="card card-interactive">B</div>
      <div class="card card-interactive">C</div>
      <div class="card card-interactive">D</div>
    </div>

    <div class="flex-center gap-lg">
      <button class="btn btn-record">🎤</button>
      <button class="btn btn-success">Next</button>
    </div>
  </div>
</body>
</html>
```

---

## Pro Tips

1. **Always use CSS variables** instead of hardcoded colors
2. **Use spacing variables** for consistent layouts
3. **Leverage existing button classes** before creating custom ones
4. **Test on mobile** - the design system is responsive by default
5. **Add emojis** to make games more engaging for kids

## Need More?

See the full documentation: [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
