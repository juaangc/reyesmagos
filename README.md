# Mi carta a los Reyes Magos · 2027

Una web estática en HTML, CSS y JavaScript, diseñada para publicarse directamente en GitHub Pages. No necesita servidor, base de datos, instalación de dependencias ni proceso de compilación.

## Archivos

- `index.html`: estructura y contenido de la carta.
- `styles.css`: diseño visual, responsive, animaciones y elementos decorativos CSS.
- `script.js`: nieve en canvas, efectos de scroll, renderizado de regalos y editor.
- `assets/favicon.svg`: favicon vectorial.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub, por ejemplo `mi-carta-reyes`.
2. Sube **todo el contenido** de esta carpeta a la raíz del repositorio. Debe quedar `index.html` en la raíz y la carpeta `assets` junto a él.
3. En el repositorio, entra en **Settings → Pages**.
4. En **Build and deployment**, elige **Deploy from a branch**.
5. Selecciona la rama `main` y la carpeta `/ (root)`, y pulsa **Save**.
6. Cuando termine la publicación, GitHub mostrará la dirección de tu web en esa misma sección.

También puedes editar los textos directamente en `index.html` y el aspecto en `styles.css` antes de subirlos.

## Cómo editar la lista de regalos

- En el pie de página hay una estrella pequeña. Haz clic para abrir el editor.
- También puedes abrirlo con `Ctrl + Shift + E` (en Mac, `⌘ + Shift + E`).
- Cada petición permite guardar nombre, emoji, varias marcas, notas y tantos enlaces como necesites.
- Los cambios se guardan automáticamente en el almacenamiento local del navegador.
- En el editor puedes descargar un JSON de copia de seguridad e importar esa copia más adelante.

## Importante sobre los datos

GitHub Pages sirve archivos estáticos, así que esta versión no tiene cuentas ni base de datos. Los regalos se guardan **solo en el navegador y dispositivo desde el que los edites**. No se sincronizan automáticamente con el móvil, otro ordenador ni con otros visitantes. Descarga una copia JSON con cierta frecuencia y guárdala fuera del navegador.

El acceso al editor es discreto, pero no es un sistema de autenticación: al ser una web estática pública, alguien que inspeccione el código puede encontrar cómo abrirlo. No guardes contraseñas ni información privada en las notas.

## Personalización rápida

- Cambia los textos de portada y despedida en `index.html`.
- Ajusta los colores al principio de `styles.css`, dentro de `:root`.
- Las ilustraciones de árbol, regalos, carta, luna y estrellas están hechas con CSS, por lo que no dependen de imágenes externas.
- La tipografía usa Google Fonts como mejora visual; si no carga, el sitio utiliza tipografías de sustitución.

## Accesibilidad y rendimiento

La web adapta sus columnas y controles a móvil, no usa librerías JavaScript externas y respeta la preferencia del sistema `prefers-reduced-motion` para reducir animaciones. La nieve se dibuja en un canvas ligero y se pausa cuando la pestaña deja de estar visible.
