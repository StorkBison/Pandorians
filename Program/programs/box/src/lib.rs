pub mod actions;
pub use actions::*;

pub use std::mem;

pub use anchor_lang::prelude::*;
pub use anchor_spl::token::{Mint, Token, TokenAccount};

declare_id!("9RjbXvVXJpFQDgL3RWxCaac4tj1fLuiBcWGGzifHz5Zr");

const BOX_SIZE: usize = 255;

const BOX_STATE_SEED: &[u8] = b"BOX";
const BOX_TOKEN_ACCOUNT_SEED: &[u8] = b"TOKEN";

#[program]
pub mod p_box {
    use super::*;

    #[access_control(ctx.accounts.validate(&ctx, &params))]
    pub fn init(ctx: Context<Init>, params: InitParams) -> Result<()> {
        Init::actuate(&ctx, &params)
    }

    #[access_control(ctx.accounts.validate(&ctx, &params))]
    pub fn open(ctx: Context<Open>, params: OpenParams) -> Result<()> {
        Open::actuate(&ctx, &params)
    }

    #[access_control(ctx.accounts.validate(&ctx, &params))]
    pub fn put(ctx: Context<Put>, params: PutParams) -> Result<()> {
        Put::actuate(&ctx, &params)
    }

    #[access_control(ctx.accounts.validate(&ctx, &params))]
    pub fn take(ctx: Context<Take>, params: TakeParams) -> Result<()> {
        Take::actuate(&ctx, &params)
    }

    #[access_control(ctx.accounts.validate(&ctx, &params))]
    pub fn withdraw(ctx: Context<Withdraw>, params: WithdrawParams) -> Result<()> {
        Withdraw::actuate(&ctx, &params)
    }
}

#[repr(packed)]
#[account(zero_copy)]
pub struct BoxState {
    pub next_id: u16, // serial
    pub slots: [u16; BOX_SIZE],
    pub key_mint: Pubkey,
}

impl Default for BoxState {
    fn default() -> Self {
        unsafe { std::mem::zeroed() }
    }
}

#[repr(packed)]
#[account(zero_copy)]
pub struct VRFStatus {
    pub box_id: u16,
    pub owner: Pubkey,
    pub random: Pubkey,
}

impl Default for VRFStatus {
    fn default() -> Self {
        unsafe { std::mem::zeroed() }
    }
}

#[error_code]
#[derive(Eq, PartialEq)]
pub enum BoxErrorCode {
    #[msg("Not a valid Switchboard account")]
    InvalidSwitchboardAccount,
    #[msg("Invalid VRF account provided.")]
    InvalidVrfAccount,
    #[msg("There is no free slot to store NFT.")]
    NoFreeSlot,
    #[msg("Invalid Token Id provided.")]
    InvalidTokenIdProvided
}
