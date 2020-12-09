export interface Resolution {
    width: number;
    height: number;
}

export default function getResolution(gl: WebGLRenderingContext, res: number): Resolution {
    let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (aspectRatio < 1) {
        aspectRatio = 1 / aspectRatio;
    }

    const min = Math.round(res);
    const max = Math.round(res * aspectRatio);

    if (gl.drawingBufferWidth > gl.drawingBufferHeight) {
        return { width: max, height: min };
    }
    
    return { width: min, height: max };
}
