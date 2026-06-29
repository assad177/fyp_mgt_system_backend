import { DataSource } from 'typeorm';
export const AppDataSource = new DataSource({

  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'myuser',
  password: 'mypassword',
  database: 'mydb',
  entities: ['dist/**/*.entity.js'],
  synchronize: false,
});

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((error) => {
    console.error('Error during Data Source initialization', error);
  });


