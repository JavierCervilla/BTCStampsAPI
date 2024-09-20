import { serverConfig } from "$server/config/config.ts";

import { BufReader } from "https://deno.land/std@0.177.0/io/mod.ts";
import { TextProtoReader } from "https://deno.land/std@0.52.0/textproto/mod.ts";

export class Electrum {
  private conn: Deno.Conn;
  private reader: TextProtoReader;
  private id: number;
  public uuid: string;

  constructor() {
    this.id = 0;
    this.uuid = crypto.randomUUID();
  }

  public async connect(addr: { hostname: string; port: number }) {
    this.conn = await Deno.connect(addr);
    this.reader = new TextProtoReader(new BufReader(this.conn));
  }

  private async readLine(): Promise<string> {
    const result = await this.reader.readLine();
    if (result === null) {
      throw new Error("Read line timeout or connection closed");
    }
    return result;
  }

  private createRequests(
    requests: { method: string; params: any[] }[],
  ): object[] {
    return requests.map((request) => ({
      ...request,
      id: this.id++,
      jsonrpc: "2.0",
    }));
  }

  public async call(
    requests: { method: string; params: any[] }[],
  ): Promise<any[]> {
    const rpcRequests = this.createRequests(requests);

    const msg = JSON.stringify(rpcRequests) + "\n";
    await this.conn.write(new TextEncoder().encode(msg));

    const responseLine = await this.readLine();
    const response = JSON.parse(responseLine);
    try {
      return response.map((r: any) => r.result);
    } catch (err) {
      throw new Error(JSON.stringify(response));
    }
  }

  public close() {
    if (this.conn) {
      try {
        this.conn.close();
        console.log(`Connection ${this.uuid} closed.`);
        this.conn = null;
      } catch (error) {
        if (error instanceof Error && error.name === "BadResource") {
          console.warn(`Connection ${this.uuid} already closed.`);
        } else {
          console.error(`Error closing connection ${this.uuid}:`, error);
        }
      }
    } else {
      console.warn(
        `the connection ${this.uuid} was already closed or did not exist.`,
      );
    }
  }
}

class ElectrumConnectionPool {
  pool: Electrum[] = [];
  private readonly maxPoolSize: number;
  private activeConnectionCount: number = 0;

  constructor(maxPoolSize: number) {
    this.maxPoolSize = maxPoolSize;
  }

  async getClient(): Promise<Electrum> {
    const addr = {
      hostname: serverConfig.ELECTRUM.HOST,
      port: serverConfig.ELECTRUM.PORT,
    };
    if (this.pool.length > 0) {
      const client = this.pool.pop() as Electrum;
      this.activeConnectionCount++;
      console.log(
        `\x1b[32mSUCCESS\x1b[0m: Connection established with electrum \x1b[34m${client.uuid}\x1b[0m.`,
      );

      return client;
    }
    if (this.activeConnectionCount < this.maxPoolSize) {
      const client = await this.createConnection(addr);
      this.activeConnectionCount++;
      console.log(
        `\x1b[32mSUCCESS\x1b[0m: Connection established with electrum \x1b[34m${client.uuid}\x1b[0m.`,
      );

      return client;
    }

    throw new Error("No available connections in the pool");
  }

  releaseClient(client: Electrum): void {
    if (!this.pool.some((c) => c.uuid === client.uuid)) {
      this.pool.push(client);
      this.activeConnectionCount--;
      console.log(
        `\x1b[36mINFO\x1b[0m released connection \x1b[36m${client.uuid}\x1b[0m`,
      );
    }
  }

  closeClient(client: Electrum) {
    client.close();
    const index = this.pool.findIndex((c) => c.uuid === client.uuid);
    if (index > -1) {
      this.pool.splice(index, 1);
    }
    this.activeConnectionCount--;
  }

  private async createConnection(
    addr: { hostname: string; port: number },
  ): Promise<Electrum> {
    const client = new Electrum();
    await client.connect(addr);
    return client;
  }
}

const maxPoolSize = 30;
export const electrumManager = new ElectrumConnectionPool(maxPoolSize);
export default electrumManager;
