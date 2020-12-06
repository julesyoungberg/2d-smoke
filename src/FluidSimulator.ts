import * as twgl from 'twgl.js';

import bindFramebuffer, { bindFramebufferWithTexture } from './bindFramebuffer';
import { buildColorTexture } from './buildTexture';
import { swap } from './util';

const advectShader = require('./shaders/advect.frag');
const addForcesShader = require('./shaders/addForces.frag');
const basicVertShader = require('./shaders/basic.vert');
const textureFragShader = require('./shaders/texture.frag');
const jacobiShader = require('./shaders/jacobi.frag');
const divergenceShader = require('./shaders/divergence.frag');
const subtractShader = require('./shaders/subtract.frag');

/**
 * FluidSimulator class
 * Simulates fluids in 2D using a Eulerian approach on the GPU
 */
export default class FluidSimulator {
    // buffers
    quadBufferInfo: twgl.BufferInfo;
    // textures
    tempTexture: number;
    velocityTexture: number;
    pressureTexture: number;
    densityTexture: number;
    divergenceTexture: number;
    // frame buffers
    simulationFramebuffer: number;
    // shader programs
    advectProgInfo: twgl.ProgramInfo;
    addForcesProgInfo: twgl.ProgramInfo;
    jacobiProgInfo: twgl.ProgramInfo;
    divergenceProgInfo: twgl.ProgramInfo;
    subtractProgInfo: twgl.ProgramInfo;
    renderTextureProgInfo: twgl.ProgramInfo;
    // simulation state
    prevTime = 0;
    timeStep = 0;
    timeScale = 0.001;
    viscosity = 0.101;

    constructor(readonly gl: any, readonly res: number) {
        this.quadBufferInfo = twgl.createBufferInfoFromArrays(gl, {
            position: {
                data: [-1, -1, -1, 1, 1, -1, 1, 1],
                numComponents: 2,
            },
        });

        this.tempTexture = gl.createTexture();
        this.velocityTexture = gl.createTexture();
        this.pressureTexture = gl.createTexture();
        this.densityTexture = gl.createTexture();
        this.divergenceTexture = gl.createTexture();

        this.advectProgInfo = twgl.createProgramInfo(gl, [
            basicVertShader,
            advectShader,
        ]);

        this.addForcesProgInfo = twgl.createProgramInfo(gl, [
            basicVertShader,
            addForcesShader,
        ]);

        this.jacobiProgInfo = twgl.createProgramInfo(gl, [
            basicVertShader,
            jacobiShader,
        ]);

        this.divergenceProgInfo = twgl.createProgramInfo(gl, [
            basicVertShader,
            divergenceShader,
        ]);

        this.subtractProgInfo = twgl.createProgramInfo(gl, [
            basicVertShader,
            subtractShader,
        ]);

        this.renderTextureProgInfo = twgl.createProgramInfo(gl, [
            basicVertShader,
            textureFragShader,
        ]);

        this.simulationFramebuffer = gl.createFramebuffer();
    }

    /**
     * build GPU texture buffers
     */
    buildTextures() {
        const { res } = this;
        const numCells = res * res;

        buildColorTexture(this.gl, this.tempTexture, res, res, null);

        buildColorTexture(
            this.gl,
            this.velocityTexture,
            res,
            res,
            new Float32Array(numCells * 4).fill(0).map((_) => Math.random())
        );

        buildColorTexture(
            this.gl,
            this.pressureTexture,
            res,
            res,
            new Float32Array(numCells * 4).fill(0)
        );

        buildColorTexture(
            this.gl,
            this.densityTexture,
            res, 
            res,
            new Float32Array(numCells * 4).fill(0).map((_) => Math.random())
        );

        buildColorTexture(
            this.gl,
            this.divergenceTexture,
            res, 
            res,
            new Float32Array(numCells * 4).fill(0)
        );
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
    advect() {
        bindFramebufferWithTexture(this.gl, this.simulationFramebuffer, this.res, this.res, this.tempTexture);
        
        const uniforms = {
            resolution: [this.res, this.res],
            timeStep: this.timeStep,
            velocityTexture: this.velocityTexture,
            quantityTexture: this.velocityTexture,            
        };

        this.gl.useProgram(this.advectProgInfo.program);
        twgl.setBuffersAndAttributes(this.gl, this.advectProgInfo, this.quadBufferInfo);
        twgl.setUniforms(this.advectProgInfo, uniforms);
        this.drawQuad();

        swap(this, 'velocityTexture', 'tempTexture');
    }

    /**
     * Generic function to run jacobi iteration program
     * NOTE: this function does not bind a frame buffer nor perform any swapping
     */
    runJacobiProg(alpha: number, rBeta: number, x: number, b: number) {
        this.gl.useProgram(this.jacobiProgInfo.program);
        twgl.setBuffersAndAttributes(this.gl, this.jacobiProgInfo, this.quadBufferInfo);
        twgl.setUniforms(this.jacobiProgInfo, { alpha, rBeta, x, b });
        this.drawQuad();
    }

    /**
     * Perform viscous diffusion on the fluid using jacobi iteration
     */
    diffuseVelocity() {
        bindFramebufferWithTexture(this.gl, this.simulationFramebuffer, this.res, this.res, this.tempTexture);

        const ndt = this.viscosity * this.timeStep;
        const alpha = Math.pow(this.res, 2) / ndt;
        const rBeta = 1 / (4 + (Math.pow(this.res, 2) / ndt));

        for (let i = 0; i < 50; i++) {
            this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT, this.gl.TEXTURE_2D, this.tempTexture, 0);
            this.runJacobiProg(alpha, rBeta, this.velocityTexture, this.velocityTexture);
            swap(this, 'velocityTexture', 'tempTexture');
        }
    }

    /**
     * apply external forces to velocity field
     */
    addForces() {
        bindFramebufferWithTexture(this.gl, this.simulationFramebuffer, this.res, this.res, this.tempTexture);

        const uniforms = {
            resolution: [this.res, this.res],
            timeStep: this.timeStep,
            velocityTexture: this.velocityTexture,
        };

        this.gl.useProgram(this.addForcesProgInfo.program);
        twgl.setBuffersAndAttributes(this.gl, this.addForcesProgInfo, this.quadBufferInfo);
        twgl.setUniforms(this.addForcesProgInfo, uniforms);
        this.drawQuad();

        swap(this, 'velocityTexture', 'tempTexture');
    }

    /**
     * run simulation update logic
     * @param time
     */
    update(time: number) {
        this.timeStep = time - this.prevTime;
        this.prevTime = time;

        this.advect();
        this.addForces();
    }

    getTime() {
        return this.prevTime + this.timeStep;
    }

    drawTexture(texture: number) {
        const uniforms = {
            time: this.getTime() * this.timeScale,
            resolution: [this.gl.canvas.width, this.gl.canvas.height],
            texture,
        };

        this.gl.useProgram(this.renderTextureProgInfo.program);
        twgl.setBuffersAndAttributes(this.gl, this.renderTextureProgInfo, this.quadBufferInfo);
        twgl.setUniforms(this.renderTextureProgInfo, uniforms);
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
        this.drawTexture(this.velocityTexture);
    }
}
