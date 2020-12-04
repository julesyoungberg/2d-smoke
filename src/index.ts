import * as twgl from 'twgl.js';

import createContext from './createContext';
import createTexture from './createTexture';
import getSimulationDimensions from './getSimulationDimensions';

const gl = createContext();

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
const velocityTexture = createTexture(gl, {
    internalFormat: gl.RGB,
    format: gl.RGB,
    type: gl.FLOAT,
    width,
    height, 
    src: new Float32Array(numCells * 3).fill(0).map(_ => Math.random()),
});

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
