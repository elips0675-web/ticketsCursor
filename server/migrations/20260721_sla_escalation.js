export const up = async (knex) => {
  await knex.schema.alterTable('tickets', (table) => {
    table.timestamp('escalated_at').nullable()
    table.integer('escalation_level').defaultTo(0)
  })
}

export const down = async (knex) => {
  await knex.schema.alterTable('tickets', (table) => {
    table.dropColumn('escalated_at')
    table.dropColumn('escalation_level')
  })
}
