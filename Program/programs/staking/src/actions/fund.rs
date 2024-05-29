use anchor_lang::system_program::{transfer, Transfer};
use anchor_spl::token::{sync_native, SyncNative};

use crate::*;

#[derive(Accounts)]
#[instruction(params: FundParams)]
pub struct Fund<'info> {
    #[account(mut,
        seeds = [ STAKING_STATE_SEED, &params.staking_id.to_be_bytes() ],
        bump,
    )]
    pub staking_state: AccountLoader<'info, StakingState>,

    #[account(mut,
        seeds = [ STAKING_WALLET_SEED, &params.staking_id.to_be_bytes() ],
        bump
    )]
    pub staking_wallet: Account<'info, TokenAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(address = solana_program::system_program::ID)]
    pub system_program: Program<'info, System>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct FundParams {
    pub amount: u64,
    pub staking_id: u16,
}

impl Fund<'_> {
    pub fn validate(&self, _ctx: &Context<Self>, _params: &FundParams) -> Result<()> {
        Ok(())
    }

    pub fn actuate(ctx: &Context<Self>, params: &FundParams) -> Result<()> {
        let mut staking_state = ctx.accounts.staking_state.load_mut()?;

        // calculate how much left to collect
        let left_toxins = staking_state.capacity() - staking_state.funded;
        let left_lamports = left_toxins * LAMPORTS_PER_TXN;
        msg!("Left: {} $TXN ({} lamports)", left_toxins, left_lamports);

        // calculate fund fee
        let fund_lamports =
            left_lamports.min(params.amount * staking_state.fund_fee_basis_points as u64 / 10000);
        msg!("Fund fee lamports: {}", fund_lamports);

        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.payer.to_account_info(),
                    to: ctx.accounts.staking_wallet.to_account_info(),
                },
            ),
            fund_lamports,
        )?;

        sync_native(CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            SyncNative {
                account: ctx.accounts.staking_wallet.to_account_info(),
            },
        ))?;

        // Update funded value
        staking_state.funded = staking_state.funded + fund_lamports / LAMPORTS_PER_TXN;
        msg!(
            "Funded: {} $TXN ({} lamports)",
            staking_state.funded / 1,
            staking_state.funded * LAMPORTS_PER_TXN
        );

        Ok(())
    }
}
