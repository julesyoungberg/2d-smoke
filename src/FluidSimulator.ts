import * as twgl from 'twgl.js';

import { createScalarTexture, createVec2Texture } from './createTexture';

const basicVertShader = require('./shaders/basic.vert');
const velocityFragShader = require('./shaders/velocityTexture.frag');
const densityFragShader = require('./shaders/densityTexture.frag');

/**
 * FluidSimulator class
 * Simulates fluids in 2D using a Eulerian approach on the GPU
 */
export default class FluidSimulator {
    bufferInfo: twgl.BufferInfo;
    velocityTexture: number;
    tempVelocityTexture: number;
    pressureTexture: number;
    densityTexture: number;
    renderVelocityProg: twgl.ProgramInfo;
    renderDensityProg: twgl.ProgramInfo;
    prevTime: number = 0;
    timeStep: number = 0;
    simulationBuffer: number;

    constructor(readonly gl: any, readonly width: number, readonly height: number) {
        const arrays = {
            position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
        };
        this.bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

        this.createTextures();
        this.createPrograms();

        // this.simulationBuffer = this.gl.createFrameBuffer();
    }

    /**
     * create GPU texture objects
     */
    createTextures() {
        const { width, height } = this;
        const numCells = width * height;

        this.velocityTexture = createVec2Texture(
            this.gl,
            width,
            height, 
            new Float32Array(numCells * 2).fill(0).map(_ => Math.random())
        );

        this.tempVelocityTexture = createVec2Texture(
            this.gl,
            width,
            height, 
            new Float32Array(numCells * 2).fill(0)
        );
        
        this.pressureTexture = createScalarTexture(
            this.gl,
            width,
            height,
            new Float32Array(numCells).fill(0)
        );

        this.densityTexture = createScalarTexture(
            this.gl,
            width,
            height,
            new Float32Array(numCells).fill(0).map(_ => Math.random())
        );
    }

    /**
     * create GLSL programs
     */
    createPrograms() {
        this.renderVelocityProg = twgl.createProgramInfo(this.gl, [basicVertShader, velocityFragShader]);
        this.renderDensityProg = twgl.createProgramInfo(this.gl, [basicVertShader, densityFragShader]);
    }

    /**
     * run simulation update logic
     */
    update(time: number) {
        this.timeStep = time - this.prevTime;
        this.prevTime = time;
    }

    getTime() {
        return this.prevTime + this.timeStep;
    }

    /**
     * draw velocity texture
     */
    drawVelocity() {
        const uniforms = {
            time: this.getTime() * 0.001,
            resolution: [this.gl.canvas.width, this.gl.canvas.height],
            velocityTexture: this.velocityTexture,
        };
    
        this.gl.useProgram(this.renderVelocityProg.program);
        twgl.setBuffersAndAttributes(this.gl, this.renderVelocityProg, this.bufferInfo);
        twgl.setUniforms(this.renderVelocityProg, uniforms);
        twgl.drawBufferInfo(this.gl, this.bufferInfo);
    }

    /**
     * draw density texture
     */
    drawDensity() {
        const uniforms = {
            time: this.getTime() * 0.001,
            resolution: [this.gl.canvas.width, this.gl.canvas.height],
            densityTexture: this.densityTexture,
        };
    
        this.gl.useProgram(this.renderDensityProg.program);
        twgl.setBuffersAndAttributes(this.gl, this.renderDensityProg, this.bufferInfo);
        twgl.setUniforms(this.renderDensityProg, uniforms);
        twgl.drawBufferInfo(this.gl, this.bufferInfo);
    }

    /** 
     * draw current state of simulation
     */
    draw() {
        this.drawDensity();
    }
}
