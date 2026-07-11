export async function up(knex) {
  const [col] = await knex.raw('SHOW COLUMNS FROM employees WHERE Field = ?', ['role'])
  if (col && col[0] && col[0].Type && col[0].Type.includes('enum')) {
    await knex.raw("ALTER TABLE employees MODIFY COLUMN role VARCHAR(20) DEFAULT 'agent'")
  }
}

export function down(knex) {
  return knex.schema.alterTable('employees', (t) => {
    t.enu('role', ['agent', 'senior_agent', 'admin', 'super_admin']).alter()
  })
}
