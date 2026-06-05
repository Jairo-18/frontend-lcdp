import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface SurfaceOption {
  id: string;
  label: string;
  icon: string;
  sublabel: string;
}

interface ConditionOption {
  id: string;
  label: string;
  icon: string;
  sublabel: string;
}

interface SandingStep {
  grit: string;
  desc: string;
}

interface PrepTip {
  icon: string;
  text: string;
}

interface Recommendation {
  paint: string;
  paintDesc: string;
  primer?: string;
  coats: number;
  sanding: SandingStep[];
  tips: PrepTip[];
}

@Component({
  selector: 'app-asesor',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './asesor.component.html',
})
export class AsesorComponent {
  readonly step = signal<1 | 2 | 3>(1);
  readonly selectedSurface = signal<string | null>(null);
  readonly selectedCondition = signal<string | null>(null);

  readonly surfaces: SurfaceOption[] = [
    { id: 'pared-interior', label: 'Pared interior',     icon: 'home',              sublabel: 'Ambientes, habitaciones, baños'     },
    { id: 'pared-exterior', label: 'Pared exterior',     icon: 'house',             sublabel: 'Fachadas y muros exteriores'        },
    { id: 'techo',          label: 'Techo / cielorraso', icon: 'roofing',           sublabel: 'Cielorrasos y losas'                },
    { id: 'piso',           label: 'Piso',               icon: 'texture',           sublabel: 'Cemento, ladrillo visto'            },
    { id: 'piscina',        label: 'Piscina',            icon: 'pool',              sublabel: 'Piletas y estanques de agua'        },
    { id: 'cancha',         label: 'Cancha deportiva',   icon: 'sports_basketball', sublabel: 'Cemento o asfalto'                  },
    { id: 'madera',         label: 'Madera',             icon: 'forest',            sublabel: 'Puertas, ventanas, muebles'         },
    { id: 'metal',          label: 'Metal / hierro',     icon: 'hardware',          sublabel: 'Rejas, portones, tuberías'          },
  ];

  readonly conditions: ConditionOption[] = [
    { id: 'nueva',      label: 'Superficie nueva',       icon: 'check_circle',  sublabel: 'Sin pintura anterior, en buen estado' },
    { id: 'humedad',    label: 'Humedad / goteras',      icon: 'water_drop',    sublabel: 'Manchas de agua o humedad ascendente' },
    { id: 'moho',       label: 'Moho / hongos',          icon: 'coronavirus',   sublabel: 'Manchas negras, verdosas o grises'    },
    { id: 'grietas',    label: 'Grietas / descascarado', icon: 'broken_image',  sublabel: 'Pintura vieja, cuarteada o saltada'   },
    { id: 'porosa',     label: 'Superficie muy porosa',  icon: 'blur_circular', sublabel: 'Absorbe mucha agua o pintura'         },
    { id: 'intemperie', label: 'Desgaste / intemperie',  icon: 'wb_sunny',      sublabel: 'Sol, lluvia o viento constante'       },
  ];

  private readonly _recos: Record<string, Record<string, Recommendation>> = {
    'pared-interior': {
      nueva: {
        paint: 'Pintura de agua Tipo 1 o Tipo 2',
        paintDesc: 'La Tipo 1 es la más resistente: agarra duro y dura años. La Tipo 2 es lavable y con aditivos queda casi igual de fuerte. Para una pared nueva en buen estado, cualquiera de las dos funciona bien.',
        coats: 2,
        sanding: [
          { grit: 'N° 100', desc: 'Alisar imperfecciones leves del revoque o estuco' },
          { grit: 'N° 120', desc: 'Refinar antes de la segunda mano para un acabado parejo' },
        ],
        tips: [
          { icon: 'cleaning_services', text: 'Limpiar el polvo y la suciedad antes de pintar; la pintura no agarra sobre grasa' },
          { icon: 'air', text: 'La superficie debe estar completamente seca antes de aplicar' },
          { icon: 'schedule', text: 'Dejar secar entre mano y mano (mínimo 2 horas, mejor si es más)' },
          { icon: 'water', text: 'Diluir la primera mano con un poco de agua para mejor penetración' },
        ],
      },
      humedad: {
        paint: 'Pintura de agua Tipo 1 + sellador hidrófugo',
        paintDesc: 'La Tipo 1 es la más indicada cuando hay humedad porque agarra fuerte. Se le aplica primero un sellador o fijador hidrófugo para cortar la humedad antes de pintar.',
        primer: 'Sellador o fijador hidrófugo (base agua)',
        coats: 3,
        sanding: [
          { grit: 'N° 60–80', desc: 'Quitar la pintura suelta, manchas de salitre o partes eflorescentes' },
          { grit: 'N° 120', desc: 'Alisar antes de aplicar el sellador y la pintura' },
        ],
        tips: [
          { icon: 'remove_done', text: 'Raspar todo lo que esté suelto, blanco o eflorescente antes de cualquier cosa' },
          { icon: 'vaccines', text: 'Aplicar el sellador hidrófugo primero y dejar secar bien (mín. 4 horas)' },
          { icon: 'plumbing', text: 'Si el problema es una gotera o filtración, arreglar eso primero — ninguna pintura aguanta agua corriendo' },
          { icon: 'schedule', text: 'Entre cada mano de pintura dejar secar bien, mínimo 24 horas con humedad' },
        ],
      },
      moho: {
        paint: 'Pintura de agua Tipo 1 con aditivo antihongos',
        paintDesc: 'Primero hay que matar el moho con agua con cloro, y luego pintar con Tipo 1 a la que se le puede agregar un aditivo antihongos para que no vuelva a salir.',
        primer: 'Agua con cloro (1 parte cloro, 3 partes agua) + sellador',
        coats: 2,
        sanding: [
          { grit: 'N° 60–80', desc: 'Raspar la pintura con moho y la capa afectada' },
          { grit: 'N° 120', desc: 'Alisar la superficie limpia antes de pintar' },
        ],
        tips: [
          { icon: 'cleaning_services', text: 'Aplicar agua con cloro (1:3) sobre el moho, dejar actuar 15 minutos y restregar bien' },
          { icon: 'masks', text: 'Usar tapabocas y guantes al limpiar el moho, no respirar eso' },
          { icon: 'air', text: 'Dejar secar muy bien antes de pintar, mínimo 24 horas con ventilación' },
          { icon: 'repeat', text: 'El moho vuelve si la humedad no se resuelve de raíz — revisar filtración o ventilación' },
        ],
      },
      grietas: {
        paint: 'Pintura de agua Tipo 1 o Tipo 2 (con masilla previa)',
        paintDesc: 'Primero tapar las grietas con masilla o estuco, lijar cuando seque, y luego pintar. La Tipo 1 da mejor resultado porque agarra más fuerte sobre la corrección.',
        primer: 'Fijador o vinilo diluido + masilla o estuco plástico',
        coats: 2,
        sanding: [
          { grit: 'N° 60–80', desc: 'Quitar pintura suelta y abrir bien la grieta para que la masilla entre' },
          { grit: 'N° 100', desc: 'Lijar la masilla seca para nivelarla con la pared' },
          { grit: 'N° 120–150', desc: 'Lijado fino antes de pintar para que no se noten los parches' },
        ],
        tips: [
          { icon: 'construction', text: 'Para grietas grandes usar masilla o mortero; para rayitas finas sirve el estuco solo' },
          { icon: 'format_paint', text: 'Aplicar fijador o vinilo diluido antes de la masilla para que pegue mejor' },
          { icon: 'schedule', text: 'La masilla debe estar completamente seca antes de lijar (mínimo 24 horas)' },
          { icon: 'cleaning_services', text: 'Limpiar el polvo del lijado con trapo húmedo antes de pintar' },
        ],
      },
      porosa: {
        paint: 'Pintura de agua Tipo 1 + fijador previo',
        paintDesc: 'Una pared muy porosa "se toma" la pintura y queda dispareja. El fijador o vinilo diluido sella los poros primero y hace que la pintura rinda más y quede uniforme.',
        primer: 'Fijador o vinilo diluido al 20–30% con agua',
        coats: 3,
        sanding: [
          { grit: 'N° 100', desc: 'Alisar la superficie y abrir levemente el poro para que el fijador penetre' },
          { grit: 'N° 120', desc: 'Refinar entre capas de pintura' },
        ],
        tips: [
          { icon: 'water', text: 'Prueba rápida: echar agua en la pared — si se absorbe al instante, necesita fijador sí o sí' },
          { icon: 'format_paint', text: 'Aplicar el fijador o vinilo diluido y dejar secar mínimo 2 horas antes de pintar' },
          { icon: 'repeat', text: 'La primera mano de pintura puede ir un poco más diluida para que penetre bien' },
        ],
      },
      intemperie: {
        paint: 'Pintura de agua Tipo 1 (la más resistente disponible)',
        paintDesc: 'Para paredes interiores que reciben mucha humedad del ambiente o algo de lluvia, usar Tipo 1 que es la que más aguanta. La Tipo 3 en estas condiciones se va a dañar rápido.',
        primer: 'Sellador o fijador hidrófugo',
        coats: 2,
        sanding: [
          { grit: 'N° 80', desc: 'Quitar la pintura deteriorada o que se está pelando' },
          { grit: 'N° 120', desc: 'Alisar antes de la pintura nueva' },
        ],
        tips: [
          { icon: 'plumbing', text: 'Verificar que no haya filtraciones desde afuera antes de pintar' },
          { icon: 'schedule', text: 'No pintar con la pared húmeda ni con lluvia cerca' },
          { icon: 'tips_and_updates', text: 'La Tipo 3 no sirve para estas condiciones — se lava con el agua' },
        ],
      },
    },
    'pared-exterior': {
      nueva: {
        paint: 'Látex exterior / impermeabilizante',
        paintDesc: 'Resistente a lluvia, rayos UV y cambios de temperatura. Ideal para fachadas nuevas o bien preparadas.',
        primer: 'Fijador exterior',
        coats: 2,
        sanding: [
          { grit: 'N° 80', desc: 'Quitar residuos y alisar imperfecciones de la mampostería' },
          { grit: 'N° 100', desc: 'Refinar antes de la segunda mano' },
        ],
        tips: [
          { icon: 'wb_sunny', text: 'No pintar bajo sol directo intenso ni si se esperan lluvias en 24 hs' },
          { icon: 'cleaning_services', text: 'Lavar la pared con agua a presión para eliminar polvo y sales' },
          { icon: 'schedule', text: 'Dejar secar al menos 72 hs antes de exponer a lluvia' },
        ],
      },
      humedad: {
        paint: 'Impermeabilizante elástico para exterior',
        paintDesc: 'Membrana líquida que forma una capa flexible e impermeable. Ideal para fachadas con problemas de filtración.',
        primer: 'Fijador hidrófugo exterior',
        coats: 3,
        sanding: [
          { grit: 'N° 60', desc: 'Eliminar eflorescencias, sales y pintura suelta' },
          { grit: 'N° 80', desc: 'Alisar antes de aplicar el impermeabilizante' },
        ],
        tips: [
          { icon: 'plumbing', text: 'Verificar canaletas, bajantes y techos antes de pintar para eliminar la fuente de humedad' },
          { icon: 'construction', text: 'Sellar grietas con sellador elastomérico antes de impermeabilizar' },
          { icon: 'schedule', text: 'Esperar 48-72 hs de tiempo seco después de cada mano' },
        ],
      },
      moho: {
        paint: 'Látex antihongos exterior',
        paintDesc: 'Formulado para resistir algas, hongos y líquenes en superficies expuestas a humedad y sombra.',
        primer: 'Solución fungicida + fijador exterior',
        coats: 2,
        sanding: [
          { grit: 'N° 60–80', desc: 'Eliminar la capa biológica y la pintura deteriorada' },
        ],
        tips: [
          { icon: 'cleaning_services', text: 'Lavar con agua y lavandina o producto fungicida de uso exterior' },
          { icon: 'schedule', text: 'Dejar actuar el fungicida 24 hs, enjuagar y secar antes de lijar' },
          { icon: 'wb_sunny', text: 'Pintar con baja humedad relativa y temperatura mayor a 10°C' },
        ],
      },
      grietas: {
        paint: 'Látex exterior + sellador elastomérico',
        paintDesc: 'El sellador elastomérico cubre grietas y microfisuras, y el látex exterior protege de la intemperie.',
        primer: 'Fijador exterior + sellador elastomérico',
        coats: 2,
        sanding: [
          { grit: 'N° 60', desc: 'Eliminar pintura suelta y material disgregado' },
          { grit: 'N° 80–100', desc: 'Alisar la superficie y el sellador seco' },
        ],
        tips: [
          { icon: 'construction', text: 'Usar mortero o masilla exterior para grietas grandes antes del sellador' },
          { icon: 'schedule', text: 'El sellador elastomérico necesita 24-48 hs de secado antes de pintar encima' },
        ],
      },
      porosa: {
        paint: 'Látex exterior + fijador previo',
        paintDesc: 'El fijador sella la porosidad y reduce la absorción, permitiendo que la pintura exterior cubra de forma uniforme.',
        primer: 'Fijador acrílico exterior diluido al 20%',
        coats: 3,
        sanding: [
          { grit: 'N° 80', desc: 'Abrir el poro levemente para mejor penetración del fijador' },
          { grit: 'N° 100', desc: 'Alisar entre manos' },
        ],
        tips: [
          { icon: 'water', text: 'Humedecer la superficie antes de aplicar el fijador para mejor penetración' },
          { icon: 'repeat', text: 'Aplicar la primera mano de pintura más diluida para mejorar la adhesión' },
        ],
      },
      intemperie: {
        paint: 'Látex premium exterior / pintura de caucho',
        paintDesc: 'Máxima resistencia a rayos UV, lluvia y temperatura. Ideal para zonas muy expuestas o con clima agresivo.',
        primer: 'Fijador exterior + imprimación',
        coats: 2,
        sanding: [
          { grit: 'N° 60–80', desc: 'Eliminar la pintura fotodegradada y el material suelto' },
          { grit: 'N° 100', desc: 'Alisar antes de la pintura de acabado' },
        ],
        tips: [
          { icon: 'wb_sunny', text: 'Pintar en días nublados o a la sombra para evitar el secado irregular' },
          { icon: 'schedule', text: 'La pintura de caucho puede tardar 72 hs en curar completamente' },
          { icon: 'repeat', text: 'Renovar cada 3-5 años según el nivel de exposición solar' },
        ],
      },
    },
    'techo': {
      nueva: {
        paint: 'Látex para cielorraso (blanco mate)',
        paintDesc: 'Formulado para techos: sin salpicaduras, alta cobertura y aspecto impecable.',
        coats: 2,
        sanding: [
          { grit: 'N° 80', desc: 'Alisar imperfecciones del revoque' },
          { grit: 'N° 120', desc: 'Refinar antes de la segunda mano' },
        ],
        tips: [
          { icon: 'cleaning_services', text: 'Limpiar el polvo de la superficie antes de pintar' },
          { icon: 'format_paint', text: 'Usar rodillo de pelo corto para acabado liso o pelo largo para textura' },
          { icon: 'air', text: 'Ventilar el ambiente durante el secado' },
        ],
      },
      humedad: {
        paint: 'Pintura antihumedad para techos',
        paintDesc: 'Bloquea el paso del agua en cielorrasos con problemas de filtración desde la losa.',
        primer: 'Sellador hidrófugo para techos',
        coats: 3,
        sanding: [
          { grit: 'N° 60', desc: 'Eliminar pintura con burbujas, eflorescencias o material suelto' },
          { grit: 'N° 100', desc: 'Alisar antes del sellador y la pintura' },
        ],
        tips: [
          { icon: 'plumbing', text: 'Resolver las filtraciones desde la losa antes de pintar' },
          { icon: 'remove_done', text: 'Raspar completamente la pintura que se está pelando' },
          { icon: 'schedule', text: 'Cada capa necesita mínimo 24 hs de secado' },
        ],
      },
      moho: {
        paint: 'Látex antihongos para cielorraso',
        paintDesc: 'Con biocidas que previenen la reaparición del moho en techos con condensación o humedad.',
        primer: 'Solución fungicida + sellador',
        coats: 2,
        sanding: [
          { grit: 'N° 60–80', desc: 'Raspar y quitar el moho y la pintura deteriorada' },
          { grit: 'N° 120', desc: 'Alisar la superficie limpia antes de pintar' },
        ],
        tips: [
          { icon: 'masks', text: 'Usar barbijo y gafas al limpiar el moho del techo' },
          { icon: 'cleaning_services', text: 'Limpiar con agua y lavandina 1:3, dejar 15 min y enjuagar' },
          { icon: 'air', text: 'Mejorar la ventilación del ambiente para reducir la condensación' },
        ],
      },
      grietas: {
        paint: 'Látex para techo (con enduído previo)',
        paintDesc: 'Nivelar grietas con enduído plástico o acrílico, luego pintar con látex mate.',
        primer: 'Fijador + enduído plástico',
        coats: 2,
        sanding: [
          { grit: 'N° 80', desc: 'Quitar la pintura descascarada y material suelto' },
          { grit: 'N° 100–120', desc: 'Lijar el enduído seco hasta emparejar con la superficie' },
        ],
        tips: [
          { icon: 'format_paint', text: 'Aplicar fijador antes del enduído para que agarre bien' },
          { icon: 'schedule', text: 'El enduído tarda 24-48 hs en secar completamente antes de lijar' },
        ],
      },
      porosa: {
        paint: 'Látex para cielorraso + fijador previo',
        paintDesc: 'El fijador sella los poros del revoque nuevo y reduce la absorción, mejorando la cobertura.',
        primer: 'Fijador acrílico diluido al 20%',
        coats: 3,
        sanding: [
          { grit: 'N° 100', desc: 'Alisar levemente y abrir el poro para el fijador' },
          { grit: 'N° 120', desc: 'Refinar entre capas' },
        ],
        tips: [
          { icon: 'format_paint', text: 'Aplicar fijador con rodillo de pelo largo para buena penetración' },
          { icon: 'repeat', text: 'La primera mano de látex puede ir un 10% más diluida' },
        ],
      },
      intemperie: {
        paint: 'Impermeabilizante para losa (exterior)',
        paintDesc: 'Si la losa es accesible desde arriba, impermeabilizar la superficie exterior para cortar las filtraciones en origen.',
        primer: 'Fijador hidrófugo',
        coats: 3,
        sanding: [
          { grit: 'N° 60', desc: 'Limpiar y preparar la superficie exterior de la losa' },
        ],
        tips: [
          { icon: 'plumbing', text: 'Impermeabilizar la losa desde arriba es mucho más efectivo que pintar el cielorraso desde abajo' },
          { icon: 'construction', text: 'Sellar grietas con elastomérico antes de impermeabilizar' },
        ],
      },
    },
    'piso': {
      nueva: {
        paint: 'Pintura para pisos al agua o epóxica',
        paintDesc: 'La epóxica ofrece mayor durabilidad y resistencia al tráfico. La versión al agua es más fácil de aplicar para uso doméstico.',
        primer: 'Imprimación epóxica o fijador para pisos',
        coats: 2,
        sanding: [
          { grit: 'N° 40–60', desc: 'Abrir el poro del cemento y eliminar la lechada superficial' },
          { grit: 'N° 80', desc: 'Alisar antes de la segunda mano' },
        ],
        tips: [
          { icon: 'cleaning_services', text: 'Limpiar el piso con agua y detergente desengrasante antes de lijar' },
          { icon: 'schedule', text: 'Esperar 3-5 días de curado antes de poner tráfico normal' },
          { icon: 'air', text: 'La temperatura debe estar entre 10°C y 30°C para correcta aplicación' },
        ],
      },
      humedad: {
        paint: 'Pintura epóxica para pisos húmedos',
        paintDesc: 'Sella el piso e impide el paso de humedad. Resistente a agua, aceites y productos de limpieza.',
        primer: 'Imprimación epóxica penetrante antihumedad',
        coats: 2,
        sanding: [
          { grit: 'N° 40', desc: 'Desbastar el cemento para eliminar eflorescencias y abrir el poro' },
          { grit: 'N° 60–80', desc: 'Alisar antes de aplicar la imprimación' },
        ],
        tips: [
          { icon: 'plumbing', text: 'Cortar la fuente de humedad antes de pintar (cañerías, napa freática)' },
          { icon: 'schedule', text: 'El piso debe estar seco al menos 72 hs antes de aplicar la epóxica' },
          { icon: 'construction', text: 'Si el piso "suda", aplicar primero una mano de imprimación penetrante' },
        ],
      },
      moho: {
        paint: 'Pintura epóxica + tratamiento fungicida previo',
        paintDesc: 'El moho en pisos indica exceso de humedad. Tratar el moho primero y luego sellar con pintura epóxica.',
        primer: 'Solución fungicida + imprimación epóxica',
        coats: 2,
        sanding: [
          { grit: 'N° 40–60', desc: 'Eliminar el moho, eflorescencias y la capa superficial del cemento' },
        ],
        tips: [
          { icon: 'cleaning_services', text: 'Limpiar con solución fungicida y dejar actuar 30 min antes de enjuagar' },
          { icon: 'air', text: 'Ventilar y secar completamente antes de pintar (mínimo 72 hs)' },
        ],
      },
      grietas: {
        paint: 'Pintura epóxica con relleno previo',
        paintDesc: 'Rellenar grietas con mortero epóxico o sellador flexible antes de aplicar la pintura de piso.',
        primer: 'Sellador de grietas epóxico',
        coats: 2,
        sanding: [
          { grit: 'N° 40', desc: 'Abrir bien la grieta para que el relleno penetre' },
          { grit: 'N° 60–80', desc: 'Alisar el relleno seco a nivel del piso' },
        ],
        tips: [
          { icon: 'construction', text: 'Usar cincel y martillo para abrir las grietas en "V" y mejorar el agarre del relleno' },
          { icon: 'schedule', text: 'El mortero epóxico de relleno tarda 24-48 hs en curar antes de lijar' },
        ],
      },
      porosa: {
        paint: 'Pintura para pisos al agua + fijador previo',
        paintDesc: 'Para pisos de cemento muy porosos: aplicar fijador antes de la pintura para mejorar la adhesión y durabilidad.',
        primer: 'Fijador para pisos diluido al 20%',
        coats: 3,
        sanding: [
          { grit: 'N° 40–60', desc: 'Abrir el poro para que el fijador penetre bien' },
          { grit: 'N° 80', desc: 'Alisar entre capas' },
        ],
        tips: [
          { icon: 'water', text: 'Si el agua se absorbe en segundos, el piso necesita fijador antes de pintar' },
          { icon: 'repeat', text: 'La primera mano de pintura puede ir más diluida para mejor penetración' },
        ],
      },
      intemperie: {
        paint: 'Pintura para pisos exterior resistente UV',
        paintDesc: 'Para pisos exteriores o terrazas: resistente a rayos UV, lluvia y tráfico.',
        primer: 'Fijador exterior para pisos',
        coats: 2,
        sanding: [
          { grit: 'N° 40–60', desc: 'Preparar el cemento exterior eliminando capas anteriores y eflorescencias' },
          { grit: 'N° 80', desc: 'Alisar antes de la pintura final' },
        ],
        tips: [
          { icon: 'wb_sunny', text: 'No aplicar bajo sol directo fuerte; esperar que el piso esté en sombra' },
          { icon: 'schedule', text: 'No exponer a lluvia las primeras 48 hs después de pintar' },
        ],
      },
    },
    'piscina': {
      nueva: {
        paint: 'Pintura para piscinas (caucho clorado o epóxica)',
        paintDesc: 'El caucho clorado es el más usado: fácil aplicación y buena durabilidad. La epóxica es más duradera pero requiere más preparación.',
        primer: 'Imprimación al caucho clorado',
        coats: 2,
        sanding: [
          { grit: 'N° 40–60', desc: 'Abrir el poro del cemento para buena adherencia' },
          { grit: 'N° 80', desc: 'Alisar antes de la segunda mano' },
        ],
        tips: [
          { icon: 'water', text: 'Vaciar y lavar la piscina completamente antes de trabajar' },
          { icon: 'schedule', text: 'Dejar secar mínimo 5-7 días antes de llenar con agua' },
          { icon: 'air', text: 'Pintar a la sombra o en días frescos para evitar el secado rápido irregular' },
        ],
      },
      humedad: {
        paint: 'Pintura para piscinas epóxica',
        paintDesc: 'La epóxica es la más resistente a la humedad constante y a los químicos del agua.',
        primer: 'Imprimación epóxica para superficies húmedas',
        coats: 2,
        sanding: [
          { grit: 'N° 40', desc: 'Eliminar eflorescencias y abrir el poro del cemento' },
          { grit: 'N° 60–80', desc: 'Alisar antes del imprimador y la pintura' },
        ],
        tips: [
          { icon: 'construction', text: 'Sellar fisuras con mortero epóxico antes de pintar' },
          { icon: 'schedule', text: 'Esperar al menos 7 días de secado antes de llenar la piscina' },
        ],
      },
      moho: {
        paint: 'Pintura para piscinas antialgas + tratamiento previo',
        paintDesc: 'Las manchas verdes suelen ser algas. Tratar con algicida y luego pintar con pintura antialgas.',
        primer: 'Solución algicida + imprimación caucho clorado',
        coats: 2,
        sanding: [
          { grit: 'N° 40–60', desc: 'Eliminar las algas y la pintura deteriorada' },
        ],
        tips: [
          { icon: 'cleaning_services', text: 'Lavar con ácido muriático diluido (1:10) para eliminar algas y depósitos' },
          { icon: 'masks', text: 'Usar guantes, gafas y barbijo al trabajar con ácido' },
          { icon: 'schedule', text: 'Enjuagar bien y dejar secar 3-5 días antes de pintar' },
        ],
      },
      grietas: {
        paint: 'Pintura para piscinas + sellado de grietas previo',
        paintDesc: 'Las grietas deben sellarse con mortero hidráulico o epóxico antes de pintar para evitar filtraciones.',
        primer: 'Mortero hidráulico + imprimación para piscinas',
        coats: 2,
        sanding: [
          { grit: 'N° 40', desc: 'Abrir bien las grietas para el relleno (golpe de cincel)' },
          { grit: 'N° 60–80', desc: 'Alisar el mortero seco a nivel de la superficie' },
        ],
        tips: [
          { icon: 'construction', text: 'Usar mortero hidráulico de fraguado rápido para grietas que filtran agua' },
          { icon: 'schedule', text: 'Esperar 7-14 días de curado del mortero antes de pintar' },
        ],
      },
      porosa: {
        paint: 'Pintura para piscinas + imprimación penetrante',
        paintDesc: 'Para superficies muy absorbentes, aplicar imprimación especial antes de la pintura de piscina.',
        primer: 'Imprimación penetrante al caucho clorado',
        coats: 3,
        sanding: [
          { grit: 'N° 40–60', desc: 'Abrir bien el poro del cemento poroso' },
          { grit: 'N° 80', desc: 'Alisar entre capas' },
        ],
        tips: [
          { icon: 'repeat', text: 'En superficies muy porosas, aplicar 2 manos de imprimación antes de la pintura' },
          { icon: 'schedule', text: 'Respetar los tiempos de secado entre manos (mínimo 4-6 hs)' },
        ],
      },
      intemperie: {
        paint: 'Pintura para piscinas resistente UV',
        paintDesc: 'Para piscinas muy expuestas al sol, preferir pintura con aditivos UV para mayor durabilidad y color.',
        primer: 'Imprimación al caucho clorado',
        coats: 2,
        sanding: [
          { grit: 'N° 40–60', desc: 'Quitar la pintura fotodegradada' },
          { grit: 'N° 80', desc: 'Alisar antes de la segunda mano' },
        ],
        tips: [
          { icon: 'wb_sunny', text: 'Pintar en las horas frescas del día (mañana o tarde)' },
          { icon: 'repeat', text: 'Repintar cada 2-3 años en piscinas con alta exposición solar' },
        ],
      },
    },
    'cancha': {
      nueva: {
        paint: 'Pintura para canchas deportivas (al agua o epóxica)',
        paintDesc: 'Formulada para resistir tráfico intenso, abrasión y rayos UV en superficies deportivas.',
        primer: 'Imprimación para pisos exteriores',
        coats: 2,
        sanding: [
          { grit: 'N° 40–60', desc: 'Abrir el poro del cemento o asfalto para buena adherencia' },
          { grit: 'N° 80', desc: 'Alisar antes de la segunda mano' },
        ],
        tips: [
          { icon: 'cleaning_services', text: 'Limpiar con agua a presión para eliminar polvo, grasas y residuos' },
          { icon: 'schedule', text: 'No usar la cancha hasta 72 hs después de la última mano' },
          { icon: 'wb_sunny', text: 'Pintar con baja humedad y temperatura entre 10-30°C' },
        ],
      },
      humedad: {
        paint: 'Pintura para canchas + imprimación hidrófuga',
        paintDesc: 'Si la cancha tiene problemas de humedad del suelo, aplicar una imprimación hidrófuga antes de la pintura.',
        primer: 'Imprimación hidrófuga para pisos',
        coats: 2,
        sanding: [
          { grit: 'N° 40–60', desc: 'Eliminar eflorescencias y abrir el poro' },
          { grit: 'N° 80', desc: 'Alisar antes de la pintura' },
        ],
        tips: [
          { icon: 'plumbing', text: 'Verificar el drenaje de la cancha: el agua no debe acumularse' },
          { icon: 'schedule', text: 'Pintar solo cuando la superficie lleva 48+ hs sin lluvia' },
        ],
      },
      moho: {
        paint: 'Pintura para canchas antialgas / antihongos',
        paintDesc: 'Para canchas con manchas verdes (algas) por humedad y sombra, usar pintura con biocidas.',
        primer: 'Solución fungicida + imprimación para canchas',
        coats: 2,
        sanding: [
          { grit: 'N° 40–60', desc: 'Quitar algas, hongos y pintura deteriorada' },
        ],
        tips: [
          { icon: 'cleaning_services', text: 'Lavar con hidrolavadora y solución fungicida antes de lijar' },
          { icon: 'schedule', text: 'Dejar secar completamente (mínimo 48 hs) antes de aplicar la pintura' },
        ],
      },
      grietas: {
        paint: 'Pintura para canchas + relleno de grietas previo',
        paintDesc: 'Rellenar grietas del cemento con mortero o masilla flexible antes de pintar para un acabado uniforme.',
        primer: 'Mortero + sellador flexible para pisos',
        coats: 2,
        sanding: [
          { grit: 'N° 40', desc: 'Abrir las grietas para el relleno con cincel' },
          { grit: 'N° 60–80', desc: 'Alisar el relleno seco a nivel de la superficie' },
        ],
        tips: [
          { icon: 'construction', text: 'Para grietas de movimiento usar sellador elástico en lugar de mortero rígido' },
          { icon: 'schedule', text: 'El relleno debe curar 48 hs antes de lijar y pintar' },
        ],
      },
      porosa: {
        paint: 'Pintura para canchas + fijador previo',
        paintDesc: 'Sellar la porosidad con fijador para mejorar la adhesión y reducir el consumo de pintura.',
        primer: 'Fijador exterior para pisos',
        coats: 3,
        sanding: [
          { grit: 'N° 40–60', desc: 'Abrir el poro del cemento poroso' },
          { grit: 'N° 80', desc: 'Alisar entre manos' },
        ],
        tips: [
          { icon: 'water', text: 'El cemento muy poroso puede requerir 2 manos de fijador' },
          { icon: 'repeat', text: 'La primera mano de pintura puede ir diluida al 10% para mejor penetración' },
        ],
      },
      intemperie: {
        paint: 'Pintura para canchas premium con filtro UV',
        paintDesc: 'Para canchas muy expuestas al sol, usar pintura con alta resistencia UV para evitar el decolor y la degradación.',
        primer: 'Imprimación exterior para canchas',
        coats: 2,
        sanding: [
          { grit: 'N° 40–60', desc: 'Quitar la pintura fotodegradada y la capa suelta' },
          { grit: 'N° 80', desc: 'Alisar antes de la nueva pintura' },
        ],
        tips: [
          { icon: 'wb_sunny', text: 'Pintar temprano a la mañana para evitar el sol de mediodía' },
          { icon: 'repeat', text: 'Renovar cada 2-3 años para mantener el color y la adherencia' },
        ],
      },
    },
    'madera': {
      nueva: {
        paint: 'Esmalte sintético o barniz para madera',
        paintDesc: 'El esmalte da color y protección. El barniz resalta la veta natural. Para exteriores, usar siempre con filtro UV.',
        primer: 'Fondo sintético / imprimación para madera',
        coats: 2,
        sanding: [
          { grit: 'N° 80', desc: 'Alisar la madera a favor de la veta y abrir el poro' },
          { grit: 'N° 120', desc: 'Lijar entre el fondo y la primera mano de acabado' },
          { grit: 'N° 180–220', desc: 'Lijado fino final antes de la última mano (para acabado premium)' },
        ],
        tips: [
          { icon: 'cleaning_services', text: 'Limpiar la madera con trapo seco o levemente húmedo antes de lijar' },
          { icon: 'format_paint', text: 'Siempre lijar a favor de la veta para no rayar la madera' },
          { icon: 'schedule', text: 'Dejar secar el fondo 12-24 hs antes de la mano de acabado' },
          { icon: 'air', text: 'Pintar con baja humedad ambiental para evitar el cuarteado del esmalte' },
        ],
      },
      humedad: {
        paint: 'Barniz marino o esmalte con protección antihumedad',
        paintDesc: 'Para maderas expuestas a humedad: barniz marino o esmalte con aditivos impermeabilizantes.',
        primer: 'Fondo para madera húmeda / tratamiento fungicida',
        coats: 3,
        sanding: [
          { grit: 'N° 80', desc: 'Lijar la madera para quitar la pintura vieja y abrir el poro' },
          { grit: 'N° 120', desc: 'Alisar entre capas' },
          { grit: 'N° 180', desc: 'Lijado fino antes de la última mano' },
        ],
        tips: [
          { icon: 'plumbing', text: 'Corregir el problema de humedad en origen antes de pintar' },
          { icon: 'cleaning_services', text: 'Si hay moho, limpiar con agua y lavandina 1:3 antes de lijar' },
          { icon: 'schedule', text: 'La madera debe estar seca antes de pintar (humedad interna menor al 15%)' },
        ],
      },
      moho: {
        paint: 'Esmalte antihongos para madera',
        paintDesc: 'Con biocidas para prevenir el crecimiento de moho en maderas en ambientes húmedos.',
        primer: 'Tratamiento fungicida + fondo para madera',
        coats: 2,
        sanding: [
          { grit: 'N° 60–80', desc: 'Eliminar completamente el moho y la pintura afectada' },
          { grit: 'N° 120', desc: 'Alisar antes del fondo y la pintura' },
        ],
        tips: [
          { icon: 'masks', text: 'Usar barbijo al lijar madera con moho' },
          { icon: 'cleaning_services', text: 'Limpiar con solución fungicida antes de lijar' },
          { icon: 'air', text: 'Mejorar la ventilación del ambiente para evitar la reaparición del moho' },
        ],
      },
      grietas: {
        paint: 'Esmalte sintético + masilla para madera previa',
        paintDesc: 'Rellenar grietas y nudos con masilla plástica para madera antes de aplicar el fondo y el esmalte.',
        primer: 'Masilla plástica para madera + fondo sintético',
        coats: 2,
        sanding: [
          { grit: 'N° 60–80', desc: 'Quitar pintura descascarada y abrir las grietas' },
          { grit: 'N° 100', desc: 'Lijar la masilla seca a nivel de la superficie' },
          { grit: 'N° 120–150', desc: 'Lijado fino antes del esmalte de acabado' },
        ],
        tips: [
          { icon: 'construction', text: 'Aplicar la masilla en capas delgadas: una capa gruesa se fisura al secar' },
          { icon: 'schedule', text: 'La masilla debe secar 24 hs antes de lijar' },
          { icon: 'format_paint', text: 'Lijar siempre a favor de la veta para no marcar la madera' },
        ],
      },
      porosa: {
        paint: 'Esmalte sintético + tapaporos para madera',
        paintDesc: 'Maderas blandas o muy veteadas absorben mucho. El tapaporos reduce la absorción y da un acabado parejo.',
        primer: 'Sellador tapaporos + fondo sintético',
        coats: 3,
        sanding: [
          { grit: 'N° 80', desc: 'Lijar la madera a favor de la veta' },
          { grit: 'N° 120', desc: 'Lijar entre el sellador y el fondo' },
          { grit: 'N° 180', desc: 'Lijado fino antes del esmalte final' },
        ],
        tips: [
          { icon: 'format_paint', text: 'Aplicar el tapaporos con brocha siguiendo la veta' },
          { icon: 'schedule', text: 'Dejar secar mínimo 4 hs entre capas de tapaporos' },
          { icon: 'repeat', text: 'La primera mano de esmalte puede ir diluida un 5-10% para mejor penetración' },
        ],
      },
      intemperie: {
        paint: 'Esmalte o barniz con filtro UV para exteriores',
        paintDesc: 'Para maderas expuestas al sol y la lluvia: esmalte o barniz con filtro UV y resistencia al agua.',
        primer: 'Fondo sintético para madera exterior',
        coats: 3,
        sanding: [
          { grit: 'N° 80', desc: 'Eliminar la pintura fotodegradada y la madera grisada' },
          { grit: 'N° 120', desc: 'Alisar entre capas' },
          { grit: 'N° 180', desc: 'Lijado fino antes de la mano final' },
        ],
        tips: [
          { icon: 'wb_sunny', text: 'No pintar bajo sol directo: esperar que la madera esté en sombra' },
          { icon: 'schedule', text: 'No exponer a lluvia las primeras 48 hs después de pintar' },
          { icon: 'repeat', text: 'Renovar el acabado cada 1-2 años en maderas muy expuestas' },
        ],
      },
    },
    'metal': {
      nueva: {
        paint: 'Esmalte sintético para metal (con fondo antióxido)',
        paintDesc: 'El fondo antióxido protege el metal de la corrosión. El esmalte da color y acabado durable.',
        primer: 'Fondo antióxido al cromato de zinc',
        coats: 2,
        sanding: [
          { grit: 'N° 80', desc: 'Desbastar el metal nuevo para quitar la capa de óxido de fábrica' },
          { grit: 'N° 120', desc: 'Alisar antes de la segunda mano de esmalte' },
        ],
        tips: [
          { icon: 'cleaning_services', text: 'Limpiar el metal con solvente o aguarrás para quitar grasas antes de lijar' },
          { icon: 'format_paint', text: 'Aplicar el fondo antióxido inmediatamente después de lijar: el metal sin pintura se oxida rápido' },
          { icon: 'schedule', text: 'Dejar secar el fondo 12-24 hs antes del esmalte' },
        ],
      },
      humedad: {
        paint: 'Convertidor de óxido + esmalte sintético',
        paintDesc: 'El convertidor de óxido transforma el óxido existente en una capa estable y actúa como fondo.',
        primer: 'Convertidor de óxido',
        coats: 2,
        sanding: [
          { grit: 'N° 40–60', desc: 'Eliminar el óxido suelto, escamas y pintura descascarada' },
          { grit: 'N° 80', desc: 'Alisar la superficie antes del convertidor' },
          { grit: 'N° 120', desc: 'Lijar levemente el convertidor seco antes del esmalte' },
        ],
        tips: [
          { icon: 'hardware', text: 'Para óxido grueso, usar cepillo de alambre antes de la lija' },
          { icon: 'format_paint', text: 'Aplicar el convertidor con brocha; no diluir' },
          { icon: 'schedule', text: 'El convertidor seca al tacto en 2-4 hs pero necesita 24 hs antes del esmalte' },
        ],
      },
      moho: {
        paint: 'Convertidor de óxido + esmalte antióxido',
        paintDesc: 'El "moho" en metales es en realidad óxido o corrosión. Tratarlo con convertidor antes de pintar.',
        primer: 'Convertidor de óxido',
        coats: 2,
        sanding: [
          { grit: 'N° 40–60', desc: 'Quitar el óxido y la pintura deteriorada con lija o cepillo de alambre' },
          { grit: 'N° 80–120', desc: 'Alisar antes del convertidor y el esmalte' },
        ],
        tips: [
          { icon: 'hardware', text: 'Usar cepillo de alambre o amoladora para óxido severo antes de la lija' },
          { icon: 'cleaning_services', text: 'Limpiar con solvente para quitar restos de óxido en polvo antes del convertidor' },
          { icon: 'schedule', text: 'Aplicar el esmalte dentro de las 48-72 hs del convertidor para mejor adhesión' },
        ],
      },
      grietas: {
        paint: 'Masilla poliéster para metal + esmalte sintético',
        paintDesc: 'Las grietas o rayones profundos en metal se rellenan con masilla poliéster antes de pintar.',
        primer: 'Fondo antióxido + masilla poliéster',
        coats: 2,
        sanding: [
          { grit: 'N° 60', desc: 'Preparar la grieta y la zona circundante' },
          { grit: 'N° 80–100', desc: 'Lijar la masilla seca hasta nivelar con la superficie' },
          { grit: 'N° 120–150', desc: 'Lijado fino antes del esmalte final' },
        ],
        tips: [
          { icon: 'hardware', text: 'Aplicar la masilla con espátula en capas delgadas; no más de 3 mm por capa' },
          { icon: 'schedule', text: 'La masilla poliéster seca en 20-30 min; lijar cuando esté dura al tacto' },
          { icon: 'format_paint', text: 'Aplicar fondo antióxido antes de la masilla para evitar la corrosión bajo ella' },
        ],
      },
      porosa: {
        paint: 'Fondo adherente de alta adherencia + esmalte de acabado',
        paintDesc: 'Para metales con textura rugosa o difícil adhesión, usar wash primer antes del esmalte.',
        primer: 'Wash primer (fondo de alta adherencia)',
        coats: 2,
        sanding: [
          { grit: 'N° 80', desc: 'Desbastar la superficie y reducir la rugosidad' },
          { grit: 'N° 120', desc: 'Alisar antes de la última mano de esmalte' },
        ],
        tips: [
          { icon: 'cleaning_services', text: 'Limpiar con aguarrás o solvente mineral para eliminar grasas y aceites' },
          { icon: 'format_paint', text: 'El wash primer da excelente adherencia en metales difíciles (aluminio, acero inox)' },
        ],
      },
      intemperie: {
        paint: 'Esmalte sintético con fondo antióxido y aditivo UV',
        paintDesc: 'Para metal a la intemperie: esmalte de alta resistencia a la corrosión y rayos UV.',
        primer: 'Fondo antióxido al cromato + anticorrosivo',
        coats: 3,
        sanding: [
          { grit: 'N° 40–60', desc: 'Eliminar óxido y pintura deteriorada' },
          { grit: 'N° 80', desc: 'Alisar antes del fondo antióxido' },
          { grit: 'N° 120', desc: 'Lijar entre capas de esmalte' },
        ],
        tips: [
          { icon: 'wb_sunny', text: 'No pintar bajo lluvia ni con humedad relativa alta (>80%)' },
          { icon: 'repeat', text: 'Controlar cada 1-2 años y repintar al primer signo de óxido' },
          { icon: 'format_paint', text: 'Para piezas muy expuestas, considerar galvanizado en frío + esmalte' },
        ],
      },
    },
  };

  readonly recommendation = computed<Recommendation | null>(() => {
    const surface = this.selectedSurface();
    const condition = this.selectedCondition();
    if (!surface || !condition) return null;
    return this._recos[surface]?.[condition] ?? null;
  });

  readonly selectedSurfaceLabel = computed<string>(
    () => this.surfaces.find(s => s.id === this.selectedSurface())?.label ?? '',
  );

  readonly selectedConditionLabel = computed<string>(
    () => this.conditions.find(c => c.id === this.selectedCondition())?.label ?? '',
  );

  selectSurface(id: string): void {
    this.selectedSurface.set(id);
    this.step.set(2);
  }

  selectCondition(id: string): void {
    this.selectedCondition.set(id);
    this.step.set(3);
  }

  back(): void {
    if (this.step() === 3) {
      this.selectedCondition.set(null);
      this.step.set(2);
    } else if (this.step() === 2) {
      this.selectedSurface.set(null);
      this.step.set(1);
    }
  }

  restart(): void {
    this.selectedSurface.set(null);
    this.selectedCondition.set(null);
    this.step.set(1);
  }
}
