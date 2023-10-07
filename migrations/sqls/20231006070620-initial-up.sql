/* Replace with your SQL commands */

CREATE TABLE IF NOT EXISTS public.users (
  "id" SERIAL PRIMARY KEY,
  "userName" VARCHAR(255) NOT NULL,
  "password" VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.match (
  "id" SERIAL PRIMARY KEY,
  "marketId" VARCHAR(255) UNIQUE NOT NULL,
  "eventId" VARCHAR(255) UNIQUE NOT NULL,
  "competitionId" VARCHAR(255) NOT NULL,
  "competitionName" VARCHAR(255) NOT NULL,
  "gameType" VARCHAR(50) NOT NULL,
  "teamA" VARCHAR(40) NOT NULL,
  "teamB" VARCHAR(40) NOT NULL,
  "teamC" VARCHAR(40),
  "title" VARCHAR(50) NOT NULL,
  "startDate" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "stopAt" TIMESTAMPTZ,
  "overType" VARCHAR(255),
  "noBallRun" INT
);
