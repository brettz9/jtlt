# getJSON

getJSON function similar to that of jQuery's.

```js
getJSON(url, function (data) {
    // Do something with "data"
});
```

An optional third argument can be provided as an error-back (which will
be supplied the error message and originally supplied URL).

Also accepts an array of URLs (waiting for all to load):

```js
getJSON([url1, ur2], function (obj1, obj2) {
    // Do something with "obj1" and "obj2"
});
```

If no callback or error-back is provided (or when an array of URLs is
supplied), a promise will be returned. If an array is provided along with
a callback, that callback will be executed before the promise is resolved.

You can thus use Promises as follows:

```js
getJSON([url1, ur2]).then(function (objs) {
    // Do something with "objs" array
}, function (err) {
    // Handle any errors here
});
```


# Install

```
bower install get-json
```

or

```
npm install simple-get-json
```

# Todo
- Support named parameters ala jQuery
- Support rest of jQuery API

# Notes

See also [postJSON](https://github.com/brettz9/postJSON).
