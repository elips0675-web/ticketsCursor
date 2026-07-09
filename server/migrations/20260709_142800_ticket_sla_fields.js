export function up(knex) {
  return knex.schema.alterTable('tickets', (t) => {
    t.timestamp('due_at').nullable()
    t.timestamp('first_response_at').nullable()
    t.timestamp('resolved_at').nullable()
    t.index(['status', 'due_at'], 'idx_tickets_status_due_at')
  })
}

export function down(knex) {
  return knex.schema.alterTable('tickets', (t) => {
    t.dropIndex(['status', 'due_at'], 'idx_tickets_status_due_at')
    t.dropColumn('resolved_at')
    t.dropColumn('first_response_at')
    t.dropColumn('due_at')
  })
}
