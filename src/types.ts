import { EvSeq, TimeStamped } from "./ev-seq.js";

export type Vec3 = [number, number, number];

export const gunNames = ['FIST', 'SG', 'CG', 'RL', 'RIFLE', 'GL', 'PISTOL'] as const;
export type GunNames = typeof gunNames[number];

const M_TEAM       = 1<<0;
const M_NOITEMS    = 1<<1;
const M_NOAMMO     = 1<<2;
const M_INSTA      = 1<<3;
const M_EFFICIENCY = 1<<4;
const M_TACTICS    = 1<<5;
const M_CAPTURE    = 1<<6;
const M_REGEN      = 1<<7;
const M_CTF        = 1<<8;
const M_PROTECT    = 1<<9;
const M_HOLD       = 1<<10;
const M_EDIT       = 1<<12;
const M_DEMO       = 1<<13;
const M_LOCAL      = 1<<14;
const M_LOBBY      = 1<<15;
const M_DMSP       = 1<<16;
const M_CLASSICSP  = 1<<17;
// const M_SLOWMO     = 1<<18;
const M_COLLECT    = 1<<19;

export const modeName = new Map([
  [M_LOCAL | M_CLASSICSP, "SP"],
  [M_LOCAL | M_DMSP, "DMSP"],
  [M_DEMO | M_LOCAL, "demo"],
  [M_LOBBY, "ffa"],
  [M_EDIT, "coop edit"],
  [M_TEAM, "teamplay"],
  [M_NOITEMS | M_INSTA, "instagib"],
  [M_NOITEMS | M_INSTA | M_TEAM, "insta team"],
  [M_NOITEMS | M_EFFICIENCY, "efficiency"],
  [M_NOITEMS | M_EFFICIENCY | M_TEAM, "effic team"],
  [M_NOITEMS | M_TACTICS, "tactics"],
  [M_NOITEMS | M_TACTICS | M_TEAM, "tac team"],
  [M_NOAMMO | M_TACTICS | M_CAPTURE | M_TEAM, "capture"],
  [M_NOITEMS | M_CAPTURE | M_REGEN | M_TEAM, "regen capture"],
  [M_CTF | M_TEAM, "ctf"],
  [M_NOITEMS | M_INSTA | M_CTF | M_TEAM, "insta ctf"],
  [M_CTF | M_PROTECT | M_TEAM, "protect"],
  [M_NOITEMS | M_INSTA | M_CTF | M_PROTECT | M_TEAM, "insta protect"],
  [M_CTF | M_HOLD | M_TEAM, "hold"],
  [M_NOITEMS | M_INSTA | M_CTF | M_HOLD | M_TEAM, "insta hold"],
  [M_NOITEMS | M_EFFICIENCY | M_CTF | M_TEAM, "effic ctf"],
  [M_NOITEMS | M_EFFICIENCY | M_CTF | M_PROTECT | M_TEAM, "effic protect"],
  [M_NOITEMS | M_EFFICIENCY | M_CTF | M_HOLD | M_TEAM, "effic hold"],
  [M_COLLECT | M_TEAM, "collect"],
  [M_NOITEMS | M_INSTA | M_COLLECT | M_TEAM, "insta collect"],
  [M_NOITEMS | M_EFFICIENCY | M_COLLECT | M_TEAM, "effic collect"],
]);

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
