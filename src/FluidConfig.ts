import { GUI } from 'dat.gui';
import { makeNoise2D } from 'open-simplex-noise';

import { hsvToRgb } from './util/color';

const noise = makeNoise2D(Date.now());

type ColorMode = 'rainbow' | 'static';

export default class FluidConfig {
    gui: GUI;

    // texture resolutions
    simResolution = 128;
    dyeResolution = 512;
    coputeResolution = 512;

    // fluid properties
    buoyancy = 1;
    buoyancyKappa = 0.25;
    buoyancySigma = 0.1;
    color = [100, 100, 100];
    densityDissipation = 0.01;
    gravity = 5;
    pressure = 0.1;
    // rest temperature of the fluid
    // 10 for smok
    // 15 for clouds
    restTemp = 10;
    temperatureDissipation = 0.01;
    velocityDissipation = 0.0;
    viscosity = 0.101;
    vorticity = 40;

    // sim config
    colorMode: ColorMode = 'rainbow';
    colorRate = 5;
    colorOffset = 0;
    pressureIterations = 50;
    splatRadius = 0.1;
    splatForce = 6000;
    noiseX = 0.0;

    constructor(gui: GUI) {
        this.gui = gui;
        this.colorOffset = Math.random();

        gui.add(this, 'colorMode', ['rainbow', 'static']).onChange((val) => {
            if (val === 'static') {
                this.color = this.getCurrentColor().map(c => c * 255 * 50);
            }
            gui.updateDisplay();
        });
        gui.add(this, 'colorRate', 0, 10);
        gui.addColor(this, 'color');

        gui.add(this, 'densityDissipation', 0, 0.5);
        gui.add(this, 'velocityDissipation', 0, 0.5);
        gui.add(this, 'temperatureDissipation', 0, 0.5);

        gui.add(this, 'buoyancy', 0, 2);
        gui.add(this, 'buoyancyKappa', 0, 1);
        gui.add(this, 'buoyancySigma', 0, 1);
        gui.add(this, 'gravity', 0, 30);
        gui.add(this, 'pressure', 0, 1);
        gui.add(this, 'restTemp', 0, 30);
        gui.add(this, 'viscosity', 0, 500);
        gui.add(this, 'vorticity', 0, 100);

        gui.add(this, 'splatRadius', 0, 0.5);
        gui.add(this, 'splatForce', 0, 10000);
    }

    getCurrentColor() {
        const n = (noise(this.noiseX, 0) + 1) * 0.5;
        this.noiseX += this.colorRate / 40000;
        return hsvToRgb((n * 3 + this.colorOffset) % 1, 0.8, 0.5).map(c => c / 40);
    }

    getColor() {
        switch(this.colorMode) {
            case 'rainbow':
                return this.getCurrentColor();
            default:
                return this.color.map(c => c / (255 * 50));
        }
    }
}
