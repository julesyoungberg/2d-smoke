import * as twgl from 'twgl.js';

import bindFramebuffer, { bindFramebufferWithTexture } from './bindFramebuffer';
import { buildColorTexture } from './buildTexture';
import { swap } from './util';

const advectShader = require('./shaders/advect.frag');
const basicVertShader = require('./shaders/basic.vert');
const velocityFragShader = require('./shaders/velocityTexture.frag');
const densityFragShader = require('./shaders/densityTexture.frag');

/**
 * FluidSimulator class
 * Simulates fluids in 2D using a Eulerian approach on the GPU
 */
export default class FluidSimulator {
    // buffers
    quadBufferInfo: twgl.BufferInfo;
    // textures
    velocityTexture: number;
    tempVelocityTexture: number;
    pressureTexture: number;
    densityTexture: number;
    tempDensityTexture: number;
    // frame buffers
    simulationFramebuffer: number;
    // shader programs
    advectProgInfo: twgl.ProgramInfo;
    renderVelocityProgInfo: twgl.ProgramInfo;
    renderDensityProgInfo: twgl.ProgramInfo;
    // simulation state
    prevTime = 0;
    timeStep = 0;
    timeScale = 0.001;

    constructor(readonly gl: any, readonly width: number, readonly height: number) {
        this.quadBufferInfo = twgl.createBufferInfoFromArrays(gl, {
            position: {
                data: [-1, -1, -1, 1, 1, -1, 1, 1],
                numComponents: 2,
            },
        });

        this.velocityTexture = gl.createTexture();
        this.tempVelocityTexture = gl.createTexture();
        this.pressureTexture = gl.createTexture();
        this.densityTexture = gl.createTexture();
        this.tempDensityTexture = gl.createTexture();

        this.advectProgInfo = twgl.createProgramInfo(gl, [
            basicVertShader,
            advectShader,
        ]);

        this.renderVelocityProgInfo = twgl.createProgramInfo(gl, [
            basicVertShader,
            velocityFragShader,
        ]);

        this.renderDensityProgInfo = twgl.createProgramInfo(gl, [
            basicVertShader,
            densityFragShader,
        ]);

        this.simulationFramebuffer = gl.createFramebuffer();
    }

    /**
     * build GPU texture buffers
     */
    buildTextures() {
        const { width, height } = this;
        const numCells = width * height;

        buildColorTexture(
            this.gl,
            this.velocityTexture,
            width,
            height,
            new Float32Array(numCells * 4).fill(0).map((_) => Math.random())
        );

        buildColorTexture(this.gl, this.tempVelocityTexture, width, height, null);

        buildColorTexture(
            this.gl,
            this.pressureTexture,
            width,
            height,
            new Float32Array(numCells * 4).fill(0)
        );

        buildColorTexture(
            this.gl,
            this.densityTexture,
            width,
            height,
            new Float32Array(numCells * 4).fill(0).map((_) => Math.random())
        );

        buildColorTexture(this.gl, this.tempDensityTexture, width, height, null);
    }

    setup() {
        this.buildTextures();
    }

    drawQuad() {
        twgl.drawBufferInfo(this.gl, this.quadBufferInfo, this.gl.TRIANGLE_STRIP);
    }

    /**
     * advect the fluid density
     */
    runAdvectProg() {
        bindFramebufferWithTexture(this.gl, this.simulationFramebuffer, this.width, this.height, this.tempVelocityTexture);
        
        const uniforms = {
            resolution: [this.width, this.height],
            timeStep: this.timeStep,
            velocityTexture: this.velocityTexture,
            quantityTexture: this.velocityTexture,            
        };

        this.gl.useProgram(this.advectProgInfo.program);
        twgl.setBuffersAndAttributes(this.gl, this.advectProgInfo, this.quadBufferInfo);
        twgl.setUniforms(this.advectProgInfo, uniforms);
        this.drawQuad();

        swap(this, 'velocityTexture', 'tempVelocityTexture');
    }

    /**
     * run simulation update logic
     */
    update(time: number) {
        this.timeStep = time - this.prevTime;
        this.prevTime = time;

        this.runAdvectProg();
    }

    getTime() {
        return this.prevTime + this.timeStep;
    }

    /**
     * draw velocity texture
     */
    drawVelocity() {
        const uniforms = {
            time: this.getTime() * this.timeScale,
            resolution: [this.gl.canvas.width, this.gl.canvas.height],
            velocityTexture: this.velocityTexture,
        };

        this.gl.useProgram(this.renderVelocityProgInfo.program);
        twgl.setBuffersAndAttributes(this.gl, this.renderVelocityProgInfo, this.quadBufferInfo);
        twgl.setUniforms(this.renderVelocityProgInfo, uniforms);
        this.drawQuad();
    }

    /**
     * draw density texture
     */
    drawDensity() {
        const uniforms = {
            time: this.getTime() * this.timeScale,
            resolution: [this.gl.canvas.width, this.gl.canvas.height],
            densityTexture: this.densityTexture,
        };

        this.gl.useProgram(this.renderDensityProgInfo.program);
        twgl.setBuffersAndAttributes(this.gl, this.renderDensityProgInfo, this.quadBufferInfo);
        twgl.setUniforms(this.renderDensityProgInfo, uniforms);
        this.drawQuad();
    }

    /**
     * draw current state of simulation
     */
    draw() {
        bindFramebuffer(this.gl, null, this.gl.canvas.width, this.gl.canvas.height);
        // Clear the canvas AND the depth buffer.
        this.gl.clearColor(1, 1, 1, 1);   // clear to white
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.drawVelocity();
    }
}
