# callTemplate Parameter Access via `valueOf()`

## Overview

Parameters can be accessed within the template using `valueOf({select: '$paramName'})`:

```javascript
await jtlt({
  templates: [{
    name: 'myTemplate',
    template () {
      this.string('Value: ');
      this.valueOf({select: '$paramName'});
    }
  }]
});
```

Note: Named templates (those with a `name` property) that are only called via `callTemplate` do not need a `path` property.

## Features

### Named Parameters

You can pass named parameters using the `name` property in `withParam`:

```javascript
await jtlt({
  templates: [
    {
      path: '$',
      template () {
        this.callTemplate({
          name: 'formatUser',
          withParam: [
            {name: 'userName', value: 'Alice'},
            {name: 'userRole', select: '$.role'}
          ]
        });
      }
    }
    // ...
  ]
});
```

Access them in the template:

```js
await jtlt({
  templates: [
    // ...
    {
      name: 'formatUser',
      template () {
        this.valueOf({select: '$userName'});
        this.string(' - ');
        this.valueOf({select: '$userRole'});
      }
    }
  ]
});
```

### Indexed Parameters

When no `name` is provided, parameters are accessible by their index (0, 1, 2, etc.):

```js
await jtlt({
  templates: [
    {
      path: '$',
      template () {
        this.callTemplate({
          name: 'format',
          withParam: [
            {value: 'First'},
            {value: 'Second'}
          ]
        });
      }
    }
  ]
});
```

Access by index:

```js
await jtlt({
  templates: [
    {
      name: 'format',
      template () {
        this.valueOf({select: '$0'}); // First
        this.valueOf({select: '$1'}); // Second
      }
    }
  ]
});
```

### Nested callTemplate Calls

Parameters are scoped to the current template call. When nesting `callTemplate` calls, each template has access to its own parameters:

```js
await jtlt({
  templates: [
    {
      name: 'outer',
      template () {
        this.valueOf({select: '$outerParam'}); // Accesses outer parameter
        this.callTemplate({
          name: 'inner',
          withParam: [{name: 'innerParam', value: 'inner-value'}]
        });
      }
    },
    {
      name: 'inner',
      template () {
        this.valueOf({select: '$innerParam'}); // Accesses inner parameter
      }
    }
  ]
});
```

## Implementation Details

### How It Works

1. When `callTemplate()` is called, it stores the parameters in a temporary `_params` object on the context
2. Parameters are stored either by name (if provided) or by index
3. When `valueOf()` is called with a selector starting with `$`, it checks `_params` first
4. If the parameter is not found, it falls back to normal JSONPath/XPath evaluation
5. After the template completes, the previous parameter context is restored

### Parameter Priority

1. **Named parameters**: If `withParam[i].name` is provided, the parameter is stored with that name
2. **Indexed parameters**: If no name is provided, the parameter is stored with its index as a string

### Backward Compatibility

The old approach of receiving parameters as function arguments is no longer supported. Templates should be updated to use `valueOf()` for parameter access. This change was made to:

- Provide a more consistent API with XSLT-style parameter access
- Allow templates to use the fluent builder pattern throughout
- Enable better parameter naming and documentation
- Support both JSONPath and XPath contexts uniformly

## Examples

### Example 1: User Formatting

```js
await jtlt({
  data: {users: [{name: 'Alice', role: 'Admin'}]},
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
              {name: 'userRole', value: user.role}
            ]
          });
        });
      }
    },
    {
      name: 'formatUser',
      template () {
        this.string(' (');
        this.valueOf({select: '$userRole'});
        this.string(')\n');
      }
    }
  ]
});
// Output: "Alice (Admin)\n"
```

### Example 2: Nested callTemplate

```js
await jtlt({
  data: {company: 'ACME Corp', division: 'Engineering'},
  outputType: 'string',
  templates: [
    {
      path: '$',
      template () {
        this.callTemplate({
          name: 'outer',
          withParam: [
            {name: 'companyName', select: '$.company'},
            {name: 'divisionName', select: '$.division'}
          ]
        });
      }
    },
    {
      name: 'outer',
      template () {
        this.string('Company: ');
        this.valueOf({select: '$companyName'});
        this.string('\n');

        this.callTemplate({
          name: 'inner',
          withParam: [
            {name: 'division', select: '$divisionName'}
          ]
        });
      }
    },
    {
      name: 'inner',
      template () {
        this.string('  Division: ');
        this.valueOf({select: '$division'});
        this.string('\n');
      }
    }
  ]
});
// Output: "Company: ACME Corp\n  Division: Engineering\n"
```

## Testing

Run the test suite to verify the implementation:

```bash
pnpm test test/test.calltemplate-params.js
```

Run the demo to see examples in action:

```bash
node demo/calltemplate-params-demo.js
```

