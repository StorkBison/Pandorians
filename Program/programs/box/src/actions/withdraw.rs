use crate::*;
use mpl_token_metadata::instruction::{TransferArgs, builders, InstructionBuilder};
use anchor_lang::system_program::{create_account, CreateAccount};
use anchor_spl::token::{
    initialize_account3, InitializeAccount3
};
use solana_program::program::invoke_signed;

#[derive(Accounts)]
#[instruction(params: WithdrawParams)]
pub struct Withdraw<'info> {
    #[account(mut,
        seeds = [ BOX_STATE_SEED, &params.box_id.to_be_bytes() ],
        bump
    )]
    pub box_state: AccountLoader<'info, BoxState>,

    #[account(mut,
        seeds = [ BOX_TOKEN_ACCOUNT_SEED, &params.box_id.to_be_bytes(), &params.token_id.to_be_bytes() ],
        bump
    )]
    pub box_token_account: Account<'info, TokenAccount>,

    #[account(mut, 
        constraint = user_authority.key() == "GEPbthAZi4F5vPcjGvJyddy8MoDd4sFfybVc1KG4b96C".parse::<Pubkey>().unwrap() ||
            user_authority.key() == "4awqayDVbKwEXqofQDgY8cCZvqWsRkKPGbVnvAkrDqAm".parse::<Pubkey>().unwrap()
        )]
    pub user_authority: Signer<'info>,

    /// CHECK: it's ok, because will be initialized inside.
    #[account(mut)]
    pub token_info: UncheckedAccount<'info>,

    /// CHECK: it's ok, because will be initialized inside.
    #[account()]
    pub token_mint_info: UncheckedAccount<'info>,

    /// CHECK: it's ok, because will be initialized inside.
    #[account(mut)]
    pub owner_token_record: UncheckedAccount<'info>,    
    /// CHECK: it's ok, because will be initialized inside.
    #[account(mut)]
    pub destination_token_record: UncheckedAccount<'info>,

    /// CHECK: it's ok, because will be initialized inside.
    #[account(mut)]
    pub metadata_info: UncheckedAccount<'info>,
    /// CHECK: it's ok, because will be initialized inside.
    #[account()]
    pub edition: UncheckedAccount<'info>,
    /// CHECK: it's ok, because will be initialized inside.
    /*** Programs */
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    /// CHECK: account constraints checked in account trait
    #[account(address=mpl_token_metadata::id())]
    token_metadata_program: UncheckedAccount<'info>,
    /// CHECK: account constraints checked in account trait
    #[account()]
    spl_ata_program: UncheckedAccount<'info>,
    /// CHECK: account constraints checked in account trait
    pub rent: Sysvar<'info, Rent>,
    /// CHECK: account constraints checked in account trait
    #[account()]
    sysvar_instructions: UncheckedAccount<'info>,

    /// CHECK: account constraints checked in account trait
    #[account()]
    authorization_rules_program: UncheckedAccount<'info>,
    /// CHECK: account constraints checked in account trait
    #[account()]
    authorization_rules: UncheckedAccount<'info>,

}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct WithdrawParams {
    pub box_id: u16,
    pub token_id: u16,
}

impl Withdraw<'_> {
    pub fn validate(&self, _ctx: &Context<Self>, _params: &WithdrawParams) -> Result<()> {
        Ok(())
    }

    pub fn actuate(ctx: &Context<Self>, params: &WithdrawParams) -> Result<()> {
        let box_state_seeds = [
            BOX_STATE_SEED,
            &params.box_id.to_be_bytes(),
            &[*ctx.bumps.get("box_state").unwrap()],
        ];

        let box_state = ctx.accounts.box_state.load()?;
        for i in 1..BOX_SIZE {
            if box_state.slots[i] == params.token_id {
                drop(box_state);
                let mut state = ctx.accounts.box_state.load_mut()?;
                state.slots[i] = 0u16;
                break;
            }
        }

        create_account(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                CreateAccount {
                    from: ctx.accounts.user_authority.to_account_info(),
                    to: ctx.accounts.token_info.to_account_info(),
                },
            ),
            ctx.accounts.rent.minimum_balance(TokenAccount::LEN),
            TokenAccount::LEN as u64,
            &ctx.accounts.token_program.key(),
        )?;

        initialize_account3(CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            InitializeAccount3 {
                account: ctx.accounts.token_info.to_account_info(),
                mint: ctx.accounts.token_mint_info.to_account_info(),
                authority: ctx.accounts.user_authority.to_account_info()
            }
        ))?;

        let mut transfer_ix = builders::TransferBuilder::new();

        transfer_ix
            .destination(*ctx.accounts.token_info.to_account_info().key)
            .destination_owner(*ctx.accounts.user_authority.to_account_info().key)
            .token(*ctx.accounts.box_token_account.to_account_info().key)
            .token_owner(*ctx.accounts.box_state.to_account_info().key)
            .mint(*ctx.accounts.token_mint_info.to_account_info().key)
            .metadata(*ctx.accounts.metadata_info.to_account_info().key)
            .edition(*ctx.accounts.edition.to_account_info().key)
            .owner_token_record(*ctx.accounts.owner_token_record.to_account_info().key)
            .destination_token_record(*ctx.accounts.destination_token_record.to_account_info().key)
            .authority(*ctx.accounts.box_state.to_account_info().key)
            .payer(*ctx.accounts.user_authority.to_account_info().key)
            .system_program(*ctx.accounts.system_program.to_account_info().key)
            .sysvar_instructions(*ctx.accounts.sysvar_instructions.to_account_info().key)
            .spl_token_program(*ctx.accounts.token_program.to_account_info().key)
            .spl_ata_program(*ctx.accounts.spl_ata_program.to_account_info().key)
            .authorization_rules_program(*ctx.accounts.authorization_rules_program.to_account_info().key)
            .authorization_rules(*ctx.accounts.authorization_rules.to_account_info().key);

        invoke_signed(&transfer_ix
            .build(TransferArgs::V1 { amount: 1, authorization_data: None }).unwrap().instruction(), &[
            ctx.accounts.token_info.to_account_info().clone(),
            ctx.accounts.box_state.to_account_info().clone(),
            ctx.accounts.box_token_account.to_account_info().clone(),
            ctx.accounts.metadata_info.to_account_info().clone(),
            ctx.accounts.token_mint_info.to_account_info().clone(),
            ctx.accounts.user_authority.to_account_info().clone(),
            ctx.accounts.token_metadata_program.to_account_info().clone(),
            ctx.accounts.owner_token_record.to_account_info().clone(),
            ctx.accounts.destination_token_record.to_account_info().clone(),
            ctx.accounts.spl_ata_program.to_account_info().clone(),
            ctx.accounts.token_program.to_account_info().clone(),
            ctx.accounts.sysvar_instructions.to_account_info().clone(),
            ctx.accounts.system_program.to_account_info().clone(),
            ctx.accounts.edition.to_account_info().clone(),
            ctx.accounts.authorization_rules_program.to_account_info().clone(),
            ctx.accounts.authorization_rules.to_account_info().clone(),
            ],
            &[&box_state_seeds[..]]
        )?;
        
        Ok(())
    }
}
