import { GameData, InterpolatedValue, Ping, Position, Vec3 } from "./types.js";

export class GameState {
  constructor(public state: GameData) {
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
      adjust = this.getAdjust(cn, adjustToCn, ts);
    }

    const cnData = this.state.get(cn);
    if (!cnData) {
      return;
    }
    const vals = cnData.pos.getInterval(ts + adjustToCn);
    if (!vals) {
      return;
    }
    return this.interpolatePos(ts, vals, adjust);
  }

  getAdjust(cn: number, adjustToCn: number, ts: number) {
    let adjust = 0;
    if (cn === adjustToCn) {
      return 0;
    }
    const p1 = this.getPing(cn, ts);
    const p2 = this.getPing(adjustToCn, ts);
    if (p1) {
      adjust -= p1.value.ping / 2;
    }
    if (p2) {
      adjust -= p2.value.ping / 2;
    }
    adjust -= 34/2 // server tick avg delay approximation
    return adjust;
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
    const [yaw, pitch, rol] = (['yaw', 'pitch', 'rol'] as const).map((prop) => {
      return this.linInterpolate(timestamp, start.timestamp, start[prop], end.timestamp, end[prop]);
    });
    const pos = this.interpolateVec3(timestamp, start.pos, start.timestamp, end.pos, end.timestamp);
    const vel = this.interpolateVec3(timestamp, start.vel, start.timestamp, end.vel, end.timestamp);

    const value = {
      type: 'POS' as const,
      timestamp,
      yaw,
      pitch,
      rol,
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
