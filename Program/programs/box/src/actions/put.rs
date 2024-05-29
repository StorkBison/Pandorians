use anchor_lang::system_program::{create_account, CreateAccount};
use anchor_spl::token::{
    initialize_account3, InitializeAccount3
};
use mpl_token_metadata::{
    instruction::{TransferArgs, builders, InstructionBuilder},
};
use solana_program::program::invoke;

use crate::*;

#[derive(Accounts)]
#[instruction(params: PutParams)]
pub struct Put<'info> {
    #[account(mut,
        seeds = [ BOX_STATE_SEED, &params.box_id.to_be_bytes() ],
        bump
    )]
    pub box_state: AccountLoader<'info, BoxState>,

    /// CHECK: it's ok, because will be initialized inside.
    #[account(mut,
        seeds = [ BOX_TOKEN_ACCOUNT_SEED, &params.box_id.to_be_bytes(), &box_state.load()?.next_id.to_be_bytes() ],
        bump
    )]
    pub box_token_account: UncheckedAccount<'info>,

    #[account(mut)]
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
pub struct PutParams {
    pub box_id: u16,
}

impl Put<'_> {
    pub fn validate(&self, _ctx: &Context<Self>, _params: &PutParams) -> Result<()> {
        Ok(())
    }

    pub fn actuate(ctx: &Context<Self>, params: &PutParams) -> Result<()> {
        let box_token_account_seeds = [
            BOX_TOKEN_ACCOUNT_SEED,
            &params.box_id.to_be_bytes(),
            &ctx.accounts.box_state.load()?.next_id.to_be_bytes() as &[u8],
            &[*ctx.bumps.get("box_token_account").unwrap()],
        ];

        // Transfer NFT to box token account

        create_account(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                CreateAccount {
                    from: ctx.accounts.user_authority.to_account_info(),
                    to: ctx.accounts.box_token_account.to_account_info(),
                },
                &[&box_token_account_seeds[..]],
            ),
            ctx.accounts.rent.minimum_balance(TokenAccount::LEN),
            TokenAccount::LEN as u64,
            &ctx.accounts.token_program.key(),
        )?;

        initialize_account3(CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            InitializeAccount3 {
                account: ctx.accounts.box_token_account.to_account_info(),
                mint: ctx.accounts.token_mint_info.to_account_info(),
                authority: ctx.accounts.box_state.to_account_info()
            },
            &[&box_token_account_seeds[..]],
        ))?;

        let mut transfer_ix = builders::TransferBuilder::new();

        transfer_ix
            .token(*ctx.accounts.token_info.to_account_info().key)
            .token_owner(*ctx.accounts.user_authority.to_account_info().key)
            .destination(*ctx.accounts.box_token_account.to_account_info().key)
            .destination_owner(*ctx.accounts.box_state.to_account_info().key)
            .mint(*ctx.accounts.token_mint_info.to_account_info().key)
            .metadata(*ctx.accounts.metadata_info.to_account_info().key)
            .edition(*ctx.accounts.edition.to_account_info().key)
            .owner_token_record(*ctx.accounts.owner_token_record.to_account_info().key)
            .destination_token_record(*ctx.accounts.destination_token_record.to_account_info().key)
            .authority(*ctx.accounts.user_authority.to_account_info().key)
            .payer(*ctx.accounts.user_authority.to_account_info().key)
            .system_program(*ctx.accounts.system_program.to_account_info().key)
            .sysvar_instructions(*ctx.accounts.sysvar_instructions.to_account_info().key)
            .spl_token_program(*ctx.accounts.token_program.to_account_info().key)
            .spl_ata_program(*ctx.accounts.spl_ata_program.to_account_info().key)
            .authorization_rules_program(*ctx.accounts.authorization_rules_program.to_account_info().key)
            .authorization_rules(*ctx.accounts.authorization_rules.to_account_info().key);

        invoke(&transfer_ix
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
            ])?;
        
        // Finds a free slot for NFT
        let mut box_state = ctx.accounts.box_state.load_mut()?;

        for i in 1..BOX_SIZE {
            if box_state.slots[i] == 0 {
                box_state.slots[i] = box_state.next_id;
                break;
            }

            if i == BOX_SIZE - 1 {
                return Err(BoxErrorCode::NoFreeSlot.into());
            }
        }

        box_state.next_id += 1;
        Ok(())
    }
}
