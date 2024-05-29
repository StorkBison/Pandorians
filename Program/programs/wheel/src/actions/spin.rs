use anchor_spl::token::{burn, Burn};
use orao_solana_vrf::{
    program::OraoVrf,
    state::NetworkState,
    CONFIG_ACCOUNT_SEED,
    RANDOMNESS_ACCOUNT_SEED,
};

use crate::*;

#[derive(Accounts)]
#[instruction(params: SpinParams)]
pub struct Spin<'info> {
    #[account(mut,
        seeds = [ WHEEL_STATE_SEED, &params.wheel_id.to_be_bytes() ],
        bump
    )]
    pub wheel_state: AccountLoader<'info, WheelState>,

    #[account(init,
        payer = payer,
        space = 8 + mem::size_of::<VRFStatus>(),
    )]
    pub vrf_status: AccountLoader<'info, VRFStatus>,

    #[account(mut, constraint=wheel_state.load()?.ticket_mint == ticket_mint.key(),)]
    pub ticket_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub user_ticket_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK:
    #[account(
        mut,
        seeds = [RANDOMNESS_ACCOUNT_SEED.as_ref(), params.force.as_ref()],
        bump,
        seeds::program = orao_solana_vrf::ID
    )]
    random: AccountInfo<'info>,
    /// CHECK:
    #[account(mut)]
    treasury: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [CONFIG_ACCOUNT_SEED.as_ref()],
        bump,
        seeds::program = orao_solana_vrf::ID
    )]
    config: Account<'info, NetworkState>,
    vrf: Program<'info, OraoVrf>,
    #[account(address = solana_program::system_program::ID)]
    system_program: Program<'info, System>,
    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct SpinParams {
    pub force: [u8; 32],
    pub wheel_id: u16,
}

impl Spin<'_> {
    pub fn validate(&self, _ctx: &Context<Self>, _params: &SpinParams) -> Result<()> {
        Ok(())
    }

    pub fn actuate(ctx: &Context<Self>, params: &SpinParams) -> Result<()> {       
        let cpi_program = ctx.accounts.vrf.to_account_info();
        let cpi_accounts = orao_solana_vrf::cpi::accounts::Request {
            payer: ctx.accounts.payer.to_account_info(),
            network_state: ctx.accounts.config.to_account_info(),
            treasury: ctx.accounts.treasury.to_account_info(),
            request: ctx.accounts.random.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        };
        let cpi_ctx = anchor_lang::context::CpiContext::new(cpi_program, cpi_accounts);
        orao_solana_vrf::cpi::request(cpi_ctx, params.force)?;
        msg!("request cpi done");

        let mut vrf_status = ctx.accounts.vrf_status.load_init()?;
        vrf_status.wheel_id = params.wheel_id;
        vrf_status.reward = 0u64;
        vrf_status.owner = *ctx.accounts.payer.key;
        vrf_status.random = *ctx.accounts.random.key;
        
        // and burn 1 ticket
        burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.ticket_mint.to_account_info(),
                    from: ctx.accounts.user_ticket_account.to_account_info(),
                    authority: ctx.accounts.payer.to_account_info(),
                },
            ),
            1,
        )?;

        msg!("randomness requested successfully");
        Ok(())
    }
}
