pub mod actions;
pub use actions::*;

pub use std::mem;

pub use anchor_lang::prelude::*;
pub use anchor_spl::token::{Mint, Token, TokenAccount};

const WHEEL_STATE_SEED: &[u8] = b"STATE";
const GLOBAL_STATE_SEED: &[u8] = b"GLOBAL";

declare_id!("Fky46ut985HRdKzbfByrdQwvNGT6Ef4HpqddTTabdLnU");

#[program]
pub mod wheel {
    use super::*;

    pub fn global_init(ctx: Context<GlobalInit>) -> Result<()> {
        GlobalInit::actuate(&ctx)
    }

    #[access_control(ctx.accounts.validate(&ctx, &params))]
    pub fn withdraw(ctx: Context<Withdraw>, params: WithdrawParams) -> Result<()> {
        Withdraw::actuate(&ctx, &params)
    }

    #[access_control(ctx.accounts.validate(&ctx, &params))]
    pub fn init(ctx: Context<Init>, params: InitParams) -> Result<()> {
        Init::actuate(&ctx, &params)
    }

    #[access_control(ctx.accounts.validate(&ctx, &params))]
    pub fn mint(ctx: Context<MintTicket>, params: MintTicketParams) -> Result<()> {
        MintTicket::actuate(&ctx, &params)
    }

    #[access_control(ctx.accounts.validate(&ctx, &params))]
    pub fn spin(ctx: Context<Spin>, params: SpinParams) -> Result<()> {
        Spin::actuate(&ctx, &params)
    }

    #[access_control(ctx.accounts.validate(&ctx, &params))]
    pub fn sol_spin(ctx: Context<SolSpin>, params: SolSpinParams) -> Result<()> {
        SolSpin::actuate(&ctx, &params)
    }


    #[access_control(ctx.accounts.validate(&ctx, &params))]
    pub fn take(ctx: Context<Take>, params: TakeParams) -> Result<()> {
        Take::actuate(&ctx, &params)
    }

    #[access_control(ctx.accounts.validate(&ctx, &params))]
    pub fn sol_take(ctx: Context<SolTake>, params: SolTakeParams) -> Result<()> {
        SolTake::actuate(&ctx, &params)
    }

    #[access_control(ctx.accounts.validate(&ctx, &params))]
    pub fn close_vrf(ctx: Context<CloseVRF>, params: CloseVRFParams) -> Result<()> {
        CloseVRF::actuate(&ctx, &params)
    }
}

#[repr(packed)]
#[account(zero_copy)]
pub struct GlobalState {
    pub escrow: Pubkey,
    pub owner: Pubkey
}

impl Default for GlobalState {
    fn default() -> Self {
        unsafe { std::mem::zeroed() }
    }
}

#[repr(packed)]
#[account(zero_copy)]
pub struct WheelState {
    pub escrow: Pubkey,
    pub ticket_mint: Pubkey,
    pub mintable: bool,
    pub price: u64,
    pub prizes: [Prize; 6],
}

impl Default for WheelState {
    fn default() -> Self {
        unsafe { std::mem::zeroed() }
    }
}

impl WheelState {
    pub fn total_prize_cost(&self) -> u64 {
        self.prizes
            .iter()
            .map(|x| x.cost as f32 * x.probability)
            .sum::<f32>() as u64
    }
}

#[repr(packed)]
#[zero_copy]
pub struct Prize {
    pub amount: u64,
    pub cost: u64,
    pub escrow: Option<Pubkey>,
    pub probability: f32,
    pub token: Pubkey,
}

impl Default for Prize {
    fn default() -> Self {
        unsafe { std::mem::zeroed() }
    }
}

#[repr(packed)]
#[account(zero_copy)]
pub struct SpinRequest {
    pub wheel_id: u16,
    pub bump: u8,
    pub result_buffer: [u8; 32],
    pub result: u32,
    pub prize: Option<u8>,
    pub vrf: Pubkey,
    pub user_authority: Pubkey,
}

impl Default for SpinRequest {
    fn default() -> Self {
        unsafe { std::mem::zeroed() }
    }
}

#[repr(packed)]
#[account(zero_copy)]
pub struct VRFStatus {
    pub wheel_id: u16,
    pub reward: u64,
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
pub enum WheelErrorCode {
    #[msg("Not a valid Switchboard account")]
    InvalidSwitchboardAccount,
    #[msg("Invalid VRF account provided.")]
    InvalidVrfAccount,
    #[msg("Bad arguments.")]
    InvalidArguments,
}
