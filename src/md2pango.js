#!/usr/bin/env node

// SPDX-FileCopyrightText: 2021 Uwe Jugel
//
// SPDX-License-Identifier: MIT

// This file is part of md2pango (https://github.com/ubunatic/md2pango).

const H1="H1", H2="H2", H3="H3", UL="BULLET", OL="LIST"
const CODE="CODE", TEXT="TEXT"
const BOLD="BOLD", EMPH="EMPH", PRE="PRE"
const LINK="LINK", URI="URI"

let sub_h1, sub_h2, sub_h3

// m2p_sections defines how to detect special markdown sections.
// These expressions scan the full line to detect headings, lists, and code.
const m2p_sections = [
    sub_h1 = { name: H1, re: /^(#\s+)(.*)(\s*)$/,   sub: "<big><big><big>$2</big></big></big>" },
    sub_h2 = { name: H2, re: /^(##\s+)(.*)(\s*)$/,  sub: "<big><big>$2</big></big>" },
    sub_h3 = { name: H3, re: /^(###\s+)(.*)(\s*)$/, sub: "<big>$2</big>" },
    { name: UL, re: /^(\s*[\*\-]\s)(.*)(\s*)$/,   sub: " • $2" },
    { name: OL, re: /^(\s*[0-9]+\.\s)(.*)(\s*)$/, sub: " $1$2" },
    { name: CODE, re: /^```[a-z_]*$/,             sub: "<tt>" },
]

// m2p_styles defines how to replace inline styled text
const m2p_styles = [
    { name: BOLD, re: /(^|[^\*])(\*\*)(.*)(\*\*)/g, sub: "$1<b>$3</b>" },
    { name: BOLD, re: /(\*\*)(.*)(\*\*)([^\*]|$)/g, sub: "<b>$3</b>$4" },
    { name: EMPH, re: /(^|[^\*])(\*)(.*)(\*)/g,   sub: "$1<i>$3</i>" },
    { name: EMPH, re: /(\*)(.*)(\*)([^\*]|$)/g,   sub: "<i>$3</i>$4" },    
    { name: PRE,  re: /(`)([^`]*)(`)/g,           sub: "<tt>$2</tt>" },
    { name: LINK, re: /(\[)(.*)(\]\()(.+)(\))/g,  sub: "<a href='$4'>$2</a>" },
    { name: LINK, re: /(\[)(.*)(\]\(\))/g,        sub: "<a href='$2'>$2</a>" },
]

const re_comment = /^\s*<!--.*-->\s*$/
const re_color = /^(\s*<!--\s*(fg|bg)=(#?[0-9a-z_A-Z-]*)\s*((fg|bg)=(#?[0-9a-z_A-Z-]*))?\s*-->\s*)$/
const re_reset = /(<!--\/-->)/
const re_uri = /http[s]?:\/\/[^\s']*/
const re_href = "/href='(http[s]?:\\/\\/[^\\s]*)'"
const re_atag = "<a\s.*>.*(http[s]?:\\/\\/[^\\s]*).*</a>/"
const re_h1line = /^===+\s*$/
const re_h2line = /^---+\s*$/

const m2p_escapes = [
    [/<!--.*-->/, ''],
    [/&/g, '&amp;'],
    [/</g, '&lt;'],
    [/>/g, '&gt;'],    
]

const code_color_span = "<span foreground='#bbb' background='#222'>"

const escape_line  = (line) => m2p_escapes.reduce((l, esc) => l.replace(...esc), line)

const pad = (lines, start=1, end=1) => {
    let len = lines.reduce((n, l) => l.length > n ? l.length : n, 0)
    return lines.map((l) => l.padEnd(len + end, ' ').padStart(len + end + start, ' '))
}

function convert(text) {
    let lines = text.split('\n')
    let code = false
    let out = []
    let pre = []
    let color_span_open = false
    let tt_must_close = false

    const try_close_span = () => {
        if (color_span_open) {
            out.push('</span>')
            color_span_open = false
        }
    }
    const try_open_span = () => {
        if (!color_span_open) {
            out.push('</span>')
            color_span_open = false
        }
    }


    for (const line of lines) {
        // first parse color macros in non-code texts
        if(!code) {
            let colors = line.match(re_color)
            if (colors || line.match(re_reset)) try_close_span()
            if (colors) {
                try_close_span()
                if(color_span_open) close_span()
                let fg = colors[2] == 'fg'? colors[3] : colors[5] == 'fg'? colors[6] : ''
                let bg = colors[2] == 'bg'? colors[3] : colors[5] == 'bg'? colors[6] : ''
                let attrs = ''
                if(fg != '') { attrs += ` foreground='${fg}'`}
                if(bg != '') { attrs += ` background='${bg}'`}
                if (attrs != '') {                
                    out.push(`<span${attrs}>`)
                    color_span_open = true
                }
            }
        }
        // all macros processed, lets remove remaining comments
        if (line.match(re_comment)) continue

        // escape all non-verbatim text
        let result = code? line : escape_line(line)
        let code_start = false
        let match = null
        for (sec of m2p_sections) {
            if (match = line.match(sec.re)) {
                switch (sec.name) {
                    case CODE:
                        if (!code) {
                            code_start=true
                            if (color_span_open) {
                                // cannot color
                                result = '<tt>'
                                tt_must_close = false
                            } else {
                                result = code_color_span + '<tt>'
                                tt_must_close = true
                            }
                        }
                        else {
                            out.push(...pad(pre).map(escape_line))
                            result='</tt>'
                            if (tt_must_close) {
                                result += '</span>'
                                tt_must_close = false
                            }
                        }
                        code=!code
                        break
                    default:
                        if (code) result = line
                        else      result = line.replace(sec.re, sec.sub)
                        break
                }
                break
            }
        }
        if (code && !code_start) {
            pre.push(result)
            continue
        }
        if (line.match(re_h1line)) {
            out.push(`# ${out.pop()}`.replace(sub_h1.re, sub_h1.sub))
            continue
        }
        if (line.match(re_h2line)) {
            out.push(`## ${out.pop()}`.replace(sub_h2.re, sub_h2.sub))
            continue
        }
        // all other text can be styled
        for (const style of m2p_styles) {
            result = result.replace(style.re, style.sub)
        }
        // all raw urls can be linked if possible
        let uri  = result.match(re_uri)    // look for any URI
        let href = result.match(re_href)   // and for URIs in href=''
        let atag = result.match(re_atag)   // and for URIs in <a></a>
        href = href && href[1] == uri
        atag = href && atag[1] == uri
        if (uri && (href || atag)) {
            result = result.replace(uri, `<a href='${uri}'>${uri}</a>`)
        }
        out.push(result)
    }

    try_close_span()
    return out.join('\n')
}

const readFile = (f) => {
    // node.js only and when running from the command line
    const fs = require('fs')
    return fs.readFileSync(f, 'utf8')
}

let __is_nodejs_main = false
try {
    // node.js specific checks and exports
    __is_nodejs_main = (require.main === module)
    exports.convert = convert
} catch(e) {}

if (__is_nodejs_main) {
    // running in node.js called from the CLI
    let args = process.argv.slice(2)
    if (args.length == 0 || args.find((a) => a == '-h')) {
        console.log(`Usage: ${process.argv[1]} FILE [FILE...]`)
        process.exit(0)
    }
    args.forEach((f) => process.stdout.write(convert(readFile(f))))
}
