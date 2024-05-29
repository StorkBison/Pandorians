use anchor_spl::token::{transfer, Transfer};
use anchor_lang::solana_program::{system_instruction, program::{invoke_signed}};

use crate::*;

#[derive(Accounts)]
#[instruction(params: ClaimParams)]
pub struct Claim<'info> {
    #[account(mut,
        seeds = [ STAKING_STATE_SEED, &params.staking_id.to_be_bytes() ],
        bump,
    )]
    pub staking_state: AccountLoader<'info, StakingState>,

    #[account()]
    pub token: Account<'info, Mint>,

    #[account(mut,
        seeds = [ &token.key().to_bytes()[..], &params.staking_id.to_be_bytes() ],
        bump,
    )]
    pub token_state: AccountLoader<'info, TokenState>,

    
    /// CHECK: address is checked.
    #[account(mut, address = staking_state.load()?.escrow)]
    pub escrow: AccountInfo<'info>,

    #[account(mut)]
    pub user_authority: Signer<'info>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>,
    
    #[account(address = solana_program::system_program::ID)]
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    /// CHECK: it's ok, because it's a system account.
    recent_blockhash: AccountInfo<'info>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ClaimParams {
    pub staking_id: u16,
}

impl Claim<'_> {
    pub fn validate(&self, ctx: &Context<Self>, _params: &ClaimParams) -> Result<()> {
        let token_state = ctx.accounts.token_state.load()?;
        if token_state.authority != ctx.accounts.user_authority.key() {
            return Err(StakingErrorCode::InvalidAuthority.into());
        }

        Ok(())
    }

    pub fn actuate(ctx: &Context<Self>, params: &ClaimParams) -> Result<()> {
        let staking_state_seeds = [
            STAKING_STATE_SEED,
            &params.staking_id.to_be_bytes()[..],
            &[*ctx.bumps.get("staking_state").unwrap()],
        ];

        let mut token_state = ctx.accounts.token_state.load_mut()?;
        let clock = Clock::get().unwrap();

        let reward_amount = ((clock.unix_timestamp - token_state.staked_at) as u64 * (token_state.rarity as u64)) * 1_000_000_000 / LAMPORTS_PER_TXN / 3600;

        invoke_signed(
            &system_instruction::withdraw_nonce_account(
                ctx.accounts.escrow.key,
                &ctx.accounts.staking_state.to_account_info().key(),
                &ctx.accounts.user_authority.to_account_info().key(),
                reward_amount,
            ),
            &[
                ctx.accounts.escrow.clone(),
                ctx.accounts.user_authority.to_account_info().clone(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.rent.to_account_info().clone(),
                ctx.accounts.recent_blockhash.clone(),
                ctx.accounts.staking_state.to_account_info().clone(),
            ],
            &[&staking_state_seeds[..]],
        )?;

        msg!(
            "Transferred:({} lamports)",
            reward_amount
        );

        token_state.staked_at = clock.unix_timestamp;
        Ok(())
    }
}
