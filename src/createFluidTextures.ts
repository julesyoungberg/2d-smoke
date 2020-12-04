import createTexture from './createTexture';

export default function createFluidtextures(gl: any, width: number, height: number) {
    const numCells = width * height;

    const velocityTexture = createTexture(gl, {
        internalFormat: gl.RGB,
        format: gl.RGB,
        type: gl.FLOAT,
        width,
        height, 
        src: new Float32Array(numCells * 3).fill(0).map(_ => Math.random()),
    });
    
    const pressureTexture = createTexture(gl, {
        internalFormat: gl.LUMINANCE,
        format: gl.LUMINANCE,
        type: gl.FLOAT,
        width,
        height,
        src: new Float32Array(numCells).fill(0),
    });

    return { velocityTexture, pressureTexture };
} 
