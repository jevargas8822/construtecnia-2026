# Guía de Pruebas Pre-Evento: Flujo Completo
## Constructecnia 2026 (XXI Edición - ADEIC PUCP)

Sigue este protocolo de pruebas antes del evento para validar que el sistema funcione a la perfección en el auditorio B-100 con cientos de asistentes simultáneos.

---

### Preparación del Entorno de Prueba

1. Asegúrate de tener la aplicación desplegada en Vercel o ejecutándose localmente (`npm run dev`).
2. Ten a la mano:
   - 1 computadora o laptop para el staff (abierta en `/admin`).
   - 2 o más teléfonos celulares conectados a internet (WiFi o datos móviles) para simular asistentes.
   - Código QR fijo apuntando a `https://tu-dominio.vercel.app/asistencia`.

---

### Prueba 1: Estado Inicial sin Ponencia Abierta
1. En el celular, abre la URL `/asistencia` (o escanea el QR).
2. **Resultado esperado:**
   - Debe aparecer la tarjeta ámbar con el mensaje:
     > *"Ahora no hay ninguna ponencia abierta para registrar asistencia"*
   - El botón de envío debe mostrarse deshabilitado: *"Sin ponencia abierta"*.
   - El formulario no permite registrar asistencias fuera de horario.

---

### Prueba 2: Apertura de Ponencia y Detección Automática en Celular
1. En la pantalla del Staff (`/admin`), ingresa la contraseña configurada (`gemrauwu67`).
2. En la pestaña **"Control de Ponencias"**, busca la **Ponencia 1** y pulsa el botón grande verde **"ABRIR"**.
3. Observa la pantalla del celular que dejaste abierta en el paso anterior (sin recargar manualmente).
4. **Resultado esperado:**
   - En un máximo de 5 segundos, la tarjeta en el celular cambia automáticamente a azul marino y dorado con el distintivo **"EN VIVO"**.
   - Aparece el título oficial:
     > *"Ponencia 1: Innovación en Estructuras Sismorresistentes y Concreto de Alto Desempeño"*
   - El botón se activa en dorado: *"Registrar mi Asistencia"*.

---

### Prueba 3: Registro de Asistencia (Alumno PUCP y Almacenamiento Local)
1. En el Celular 1:
   - Selecciona **"Soy alumno PUCP"**.
   - Código de Alumno: Ingresa `20221234` (8 dígitos).
   - Correo electrónico: `juan.perez@pucp.edu.pe`.
   - Marca la casilla de consentimiento.
   - Pulsa **"Registrar mi Asistencia"**.
2. **Resultado esperado:**
   - Animación de carga breve (< 1 segundo).
   - Mensaje de confirmación:
     > *"¡Asistencia registrada para Ponencia 1: Innovación en Estructuras Sismorresistentes y Concreto de Alto Desempeño!"*
   - Muestra la fecha y hora exacta en zona horaria **America/Lima (UTC-5)**.
   - Se muestra el aviso: *"Tus datos se guardaron en este celular."*

---

### Prueba 4: Verificación Inmediata en el Monitor en Vivo del Staff
1. En el panel `/admin` del Staff:
2. **Resultado esperado:**
   - El contador superior en vivo de la Ponencia 1 aumenta de `0` a `1` automáticamente.
   - En la fila de la Ponencia 1, el contador de asistentes también marca `1`.

---

### Prueba 5: Validación Anti-Duplicados
1. En el mismo celular o abriendo una pestaña en incógnito con el mismo correo `juan.perez@pucp.edu.pe`:
2. Intenta registrar nuevamente asistencia para la misma Ponencia 1.
3. **Resultado esperado:**
   - El servidor rechaza la solicitud (código HTTP 409).
   - Se muestra un aviso en rojo claro:
     > *"Ya registraste tu asistencia en esta ponencia"*
   - La base de datos no duplica la fila gracias a la restricción `UNIQUE (correo, ponencia_id)`.

---

### Prueba 6: Registro de Asistente Externo (DNI)
1. En el Celular 2:
   - Selecciona **"No soy PUCP"**.
   - DNI: Ingresa `72345678` (8 dígitos).
   - Correo electrónico: `maria.gonzalez@gmail.com`.
   - Marca consentimiento y pulsa **"Registrar mi Asistencia"**.
2. **Resultado esperado:**
   - Registro exitoso.
   - En `/admin`, el contador de asistentes en vivo de la Ponencia 1 sube a `2`.

---

### Prueba 7: Transición Atómica entre Ponencias
1. En `/admin`, en la **Ponencia 2**, pulsa el botón verde **"ABRIR"**.
2. **Resultado esperado:**
   - La Ponencia 1 pasa automáticamente a estado **Cerrada** y se guarda su hora de cierre.
   - La Ponencia 2 pasa a estado **Abierta** y se guarda su hora de apertura.
   - En el monitor en vivo superior del staff, ahora se muestra en grande la **Ponencia 2**.
   - En los celulares de los asistentes, en la siguiente consulta automática (≤ 5 segundos) la pantalla se actualiza mostrando la Ponencia 2.
   - Al registrar asistencia en la Ponencia 2, los campos de correo, tipo y documento ya aparecen precargados en el celular, requiriendo solo pulsar el botón en menos de 5 segundos.

---

### Prueba 8: Simulación del Umbral para Certificados (≥ 4 Ponencias)
1. Para verificar el cálculo de certificados:
   - Registra al asistente `juan.perez@pucp.edu.pe` en las ponencias 1, 2, 3 y 4 (abriendo y registrando sucesivamente).
2. En el panel `/admin`, dirígete a la pestaña **"Certificados"**:
3. **Resultado esperado:**
   - Para `juan.perez@pucp.edu.pe`:
     - Columna Ponencias: `4 / 8`.
     - Detalle: `P1, P2, P3, P4`.
     - Estado Certificado: Distintivo verde **"APTO"**.
   - Si un asistente solo asistió a 2 ponencias, el estado mostrará en ámbar: *"Falta (2)"*.
   - El botón **"Filtrar Solo Aptos (≥ 4)"** oculta a quienes no alcanzan el mínimo.
   - Haz clic en **"Exportar Solo Aptos (≥ 4)"**: descarga un archivo CSV con UTF-8 BOM que se abre en Microsoft Excel sin problemas de tildes ni caracteres extraños.

---

### Prueba 9: Pestaña de Revisión de Seguridad
1. Para probar la detección de inconsistencias:
   - Abre la Ponencia 3.
   - En un celular, registra el DNI `72345678` con un correo diferente (`otro.correo@gmail.com`).
2. En `/admin`, ve a la pestaña **"Revisión"**:
3. **Resultado esperado:**
   - Se enciende una alerta roja con el número de casos sospechosos detectados.
   - Aparece en la tabla: *"Mismo Documento / Código con Correos Distintos"*, listando el documento `72345678` asociado a los 2 correos para que el staff de ADEIC decida si validar o descartar.

---

### Prueba 10: Bloqueo de Intentos Fallidos en el Login del Staff
1. Abre una ventana de incógnito y navega a `/admin/login`.
2. Introduce contraseñas incorrectas 5 veces seguidas.
3. **Resultado esperado:**
   - Al 5to intento fallido, el sistema bloquea inmediatamente la dirección IP:
     > *"Demasiados intentos incorrectos. El acceso desde tu dirección IP ha sido bloqueado por 10 minutos."*
   - Incluso ingresando la contraseña correcta durante los siguientes 10 minutos, el acceso permanecerá denegado protegiendo el sistema contra ataques de fuerza bruta.

---

### Conclusión de Pruebas
Si las 10 pruebas se completan con éxito, el sistema está **100% listo y validado** para operar en vivo durante los días 23 y 24 de noviembre de 2026 en el auditorio B-100 PUCP.
