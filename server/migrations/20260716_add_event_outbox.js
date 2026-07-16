export function up(knex) {
  return knex.schema.createTable('event_outbox', (table) => {
    table.increments('id').primary()
    table.string('event_type', 50).notNullable()
    table.string('room', 100).nullable()
    table.text('payload').notNullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('sent_at').nullable().index()
    table.index(['sent_at', 'created_at'])
  })
}

export function down(knex) {
  return knex.schema.dropTableIfExists('event_outbox')
}
