# md2pango

**The first Markdown to Pango Markup Converter!**

md2pango is a simple regex-based line-by-line converter to convert simple Markdown to
[Pango Markup](https://developer.gnome.org/pygtk/stable/pango-markup-language.html).
## Purpose
Use Markdown + md2pango to define short texts for small dialogs in lightweight GTK apps.
Pango's scope is very limited and thus are md2pango's supported Markdown features.
For true richtext support and interactive apps use [WebKitGTK](https://webkitgtk.org).

The project started as part of a Gnome Extension and was later refactored to
become a generic NPM module.

## Usage
To use it in a GTK app, first add [src/md2pango.js](src/md2pango.js) to the `imports`;
either by just copying the file or during
[packaging](https://stackoverflow.com/questions/38537256/how-can-i-include-files-with-gjs-gnome-javascript).

```js
// Gnome Extension, with `md2pango.js` copied next to your `extension.js`
const md2pango = Me.imports.md2pango

// GTK app
imports.searchPath.unshift('path/to/md2pango')
const md2pango = imports.md2pango

// node.js app after installing the md2pango module
const md2pango = require('md2pango')
```

Thereafter just use `md2pango.convert(str:String) -> str:String`.
```js
let pangoText = md2pango.convert('### Heading')
// pangoText: <big>Heading</big>
```

## CLI Mode
The module comes with a installable binary `md2pango`.

Using `md2pango FILE [FILE...]` one or more Markdown files can
be converted to Pango Markup. The result is written to `process.stdout`.

Use it to convert Markdown files in your Pango/GTK projects if you cannot
or don't want to ship `md2pango.js` with your code.

## Converted Elements
```
   headings:         #, ##, ###, ===, ---
   unordered list:   * item
   ordered list:     1. item
   escaping:         <, >, &
   code block start: ```, ```lang
   code block stop:  ```
   inline styles:    **bold**, *emph*, `fixed`
   inline urls:      [name](link)
   url detection:    http[s]?://.*
   comments:         <!-- -->
   color marcos:     <!--fg|bg=COLOR|#RGB-->
```

## Macros
Pango colors can be set as Markdown comments using `<!--fg=#RGB bg=#RGB-->`.
Color names instead of `#RGB` are also supported.
Use `<!--/-->` to close the currently coloring block.
Currently, colors modifications cannot be nested.
Use only one macro per line!

## Limitations
* All undetected markdown features will be escaped and converted as regular text.
* Multiple URIs on one line may cause trouble.
* Valid but unsupported Markdown/Pango XML tags are escaped and converted as regular text.
* Conversion and escaping are best effort (there are probably some ways to break it).
* The effects of nesting styles are unpredictable (requires a smarter Markdown parser).
* Multi-line list items are not supported.

## License

[MIT](LICENSES/MIT.txt)

## Contributing
When making changes to the project, please ensure that all changes
also work in GJS/GTK apps and in Gnome Extensions.
Also see [CONTRIBUTING.md](CONTRIBUTING.md).