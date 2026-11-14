# Reusable 2D engines
Select the shot's style with {"name":"whiteboard","ink":"#132838","accent":"#007C79","penWidth":3}. The name selects eligible primitives and the accent default; ink colors chart labels and penWidth controls vector lettering and arrows. Plain geometry is shared across styles. An object color overrides accent. A custom pack in this release is a set of these JSON style parameters and object defaults chosen by its author. Adding new drawing behavior requires a typed primitive and schema registration.

|Style|Object|Parameters and origin|
|---|---|---|
|whiteboard|handwriting|text (uppercase A–Z, digits, space, dot, hyphen), size in pixels, optional reveal; starts at upper left. Original monoline glyphs, measured across pen lifts.|
|whiteboard|arrow|dx, dy (vector from origin), head (wing length), optional reveal. Shaft and wings reveal in order.|
|infographic|bars|data of {label,value}, width, height, ceiling, size (font px), optional reveal. Origin at lower left. Final numeric labels identify bar targets; bars grow up from a fixed baseline.|
|infographic|counter|value as a scalar track, decimals, optional suffix, size. Baseline text origin.|
|infographic|milestones|labels in chronological order, width, size, optional reveal. Point and label appear when the axis reaches them. Equal spacing is categorical.|

Use reveal keys for drawing, camera keys to travel across a board, transform keys to move diagrams, and opacity for staged entrances. Missing or unsupported glyphs and cross-style objects fail validation. Multiple scenes can select different styles in one film. Input JSON never imports a plugin.

## Cartoon prototype
Select style.name "cartoon". An actor requires kind, id, height and hex colors for skin, hair, shirt, trousers and shoes. Its x/y origin is on the ground between its feet. A pose has optional facing (left/right), expression (neutral/happy/curious/concerned), phase (walking cycles), stride (0–30 rig units), gesture (rest to full point, 0–1) and mouth (closed to open, 0–1). Each numeric pose property accepts scalar tracks. Key x/y independently for travel. Set stride to zero to stop. The prototype is one profile rig with hand-keyed mouth timing. examples/pier.json demonstrates the supported performance range.

## Illustrated profile rig

Set an actor's optional design to illustrated to use the curved coat, sculpted face, hair, shoes and shaded limbs. The existing palette, phase, stride, gesture, facing, expression and mouth controls apply. Omit design or use classic for the earlier drawing. Height is the nominal rest silhouette height. Coordinates are anchored at ground level. Walking foot lift and arm swing are deterministic functions of phase.

The illustrated rig is a stylized profile. It has no automatic lip synchronization, inverse kinematics or hand attachment solver. Match props to the hand through authored scene keys. Courtyard demonstrates a walk, stop and reach with a butterfly using independent keyed motion.

```sh
node dist/cli/main.js render examples/courtyard.json out/courtyard.mp4 --backend native --workers 2
node dist/cli/main.js verify examples/courtyard.json out/courtyard.mp4
```

## Illustrated walk and wave

The illustrated design uses a separate walk cycle with 60% stance and 40% swing per foot. Its sole stays level throughout stance. A stride of zero gives a straight, relaxed rest pose. With constant stride, match world travel to `2 * stride / 0.6 * height / 161` pixels per phase cycle. This cancels horizontal foot motion during stance. Facing left reverses the travel sign. Independent changes to phase, stride and travel can still produce sliding. Deceleration remains authored.

The illustrated actor accepts wave as a scalar or unit track from zero to one. It blends the near arm from the current gesture pose to a raised hand. Oscillate its value to animate the greeting. Classic actors reject wave. Existing gesture and mouth controls remain available.

Reproduce the silent two-character greeting with:
```sh
node dist/cli/main.js render examples/greeting.json out/greeting.mp4 --backend native --workers 2
node dist/cli/main.js verify examples/greeting.json out/greeting.mp4
```
