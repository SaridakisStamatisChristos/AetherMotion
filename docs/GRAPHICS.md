# Curved illustration

A shape drawable provides editable vector outlines in scene JSON. Its commands are inert data. The existing local renderer draws them on native Canvas and browser Canvas using the same transforms and deterministic timeline.

Commands include move and line with x/y, cubic with x1/y1, x2/y2 and x/y, and close. Each path begins with move. Multiple subpaths are supported. At least one fill or outline is required. Closed shapes use Canvas's nonzero fill rule.

Fill accepts a hex colour or a linear gradient with from/to coordinate pairs and two to sixteen stops. Each stop has at from zero through one and a hex colour. Stop positions strictly increase and gradient endpoints differ. Colours accept six-digit RGB or eight-digit RGBA. Coordinates are local to the drawable. The gradient moves and rotates with the shape.

Outline contains color and width. Shadow contains color, blur, x and y offsets. Canvas applies shadow to each fill or stroke operation. A shape using both can accumulate shadow at their overlap. Blur is backend-dependent. Pixel identity across native Skia and Chromium is not promised.

The existing pose fields animate the whole shape. Curve control points and fill stops are static. Layer animated shapes in groups for articulated illustrations. The new shape primitive is available in scene JSON. The compact motion storyboard currently supports its existing mark kinds.

## Reproduce the visual study

After installation and build:
```sh
node dist/cli/main.js render examples/ascent.json out/ascent.mp4 --backend native --workers 2
node dist/cli/main.js verify examples/ascent.json out/ascent.mp4
```

The 12-second scene is original procedural artwork. It contains no external assets or narration. The balloon uses shaded fabric sections, suspension ropes and basket detail. Curved terrain layers move at different speeds, and clouds drift independently. The sample is a graphics milestone. Character animation, rich scene transitions and further material effects need additional visual development.
