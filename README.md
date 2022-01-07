# CHAOS DISCORD BOT

## Setup

### Development

```
npm install
```

### Deployment

- Copy `local.config.json` to `config.json` then supply all required configs.
- From `src\database\config`, copy `local.database.json` to `database.json` then update `production` config
- Run following commands for database:

```
> npx sequelize-cli db:migrate
> npx sequelize-cli db:seed:all
```

![AUTHOR](https://img.shields.io/badge/AUTHOR-CJ%20CANLAS-red?style=for-the-badge&logo=appveyor)
