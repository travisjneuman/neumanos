# Sound Effects

This directory contains optional sound effects for task completion celebrations.

## Required Files

Place the following MP3 files in this directory:

1. **task-complete.mp3** - Satisfying "ding" or "pop" sound (200-500ms)
2. **achievement.mp3** - Triumphant fanfare for milestone achievements (1-2s)
3. **checklist-item.mp3** - Subtle "tick" sound for checklist items (100ms)

## Sound Requirements

- **Format:** MP3 (universal browser support)
- **File size:** <50KB each
- **Quality:** Clear, pleasant, not annoying
- **Volume:** Moderate (users can adjust via Settings)
- **License:** Public domain or CC0 (no attribution required)

## Recommended Sources

### Free Sound Libraries (CC0)
- [Freesound.org](https://freesound.org/) - Large collection of CC0 sounds
- [Pixabay Sound Effects](https://pixabay.com/sound-effects/) - Free sounds, no attribution
- [ZapSplat](https://www.zapsplat.com/) - Free with attribution option

### Search Keywords
- Task complete: "success ding", "notification pop", "ui confirm"
- Achievement: "fanfare", "level up", "success jingle"
- Checklist: "click", "tick", "checkbox"

## Testing Sounds

1. Enable sound effects in Settings → Celebrations
2. Adjust volume slider to comfortable level
3. Complete a task or check a checklist item to hear the sound
4. Sounds will not play until user interacts with page (browser autoplay policy)

## Fallback

If sound files are missing, the app will:
- Continue working normally
- Show visual celebrations only
- Log warning in browser console (not visible to users)
- Silently fail sound playback

## Notes

- Sound effects are **opt-in** (disabled by default)
- Users must enable sounds in Settings
- Sounds respect browser autoplay policies
- All celebrations have visual alternatives
