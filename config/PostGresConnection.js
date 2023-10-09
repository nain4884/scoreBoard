const { DataSource } = require("typeorm");
require("dotenv").config();
require("reflect-metadata");

const dataSourceOption = {
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  synchronize: false,
  entities: [__dirname + "/../**/*.entity.{js,ts}"],
  "migrations": [__dirname + '/../**/migrations/*{.js,.ts}'],
  "migrationsTableName": "migrations",
  logging: true, 
};

const AppDataSource = new DataSource(dataSourceOption);

AppDataSource.initialize()
  .then(async () => {
    console.log("Database connected successfully");
  })
  .catch((error) => console.log(`Error in connection:${error}`));

const getDataSource = (delay = 3000) => {
  if (AppDataSource.isInitialized) return Promise.resolve(AppDataSource);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (AppDataSource.isInitialized) resolve(AppDataSource);
      else reject("Failed to create connection with database");
    }, delay);
  });
};

module.exports = {getDataSource, AppDataSource};
