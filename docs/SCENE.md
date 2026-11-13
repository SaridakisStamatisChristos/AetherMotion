# Scene format and public interfaces
The authoritative draft-07 schema is schemas/scene-v0.1.json. The TypeScript contract lives in src/scene/types.ts. A film specifies version "0.1", engine "canvas2d" or "three", fps, even width and height, durationFrames, scenes in cut order, and optionally an assets object. Duration in seconds is durationFrames / fps. Landscape 960×540 and portrait 540×960 are example sizes. All coordinates are authored in output pixels. Changing the aspect ratio requires recomposition.

A shot specifies id, frames, background (#RRGGBB), optional camera and an ordered objects array. IDs are unique per scope. Later objects paint over earlier objects. Rectangles and images begin at the top left; a circle is centered on its origin; text uses the alphabetic baseline. Paths use points relative to their origin. X increases right and Y down.

|Object kind|Required fields beyond id and kind|Optional fields|
|---|---|---|
|rect|width, height, color|pose|
|circle|radius, color|pose|
|path|points (at least two [x,y] pairs), stroke, color|pose, reveal from 0 to 1|
|text|text, size, color|pose, bold, face (serif/sans/mono)|
|image|asset, width, height|pose|

Pose supports x, y, scale, rotation (clockwise degrees), opacity. Camera supports x, y and zoom around the top-left origin. All pose fields, camera fields and reveal accept a number or a nonempty array of {frame,value,ease?}. Keys use scene-local frame indices in strictly increasing order. End values hold outside the keyed segment. The left key selects linear (default), smoothstep or hold. For example, `"x":[{"frame":0,"value":40,"ease":"smooth"},{"frame":119,"value":240}]` moves over 120 frames. Objects remain present for the shot; opacity and cuts control visibility. Raster assets map identifiers to local relative PNG/JPEG paths. Three.js also supports local OBJ meshes. URLs and links outside the scene directory are rejected. No source loading or expression evaluation exists.

## Runtime API
Import built ESM modules under dist/; TypeScript declarations are generated alongside them. parseFilm(unknown) returns Film or throws. loadAssets(film,directory) preflights and caches raster bytes. locate(film,index) returns the shot and its local frame. sample(track,frame,fallback) evaluates a track. cameraMatrix(camera,frame) returns zoom and screen translation. render(input,directory,output,{backend,workers,batch}) validates, renders and returns verified metrics. verify(film,output) independently checks the output. Worker count and batch size each range from 1 to 8. Both limit buffered frame groups. Peak RSS currently measures Node including its worker threads; Chromium and FFmpeg child memory are excluded.

For a new primitive, extend the discriminated union, add a closed schema variant, implement its painter using the supplied local frame, and add a pixel fixture and end-to-end regression. Never read wall time or invoke the director from a painter. Audio cues and the optional director are described in the production guides.

The optional shot style activates the additional [whiteboard and infographic objects](STYLES.md). Both use the same timeline and composition pipeline.

Groups, polygons, glows and frame-defined shot fades are described in [production and choreography](PRODUCE.md).
