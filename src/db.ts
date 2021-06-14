import path from "path";
import fs from "fs/promises";
import { EOL } from "os";
import { AbstractIterator } from "abstract-leveldown";
import levelup, { LevelUp } from "levelup";
import memdown, { MemDown } from "memdown";
import encode from "encoding-down";

export type Memory<K, V> = LevelUp<MemDown<K, V>, AbstractIterator<K, V>>

const defaultCodec = {
  keyEncoding: "utf-8",
  valueEncoding: "json",
};

export default class File<K, V> {
  private memory: Memory<K, V>;
  private loc: string | null;

  constructor(options?: {
    path?: string;
    data?: { key: K, value: V}[];
  }) {
    this.memory = levelup(encode(memdown(), defaultCodec));
    this.loc = options?.path == null ? null : options.path!;
  }

  async sync(): Promise<File<K, V>> {
    if (!this.loc) return this

    const db = this;
    return new Promise((resolve, reject) => {
      const stream = this.memory.createReadStream();
      let buf = "";
      stream.on("data", ({ key, value }) => {
        buf += (JSON.stringify({ key, value }) + EOL);
      });
      stream.on("end", async () => {
        try {
          await fs.writeFile(this.loc!, buf);
          return resolve(db);
        } catch (err) {
          reject(err);
        }
      });
      stream.on("error", (err) => reject(err));
    });
  }

  async write(key: K, value: V): Promise<File<K, V>> {
    return this.memory.put(key, value)
      .then(() => this)
  }

  async get(key: K, defaults?: V): Promise<V | null> {
    return this.memory.get(key).then((val) =>
      val == null
        ? defaults == null
          ? null
          : defaults
        : val
    );
  }
}