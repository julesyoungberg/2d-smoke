import * as twgl from 'twgl.js';

import getSimulationDimensions from './getSimulationDimensions';

// create WebGL context with required extensions
const gl = (document.getElementById('webgl-canvas') as any).getContext('webgl');
const floatTextures = gl.getExtension('OES_texture_float');
if (!floatTextures) {
    alert('no floating point texture support, please update your browser');
}
const floatTexturesLinear = gl.getExtension('OES_texture_float_linear');

// load shaders
const basicVertShader = require('./shaders/basic.vert');
const basicFragShader = require('./shaders/basic.frag');
const programInfo = twgl.createProgramInfo(gl, [basicVertShader, basicFragShader]);

const arrays = {
    position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
};
const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

// fixed for now
const { width, height } = getSimulationDimensions(gl.canvas.width, gl.canvas.height);
console.log(width, height)
const numCells = width * height;

// create textures
const velocityTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, velocityTexture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.FLOAT, new Float32Array(numCells * 3).fill(0).map(_ => Math.random()));
gl.generateMipmap(gl.TEXTURE_2D);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

console.log(velocityTexture);

function render(time: number) {
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    const uniforms = {
        time: time * 0.001,
        resolution: [gl.canvas.width, gl.canvas.height],
        velocityTexture: velocityTexture,
    };

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, bufferInfo);

    requestAnimationFrame(render);
}

requestAnimationFrame(render);
