import { randomColor } from './util/color';

/**
 * Represents a mouse or finger on the screen
 */
export default class Pointer {
    id = -1;
    x = 0;
    y = 0;
    prevX = 0;
    prevY = 0;
    deltaX = 0;
    deltaY = 0;
    down = false;
    moved = false;
    color: number[];

    constructor(readonly canvas: HTMLCanvasElement) {
        this.color = randomColor();
    }

    onDown(id: number, x: number, y: number) {
        this.id = id;
        this.x = x / this.canvas.width;
        this.y = 1 - y / this.canvas.height;
        this.prevX = this.x;
        this.prevY = this.y;
        this.deltaX = 0;
        this.deltaY = 0;
        this.down = true;
        this.moved = false;
        this.color = randomColor();
    }

    scaleDeltaX(d: number) {
        const aspectRatio = this.canvas.width / this.canvas.height;
        if (aspectRatio < 1) {
            return d * aspectRatio;
        }

        return d;
    }

    scaleDeltaY(d: number) {
        const aspectRatio = this.canvas.width / this.canvas.height;
        if (aspectRatio > 1) {
            return d / aspectRatio;
        }

        return d;
    }

    onMove(x: number, y: number) {
        this.prevX = this.x;
        this.prevY = this.y;
        this.x = x / this.canvas.width;
        this.y = 1 - y / this.canvas.height;
        this.deltaX = this.scaleDeltaX(this.x - this.prevX);
        this.deltaY = this.scaleDeltaY(this.y - this.prevY);
        this.moved = Math.abs(this.deltaX) > 0 || Math.abs(this.deltaY) > 0;
    }

    onUp() {
        this.down = false;
    }
}
