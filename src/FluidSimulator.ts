import * as twgl from 'twgl.js';

import createTexture from './createTexture';

const basicVertShader = require('./shaders/basic.vert');
const basicFragShader = require('./shaders/basic.frag');

/**
 * FluidSimulator class
 * Simulates fluids in 2D using a Eulerian approach on the GPU
 */
export default class FluidSimulator {
    bufferInfo: twgl.BufferInfo;
    velocityTexture: number;
    pressureTexture: number;
    programInfo: twgl.ProgramInfo;

    constructor(readonly gl: any, readonly width: number, readonly height: number) {
        const arrays = {
            position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
        };
        this.bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

        this.createTextures();
        this.createPrograms();
    }

    // create GPU texture objects
    createTextures() {
        const { width, height } = this;
        const numCells = width * height;

        this.velocityTexture = createTexture(this.gl, {
            internalFormat: this.gl.RGB,
            format: this.gl.RGB,
            type: this.gl.FLOAT,
            width,
            height, 
            src: new Float32Array(numCells * 3).fill(0).map(_ => Math.random()),
        });
        
        this.pressureTexture = createTexture(this.gl, {
            internalFormat: this.gl.LUMINANCE,
            format: this.gl.LUMINANCE,
            type: this.gl.FLOAT,
            width,
            height,
            src: new Float32Array(numCells).fill(0),
        });
    }

    // create GLSL programs
    createPrograms() {
        this.programInfo = twgl.createProgramInfo(this.gl, [basicVertShader, basicFragShader]);
    }

    // run simulation update logic
    update(time: number) {
    }

    // draw current state of simulation
    draw(time: number) {
        const uniforms = {
            time: time * 0.001,
            resolution: [this.gl.canvas.width, this.gl.canvas.height],
            velocityTexture: this.velocityTexture,
        };
    
        this.gl.useProgram(this.programInfo.program);
        twgl.setBuffersAndAttributes(this.gl, this.programInfo, this.bufferInfo);
        twgl.setUniforms(this.programInfo, uniforms);
        twgl.drawBufferInfo(this.gl, this.bufferInfo);
    }
}
