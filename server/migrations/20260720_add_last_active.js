export function up(knex) {
  return knex.schema.alterTable('employees', (table) => {
    table.timestamp('last_active').nullable().after('created_at')
  })
}

export function down(knex) {
  return knex.schema.alterTable('employees', (table) => {
    table.dropColumn('last_active')
  })
}
