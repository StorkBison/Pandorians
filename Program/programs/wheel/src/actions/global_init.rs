use anchor_lang::solana_program::system_instruction;
use anchor_lang::solana_program::program::invoke;
use crate::*;

#[derive(Accounts)]
#[instruction()]
pub struct GlobalInit<'info> {
    #[account(
        init,
        seeds = [ GLOBAL_STATE_SEED],
        payer = payer,
        space = 8 + mem::size_of::<GlobalState>(),
        bump,
    )]
    pub global_state: AccountLoader<'info, GlobalState>,

    /// CHECK: it's ok, because will be initialized inside. global_seed
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

impl GlobalInit<'_> {
    pub fn validate(&self, _ctx: &Context<Self>) -> Result<()> {
			Ok(())
    }

    pub fn actuate(ctx: &Context<Self>) -> Result<()> {
        // Initialize Vault for Wheels
        let vec_instructions = system_instruction::create_nonce_account(
            &ctx.accounts.payer.to_account_info().key(),
            &ctx.accounts.escrow.key(),
            &ctx.accounts.global_state.to_account_info().key(),
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

        // Initialize Wheel State
        let mut global_state = ctx.accounts.global_state.load_init()?;
        *global_state = GlobalState::default();

        global_state.escrow = *ctx.accounts.escrow.key;
        global_state.owner = *ctx.accounts.payer.key;

        Ok(())
    }
}
