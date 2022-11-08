import { GameData, InterpolatedValue, Ping, Position, Vec3, GamePlayEvent } from "./types.js";
import itree from 'node-interval-tree'
const IntervalTree = itree.default;

type CNed = {
  cn: number;
}

export type Filter = itree.default<GamePlayEvent & CNed>;

export class GameState {
  constructor(public state: GameData, public maxTimestamp: number) {
  }

  getPing(cn: number, ts: number): InterpolatedValue<Ping> | void {
    const cnData = this.state.get(cn);
    if (!cnData) {
      return;
    }
    const vals = cnData.ping.getInterval(ts)
    if (!vals) {
      return;
    }
    return this.interpolatePing(ts, vals);
  }

  getPos(cn: number, ts: number, adjustToCn?: number): InterpolatedValue<Position> | void {
    let adjust = 0;
    if (adjustToCn) {
      adjust = this.getAdjust(adjustToCn, ts);
    }

    const cnData = this.state.get(cn);
    if (!cnData) {
      return;
    }
    const vals = cnData.pos.getInterval(ts + adjust);
    if (!vals) {
      return;
    }
    return this.interpolatePos(ts, vals, adjust);
  }

  getAdjust(adjustToCn: number, ts: number) {
    let adjust = 0;
    const ping = this.getPing(adjustToCn, ts);
    if (ping) {
      adjust -= ping.value.ping / 2;
    }
    adjust -= 34/2 // server tick avg delay approximation
    return adjust;
  }

  makeEventFilter(cn: number, offset: number, filter: (ev: GamePlayEvent) => boolean): Filter {
    const tree = new IntervalTree<GamePlayEvent & CNed>();
    for (const ev of this.state.get(cn)!.game) {
      if (filter(ev)) {
        tree.insert((ev.timestamp - offset), ev.timestamp, {cn, ...ev});
      }
    }
    return tree;
  }

  reduceFiltered<T>(filter: Filter, initial: T, fn: (acc: T, ts: number, causeEvent: GamePlayEvent & CNed) => T) {
    let acc = initial;
    for (const intervalData of filter.inOrder()) {
      for (let ts = intervalData.low; ts <= intervalData.high; ts++) {
        acc = fn(acc, ts, intervalData.data);
      }
    }
    return acc;
  }

  private interpolatePing(timestamp: number, [start, end]: [Ping, Ping]): InterpolatedValue<Ping> {
    const ping = this.linInterpolate(timestamp, start.timestamp, start.ping, end.timestamp, end.ping);
    const value = {
      type: 'PING' as const,
      timestamp,
      ping,
    }
    return { value, adjust: 0, rawInterval: [start, end]};
  }

  private interpolatePos(timestamp: number, [start, end]: [Position, Position], adjust: number): InterpolatedValue<Position> {
    const [yaw, pitch, roll] = (['yaw', 'pitch', 'roll'] as const).map((prop) => {
      return this.linInterpolate(timestamp, start.timestamp, start[prop], end.timestamp, end[prop]);
    });
    const pos = this.interpolateVec3(timestamp, start.pos, start.timestamp, end.pos, end.timestamp);
    const vel = this.interpolateVec3(timestamp, start.vel, start.timestamp, end.vel, end.timestamp);

    const value = {
      type: 'POS' as const,
      timestamp,
      yaw,
      pitch,
      roll,
      pos,
      vel
    }
    return { value, adjust, rawInterval: [start, end]};
  }

  private interpolateVec3(timestamp: number, start: Vec3, startTime: number, end: Vec3, endTime: number): Vec3 {
    return [0,1,2].map((idx) => this.linInterpolate(timestamp, startTime, start[idx], endTime, end[idx])) as Vec3;
  }

  private linInterpolate(x: number, x0: number, y0: number, x1: number, y1: number): number {
    if (x1 === x0) {
      return y0;
    }
    return (y0*(x1-x) + y1*(x-x0))/(x1-x0);
  }
}
