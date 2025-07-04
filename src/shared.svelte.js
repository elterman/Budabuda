import { random } from 'lodash-es';
import { APP_STATE, CORNER_RADIUS, ORB_RADIUS, PAD, PCT } from './const';
import { _sound } from './sound.svelte';
import { _stats, ss } from './state.svelte';
import { blobId, clientRect, post } from './utils';

export const log = (value) => console.log($state.snapshot(value));

const createOrbs = () => {
    const count = ss.orbs.length + 1;
    // const count = 1;
    // const count = Math.max(ss.orbs.length, 9) + 1;
    ss.orbs = [];

    const width = ss.playground.width - (PAD + CORNER_RADIUS) * 2;
    const height = ss.playground.height - (PAD + CORNER_RADIUS) * 2;

    for (let i = 0; i < count; i++) {
        const orb = { cx: random(width) + CORNER_RADIUS, cy: random(height) + CORNER_RADIUS, radius: ORB_RADIUS, deg: random(0, 360), ticks: 0 };
        ss.orbs.push(orb);
    }
};

export const onStart = () => {
    _sound.play('dice');

    delete ss.over;

    ss.ticks = 0;
    ss.blobs = [];
    ss.solidArea = 0;

    createOrbs();

    clearInterval(ss.timer);
    ss.timer = setInterval(() => (ss.ticks += 1), 1);
};

export const freezeBlob = (blob, solid = true) => {
    const { cx, cy } = blob;

    const i = ss.blobs.findIndex(b => b === blob);
    ss.blobs.splice(i, 1);

    const r = clientRect(`#${blobId(cx, cy)}`);
    const radius = r.width / 2 - PAD;
    ss.blobs.push({ cx, cy, radius, solid });

    let area = radius * radius * Math.PI;
    const prev = percent();

    if (solid) {
        ss.solidArea += area;

        const pct = percent();
        const gain = pct - prev;

        if (prev < PCT && pct >= PCT) {
            _sound.play('won', { rate: 2 });
        } else {
            _sound.play(gain < 5 ? 'coin1' : gain < 15 ? 'coin2' : 'coins');
        }

        updateScore(gain);
    } else {
        if (!blob.dead) {
            _sound.play('lost', { rate: 3 });
            ss.blobs[ss.blobs.length - 1].dead = true;
        }
    }
};

const createBubble = (cx, cy) => {
    const calcMaxRadius = () => {
        const sz = { x: ss.playground.width - 2 * PAD, y: ss.playground.height - 2 * PAD };
        const maxWidth = Math.min(cx, sz.x - cx) + PAD - 1;
        const maxHeight = Math.min(cy, sz.y - cy) + PAD - 1;
        let maxRadius = Math.min(maxWidth, maxHeight);
        let other = null;

        for (const rob of [...ss.blobs, ...ss.corners]) {
            const dist = Math.hypot(cx - rob.cx, cy - rob.cy);

            if (dist - rob.radius < maxRadius) {
                maxRadius = dist - rob.radius;
                other = rob;
            }
        }

        return { maxRadius, other };
    };

    const { maxRadius, other } = calcMaxRadius(cx, cy);
    const blob = { cx, cy, maxRadius, other, ticks: ss.ticks };
    ss.blobs.push(blob);
};

export const onPointerDown = (e) => {
    if (ss.blobs.length) {
        const bi = ss.blobs.length - 1;
        const blob = ss.blobs[bi];

        if (!blob.radius && !blob.dead) {
            freezeBlob(blob);
            return;
        }
    }

    if (e.target.className.startsWith('blob')) {
        return;
    }

    _sound.play('plop');
    createBubble(Math.round(e.offsetX), Math.round(e.offsetY));

    if (ss.level === 1 && ss.blobs.length === 1) {
        _stats.plays += 1;
        persist();
    }
};

export const updateScore = (gain) => {
    ss.score += gain;

    if (ss.score > _stats.best) {
        _stats.best = ss.score;
        persist();
    }
};

export const persist = () => {
    localStorage.setItem(APP_STATE, JSON.stringify({ ..._stats }));
};

export const percent = () => ss.totalArea ? Math.floor((ss.solidArea / ss.totalArea) * 100) : 0;

export const isGameOn = () => ss.level > 1 || ss.blobs.length > 0;

export const onStartOver = () => {
    ss.next = true;

    post(() => {
        delete ss.next;
        delete ss.tools;

        ss.orbs = [];
        ss.score = 0;
        ss.level = 1;

        onStart();
    }, 500);
};
