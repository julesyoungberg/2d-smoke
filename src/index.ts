import * as dat from 'dat.gui';
import * as twgl from 'twgl.js';

import createContext from './util/createContext';
import FluidSimulator from './FluidSimulator';

const gl = createContext();
console.log('canvas dimensions:', [gl.canvas.width, gl.canvas.height]);
const gui = new dat.GUI();

const fluidSimulator = new FluidSimulator(gl, gui);
fluidSimulator.setup();

function render() {
    twgl.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    fluidSimulator.update();
    fluidSimulator.draw();

    requestAnimationFrame(render);
}

requestAnimationFrame(render);
