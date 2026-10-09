#!/usr/bin/env python3
"""Bundle the game into one self-contained HTML file (for previews and offline play).

    python3 tools/bundle.py out.html             full page
    python3 tools/bundle.py out.html --fragment  page content only, for hosts that add their own <html>/<head>/<body>
"""
import re, sys, pathlib

root = pathlib.Path(__file__).resolve().parent.parent / 'public'
html = (root / 'index.html').read_text()
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + (root / 'style.css').read_text() + '</style>')
html = re.sub(r'<script src="([^"]+)"></script>\n?', lambda m: '<script>\n' + (root / m.group(1)).read_text() + '</script>\n', html)
if '--fragment' in sys.argv:
    head = re.search(r'<head>(.*?)</head>', html, re.S).group(1)
    body = re.search(r'<body>(.*?)</body>', html, re.S).group(1)
    head = re.sub(r'<meta[^>]*>\n?|<link rel="(?:icon|manifest|apple-touch-icon)"[^>]*>\n?', '', head)
    html = head.strip() + '\n' + body.strip() + '\n'
pathlib.Path(sys.argv[1]).write_text(html)
