export function up(knex) {
  return knex.schema.createTable('canned_responses', (t) => {
    t.increments('id').primary()
    t.string('title', 255).notNullable()
    t.text('text').notNullable()
    t.string('category', 100).defaultTo('')
    t.integer('created_by').notNullable()
    t.timestamp('created_at').defaultTo(knex.fn.now())
    t.timestamp('updated_at').defaultTo(knex.fn.now())
  })
}

export function down(knex) {
  return knex.schema.dropTableIfExists('canned_responses')
}