/**
 * Demo: Using valueOf() to access parameters in callTemplate
 *
 * This demonstrates the new feature where parameters passed via callTemplate
 * can be accessed within the template using valueOf({select: '$paramName'})
 * instead of having to receive them as function parameters.
 */

/* eslint-disable no-console, no-new -- Demo file */

import JTLT from '../src/index-node.js';

console.log('=== Demo 1: Named parameters ===');
new JTLT({
  data: {
    users: [
      {name: 'Alice', role: 'Admin'},
      {name: 'Bob', role: 'User'}
    ]
  },
  outputType: 'string',
  templates: [
    {
      path: '$',
      template () {
        this.forEach('$.users[*]', function (user) {
          this.callTemplate({
            name: 'formatUser',
            withParam: [
              {name: 'userName', value: user.name},
              {name: 'userRole', value: user.role},
              {name: 'prefix', value: '> '}
            ]
          });
        });
      }
    },
    {
      name: 'formatUser',
      template () {
        // Access parameters using valueOf with $paramName
        this.valueOf({select: '$prefix'});
        this.valueOf({select: '$userName'});
        this.string(' (');
        this.valueOf({select: '$userRole'});
        this.string(')\n');
      }
    }
  ],
  success (result) {
    console.log(result);
    console.log('\n');
  }
});

console.log('=== Demo 2: Indexed parameters (no names) ===');
new JTLT({
  data: {value: 'Test'},
  outputType: 'string',
  templates: [
    {
      path: '$',
      template () {
        this.callTemplate({
          name: 'format',
          withParam: [
            {value: 'First param'},
            {value: 'Second param'},
            {select: '$.value'}
          ]
        });
      }
    },
    {
      name: 'format',
      template () {
        // Access by index when name not provided
        this.string('Param 0: ');
        this.valueOf({select: '$0'});
        this.string('\nParam 1: ');
        this.valueOf({select: '$1'});
        this.string('\nParam 2: ');
        this.valueOf({select: '$2'});
        this.string('\n');
      }
    }
  ],
  success (result) {
    console.log(result);
    console.log('\n');
  }
});

console.log('=== Demo 3: Nested callTemplate ===');
new JTLT({
  data: {company: 'ACME Corp'},
  outputType: 'string',
  templates: [
    {
      path: '$',
      template () {
        this.callTemplate({
          name: 'outer',
          withParam: [
            {name: 'company', select: '$.company'}
          ]
        });
      }
    },
    {
      name: 'outer',
      template () {
        this.string('Company: ');
        this.valueOf({select: '$company'});
        this.string('\n');

        // Call another template from within
        /** @type {any} */ (this).callTemplate({
          name: 'inner',
          withParam: [
            {name: 'message', value: 'Nested template call'}
          ]
        });
      }
    },
    {
      name: 'inner',
      template () {
        this.string('  Message: ');
        this.valueOf({select: '$message'});
        this.string('\n');
      }
    }
  ],
  success (result) {
    console.log(result);
  }
});
