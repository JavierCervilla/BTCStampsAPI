import { serverConfig } from "$server/config/config.ts";

import { BufReader } from "https://deno.land/std@0.177.0/io/mod.ts";
import { TextProtoReader } from "https://deno.land/std@0.52.0/textproto/mod.ts";

interface ElectrumResult {
  result: unknown;
}

export class Electrum {
  private conn: Deno.Conn | null;
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

  private async reconnect(): Promise<void> {
    let retries = 3;
    while (retries > 0) {
      try {
        await this.connect({ hostname: serverConfig.ELECTRUM.HOST, port: serverConfig.ELECTRUM.PORT });
        console.log(`Successfully reconnected ${this.uuid}`);
        return;
      } catch (error) {
        console.error(`Reconnection attempt failed for ${this.uuid}:`, error);
        retries--;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
      }
    }
    throw new Error(`Failed to reconnect ${this.uuid} after 3 attempts`);
  }

  public async call(
    requests: { method: string; params: unknown[] }[],
  ): Promise<unknown[]> {
    if (!this.conn) {
      console.warn(`Connection ${this.uuid} is not established. Attempting to reconnect...`);
      await this.reconnect();
    }
    const rpcRequests = this.createRequests(requests);
    try {
      const msg = `${JSON.stringify(rpcRequests)}\n`;
      await this.conn.write(new TextEncoder().encode(msg));
  
      const responseLine = await this.readLine();
      const response = JSON.parse(responseLine);
      return response.map((r: ElectrumResult) => r.result);
    } catch (err) {
      console.error(`Error in Electrum call for ${this.uuid}:`, err);
      this.close();
      throw new Error(`Electrum call failed: ${err.message}`);
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
