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

import * as utils from '../src/utils';
import * as assert from 'assert';
import {
  ExpressLayerType,
  ExpressInstrumentationConfig,
  ExpressLayer,
  CustomAttributeNames,
} from '../src/types';

describe('Utils', () => {
  describe('isLayerIgnored()', () => {
    it('should not fail with invalid config', () => {
      assert.doesNotThrow(() =>
        utils.isLayerIgnored('', ExpressLayerType.MIDDLEWARE)
      );
      assert.doesNotThrow(() =>
        utils.isLayerIgnored(
          '',
          ExpressLayerType.MIDDLEWARE,
          {} as ExpressInstrumentationConfig
        )
      );
      assert.doesNotThrow(() =>
        utils.isLayerIgnored('', ExpressLayerType.MIDDLEWARE, {
          ignoreLayersType: {},
        } as ExpressInstrumentationConfig)
      );
      assert.doesNotThrow(() =>
        utils.isLayerIgnored('', ExpressLayerType.MIDDLEWARE, {
          ignoreLayersType: {},
          ignoreLayers: {},
        } as ExpressInstrumentationConfig)
      );
    });

    it('should ignore based on type', () => {
      assert.deepEqual(
        utils.isLayerIgnored('', ExpressLayerType.MIDDLEWARE, {
          ignoreLayersType: [ExpressLayerType.MIDDLEWARE],
        }),
        true
      );
      assert.deepEqual(
        utils.isLayerIgnored('', ExpressLayerType.ROUTER, {
          ignoreLayersType: [ExpressLayerType.MIDDLEWARE],
        }),
        false
      );
    });

    it('should ignore based on the name', () => {
      assert.deepEqual(
        utils.isLayerIgnored('bodyParser', ExpressLayerType.MIDDLEWARE, {
          ignoreLayers: ['bodyParser'],
        }),
        true
      );
      assert.deepEqual(
        utils.isLayerIgnored('bodyParser', ExpressLayerType.MIDDLEWARE, {
          ignoreLayers: [(name: string) => name === 'bodyParser'],
        }),
        true
      );
      assert.deepEqual(
        utils.isLayerIgnored('bodyParser', ExpressLayerType.MIDDLEWARE, {
          ignoreLayers: [/bodyParser/],
        }),
        true
      );
      assert.deepEqual(
        utils.isLayerIgnored('test', ExpressLayerType.ROUTER, {
          ignoreLayers: ['bodyParser'],
        }),
        false
      );
    });
  });

  describe('getLayerMetadata()', () => {
    it('should return router metadata', () => {
      assert.deepEqual(
        utils.getLayerMetadata(
          {
            name: 'router',
          } as ExpressLayer,
          '/test'
        ),
        {
          attributes: {
            [CustomAttributeNames.EXPRESS_NAME]: '/test',
            [CustomAttributeNames.EXPRESS_TYPE]: 'router',
          },
          name: 'router - /test',
        }
      );
    });

    it('should return request handler metadata', () => {
      assert.deepEqual(
        utils.getLayerMetadata(
          {
            name: 'bound dispatch',
          } as ExpressLayer,
          '/:id'
        ),
        {
          attributes: {
            [CustomAttributeNames.EXPRESS_NAME]: '/:id',
            [CustomAttributeNames.EXPRESS_TYPE]: 'request_handler',
          },
          name: 'request handler',
        }
      );
    });

    it('should return middleware metadata', () => {
      assert.deepEqual(
        utils.getLayerMetadata({
          name: 'bodyParser',
        } as ExpressLayer),
        {
          attributes: {
            [CustomAttributeNames.EXPRESS_NAME]: 'bodyParser',
            [CustomAttributeNames.EXPRESS_TYPE]: 'middleware',
          },
          name: 'middleware - bodyParser',
        }
      );
    });
  });
});
