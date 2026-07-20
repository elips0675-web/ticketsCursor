export function up(knex) {
  return knex.schema.createTable('feature_flags', (t) => {
    t.string('key', 100).primary()
    t.boolean('enabled').notNullable().defaultTo(true)
    t.string('description', 500).defaultTo('')
    t.timestamp('updated_at').defaultTo(knex.fn.now())
  })
}

export function down(knex) {
  return knex.schema.dropTableIfExists('feature_flags')
}
