export function up(knex) {
  return knex.raw('ALTER TABLE tickets ADD FULLTEXT INDEX ft_tickets (title, description)')
    .catch(() => Promise.resolve()) // index may already exist
    .then(() => knex.raw('ALTER TABLE employees ADD FULLTEXT INDEX ft_employees (name, email, department)').catch(() => {}))
    .then(() => knex.raw('ALTER TABLE wiki_articles ADD FULLTEXT INDEX ft_wiki (title, content)').catch(() => {}))
    .then(() => knex.raw('ALTER TABLE news_posts ADD FULLTEXT INDEX ft_news (title, content)').catch(() => {}))
    .then(() => knex.raw('ALTER TABLE chat_rooms ADD FULLTEXT INDEX ft_chat_rooms (name)').catch(() => {}))
    .then(() => knex.raw('ALTER TABLE files ADD FULLTEXT INDEX ft_files (name)').catch(() => {}))
}

export function down(knex) {
  return knex.raw('ALTER TABLE tickets DROP INDEX ft_tickets').catch(() => {})
    .then(() => knex.raw('ALTER TABLE employees DROP INDEX ft_employees').catch(() => {}))
    .then(() => knex.raw('ALTER TABLE wiki_articles DROP INDEX ft_wiki').catch(() => {}))
    .then(() => knex.raw('ALTER TABLE news_posts DROP INDEX ft_news').catch(() => {}))
    .then(() => knex.raw('ALTER TABLE chat_rooms DROP INDEX ft_chat_rooms').catch(() => {}))
    .then(() => knex.raw('ALTER TABLE files DROP INDEX ft_files').catch(() => {}))
}
