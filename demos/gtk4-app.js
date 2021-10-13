#!/usr/bin/env gjs
imports.gi.versions.Gtk = '4.0'
const { GLib, Gtk } = imports.gi
const ByteArray = imports.byteArray

let args = [imports.system.programInvocationName].concat(ARGV)

const path = (...o) => GLib.build_filenamev(o)

const file       = GLib.path_get_basename(args[0])
const dir        = GLib.path_get_dirname(args[0])
const root       = GLib.path_get_dirname(dir)

const test_md    = path(root, 'tests/test.md')
const readme_md  = path(root, 'README.md')
const contrib_md = path(root, 'CONTRIBUTING.md')
const src        = path(root, 'src')

const files = [readme_md, contrib_md, test_md]

const readFile = (path) => ByteArray.toString(GLib.file_get_contents(path)[1])

print(`adding ${src} to searchPath`)
imports.searchPath.unshift(src)

const md2pango = imports.md2pango

print(md2pango.convert("loaded md2pango"))

Gtk.init()

// CSS from source code
let css1 = new Gtk.CssProvider()
css1.load_from_data(`
* {
    color: #eee;
    background-color: #222;
    padding: 2px;
}
`)

let css2 = new Gtk.CssProvider()
css2.load_from_data(`
* {
    background-color: #333;
    padding: 10px;    
}
`)

let app = new Gtk.Application()

function buildUI() {
    // setup basic layout
    let w = new Gtk.ApplicationWindow({
        application: app,
    })
    w.set_default_size(400,600)
    let hbox = new Gtk.Box()
    w.set_child(hbox)
    let nav = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
    hbox.append(nav)    

    // setup a stack and switcher
    let vbox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
    let sw = new Gtk.StackSwitcher()
    let stack = new Gtk.Stack({
        transition_type: Gtk.StackTransitionType.CROSSFADE,
        transition_duration: 100,
    })
    sw.set_stack(stack)
    vbox.append(sw)
    vbox.append(stack)
    hbox.append(vbox)

    stack.get_style_context().add_provider(css1, 0)    

    files.forEach( (f) => {
        let name = f.replace('./', '')

        let label = new Gtk.Label({ selectable: true })
        let view = new Gtk.ScrolledWindow({
            max_content_width:  400,
            min_content_height: 600,
        })
        view.set_child(label)
        stack.add_titled(view, name, name)

        label.get_style_context().add_provider(css2, 0)

        let text = md2pango.convert(readFile(f))
        label.set_markup(text)

        print(text)
    })
    w.show()
}

app.connect('activate', () => buildUI() )
app.run(null)