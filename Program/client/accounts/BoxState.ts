import * as borsh from "@project-serum/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { Connection, PublicKey } from "@solana/web3.js"
import { PROGRAM_ID } from "../programId"

export interface BoxStateFields {
  nextId: number
  slots: Array<number>
}

export interface BoxStateJSON {
  nextId: number
  slots: Array<number>
}

export class BoxState {
  readonly nextId: number
  readonly slots: Array<number>

  static readonly discriminator = Buffer.from([
    0x67, 0x99, 0xbe, 0xe6, 0xe2, 0x55, 0xa0, 0xcb
  ])

  static readonly layout = borsh.struct([
    borsh.u16("nextId"),
    borsh.array(borsh.u16(), 256, "slots"),
  ])

  constructor(fields: BoxStateFields) {
    this.nextId = fields.nextId
    this.slots = fields.slots
  }

  static async fetch(
    c: Connection,
    address: PublicKey
  ): Promise<BoxState | null> {
    const info = await c.getAccountInfo(address)

    if (info === null) {
      return null
    }
    if (!info.owner.equals(PROGRAM_ID)) {
      throw new Error("account doesn't belong to this program")
    }

    return this.decode(info.data)
  }

  static async fetchMultiple(
    c: Connection,
    addresses: PublicKey[]
  ): Promise<Array<BoxState | null>> {
    const infos = await c.getMultipleAccountsInfo(addresses)

    return infos.map((info) => {
      if (info === null) {
        return null
      }
      if (!info.owner.equals(PROGRAM_ID)) {
        throw new Error("account doesn't belong to this program")
      }

      return this.decode(info.data)
    })
  }

  static decode(data: Buffer): BoxState {
    if (!data.slice(0, 8).equals(BoxState.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = BoxState.layout.decode(data.slice(8))

    return new BoxState({
      nextId: dec.nextId,
      slots: dec.slots,
    })
  }

  toJSON(): BoxStateJSON {
    return {
      nextId: this.nextId,
      slots: this.slots,
    }
  }

  static fromJSON(obj: BoxStateJSON): BoxState {
    return new BoxState({
      nextId: obj.nextId,
      slots: obj.slots,
    })
  }
}
