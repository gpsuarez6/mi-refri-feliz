# Mi Refri Feliz

PWA móvil para administrar el refrigerador, la despensa y los artículos de aseo del hogar.

## Funciones

- Secciones de inventario totalmente administrables
- Crear, renombrar y eliminar secciones como Refrigerador, Despensa, Congelador, Frutas y verduras o Aseo
- Productos existentes o faltantes
- Lista de compras automática
- Cantidades, unidades y precios estimados en CLP
- Total pendiente y control de compra
- Edición y eliminación de productos
- Respaldo e importación de datos en JSON
- Copias automáticas en almacenamiento independiente y recuperación de versiones anteriores
- Funcionamiento sin conexión
- Instalable en iPhone y Android

Los datos se guardan solamente en el navegador del dispositivo mediante `localStorage`.

## Uso local

Sirve esta carpeta con cualquier servidor HTTP, por ejemplo:

```bash
python -m http.server 8080
```

Luego abre `http://localhost:8080`.

## Publicación

El flujo de GitHub Actions incluido publica el sitio estático mediante GitHub Pages.\n\nSitio: https://gpsuarez6.github.io/mi-refri-feliz/
