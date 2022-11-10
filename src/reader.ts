import { GameData, gunNames, GameEvent, CnData } from "./types.js";
import { GameState } from "./game-state.js";

export class GameReader {
  private data: GameData = new Map();
  private spawned = new Set<number>();
  private maxTs = 0;
  private isPause = false;

  getStreamConsumer() {
    const it = this;
    return async function* (chunks: any) {
      for await (const data of chunks) {
        it.parseEvent(data);
      }
      it.postProcess();
    }
  }

  getData() {
    return new GameState(this.data, this.maxTs);
  }

  private postProcess() {
    const gameData: GameData = new Map();
    for (const cn of this.spawned) {
      gameData.set(cn, this.data.get(cn)!);
    }
    this.data = gameData;
  }

  private parseEvent(data: any) {
    const {timestamp, cn} = data;
    if (timestamp > this.maxTs) {
      this.maxTs = timestamp;
    }
    if (data.msg === 'N_PAUSEGAME') {
      this.isPause = data.isPause;
      return;
    }
    switch(data.msg) {
      case 'N_WELCOME':
        for (const ev of data.data) {
          this.parseEvent(ev);
        }
        return;
      case 'N_INITCLIENT': {
        const { cn, name } = data;
        this.addName(cn, name);
        return;
      }
      case 'N_SWITCHNAME': {
        const { cn, name } = data;
        this.addName(cn, name);
        return;
      }
      case 'N_POS': {
        if (this.isPause) {
          return;
        }
        const { yaw, pitch, roll, pos, vel } = data;
        const ev = {
          type: 'POS' as const,
          timestamp, yaw, pitch, roll, pos, vel
        };
        this.addEvent(ev, cn);
        return;
      }
      case 'N_PING': {
        if (this.isPause) {
          return;
        }
        const { ping } = data;
        const ev = {
          type: 'PING' as const,
          timestamp,
          ping,
        }
        this.addEvent(ev, cn);
        return;
      }
      case 'N_SHOTFX': {
        let { gun, from, to } = data;
        const ev = {
          type: 'SHOT' as const,
          timestamp,
          gun: gunNames[gun],
          from,
          to
        }
        this.addEvent(ev, cn);
        return;
      }
      case 'N_DAMAGE': {
        let { tcn, acn, damage } = data;
        const ev1 = {
          type: 'HIT' as const,
          timestamp,
          tcn,
          damage,
        }
        const ev2 = {
          type: 'DAMAGE' as const,
          timestamp,
          acn,
          damage,
        }
        this.addEvent(ev1, acn);
        this.addEvent(ev2, tcn);
        return;
      }
      case 'N_DIED': {
        let { tcn, acn } = data;
        const ev1 = {
          type: 'KILL' as const,
          timestamp,
          tcn,
        }
        const ev2 = {
          type: 'DIED' as const,
          timestamp,
          acn,
        }
        this.addEvent(ev1, acn);
        this.addEvent(ev2, tcn);
        return;
      }
      case 'N_SPAWN': {
        const ev = {
          type: 'SPAWN' as const,
          timestamp,
        }
        this.spawned.add(cn);
        this.addEvent(ev, cn);
        return;
      }
      default: {
        return;
      }
    }
  }

  private addEvent(ev: GameEvent, cn: number) {
    let cnData = this.getCnData(cn);
    switch(ev.type) {
      case 'POS': {
        cnData.pos.add(ev);
        return;
      }
      case 'PING': {
        cnData.ping.add(ev);
        return;
      }
      default: {
        cnData.game.push(ev);
        return;
      }
    }
  }

  private addName(cn: number, name: string) {
    let cnData = this.getCnData(cn);
    cnData.names.push(name);
  }

  private getCnData(cn: number) {
    let cnData = this.data.get(cn);
    if (!cnData) {
      cnData = new CnData();
      this.data.set(cn, cnData);
    }
    return cnData;
  }
}
