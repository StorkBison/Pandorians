// use mpl_token_metadata::state::{Metadata, TokenMetadataAccount};
use anchor_lang::solana_program::system_instruction;
use anchor_lang::solana_program::program::{  invoke };
use crate::*;

#[derive(Accounts)]
#[instruction(params: InitParams)]
pub struct Init<'info> {
    #[account(
        init,
        seeds = [ STAKING_STATE_SEED, &params.staking_id.to_be_bytes() ],
        payer = payer,
        space = 8 + mem::size_of::<StakingState>(),
        bump,
    )]
    pub staking_state: AccountLoader<'info, StakingState>,

    /// CHECK: it's ok, because will be initialized inside.
    #[account(mut)]
    pub escrow: AccountInfo<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(address = solana_program::system_program::ID)]
    pub system_program: Program<'info, System>,

    pub rent: Sysvar<'info, Rent>,
    /// CHECK: it's ok, because it's a system account.
    recent_blockhash: AccountInfo<'info>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct InitParams {
    pub staking_id: u16,
}

impl Init<'_> {
    pub fn validate(&self, _ctx: &Context<Self>, _params: &InitParams) -> Result<()> {
        Ok(())
    }

    pub fn actuate(ctx: &Context<Self>, params: &InitParams) -> Result<()> {
        let mut staking_state = ctx.accounts.staking_state.load_init()?;

        let vec_instructions = system_instruction::create_nonce_account(
            &ctx.accounts.payer.to_account_info().key(),
            &ctx.accounts.escrow.key(),
            &ctx.accounts.staking_state.to_account_info().key(),
            100_000_000
        );

        for instruction in vec_instructions {
            invoke(
                &instruction, 
                &[
                    ctx.accounts.payer.to_account_info().clone(),
                    ctx.accounts.escrow.clone(),
                    ctx.accounts.system_program.to_account_info(),
                    ctx.accounts.rent.to_account_info().clone(),
                    ctx.accounts.recent_blockhash.clone()
                ]
            )?;
        }
        *staking_state = StakingState::default();
        staking_state.escrow = *ctx.accounts.escrow.key;
        Ok(())
    }
}
