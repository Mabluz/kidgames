# Color Palette Visual Reference

Quick visual reference for the KidGames color palette.

## Primary Colors

### Coral Red Family (Main Accent)
```
🟥 Primary:       #FF6B6B  (var(--color-primary))
🔴 Primary Light: #FF8E8E  (var(--color-primary-light))
🔴 Primary Dark:  #E85555  (var(--color-primary-dark))
```
**Use for:** Main buttons, headings, primary actions, score displays

---

### Turquoise Family (Secondary Accent)
```
🔷 Secondary:       #4ECDC4  (var(--color-secondary))
🔵 Secondary Light: #6ED8D1  (var(--color-secondary-light))
🔵 Secondary Dark:  #3DB9B0  (var(--color-secondary-dark))
```
**Use for:** Secondary buttons, highlights, interactive elements

---

### Sunny Yellow Family (Accent)
```
🟨 Accent:       #FFE66D  (var(--color-accent))
🟡 Accent Light: #FFED8C  (var(--color-accent-light))
🟡 Accent Dark:  #F5D855  (var(--color-accent-dark))
```
**Use for:** Special highlights, badges, attention-grabbing elements

---

## Feedback Colors

### Mint Green (Success)
```
🟩 Success:       #95E1A1  (var(--color-success))
✅ Success Light: #B0E9BA  (var(--color-success-light))
✅ Success Dark:  #7AD088  (var(--color-success-dark))
```
**Use for:** Correct answers, success messages, positive feedback

---

### Pink Red (Error)
```
🟥 Error:       #FF6B9D  (var(--color-error))
❌ Error Light: #FF8FB3  (var(--color-error-light))
❌ Error Dark:  #E85587  (var(--color-error-dark))
```
**Use for:** Wrong answers, error messages, record button

---

## Game Theme Colors

Use these for variety across different games:

```
🟪 Purple: #A78BFA  (var(--color-purple))
   ↳ Great for: Sound/music games, special features

🔵 Blue:   #60A5FA  (var(--color-blue))
   ↳ Great for: Water themes, calm activities

🟢 Green:  #6EE7B7  (var(--color-green))
   ↳ Great for: Nature themes, growth progress

🟠 Orange: #FBBF24  (var(--color-orange))
   ↳ Great for: Energy, enthusiasm, warm themes

🌸 Pink:   #F472B6  (var(--color-pink))
   ↳ Great for: Creative activities, fun variations
```

---

## Neutral Colors

```
⚪ White:      #FFFFFF  (var(--color-white))
⚪ Off-white:  #FAFAFA  (var(--color-off-white))
⬜ Light Gray: #F0F0F0  (var(--color-light-gray))
◻️  Gray:       #CCCCCC  (var(--color-gray))
⬛ Dark Gray:  #666666  (var(--color-dark-gray))
⬛ Text:       #333333  (var(--color-text))
◾ Text Light: #666666  (var(--color-text-light))
```

---

## Background Gradients

### Default Background (Soft Rainbow)
```css
background: var(--color-background);
/* #A8EDEA (Soft Cyan) to #FED6E3 (Soft Pink) */
```
**Visual:** Soft cyan to pink gradient - dreamy and playful

### Rainbow Background
```css
background: var(--color-background-rainbow);
/* #A8EDEA to #FED6E3 to #FFE985 */
```
**Visual:** Three-color rainbow gradient - extra playful!

### Sky Blue Background
```css
background: var(--color-background-blue);
/* #89CFF0 to #B4E4FF */
```
**Visual:** Sky blue gradient - calm and cheerful

### Purple Dream Background
```css
background: var(--color-background-purple);
/* #C3B1E1 to #E0BBE4 */
```
**Visual:** Soft purple gradient - magical and fun

### Sunny Background
```css
background: var(--color-background-alt);
/* #FFE985 to #FA742B */
```
**Visual:** Yellow to orange gradient - warm and energetic

---

## Color Combinations That Work Well

### High Energy Combo
- Background: Default gradient
- Primary action: Coral Red (`--color-primary`)
- Secondary: Turquoise (`--color-secondary`)
- Success: Mint Green (`--color-success`)

### Calm Learning Combo
- Background: Default gradient
- Primary action: Blue (`--color-blue`)
- Secondary: Green (`--color-green`)
- Success: Mint Green (`--color-success`)

### Fun & Playful Combo
- Background: Default gradient
- Primary action: Pink (`--color-pink`)
- Secondary: Yellow (`--color-accent`)
- Success: Mint Green (`--color-success`)

---

## Accessibility Notes

All color combinations have been chosen to ensure:
- ✅ High contrast for text readability
- ✅ Distinguishable for colorblind users
- ✅ Vibrant and engaging for children
- ✅ Not overwhelming or too bright

---

## Quick Copy-Paste

### For CSS Variables
```css
:root {
  /* Copy any of these to your game CSS to override */
  --color-primary: #FF6B6B;
  --color-secondary: #4ECDC4;
  --color-accent: #FFE66D;
  --color-success: #95E1A1;
  --color-error: #FF6B9D;
}
```

### For Direct Use
```css
.my-button {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: var(--color-white);
}

.my-card {
  background: var(--color-white);
  border: 3px solid var(--color-secondary);
}

.success-message {
  background: var(--color-success);
  color: var(--color-white);
}
```

---

**Remember:** Always use CSS variables (`var(--color-name)`) instead of hardcoded hex values for consistency and easy theming!
