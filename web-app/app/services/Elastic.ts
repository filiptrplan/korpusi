import { Client } from "@elastic/elasticsearch";

export const elastic = new Client({
  node: process.env.ELASTIC_NODE || "http://localhost:9200",
  auth: {
    username: process.env.ELASTIC_USER || "changeme",
    password: process.env.ELASTIC_PASSWORD || "changeme",
  },
  tls: {
    rejectUnauthorized: false, // for self-signed certificates
  },
});
