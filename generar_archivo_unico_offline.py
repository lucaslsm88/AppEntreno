import base64
import hashlib
import os

def sha256_csp_token(script_text: str) -> str:
    digest = hashlib.sha256(script_text.encode('utf-8')).digest()
    b64 = base64.b64encode(digest).decode('ascii')
    return f"'sha256-{b64}'"

def bundle_single_file():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read().replace('\r\n', '\n').replace('\r', '\n')

    with open('styles.css', 'r', encoding='utf-8') as f:
        css = f.read().replace('\r\n', '\n').replace('\r', '\n')

    with open('xlsx.full.min.js', 'r', encoding='utf-8') as f:
        xlsx_js = f.read().replace('\r\n', '\n').replace('\r', '\n')

    with open('app.js', 'r', encoding='utf-8') as f:
        app_js = f.read().replace('\r\n', '\n').replace('\r', '\n')

    # Calcular hashes SHA-256 exactos para la política CSP del archivo offline único
    hash_xlsx = sha256_csp_token(xlsx_js)
    hash_app = sha256_csp_token(app_js)
    html = html.replace("script-src 'self';", f"script-src {hash_xlsx} {hash_app};")

    # Reemplazar enlace a estilos externos por style inline
    html = html.replace('<link rel="stylesheet" href="styles.css">', f'<style>\n{css}\n</style>')

    # Reemplazar carga de scripts externos por bloques inline verificados por hash CSP
    start_idx = html.find('<!-- Scripts')
    end_idx = html.find('</body>')

    if start_idx != -1 and end_idx != -1:
        inline_scripts = (
            "<!-- Scripts embebidos 100% offline verificados con SHA-256 CSP -->\n"
            f"  <script>{xlsx_js}</script>\n"
            f"  <script>{app_js}</script>\n"
        )
        html = html[:start_idx] + inline_scripts + html[end_idx:]

    output_path = 'rutina_gym_offline.html'
    with open(output_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(html)

    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"Archivo unico blindado generado con exito: {output_path} ({size_mb:.2f} MB)")

if __name__ == '__main__':
    bundle_single_file()
