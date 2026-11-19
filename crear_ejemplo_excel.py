import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

wb = openpyxl.Workbook()
ws = wb.active
ws.title = "Planificacion"

# Columnas exactas que solicitó el usuario (soportando Bloque / Blaque)
headers = ["Semana", "Sesion", "Bloque A", "Bloque B", "Bloque C", "RPE"]

data = [
    # Semana 1
    [1, "Dia 1", "Sentadilla trasera con barra 4x6", "Press banca plano 3x8\nRemo con barra 3x10", "Plancha abdominal 3x45s\nElevaciones de piernas 3x12", 7],
    [1, "Dia 2", "Peso muerto convencional 3x5", "Press militar con barra 3x8\nDominadas asistidas 3x8", "Paseo del granjero 3x30m\nFace pull en polea 3x15", 7.5],
    [1, "Dia 3", "Hip thrust con barra 4x8", "Press inclinado con mancuernas 3x10\nJalón al pecho agarre neutro 3x10", "Press pallof 3x12\nCurl de bíceps con barra 3x12", 7],

    # Semana 2
    [2, "Dia 1", "Sentadilla trasera con barra 4x6 (+2.5kg)", "Press banca plano 3x8\nRemo con barra 3x10", "Plancha abdominal 3x50s\nElevaciones de piernas 3x15", 7.5],
    [2, "Dia 2", "Peso muerto convencional 3x5 (+5kg)", "Press militar con barra 3x8\nDominadas 3x8", "Paseo del granjero 3x35m\nFace pull en polea 3x15", 8],
    [2, "Dia 3", "Hip thrust con barra 4x8 (+5kg)", "Press inclinado con mancuernas 3x10\nJalón al pecho agarre neutro 3x10", "Press pallof 3x12\nCurl de bíceps con barra 3x12", 7.5],

    # Semana 3
    [3, "Dia 1", "Sentadilla trasera con barra 4x5 (+5kg)", "Press banca plano 4x6\nRemo con barra 4x8", "Ab wheel rollout 3x10\nElevaciones de piernas 3x15", 8],
    [3, "Dia 2", "Peso muerto convencional 3x4 (+7.5kg)", "Press militar con barra 4x6\nDominadas lastradas 3x6", "Paseo del granjero 3x40m\nFace pull en polea 3x20", 8.5],
    [3, "Dia 3", "Hip thrust con barra 4x6 (+10kg)", "Press inclinado con mancuernas 4x8\nJalón al pecho agarre neutro 4x8", "Press pallof 3x15\nCurl martillo con mancuernas 3x12", 8],

    # Semana 4 (Descarga / Técnica)
    [4, "Dia 1", "Sentadilla trasera con barra 3x5 (carga ligera)", "Press banca plano 3x6\nRemo con mancuerna 3x8", "Plancha abdominal 3x30s", 6],
    [4, "Dia 2", "Peso muerto convencional 2x5 (carga ligera)", "Press militar con mancuernas 3x8\nJalón al pecho 3x10", "Face pull en polea 3x12", 6],
    [4, "Dia 3", "Hip thrust con barra 3x8 (carga ligera)", "Press banca con mancuernas 3x10\nRemo en polea baja 3x10", "Paseo del granjero 2x30m", 6],
]

# Estilos de encabezado
header_font = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")
header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
header_align = Alignment(horizontal="center", vertical="center", wrap_text=True)

thin_border = Border(
    left=Side(style='thin', color='CBD5E1'),
    right=Side(style='thin', color='CBD5E1'),
    top=Side(style='thin', color='CBD5E1'),
    bottom=Side(style='thin', color='CBD5E1')
)

ws.append(headers)
for col_num in range(1, len(headers) + 1):
    cell = ws.cell(row=1, column=col_num)
    cell.font = header_font
    cell.fill = header_fill
    cell.alignment = header_align
    cell.border = thin_border

for r_idx, row_data in enumerate(data, start=2):
    for c_idx, val in enumerate(row_data, start=1):
        cell = ws.cell(row=r_idx, column=c_idx, value=val)
        cell.font = Font(name="Segoe UI", size=10)
        cell.border = thin_border
        if c_idx in [1, 2, 6]:
            cell.alignment = Alignment(horizontal="center", vertical="center")
        else:
            cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)

# Ajuste de anchos
column_widths = {
    'A': 12,  # Semana
    'B': 14,  # Sesion
    'C': 35,  # Bloque A
    'D': 42,  # Bloque B
    'E': 38,  # Bloque C
    'F': 12,  # RPE
}

for col, width in column_widths.items():
    ws.column_dimensions[col].width = width

wb.save("planificacion_ejemplo.xlsx")
print("Archivo 'planificacion_ejemplo.xlsx' generado con exito.")
