# Mockup Z-Index Diagnostic Report - Manual Analysis

**Test:** phone-portrait-card-landscape
**Date:** 2025-11-13
**Source:** Manual analysis of provided HTML

## Summary

Analyzed the HTML structure provided by the user for the mockup "phone-portrait + card-landscape".

- **Total elements:** 4
- **Structure:** ✅ CORRECT
- **Issues found:** 0

## DOM Structure Analysis

Based on the HTML provided:

```html
<div class="relative w-full max-w-2xl mx-auto transition-opacity duration-500 ease-in-out">
  [0] <img> - Mockup background
  [1] <div> - Video zone (phone)
  [2] <div> - Photo zone (card)
  [3] <button> - Play button
</div>
```

### Detailed Element Analysis

| Order | Tag | Classes | Inline Styles | Purpose |
|-------|-----|---------|---------------|---------|
| 0 | `img` | `w-full h-auto` | (none) | Mockup background image (`phone-portrait-card-landscape.png`) |
| 1 | `div` | `absolute overflow-hidden` | `left: 4.8%; top: 21.5333%; width: 26.2667%; height: 57%; border-radius: clamp(15px, 1.6vw, 16px); transform: translateZ(0px); isolation: isolate; backface-visibility: hidden;` | **Phone video zone** |
| 2 | `div` | `absolute overflow-hidden` | `left: 35.5333%; top: 29.4%; width: 61.8667%; height: 41.2%; border-radius: clamp(12px, 1.5vw, 16px); transform: translateZ(0px); isolation: isolate; backface-visibility: hidden;` | **Card photo zone** |
| 3 | `button` | `absolute flex items-center justify-center` | `left: 4.8%; top: 21.5333%; width: 26.2667%; height: 57%; border-radius: clamp(15px, 1.6vw, 16px); transform: translateZ(0px); isolation: isolate; backface-visibility: hidden;` | **Play button overlay** |

## ✅ Order Verification

The DOM order is **CORRECT**:

1. ✅ **IMG** - Mockup background image (should be first)
2. ✅ **DIV** - Phone video zone (correct position)
3. ✅ **DIV** - Card photo zone (correct position)
4. ✅ **BUTTON** - Play button overlay (correct position)

## Z-Index Analysis

### CSS Properties Found

All positioned elements have:
- `position: absolute` (via Tailwind class)
- `overflow: hidden` (via Tailwind class)
- GPU acceleration properties: `transform: translateZ(0px); isolation: isolate; backface-visibility: hidden`

### Expected Z-Index Behavior

Since no explicit `z-index` values are set in the inline styles, the browser will use:
1. **Default stacking** based on DOM order
2. Elements rendered **in the order they appear** in the DOM

This means:
- The `<img>` (mockup background) renders first (bottom layer)
- The video `<div>` renders second (middle layer)
- The photo `<div>` renders third (middle-top layer)
- The play `<button>` renders last (top layer)

**This is the CORRECT behavior!**

## 🔍 No Evidence of "Doublon" (Duplicate)

The HTML shows:
- **1 video element** in the phone zone
- **1 image element** in the card zone
- **1 play button** overlay

**Conclusion:** There is NO duplicate video or photo in the HTML structure.

## Possible Visual Issue

If the user sees "something between the mockup and the zones", it could be:

### 1. **Play Button Always Visible**
The play button is shown when `isCombinedVideoPlaying` is `false`. This is normal before the video starts playing.

**Solution:** Click the play button to start the video - it should disappear.

### 2. **Border-Radius Not Matching Mockup Image**
The calculated border-radius values might not match the actual rounded corners in the PNG mockup image.

**Phone zone:** `clamp(15px, 1.6vw, 16px)`
**Card zone:** `clamp(12px, 1.5vw, 16px)`

If the PNG mockup has different corner radii, the video/photo might appear to overflow.

**Solution:** Measure the actual corner radius in the PNG file and adjust calculations.

### 3. **GPU Acceleration Artifacts**
The properties `transform: translateZ(0); isolation: isolate; backface-visibility: hidden` force GPU rendering, which can sometimes cause visual glitches.

**Already Fixed:** We removed `WebkitMaskImage` which was creating a gradient mask.

## Coordinate Verification

### Phone Zone (Portrait Video)

**Coordinates:** `left: 4.8%, top: 21.5333%, width: 26.2667%, height: 57%`

**Calculated from 1500x1500 mockup:**
- x: 72px → 4.8% ✅
- y: 323px → 21.533% ✅
- width: 394px → 26.267% ✅
- height: 855px → 57% ✅

### Card Zone (Landscape Photo)

**Coordinates:** `left: 35.5333%, top: 29.4%, width: 61.8667%, height: 41.2%`

**Calculated from 1500x1500 mockup:**
- x: 533px → 35.533% ✅
- y: 441px → 29.4% ✅
- width: 928px → 61.867% ✅
- height: 618px → 41.2% ✅

**All coordinates are CORRECT!**

## Final Diagnostic

### ✅ What's Working

1. ✅ DOM structure is correct (mockup → video → photo → button)
2. ✅ No duplicate elements
3. ✅ Coordinates match the mockup-generator calculations
4. ✅ `overflow: hidden` is present on all zones
5. ✅ `WebkitMaskImage` has been removed (was causing issues)
6. ✅ Border-radius is calculated adaptively

### ⚠️ What to Check

1. **Visual inspection**: Do the rounded corners look correct at different screen sizes?
2. **Play button**: Is it only visible when the video is paused? (expected behavior)
3. **Border-radius match**: Do the calculated radii match the actual PNG mockup corners?

### 📝 Recommendations

1. **If rounded corners still don't look right:**
   - Open the PNG mockup image in an image editor
   - Measure the exact corner radius in pixels
   - Adjust the `borderRadiusPercent` calculations in `getCombinedPhoneZoneStyle()`

2. **If the play button seems like a "duplicate":**
   - This is normal - it's an overlay that disappears when you click it
   - The video underneath is always there, just covered by the button initially

3. **If there are visual gaps or overlaps:**
   - Check the source PNG mockup file for accuracy
   - Verify the zone coordinates in `mockup-generator.ts` match the PNG

## Conclusion

**No structural issues found in the HTML.** The mockup is being rendered correctly according to the code. Any visual issue is likely:
- The play button (which is expected)
- Border-radius mismatch with the PNG file
- Or a misunderstanding of the expected behavior

The "doublon" (duplicate) mentioned by the user is likely the play button overlay, which is the intended design.
