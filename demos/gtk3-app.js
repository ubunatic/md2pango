#!/usr/bin/env gjs
imports.gi.versions.Gtk = '3.0'
const { GLib, Gtk } = imports.gi
const ByteArray = imports.byteArray

let args = [imports.system.programInvocationName].concat(ARGV)

const path = (...o) => GLib.build_filenamev(o)

const file       = GLib.path_get_basename(args[0])
const dir        = GLib.path_get_dirname(args[0])
const root       = GLib.path_get_dirname(dir)

const test_md    = path(root, 'test.md')
const readme_md  = path(root, 'README.md')
const contrib_md = path(root, 'CONTRIBUTING.md')
const src        = path(root, 'src')

const files = [readme_md, contrib_md, test_md]

const readFile = (path) => ByteArray.toString(GLib.file_get_contents(path)[1])

print(`adding ${src} to searchPath`)
imports.searchPath.unshift(src)

const md2pango = imports.md2pango

print(md2pango.convert("loaded md2pango"))

Gtk.init(null)

Gtk.Box.prototype.append = function(o, expand=false, fill=false, padding=1.0) {
    return this.pack_start(o, expand, fill, padding)
}

// setup basic layout
let w = new Gtk.Window({
    border_width: 10,
    window_position: Gtk.WindowPosition.CENTER,
})
w.set_default_size(400,600)
let hbox = new Gtk.Box()
w.add(hbox)
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
vbox.append(sw, true, true, 5.0)
vbox.append(stack, true, true, 5.0)
hbox.append(vbox, true, false, 5.0)

files.forEach( (f) => {
    let name = f.replace('./', '')

    let label = new Gtk.Label({ selectable: true })
    let view = new Gtk.ScrolledWindow({
        max_content_width:  400,
        min_content_height: 600,
        border_width: 3,
    })
    view.add(label, true, true, 5.0)
    stack.add_titled(view, name, name)

    let text = md2pango.convert(readFile(f))
    label.set_markup(text)

    print(text)
    // w.set_title(`md2pango ${f}`)
})

w.show_all()
w.connect('destroy', () => Gtk.main_quit())
Gtk.main()