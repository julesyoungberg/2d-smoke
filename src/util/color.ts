export function hsvToRgb(h: number, s: number, v: number) {
    let r: number;
    let g: number;
    let b: number;

    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0:
            (r = v), (g = t), (b = p);
            break;
        case 1:
            (r = q), (g = v), (b = p);
            break;
        case 2:
            (r = p), (g = v), (b = t);
            break;
        case 3:
            (r = p), (g = q), (b = v);
            break;
        case 4:
            (r = t), (g = p), (b = v);
            break;
        case 5:
            (r = v), (g = p), (b = q);
            break;
    }

    return [r, g, b];
}

export function randomColor() {
    const c = hsvToRgb(Math.random(), 1.0, 1.0);
    c[0] *= 0.15;
    c[1] *= 0.15;
    c[2] *= 0.15;
    return c;
}
