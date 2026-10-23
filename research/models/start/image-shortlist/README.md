# Start image selection — review before scene changes

Ten proposed visuals are listed in `selection.json` and displayed in `index.html`. Source files stay unchanged. Six full frames were extracted from the article’s `mountains.gif` using FFmpeg; these are not six separately published still images. Four other candidates use the existing hero and explanatory figures. Activation atlas is externally referenced research, not an original Matthew result, and needs its attribution preserved if used.

The scene generator, Blender source, render and GLB are unchanged. This is a selection proposal only. No new artwork is generated or retouched. The existing low-resolution animated frames have visible compression and should remain small in the book; higher-resolution source footage would improve them later.

Extraction: `ffmpeg -i post/faststyletransfer/mountains.gif -vf "select='not(mod(n,10))'" -fps_mode vfr output-%02d.png`. Selected output numbers 01, 02, 05, 07, 08 and 11 correspond to zero-based source frames 0, 10, 40, 60, 70 and 100.
