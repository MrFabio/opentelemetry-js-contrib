/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Attributes } from '@opentelemetry/api';
import {
  SEMATTRS_DB_CONNECTION_STRING,
  SEMATTRS_DB_NAME,
  SEMATTRS_DB_USER,
  SEMATTRS_NET_PEER_NAME,
  SEMATTRS_NET_PEER_PORT,
} from '@opentelemetry/semantic-conventions';
import type {
  ConnectionConfig,
  PoolActualConfig,
  Query,
  QueryOptions,
} from 'mysql';
import type * as mysqlTypes from 'mysql';

/**
 * Get an Attributes map from a mysql connection config object
 *
 * @param config ConnectionConfig
 */
export function getConnectionAttributes(
  config: ConnectionConfig | PoolActualConfig
): Attributes {
  const { host, port, database, user } = getConfig(config);
  const portNumber = parseInt(port, 10);
  if (!isNaN(portNumber)) {
    return {
      [SEMATTRS_NET_PEER_NAME]: host,
      [SEMATTRS_NET_PEER_PORT]: portNumber,
      [SEMATTRS_DB_CONNECTION_STRING]: getJDBCString(host, port, database),
      [SEMATTRS_DB_NAME]: database,
      [SEMATTRS_DB_USER]: user,
    };
  }
  return {
    [SEMATTRS_NET_PEER_NAME]: host,
    [SEMATTRS_DB_CONNECTION_STRING]: getJDBCString(host, port, database),
    [SEMATTRS_DB_NAME]: database,
    [SEMATTRS_DB_USER]: user,
  };
}

function getConfig(config: any) {
  const { host, port, database, user } =
    (config && config.connectionConfig) || config || {};
  return { host, port, database, user };
}

function getJDBCString(
  host: string | undefined,
  port: number | undefined,
  database: string | undefined
) {
  let jdbcString = `jdbc:mysql://${host || 'localhost'}`;

  if (typeof port === 'number') {
    jdbcString += `:${port}`;
  }

  if (typeof database === 'string') {
    jdbcString += `/${database}`;
  }

  return jdbcString;
}

/**
 * @returns the database statement being executed.
 */
export function getDbStatement(query: string | Query | QueryOptions): string {
  if (typeof query === 'string') {
    return query;
  } else {
    return query.sql;
  }
}

export function getDbValues(
  query: string | Query | QueryOptions,
  values?: any[]
): string {
  if (typeof query === 'string') {
    return arrayStringifyHelper(values);
  } else {
    // According to https://github.com/mysqljs/mysql#performing-queries
    // The values argument will override the values in the option object.
    return arrayStringifyHelper(values || query.values);
  }
}

/**
 * The span name SHOULD be set to a low cardinality value
 * representing the statement executed on the database.
 *
 * @returns SQL statement without variable arguments or SQL verb
 */
export function getSpanName(query: string | Query | QueryOptions): string {
  const rawQuery = typeof query === 'object' ? query.sql : query;
  // Extract the SQL verb
  const firstSpace = rawQuery?.indexOf(' ');
  if (typeof firstSpace === 'number' && firstSpace !== -1) {
    return rawQuery?.substring(0, firstSpace);
  }
  return rawQuery;
}

export function arrayStringifyHelper(arr: Array<unknown> | undefined): string {
  if (arr) return `[${arr.toString()}]`;
  return '';
}

export function getPoolName(pool: mysqlTypes.Pool): string {
  const c = pool.config.connectionConfig;
  let poolName = '';
  poolName += c.host ? `host: '${c.host}', ` : '';
  poolName += c.port ? `port: ${c.port}, ` : '';
  poolName += c.database ? `database: '${c.database}', ` : '';
  poolName += c.user ? `user: '${c.user}'` : '';
  if (!c.user) {
    poolName = poolName.substring(0, poolName.length - 2); //omit last comma
  }
  return poolName.trim();
}
