import { cross, dot, unaryMinus, add } from 'mathjs';
import { Position, Vec3 } from './types.js';

export function getAngularDist(target: Position, origin: Position) {
  const viewRay = yawPitchTovec(origin.yaw, origin.pitch);
  const tpos = add(target.pos, [0, 0, 7.5]) as Vec3;
  const opos = add(origin.pos, [0, 0, 14]) as Vec3;
  const distBetween = add(tpos, unaryMinus(opos));
  const distViewRay = cross(viewRay, distBetween);
  const lenO = vecLength(distViewRay as Vec3);
  const lenH = vecLength(distBetween as Vec3);
  return (dot(viewRay, distBetween) < 0 ? 90 : 0) + Math.asin(lenO / lenH) * 180 / Math.PI;
}

export function getAngularEstSz(target: Position, origin: Position) {
  const dist = getDist(target, origin);
  const sz = (180 / Math.PI) / dist;
  const ax = sz * 8.2;
  const ay = sz * 15;
  return { ax, ay };
}

export function getDist(target: Position, origin: Position) {
  const tpos = add(target.pos, [0, 0, 7.5]) as Vec3;
  const opos = add(origin.pos, [0, 0, 14]) as Vec3;
  const distBetween = add(tpos, unaryMinus(opos));
  return vecLength(distBetween as Vec3);
}

export function lookAngDiff(pos: Position, prevpos: Position) {
  const viewRay = (yawPitchTovec(pos.yaw, pos.pitch));
  const prevViewRay = (yawPitchTovec(prevpos.yaw, prevpos.pitch));
  return Math.acos(Math.max(-1, Math.min(1, dot(prevViewRay, viewRay)))) * 180 / Math.PI;
}

export function yawPitchTovec(yaw: number, pitch: number) {
  const vec: Vec3 = [0, 0, 0];
  yaw *= Math.PI / 180;
  pitch *= Math.PI / 180;
  vec[0] = - Math.sin(yaw) * Math.cos(pitch);
  vec[1] = Math.cos(yaw) * Math.cos(pitch);
  vec[2] = Math.sin(pitch);
  return vec;
}

export function vecLength(vec: Vec3) {
  return Math.sqrt(vec[0]**2 + vec[1]**2 + vec[2]**2);
}

export function vecNorm(vec: Vec3) {
  const len = vecLength(vec);
  return vec.map(val => val/len) as Vec3;
}
