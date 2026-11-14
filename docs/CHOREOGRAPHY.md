# Travel and held props

Illustrated actors can now coordinate travel and gait with a single instruction. Held objects use the animated hand transform. Both features are part of the existing scene v0.1 renderer.

## Travel

An actor's optional travel object requires fromX, toX, ground, startFrame, endFrame and stride. Endpoints use the actor's parent coordinates. Frame bounds are local to the shot, inclusive and strictly increasing. Stride ranges from 1 through 30 rig units. The endpoints must differ.

Omit x, y, phase, stride and facing on an actor using travel. The runtime derives them from the route. Before startFrame the actor rests at fromX. After endFrame the actor rests at toX. Facing follows the horizontal travel direction. The actor turns to that direction for the entire shot, including before travel begins.

Position uses smoothstep between endpoints. Gait phase follows absolute horizontal distance using the illustrated rig's stride calibration. Stride amplitude ramps in and out over the first and last 10% of the travel interval. This gives eased motion and settled endpoints. Horizontal stance foot motion cancels world travel during the constant-stride middle of the route. The short amplitude ramps blend to rest and may still slide. The route is horizontal, with a fixed ground height. Arbitrary terrain and inverse kinematics remain future work.

Object and parent transforms apply after route evaluation. Mirroring, rotating or scaling a parent transforms the entire route. Travel is stateless and supports arbitrary seeking. The measured-speech production command stretches its frame interval when it extends the containing shot.

## Held geometry

An illustrated actor's optional held array contains ordinary drawable objects. Their origin is the near hand in rig coordinates. They inherit the actor's height, facing, pose, torso lean and hand motion. Held objects draw above the sleeve and below the palm. A scale of one means one rig unit per local prop unit, before height scaling.

Groups, vector shapes, images and nested actors are accepted through the normal drawable validator. The existing depth, count, unique-id, asset and keyframe checks apply inside held. A classic actor rejects held and travel instructions. Held objects share the containing shot's local frame timeline.

To release a prop, key its held opacity off and show a matching scene object at the target position. The lantern story uses an explicit handoff at local frame 190 in the second shot. That target position is authored. Automatic attachment transfer and collision detection remain future work.

## Reproduce the full film

```sh
npm ci
npm test
mkdir -p out
node dist/cli/main.js render examples/evening-delivery.json out/evening.mp4 --backend native --workers 2
node dist/cli/main.js verify examples/evening-delivery.json out/evening.mp4
python3 scripts/frame_variation.py out/evening.mp4
python3 scripts/check_evening.py out/evening.mp4
```

The film has three ten-second shots, 1280×720 landscape output and 24 fps. It uses original vector scene instructions and the existing original bell WAV. No narration or language-model call is required. The same renderer accepts another route, held prop or scene without new rendering code.

The first shot tracks a lantern carrier from the garden house toward the glasshouse. The second moves to a closer camera view and animates the handoff to a hook. Warm light builds behind the actor. The final wide shot uses illuminated glass colours, a fixed lantern and a quiet held ending. The sound cue occurs at the handoff.
