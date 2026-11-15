"""Serves the clean folder for tools/bake.html and saves what it bakes into assets/sprites/.
   python tools/bake_server.py   then open http://localhost:8091/tools/bake.html"""
import http.server, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'sprites')

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def do_POST(self):
        m = re.fullmatch(r'/save/([a-z_]+\.(png|json))', self.path)
        if not m:
            self.send_error(404); return
        data = self.rfile.read(int(self.headers['Content-Length']))
        os.makedirs(OUT, exist_ok=True)
        with open(os.path.join(OUT, m.group(1)), 'wb') as f:
            f.write(data)
        self.send_response(200); self.end_headers()

http.server.ThreadingHTTPServer(('127.0.0.1', 8091), Handler).serve_forever()
