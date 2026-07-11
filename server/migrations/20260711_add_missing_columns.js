export function up(knex) {
  return knex.schema
    .hasColumn('files', 'path')
    .then((exists) => {
      if (exists) return
      return knex.schema.table('files', (t) => { t.string('path', 500) })
    })
    .then(() => knex.schema.hasColumn('admin_settings', 'id'))
    .then((exists) => {
      if (exists) return
      return knex.schema.raw(`
        ALTER TABLE admin_settings
          ADD COLUMN id INT UNSIGNED NOT NULL AUTO_INCREMENT FIRST,
          DROP PRIMARY KEY,
          ADD PRIMARY KEY (id),
          ADD UNIQUE INDEX admin_settings_key_unique (\`key\`)
      `)
    })
}

export function down(knex) {
  return knex.schema
    .table('files', (t) => t.dropColumn('path'))
    .then(() => knex.schema.raw(`
      ALTER TABLE admin_settings
        DROP PRIMARY KEY,
        DROP COLUMN id,
        ADD PRIMARY KEY (key)
    `))
}

