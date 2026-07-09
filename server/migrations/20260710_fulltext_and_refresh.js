export function up(knex) {
  return knex.schema
    .createTable('refresh_tokens', (t) => {
      t.increments('id')
      t.integer('user_id').unsigned().notNullable()
      t.string('token', 500).notNullable()
      t.timestamp('created_at').defaultTo(knex.fn.now())
      t.timestamp('expires_at').notNullable()
      t.foreign('user_id').references('employees.id').onDelete('CASCADE')
    })
    .then(() => {
      return knex.schema.alterTable('employees', (t) => {
        t.enu('role', ['agent', 'senior_agent', 'admin', 'super_admin']).alter()
      })
    })
    .then(() => {
      return knex.raw('ALTER TABLE tickets ADD FULLTEXT INDEX ft_tickets (title, description)')
    })
    .then(() => {
      return knex.raw('ALTER TABLE employees ADD FULLTEXT INDEX ft_employees (name, email, department)')
    })
    .then(() => {
      return knex.raw('ALTER TABLE wiki_articles ADD FULLTEXT INDEX ft_wiki (title, content)')
    })
    .then(() => {
      return knex.raw('ALTER TABLE news_posts ADD FULLTEXT INDEX ft_news (title, content)')
    })
    .then(() => {
      return knex.raw('ALTER TABLE chat_rooms ADD FULLTEXT INDEX ft_chat_rooms (name)')
    })
    .then(() => {
      return knex.raw('ALTER TABLE files ADD FULLTEXT INDEX ft_files (name)')
    })
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
