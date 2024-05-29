use anchor_spl::token::{burn, Burn};
use orao_solana_vrf::{
    program::{ OraoVrf },
    state::{NetworkState},
    CONFIG_ACCOUNT_SEED,
    RANDOMNESS_ACCOUNT_SEED,
};

use crate::*;

#[derive(Accounts)]
#[instruction(params: OpenParams)]
pub struct Open<'info> {
    #[account(mut,
        seeds = [ BOX_STATE_SEED, &params.box_id.to_be_bytes() ],
        bump
    )]
    pub box_state: AccountLoader<'info, BoxState>,
    #[account(init,
        payer = user_authority,
        space = 8 + mem::size_of::<VRFStatus>(),
    )]
    pub vrf_status: AccountLoader<'info, VRFStatus>,

    #[account(mut, address = box_state.load()?.key_mint )]
    pub key_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub user_authority: Signer<'info>,

    #[account(mut)]
    pub user_key_account: Account<'info, TokenAccount>,

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
    pub system_program: Program<'info, System>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct OpenParams {
    pub box_id: u16,
    pub force: [u8; 32],
}

impl Open<'_> {
    pub fn validate(&self, _ctx: &Context<Self>, _params: &OpenParams) -> Result<()> {
        Ok(())
    }

    pub fn actuate(ctx: &Context<Self>, params: &OpenParams) -> Result<()> {
        let cpi_program = ctx.accounts.vrf.to_account_info();
        let cpi_accounts = orao_solana_vrf::cpi::accounts::Request {
            payer: ctx.accounts.user_authority.to_account_info(),
            network_state: ctx.accounts.config.to_account_info(),
            treasury: ctx.accounts.treasury.to_account_info(),
            request: ctx.accounts.random.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        };
        let cpi_ctx = anchor_lang::context::CpiContext::new(cpi_program, cpi_accounts);
        orao_solana_vrf::cpi::request(cpi_ctx, params.force)?;
        // and burn 1 key

        let mut vrf_status = ctx.accounts.vrf_status.load_init()?;
        vrf_status.box_id = params.box_id;
        vrf_status.owner = *ctx.accounts.user_authority.key;
        vrf_status.random = *ctx.accounts.random.key;

        burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.key_mint.to_account_info(),
                    from: ctx.accounts.user_key_account.to_account_info(),
                    authority: ctx.accounts.user_authority.to_account_info(),
                },
            ),
            1,
        )?;

        msg!("randomness requested successfully");
        Ok(())
    }
}
