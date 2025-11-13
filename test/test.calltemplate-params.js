import {expect} from 'chai';
import JTLT from '../src/index-node.js';

describe('callTemplate with valueOf parameter access', function () {
  it('should access parameters via valueOf with $paramName', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {x: 'val', y: 'another'},
      outputType: 'string',
      templates: [
        {
          path: '$',
          template () {
            this.callTemplate({
              name: 'helper',
              withParam: [
                {name: 'param1', select: '$.x'},
                {name: 'param2', value: 'direct-value'}
              ]
            });
          }
        },
        {
          name: 'helper',
          template () {
            // Access parameters via valueOf
            this.string('param1:');
            this.valueOf({select: '$param1'});
            this.string(', param2:');
            this.valueOf({select: '$param2'});
          }
        }
      ],
      success (result) {
        try {
          expect(result).to.include('param1:val');
          expect(result).to.include('param2:direct-value');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('should access parameters by index when name not provided', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {x: 'first', y: 'second'},
      outputType: 'string',
      templates: [
        {
          path: '$',
          template () {
            this.callTemplate({
              name: 'indexed',
              withParam: [
                {select: '$.x'},
                {value: 'second-value'}
              ]
            });
          }
        },
        {
          name: 'indexed',
          template () {
            // Access parameters by index (0, 1, etc.)
            this.valueOf({select: '$0'});
            this.string(' - ');
            this.valueOf({select: '$1'});
          }
        }
      ],
      success (result) {
        try {
          expect(result).to.include('first - second-value');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('should work with params in string output', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {name: 'Alice', age: 30},
      outputType: 'string',
      templates: [
        {
          path: '$',
          template () {
            this.callTemplate({
              name: 'person',
              withParam: [
                {name: 'personName', select: '$.name'},
                {name: 'personAge', select: '$.age'}
              ]
            });
          }
        },
        {
          name: 'person',
          template () {
            this.string('fullName=');
            this.valueOf({select: '$personName'});
            this.string(', years=');
            this.valueOf({select: '$personAge'});
          }
        }
      ],
      success (result) {
        try {
          expect(result).to.include('fullName=Alice');
          expect(result).to.include('years=30');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('should handle nested callTemplate calls', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {value: 'test'},
      outputType: 'string',
      templates: [
        {
          path: '$',
          template () {
            this.callTemplate({
              name: 'outer',
              withParam: [{name: 'outerParam', value: 'outer-value'}]
            });
          }
        },
        {
          name: 'outer',
          template () {
            /** @type {any} */ (this).string('Outer:');
            /** @type {any} */ (this).valueOf({select: '$outerParam'});
            /** @type {any} */ (this).string('|');
            /** @type {any} */ (this).callTemplate({
              name: 'inner',
              withParam: [{name: 'innerParam', value: 'inner-value'}]
            });
          }
        },
        {
          name: 'inner',
          template () {
            this.string('Inner:');
            this.valueOf({select: '$innerParam'});
          }
        }
      ],
      success (result) {
        try {
          expect(result).to.include('Outer:outer-value');
          expect(result).to.include('Inner:inner-value');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('should fall back to normal JSONPath when $ param not found', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {x: 'val'},
      outputType: 'string',
      templates: [
        {
          path: '$',
          template () {
            this.callTemplate({
              name: 'test',
              withParam: [{name: 'param1', value: 'test'}]
            });
          }
        },
        {
          name: 'test',
          template () {
            // Try to access a non-existent parameter
            // should fall back to JSONPath
            this.valueOf({select: '$.x'}); // normal JSONPath
          }
        }
      ],
      success (result) {
        try {
          expect(result).to.include('val');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });
});
