import * as twgl from 'twgl.js';

import Pointer from './Pointer';
import Pointers from './Pointers';
import { swap } from './util';
import bindFramebuffer, { bindFramebufferWithTexture } from './util/bindFramebuffer';
import buildTexture from './util/buildTexture';
import { Color, randomColor } from './util/color';
import getResolution, { Resolution } from './util/getResolution';

const advectShader = require('./shaders/advect.frag');
const addForcesShader = require('./shaders/addForces.frag');
const basicFragShader = require('./shaders/basic.frag');
const basicVertShader = require('./shaders/basic.vert');
const boundaryShader = require('./shaders/boundary.frag');
const divergenceShader = require('./shaders/divergence.frag');
const jacobiShader = require('./shaders/jacobi.frag');
const splatShader = require('./shaders/splat.frag');
const subtractShader = require('./shaders/subtract.frag');
const textureShader = require('./shaders/texture.frag');

const config = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 1024,
    CAPTURE_RESOLUTION: 512,
    DENSITY_DISSIPATION: 1,
    VELOCITY_DISSIPATION: 0.2,
    PRESSURE: 0.8,
    PRESSURE_ITERATIONS: 50,
    CURL: 30,
    SPLAT_RADIUS: 2.0,
    SPLAT_FORCE: 6000,
};

/**
 * FluidSimulator class
 * Simulates fluids in 2D using a Eulerian approach on the GPU
 */
export default class FluidSimulator {
    gl: WebGLRenderingContext;
    // buffers
    quadBufferInfo: twgl.BufferInfo;
    // textures
    divergenceTexture: WebGLTexture;
    dyeTexture: WebGLTexture;
    dyeTempTexture: WebGLTexture;
    pressureTexture: WebGLTexture;
    simTexture: WebGLTexture;
    velocityTexture: WebGLTexture;
    // frame buffers
    simulationFramebuffer: WebGLFramebuffer;
    dyeFramebuffer: WebGLFramebuffer;
    // shader programs
    advectProgInfo: twgl.ProgramInfo;
    addForcesProgInfo: twgl.ProgramInfo;
    basicProgInfo: twgl.ProgramInfo;
    boundaryProgInfo: twgl.ProgramInfo;
    divergenceProgInfo: twgl.ProgramInfo;
    jacobiProgInfo: twgl.ProgramInfo;
    renderTextureProgInfo: twgl.ProgramInfo;
    splatProgInfo: twgl.ProgramInfo;
    subtractProgInfo: twgl.ProgramInfo;
    // simulation state
    prevTime = 0;
    timeStep = 0;
    timeScale = 0.001;
    viscosity = 0.101;
    pointers: Pointers;
    swap: (a: string, b: string) => void;
    simRes: Resolution;
    dyeRes: Resolution;
    splatStack: number[] = [];
    running = true;

    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;
        this.quadBufferInfo = twgl.createBufferInfoFromArrays(gl, {
            position: {
                data: [-1, -1, -1, 1, 1, -1, 1, 1],
                numComponents: 2,
            },
        });

        this.divergenceTexture = gl.createTexture();
        this.dyeTexture = gl.createTexture();
        this.dyeTempTexture = gl.createTexture();
        this.pressureTexture = gl.createTexture();
        this.simTexture = gl.createTexture();
        this.velocityTexture = gl.createTexture();

        this.advectProgInfo = twgl.createProgramInfo(gl, [basicVertShader, advectShader]);
        this.addForcesProgInfo = twgl.createProgramInfo(gl, [basicVertShader, addForcesShader]);
        this.basicProgInfo = twgl.createProgramInfo(gl, [basicVertShader, basicFragShader]);
        this.boundaryProgInfo = twgl.createProgramInfo(gl, [basicVertShader, boundaryShader]);
        this.divergenceProgInfo = twgl.createProgramInfo(gl, [basicVertShader, divergenceShader]);
        this.jacobiProgInfo = twgl.createProgramInfo(gl, [basicVertShader, jacobiShader]);
        this.renderTextureProgInfo = twgl.createProgramInfo(gl, [basicVertShader, textureShader]);
        this.splatProgInfo = twgl.createProgramInfo(gl, [basicVertShader, splatShader]);
        this.subtractProgInfo = twgl.createProgramInfo(gl, [basicVertShader, subtractShader]);

        this.simulationFramebuffer = gl.createFramebuffer();
        this.dyeFramebuffer = gl.createFramebuffer();

        this.pointers = new Pointers(gl.canvas as HTMLCanvasElement);

        this.swap = swap.bind(this);

        this.simRes = getResolution(gl, config.SIM_RESOLUTION);
        this.dyeRes = getResolution(gl, config.DYE_RESOLUTION);

        gl.canvas.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.code === 'KeyP') {
                this.running = false;
            }
        });
    }

    /**
     * build GPU texture buffers
     */
    buildTextures() {
        const { simRes, dyeRes } = this;
        const numCells = simRes.width * simRes.height;

        // create simulation textures
        const zeros = new Float32Array(numCells * 4).fill(0);
        const opt = { ...simRes, src: zeros };
        buildTexture(this.gl, this.divergenceTexture, opt);
        buildTexture(this.gl, this.pressureTexture, opt);
        buildTexture(this.gl, this.simTexture, { ...simRes, src: null });
        buildTexture(this.gl, this.velocityTexture, opt);

        // create dye texture
        buildTexture(this.gl, this.dyeTexture, { ...dyeRes, src: new Float32Array(dyeRes.width * dyeRes.height * 4) });
        buildTexture(this.gl, this.dyeTempTexture, { ...dyeRes, src: null });
    }

    setup() {
        this.buildTextures();
        this.multipleSplats(Math.random() * 4 + 2);
    }

    bindSimFramebuffer(texture?: WebGLTexture) {
        bindFramebufferWithTexture(
            this.gl,
            this.simulationFramebuffer,
            this.simRes.width,
            this.simRes.height,
            texture || this.simTexture
        );
    }

    bindDyeFrameBuffer(texture?: WebGLTexture) {
        bindFramebufferWithTexture(
            this.gl,
            this.dyeFramebuffer,
            this.dyeRes.width,
            this.dyeRes.height,
            texture || this.dyeTempTexture
        );
    }

    runProg(programInfo: twgl.ProgramInfo, uniforms: Record<string, any>) {
        this.gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(this.gl, programInfo, this.quadBufferInfo);
        twgl.setUniforms(programInfo, uniforms);
        twgl.drawBufferInfo(this.gl, this.quadBufferInfo, this.gl.TRIANGLE_STRIP);
    }

    runSimProg(programInfo: twgl.ProgramInfo, uniforms: Record<string, any>) {
        this.bindSimFramebuffer();
        this.runProg(programInfo, uniforms);
    }

    getSimRes() {
        return [this.simRes.width, this.simRes.height];
    }

    /**
     * advect the fluid density
     */
    advect() {
        this.runSimProg(this.advectProgInfo, {
            resolution: this.getSimRes(),
            timeStep: this.timeStep,
            velocityTexture: this.velocityTexture,
            quantityTexture: this.velocityTexture,
        });

        this.swap('velocityTexture', 'simTexture');
    }

    /**
     * Generic function to run jacobi iteration program
     */
    runJacobiProg(alpha: number, rBeta: number, x: WebGLTexture, b: WebGLTexture) {
        this.runProg(this.jacobiProgInfo, {
            resolution: this.getSimRes(),
            alpha,
            rBeta,
            x,
            b,
        });
    }

    /**
     * Perform viscous diffusion on the fluid using jacobi iteration
     */
    diffuseVelocity() {
        this.bindSimFramebuffer();

        const ndt = this.viscosity * this.timeStep;
        const alpha = this.simRes.width ** 2 / ndt;
        const rBeta = 1 / (4 + this.simRes.width ** 2 / ndt);

        for (let i = 0; i < 50; i++) {
            this.gl.framebufferTexture2D(
                this.gl.FRAMEBUFFER,
                this.gl.COLOR_ATTACHMENT0,
                this.gl.TEXTURE_2D,
                this.simTexture,
                0
            );
            this.runJacobiProg(alpha, rBeta, this.velocityTexture, this.velocityTexture);
            this.swap('velocityTexture', 'simTexture');
        }
    }

    /**
     * apply external forces to velocity field
     */
    addForces() {
        this.runSimProg(this.addForcesProgInfo, {
            resolution: this.getSimRes(),
            timeStep: this.timeStep,
            velocityTexture: this.velocityTexture,
        });

        this.swap('velocityTexture', 'simTexture');
    }

    /**
     * Compute the divergence of the velocity field
     */
    computeDivergence() {
        this.bindSimFramebuffer(this.divergenceTexture);
        this.runProg(this.divergenceProgInfo, {
            resolution: this.getSimRes(),
            halfrdx: 0.5 * (1 / this.simRes.width), // should this be divison like in GPU gems?
            w: this.velocityTexture,
        });
    }

    /**
     * Compute pressure field with jacobi iteration
     */
    computePressureField() {
        this.bindSimFramebuffer(this.pressureTexture);

        const alpha = -(this.simRes.width ** 2);
        const rBeta = 0.25;

        for (let i = 0; i < 50; i++) {
            this.gl.framebufferTexture2D(
                this.gl.FRAMEBUFFER,
                this.gl.COLOR_ATTACHMENT0,
                this.gl.TEXTURE_2D,
                this.simTexture,
                0
            );
            this.runJacobiProg(alpha, rBeta, this.divergenceTexture, this.pressureTexture);
            this.swap('pressureTexture', 'simTexture');
        }
    }

    /**
     * Subtract pressure field gradient from intermediate velocity field
     */
    subtractPressureGradient() {
        this.runSimProg(this.subtractProgInfo, {
            resolution: this.getSimRes(),
            halfrdx: 0.5 / (1 / this.simRes.width),
            pressureField: this.pressureTexture,
            velocityField: this.velocityTexture,
        });

        this.swap('velocityTexture', 'simTexture');
    }

    /**
     * Enforce boundary conditions on a given field
     */
    enforceFieldBoundaries(x: WebGLTexture, scale: number) {
        this.runSimProg(this.boundaryProgInfo, {
            resolution: this.getSimRes(),
            scale,
            x,
        });
    }

    enforceVelocityBoundaries() {
        this.enforceFieldBoundaries(this.velocityTexture, -1);
    }

    enforcePressureBoundaries() {
        this.enforceFieldBoundaries(this.pressureTexture, 1);
    }

    scaleRadius(r: number) {
        const aspectRatio = this.gl.canvas.width / this.gl.canvas.height;
        if (aspectRatio > 1) {
            return r * aspectRatio;
        }

        return r;
    }

    splat(x: number, y: number, dx: number, dy: number, color: Color) {
        const common = {
            aspectRatio: this.gl.canvas.width / this.gl.canvas.height,
            point: [x, y],
            radius: this.scaleRadius(config.SPLAT_RADIUS / 100.0),
        };
    
        this.runSimProg(this.splatProgInfo, {
            ...common,
            color: [dx, dy, 0],
            tex: this.velocityTexture,
        });
        this.swap('velocityTexture', 'simTexture');

        this.bindDyeFrameBuffer();
        this.runProg(this.splatProgInfo, {
            ...common,
            color: [color.r, color.g, color.b],
            tex: this.dyeTexture,
        });
        this.swap('dyeTexture', 'dyeTempTexture');
    }

    multipleSplats(nSplats: number) {
        for (let i = 0; i < nSplats; i++) {
            const color = randomColor();
            color.r *= 10.0;
            color.g *= 10.0;
            color.b *= 10.0;
            const x = Math.random();
            const y = Math.random();
            const dx = 1000 * (Math.random() - 0.5);
            const dy = 1000 * (Math.random() - 0.5);
            this.splat(x, y, dx, dy, color);
        }
    }

    splatPointer(p: Pointer) {
        const dx = p.deltaX * config.SPLAT_FORCE;
        const dy = p.deltaY * config.SPLAT_FORCE;
        this.splat(p.x, p.y, dx, dy, p.color);
    }

    applyInputs() {
        if (this.splatStack.length > 0) {
            this.multipleSplats(this.splatStack.pop());
        }

        this.pointers.pointers.forEach(p => {
            if (p.moved) {
                p.moved = false;
                this.splatPointer(p);
            }
        })
    }

    /**
     * run simulation update logic
     */
    runSimulation() {
        this.gl.disable(this.gl.BLEND);
        // this.advect();
        // this.diffuseVelocity();
        // this.addForces();
        // this.computeDivergence();
        // this.computePressureField();
        // this.subtractPressureGradient();
        // console.log(getTextureData(this.gl, this.divergenceTexture, this.res, this.res));
    }

    /**
     * main update logic ran each time step`
     * @param time 
     */
    update(time: number) {
        this.timeStep = time - this.prevTime;
        this.prevTime = time;

        this.applyInputs();
        
        if (this.running) {
            this.runSimulation();
        }
    }

    getTime() {
        return this.prevTime + this.timeStep;
    }

    drawBasic() {
        this.runProg(this.basicProgInfo, {});
    }

    drawTexture(tex: WebGLTexture) {
        this.runProg(this.renderTextureProgInfo, {
            time: this.getTime() * this.timeScale,
            resolution: [this.gl.canvas.width, this.gl.canvas.height],
            tex,
        });
    }

    /**
     * draw current state of simulation
     */
    draw() {
        bindFramebuffer(this.gl, null, this.gl.canvas.width, this.gl.canvas.height);
        // Clear the canvas AND the depth buffer.
        this.gl.clearColor(1, 1, 1, 1); // clear to white
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.drawTexture(this.dyeTexture);
    }
}
