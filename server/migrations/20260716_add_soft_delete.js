export function up(knex) {
  return knex.schema
    .alterTable('tickets', (t) => t.timestamp('deleted_at').nullable().index())
    .alterTable('ticket_messages', (t) => t.timestamp('deleted_at').nullable().index())
    .alterTable('chat_messages', (t) => t.timestamp('deleted_at').nullable().index())
    .alterTable('files', (t) => t.timestamp('deleted_at').nullable().index())
}

export function down(knex) {
  return knex.schema
    .alterTable('tickets', (t) => t.dropColumn('deleted_at'))
    .alterTable('ticket_messages', (t) => t.dropColumn('deleted_at'))
    .alterTable('chat_messages', (t) => t.dropColumn('deleted_at'))
    .alterTable('files', (t) => t.dropColumn('deleted_at'))
}
