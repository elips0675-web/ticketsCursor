export function up(knex) {
  return knex.schema
    .alterTable('polls', (table) => {
      table.dateTime('ends_at').nullable()
      table.string('show_results', 20).defaultTo('after_vote')
    })
}

export function down(knex) {
  return knex.schema
    .alterTable('polls', (table) => {
      table.dropColumn('show_results')
      table.dropColumn('ends_at')
    })
}
