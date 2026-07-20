export async function up(knex) {
  const [cols] = await knex.raw('SHOW COLUMNS FROM polls')
  const names = cols.map(c => c.Field)
  const alters = []
  if (!names.includes('ends_at')) alters.push(knex.schema.alterTable('polls', t => t.dateTime('ends_at').nullable()))
  if (!names.includes('show_results')) alters.push(knex.schema.alterTable('polls', t => t.string('show_results', 20).defaultTo('after_vote')))
  await Promise.all(alters)
}

export function down(knex) {
  return knex.schema
    .alterTable('polls', (table) => {
      table.dropColumn('show_results')
      table.dropColumn('ends_at')
    })
}
