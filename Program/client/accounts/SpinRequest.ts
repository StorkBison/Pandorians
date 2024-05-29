import * as borsh from "@project-serum/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { Connection, PublicKey } from "@solana/web3.js"
import { PROGRAM_ID } from "../programId"

export interface SpinRequestFields {
  raffleId: number
  bump: number
  resultBuffer: Array<number>
  result: number
  prize: number
  vrf: PublicKey
  userAuthority: PublicKey
}

export interface SpinRequestJSON {
  raffleId: number
  bump: number
  resultBuffer: Array<number>
  result: number
  prize: number
  vrf: string
  userAuthority: string
}

export class SpinRequest {
  readonly raffleId: number
  readonly bump: number
  readonly resultBuffer: Array<number>
  readonly result: number
  readonly prize: number
  readonly vrf: PublicKey
  readonly userAuthority: PublicKey

  static readonly discriminator = Buffer.from([
    0xbf, 0x96, 0xed, 0x6b, 0xdb, 0xdc, 0x43, 0xec,
  ])

  static readonly layout = borsh.struct([
    borsh.u16("raffleId"),
    borsh.u8("bump"),
    borsh.array(borsh.u8(), 32, "resultBuffer"),
    borsh.u32("result"),
    borsh.option(borsh.u8(), "prize"),
    borsh.publicKey("vrf"),
    borsh.publicKey("userAuthority"),
  ])

  constructor(fields: SpinRequestFields) {
    this.raffleId = fields.raffleId
    this.bump = fields.bump
    this.resultBuffer = fields.resultBuffer
    this.result = fields.result
    this.prize = fields.prize
    this.vrf = fields.vrf
    this.userAuthority = fields.userAuthority
  }

  static async fetch(
    c: Connection,
    address: PublicKey
  ): Promise<SpinRequest | null> {
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
  ): Promise<Array<SpinRequest | null>> {
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

  static decode(data: Buffer): SpinRequest {
    if (!data.slice(0, 8).equals(SpinRequest.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = SpinRequest.layout.decode(data.slice(8))

    return new SpinRequest({
      raffleId: dec.raffleId,
      bump: dec.bump,
      resultBuffer: dec.resultBuffer,
      result: dec.result,
      prize: dec.prize,
      vrf: dec.vrf,
      userAuthority: dec.userAuthority,
    })
  }

  toJSON(): SpinRequestJSON {
    return {
      raffleId: this.raffleId,
      bump: this.bump,
      resultBuffer: this.resultBuffer,
      result: this.result,
      prize: this.prize,
      vrf: this.vrf.toString(),
      userAuthority: this.userAuthority.toString(),
    }
  }

  static fromJSON(obj: SpinRequestJSON): SpinRequest {
    return new SpinRequest({
      raffleId: obj.raffleId,
      bump: obj.bump,
      resultBuffer: obj.resultBuffer,
      result: obj.result,
      prize: obj.prize,
      vrf: new PublicKey(obj.vrf),
      userAuthority: new PublicKey(obj.userAuthority),
    })
  }
}
