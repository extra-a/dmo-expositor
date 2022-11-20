import { EvSeq, TimeStamped } from "./ev-seq.js";

export type Vec3 = [number, number, number];

export const gunNames = ['FIST', 'SG', 'CG', 'RL', 'RIFLE', 'GL', 'PISTOL'] as const;
export type GunNames = typeof gunNames[number];

export const modeName = [
  "ffa",
  "coop edit",
  "teamplay",
  "instagib",
  "insta team",
  "efficiency",
  "effic team",
  "tactics",
  "tac team",
  "capture",
  "regen capture",
  "ctf",
  "insta ctf",
  "protect",
  "insta protect",
  "hold",
  "insta hold",
  "effic ctf",
  "effic protect",
  "effic hold",
  "collect",
  "insta collect",
  "effic collect",
] as const;

export type Position = {
  type: 'POS';
  yaw: number;
  pitch: number;
  roll: number;
  pos: Vec3,
  vel: Vec3,
} & TimeStamped;

export type Ping = {
  type: 'PING';
  ping: number
} & TimeStamped;

export type Shot = {
  type: 'SHOT';
  gun: GunNames;
  from: Vec3;
  to: Vec3;
} & TimeStamped;

export type Hit = {
  type: 'HIT';
  tcn: number;
  damage: number;
} & TimeStamped;

export type Damage = {
  type: 'DAMAGE';
  acn: number;
  damage: number;
} & TimeStamped;

export type Kill = {
  type: 'KILL';
  tcn: number;
} & TimeStamped;

export type Died = {
  type: 'DIED';
  acn: number;
} & TimeStamped;

export type Spawn = {
  type: 'SPAWN';
} & TimeStamped;

export type GamePlayEvent = Shot | Hit | Damage | Kill | Died | Spawn;
export type GameEvent = Position | Ping | Shot | Hit | Damage | Kill | Died | Spawn;

export class CnData {
  ping = new EvSeq<Ping>();
  pos = new EvSeq<Position>();
  game: GamePlayEvent[] = [];
  frags = 0;
  score = 0;
  names: string[] = [];
  teams: string[] = [];
}

export interface InterpolatedValue<T extends TimeStamped> {
  value: T;
  adjust: number;
  rawInterval: [T, T];
}

export type GameData = Map<number, CnData>;

export class TeamInfo {
  frags = 0;
  players = new Set<string>();
  score = 0;
}

export class GameMeta {
  maxTs = 0;
  map = '';
  mode = '';
  filename = '';
  teams = new Map<string, TeamInfo>();
}

export interface GameInfo {
  players: {
    cn: number,
    names: string[],
    frags: number,
    score: number,
  }[];
  map: string;
  mode: string;
  gametime: number;
  teams?: {
    players: string[],
    frags: number,
    score: number,
    team: string,
  }[];
  file?: string;
}
