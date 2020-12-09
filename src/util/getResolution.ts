import { v3 } from 'twgl.js';

export default function getResolution(gl: WebGLRenderingContext, res: number) {
    let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (aspectRatio < 1) {
        aspectRatio = 1 / aspectRatio;
    }

    const min = Math.round(res);
    const max = Math.round(res * aspectRatio);

    if (gl.drawingBufferWidth > gl.drawingBufferHeight) {
        return v3.create(max, min);
    }

    return v3.create(min, max);
}
