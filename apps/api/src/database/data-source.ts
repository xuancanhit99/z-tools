import "reflect-metadata";

import { DataSource } from "typeorm";

import { getTypeOrmDataSourceOptions } from "./typeorm.config";

export default new DataSource(getTypeOrmDataSourceOptions());
