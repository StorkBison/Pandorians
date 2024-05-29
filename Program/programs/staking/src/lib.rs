pub mod actions;
pub use actions::*;

pub use std::mem;

pub use anchor_lang::prelude::*;
pub use anchor_spl::token::{Mint, Token, TokenAccount};

// exchange rate for $TXN
pub const LAMPORTS_PER_TXN: u64 = 666;

pub const STAKING_STATE_SEED: &[u8] = b"STAKING";
pub const STAKING_WALLET_SEED: &[u8] = b"WALLET";

// declare_id!("3wqC2rrgQLLR5RhfPHukQYhuASp5Pvrd39WRjUV9kACD");
declare_id!("3mfvmbDyHsPWvsH41EQ4EzjDGDAnNDdbYXLFGP5YsqoG");

#[program]
pub mod staking {
    use super::*;

    #[access_control(ctx.accounts.validate(&ctx, &params))]
    pub fn config(ctx: Context<Config>, params: ConfigParams) -> Result<()> {
        Config::actuate(&ctx, &params)
    }

    #[access_control(ctx.accounts.validate(&ctx, &params))]
    pub fn fund(ctx: Context<Fund>, params: FundParams) -> Result<()> {
        Fund::actuate(&ctx, &params)
    }

    #[access_control(ctx.accounts.validate(&ctx, &params))]
    pub fn init(ctx: Context<Init>, params: InitParams) -> Result<()> {
        Init::actuate(&ctx, &params)
    }

    #[access_control(ctx.accounts.validate(&ctx, &params))]
    pub fn stake(ctx: Context<Stake>, params: StakeParams) -> Result<()> {
        Stake::actuate(&ctx, &params)
    }

    #[access_control(ctx.accounts.validate(&ctx, &params))]
    pub fn claim(ctx: Context<Claim>, params: ClaimParams) -> Result<()> {
        Claim::actuate(&ctx, &params)
    }

    #[access_control(ctx.accounts.validate(&ctx, &params))]
    pub fn unstake(ctx: Context<Unstake>, params: UnstakeParams) -> Result<()> {
        Unstake::actuate(&ctx, &params)
    }
}

#[repr(packed)]
#[account(zero_copy)]
pub struct StakingState {
    pub configs: [RarityConfig; 5],
    pub fund_fee_basis_points: u32,
    pub funded: u64,
    pub escrow: Pubkey,
}

impl Default for StakingState {
    fn default() -> Self {
        unsafe { std::mem::zeroed() }
    }
}

impl StakingState {
    pub fn capacity(&self) -> u64 {
        self.configs
            .iter()
            .map(|x| x.capacity as u64 * x.supply as u64)
            .sum::<_>()
    }
}

#[repr(packed)]
#[zero_copy]
pub struct RarityConfig {
    pub capacity: u32,
    pub speed: u32,
    pub supply: u32,
}

impl Default for RarityConfig {
    fn default() -> Self {
        unsafe { std::mem::zeroed() }
    }
}

#[repr(packed)]
#[account(zero_copy)]
pub struct TokenState {
    pub authority: Pubkey,
    pub staked_at: i64,
    pub rarity: u8,
}

impl Default for TokenState {
    fn default() -> Self {
        unsafe { std::mem::zeroed() }
    }
}

#[error_code]
#[derive(Eq, PartialEq)]
pub enum StakingErrorCode {
    #[msg("Not a valid authority")]
    InvalidAuthority,
}
