# scoreBoard

```bash
# to generate the migrtioan
$ db-migrate create <migration nain> --sql-file

This folder contains a sub-folder named sqls which contains two files ending with ..initialize-up.sql and initialize-down.sql. This is where you will write your sql queries.
Copy the generated code into your …initialize-up.sql file.
Write the ‘Drop Table’ statement in the …initialize_down.sql file.

# to run the migration
$ db-migrate up <migration nain>
or 
$ db-migrate up 

```
