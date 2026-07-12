export async function up(knex) {
  const hasRefresh = await knex.schema.hasTable('refresh_tokens')
  if (!hasRefresh) {
    await knex.schema.createTable('refresh_tokens', (t) => {
      t.increments('id')
      t.integer('user_id').unsigned().notNullable()
      t.string('token', 500).notNullable()
      t.timestamp('created_at').defaultTo(knex.fn.now())
      t.timestamp('expires_at').notNullable()
      t.foreign('user_id').references('employees.id').onDelete('CASCADE')
    })
  }
  const [col] = await knex.raw('SHOW COLUMNS FROM employees WHERE Field = ?', ['role'])
  if (col && col[0] && col[0].Type && col[0].Type.includes('enum')) {
    // Column is ENUM — convert back to VARCHAR to match Prisma schema
    const column = col[0]
    const nullable = column.Null === 'YES' ? '' : ' NOT NULL'
    const defaultVal = column.Default ? ` DEFAULT '${column.Default}'` : " DEFAULT 'agent'"
    await knex.raw(`ALTER TABLE employees MODIFY COLUMN role VARCHAR(10)${nullable}${defaultVal}`)
  }
  for (const stmt of [
    'ALTER TABLE tickets ADD FULLTEXT INDEX ft_tickets (title, description)',
    'ALTER TABLE employees ADD FULLTEXT INDEX ft_employees (name, email, department)',
    'ALTER TABLE wiki_articles ADD FULLTEXT INDEX ft_wiki (title, content)',
    'ALTER TABLE news_posts ADD FULLTEXT INDEX ft_news (title, content)',
    'ALTER TABLE chat_rooms ADD FULLTEXT INDEX ft_chat_rooms (name)',
    'ALTER TABLE files ADD FULLTEXT INDEX ft_files (name)',
  ]) {
    try { await knex.raw(stmt) } catch { /* index may already exist */ }
  }
}

export function down(knex) {
  return knex.schema
    .dropTableIfExists('refresh_tokens')
    .then(() => knex.raw('ALTER TABLE tickets DROP INDEX ft_tickets'))
    .then(() => knex.raw('ALTER TABLE employees DROP INDEX ft_employees'))
    .then(() => knex.raw('ALTER TABLE wiki_articles DROP INDEX ft_wiki'))
    .then(() => knex.raw('ALTER TABLE news_posts DROP INDEX ft_news'))
    .then(() => knex.raw('ALTER TABLE chat_rooms DROP INDEX ft_chat_rooms'))
    .then(() => knex.raw('ALTER TABLE files DROP INDEX ft_files'))
}
