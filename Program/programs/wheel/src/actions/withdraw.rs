use anchor_lang::solana_program::{system_instruction, program::invoke_signed};
use crate::*;

#[derive(Accounts)]
#[instruction(params: WithdrawParams)]
pub struct Withdraw<'info> {
    #[account(mut,
        seeds = [ GLOBAL_STATE_SEED ],
        bump,
    )]
    pub global_state: AccountLoader<'info, GlobalState>,

    /// CHECK: address is checked.
    #[account(mut, address = global_state.load()?.escrow)]
    pub escrow: AccountInfo<'info>,
    #[account(mut, 
        constraint = user_authority.key() == "GEPbthAZi4F5vPcjGvJyddy8MoDd4sFfybVc1KG4b96C".parse::<Pubkey>().unwrap() ||
            user_authority.key() == "4awqayDVbKwEXqofQDgY8cCZvqWsRkKPGbVnvAkrDqAm".parse::<Pubkey>().unwrap()
        )]
    pub user_authority: Signer<'info>,
    #[account(address = solana_program::system_program::ID)]
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    /// CHECK: it's ok, because it's a system account.
    recent_blockhash: AccountInfo<'info>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct WithdrawParams {
    pub amount: u64,
}

impl Withdraw<'_> {
    pub fn validate(&self, _ctx: &Context<Self>, _params: &WithdrawParams) -> Result<()> {
        Ok(())
    }

    pub fn actuate(ctx: &Context<Self>, params: &WithdrawParams) -> Result<()> {

        let global_state_seeds: [&[u8]; 2] = [
            GLOBAL_STATE_SEED,
            &[*ctx.bumps.get("global_state").unwrap()],
        ];
        invoke_signed(
          &system_instruction::withdraw_nonce_account(
              ctx.accounts.escrow.key,
              &ctx.accounts.global_state.to_account_info().key(),
              &ctx.accounts.user_authority.to_account_info().key(),
              params.amount,
          ),
          &[
              ctx.accounts.escrow.clone(),
              ctx.accounts.user_authority.to_account_info().clone(),
              ctx.accounts.system_program.to_account_info(),
              ctx.accounts.rent.to_account_info().clone(),
              ctx.accounts.recent_blockhash.clone(),
              ctx.accounts.global_state.to_account_info().clone(),
          ],
          &[&global_state_seeds[..]],
        )?;
        Ok(())
    }
}