# INVERNADERO ESPACIAL

## LA HISTORIA

Una colonia de investigadores trabajaba en Marte cuando llegó la noticia: el cohete de suministros fue impactado por un meteorito y no llegará al planeta rojo. La próxima entrega tardará 6 meses. Los tripulantes tienen reservas para apenas un mes.

Un astronauta e ingeniero agropecuario toma la iniciativa: construir una huerta hidropónica dentro de la base para mantener viva a la colonia hasta que lleguen los refuerzos.

## OBJETIVO

Sobrevivir 180 días administrando los recursos de la base espacial. El jugador empieza con recursos limitados y debe gestionarlos estratégicamente para mantener vivos a los 30 tripulantes.

Si la comida se agota o el oxígeno falla, la misión termina en derrota.

## CÓMO SE JUEGA

### Recursos
La base cuenta con 5 recursos principales:
- **Agua** — necesaria para las plantas y los tripulantes
- **Oxígeno** — vital para la supervivencia de la tripulación
- **Energía** — alimenta los módulos de cultivo
- **Nutrientes** — necesarios para el crecimiento de las plantas
- **Comida** — se consume diariamente. Si llega a 0, los tripulantes empiezan a morir

### Módulos de cultivo
Los módulos son los invernaderos donde crecen las plantas. Para crearlos gastás recursos de la base. Cada módulo tiene nivel, capacidad de bloques y estado. Si no los mantenés, entran en estado crítico y las plantas mueren.

### Plantas
Cada planta consume recursos diariamente y produce comida y oxígeno. Cuando llega su tiempo de cosecha, podés cosecharla para obtener agua y comida extra. Hay 5 especies disponibles, cada una con distintos requerimientos y recompensas, que se desbloquean según tu nivel.

### Avanzar el día
Cada vez que avanzás un día ocurre lo siguiente:
- Las plantas consumen recursos de sus módulos
- Los tripulantes consumen comida, agua y oxígeno
- Puede ocurrir un evento aleatorio (tormenta de arena, fuga de tanques, etc.)
- Si las plantas tienen suficientes recursos, crecen y eventualmente están listas para cosechar

### Centro de eventos
Marte es hostil. Cada día hay una probabilidad de que ocurra un evento que afecte los recursos de la base. Desde el Centro de Eventos podés:
- **Bloquear** un evento negativo por 15 días gastando energía
- **Modificar** los efectos de un evento existente gastando recursos (máximo 1 vez por evento, reducción máxima del 50%)
- **Sintetizar** hasta 3 eventos positivos propios gastando recursos

### Sistema de niveles
Cada 10 cosechas subís de nivel. Al subir de nivel recibís recursos adicionales y se desbloquean nuevas especies de plantas.

### Condiciones
- **Victoria:** llegar al día 180 con al menos un tripulante vivo
- **Derrota:** que todos los tripulantes mueran por falta de comida u oxígeno

## CAPTURAS DE PANTALLA

### Pantalla principal
![Panel principal](docs/capturas/panel-principal.png)

### Crear módulo
![Crear módulo](docs/capturas/crear-modulo.png)

### Catálogo de semillas
![Catálogo de semillas](docs/capturas/catalogo-semillas.png)

### Estado de recursos
![Estado de recursos](docs/capturas/estado-recursos.png)

### Centro de eventos
![Centro de eventos](docs/capturas/centro-eventos.png)

### Partida perdida
![Partida perdida](docs/capturas/partida-perdida.png)

### Partida ganada
![Partida ganada](docs/capturas/partida-ganada.png)

## CÓMO LEVANTAR EL PROYECTO

### Requisitos
- Docker instalado

### Pasos

**1. Clonar el repositorio**
```bash
git clone git@github.com:matiasdiaz912/TP---Invernadero.git
cd TP---Invernadero
```

**2. Levantar con Docker Compose**
```bash
docker compose up --build
```

Esto levanta automáticamente la base de datos, el backend y el frontend.

**3. Abrir el juego**

Ingresar a `http://localhost:8080/inicio.html` en el navegador.

**4. Detener el proyecto**
```bash
docker compose down
```

**5. Reiniciar desde cero**
```bash
docker compose down -v
docker compose up --build
```

## AUTORES

- Santiago Buldorini
- Matias Díaz
- Lisandro Lucero