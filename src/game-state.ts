import { GameData, InterpolatedValue, Ping, Position, Vec3, GameEvent } from "./types.js";
import itree from 'node-interval-tree';
const IntervalTree = itree.default;

export type FilterItem<T> = Array<NonNullable<T>>;
export type Filter<T> = itree.default<FilterItem<T>>;
export type Offsets = {
  before: number;
  after: number;
  mergeOverlap?: boolean;
};

export class GameState {
  constructor(public state: GameData, public maxTimestamp: number, public map: string, public mode: number, public fileName?: string) {
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

  makeEventFilter<T>(cn: number, filter: (ev: GameEvent) => T, offseter?: (data: T) => Offsets, kind: 'game' | 'pos' = 'game') {
    const tree: Filter<NonNullable<T>> = new IntervalTree();
    let prevStart = 0;
    let prevEnd = 0;
    let prevEv: FilterItem<T> = [];
    for (const ev of this.state.get(cn)![kind]) {
      const data = filter(ev);
      if (data != null) {
        const offsets = offseter ? offseter(data) : { before: 0, after: 0, mergeOverlap: false };
        const currStart = ev.timestamp - offsets.before;
        const currEnd = ev.timestamp + offsets.after;
        if (!offsets.mergeOverlap || currStart > prevEnd) {
          prevStart = currStart;
          prevEnd = currEnd;
          prevEv = [data];
          tree.insert(prevStart, prevEnd, prevEv);
        } else {
          tree.remove(prevStart, prevEnd, prevEv);
          prevEv.push(data);
          prevEnd = currEnd;
          tree.insert(prevStart, prevEnd, prevEv);
        }
      }
    }
    return tree;
  }

  narrowFilterByFilter<T, U>(primary: Filter<T>, secondary: Filter<U>) {
    const tree: Filter<NonNullable<T>> = new IntervalTree();
    for (const dataPrimary of primary.inOrder()) {
      const dataSecondary = secondary.search(dataPrimary.low, dataPrimary.high);
      if (dataSecondary && dataSecondary.length > 0) {
        tree.insert(dataPrimary.low, dataPrimary.high, dataPrimary.data);
      }
    }
    return tree;
  }

  reduceFilteredTime<T, U>(filter: Filter<U>, initial: T, fn: (acc: T, ts: number, filterData: FilterItem<U>) => T, resolution = 1) {
    let acc = initial;
    for (const intervalData of filter.inOrder()) {
      for (let ts = intervalData.low; ts <= intervalData.high; ts+=resolution) {
        acc = fn(acc, ts, intervalData.data);
      }
    }
    return acc;
  }

  getGameDescription() {
    const players = [...new Set([...this.state.values()].flatMap(val => val.names))];
    const teams = [...new Set([...this.state.values()].flatMap(val => val.teams))];
    const map = this.map;
    const mode = this.mode;
    const gametime = Math.trunc(this.maxTimestamp / 1000);
    const res = this.fileName ? { players, teams, map, mode, gametime, file: this.fileName } : { players, teams, map, mode, gametime };
    return res;
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
    const pitch = this.linInterpolate(timestamp, start.timestamp, start.pitch, end.timestamp, end.pitch);
    const yaw = this.circleInterpolate(timestamp, start.timestamp, start.yaw, end.timestamp, end.yaw);
    const roll = this.linInterpolate(timestamp, start.timestamp, start.roll, end.timestamp, end.roll);
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

  private circleInterpolate(x: number, x0: number, y0: number, x1: number, y1: number) {
    const shortest_angle = ((((y1 - y0) % 360) + 540) % 360) - 180;
    const delta = (x-x0)/(x1-x0);
    return shortest_angle * delta;
  }

  private linInterpolate(x: number, x0: number, y0: number, x1: number, y1: number): number {
    if (x1 === x0) {
      return y0;
    }
    return (y0*(x1-x) + y1*(x-x0))/(x1-x0);
  }
}
