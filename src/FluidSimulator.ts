import * as twgl from 'twgl.js';

import bindFramebuffer from './bindFramebuffer';
import { buildScalarTexture, buildVec2Texture } from './buildTexture';

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
    tempDensityTexture: number;
    renderVelocityProg: twgl.ProgramInfo;
    renderDensityProg: twgl.ProgramInfo;
    prevTime: number = 0;
    timeStep: number = 0;
    simulationFramebuffer: number;

    constructor(readonly gl: any, readonly width: number, readonly height: number) {
        const arrays = {
            position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
        };
        this.bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

        this.velocityTexture = gl.createTexture();
        this.tempVelocityTexture = gl.createTexture();
        this.pressureTexture = gl.createTexture();
        this.densityTexture = gl.createTexture();

        this.renderVelocityProg = twgl.createProgramInfo(this.gl, [
            basicVertShader,
            velocityFragShader,
        ]);
        this.renderDensityProg = twgl.createProgramInfo(this.gl, [
            basicVertShader,
            densityFragShader,
        ]);

        this.simulationFramebuffer = this.gl.createFramebuffer();
    }

    /**
     * build GPU texture buffers
     */
    buildTextures() {
        const { width, height } = this;
        const numCells = width * height;

        buildVec2Texture(
            this.gl,
            this.velocityTexture,
            width,
            height,
            new Float32Array(numCells * 2).fill(0).map((_) => Math.random())
        );

        buildVec2Texture(this.gl, this.tempVelocityTexture, width, height, null);

        buildScalarTexture(
            this.gl,
            this.pressureTexture,
            width,
            height,
            new Float32Array(numCells).fill(0)
        );

        buildScalarTexture(
            this.gl,
            this.densityTexture,
            width,
            height,
            new Float32Array(numCells).fill(0).map((_) => Math.random())
        );

        buildScalarTexture(this.gl, this.tempDensityTexture, width, height, null);
    }

    setup() {
        this.buildTextures();
    }

    /**
     * run simulation update logic
     */
    update(time: number) {
        this.timeStep = time - this.prevTime;
        this.prevTime = time;

        // bindFramebuffer(this.gl, this.simulationFramebuffer, this.width, this.height);
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
