import rxCervicalImg from '../assets/images/rx_cervical_lateral_1791388476879.jpg';
import rmnLumbarImg from '../assets/images/rmn_lumbar_sagital_1791388492095.jpg';
import rxEscoliosisImg from '../assets/images/rx_escoliosis_ap_1791388505857.jpg';
import {
  ConsultationRecord,
  DoctorProfile,
  PatientRecord,
} from '../types/wireframeTypes';

export const INITIAL_DOCTOR_PROFILE: DoctorProfile = {
  nombre: 'Juan Antonio Villalba',
  matriculaProfesional: 'MP 542',
  email: 'juan.villalba@atlasquiropraxia.com',
  clinica: 'ATLAS Columna Vertebral — Juan Antonio Villalba (MP 542)',
  telefono: '+54 387 481-6999',
  emergencias: '+54 387 481-6999',
  ciudad: 'Salta, Argentina',
  twoFactorEnabled: false,
  darkMode: false,
};

export const INITIAL_PATIENTS: PatientRecord[] = [
  {
    id: 'pat-juan',
    nombre: 'Juan',
    apellidos: 'García López',
    nombreCompleto: 'Juan García',
    fechaNacimiento: '1995-04-12',
    edad: 29,
    genero: 'Masculino',
    perfilGrupo: 'ADULTO',
    profesion: 'Contador',
    ciudad: 'Salta',
    telefono: '+54 387 455-1201',
    email: 'juan.garcia@email.com',
    ultimaCita: 'Hoy',
    proximaCita: 'Oct 17',
    estado: 'Mejorando',
    horasSedentarioDia: 8,
    horasComputadoraDia: 7,
    horasSmartphoneDia: 5,
    diccionarioCliente: [
      'Cintura trabada al levantarme de la silla',
      'Pinchazo lumbar derecho al agacharme',
      'Pesadez en pierna tras cierres contables',
    ],
  },
  {
    id: 'pat-maria',
    nombre: 'María',
    apellidos: 'López',
    nombreCompleto: 'María López',
    fechaNacimiento: '1979-08-22',
    edad: 45,
    genero: 'Femenino',
    perfilGrupo: 'MUJER_ADULTA',
    profesion: 'Profesora',
    ciudad: 'Salta',
    telefono: '+54 387 488-3410',
    email: 'maria.lopez@email.com',
    ultimaCita: 'Oct 5',
    proximaCita: 'Oct 19',
    estado: 'Tratamiento',
    horasSedentarioDia: 6,
    horasComputadoraDia: 5,
    horasSmartphoneDia: 4,
    diccionarioCliente: [
      'Mochila de plomo en los hombros',
      'Dolor de nuca que sube a la sien al corregir',
      'Doble jornada escuela y casa sin pausa',
    ],
  },
  {
    id: 'pat-carlos',
    nombre: 'Carlos',
    apellidos: 'Mendez',
    nombreCompleto: 'Carlos Mendez',
    fechaNacimiento: '2012-06-15',
    edad: 12,
    genero: 'Masculino',
    perfilGrupo: 'NIÑO',
    profesion: 'Estudiante',
    ciudad: 'Salta',
    telefono: '+54 387 512-9088',
    email: 'carlos.mendez.tutor@email.com',
    ultimaCita: 'Oct 8',
    proximaCita: 'Oct 22',
    estado: 'Seguimiento',
    horasSedentarioDia: 6,
    horasComputadoraDia: 3,
    horasSmartphoneDia: 4,
    diccionarioCliente: [
      'Hombro derecho más alto en las fotos',
      'Mochila escolar muy pesada a la salida',
      'Se encorva jugando con el celular en la cama',
    ],
  },
];

export const INITIAL_CONSULTATIONS: ConsultationRecord[] = [
  {
    id: 'cons-001',
    pacienteId: 'pat-juan',
    pacienteNombre: 'Juan García',
    pacienteEdad: 29,
    pacienteGenero: 'Masculino',
    perfilGrupo: 'ADULTO',
    pacienteProfesion: 'Contador',
    pacienteCiudad: 'Salta',
    fechaConsulta: 'Martes, 10 de Octubre de 2024',
    estadoConsulta: 'Mejorando',
    patologiaFiltro: 'Síndrome facetario lumbar L4-L5',
    diccionarioCliente: [
      'Cintura trabada al levantarme de la silla',
      'Pinchazo lumbar derecho al agacharme',
      'Pesadez en pierna tras cierres contables',
    ],
    anamnesis: {
      profesion: 'Contador',
      ciudad: 'Salta',
      horasSedentarioDia: 8,
      horasComputadoraDia: 7,
      horasSmartphoneDia: 5,
      problemaDeHoy:
        'Dolor en la espalda baja desde hace 3 meses de evolución, originado por sedentarismo y largo tiempo frente a computadora (8h/día). Refiere dolor tipo mecánico que mejora con reposo.',
      duracionAudioSegundos: 35,
      antecedentes: {
        escoliosis: false,
        cifosis: false,
        lordosis: true,
        asma: false,
        tiroides: false,
        otrosTexto: 'Sedentarismo laboral frente a PC',
        asimetriaPiernas: 'Acortamiento funcional derecho 6 mm',
        desviacionCadera: true,
        gradoEscoliosis: 'No aplica',
      },
      contextoAdulto: {
        tipoTrabajo: 'oficina',
        distanciaPantallaCm: 55,
        deporteActual: 'Fútbol 5 ocasional (1 vez cada 15 días sin calentamiento)',
        deporteInfancia: 'Básquetbol escolar hasta los 16 años',
        soportesPosturales: 'Silla de oficina estándar sin soporte lumbar',
      },
      actividadesDiarias: [
        {
          nombre: 'Auditoría y carga de planillas en doble monitor',
          duracionDiaria: '7 a 8 horas',
          posturaInvolucrada: 'Sedestación con pelvis en retroversión y tronco inclinado adelante',
          repeticionesCarga: 'Estático continuo sin pausas por más de 3 horas',
          equipamiento: 'Escritorio bajo y notebook secundaria lateralizada',
        },
        {
          nombre: 'Conducción en automóvil al estudio contable',
          duracionDiaria: '1.5 horas',
          posturaInvolucrada: 'Asiento reclinado sin apoyo sacro',
          repeticionesCarga: 'Embrague y giro cervical en tráfico',
          equipamiento: 'Vehículo sedán compacto',
        },
      ],
    },
    evaluacionClinica: {
      duracionGrabacionSegundos: 135,
      notasTiempoReal: [
        'Postura: Lordosis lumbar acentuada',
        'Hombros: Asimetría derecha elevada',
        'Cadera: Inclinación anterior',
        'Dolor a la palpación L4-L5',
        'Restricción de flexión: 30°',
        'Fuerza glúteos: 4/5',
      ],
      pruebasRealizadas: {
        posturaEnPie: true,
        movilidad: true,
        fuerza: false,
        neurologico: false,
        camillaSupino: true,
        cadera: true,
        palpacion: false,
        especiales: false,
      },
      tablaResultadosFisicos: [
        { prueba: 'Flexión anterior', resultado: '30°' },
        { prueba: 'Fuerza glúteos', resultado: '4/5' },
        { prueba: 'Cadera abd.', resultado: 'Normal' },
        { prueba: 'Test de Thomas (Psoas)', resultado: 'Acortamiento (+)' },
        { prueba: 'Test de Ober (Banda IT)', resultado: 'Tensión der. (+)' },
      ],
      sintomaEspecifico: {
        localizacionZona: 'Lumbar (L1-L5)',
        inicio: 'Gradual',
        intensidadEva: 8,
        tipoDolor: 'Mecánico opresivo con punzada al extender desde sedestación',
        irradiacionTerritorio: 'Glúteo derecho y cara posterior alta de muslo (recorrido ciático proximal)',
        impactoFuncional: 'Dificultad para permanecer sentado >45 min y levantarse rápido',
      },
      pruebaPsicologica: {
        actitud: 'Colaborador',
        humor: 'Ansioso',
        eventosVitales: 'Pico de estrés por vencimientos impositivos anuales',
        medicacionPsicotropa: 'Ninguno (solo AINE ocasional)',
        implicacionClinica: 'Tensión muscular paravertebral aumentada por hiperactividad simpática laboral.',
      },
      maniobrasEjeCadera: {
        observacionDePie:
          'Basculación pélvica anterior con ascenso ilíaco derecho y sobrecarga compensatoria en charnela lumbosacra.',
        evaluacionCamilla:
          'En supino: acortamiento de psoas-ilíaco derecho (Test de Thomas +). En prono: restricción de extensión segmentaria L4-L5 y rotación interna de cadera derecha limitada.',
        ejeCaderaCentroGravedad:
          'EJE CADERA PRIMARIO: El bloqueo en anteversión ilíaca derecha desplaza el centro de gravedad hacia adelante, obligando a L4-L5 a hiperextenderse y comprimir sus facetas.',
        relatoNervioCiatico:
          'Durante la palpación de L4-L5 y glúteo profundo (piramidal), se explica al paciente cómo las raíces L4-S3 forman el nervio ciático que desciende de la cintura al pie, correlacionando la presión pélvica con su molestia glútea.',
        tonoMuscular: 'Hipertonía defensiva en cuadrado lumbar derecho e hipotonía de glúteo medio (4/5).',
      },
    },
    imagenes: {
      estudioSeleccionadoId: 'rad-1',
      zoom: 1.0,
      brillo: 100,
      contraste: 105,
      estudiosHistorial: [
        {
          id: 'rad-1',
          etiquetaCorta: 'Rad1',
          fechaCorta: 'Oct 8',
          estudio: 'Radiografía / RMN',
          fechaCompleta: 'Oct 8, 2024',
          region: 'Lumbar',
          tecnica: 'RP (Frente / Sagital)',
          corteOrientacion: 'Sagital (Lateral)',
          imageUrl: rmnLumbarImg,
          hallazgos: [
            { texto: 'Rectificación L-dorsal', activo: true },
            { texto: 'Listesis L4-L5 (Gr.1)', activo: true },
            { texto: 'Osteofitos L5-S1', activo: true },
            { texto: 'Deshidratación discal L4-L5 Pfirrmann II-III', activo: true },
          ],
          impresion:
            'Cambios degenerativos moderados. Compatible con antecedentes clínicos.',
          anotacionesMedico:
            'Se señala rectificación L-dorsal, listesis anterior L4-L5 grado I (10% Meyerding) y altura discal L4-L5 levemente reducida.',
          trazosDibujo: [
            {
              x1: 42,
              y1: 58,
              x2: 58,
              y2: 60,
              tipo: 'regla',
              etiqueta: 'L4-L5 (Gr.1)',
            },
          ],
        },
        {
          id: 'rad-2',
          etiquetaCorta: 'Rad2',
          fechaCorta: 'Sep20',
          estudio: 'Radiografía',
          fechaCompleta: 'Sep 20, 2024',
          region: 'Cervical / Dorsal',
          tecnica: 'Lateral Neutro',
          corteOrientacion: 'Sagital (Lateral)',
          imageUrl: rxCervicalImg,
          hallazgos: [
            { texto: 'Rectificación L-dorsal', activo: true },
            { texto: 'Tensión suboccipital C1-C2', activo: true },
          ],
          impresion: 'Compensación cervical alta por postura frente a monitor.',
          anotacionesMedico: 'Control de alineación sagital.',
          trazosDibujo: [],
        },
        {
          id: 'rad-3',
          etiquetaCorta: 'Rad3',
          fechaCorta: 'Aug15',
          estudio: 'Espinograma',
          fechaCompleta: 'Aug 15, 2024',
          region: 'Columna Total',
          tecnica: 'AP Bipedestación',
          corteOrientacion: 'Coronal (Frontal AP)',
          imageUrl: rxEscoliosisImg,
          hallazgos: [
            { texto: 'Inclinación pélvica 4°', activo: true },
            { texto: 'Asimetría acromial derecha', activo: true },
          ],
          impresion: 'Actitud funcional postural.',
          anotacionesMedico: 'Evaluación panorámica inicial.',
          trazosDibujo: [],
        },
      ],
      diagnosticoDiferencialVisual: {
        confirmada:
          'Síndrome facetario L4-L5 con anterolistesis grado I (Meyerding <15%) y desbalance de eje pélvico-cadera.',
        probable:
          'Irritación mecánico-miofascial del nervio ciático proximal por hipertonía de piramidal y psoas.',
        descartada:
          'Extrusión discal masiva o estenosis severa de canal central (descartada en corte sagital).',
        noVisible:
          'Microinestabilidad ligamentaria dinámica en flexión extrema (requeriría RX funcional si persistiera dolor).',
        impactoFuncionalPronostico:
          'Excelente pronóstico funcional reversible al descomprimir L4-L5, liberar psoas/cadera y fortalecer glúteos.',
      },
    },
    protocolo: {
      diagnosticoPrincipal: 'Síndrome facetario lumbar L4-L5',
      diagnosticoSecundario: 'Secundario a rectificación L-dorsal y desbalance del eje de cadera',
      etiologia:
        'Sedentarismo laboral prolongado + uso excesivo de pantallas + debilidad muscular de estabilizadores de cadera/core',
      fase1: {
        titulo: 'FASE 1: Alivio agudo (4 semanas)',
        ajustes: '2x/semana (L4-L5, sacro y eje de cadera)',
        complementos: 'Taping, hielo, liberación de psoas',
        restriccion: 'Evitar flexión extrema y pesos >10 kg',
      },
      fase2: {
        titulo: 'FASE 2: Fortalecimiento (8 semanas)',
        ajustes: '1x/semana',
        ejercicios: '3x/semana (glúteos, core, movilidad de cadera)',
        ergonomia: 'Ajustes en oficina (silla, monitor a 75 cm, pausas c/45m)',
      },
      fase3: {
        titulo: 'FASE 3: Prevención (mantenimiento)',
        ajustes: '1x/mes',
        ejerciciosCasa: '5x/semana',
        educacion: 'Posturas correctas e higiene de columna',
      },
      fase4: {
        titulo: 'FASE 4: Optimización Funcional y Deportiva',
        optimizacionRendimiento:
          'Retorno seguro al deporte recreativo con activación previa de cadera y core.',
        integracionNeuromuscular:
          'Patrón de bisagra de cadera automatizado y postura normolordótica estable.',
      },
      objetivosCortoPlazo: [
        'Dolor: 8→4 (escala)',
        'Flexión: 30→60°',
        'Trabajar sin dolor',
        'Comprender su condición',
      ],
      objetivosMedianoPlazo: [
        'Eliminar dolor agudo',
        'Recuperar función completa',
        'Fortalecimiento muscular 5/5',
        'Independencia de tratamiento',
      ],
      objetivosLargoPlazo: [
        'Mantener sin recaídas',
        'Fuerza: 5/5 (glúteos)',
        'Postura normolordótica',
        'Seguimiento periódico preventivo',
      ],
      proximaCitaFechaHora: 'Martes, 17 de Octubre de 2024 - 10:00 AM',
      signosProgresoSemanas: {
        semana1a2:
          'Disminución del bloqueo matutino ("cintura trabada") y reducción de dolor agudo de 8/10 a 5/10.',
        semana3a4:
          'Aumento de flexión anterior a 60° sin pinchazo lumbar y tolerancia de 2 horas sentado con pausa.',
        semana5a8:
          'Fuerza de glúteo medio y mayor en 5/5, ausencia de irradiación glútea y control lumbopélvico activo.',
        semana9a12:
          'Estabilidad completa en jornada laboral y retorno progresivo a actividad deportiva sin recaídas.',
      },
      razonamientoMedico: {
        porQuePatologia:
          'La sedestación de 8h/día genera retracción del psoas-ilíaco e inhibición glútea; al ponerse de pie, la pelvis cae en anteversión asimétrica sobrecargando las facetas de L4-L5.',
        diferencialesDescartados:
          'Se descarta hernia extruida quirúrgica por ausencia de déficit motor distal y canal central permeable en RMN.',
        riesgosContraindicaciones:
          'Por anterolistesis grado I L4-L5, evitar manipulaciones rotacionales bruscas en hiperextensión sobre L4; priorizar descompresión axial y ajuste de pelvis/sacro.',
        puntosContactoDireccionAjuste:
          'Contacto en tuberosidad isquiática/ilíaco derecho (vector P-A con Drop pélvico) + descompresión facetaria L4-L5 en flexión-distracción.',
        criteriosAlta:
          'EVA ≤ 1/10 sostenido por 4 semanas, flexión anterior ≥ 80° indolora y fuerza glútea 5/5 bilateral.',
      },
    },
    transcripcionCharla: `[00:02] Juan Antonio Villalba (MP 542): Buen día, adelante. Contame primero tu nombre completo, tu edad y a qué te dedicás acá en Salta.
[00:10] Paciente: Hola Juan Antonio, mi nombre es Juan García López, tengo 29 años, soy contador y vivo acá en Salta capital.
[00:19] Juan Antonio Villalba (MP 542): Bien Juan. ¿Cuántas horas por día estás sentado frente a la computadora y con el celular, y qué es lo que más te molesta hoy?
[00:28] Paciente: Estoy sentado unas 8 horas por día, 7 horas frente a las pantallas de la computadora y unas 5 horas con el celular. Hace 3 meses siento la cintura trabada al levantarme de la silla y un pinchazo lumbar derecho al agacharme que me baja como pesadez al glúteo.
[00:48] Juan Antonio Villalba (MP 542): Perfecto, ponete de pie frente a la cámara y ahora pasá a la camilla. Mirá, aunque sientas el dolor en L4-L5, acá evaluamos el eje principal que es tu cadera, tu centro de gravedad. Tenés una anteversión ilíaca derecha con acortamiento del psoas (Test de Thomas positivo) y una flexión anterior limitada a 30°. Mientras te palpo acá en la cintura y el glúteo, te explico: el nervio ciático sale de tu cintura y baja hasta el pie; al estar rotada la cadera por tantas horas sentado, comprime L4-L5 e irrita el recorrido proximal.`,
    informeCompletoCharla: {
      tituloInforme:
        'INFORME CLÍNICO INTEGRAL DE CONSULTA Y TRANSCRIPCIÓN — JUAN ANTONIO VILLALBA (MP 542)',
      resumenConversacion:
        'Durante la entrevista clínica en vivo con cámara y micrófono activos, el paciente Juan García López (29 años, Masculino, Contador en Salta) relata 3 meses de evolución de lumbalgia mecánica derecha ("cintura trabada al levantarse" y "pinchazo al agacharse"). Se documenta sedentarismo de 8 h/día (7 h en PC, 5 h en smartphone).',
      anamnesisNarrativa:
        'Paciente adulto joven con alta carga estática frente a doble monitor sin soporte lumbar. Presenta hiperlordosis compensatoria y acortamiento funcional derecho de 6 mm con desviación del eje pélvico.',
      correlacionBiomecanicaEjeCadera:
        'Juan Antonio Villalba (MP 542) evalúa el eje de cadera como centro de gravedad primario: la retracción del psoas-ilíaco derecho por sedestación prolongada bloquea la pelvis en anteversión, sobrecargando las facetas de L4-L5 (con listesis grado I en imagen) y generando irritación miofascial proximal sobre el recorrido del nervio ciático.',
      planTerapeuticoDetallado:
        'Se indica protocolo en 4 fases: Fase 1 (4 sem) ajustes quiroprácticos 2x/semana en eje de cadera, sacro y L4-L5; Fase 2 (8 sem) fortalecimiento de glúteos y core 3x/semana (Glute Bridge, Bird Dog, Cat-Cow) y ergonomía de oficina; Fase 3 prevención mensual; Fase 4 optimización deportiva.',
    },
    seguimientos: [
      {
        id: 'seg-jg-1',
        fecha: '2024-09-25',
        dolorEva: 8,
        flexionGrados: 30,
        fuerzaGluteos: '4/5',
        notaProgreso: 'Evaluación basal de ingreso con limitación en flexión lumbar.',
      },
      {
        id: 'seg-jg-2',
        fecha: '2024-10-03',
        dolorEva: 6,
        flexionGrados: 45,
        fuerzaGluteos: '4/5',
        notaProgreso: 'Mejoría inicial tras ajustes facetarios L4-L5 y liberación de cadera.',
      },
      {
        id: 'seg-jg-3',
        fecha: '2024-10-10',
        dolorEva: 4,
        flexionGrados: 60,
        fuerzaGluteos: '4+/5',
        notaProgreso: 'Cumple objetivos de corto plazo; tolera jornada en oficina con pausas.',
      },
    ],
  },
  {
    id: 'cons-002',
    pacienteId: 'pat-maria',
    pacienteNombre: 'María López',
    pacienteEdad: 45,
    pacienteGenero: 'Femenino',
    perfilGrupo: 'MUJER_ADULTA',
    pacienteProfesion: 'Profesora',
    pacienteCiudad: 'Salta',
    fechaConsulta: 'Sábado, 5 de Octubre de 2024',
    estadoConsulta: 'Tratamiento',
    patologiaFiltro: 'Cervicalgia postural y rectificación C2-C7',
    diccionarioCliente: [
      'Mochila de plomo en los hombros',
      'Dolor de nuca que sube a la sien al corregir',
      'Doble jornada escuela y casa sin pausa',
    ],
    anamnesis: {
      profesion: 'Profesora',
      ciudad: 'Salta',
      horasSedentarioDia: 6,
      horasComputadoraDia: 5,
      horasSmartphoneDia: 4,
      problemaDeHoy:
        'Tensión cervical bilateral con cefalea al corregir exámenes y permanecer de pie frente al pizarrón.',
      duracionAudioSegundos: 28,
      antecedentes: {
        escoliosis: false,
        cifosis: true,
        lordosis: false,
        asma: false,
        tiroides: true,
        otrosTexto: 'Hipotiroidismo controlado con Levotiroxina + Bruxismo leve',
        asimetriaPiernas: '4 mm funcional izquierda',
        desviacionCadera: true,
      },
      contextoMujer: {
        cantidadHijos: 2,
        actividadesAdicionales: 'Docencia en 2 colegios + gestión integral del hogar',
        nivelSobrecarga1a10: 8,
        actividadPostParto: 'Caminata ocasional, sin rehabilitación de core post-parto',
        pesoActualKg: 64,
      },
    },
    evaluacionClinica: {
      duracionGrabacionSegundos: 110,
      notasTiempoReal: [
        'Postura: Antepulsión de cabeza y cifosis dorsal alta',
        'Hombros: Elevación defensiva bilateral',
        'Cadera: Rotación pélvica derecha compensatoria',
        'Dolor a la palpación C1-C2 y C5-C6',
        'Restricción de rotación derecha: 55°',
      ],
      pruebasRealizadas: {
        posturaEnPie: true,
        movilidad: true,
        fuerza: true,
        neurologico: true,
        camillaSupino: true,
        cadera: true,
        palpacion: true,
        especiales: true,
      },
      tablaResultadosFisicos: [
        { prueba: 'Rotación cervical der.', resultado: '55°' },
        { prueba: 'Fuerza deltoides/bíceps', resultado: '5/5' },
        { prueba: 'Distracción cervical', resultado: 'Alivio (+)' },
        { prueba: 'Movilidad cadera izq.', resultado: 'Restringida' },
      ],
      maniobrasEjeCadera: {
        observacionDePie: 'Inclinación pélvica que proyecta el tórax y la cabeza hacia adelante.',
        evaluacionCamilla: 'Tensión iliopsoas y restricción sacroilíaca izquierda.',
        ejeCaderaCentroGravedad:
          'Aunque consulta por dolor cervical y cefalea, se corrige primero la base pélvica/cadera para alinear la plomada dorsal y descargar C1-C7.',
        relatoNervioCiatico:
          'Se educa sobre la conexión entre el apoyo pélvico al dar clases de pie y la sobrecarga ascendente hacia el cuello.',
        tonoMuscular: 'Puntos gatillo activos en trapecio superior, elevador de la escápula y suboccipitales.',
      },
    },
    imagenes: {
      estudioSeleccionadoId: 'rad-m1',
      zoom: 1.0,
      brillo: 100,
      contraste: 105,
      estudiosHistorial: [
        {
          id: 'rad-m1',
          etiquetaCorta: 'Rad1',
          fechaCorta: 'Oct 5',
          estudio: 'Radiografía Cervical',
          fechaCompleta: 'Oct 5, 2024',
          region: 'Cervical',
          tecnica: 'Perfil Neutro',
          corteOrientacion: 'Sagital (Lateral)',
          imageUrl: rxCervicalImg,
          hallazgos: [
            { texto: 'Rectificación cervical C2-C7', activo: true },
            { texto: 'Disminución espacio C5-C6', activo: true },
          ],
          impresion: 'Rectificación de lordosis cervical funcional.',
          anotacionesMedico: 'Alineación de Atlas C1 y charnela C7-T1 prioritaria.',
          trazosDibujo: [],
        },
      ],
    },
    protocolo: {
      diagnosticoPrincipal: 'Síndrome cervical postural C1-C2 / C5-C6',
      diagnosticoSecundario: 'Secundario a rectificación cervical y sobrecarga de roles (docencia + hogar)',
      etiologia: 'Flexión cervical sostenida en corrección + desbalance ascendente desde pelvis',
      fase1: {
        titulo: 'FASE 1: Alivio agudo (4 semanas)',
        ajustes: '2x/semana (Atlas C1, C7-T1 y nivelación de cadera)',
        complementos: 'Liberación suboccipital, calor húmedo',
        restriccion: 'Evitar lectura con cuello flexionado',
      },
      fase2: {
        titulo: 'FASE 2: Fortalecimiento (8 semanas)',
        ajustes: '1x/semana',
        ejercicios: '3x/semana (flexores profundos, romboides, puente glúteo)',
        ergonomia: 'Atril de lectura a nivel visual y pausas entre horas de clase',
      },
      fase3: {
        titulo: 'FASE 3: Prevención (mantenimiento)',
        ajustes: '1x/mes',
        ejerciciosCasa: '5x/semana',
        educacion: 'Ergonomía en tareas domésticas y escolares',
      },
      objetivosCortoPlazo: [
        'Dolor: 7→3 (escala)',
        'Rotación cervical: 55→80°',
        'Dar clases sin cefalea',
      ],
      objetivosMedianoPlazo: [
        'Eliminar contracturas recurrentes',
        'Recuperar lordosis funcional',
      ],
      objetivosLargoPlazo: [
        'Mantener sin recaídas durante el ciclo lectivo',
        'Postura cervical balanceada',
      ],
      proximaCitaFechaHora: 'Sábado, 19 de Octubre de 2024 - 11:00 AM',
    },
    seguimientos: [
      {
        id: 'seg-ml-1',
        fecha: '2024-10-05',
        dolorEva: 7,
        flexionGrados: 55,
        fuerzaGluteos: '5/5',
        notaProgreso: 'Primera sesión completada con alivio suboccipital inmediato.',
      },
    ],
  },
  {
    id: 'cons-003',
    pacienteId: 'pat-carlos',
    pacienteNombre: 'Carlos Mendez',
    pacienteEdad: 12,
    pacienteGenero: 'Masculino',
    perfilGrupo: 'NIÑO',
    pacienteProfesion: 'Estudiante',
    pacienteCiudad: 'Salta',
    fechaConsulta: 'Martes, 8 de Octubre de 2024',
    estadoConsulta: 'Seguimiento',
    patologiaFiltro: 'Actitud escoliótica juvenil toracolumbar',
    diccionarioCliente: [
      'Hombro derecho más alto en las fotos',
      'Mochila escolar muy pesada a la salida',
      'Se encorva jugando con el celular en la cama',
    ],
    anamnesis: {
      profesion: 'Estudiante',
      ciudad: 'Salta',
      horasSedentarioDia: 6,
      horasComputadoraDia: 3,
      horasSmartphoneDia: 4,
      problemaDeHoy:
        'Evaluación preventiva de crecimiento de columna vertebral: asimetría de hombros y fatiga en espalda media tras llevar mochila escolar pesada y uso de pantallas.',
      duracionAudioSegundos: 22,
      antecedentes: {
        escoliosis: true,
        cifosis: false,
        lordosis: false,
        asma: true,
        tiroides: false,
        otrosTexto: 'En etapa de estirón puberal — control preventivo de crecimiento',
        asimetriaPiernas: '6 mm funcional por torsión ilíaca',
        desviacionCadera: true,
        gradoEscoliosis: '12° Cobb toracolumbar funcional',
      },
      contextoNino: {
        horasClaseDia: 6,
        posturaEscolar: 'Pupitre bajo con inclinación lateral derecha al escribir',
        deportesActuales: 'Fútbol infantil 2x/semana',
        deportesInfancia: 'Natación recreativa de los 6 a 9 años',
        pesoMochilaKg: 5.8,
        posturasHabituales: 'Uso de celular acostado en cama con flexión cervical de 45°',
      },
    },
    evaluacionClinica: {
      duracionGrabacionSegundos: 95,
      notasTiempoReal: [
        'Postura: Actitud escoliótica leve toracolumbar',
        'Hombros: Desnivel acromial de 8 mm',
        'Cadera: Basculación pélvica funcional',
        'Test de Adams: 5° ATR',
      ],
      pruebasRealizadas: {
        posturaEnPie: true,
        movilidad: true,
        fuerza: true,
        neurologico: false,
        camillaSupino: true,
        cadera: true,
        palpacion: true,
        especiales: true,
      },
      tablaResultadosFisicos: [
        { prueba: 'Test de Adams (ATR)', resultado: '5°' },
        { prueba: 'Fuerza paravertebral', resultado: '4+/5' },
        { prueba: 'Nivelación pélvica', resultado: 'Asimetría 6mm' },
      ],
      maniobrasEjeCadera: {
        observacionDePie: 'Oblicuidad pélvica infantil que induce curva compensatoria dorsal.',
        evaluacionCamilla: 'Al nivelar ambas caderas en decúbito, la curva toracolumbar corrige un 65%.',
        ejeCaderaCentroGravedad:
          'En el niño en crecimiento, nivelar el eje de cadera y sacro es indispensable para que las placas de crecimiento vertebral reciban carga simétrica.',
        relatoNervioCiatico:
          'Se explica de forma didáctica a Carlos y sus padres cómo la mochila en un solo hombro inclina la cadera y desvía la columna.',
        tonoMuscular: 'Hipertonía paravertebral convexa derecha.',
      },
    },
    imagenes: {
      estudioSeleccionadoId: 'rad-c1',
      zoom: 1.0,
      brillo: 100,
      contraste: 105,
      estudiosHistorial: [
        {
          id: 'rad-c1',
          etiquetaCorta: 'Rad1',
          fechaCorta: 'Oct 8',
          estudio: 'Espinograma AP',
          fechaCompleta: 'Oct 8, 2024',
          region: 'Toracolumbar',
          tecnica: 'AP Bipedestación',
          corteOrientacion: 'Coronal (Frontal AP)',
          imageUrl: rxEscoliosisImg,
          hallazgos: [
            { texto: 'Curva toracolumbar leve 12° Cobb', activo: true },
            { texto: 'Inclinación pélvica 4°', activo: true },
          ],
          impresion: 'Actitud escoliótica compensatoria en seguimiento pediátrico.',
          anotacionesMedico: 'Buena respuesta a nivelación pélvica.',
          trazosDibujo: [],
        },
      ],
    },
    protocolo: {
      diagnosticoPrincipal: 'Actitud escoliótica juvenil funcional (12° Cobb)',
      diagnosticoSecundario: 'Secundario a oblicuidad pélvica y sobrecarga de mochila/pantallas',
      etiologia: 'Crecimiento puberal rápido + carga asimétrica escolar + postura en pantallas',
      fase1: {
        titulo: 'FASE 1: Alivio y Nivelación Suave (4 semanas)',
        ajustes: '2x/semana (Ajustes pediátricos suaves en pelvis, sacro y dorsal)',
        complementos: 'Cuñas pélvicas, reeducación lúdica frente a espejo',
        restriccion: 'Mochila escolar ≤ 10% del peso corporal y pantallas a 30 cm con regla 20-20-20',
      },
      fase2: {
        titulo: 'FASE 2: Fortalecimiento Lúdico (8 semanas)',
        ajustes: '1x/semana',
        ejercicios: '3x/semana (Bird-Dog, natación, equilibrio y core)',
        ergonomia: 'Educación doble (niño + padres): pupitre y soporte para celular/tablet',
      },
      fase3: {
        titulo: 'FASE 3: Prevención de Crecimiento (mantenimiento)',
        ajustes: 'Monitoreo cada 3-6 meses para seguimiento de crecimiento',
        ejerciciosCasa: '5x/semana (5-7 min)',
        educacion: 'Hábitos posturales durante todo el desarrollo adolescente',
      },
      objetivosCortoPlazo: [
        'Dolor/Fatiga: 4→0 (escala)',
        'Nivelar línea de hombros y pelvis',
        'Mochila escolar liviana con doble correa',
      ],
      objetivosMedianoPlazo: [
        'Reducir rotación en Test de Adams a < 3°',
        'Fortalecimiento simétrico de tronco',
      ],
      objetivosLargoPlazo: [
        'Prevenir progresión de curva durante la adolescencia',
        'Desarrollo espinal armónico',
      ],
      proximaCitaFechaHora: 'Martes, 22 de Octubre de 2024 - 16:30 PM',
    },
    seguimientos: [
      {
        id: 'seg-cm-1',
        fecha: '2024-10-08',
        dolorEva: 2,
        flexionGrados: 80,
        fuerzaGluteos: '5/5',
        notaProgreso: 'Excelente evolución postural pediátrica.',
      },
    ],
  },
];
