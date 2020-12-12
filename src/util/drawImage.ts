import * as twgl from 'twgl.js';

const imageVert = require('./shaders/image.vert');
const imageFrag = require('./shaders/image.frag');

// based on: https://webgl2fundamentals.org/webgl/lessons/webgl-2d-drawimage.html
export default function drawImage(gl: WebGLRenderingContext, img: WebGLTexture, x: number, y: number, width: number, height: number) {
    const fb = gl.createFramebuffer();
    const programInfo = twgl.createProgramInfo(gl, [imageVert, imageFrag]);

}
