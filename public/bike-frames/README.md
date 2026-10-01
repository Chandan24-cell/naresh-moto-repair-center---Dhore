# Bike Frame Sequences (Step 3 output)

Drop the ~240 sequential JPG frames for each bike in the matching folder:

```
public/bike-frames/ducati-monster/frame-0001.jpg        (fully exploded)
public/bike-frames/ducati-monster/frame-0002.jpg
...
public/bike-frames/ducati-monster/frame-0240.jpg        (fully assembled)
```

## Folders
- `ducati-monster/` — Ducati Monster
- `bmw-r1300gs/` — BMW R 1300 GS
- `triumph-street-triple/` — Triumph Street Triple 765 RS
- `harley-davidson/` — Harley-Davidson cruiser

## Requirements
- Frame numbering: `frame-0001.jpg` → `frame-0240.jpg` (zero-padded, 4 digits).
- Frame 1 = fully exploded, frame 240 = fully assembled (the Veo clip direction:
  exploded start frame → assembled end frame).
- ~240 frames per bike at 30 FPS extraction (adjust to clip length; the
  component maps the pinned scroll range linearly across whatever count is set
  via `FRAMES_PER_BIKE` in `src/components/BikeShowcaseSection.tsx`).
- Keep the deep-black studio background inside the frames; page chrome adapts
  to the site theme around the canvas.

The section renders a loading skeleton per bike until its frames exist, so it
is safe to deploy before all four folders are populated.
