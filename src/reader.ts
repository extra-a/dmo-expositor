import { GameData, gunNames, GameEvent, CnData, GameMeta, TeamInfo, modeName } from "./types.js";
import { GameState } from "./game-state.js";

export class GameReader {
  private data: GameData = new Map();
  private meta = new GameMeta();
  private spawned = new Set<number>();
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

  getGameState(filename?: string) {
    if (filename) {
      this.meta.filename = filename;
    }
    return new GameState(this.data, this.meta);
  }

  private postProcess() {
    const gameData: GameData = new Map();
    const spawnedNames = new Set<string>();
    for (const cn of this.spawned) {
      const data = this.data.get(cn)!
      gameData.set(cn, data);
      const names = data.names;
      names.forEach(name => spawnedNames.add(name));
    }
    for (const team of this.meta.teams.values()) {
      const players = [...team.players.values()].filter(name => spawnedNames.has(name));
      team.players = new Set(players);
    }
    this.data = gameData;
  }

  private parseEvent(data: any) {
    const {timestamp, cn} = data;
    if (timestamp > this.meta.maxTs) {
      this.meta.maxTs = timestamp;
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
      case 'N_MAPCHANGE': {
        const { name, mode } = data;
        this.meta.map = name;
        this.meta.mode = modeName[mode] ?? mode;
        return;
      }
      case 'N_INITCLIENT': {
        const { cn, name, team } = data;
        this.addName(cn, name);
        this.addTeam(cn, team);
        this.addTeamPlayer(team, name);
        return;
      }
      case 'N_SWITCHNAME': {
        const { cn, name } = data;
        this.addName(cn, name);
        return;
      }
      case 'N_SETTEAM': {
        const { cn, name } = data;
        this.addTeam(cn, name);
        const cnData = this.getCnData(cn);
        if (cnData) {
          const player = cnData.names[cnData.names.length - 1];
          if (player) {
            this.addTeamPlayer(name, player);
          }
        }
        return;
      }
      case 'N_SCOREFLAG': {
        const { ocn, team, score, oflags } = data;
        const teamName = team === 1 ? 'good' : (team === 2 ? 'evil' : '');
        this.addTeamScore(teamName, score);
        const cnData = this.getCnData(ocn);
        if (cnData) {
          cnData.score = oflags;
        }
        return
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
        let { tcn, acn, frags, tfrags} = data;
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
        const acnData = this.getCnData(acn);
        if (acnData) {
          const team = acnData.teams[acnData.teams.length - 1];
          if (team) {
            this.addTeamFrags(team, tfrags);
          }
        }
        this.addFrags(acn, frags);
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

  private addTeam(cn: number, name: string) {
    let cnData = this.getCnData(cn);
    cnData.teams.push(name);
  }

  private addFrags(cn: number, frags: number) {
    let cnData = this.getCnData(cn);
    cnData.frags = frags;
  }

  private getCnData(cn: number) {
    let cnData = this.data.get(cn);
    if (!cnData) {
      cnData = new CnData();
      this.data.set(cn, cnData);
    }
    return cnData;
  }

  private addTeamFrags(name: string, frags: number) {
    const teamInfo = this.getTeamData(name);
    teamInfo.frags = frags;
  }

  private addTeamScore(name: string, score: number) {
    const teamInfo = this.getTeamData(name);
    teamInfo.score = score;
  }

  private addTeamPlayer(team: string, player: string) {
    const teamInfo = this.getTeamData(team);
    teamInfo.players.add(player);
  }

  private getTeamData(name: string) {
    let teamData = this.meta.teams.get(name);
    if (!teamData) {
      teamData = new TeamInfo();
      this.meta.teams.set(name, teamData);
    }
    return teamData;
  }
}
