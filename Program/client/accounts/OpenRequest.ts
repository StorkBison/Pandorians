import * as borsh from "@project-serum/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { Connection, PublicKey } from "@solana/web3.js"
import { PROGRAM_ID } from "../programId"

export interface OpenRequestFields {
  boxId: number
  bump: number
  resultBuffer: Array<number>
  tokenId: number
  vrf: PublicKey
  userAuthority: PublicKey
}

export interface OpenRequestJSON {
  boxId: number
  bump: number
  resultBuffer: Array<number>
  tokenId: number
  vrf: string
  userAuthority: string
}

export class OpenRequest {
  readonly boxId: number
  readonly bump: number
  readonly resultBuffer: Array<number>
  readonly tokenId: number
  readonly vrf: PublicKey
  readonly userAuthority: PublicKey

  static readonly discriminator = Buffer.from([
    0xce, 0xf8, 0x0c, 0x3e, 0x79, 0x49, 0xad, 0x09,
  ])

  static readonly layout = borsh.struct([
    borsh.u16("boxId"),
    borsh.u8("bump"),
    borsh.array(borsh.u8(), 32, "resultBuffer"),
    borsh.u16("tokenId"),
    borsh.publicKey("vrf"),
    borsh.publicKey("userAuthority"),
  ])

  constructor(fields: OpenRequestFields) {
    this.boxId = fields.boxId
    this.bump = fields.bump
    this.resultBuffer = fields.resultBuffer
    this.tokenId = fields.tokenId
    this.vrf = fields.vrf
    this.userAuthority = fields.userAuthority
  }

  static async fetch(
    c: Connection,
    address: PublicKey
  ): Promise<OpenRequest | null> {
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
  ): Promise<Array<OpenRequest | null>> {
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

  static decode(data: Buffer): OpenRequest {
    if (!data.slice(0, 8).equals(OpenRequest.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = OpenRequest.layout.decode(data.slice(8))

    return new OpenRequest({
      boxId: dec.boxId,
      bump: dec.bump,
      resultBuffer: dec.resultBuffer,
      tokenId: dec.tokenId,
      vrf: dec.vrf,
      userAuthority: dec.userAuthority,
    })
  }

  toJSON(): OpenRequestJSON {
    return {
      boxId: this.boxId,
      bump: this.bump,
      resultBuffer: this.resultBuffer,
      tokenId: this.tokenId,
      vrf: this.vrf.toString(),
      userAuthority: this.userAuthority.toString(),
    }
  }

  static fromJSON(obj: OpenRequestJSON): OpenRequest {
    return new OpenRequest({
      boxId: obj.boxId,
      bump: obj.bump,
      resultBuffer: obj.resultBuffer,
      tokenId: obj.tokenId,
      vrf: new PublicKey(obj.vrf),
      userAuthority: new PublicKey(obj.userAuthority),
    })
  }
}
